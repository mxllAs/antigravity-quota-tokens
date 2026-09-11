const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { getLiveQuota } = require('./src/quota_detector');
const { getWebviewHtml } = require('./src/webview_ui');
const { deleteSessionFiles, deleteProjectSessions } = require('./src/session_cleaner');

let statusBarItem;
let autoRefreshTimer = null;
let lastQuotaData = null;
let lastTokenData = null;
let isRefreshing = false;
let webviewProvider = null;
let extensionContext = null;

// ==================== Utilities ====================

function getEffectiveLanguage() {
  const config = vscode.workspace.getConfiguration('antigravityQuota');
  const langConfig = config.get('language') || 'auto';
  if (langConfig === 'zh' || langConfig === 'en') {
    return langConfig;
  }
  const envLang = (vscode.env.language || '').toLowerCase();
  if (envLang.startsWith('zh')) {
    return 'zh';
  }
  return 'en';
}

function formatTokens(num, lang) {
  if (num == null || isNaN(num)) return '0';
  if (!lang) lang = getEffectiveLanguage();
  num = Number(num);
  if (lang === 'en') {
    if (num >= 1e9) {
      const b = num / 1e9;
      return parseFloat(b.toFixed(b >= 100 ? 1 : 2)) + 'B';
    }
    if (num >= 1e6) {
      const m = num / 1e6;
      return parseFloat(m.toFixed(m >= 100 ? 1 : 2)) + 'M';
    }
    if (num >= 1e3) {
      const k = num / 1e3;
      return parseFloat(k.toFixed(k >= 100 ? 1 : 1)) + 'K';
    }
    return num.toLocaleString();
  } else {
    if (num >= 100000000) {
      const yi = num / 100000000;
      return parseFloat(yi.toFixed(yi >= 100 ? 1 : 2)) + ' 亿';
    }
    if (num >= 10000) {
      const wan = num / 10000;
      return parseFloat(wan.toFixed(wan >= 100 ? 1 : 2)) + ' 万';
    }
    return num.toLocaleString();
  }
}

const formatChinese = formatTokens;

function formatNumber(num) {
  if (num == null || isNaN(num)) return '0';
  return Number(num).toLocaleString();
}

function formatCountdown(isoString) {
  if (!isoString) return '';
  const diffMs = new Date(isoString).getTime() - Date.now();
  if (diffMs <= 0) return '已重置';
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getStatusEmoji(pct) {
  if (pct == null) return '⚪';
  if (pct <= 20) return '🔴';
  if (pct <= 50) return '🟡';
  return '🟢';
}

// ==================== Python Resolver & Runner ====================

async function resolvePythonPath() {
  const config = vscode.workspace.getConfiguration('antigravityQuota');
  const configured = config.get('pythonPath');
  if (configured && configured.trim() !== '') {
    return configured.trim().replace(/^["'](.*)["']$/, '$1');
  }

  // Check VS Code official python extension
  try {
    const pyExt = vscode.extensions.getExtension('ms-python.python');
    if (pyExt) {
      if (!pyExt.isActive) await pyExt.activate();
      const api = pyExt.exports;
      if (api && api.environments) {
        const envPath = api.environments.getActiveEnvironmentPath();
        const resolved = await api.environments.resolveEnvironment(envPath);
        if (resolved && resolved.executable && resolved.executable.uri) {
          return resolved.executable.uri.fsPath;
        }
      }
    }
  } catch (e) {
    // Ignore and fallback
  }

  // Check workspace .venv
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    for (const f of folders) {
      const venvPy = process.platform === 'win32'
        ? path.join(f.uri.fsPath, '.venv', 'Scripts', 'python.exe')
        : path.join(f.uri.fsPath, '.venv', 'bin', 'python');
      if (fs.existsSync(venvPy)) return venvPy;
    }
  }

  // Common Windows paths
  if (process.platform === 'win32') {
    const userProfile = process.env.USERPROFILE || 'C:\\Users\\Default';
    const winCandidates = [
      path.join(userProfile, 'AppData', 'Local', 'Programs', 'Python', 'Python312', 'python.exe'),
      path.join(userProfile, 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'python.exe'),
      path.join(userProfile, 'AppData', 'Local', 'Programs', 'Python', 'Python310', 'python.exe'),
      'C:\\Python312\\python.exe',
      'C:\\Python311\\python.exe',
      'C:\\Python310\\python.exe',
    ];
    for (const p of winCandidates) {
      if (fs.existsSync(p)) return p;
    }
    return 'python';
  }

  return 'python3';
}

function runTokenCollector(pythonBin, workspacePath) {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, 'src', 'token_collector.py');
    const args = [scriptPath];
    if (workspacePath) {
      args.push('--workspace', workspacePath);
    }

    execFile(pythonBin, args, { timeout: 8000 }, (error, stdout) => {
      if (error || !stdout) {
        resolve(null);
        return;
      }
      try {
        const data = JSON.parse(stdout.trim());
        resolve(data);
      } catch (e) {
        resolve(null);
      }
    });
  });
}

