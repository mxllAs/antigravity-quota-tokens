import { readFile, writeFile } from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = join(__dirname, 'cache.json');
const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MODEL_ALIASES = {
  MODEL_PLACEHOLDER_M532: 'Gemini 4 Neon (High)',
  MODEL_PLACEHOLDER_M533: 'Gemini 4 Neon (Medium)',
  MODEL_PLACEHOLDER_M534: 'Gemini 4 Neon (Low)',
  MODEL_PLACEHOLDER_M535: 'Gemini 4 Neon (XHigh)',
  MODEL_PLACEHOLDER_M537: 'Orchestrator (Neon)',
  MODEL_PLACEHOLDER_M525: 'Gemini 4 Hydrogen (High)',
  MODEL_PLACEHOLDER_M526: 'Gemini 4 Hydrogen (Medium)',
  MODEL_PLACEHOLDER_M527: 'Gemini 4 Hydrogen (Low)',
  MODEL_PLACEHOLDER_M528: 'Gemini 4 Hydrogen (XHigh)',
  MODEL_PLACEHOLDER_M530: 'Gemini 4 Hydrogen (High)',
  MODEL_PLACEHOLDER_M531: 'Gemini 4 Hydrogen (XHigh)',
  MODEL_PLACEHOLDER_M417: 'Gemini 4 Argon (High)',
  MODEL_PLACEHOLDER_M418: 'Gemini 4 Argon (Medium)',
  MODEL_PLACEHOLDER_M419: 'Gemini 4 Argon (Low)',
  MODEL_PLACEHOLDER_M427: 'Gemini 4 Carbon (High)',
  MODEL_PLACEHOLDER_M437: 'Gemini 4 Carbon (Medium)',
  MODEL_PLACEHOLDER_M438: 'Gemini 4 Carbon (Low)',
  MODEL_PLACEHOLDER_M667: 'Orchestrator (Carbon)',
  MODEL_PLACEHOLDER_M668: 'Orchestrator (Argon)',
  MODEL_PLACEHOLDER_M669: 'Gemini 4 Hydrogen (Orchestrator)',
  MODEL_PLACEHOLDER_M681: 'Orchestrator (Argon)',
  MODEL_PLACEHOLDER_M318: 'Gemini 3.8 Flash (High)',
  MODEL_PLACEHOLDER_M319: 'Gemini 3.8 Flash (Medium)',
  MODEL_PLACEHOLDER_M320: 'Gemini 3.8 Flash (Low)',
  MODEL_PLACEHOLDER_M26: 'Claude Opus 4.6',
  MODEL_PLACEHOLDER_M35: 'Claude Sonnet 4.6',
  MODEL_PLACEHOLDER_M400: 'Claude Opus 5.5',
  MODEL_PLACEHOLDER_M401: 'Claude Opus 5.5',
  MODEL_PLACEHOLDER_M402: 'Claude Opus 5.5',
  MODEL_PLACEHOLDER_M403: 'Claude Sonnet 5.5',
  MODEL_PLACEHOLDER_M404: 'Claude Sonnet 5.5',
  MODEL_PLACEHOLDER_M405: 'Claude Sonnet 5.5',
  MODEL_OPENAI_GPT_OSS_120B_MEDIUM: 'GPT-OSS 120B',
};

function formatModelName(raw, catalog = null) {
  if (!raw || typeof raw !== 'string') return '';
  if (MODEL_ALIASES[raw]) return MODEL_ALIASES[raw];
  if (catalog && catalog.has(raw) && catalog.get(raw).displayName) {
    return catalog.get(raw).displayName;
  }
  const lower = raw.toLowerCase();
  if (lower.includes('orchestrator') && lower.includes('neon')) return 'Orchestrator (Neon)';
  if (lower.includes('orchestrator') && lower.includes('carbon')) return 'Orchestrator (Carbon)';
  if (lower.includes('orchestrator') && lower.includes('argon')) return 'Orchestrator (Argon)';
  if (lower.includes('neon')) return 'Gemini 4 Neon';
  if (lower.includes('hydrogen')) return 'Gemini 4 Hydrogen';
  if (lower.includes('carbon')) return 'Gemini 4 Carbon';
  if (lower.includes('argon')) return 'Gemini 4 Argon';
  if (lower.includes('3.8-flash') || lower.includes('3_8_flash')) return 'Gemini 3.8 Flash';
  if (lower.includes('claude')) return raw.replace(/^model[-_]/i, '').replace(/[-_]/g, ' ');
  return raw;
}

