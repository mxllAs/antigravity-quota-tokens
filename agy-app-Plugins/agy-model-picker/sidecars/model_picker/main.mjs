import { readFile, writeFile } from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPickerWidgetScript } from './widget.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]']);
const STATUS_FILE = join(__dirname, 'status.json');

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
    this.scriptId = null;
    this.active = false;
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
const widgetCode = buildPickerWidgetScript();
let lastStatus = '';

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

function handleCdpEvent(client, msg) {
  if (msg.method === 'Runtime.executionContextsCleared') {
    client.active = false;
  }
}

async function attachTarget(target) {
  const client = new CdpClient(
    target.webSocketDebuggerUrl,
    (c, m) => handleCdpEvent(c, m),
    (c) => sessions.delete(c.wsUrl)
  );
  await client.open();
  try {
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    const res = await client.send('Page.addScriptToEvaluateOnNewDocument', { source: widgetCode });
    client.scriptId = res?.identifier || null;
    await client.send('Runtime.evaluate', { expression: widgetCode });
    return client;
  } catch (err) {
    client.close();
    throw err;
  }
}

function checkLsAlive() {
  const lsAddr = process.env.ANTIGRAVITY_LS_ADDRESS;
  if (!lsAddr) return Promise.resolve(true);
  const idx = lsAddr.lastIndexOf(':');
  const host = idx > 0 ? lsAddr.slice(0, idx).replace(/^\[|\]$/g, '') : '';
  const port = idx > 0 ? parseInt(lsAddr.slice(idx + 1), 10) : 0;
  if (!host || !port) return Promise.resolve(true);
  return new Promise((resolve) => {
    const sock = net.createConnection({ host, port });
    const done = (ok) => {
      sock.destroy();
      resolve(ok);
    };
    sock.setTimeout(1000);
    sock.once('connect', () => done(true));
    sock.once('timeout', () => done(false));
    sock.once('error', () => done(false));
  });
}

let ticking = false;
let lsDeadCount = 0;
async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    // Exit cleanly if the parent language_server is gone so orphaned Windows sidecars never accumulate.
    if (!(await checkLsAlive())) {
      lsDeadCount++;
      if (lsDeadCount >= 3) {
        console.log('[agy-model-picker] parent language_server exited, shutting down sidecar');
        await cleanupAndExit();
      }
      return;
    }
    lsDeadCount = 0;

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
          expression: '({ installed: Boolean(window.__agyModelPickerInstalled), hasTrigger: Boolean(document.querySelector("[data-testid=\\"model-selector-trigger\\"]")) })',
        });
        const v = evalRes?.result?.value;
        client.active = Boolean(v?.installed && v?.hasTrigger);
        if (v && !v.installed) {
          await client.send('Runtime.evaluate', { expression: widgetCode });
        }
      } catch {
        client.close();
        sessions.delete(url);
      }
    }

    const anyActive = [...sessions.values()].some((c) => c.active);
    await writeStatus(
      anyActive ? 'active' : sessions.size ? 'connected' : 'waiting-target',
      anyActive ? 'Periodic model picker attached' : 'Waiting for composer model trigger'
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
  for (const client of sessions.values()) {
    try {
      if (client.scriptId) {
        await client.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: client.scriptId });
      }
      await client.send('Runtime.evaluate', { expression: 'window.__agyModelPickerDispose?.()' });
    } catch {}
    client.close();
  }
  process.exit(0);
}

process.on('SIGINT', () => void cleanupAndExit());
process.on('SIGTERM', () => void cleanupAndExit());

void tick();
setInterval(() => void tick(), 3000);
console.log('[agy-model-picker] sidecar injector started');