async function fetchTokens() {
  const pythonBin = await resolvePythonPath();
  const currentWorkspace = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || '';
  let data = await runTokenCollector(pythonBin, currentWorkspace);

  if (!data && pythonBin !== 'python') {
    data = await runTokenCollector('python', currentWorkspace);
  }
  if (!data && pythonBin !== 'py') {
    data = await runTokenCollector('py', currentWorkspace);
  }
  return data;
}

// ==================== Data Sync & Status Bar ====================

async function updateDataAndStatusBar(force = false) {
  if (isRefreshing) return;
  isRefreshing = true;

  try {
    const [quota, tokens] = await Promise.all([
      getLiveQuota(force),
      fetchTokens(),
    ]);

    if (quota) lastQuotaData = quota;
    if (tokens) lastTokenData = tokens;

    renderStatusBar();
    if (webviewProvider) {
      webviewProvider.update();
    }
  } catch (err) {
    if (statusBarItem) {
      statusBarItem.text = '$(warning) AI Quota';
      statusBarItem.tooltip = `Antigravity Quota error: ${err.message}`;
    }
  } finally {
    isRefreshing = false;
  }
}

function renderStatusBar() {
  if (!statusBarItem) return;

  const config = vscode.workspace.getConfiguration('antigravityQuota');
  if (!config.get('showStatusBar', true)) {
    statusBarItem.hide();
    return;
  }

  const lang = getEffectiveLanguage();
  const isZh = (lang === 'zh');
  const showGemini = config.get('showGemini', true);
  const showClaude = config.get('showClaude', true);

  const parts = [];

  if (lastQuotaData) {
    if (showGemini && lastQuotaData.gemini) {
      const g = lastQuotaData.gemini;
      const fiveH = g.five_hour || g;
      const emoji = getStatusEmoji(fiveH.remaining_pct);
      const countdown = formatCountdown(fiveH.reset_time);
      const timeStr = countdown ? ` (${countdown})` : '';
      parts.push(`${emoji} Gemini ${fiveH.remaining_pct}%${timeStr}`);
    }

    if (showClaude && lastQuotaData.claude) {
      const c = lastQuotaData.claude;
      const fiveH = c.five_hour || c;
      const emoji = getStatusEmoji(fiveH.remaining_pct);
      const countdown = formatCountdown(fiveH.reset_time);
      const timeStr = countdown ? ` (${countdown})` : '';
      parts.push(`${emoji} Claude/GPT ${fiveH.remaining_pct}%${timeStr}`);
    }
  }

  // Active session context & Project tokens
  if (lastTokenData && lastTokenData.current_session && lastTokenData.current_session.context_tokens > 0) {
    const cs = lastTokenData.current_session;
    const ctxLimit = cs.context_label || '1M';
    const pct = cs.context_pct != null ? ` (${cs.context_pct}%)` : '';
    const lbl = isZh ? '上下文' : 'Context';
    parts.push(`$(circuit-board) ${lbl}: ${formatTokens(cs.context_tokens, lang)}/${ctxLimit}${pct}`);
  }

  if (lastTokenData && lastTokenData.current_project && lastTokenData.current_project.total_tokens > 0) {
    const cp = lastTokenData.current_project;
    const lbl = isZh ? '本项目' : 'Project';
    parts.push(`$(folder) ${lbl}: ${formatTokens(cp.total_tokens, lang)}`);
  }

  if (parts.length === 0) {
    if (lastTokenData && lastTokenData.today && lastTokenData.today.total_tokens > 0) {
      const lbl = isZh ? '今日消耗' : 'Today';
      parts.push(`$(graph) ${lbl}: ${formatTokens(lastTokenData.today.total_tokens, lang)}`);
    } else {
      parts.push('$(sync~spin) AI Quota');
    }
  }

  statusBarItem.text = parts.join(' | ');

  // Rich Markdown Tooltip
  const md = new vscode.MarkdownString();
  md.supportThemeIcons = true;
  md.isTrusted = true;

  if (isZh) {
    md.appendMarkdown('### ⚡ Antigravity 官方模型配额与 Token 统计\n\n');

    if (lastQuotaData) {
      md.appendMarkdown('| 模型额度池 | 5小时滚动限流 | 周额度健康度 | 原生上下文上限 |\n');
      md.appendMarkdown('| :--- | :---: | :---: | :---: |\n');
      if (lastQuotaData.gemini) {
        const g = lastQuotaData.gemini;
        const fiveH = g.five_hour || g;
        const weekly = g.weekly;
        const cd5 = formatCountdown(fiveH.reset_time);
        const cdw = weekly ? formatCountdown(weekly.reset_time) : '-';
        const wStr = weekly ? `${weekly.remaining_pct}% (${cdw})` : '-';
        md.appendMarkdown(`| ${getStatusEmoji(fiveH.remaining_pct)} **Gemini 额度池** | **${fiveH.remaining_pct}%** (${cd5 || '-'}) | ${wStr} | **1M (100万)** |\n`);
      }
      if (lastQuotaData.claude) {
        const c = lastQuotaData.claude;
        const fiveH = c.five_hour || c;
        const weekly = c.weekly;
        const cd5 = formatCountdown(fiveH.reset_time);
        const cdw = weekly ? formatCountdown(weekly.reset_time) : '-';
        const wStr = weekly ? `${weekly.remaining_pct}% (${cdw})` : '-';
        md.appendMarkdown(`| ${getStatusEmoji(fiveH.remaining_pct)} **Claude & GPT 额度池** | **${fiveH.remaining_pct}%** (${cd5 || '-'}) | ${wStr} | **200k (20万) · GPT 128k** |\n`);
      }
      if (lastQuotaData.user_name || lastQuotaData.user_email) {
        md.appendMarkdown('\n---\n');
        md.appendMarkdown(`- 👤 **当前账号**: ${lastQuotaData.user_name || ''} (${lastQuotaData.user_email || ''}) · *${lastQuotaData.tier_name || 'Google AI'}*\n`);
      }
    }

    if (lastTokenData && lastTokenData.current_session) {
      const cs = lastTokenData.current_session;
      const title = cs.title || cs.id;
      const ctxLimit = cs.context_label || '1M';
      const pct = cs.context_pct != null ? `${cs.context_pct}%` : '';
      const modelName = cs.model || 'Gemini 3.8 Flash';
      md.appendMarkdown('\n---\n');
      md.appendMarkdown(`🧠 **当前会话上下文占用**: **${formatTokens(cs.context_tokens, 'zh')} / ${ctxLimit}** (已用 **${pct}** · ${formatNumber(cs.context_tokens)} 词)\n`);
      md.appendMarkdown(`- 🤖 **当前交互模型**: \`${modelName}\` (模型上下文上限 **${ctxLimit}**)\n`);
      md.appendMarkdown(`- 💬 **会话意图/标题**: \`${title}\` (第 ${cs.turns} 轮交互)\n`);
      md.appendMarkdown(`- 📈 **该会话累计消耗**: ${formatTokens(cs.total_tokens, 'zh')}\n`);
    }

    if (lastTokenData && lastTokenData.current_project && lastTokenData.current_project.name) {
      const cp = lastTokenData.current_project;
      md.appendMarkdown(`- 📁 **当前项目 [${cp.name}] 总消耗**: **${formatTokens(cp.total_tokens, 'zh')}** (${formatNumber(cp.total_tokens)} 词)\n`);
    }

    if (lastTokenData && lastTokenData.today) {
      const td = lastTokenData.today;
      md.appendMarkdown('\n---\n');
      md.appendMarkdown(`📊 **今日全工作区 Token 消耗**: **${formatTokens(td.total_tokens, 'zh')}** (缓存率 **${td.cache_hit_rate}%**)\n`);
    }

    md.appendMarkdown('\n👉 *点击状态栏查看操作菜单，点击左侧活动栏查看可视化大盘*');
  } else {
    md.appendMarkdown('### ⚡ Antigravity Official Quotas & Token Analytics\n\n');

    if (lastQuotaData) {
      md.appendMarkdown('| Model Pool | 5-Hour Rolling Limit | Weekly Quota Health | Context Limit |\n');
      md.appendMarkdown('| :--- | :---: | :---: | :---: |\n');
      if (lastQuotaData.gemini) {
        const g = lastQuotaData.gemini;
        const fiveH = g.five_hour || g;
        const weekly = g.weekly;
        const cd5 = formatCountdown(fiveH.reset_time);
        const cdw = weekly ? formatCountdown(weekly.reset_time) : '-';
        const wStr = weekly ? `${weekly.remaining_pct}% (${cdw})` : '-';
        md.appendMarkdown(`| ${getStatusEmoji(fiveH.remaining_pct)} **Gemini Pool** | **${fiveH.remaining_pct}%** (${cd5 || '-'}) | ${wStr} | **1M (1,000,000)** |\n`);
      }
      if (lastQuotaData.claude) {
        const c = lastQuotaData.claude;
        const fiveH = c.five_hour || c;
        const weekly = c.weekly;
        const cd5 = formatCountdown(fiveH.reset_time);
        const cdw = weekly ? formatCountdown(weekly.reset_time) : '-';
        const wStr = weekly ? `${weekly.remaining_pct}% (${cdw})` : '-';
        md.appendMarkdown(`| ${getStatusEmoji(fiveH.remaining_pct)} **Claude & GPT Pool** | **${fiveH.remaining_pct}%** (${cd5 || '-'}) | ${wStr} | **200k · GPT 128k** |\n`);
      }
      if (lastQuotaData.user_name || lastQuotaData.user_email) {
        md.appendMarkdown('\n---\n');
        md.appendMarkdown(`- 👤 **Account**: ${lastQuotaData.user_name || ''} (${lastQuotaData.user_email || ''}) · *${lastQuotaData.tier_name || 'Google AI'}*\n`);
      }
    }

    if (lastTokenData && lastTokenData.current_session) {
      const cs = lastTokenData.current_session;
      const title = cs.title || cs.id;
      const ctxLimit = cs.context_label || '1M';
      const pct = cs.context_pct != null ? `${cs.context_pct}%` : '';
      const modelName = cs.model || 'Gemini 3.8 Flash';
      md.appendMarkdown('\n---\n');
      md.appendMarkdown(`🧠 **Active Session Context**: **${formatTokens(cs.context_tokens, 'en')} / ${ctxLimit}** (${pct} used · ${formatNumber(cs.context_tokens)} tokens)\n`);
      md.appendMarkdown(`- 🤖 **Model**: \`${modelName}\` (Context Limit **${ctxLimit}**)\n`);
      md.appendMarkdown(`- 💬 **Session Topic**: \`${title}\` (${cs.turns} turns)\n`);
      md.appendMarkdown(`- 📈 **Session Total**: ${formatTokens(cs.total_tokens, 'en')}\n`);
    }

    if (lastTokenData && lastTokenData.current_project && lastTokenData.current_project.name) {
      const cp = lastTokenData.current_project;
      md.appendMarkdown(`- 📁 **Current Project [${cp.name}] Total**: **${formatTokens(cp.total_tokens, 'en')}** (${formatNumber(cp.total_tokens)} tokens)\n`);
    }

    if (lastTokenData && lastTokenData.today) {
      const td = lastTokenData.today;
      md.appendMarkdown('\n---\n');
      md.appendMarkdown(`📊 **Today\'s Workspace Total**: **${formatTokens(td.total_tokens, 'en')}** (Cache Hit **${td.cache_hit_rate}%**)\n`);
    }

    md.appendMarkdown('\n👉 *Click status bar for actions, click activity bar icon for dashboard*');
  }

  statusBarItem.tooltip = md;
  statusBarItem.show();
}

