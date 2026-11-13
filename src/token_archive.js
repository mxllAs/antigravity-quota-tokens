const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Default archive structure
 */
function getDefaultArchive() {
  return {
    version: 1,
    updated_at: new Date().toISOString(),
    client_info: {
      ide: 'Google Antigravity',
      plugin_version: '1.2.0',
    },
    summary: {
      all_time_tokens: 0,
      total_turns: 0,
      total_sessions: 0,
    },
    daily_map: {},
    projects: {},
    sessions: {},
  };
}

/**
 * Resolves the absolute path to token_history_archive.json
 * @param {string} [customStorageDir] directory provided by context.globalStorageUri.fsPath
 * @returns {string} absolute path
 */
function getArchivePath(customStorageDir) {
  let targetDir = customStorageDir;
  if (!targetDir) {
    const userHome = os.homedir();
    targetDir = path.join(userHome, '.gemini', 'antigravity-quota-tokens');
  }

  if (!fs.existsSync(targetDir)) {
    try {
      fs.mkdirSync(targetDir, { recursive: true });
    } catch (e) {
      console.warn('Failed to create storage directory:', e.message);
    }
  }

  return path.join(targetDir, 'token_history_archive.json');
}

/**
 * Safely loads archive from disk
 * @param {string} archivePath
 * @returns {object} archive object
 */
function loadArchive(archivePath) {
  if (!archivePath || !fs.existsSync(archivePath)) {
    return getDefaultArchive();
  }

  try {
    const content = fs.readFileSync(archivePath, 'utf8');
    if (!content || !content.trim()) {
      return getDefaultArchive();
    }
    const data = JSON.parse(content);
    if (!data.sessions || typeof data.sessions !== 'object') {
      data.sessions = {};
    }
    if (!data.daily_map || typeof data.daily_map !== 'object') {
      data.daily_map = {};
    }
    if (!data.summary || typeof data.summary !== 'object') {
      data.summary = { all_time_tokens: 0, total_turns: 0, total_sessions: 0 };
    }
    return data;
  } catch (err) {
    console.error('Error reading token archive, restoring default:', err);
    try {
      // Backup corrupted file
      fs.copyFileSync(archivePath, archivePath + '.corrupted.bak');
    } catch (e) {}
    return getDefaultArchive();
  }
}

/**
 * Safely saves archive to disk
 * @param {string} archivePath
 * @param {object} archive
 */
