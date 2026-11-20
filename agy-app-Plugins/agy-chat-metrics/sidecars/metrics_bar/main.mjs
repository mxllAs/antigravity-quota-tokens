import { readFile, writeFile } from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectChatMetrics } from './collector.mjs';
import { buildWidgetScript } from './widget.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BINDING = '__agyChatMetricsCall';
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]']);
const STATUS_FILE = join(__dirname, 'status.json');
const INSTANCES_FILE = join(__dirname, 'instances.json');
const MY_LS_ADDR = (process.env.ANTIGRAVITY_LS_ADDRESS || '').trim();

function getProfileDir() {
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || join(process.env.USERPROFILE || '', 'AppData', 'Roaming');
    return join(appData, 'Antigravity');
  }
  if (process.platform === 'darwin') {
    return join(process.env.HOME || '', 'Library', 'Application Support', 'Antigravity');
  }
  return join(process.env.HOME || '', '.config', 'Antigravity');
}

function httpGetJson(port, path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, method: 'GET' }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
        if (body.length > 1048576) req.destroy(new Error('Response too large'));
      });
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(2000, () => req.destroy(new Error('Timeout')));
    req.end();
  });
}

function isValidTarget(target, port) {
  try {
    const pageUrl = new URL(target.url);
    const wsUrl = new URL(target.webSocketDebuggerUrl);
    return (
      target.type === 'page' &&
      (pageUrl.protocol === 'http:' || pageUrl.protocol === 'https:') &&
      LOOPBACK.has(pageUrl.hostname) &&
      wsUrl.protocol === 'ws:' &&
      LOOPBACK.has(wsUrl.hostname) &&
      Number(wsUrl.port) === port
    );
  } catch {
    return false;
  }
}

async function discoverTargets() {
  const portFile = join(getProfileDir(), 'DevToolsActivePort');
  const raw = await readFile(portFile, 'utf8');
  const port = Number(raw.split(/\r?\n/)[0]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid DevToolsActivePort');
  }
  const targets = await httpGetJson(port, '/json/list');
  if (!Array.isArray(targets)) return [];
  return targets.filter((t) => isValidTarget(t, port));
}

class CdpClient {
  constructor(wsUrl, onEvent, onClose) {
    this.wsUrl = wsUrl;
    this.onEvent = onEvent;
    this.onClose = onClose;
    this.pending = new Map();
    this.nextId = 0;
    this.closed = false;
    this.contexts = new Set();
    this.scriptId = null;
    this.mounted = false;
  }

  async open() {
    this.ws = new WebSocket(this.wsUrl);
    this.ws.addEventListener('message', (event) => {
      try {
        if (typeof event.data !== 'string' || event.data.length > 2097152) return;
        const msg = JSON.parse(event.data);
        if (msg.id) {
          const item = this.pending.get(msg.id);
          if (!item) return;
          this.pending.delete(msg.id);
          clearTimeout(item.timer);
          if (msg.error) item.reject(new Error(msg.error.message || String(msg.error.code)));
          else item.resolve(msg.result || {});
        } else if (msg.method) {
          this.onEvent(this, msg);
        }
      } catch {}
    });
    this.ws.addEventListener('close', () => this.disconnect());
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.close();
        reject(new Error('WebSocket open timeout'));
      }, 4000);
      this.ws.addEventListener(
        'open',
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true }
      );
      this.ws.addEventListener(
        'error',
        () => {
          clearTimeout(timer);
          this.close();
          reject(new Error('WebSocket open failed'));
        },
        { once: true }
      );
    });
  }

  send(method, params = {}) {
    if (this.closed || this.ws?.readyState !== 1) {
      return Promise.reject(new Error('Socket closed'));
    }
    return new Promise((resolve, reject) => {
      const id = ++this.nextId;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 4000);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  disconnect() {
    if (this.closed) return;
    this.closed = true;
    for (const item of this.pending.values()) {
      clearTimeout(item.timer);
      item.reject(new Error('Disconnected'));
    }
    this.pending.clear();
    this.onClose(this);
  }

  close() {
    this.disconnect();
    try {
      this.ws?.close();
    } catch {}
  }
}

const sessions = new Map();
const widgetCode = buildWidgetScript(BINDING);
let lastStatus = '';
let lsMissCount = 0;
let exiting = false;

function probeTcpPort(addr, timeoutMs = 700) {
  if (!addr) return Promise.resolve(true);
  const sep = addr.lastIndexOf(':');
  if (sep <= 0) return Promise.resolve(false);
  const host = addr.slice(0, sep).replace(/^\[|\]$/g, '');
  const port = parseInt(addr.slice(sep + 1), 10);
  if (!host || !Number.isInteger(port) || port <= 0) return Promise.resolve(false);

  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      try { socket.destroy(); } catch {}
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err?.code === 'EPERM';
  }
}