// ==================== Webview View Provider (Activity Bar) ====================

class QuotaWebviewViewProvider {
  constructor(extensionUri) {
    this.extensionUri = extensionUri;
    this._view = null;
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = getWebviewHtml(webviewView.webview, this.extensionUri);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      if (data.command === 'ready') {
        this.update();
      } else if (data.command === 'refresh') {
        await updateDataAndStatusBar(true);
      } else if (data.command === 'copy') {
        copySummaryToClipboard();
      } else if (data.command === 'setLanguage') {
        const lang = data.lang;
        const config = vscode.workspace.getConfiguration('antigravityQuota');
        await config.update('language', lang, vscode.ConfigurationTarget.Global);
        this.update();
        renderStatusBar();
      } else if (data.command === 'deleteSession') {
        const lang = getEffectiveLanguage();
        const activeSessionId = lastTokenData?.current_session?.full_id || lastTokenData?.current_project?.active_session?.full_id;
        if (activeSessionId && data.sessionId && activeSessionId.toLowerCase() === data.sessionId.toLowerCase()) {
          const msg = lang === 'zh'
            ? '当前会话正在运行中，无法直接删除。如需删除，请先在 IDE 中切换至其他会话或新建会话。'
            : 'The active session is currently in use and cannot be deleted. Please switch to another conversation first.';
          vscode.window.showWarningMessage(msg);
          return;
        }

        const titleDisplay = data.sessionTitle || (data.sessionId ? data.sessionId.slice(0, 8) : 'Session');
        const confirmPrompt = lang === 'zh'
          ? `确定要删除历史会话「${titleDisplay}」吗？\n\n此操作将清理本地 SQLite 数据库及 brain 缓存目录（不可逆）。您的项目工程代码完全不受影响。`
          : `Are you sure you want to delete session "${titleDisplay}"?\n\nThis will remove the local SQLite database and brain cache. Your project source code will NOT be affected.`;
        const confirmBtn = lang === 'zh' ? '确认删除' : 'Delete';

        const action = await vscode.window.showWarningMessage(confirmPrompt, { modal: true }, confirmBtn);
        if (action === confirmBtn) {
          const res = deleteSessionFiles(data.sessionId);
          if (res.success) {
            const successMsg = lang === 'zh'
              ? `已成功删除会话，释放了 ${res.freedFormatted} 磁盘空间。`
              : `Session deleted successfully, freed ${res.freedFormatted} disk space.`;
            vscode.window.showInformationMessage(successMsg);
            await updateDataAndStatusBar(true);
          } else {
            const failMsg = lang === 'zh'
              ? '删除失败：未找到对应的本地会话文件。'
              : 'Failed to delete: local session files not found.';
            vscode.window.showErrorMessage(failMsg);
          }
        }
      } else if (data.command === 'deleteProject') {
        const lang = getEffectiveLanguage();
        const activeSessionId = lastTokenData?.current_session?.full_id || lastTokenData?.current_project?.active_session?.full_id;
        const sessionItems = Array.isArray(data.sessionItems) ? data.sessionItems : [];
        const hasActive = sessionItems.some(s => s.full_id && activeSessionId && s.full_id.toLowerCase() === activeSessionId.toLowerCase());

        if (hasActive) {
          const msg = lang === 'zh'
            ? `项目「${data.projectName}」包含当前正在运行的活跃会话，无法一键删除整项目。请先在 IDE 中切换至其他会话。`
            : `Project "${data.projectName}" contains the active conversation. Please switch conversations before deleting.`;
          vscode.window.showWarningMessage(msg);
          return;
        }

        const count = sessionItems.length;
        const confirmPrompt = lang === 'zh'
          ? `确定要清理项目「${data.projectName}」下的全部 ${count} 个历史会话记录吗？\n\n此操作将清理该项目的所有本地数据库与上下文缓存（不可逆）。您的项目工程代码完全不受影响。`
          : `Are you sure you want to clean all ${count} sessions for project "${data.projectName}"?\n\nThis will remove all conversation databases and cache files. Your project source code will NOT be affected.`;
        const confirmBtn = lang === 'zh' ? '确认清空' : 'Clean All';

        const action = await vscode.window.showWarningMessage(confirmPrompt, { modal: true }, confirmBtn);
        if (action === confirmBtn) {
          const res = deleteProjectSessions(sessionItems);
          if (res.success) {
            const successMsg = lang === 'zh'
              ? `已成功清理项目「${data.projectName}」的 ${res.deletedSessionsCount} 个会话，释放了 ${res.freedFormatted} 磁盘空间。`
              : `Successfully cleaned ${res.deletedSessionsCount} sessions for "${data.projectName}", freed ${res.freedFormatted} disk space.`;
            vscode.window.showInformationMessage(successMsg);
            await updateDataAndStatusBar(true);
          } else {
            const failMsg = lang === 'zh'
              ? '清理失败：未找到可清理的本地会话文件。'
              : 'Failed to clean: no session files found.';
            vscode.window.showErrorMessage(failMsg);
          }
        }
      }
    });

    this.update();
  }

  update() {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'update',
        quota: lastQuotaData,
        tokens: lastTokenData,
        lang: getEffectiveLanguage(),
      });
    }
  }
}

