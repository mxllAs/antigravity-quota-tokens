import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTranslatorWidgetScript } from './widget.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATUS_DIR = path.join(os.tmpdir(), 'agy-zh-cn-sidecar');
const STATUS_FILE = path.join(STATUS_DIR, 'status.json');
const INSTANCES_FILE = path.join(STATUS_DIR, 'instances.json');

const MY_LS_ADDR = process.env.ANTIGRAVITY_LS_ADDRESS || '';
const INSTANCE_ID = `${process.pid}-${Date.now()}`;
const STARTED_AT = Date.now();

const TICK_INTERVAL_MS = 3000;
const attachedTargets = new Map(); // targetId -> { cdp, scriptId, wsUrl, title }
let shuttingDown = false;
let mainTimer = null;

function ensureStatusDir() {
  try {
    fs.mkdirSync(STATUS_DIR, { recursive: true });
  } catch {}
}

function writeStatus(extra = {}) {
  ensureStatusDir();
  try {
    const payload = {
      pid: process.pid,
      instanceId: INSTANCE_ID,
      lsAddr: MY_LS_ADDR || null,
      startedAt: new Date(STARTED_AT).toISOString(),
      updatedAt: new Date().toISOString(),
      attachedCount: attachedTargets.size,
      targets: Array.from(attachedTargets.entries()).map(([id, t]) => ({
        id,
        title: t.title || '',
      })),
      ...extra,
    };
    fs.writeFileSync(STATUS_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch {}
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err && err.code === 'EPERM';
  }
}

function parseHostPort(addr) {
  if (!addr || typeof addr !== 'string') return null;
  const cleaned = addr.replace(/^https?:\/\//i, '').trim();
  const lastColon = cleaned.lastIndexOf(':');
  if (lastColon <= 0) return null;
  const host = cleaned.slice(0, lastColon).replace(/^\[|\]$/g, '');
  const port = Number(cleaned.slice(lastColon + 1));
  if (!host || !Number.isInteger(port) || port <= 0 || port > 65535) {
    return null;
  }
  return { host, port };
}

function probeTcpPort(addr, timeoutMs = 800) {
  const parsed = parseHostPort(addr);
  if (!parsed) return Promise.resolve(true);
  return new Promise((resolve) => {
    const socket = net.connect({ host: parsed.host, port: parsed.port });
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {}
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

function readInstances() {
  try {
    const raw = fs.readFileSync(INSTANCES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeInstances(list) {
  ensureStatusDir();
  try {
    fs.writeFileSync(INSTANCES_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch {}
}

function reconcileInstancesOnBoot() {
  const alive = readInstances().filter(
    (item) => item && item.id !== INSTANCE_ID && isPidAlive(item.pid),
  );
  alive.push({
    id: INSTANCE_ID,
    pid: process.pid,
    lsAddr: MY_LS_ADDR,
    startedAt: STARTED_AT,
  });
  writeInstances(alive);
}

function removeSelfFromInstances() {
  const rest = readInstances().filter((item) => item && item.id !== INSTANCE_ID);
  writeInstances(rest);
}

async function isSupersededOrDeadLs() {
  const list = readInstances();
  for (const item of list) {
    if (!item || item.id === INSTANCE_ID) continue;
    if (!isPidAlive(item.pid)) continue;
    if (
      item.lsAddr &&
      item.lsAddr === MY_LS_ADDR &&
      Number(item.startedAt) > STARTED_AT
    ) {
      return 'superseded';
    }
  }
  if (MY_LS_ADDR) {
    const reachable = await probeTcpPort(MY_LS_ADDR);
    if (!reachable) return 'dead-ls';
  }
  return null;
}

function getDevToolsPortFileCandidates() {
  const home = os.homedir();
  const candidates = [];
  if (process.platform === 'win32') {
    const appData =
      process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    candidates.push(path.join(appData, 'Antigravity', 'DevToolsActivePort'));
  } else if (process.platform === 'darwin') {
    candidates.push(
      path.join(
        home,
        'Library',
        'Application Support',
        'Antigravity',
        'DevToolsActivePort',
      ),
    );
  } else {
    const xdg = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
    candidates.push(path.join(xdg, 'Antigravity', 'DevToolsActivePort'));
  }
  return candidates;
}

function readCdpPort() {
  for (const filePath of getDevToolsPortFileCandidates()) {
    try {
      const content = fs.readFileSync(filePath, 'utf8').trim();
      const firstLine = content.split(/\r?\n/)[0]?.trim();
      const port = Number(firstLine);
      if (Number.isInteger(port) && port > 0 && port <= 65535) {
        return port;
      }
    } catch {}
  }
  return null;
}

function fetchJson(url, timeoutMs = 1500) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('timeout', () => {
      req.destroy(new Error('HTTP timeout'));
    });
    req.on('error', reject);
  });
}

function isLoopbackHttpUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    return (
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === 'localhost' ||
      parsed.hostname === '::1' ||
      parsed.hostname === '[::1]'
    );
  } catch {
    return false;
  }
}

async function discoverTargets() {
  const port = readCdpPort();
  if (!port) return { port: null, targets: [] };
  try {
    const list = await fetchJson(`http://127.0.0.1:${port}/json/list`);
    if (!Array.isArray(list)) return { port, targets: [] };
    const targets = list.filter((t) => {
      if (!t || t.type !== 'page') return false;
      if (!t.webSocketDebuggerUrl) return false;
      return isLoopbackHttpUrl(t.url);
    });
    return { port, targets };
  } catch {
    return { port, targets: [] };
  }
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
    this.closed = false;
    this.onClose = null;
  }

  connect(timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
      if (typeof globalThis.WebSocket !== 'function') {
        reject(new Error('Global WebSocket unavailable in this Node runtime'));
        return;
      }

      const ws = new globalThis.WebSocket(this.wsUrl);
      this.ws = ws;
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          try {
            ws.close();
          } catch {}
          reject(new Error('CDP WebSocket connect timeout'));
        }
      }, timeoutMs);

      ws.addEventListener('open', () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      });

      ws.addEventListener('message', (event) => {
        let msg;
        try {
          msg = JSON.parse(String(event.data));
        } catch {
          return;
        }
        if (msg && typeof msg.id === 'number') {
          const entry = this.pending.get(msg.id);
          if (!entry) return;
          this.pending.delete(msg.id);
          clearTimeout(entry.timer);
          if (msg.error) {
            entry.reject(new Error(msg.error.message || 'CDP error'));
          } else {
            entry.resolve(msg.result);
          }
        }
      });

      ws.addEventListener('close', () => {
        this.closed = true;
        clearTimeout(timer);
        for (const [, entry] of this.pending) {
          clearTimeout(entry.timer);
          entry.reject(new Error('CDP connection closed'));
        }
        this.pending.clear();
        if (!settled) {
          settled = true;
          reject(new Error('CDP WebSocket closed before open'));
        }
        if (typeof this.onClose === 'function') {
          this.onClose();
        }
      });

      ws.addEventListener('error', (err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err instanceof Error ? err : new Error('CDP WebSocket error'));
        }
      });
    });
  }

  send(method, params = {}, timeoutMs = 4000) {
    if (this.closed || !this.ws || this.ws.readyState !== 1) {
      return Promise.reject(new Error('CDP WebSocket not open'));
    }
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timer });
      try {
        this.ws.send(JSON.stringify({ id, method, params }));
      } catch (err) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(err);
      }
    });
  }

  close() {
    this.closed = true;
    try {
      this.ws?.close();
    } catch {}
  }
}

