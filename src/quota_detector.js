const { exec } = require('child_process');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

function detectUserAvatar() {
  try {
    const userHome = os.homedir();
    const appData = process.env.APPDATA || path.join(userHome, 'AppData', 'Roaming');
    const candidates = [
      path.join(appData, 'Antigravity', 'User', 'globalStorage', 'state.vscdb'),
      path.join(userHome, '.config', 'Antigravity', 'User', 'globalStorage', 'state.vscdb'),
      path.join(userHome, 'Library', 'Application Support', 'Antigravity', 'User', 'globalStorage', 'state.vscdb'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const buf = fs.readFileSync(p);
        const text = buf.toString('latin1');
        const match = text.match(/https:\/\/lh\d*\.googleusercontent\.com\/[A-Za-z0-9_\-=/]+/);
        if (match) {
          return match[0];
        }
      }
    }
  } catch (e) {}
  return '';
}

let cachedConn = null;
let cachedQuota = null;
let lastQueryTime = 0;

function execCommand(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 4000 }, (err, stdout, stderr) => {
      resolve({ err, stdout: stdout ? stdout.trim() : '', stderr });
    });
  });
}

function queryRpc(port, csrfToken, protocol, endpoint = 'GetUserStatus') {
  const lib = protocol === 'https' ? https : http;
  const body = JSON.stringify({ wrapper_data: {} });

  return new Promise((resolve) => {
    const req = lib.request(
      {
        hostname: '127.0.0.1',
        port: port,
        path: `/exa.language_server_pb.LanguageServerService/${endpoint}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'X-Codeium-Csrf-Token': csrfToken,
          'Connect-Protocol-Version': '1',
        },
        rejectUnauthorized: false,
        timeout: 2500,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode === 200 && data) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
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
    req.write(body);
    req.end();
  });
}

async function listServerCandidates() {
  if (process.platform === 'win32') {
    const psCmd =
      "powershell -NoProfile -Command \"Get-CimInstance Win32_Process | Where-Object { $_.Name -like '*language_server*' -and $_.CommandLine -like '*--csrf_token*' } | Select-Object ProcessId, CommandLine | ConvertTo-Json -Compress\"";
    const { stdout } = await execCommand(psCmd);
    if (!stdout) return [];
    try {
      const parsed = JSON.parse(stdout);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      return arr
        .filter((c) => c && c.ProcessId && c.CommandLine)
        .map((c) => ({ pid: c.ProcessId, cmd: c.CommandLine }));
    } catch (e) {
      return [];
    }
  }

  const { stdout } = await execCommand('pgrep -fa language_server');
  if (!stdout) return [];
  const out = [];
  for (const line of stdout.split('\n')) {
    const m = line.match(/^\s*(\d+)\s+(.*)$/);
    if (m && m[2].includes('--csrf_token')) {
      out.push({ pid: parseInt(m[1], 10), cmd: m[2] });
    }
  }
  return out;
}

async function listListeningPorts(pid) {
  const ports = new Set();
  try {
    if (process.platform === 'win32') {
      const netCmd = `netstat -ano | findstr "LISTENING" | findstr " ${pid}"`;
      const { stdout: netOut } = await execCommand(netCmd);
      if (netOut) {
        for (const line of netOut.split('\n')) {
          const m = line.trim().match(/:(\d+)\s+.*LISTENING/);
          if (m) ports.add(parseInt(m[1], 10));
        }
      }
    } else if (process.platform === 'linux') {
      const { stdout } = await execCommand(
        `ss -ltnp 2>/dev/null | grep "pid=${pid},"`
      );
      if (stdout) {
        for (const line of stdout.split('\n')) {
          const m = line.match(/:(\d+)\s/);
          if (m) ports.add(parseInt(m[1], 10));
        }
      }
    } else {
      const { stdout } = await execCommand(
        `lsof -aPn -iTCP -sTCP:LISTEN -p ${pid} 2>/dev/null`
      );
      if (stdout) {
        for (const line of stdout.split('\n')) {
          const m = line.match(/:(\d+)\s+\(LISTEN\)/);
          if (m) ports.add(parseInt(m[1], 10));
        }
      }
    }
  } catch (e) {
    // Ignore port listing errors
  }
  return ports;
}

async function scanForLanguageServer() {
  const candidates = await listServerCandidates();

  for (const cand of candidates) {
    const cmd = cand.cmd || '';
    const pid = cand.pid;
    if (!pid || !cmd) continue;

    const tokenMatch = cmd.match(/--csrf_token[=\s]+([A-Za-z0-9\-_.=+/]+)/);
    const extPortMatch = cmd.match(/--extension_server_port[=\s]+(\d+)/);
    if (!tokenMatch) continue;

    const csrfToken = tokenMatch[1];
    const extPort = extPortMatch ? parseInt(extPortMatch[1], 10) : 0;

    const ports = new Set();
    if (extPort > 0) {
      ports.add(extPort);
      ports.add(extPort + 1);
      ports.add(extPort + 2);
    }
    for (const p of await listListeningPorts(pid)) ports.add(p);

    const portList = [...ports].filter((p) => p > 0 && p < 65536).slice(0, 25);
    const probes = [];
    for (const port of portList) {
      for (const proto of ['https', 'http']) {
        probes.push(
          queryRpc(port, csrfToken, proto, 'GetUserStatus')
            .then((status) => ({ port, protocol: proto, status }))
            .catch(() => ({ port, protocol: proto, status: null }))
        );
      }
    }
    const settled = await Promise.allSettled(probes);
    for (const r of settled) {
      if (r.status !== 'fulfilled') continue;
      const { port, protocol, status } = r.value;
      if (status && status.userStatus) {
        return {
          port,
          protocol,
          csrfToken,
          pid,
          rawStatus: status.userStatus,
        };
      }
    }
  }

  return null;
}

function parseQuota(status, quotaSummary) {
  if (!status && !quotaSummary) return null;

  const user_name = status?.name || 'User';
  const user_email = status?.email || '';
  const user_avatar = detectUserAvatar() || status?.profileUrl || status?.picture || '';
  const tier_name = status?.userTier?.name || 'Google AI Pro';

  function parseBucketGroup(group) {
    if (!group || !group.buckets) return null;
    let fiveHour = null;
    let weekly = null;

    for (const b of group.buckets) {
      const win = (b.window || '').toLowerCase();
      const name = b.displayName || '';
      const rem = Math.round((b.remainingFraction ?? 1) * 100);
      const used = Math.max(0, 100 - rem);
      const item = {
        remaining_pct: rem,
        used_pct: used,
        reset_time: b.resetTime,
        desc: b.description || '',
      };

      if (
        win === '5h' ||
        /5.*hour/i.test(name) ||
        /5h/i.test(b.bucketId || '')
      ) {
        fiveHour = item;
      } else if (
        win === 'weekly' ||
        /week/i.test(name) ||
        /weekly/i.test(b.bucketId || '')
      ) {
        weekly = item;
      }
    }

    const primary = fiveHour || weekly;
    return {
      five_hour: fiveHour,
      weekly: weekly,
      remaining_pct: primary ? primary.remaining_pct : 100,
      used_pct: primary ? primary.used_pct : 0,
      reset_time: primary ? primary.reset_time : null,
    };
  }

  let geminiSummary = null;
  let claudeSummary = null;

  const groups = quotaSummary?.response?.groups || [];
  for (const g of groups) {
    const dName = g.displayName || '';
    if (/gemini/i.test(dName)) {
      geminiSummary = parseBucketGroup(g);
    } else if (/claude|gpt|3p/i.test(dName)) {
      claudeSummary = parseBucketGroup(g);
    }
  }

  // Fallback if RetrieveUserQuotaSummary was empty
  if (!geminiSummary || !claudeSummary) {
    const configs = status?.cascadeModelConfigData?.clientModelConfigs || [];
    let geminiModel = null;
    let claudeModel = null;

    for (const m of configs) {
      if (!m.quotaInfo) continue;
      const label = m.label || '';
      if (/gemini/i.test(label) && !geminiModel) {
        geminiModel = m;
      } else if (/claude/i.test(label) && !claudeModel) {
        claudeModel = m;
      }
    }

    if (!geminiSummary && geminiModel) {
      const rem = Math.round(
        (geminiModel.quotaInfo.remainingFraction ?? 1) * 100
      );
      const item = {
        remaining_pct: rem,
        used_pct: Math.max(0, 100 - rem),
        reset_time: geminiModel.quotaInfo.resetTime,
      };
      geminiSummary = {
        five_hour: item,
        weekly: null,
        remaining_pct: rem,
        used_pct: Math.max(0, 100 - rem),
        reset_time: geminiModel.quotaInfo.resetTime,
      };
    }

    if (!claudeSummary && claudeModel) {
      const rem = Math.round(
        (claudeModel.quotaInfo.remainingFraction ?? 1) * 100
      );
      const item = {
        remaining_pct: rem,
        used_pct: Math.max(0, 100 - rem),
        reset_time: claudeModel.quotaInfo.resetTime,
      };
      claudeSummary = {
        five_hour: item,
        weekly: null,
        remaining_pct: rem,
        used_pct: Math.max(0, 100 - rem),
        reset_time: claudeModel.quotaInfo.resetTime,
      };
    }
  }

  return {
    is_live: true,
    fetched_at: Date.now(),
    user_name,
    user_email,
    user_avatar,
    tier_name,
    prompt_credits: status?.planStatus?.availablePromptCredits ?? null,
    flow_credits: status?.planStatus?.availableFlowCredits ?? null,
    gemini: geminiSummary
      ? {
          label: 'Gemini 额度池',
          models_hint: '原生 1M 超长上下文 (104.8 万 tokens)',
          context_window: 1048576,
          context_label: '1M',
          active_model: 'Gemini 3.8 Flash',
          ...geminiSummary,
        }
      : null,
    claude: claudeSummary
      ? {
          label: 'Claude & GPT 额度池',
          models_hint: 'Claude 200k 上下文 · GPT-OSS 128k 上下文',
          context_window: 200000,
          context_label: '200k',
          active_model: 'Claude Opus 4.6',
          ...claudeSummary,
        }
      : null,
  };
}

async function fetchLiveQuotaFromConn(conn) {
  try {
    const [rawStatus, rawSummary] = await Promise.all([
      queryRpc(conn.port, conn.csrfToken, conn.protocol, 'GetUserStatus'),
      queryRpc(
        conn.port,
        conn.csrfToken,
        conn.protocol,
        'RetrieveUserQuotaSummary'
      ),
    ]);
    if (rawStatus && rawStatus.userStatus) {
      return parseQuota(rawStatus.userStatus, rawSummary);
    }
  } catch (e) {}
  return null;
}

async function getLiveQuota(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedQuota && now - lastQueryTime < 15000) {
    return cachedQuota;
  }

  // Invalidate cache if forceRefresh
  if (forceRefresh) {
    cachedConn = null;
    cachedQuota = null;
  } else if (cachedConn) {
    const q = await fetchLiveQuotaFromConn(cachedConn);
    if (q) {
      cachedQuota = q;
      lastQueryTime = now;
      return cachedQuota;
    }
    cachedConn = null;
  }

  // Scan for language server
  try {
    const conn = await scanForLanguageServer();
    if (conn) {
      cachedConn = {
        port: conn.port,
        protocol: conn.protocol,
        csrfToken: conn.csrfToken,
        pid: conn.pid,
      };
      const q = await fetchLiveQuotaFromConn(cachedConn);
      if (q) {
        cachedQuota = q;
        lastQueryTime = now;
        return cachedQuota;
      }
    }
  } catch (e) {
    // Scanning failure
  }

  return null;
}

module.exports = {
  getLiveQuota,
};