// ==================== Interactive QuickPick ====================

async function showQuickPickMenu() {
  const items = [];

  // Group 0: Active Session Context & Project
  if (lastTokenData && lastTokenData.current_session) {
    const cs = lastTokenData.current_session;
    const title = (extensionContext && extensionContext.globalState.get('alias_' + cs.id)) || cs.title || cs.id;
    const ctxLimit = cs.context_label || '1M';
    const pct = cs.context_pct != null ? `${cs.context_pct}%` : '';
    const modelName = cs.model || 'Gemini 3.8 Flash';
    items.push({
      label: '🧠 当前活跃会话与上下文',
      kind: vscode.QuickPickItemKind.Separator,
    });
    items.push({
      label: `$(circuit-board) 上下文占用: ${formatChinese(cs.context_tokens)} / ${ctxLimit} (${pct})`,
      description: `模型: ${modelName} · 会话: ${title} (${cs.turns} 轮)`,
      detail: `模型上下文上限: ${ctxLimit} · 新鲜输入: ${formatChinese(cs.input_tokens)} · 上下文缓存: ${formatChinese(cs.cached_tokens)} · 累计: ${formatChinese(cs.total_tokens)}`,
      action: 'copy_summary',
    });
  }

  // Group 1: Token Usage Today
  if (lastTokenData && lastTokenData.today) {
    const td = lastTokenData.today;
    items.push({
      label: '📊 今日 Token 消耗总览',
      kind: vscode.QuickPickItemKind.Separator,
    });
    items.push({
      label: `$(graph) 今日消耗总量: ${formatChinese(td.total_tokens)} (${formatNumber(td.total_tokens)})`,
      description: `缓存命中率 ${td.cache_hit_rate}% · ${td.turns} 轮对话`,
      detail: '包含新鲜输入、提示词缓存命中、模型生成输出与隐式思考推理 Token',
      action: 'copy_summary',
    });
    items.push({
      label: `    $(arrow-small-right) 新鲜输入 (Fresh Input): ${formatChinese(td.input_tokens)}`,
      description: `${formatNumber(td.input_tokens)} 词`,
    });
    items.push({
      label: `    $(database) 缓存命中 (Prompt Cache): ${formatChinese(td.cached_tokens)}`,
      description: `${formatNumber(td.cached_tokens)} 词 (${td.cache_hit_rate}%)`,
      detail: 'Gemini 上下文缓存命中，极大提升响应速度并降低消耗',
    });
    items.push({
      label: `    $(edit) 模型输出 (Generation Output): ${formatChinese(td.output_tokens)}`,
      description: `${formatNumber(td.output_tokens)} 词`,
    });
    items.push({
      label: `    $(lightbulb) 思考推理 (Thinking Tokens): ${formatChinese(td.thinking_tokens)}`,
      description: `${formatNumber(td.thinking_tokens)} 词`,
      detail: '前沿思维链思考与推演生成的隐式 Token',
    });
  }

  // Group 2: Current Project
  if (lastTokenData && lastTokenData.current_project && lastTokenData.current_project.name) {
    const cp = lastTokenData.current_project;
    items.push({
      label: '📁 当前项目消耗',
      kind: vscode.QuickPickItemKind.Separator,
    });
    items.push({
      label: `$(folder) 项目: ${cp.name} - 总消耗: ${formatChinese(cp.total_tokens)}`,
      description: `${formatNumber(cp.total_tokens)} 词 · ${cp.sessions} 个会话`,
      detail: `输入: ${formatChinese(cp.input_tokens)} · 缓存: ${formatChinese(cp.cached_tokens)} · 输出: ${formatChinese(cp.output_tokens)} · 思考: ${formatChinese(cp.thinking_tokens)}`,
    });
  }

  // Group 3: Real-time Quotas (5h & Weekly)
  if (lastQuotaData) {
    items.push({
      label: '⚡ 官方模型额度池 (5小时 & 周额度)',
      kind: vscode.QuickPickItemKind.Separator,
    });
    if (lastQuotaData.gemini) {
      const g = lastQuotaData.gemini;
      const fiveH = g.five_hour || g;
      const weekly = g.weekly;
      const cd5 = formatCountdown(fiveH.reset_time);
      const cdw = weekly ? formatCountdown(weekly.reset_time) : '';
      items.push({
        label: `${getStatusEmoji(fiveH.remaining_pct)} Gemini 5小时额度: ${fiveH.remaining_pct}% (已用 ${fiveH.used_pct}%)`,
        description: cd5 ? `⏱ 5h重置: ${cd5}` : '',
        detail: weekly ? `📅 周额度健康度: 剩余 ${weekly.remaining_pct}% (⏱ 周重置: ${cdw}) · Gemini 全系列共享` : 'Gemini 全系列共享',
      });
    }
    if (lastQuotaData.claude) {
      const c = lastQuotaData.claude;
      const fiveH = c.five_hour || c;
      const weekly = c.weekly;
      const cd5 = formatCountdown(fiveH.reset_time);
      const cdw = weekly ? formatCountdown(weekly.reset_time) : '';
      items.push({
        label: `${getStatusEmoji(fiveH.remaining_pct)} Claude/GPT 5小时额度: ${fiveH.remaining_pct}% (已用 ${fiveH.used_pct}%)`,
        description: cd5 ? `⏱ 5h重置: ${cd5}` : '',
        detail: weekly ? `📅 周额度健康度: 剩余 ${weekly.remaining_pct}% (⏱ 周重置: ${cdw}) · Claude/GPT 共享` : 'Claude 4.6 · GPT 共享',
      });
    }
  }

  // Group 4: Actions
  items.push({
    label: '⚙️ 快捷操作',
    kind: vscode.QuickPickItemKind.Separator,
  });
  items.push({
    label: '$(clippy) 复制今日 Token 统计报告',
    description: '复制格式化 Markdown 摘要到剪贴板',
    action: 'copy_summary',
  });
  items.push({
    label: '$(project) 查看所有历史项目消耗排行',
    description: '展开查看本设备上所有项目的 Token 累计统计',
    action: 'show_all_projects',
  });
  items.push({
    label: '$(refresh) 立即强制刷新数据',
    description: '重新探测官方语言服务配额与 SQLite 数据库',
    action: 'refresh',
  });

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Antigravity 配额与 Token 用量详情',
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (!selected) return;

  if (selected.action === 'refresh') {
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: '正在刷新 Antigravity 配额与 Token...',
    }, async () => {
      await updateDataAndStatusBar(true);
      vscode.window.showInformationMessage('Antigravity 配额与 Token 数据已刷新！');
    });
  } else if (selected.action === 'copy_summary') {
    copySummaryToClipboard();
  } else if (selected.action === 'show_all_projects') {
    showAllProjectsQuickPick();
  }
}