async function injectIntoTarget(cdp) {
  const source = buildTranslatorWidgetScript();
  const { identifier } = await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source,
  });
  await cdp.send('Runtime.evaluate', {
    expression: source,
    returnByValue: false,
  });
  return identifier;
}

async function attachTarget(target) {
  const cdp = new CdpClient(target.webSocketDebuggerUrl);
  cdp.onClose = () => {
    attachedTargets.delete(target.id);
    writeStatus();
  };

  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  const scriptId = await injectIntoTarget(cdp);

  attachedTargets.set(target.id, {
    cdp,
    scriptId,
    wsUrl: target.webSocketDebuggerUrl,
    title: target.title || '',
  });
}

async function ensureTargetInjected(targetId, entry) {
  try {
    const res = await entry.cdp.send('Runtime.evaluate', {
      expression: 'Boolean(window.__agyZhCnInstalled)',
      returnByValue: true,
    });
    if (res?.result?.value !== true) {
      const scriptId = await injectIntoTarget(entry.cdp);
      entry.scriptId = scriptId;
    }
  } catch {
    entry.cdp.close();
    attachedTargets.delete(targetId);
  }
}

async function quietExit(reason) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (mainTimer) clearInterval(mainTimer);
  for (const [, entry] of attachedTargets) {
    entry.cdp.close();
  }
  attachedTargets.clear();
  removeSelfFromInstances();
  writeStatus({ state: 'quiet-exit', reason });
  process.exit(0);
}

async function cleanupAndExit() {
  if (shuttingDown) return;
  shuttingDown = true;
  if (mainTimer) clearInterval(mainTimer);

  for (const [, entry] of attachedTargets) {
    try {
      if (entry.scriptId) {
        await entry.cdp.send(
          'Page.removeScriptToEvaluateOnNewDocument',
          { identifier: entry.scriptId },
          1500,
        );
      }
      await entry.cdp.send(
        'Runtime.evaluate',
        {
          expression: 'try { window.__agyZhCnDispose?.(); } catch {}',
          returnByValue: true,
        },
        1500,
      );
    } catch {}
    entry.cdp.close();
  }
  attachedTargets.clear();
  removeSelfFromInstances();
  writeStatus({ state: 'stopped' });
  process.exit(0);
}

async function tick() {
  if (shuttingDown) return;

  const stopReason = await isSupersededOrDeadLs();
  if (stopReason) {
    await quietExit(stopReason);
    return;
  }

  const { port, targets } = await discoverTargets();
  const activeIds = new Set(targets.map((t) => t.id));

  for (const [id, entry] of attachedTargets) {
    if (!activeIds.has(id)) {
      entry.cdp.close();
      attachedTargets.delete(id);
    } else {
      await ensureTargetInjected(id, entry);
    }
  }

  for (const target of targets) {
    if (attachedTargets.has(target.id)) continue;
    try {
      await attachTarget(target);
    } catch {}
  }

  writeStatus({
    state: attachedTargets.size > 0 ? 'active' : 'waiting-cdp',
    cdpPort: port,
  });
}

function main() {
  reconcileInstancesOnBoot();
  writeStatus({ state: 'starting' });

  process.on('SIGINT', () => {
    cleanupAndExit().catch(() => process.exit(0));
  });
  process.on('SIGTERM', () => {
    cleanupAndExit().catch(() => process.exit(0));
  });

  tick().catch((err) => {
    writeStatus({ state: 'error', error: err?.message || String(err) });
  });

  mainTimer = setInterval(() => {
    tick().catch(() => {});
  }, TICK_INTERVAL_MS);
}

main();