async function readInstances() {
  try {
    const raw = await readFile(INSTANCES_FILE, 'utf8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function reconcileInstancesOnBoot() {
  const existing = await readInstances();
  const survivors = [];
  for (const item of existing) {
    const pid = Number(item?.pid);
    if (!pid || pid === process.pid || !isPidAlive(pid)) continue;
    const itemLs = String(item?.lsAddr || '').trim();
    const isDuplicate = itemLs === MY_LS_ADDR;
    const isDeadLs = itemLs ? !(await probeTcpPort(itemLs, 400)) : true;
    if (isDuplicate || isDeadLs) {
      try { process.kill(pid, 'SIGTERM'); } catch {}
      continue;
    }
    survivors.push(item);
  }
  survivors.push({ pid: process.pid, lsAddr: MY_LS_ADDR, startedAt: Date.now() });
  try {
    await writeFile(INSTANCES_FILE, JSON.stringify(survivors, null, 2), 'utf8');
  } catch {}
}

async function isSupersededOrDeadLs() {
  if (MY_LS_ADDR) {
    const alive = await probeTcpPort(MY_LS_ADDR, 800);
    if (!alive) {
      lsMissCount += 1;
      if (lsMissCount >= 2) return true;
    } else {
      lsMissCount = 0;
    }
  }
  const list = await readInstances();
  const sameLs = list.filter((x) => String(x?.lsAddr || '').trim() === MY_LS_ADDR && Number(x?.pid) !== process.pid);
  for (const other of sameLs) {
    const opid = Number(other.pid);
    if (isPidAlive(opid) && Number(other.startedAt || 0) > 0) {
      const mine = list.find((x) => Number(x?.pid) === process.pid);
      if (mine && Number(other.startedAt) > Number(mine.startedAt || 0)) {
        return true;
      }
    }
  }
  return false;
}

async function removeSelfFromInstances() {
  const list = await readInstances();
  const filtered = list.filter((x) => Number(x?.pid) !== process.pid);
  try {
    await writeFile(INSTANCES_FILE, JSON.stringify(filtered, null, 2), 'utf8');
  } catch {}
}

async function quietExit() {
  if (exiting) return;
  exiting = true;
  for (const client of sessions.values()) {
    client.close();
  }
  sessions.clear();
  await removeSelfFromInstances();
  process.exit(0);
}

async function writeStatus(state, detail) {
  const key = `${state}:${detail}:${sessions.size}`;
  if (key === lastStatus) return;
  lastStatus = key;
  try {
    await writeFile(
      STATUS_FILE,
      JSON.stringify({ state, detail, windows: sessions.size, updatedAt: new Date().toISOString() }, null, 2),
      'utf8'
    );
  } catch {}
}

async function handleCdpEvent(client, msg) {
  const p = msg.params || {};
  if (msg.method === 'Runtime.executionContextCreated') {
    if (p.context?.auxData?.isDefault) {
      client.contexts.add(p.context.id);
    }
    return;
  }
  if (msg.method === 'Runtime.executionContextsCleared') {
    client.contexts.clear();
    client.mounted = false;
    return;
  }
  if (msg.method === 'Runtime.executionContextDestroyed') {
    client.contexts.delete(p.executionContextId);
    return;
  }
  if (msg.method === 'Runtime.bindingCalled' && p.name === BINDING) {
    let req;
    try {
      req = JSON.parse(p.payload);
    } catch {
      return;
    }
    if (!req || !req.id) return;
    if (MY_LS_ADDR && !(await probeTcpPort(MY_LS_ADDR, 400))) {
      // Never hijack responses if our parent Language Server is dead.
      void quietExit();
      return;
    }
    let result = null;
    try {
      if (req.type === 'metrics') {
        result = await collectChatMetrics(req.payload?.conversationId || null);
      }
    } catch (err) {
      result = { ok: false, error: err?.message || 'collect-error' };
    }
    if (client.closed) return;
    try {
      await client.send('Runtime.evaluate', {
        expression: `window.__agyChatMetricsResolve?.(${Number(req.id)}, ${JSON.stringify(result)})`,
        contextId: p.executionContextId,
      });
    } catch {}
  }
}

async function attachTarget(target) {
  const client = new CdpClient(
    target.webSocketDebuggerUrl,
    (c, m) => void handleCdpEvent(c, m),
    (c) => sessions.delete(c.wsUrl)
  );
  await client.open();
  try {
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Runtime.addBinding', { name: BINDING });
    const res = await client.send('Page.addScriptToEvaluateOnNewDocument', { source: widgetCode });
    client.scriptId = res?.identifier || null;
    await client.send('Runtime.evaluate', { expression: widgetCode });
    return client;
  } catch (err) {
    client.close();
    throw err;
  }
}

let ticking = false;
async function tick() {
  if (ticking || exiting) return;
  ticking = true;
  try {
    if (await isSupersededOrDeadLs()) {
      await quietExit();
      return;
    }

    const targets = await discoverTargets();
    const activeUrls = new Set(targets.map((t) => t.webSocketDebuggerUrl));

    for (const [url, client] of sessions) {
      if (!activeUrls.has(url) || client.closed) {
        client.close();
        sessions.delete(url);
      }
    }

    for (const target of targets) {
      if (!sessions.has(target.webSocketDebuggerUrl)) {
        try {
          const client = await attachTarget(target);
          sessions.set(target.webSocketDebuggerUrl, client);
        } catch {}
      }
    }

    for (const [url, client] of sessions) {
      try {
        const evalRes = await client.send('Runtime.evaluate', {
          returnByValue: true,
          expression: '({ installed: Boolean(window.__agyChatMetricsInstalled), mounted: Boolean(document.querySelector("[data-agy-chat-metrics-bar]")) })',
        });
        const v = evalRes?.result?.value;
        client.mounted = Boolean(v?.mounted);
        if (v && !v.installed) {
          await client.send('Runtime.addBinding', { name: BINDING });
          await client.send('Runtime.evaluate', { expression: widgetCode });
        }
      } catch {
        client.close();
        sessions.delete(url);
      }
    }

    const anyMounted = [...sessions.values()].some((c) => c.mounted);
    await writeStatus(
      anyMounted ? 'mounted' : sessions.size ? 'connected' : 'waiting-target',
      anyMounted ? 'Inline chat metrics mounted' : 'Waiting for composer'
    );
  } catch (err) {
    const missingPort = err?.code === 'ENOENT';
    await writeStatus(
      missingPort ? 'missing-debug-port' : 'reconnecting',
      missingPort
        ? 'Antigravity Desktop was launched without --remote-debugging-port=0'
        : err?.message || 'Waiting for DevToolsActivePort'
    );
  } finally {
    ticking = false;
  }
}

async function cleanupAndExit() {
  if (exiting) return;
  exiting = true;
  for (const client of sessions.values()) {
    try {
      if (client.scriptId) {
        await client.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: client.scriptId });
      }
      await client.send('Runtime.evaluate', { expression: 'window.__agyChatMetricsDispose?.()' });
    } catch {}
    client.close();
  }
  await removeSelfFromInstances();
  process.exit(0);
}

process.on('SIGINT', () => void cleanupAndExit());
process.on('SIGTERM', () => void cleanupAndExit());

(async () => {
  await reconcileInstancesOnBoot();
  void tick();
  setInterval(() => void tick(), 3000);
  console.log('[agy-chat-metrics] sidecar injector started');
})();