async function showAllProjectsQuickPick() {
  if (!lastTokenData || !lastTokenData.projects || lastTokenData.projects.length === 0) {
    vscode.window.showInformationMessage('未找到历史项目 Token 记录。');
    return;
  }

  const items = lastTokenData.projects.map((p) => ({
    label: `$(folder) ${p.name}`,
    description: `${formatChinese(p.total_tokens)} (${formatNumber(p.total_tokens)}) · ${p.sessions} 个会话`,
    detail: `输入: ${formatChinese(p.input_tokens)} · 缓存: ${formatChinese(p.cached_tokens)} · 输出: ${formatChinese(p.output_tokens)} · 思考: ${formatChinese(p.thinking_tokens)}`,
  }));

  await vscode.window.showQuickPick(items, {
    placeHolder: `历史项目 Token 消耗列表 (全部共 ${lastTokenData.projects.length} 个项目)`,
  });
}

function copySummaryToClipboard() {
  if (!lastTokenData || !lastTokenData.today) {
    vscode.window.showWarningMessage('暂无 Token 统计数据可复制。');
    return;
  }

  const td = lastTokenData.today;
  const cp = lastTokenData.current_project;
  const q = lastQuotaData;

  let report = `## 📊 Antigravity Token 统计报告 (${td.date})\n\n`;
  report += `### 📈 今日消耗\n`;
  report += `- **总消耗**: ${formatChinese(td.total_tokens)} (${formatNumber(td.total_tokens)} tokens)\n`;
  report += `- **新鲜输入 (Input)**: ${formatChinese(td.input_tokens)} (${formatNumber(td.input_tokens)})\n`;
  report += `- **缓存命中 (Cache)**: ${formatChinese(td.cached_tokens)} (${formatNumber(td.cached_tokens)}, 命中率 **${td.cache_hit_rate}%**)\n`;
  report += `- **生成输出 (Output)**: ${formatChinese(td.output_tokens)} (${formatNumber(td.output_tokens)})\n`;
  report += `- **思考推理 (Thinking)**: ${formatChinese(td.thinking_tokens)} (${formatNumber(td.thinking_tokens)})\n`;
  report += `- **会话轮次**: ${td.turns} 轮 (${td.sessions} 个会话)\n\n`;

  if (cp && cp.name) {
    report += `### 📁 当前工作区 [${cp.name}]\n`;
    report += `- **总消耗**: ${formatChinese(cp.total_tokens)} (${formatNumber(cp.total_tokens)} tokens)\n\n`;
  }

  if (q) {
    report += `### ⚡ 实时配额\n`;
    if (q.gemini) report += `- **Gemini**: 剩余 ${q.gemini.remaining_pct}% (重置: ${q.gemini.reset_time})\n`;
    if (q.claude) report += `- **Claude**: 剩余 ${q.claude.remaining_pct}% (重置: ${q.claude.reset_time})\n`;
  }

  vscode.env.clipboard.writeText(report);
  vscode.window.showInformationMessage('Token 统计报告已复制到剪贴板！');
}