function saveArchive(archivePath, archive) {
  if (!archivePath) return false;
  try {
    const targetDir = path.dirname(archivePath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    archive.updated_at = new Date().toISOString();
    const jsonStr = JSON.stringify(archive, null, 2);
    const tmpPath = archivePath + '.tmp';
    fs.writeFileSync(tmpPath, jsonStr, 'utf8');
    fs.renameSync(tmpPath, archivePath);
    return true;
  } catch (err) {
    console.error('Error saving token archive:', err);
    try {
      fs.writeFileSync(archivePath, JSON.stringify(archive), 'utf8');
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Merges raw scan result from token_collector.py with the persistent archive.
 * Guarantees that deleted sessions/projects are permanently retained in history,
 * heatmaps, all-time totals, and project statistics.
 *
 * @param {object|null} scanResult Output from token_collector.py
 * @param {string} archivePath Path to token_history_archive.json
 * @param {string} [targetDate] Date string in YYYY-MM-DD
 * @returns {object} fully merged tokens dataset for extension and webview
 */
function mergeScanWithArchive(scanResult, archivePath, targetDate) {
  if (!targetDate) {
    targetDate = new Date().toISOString().slice(0, 10);
  }

  const archive = loadArchive(archivePath);
  const scannedSessionIds = new Set();
  const cutoffSec = Math.floor(Date.now() / 1000) - 15 * 86400;
  const pruneRecent = (list) =>
    Array.isArray(list) ? list.filter((e) => e && (e.t || 0) >= cutoffSec) : [];

  // 1. Process scanned sessions from existing DBs
  if (scanResult && Array.isArray(scanResult.projects)) {
    for (const proj of scanResult.projects) {
      const pName = proj.name || 'General';
      const items = Array.isArray(proj.session_items) ? proj.session_items : [];

      for (const sess of items) {
        const fullId = sess.full_id || sess.id;
        if (!fullId) continue;

        scannedSessionIds.add(fullId);

        const existing = archive.sessions[fullId];
        if (existing) {
          // Update session metadata while keeping history
          existing.title = sess.title || existing.title || '';
          existing.project = pName;
          existing.date = sess.date || existing.date;
          existing.model = sess.model || existing.model;
          existing.model_id = sess.model_id || existing.model_id;
          existing.context_window = sess.context_window || existing.context_window;
          existing.context_label = sess.context_label || existing.context_label;
          existing.context_pct = sess.context_pct != null ? sess.context_pct : existing.context_pct;
          existing.context_tokens = sess.context_tokens != null ? sess.context_tokens : existing.context_tokens;
          existing.mtime = sess.mtime || existing.mtime;
          existing.is_deleted_locally = false;

          // If current scan has higher tokens or latest turns, update
          if ((sess.total_tokens || 0) >= (existing.total_tokens || 0)) {
            existing.total_tokens = sess.total_tokens || 0;
            existing.input_tokens = sess.input_tokens || 0;
            existing.cached_tokens = sess.cached_tokens || 0;
            existing.output_tokens = sess.output_tokens || 0;
            existing.thinking_tokens = sess.thinking_tokens || 0;
            existing.turns = sess.turns || 0;
          }

          // Merge daily breakdown
          if (sess.daily && typeof sess.daily === 'object') {
            if (!existing.daily) existing.daily = {};
            for (const [d, dVal] of Object.entries(sess.daily)) {
              existing.daily[d] = dVal;
            }
          }

          if (Array.isArray(sess.recent_model_usage)) {
            existing.recent_model_usage = pruneRecent(sess.recent_model_usage);
          }
        } else {
          // New session discovered
          archive.sessions[fullId] = {
            id: sess.id || fullId.slice(0, 8),
            full_id: fullId,
            title: sess.title || '',
            project: pName,
            date: sess.date || targetDate,
            model: sess.model || 'Gemini 3.8 Flash',
            model_id: sess.model_id || 'gemini-3.8-flash-high',
            context_window: sess.context_window || 1048576,
            context_label: sess.context_label || '1M',
            context_pct: sess.context_pct || 0,
            context_tokens: sess.context_tokens || 0,
            total_tokens: sess.total_tokens || 0,
            input_tokens: sess.input_tokens || 0,
            cached_tokens: sess.cached_tokens || 0,
            output_tokens: sess.output_tokens || 0,
            thinking_tokens: sess.thinking_tokens || 0,
            turns: sess.turns || 0,
            daily: sess.daily ? { ...sess.daily } : { [sess.date || targetDate]: {
              total: sess.total_tokens || 0,
              input: sess.input_tokens || 0,
              cached: sess.cached_tokens || 0,
              output: sess.output_tokens || 0,
              thinking: sess.thinking_tokens || 0,
              turns: sess.turns || 0,
            } },
            recent_model_usage: pruneRecent(sess.recent_model_usage),
            mtime: sess.mtime || Math.floor(Date.now() / 1000),
            is_deleted_locally: false,
          };
        }
      }
    }
  }

  // 2. Mark sessions not present on disk as locally deleted (preserves archive!)
  if (scanResult) {
    for (const [id, s] of Object.entries(archive.sessions)) {
      if (!scannedSessionIds.has(id)) {
        s.is_deleted_locally = true;
      }
    }
  }

  // 3. Re-aggregate daily_map, projects, recent model timeline, and summary from ALL archive sessions
  const dailyMap = {};
  const projectsMap = {};
  const recentModelMap = new Map();
  let allTimeTokens = 0;
  let totalTurns = 0;
  let totalSessions = 0;

  for (const [sId, s] of Object.entries(archive.sessions)) {
    totalSessions++;
    const sTotal = s.total_tokens || 0;
    const sInput = s.input_tokens || 0;
    const sCached = s.cached_tokens || 0;
    const sOutput = s.output_tokens || 0;
    const sThinking = s.thinking_tokens || 0;
    const sTurns = s.turns || 0;

    allTimeTokens += sTotal;
    totalTurns += sTurns;

    if (Array.isArray(s.recent_model_usage) && s.recent_model_usage.length > 0) {
      s.recent_model_usage = pruneRecent(s.recent_model_usage);
      for (const item of s.recent_model_usage) {
        if (!item || !item.m) continue;
        const key = `${item.t}|${item.m}`;
        let bucket = recentModelMap.get(key);
        if (!bucket) {
          bucket = { t: item.t, m: item.m, tot: 0, in: 0, ca: 0, out: 0, th: 0, n: 0 };
          recentModelMap.set(key, bucket);
        }
        bucket.tot += item.tot || 0;
        bucket.in += item.in || 0;
        bucket.ca += item.ca || 0;
        bucket.out += item.out || 0;
        bucket.th += item.th || 0;
        bucket.n += item.n || 0;
      }
    }

    // Aggregate by project
    const pName = s.project || 'General';
    if (!projectsMap[pName]) {
      projectsMap[pName] = {
        name: pName,
        total_tokens: 0,
        input_tokens: 0,
        cached_tokens: 0,
        output_tokens: 0,
        thinking_tokens: 0,
        sessions: 0,
        active_sessions: 0,
        is_archived: true,
        session_items: [],
      };
    }

    const pEntry = projectsMap[pName];
    pEntry.total_tokens += sTotal;
    pEntry.input_tokens += sInput;
    pEntry.cached_tokens += sCached;
    pEntry.output_tokens += sOutput;
    pEntry.thinking_tokens += sThinking;
    pEntry.sessions++;
    if (!s.is_deleted_locally) {
      pEntry.active_sessions++;
      pEntry.is_archived = false;
    }
    pEntry.session_items.push({
      id: s.id || sId.slice(0, 8),
      full_id: s.full_id || sId,
      title: s.title || '',
      date: s.date || '',
      project: pName,
      model: s.model || 'Gemini 3.8 Flash',
      model_id: s.model_id || 'gemini-3.8-flash-high',
      context_window: s.context_window || 1048576,
      context_label: s.context_label || '1M',
      context_pct: s.context_pct || 0,
      context_tokens: s.context_tokens || 0,
      total_tokens: sTotal,
      input_tokens: sInput,
      cached_tokens: sCached,
      output_tokens: sOutput,
      thinking_tokens: sThinking,
      turns: sTurns,
      mtime: s.mtime || 0,
      is_deleted_locally: !!s.is_deleted_locally,
    });

    // Aggregate by day for heatmap
    if (s.daily && typeof s.daily === 'object') {
      for (const [d, dData] of Object.entries(s.daily)) {
        if (!dailyMap[d]) {
          dailyMap[d] = {
            date: d,
            total: 0,
            input: 0,
            cached: 0,
            output: 0,
            thinking: 0,
            turns: 0,
          };
        }
        const dm = dailyMap[d];
        dm.total += (dData.total || 0);
        dm.input += (dData.input || 0);
        dm.cached += (dData.cached || 0);
        dm.output += (dData.output || 0);
        dm.thinking += (dData.thinking || 0);
        dm.turns += (dData.turns || 0);
      }
    } else if (s.date) {
      const d = s.date;
      if (!dailyMap[d]) {
        dailyMap[d] = {
          date: d,
          total: 0,
          input: 0,
          cached: 0,
          output: 0,
          thinking: 0,
          turns: 0,
        };
      }
      const dm = dailyMap[d];
      dm.total += sTotal;
      dm.input += sInput;
      dm.cached += sCached;
      dm.output += sOutput;
      dm.thinking += sThinking;
      dm.turns += sTurns;
    }
  }

  // 4. Sort project session items & projects list
  const mergedProjects = Object.values(projectsMap).map((p) => {
    p.session_items.sort((a, b) => (b.total_tokens || 0) - (a.total_tokens || 0));
    return p;
  });
  mergedProjects.sort((a, b) => (b.total_tokens || 0) - (a.total_tokens || 0));

  // 5. Sorted all_daily list for GitHub Heatmap
  const allDaily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  // 6. Today's aggregated summary
  const todayEntry = dailyMap[targetDate] || {
    total: 0,
    input: 0,
    cached: 0,
    output: 0,
    thinking: 0,
    turns: 0,
  };
  const promptTotal = (todayEntry.input || 0) + (todayEntry.cached || 0);
  const cacheHitRate = promptTotal > 0
    ? Number(((todayEntry.cached / promptTotal) * 100).toFixed(1))
    : 0.0;

  // Count active sessions today
  let todaySessions = 0;
  for (const s of Object.values(archive.sessions)) {
    if (s.daily && s.daily[targetDate]) {
      todaySessions++;
    } else if (s.date === targetDate) {
      todaySessions++;
    }
  }

  const mergedToday = {
    date: targetDate,
    total_tokens: todayEntry.total,
    input_tokens: todayEntry.input,
    cached_tokens: todayEntry.cached,
    output_tokens: todayEntry.output,
    thinking_tokens: todayEntry.thinking,
    cache_hit_rate: cacheHitRate,
    sessions: todaySessions,
    turns: todayEntry.turns,
  };

  // 7. Update archive summary & projects and save to disk
  archive.projects = {};
  for (const [pName, pEntry] of Object.entries(projectsMap)) {
    archive.projects[pName] = {
      name: pName,
      total_tokens: pEntry.total_tokens,
      input_tokens: pEntry.input_tokens,
      cached_tokens: pEntry.cached_tokens,
      output_tokens: pEntry.output_tokens,
      thinking_tokens: pEntry.thinking_tokens,
      sessions_count: pEntry.sessions,
      active_sessions_count: pEntry.active_sessions,
      is_archived: pEntry.active_sessions === 0,
    };
  }

  archive.summary = {
    all_time_tokens: allTimeTokens,
    total_turns: totalTurns,
    total_sessions: totalSessions,
  };
  archive.daily_map = dailyMap;
  saveArchive(archivePath, archive);

  // 8. For IDE UI list (Option A): Only return active projects and active sessions.
  // Cleaned projects and sessions remain permanently archived in token_history_archive.json,
  // the 24-week heatmap, and the all-time totals, but are hidden from the active IDE list.
  const activeProjects = mergedProjects
    .filter((p) => p.active_sessions > 0)
    .map((p) => ({
      ...p,
      session_items: p.session_items.filter((s) => !s.is_deleted_locally),
    }));

  const recentModelUsage = Array.from(recentModelMap.values()).sort((a, b) => (a.t || 0) - (b.t || 0));

  // 9. Return comprehensive merged data object
  return {
    today: mergedToday,
    current_project: scanResult?.current_project || {
      name: '',
      path: '',
      total_tokens: 0,
      input_tokens: 0,
      cached_tokens: 0,
      output_tokens: 0,
      thinking_tokens: 0,
      sessions: 0,
      session_list: [],
      active_session: null,
    },
    current_session: scanResult?.current_session || null,
    all_time: {
      total_tokens: allTimeTokens,
      sessions: totalSessions,
      turns: totalTurns,
    },
    projects: activeProjects,
    all_daily: allDaily,
    recent_model_usage: recentModelUsage,
    archive_meta: {
      archived_sessions_count: Object.values(archive.sessions).filter((s) => s.is_deleted_locally).length,
      total_sessions_count: totalSessions,
      last_archive_time: archive.updated_at,
    },
  };
}

/**
 * Prepares privacy-safe data bundle for web showcase / remote sync
 * @param {string} archivePath
 * @param {'public'|'anonymized'|'full'} [mode='public']
 * @returns {object} payload ready for cloud sync / REST API / Gist
 */
function exportDataForSync(archivePath, mode = 'public') {
  const archive = loadArchive(archivePath);

  const payload = {
    version: archive.version,
    updated_at: archive.updated_at,
    source: 'gemini',
    summary: archive.summary,
    daily_map: archive.daily_map,
    all_daily: Object.values(archive.daily_map || {}).sort((a, b) => a.date.localeCompare(b.date)),
  };

  if (mode === 'public') {
    // Zero project or session names exposed - purely token statistics & heatmap
    return payload;
  }

  if (mode === 'anonymized') {
    // Obfuscate project names: Project 1, Project 2...
    let pIdx = 1;
    const anonProjects = [];
    for (const [, pData] of Object.entries(archive.projects || {})) {
      anonProjects.push({
        name: `Project ${pIdx++}`,
        total_tokens: pData.total_tokens || 0,
        input_tokens: pData.input_tokens || 0,
        cached_tokens: pData.cached_tokens || 0,
        output_tokens: pData.output_tokens || 0,
        thinking_tokens: pData.thinking_tokens || 0,
        sessions_count: pData.sessions_count || 0,
        is_archived: !!pData.is_archived,
      });
    }
    payload.projects = anonProjects;
    return payload;
  }

  // mode === 'full' (self-hosted private sync)
  const fullProjects = [];
  for (const [pName, pData] of Object.entries(archive.projects || {})) {
    fullProjects.push({
      name: pName,
      total_tokens: pData.total_tokens || 0,
      input_tokens: pData.input_tokens || 0,
      cached_tokens: pData.cached_tokens || 0,
      output_tokens: pData.output_tokens || 0,
      thinking_tokens: pData.thinking_tokens || 0,
      sessions_count: pData.sessions_count || 0,
      is_archived: !!pData.is_archived,
    });
  }
  payload.projects = fullProjects;
  return payload;
}

/**
 * Maps a normalized model name to its quota pool identifier.
 * @param {string} modelName
 * @returns {'gemini'|'gemini4'|'claude'}
 */
function getModelPool(modelName) {
  const m = String(modelName || '');
  if (/claude|gpt/i.test(m)) return 'claude';
  if (/argon|carbon/i.test(m)) return 'gemini4';
  return 'gemini';
}

function formatShortLocalDate(ms) {
  const d = new Date(ms);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}.${dd}`;
}

function formatLocalDateTime(ms) {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${min}`;
}

/**
 * Computes active 7-day weekly quota windows for each pool from live quota reset times.
 * Falls back cleanly to rolling 7 days when a pool's reset_time is unavailable.
 * @param {object|null} quota
 * @param {number} [nowMs=Date.now()]
 * @returns {object}
 */
function resolvePoolWindows(quota, nowMs = Date.now()) {
  const weekMs = 7 * 86400 * 1000;
  const buildFromReset = (resetIso) => {
    if (!resetIso) return null;
    let endMs = Date.parse(resetIso);
    if (!Number.isFinite(endMs)) return null;
    while (endMs < nowMs) {
      endMs += weekMs;
    }
    const startMs = endMs - weekMs;
    return {
      start_ms: startMs,
      end_ms: endMs,
      label: `${formatShortLocalDate(startMs)}–${formatShortLocalDate(endMs)}`,
      range_detail: `${formatLocalDateTime(startMs)} ~ ${formatLocalDateTime(endMs)}`,
      is_estimated: false,
    };
  };

  const fallbackEnd = nowMs;
  const fallbackStart = nowMs - weekMs;
  const fallbackWin = {
    start_ms: fallbackStart,
    end_ms: fallbackEnd,
    label: `${formatShortLocalDate(fallbackStart)}–${formatShortLocalDate(fallbackEnd)}`,
    range_detail: `${formatLocalDateTime(fallbackStart)} ~ ${formatLocalDateTime(fallbackEnd)}`,
    is_estimated: true,
  };

  const geminiWin = buildFromReset(quota?.gemini?.weekly?.reset_time);
  const gemini4Win = buildFromReset(quota?.gemini4?.weekly?.reset_time);
  const claudeWin = buildFromReset(quota?.claude?.weekly?.reset_time);

  return {
    gemini: geminiWin || fallbackWin,
    gemini4: gemini4Win || geminiWin || fallbackWin,
    claude: claudeWin || geminiWin || fallbackWin,
  };
}

/**
 * Aggregates turn-level recent_model_usage buckets into per-model consumption
 * inside each pool's active weekly quota cycle.
 * @param {Array<object>} recentModelUsage
 * @param {object|null} quota
 * @param {number} [nowMs=Date.now()]
 * @returns {object}
 */
function computeWeeklyModelUsage(recentModelUsage, quota, nowMs = Date.now()) {
  const windows = resolvePoolWindows(quota, nowMs);
  const byModel = new Map();
  let totalTokens = 0;
  let effectiveTokens = 0;
  let totalTurns = 0;

  if (Array.isArray(recentModelUsage)) {
    for (const entry of recentModelUsage) {
      if (!entry || !entry.m) continue;
      const tsMs = (entry.t || 0) * 1000;
      const pool = getModelPool(entry.m);
      const win = windows[pool] || windows.gemini;
      // 120s tolerance accommodates minute-bucket truncation on the current active minute
      if (tsMs < win.start_ms || tsMs > win.end_ms || tsMs > nowMs + 120000) {
        continue;
      }

      let item = byModel.get(entry.m);
      if (!item) {
        item = {
          name: entry.m,
          pool,
          window_label: win.label,
          range_detail: win.range_detail,
          is_estimated: !!win.is_estimated,
          total_tokens: 0,
          input_tokens: 0,
          cached_tokens: 0,
          output_tokens: 0,
          thinking_tokens: 0,
          effective_tokens: 0,
          turns: 0,
        };
        byModel.set(entry.m, item);
      }

      const tot = entry.tot || 0;
      const inp = entry.in || 0;
      const ca = entry.ca || 0;
      const out = entry.out || 0;
      const th = entry.th || 0;
      const eff = inp + out;
      const turns = entry.n || 0;

      item.total_tokens += tot;
      item.input_tokens += inp;
      item.cached_tokens += ca;
      item.output_tokens += out;
      item.thinking_tokens += th;
      item.effective_tokens += eff;
      item.turns += turns;

      totalTokens += tot;
      effectiveTokens += eff;
      totalTurns += turns;
    }
  }

  const models = Array.from(byModel.values()).sort(
    (a, b) => b.total_tokens - a.total_tokens
  );

  return {
    windows,
    models,
    total_tokens: totalTokens,
    effective_tokens: effectiveTokens,
    total_turns: totalTurns,
  };
}

module.exports = {
  getDefaultArchive,
  getArchivePath,
  loadArchive,
  saveArchive,
  mergeScanWithArchive,
  exportDataForSync,
  getModelPool,
  resolvePoolWindows,
  computeWeeklyModelUsage,
};