function parseSeconds(val) {
  if (typeof val === 'number') return Number.isFinite(val) && val >= 0 ? val : null;
  if (typeof val === 'string' && /^\d+(?:\.\d+)?s$/.test(val)) {
    const n = Number(val.slice(0, -1));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  if (val && typeof val === 'object') {
    const s = Number(val.seconds ?? 0);
    const ns = Number(val.nanos ?? 0);
    const n = s + ns / 1e9;
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  return null;
}

function parseNum(val) {
  if (typeof val === 'number') return Number.isFinite(val) && val >= 0 ? val : null;
  if (typeof val === 'string' && /^\d+$/.test(val)) return Number(val);
  return null;
}

let preferredProtocol = 'http';

function callLsRpc(method, bodyObj = {}, timeoutMs = 2500) {
  const lsAddr = process.env.ANTIGRAVITY_LS_ADDRESS;
  const csrf = process.env.ANTIGRAVITY_CSRF_TOKEN;
  if (!lsAddr || !csrf) return Promise.resolve(null);

  const [host, portStr] = lsAddr.split(':');
  const port = parseInt(portStr, 10);
  if (!host || !port) return Promise.resolve(null);

  const tryProto = (proto) =>
    new Promise((resolve) => {
      const client = proto === 'https' ? https : http;
      const payload = JSON.stringify(bodyObj);
      const req = client.request(
        {
          hostname: host,
          port,
          path: `/exa.language_server_pb.LanguageServerService/${method}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Connect-Protocol-Version': '1',
            'x-codeium-csrf-token': csrf,
            'Content-Length': Buffer.byteLength(payload),
          },
          rejectUnauthorized: false,
          timeout: timeoutMs,
        },
        (res) => {
          let raw = '';
          res.on('data', (chunk) => (raw += chunk));
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                resolve(JSON.parse(raw));
              } catch {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          });
        }
      );
      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
      req.write(payload);
      req.end();
    });

  return tryProto(preferredProtocol).then(async (res) => {
    if (res) return res;
    const alt = preferredProtocol === 'http' ? 'https' : 'http';
    const altRes = await tryProto(alt);
    if (altRes) preferredProtocol = alt;
    return altRes;
  });
}

let cachedQuota = null;
let cachedQuotaAt = 0;

async function fetchQuotaCompact() {
  const now = Date.now();
  if (cachedQuota && now - cachedQuotaAt < 30000) return cachedQuota;
  const raw = await callLsRpc('RetrieveUserQuotaSummary', {});
  const groups = raw?.response?.groups || raw?.groups;
  if (!Array.isArray(groups)) return cachedQuota;

  const out = [];
  for (const g of groups) {
    const name = g.displayName || '';
    const buckets = Array.isArray(g.buckets) ? g.buckets : [];
    const five = buckets.find((b) => b.window === '5h' || /5h/i.test(b.bucketId || ''));
    const week = buckets.find((b) => b.window === 'weekly' || /weekly/i.test(b.bucketId || ''));
    out.push({
      name,
      fivePct: five && typeof five.remainingFraction === 'number' ? Math.round(five.remainingFraction * 100) : null,
      fiveReset: five?.resetTime || null,
      weekPct: week && typeof week.remainingFraction === 'number' ? Math.round(week.remainingFraction * 100) : null,
      weekReset: week?.resetTime || null,
    });
  }
  cachedQuota = out;
  cachedQuotaAt = now;
  return cachedQuota;
}

let cachedModelCatalog = null;
let cachedModelCatalogAt = 0;

async function fetchModelCatalog() {
  const now = Date.now();
  if (cachedModelCatalog && now - cachedModelCatalogAt < 60000) return cachedModelCatalog;
  const raw = await callLsRpc('GetAvailableModels', {});
  const models = raw?.response?.models || raw?.models;
  if (!models || typeof models !== 'object') return cachedModelCatalog || new Map();

  const map = new Map();
  for (const [slug, info] of Object.entries(models)) {
    if (!info || typeof info !== 'object') continue;
    const maxTokens = typeof info.maxTokens === 'number' && info.maxTokens > 0 ? info.maxTokens : null;
    const entry = {
      slug,
      enumId: info.model || '',
      displayName: info.displayName || '',
      maxTokens,
    };
    map.set(slug, entry);
    if (entry.enumId) map.set(entry.enumId, entry);
  }
  cachedModelCatalog = map;
  cachedModelCatalogAt = now;
  return cachedModelCatalog;
}

function resolveModelMaxTokens(rawCandidates, modelDisplay, catalog, compactionFallback) {
  for (const cand of rawCandidates) {
    if (!cand) continue;
    const hit = catalog?.get(cand);
    if (hit && hit.maxTokens) return hit.maxTokens;
  }
  const lower = (modelDisplay || rawCandidates.join(' ')).toLowerCase();
  if (/gemini\s*[34]|hydrogen|neon|argon|carbon|orchestrator/i.test(lower)) return 1048576;
  if (/claude.*5\.5/i.test(lower)) return 1000000;
  if (/gpt-oss-120b/i.test(lower)) return 131072;
  return compactionFallback || null;
}

async function resolveFallbackConversationId() {
  const all = await callLsRpc('GetAllCascadeTrajectories', {});
  const summaries = all?.trajectorySummaries;
  if (!summaries || typeof summaries !== 'object') return null;
  let bestId = null;
  let bestTime = -1;
  for (const [id, info] of Object.entries(summaries)) {
    if (!GUID_RE.test(id)) continue;
    const t = Date.parse(info?.lastModifiedTime || '') || 0;
    const isRunning = /RUNNING/i.test(String(info?.status || ''));
    const score = isRunning ? t + 1e12 : t;
    if (score > bestTime) {
      bestTime = score;
      bestId = id;
    }
  }
  return bestId;
}

const lastMetricsByCid = new Map();
let diskCacheLoaded = false;
let lastDiskWriteAt = 0;

async function ensureDiskCacheLoaded() {
  if (diskCacheLoaded) return;
  diskCacheLoaded = true;
  try {
    const raw = await readFile(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const now = Date.now();
    if (parsed && typeof parsed === 'object') {
      for (const [id, entry] of Object.entries(parsed)) {
        if (GUID_RE.test(id) && entry?.data?.ok && now - (entry.at || 0) < 86400000) {
          lastMetricsByCid.set(id, entry);
        }
      }
    }
  } catch {}
}

function saveMetricsToCache(cid, data) {
  lastMetricsByCid.set(cid, { data, at: Date.now() });
  // Cap map size to 20 recent conversations
  if (lastMetricsByCid.size > 20) {
    const oldestKey = lastMetricsByCid.keys().next().value;
    if (oldestKey) lastMetricsByCid.delete(oldestKey);
  }
  const now = Date.now();
  if (now - lastDiskWriteAt < 3000) return;
  lastDiskWriteAt = now;
  const obj = Object.fromEntries(lastMetricsByCid.entries());
  writeFile(CACHE_FILE, JSON.stringify(obj), 'utf8').catch(() => {});
}

export async function collectChatMetrics(conversationId = null) {
  await ensureDiskCacheLoaded();
  let cid = conversationId && GUID_RE.test(conversationId) ? conversationId : null;
  if (!cid) {
    cid = await resolveFallbackConversationId();
  }
  if (!cid) {
    return { ok: false, error: 'no-conversation', context: null, speed: null, quota: null };
  }

  const [trajRes, quota, catalog] = await Promise.all([
    callLsRpc('GetCascadeTrajectory', { cascadeId: cid }),
    fetchQuotaCompact(),
    fetchModelCatalog(),
  ]);

  const traj = trajRes?.trajectory;
  if (!traj) {
    if (lastMetricsByCid.has(cid)) {
      const cached = lastMetricsByCid.get(cid).data;
      return { ...cached, isRunning: false, isCached: true, quota: quota || cached.quota };
    }
    return { ok: false, conversationId: cid, error: 'trajectory-unavailable', context: null, speed: null, quota };
  }

  const generators = Array.isArray(traj.generatorMetadata) ? traj.generatorMetadata : [];
  const steps = Array.isArray(traj.steps) ? traj.steps : [];

  let validTokensSum = 0;
  let validSecondsSum = 0;
  let validSamples = 0;
  let peakTps = null;
  let latestValidTps = null;
  let latestModel = '';
  let ttftSum = 0;
  let ttftCount = 0;
  let totalRespTokens = 0;
  let totalThinkTokens = 0;
  let totalInputTokens = 0;
  let totalCacheReadTokens = 0;

  for (const g of generators) {
    const cm = g?.chatModel;
    if (!cm) continue;

    const modelRaw = cm.modelDisplayName || cm.responseModel || String(cm.model || cm.usage?.model || '');
    if (modelRaw) latestModel = formatModelName(modelRaw, catalog);

    const usage = cm.usage;
    if (!usage) continue;

    const inp = parseNum(usage.inputTokens) ?? 0;
    const cacheRead = parseNum(usage.cacheReadTokens) ?? 0;
    const out = parseNum(usage.outputTokens);
    const resp = parseNum(usage.responseOutputTokens);
    const think = parseNum(usage.thinkingOutputTokens) ?? 0;

    const effectiveResp =
      resp !== null ? resp : out !== null ? Math.max(0, out - think) : null;

    totalInputTokens += inp;
    totalCacheReadTokens += cacheRead;
    if (effectiveResp !== null) totalRespTokens += effectiveResp;
    totalThinkTokens += think;

    const ttft = parseSeconds(cm.timeToFirstToken);
    if (ttft !== null && ttft > 0 && ttft < 300) {
      ttftSum += ttft;
      ttftCount++;
    }

    const dur = parseSeconds(cm.streamingDuration);
    const tokenForSpeed = effectiveResp && effectiveResp > 0 ? effectiveResp : out;

    if (dur !== null && dur >= 0.35 && tokenForSpeed !== null && tokenForSpeed > 0) {
      const tps = tokenForSpeed / dur;
      if (Number.isFinite(tps) && tps > 0 && tps <= 2000) {
        validTokensSum += tokenForSpeed;
        validSecondsSum += dur;
        validSamples++;
        latestValidTps = tps;
        if (peakTps === null || tps > peakTps) peakTps = tps;
      }
    }
  }

  const sessionTps = validSecondsSum > 0 ? validTokensSum / validSecondsSum : null;
  const displayTps = latestValidTps ?? sessionTps;

  let context = null;
  for (let i = generators.length - 1; i >= 0; i--) {
    const cm = generators[i]?.chatModel;
    const cwm = cm?.chatStartMetadata?.contextWindowMetadata;
    if (cwm && typeof cwm.estimatedTokensUsed === 'number') {
      const used = cwm.estimatedTokensUsed;
      const compactionTokens =
        typeof cwm.maxContextTokens === 'number' && cwm.maxContextTokens > 0
          ? cwm.maxContextTokens
          : null;
      const rawCandidates = [
        cm.responseModel,
        String(cm.model || ''),
        cm.usage?.model,
        cm.modelDisplayName,
      ];
      const modelDisplay =
        formatModelName(
          cm.modelDisplayName || cm.responseModel || String(cm.model || ''),
          catalog
        ) || latestModel;
      const maxTokens = resolveModelMaxTokens(
        rawCandidates,
        modelDisplay,
        catalog,
        compactionTokens
      );
      const usedPct = maxTokens ? Math.min(100, Math.max(0, (used / maxTokens) * 100)) : null;
      const compactionPct =
        compactionTokens && maxTokens && compactionTokens <= maxTokens
          ? Math.min(100, Math.max(0, (compactionTokens / maxTokens) * 100))
          : null;
      const toCompactionTokens =
        compactionTokens !== null ? Math.max(0, compactionTokens - used) : null;
      const compactionRatio = compactionTokens ? used / compactionTokens : null;

      context = {
        usedTokens: used,
        maxTokens,
        compactionTokens,
        compactionPct,
        toCompactionTokens,
        compactionRatio,
        remainingTokens: maxTokens !== null ? Math.max(0, maxTokens - used) : null,
        usedPct,
        model: modelDisplay,
      };
      break;
    }
  }

  const isRunning = /RUNNING/i.test(String(trajRes?.status || ''));
  const totalInputAll = totalInputTokens + totalCacheReadTokens;
  const cacheHitRate = totalInputAll > 0 ? (totalCacheReadTokens / totalInputAll) * 100 : null;

  const out = {
    ok: true,
    conversationId: cid,
    status: trajRes?.status || null,
    isRunning,
    rounds: steps.filter((s) => /USER_INPUT/.test(String(s?.type || ''))).length,
    context,
    speed: {
      displayTps,
      latestTps: latestValidTps,
      sessionTps,
      peakTps,
      avgTtft: ttftCount > 0 ? ttftSum / ttftCount : null,
      validSamples,
      totalRequests: generators.filter((g) => g?.chatModel?.usage).length,
      responseTokens: totalRespTokens,
      thinkingTokens: totalThinkTokens,
      cacheHitRate,
      model: latestModel,
    },
    quota,
  };
  saveMetricsToCache(cid, out);
  return out;
}