// ==================== Activation & Deactivation ====================

function activate(context) {
  extensionContext = context;
  // 1. Create Status Bar Item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'antigravity-quota.showDetails';
  context.subscriptions.push(statusBarItem);

  // 2. Register Webview Provider (Activity Bar View)
  webviewProvider = new QuotaWebviewViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'antigravity-quota-sidebar',
      webviewProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // 3. Register Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('antigravity-quota.showDetails', () => {
      showQuickPickMenu();
    }),
    vscode.commands.registerCommand('antigravity-quota.refresh', async () => {
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: '正在刷新 Antigravity 配额与 Token...',
      }, async () => {
        await updateDataAndStatusBar(true);
        vscode.window.showInformationMessage('Antigravity 配额与 Token 数据已刷新！');
      });
    }),
    vscode.commands.registerCommand('antigravity-quota.copyReport', () => {
      copySummaryToClipboard();
    })
  );

  // 4. Configuration listener
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('antigravityQuota')) {
        restartTimer(context);
        renderStatusBar();
        if (webviewProvider) webviewProvider.update();
      }
    })
  );

  // 5. Initial load & timer setup
  updateDataAndStatusBar();
  restartTimer(context);
}

function restartTimer(context) {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
  const config = vscode.workspace.getConfiguration('antigravityQuota');
  const seconds = Math.max(15, config.get('autoRefreshSeconds', 60));

  autoRefreshTimer = setInterval(() => {
    updateDataAndStatusBar();
  }, seconds * 1000);
}

function deactivate() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}

module.exports = {
  activate,
  deactivate,
};
