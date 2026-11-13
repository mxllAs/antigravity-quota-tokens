const vscode =
  typeof acquireVsCodeApi === 'function'
    ? acquireVsCodeApi()
    : {
        postMessage: function (msg) {
          console.log('Mock postMessage:', msg);
        },
        getState: function () {
          return {};
        },
        setState: function (s) {},
      };

const I18N = {
  zh: {
    topTitle: '⚡ 实时配额与用量',
    refresh: '刷新',
    refreshTitle: '重新检测进程与账号配额 (换账号后点此)',
    copy: '复制',
    copyTitle: '复制今日 Markdown 报告',
    sync: '同步',
    syncTitle: '同步数据到远程服务器 (点此立即同步 / 配置)',
    langBtn: 'EN',
    langBtnTitle: 'Switch to English / 切换为英文',
    accountTitle: '当前登录的 Antigravity 账号（更换账号后点击刷新即可热更新）',
    detecting: '检测中...',
    connecting: '正在连接语言服务',
    secQuotas: '官方实时模型配额',
    geminiPool: 'Gemini 额度池',
    geminiHint: '原生支持 1M 超长上下文 (104.8 万 tokens)',
    gemini4Pool: 'Gemini 4 Argon 额度池',
    gemini4Hint: 'Gemini 4 独立周额度 · 1M 超长上下文',
    claudePool: 'Claude & GPT 额度池',
    claudeHint: 'Claude 5.5 (1M 上下文) · GPT-OSS 128k 上下文',
    claudeNoAccess: '未开通 3P 权限 (活动版 Pro 专享 Gemini)',
    claudeNoAccessHint: '活动领取的 Pro 账号官方未分配 Claude 额度',
    noAccessTag: '未开通',
    fiveHUsed: '5h消耗: ',
    resetPrefix: '⏱ 重置: ',
    weeklyHealth: '📅 周额度健康度',
    remaining: '剩余 ',
    lblContextWindow: '上下文窗口',
    turns: '轮',
    turnsInteraction: '轮交互',
    sessions: '个会话',
    accumulated: '累计',
    secToday: '今日 Token 消耗大盘',
    cacheRate: '⚡ 缓存率',
    freshInput: '新鲜输入 (Input)',
    promptCache: '提示词缓存 (Cache)',
    modelOutput: '生成输出 (Output)',
    thinking: '思考推理 (Thinking)',
    accelerated: '大幅提速减负',
    cotDesc: '思维链推演',
    tokensUnit: '词',
    secHeatmap: 'GitHub 活跃贡献热力图',
    heatHover: '鼠标悬停方块查看详情',
    heatActive: '活跃:',
    heatPeak: '峰值:',
    heatStreak: '连续:',
    heatTotalPrefix: '近 ',
    heatTotalSuffix: ' 周累计 ',
    days: ' 天',
    less: 'Less',
    more: 'More',
    noActivity: '无活跃交互',
    secHistory: '历史项目与会话明细',
    subHistory: '点击展开会话',
    currentTag: ' (当前)',
    sessionWord: '会话',
    refreshingToast: '正在刷新配额与用量...',
    copiedToast: '报告已复制到剪贴板！',
    delProjectTip: '清理该项目的全部历史会话',
    delSessionTip: '删除此会话记录',
    contextPrefix: '上下文: ',
    archivedTag: '(已归档)',
    cleanTip: '本地会话文件已清理，Token历史与热力图已永久归档',
    secWeeklyModels: '📅 本周期各模型消耗',
    weeklyModeTotal: '总 Token',
    weeklyModeEffective: '非缓存 I/O',
    weeklyModeTip: '切换统计口径：总 Token / 仅非缓存有效输入+输出',
    weeklyEmpty: '当前周额度周期内暂无本地模型消耗',
    weeklyPoolGemini: 'Gemini 池',
    weeklyPoolGemini4: 'Argon 周池',
    weeklyPoolClaude: 'Claude 池',
    weeklyEstimatedTag: '近7天',
    secCliContext: 'agy-cli 上下文压缩阈值',
    cliOnlyBadge: '仅 agy-cli 生效',
    cliCurrentPrefix: '当前阈值: ',
    cliMultiplier256: '官方默认 · 1x 额度/轮',
    cliMultiplier512: '约 1.3x 额度消耗/轮',
    cliMultiplier900: '约 1.8x 额度消耗/轮',
    cliStopDefault: '默认 · 1x',
    cliStop512: '约 1.3x 额度',
    cliStop900: '约 1.8x 额度',
    cliNoteHtml:
      '⚠️ 说明：目前仅对 <strong>agy-cli</strong> 生效（读写 <code>~/.gemini/antigravity-cli/settings.json</code>），Antigravity IDE 暂不受此项控制。作用是调节触发上下文自动压缩的阈值：官方默认 <strong>256K</strong>，调节到 <strong>512K</strong> 以及 <strong>900K</strong> 后会增加每轮额度消耗。',
    cliStatusDefault: '已使用官方默认 (256K，未写入覆写字段)',
    cliStatusWritten: '已写入配置: ',
    cliStatusMissing: '首次切换将创建: ',
    cliStatusError: '读取失败: ',
    cliSavedToast: '已将 agy-cli 上下文压缩阈值设为 ',
  },
  en: {
    topTitle: '⚡ Real-time Quota & Usage',
    refresh: 'Refresh',
    refreshTitle:
      'Detect process & account quota (Click after switching accounts)',
    copy: 'Copy',
    copyTitle: "Copy today's Markdown summary report",
    sync: 'Sync',
    syncTitle: 'Sync token stats to remote server (click to sync/configure)',
    langBtn: '中文',
    langBtnTitle: 'Switch to Chinese / 切换为中文',
    accountTitle:
      'Active Antigravity account (Click refresh after switching accounts)',
    detecting: 'Detecting...',
    connecting: 'Connecting to Language Server',
    secQuotas: 'Official Real-time Quotas',
    geminiPool: 'Gemini Pool',
    geminiHint: 'Native 1M long context (1,048,576 tokens)',
    gemini4Pool: 'Gemini 4 Argon Pool',
    gemini4Hint: 'Gemini 4 Weekly Limit · 1M Context',
    claudePool: 'Claude & GPT Pool',
    claudeHint: 'Claude 5.5 (1M context) · GPT-OSS 128k context',
    claudeNoAccess: 'No 3P Access (Promo Pro: Gemini Only)',
    claudeNoAccessHint: 'Promotional Pro account without Claude quota allocation',
    noAccessTag: 'No Access',
    fiveHUsed: '5h Used: ',
    resetPrefix: '⏱ Resets: ',
    weeklyHealth: '📅 Weekly Quota Health',
    remaining: 'Left ',
    lblContextWindow: 'Context Window',
    turns: 'turns',
    turnsInteraction: 'turns',
    sessions: 'sessions',
    accumulated: 'Total',
    secToday: "Today's Token Analytics",
    cacheRate: '⚡ Cache Hit',
    freshInput: 'Fresh Input',
    promptCache: 'Prompt Cache',
    modelOutput: 'Output',
    thinking: 'Thinking (CoT)',
    accelerated: 'Accelerated',
    cotDesc: 'Chain of Thought',
    tokensUnit: 'tokens',
    secHeatmap: 'GitHub Activity Heatmap',
    heatHover: 'Hover cell for details',
    heatActive: 'Active:',
    heatPeak: 'Peak:',
    heatStreak: 'Streak:',
    heatTotalPrefix: 'Last ',
    heatTotalSuffix: ' Wks Total ',
    days: ' days',
    less: 'Less',
    more: 'More',
    noActivity: 'No activity',
    secHistory: 'Historical Projects & Sessions',
    subHistory: 'Click to expand',
    currentTag: ' (Current)',
    sessionWord: 'Session',
    refreshingToast: 'Refreshing quotas & usage...',
    copiedToast: 'Report copied to clipboard!',
    delProjectTip: 'Clean all sessions of this project',
    delSessionTip: 'Delete this session',
    contextPrefix: 'Context: ',
    archivedTag: '(Archived)',
    cleanTip: 'Local files freed, Token history permanently archived',
    secWeeklyModels: '📅 Weekly Usage by Model',
    weeklyModeTotal: 'Total',
    weeklyModeEffective: 'Non-Cache I/O',
    weeklyModeTip: 'Toggle metric: All Tokens vs Fresh Input + Output',
    weeklyEmpty: 'No local model usage in current weekly cycle',
    weeklyPoolGemini: 'Gemini',
    weeklyPoolGemini4: 'Argon',
    weeklyPoolClaude: 'Claude',
    weeklyEstimatedTag: '7d',
    secCliContext: 'agy-cli Compaction Threshold',
    cliOnlyBadge: 'agy-cli only',
    cliCurrentPrefix: 'Current: ',
    cliMultiplier256: 'Official Default · 1x quota/turn',
    cliMultiplier512: '~1.3x quota/turn',
    cliMultiplier900: '~1.8x quota/turn',
    cliStopDefault: 'Default · 1x',
    cliStop512: '~1.3x quota',
    cliStop900: '~1.8x quota',
    cliNoteHtml:
      '⚠️ Note: Applies to <strong>agy-cli</strong> only (writes <code>~/.gemini/antigravity-cli/settings.json</code>; Antigravity IDE is not affected). Controls the context compaction trigger threshold: official default is <strong>256K</strong>; raising to <strong>512K</strong> or <strong>900K</strong> increases quota usage per turn.',
    cliStatusDefault: 'Using official default (256K, key omitted)',
    cliStatusWritten: 'Saved in config: ',
    cliStatusMissing: 'Will create on change: ',
    cliStatusError: 'Read error: ',
    cliSavedToast: 'agy-cli compaction threshold set to ',
  },
};

let currentLang = 'zh';
let lastQuota = null;
let lastTokens = null;
let lastCliContextWindow = { contextWindow: '256K', fileExists: true, settingsPath: '~/.gemini/antigravity-cli/settings.json', error: null };
let weeklyMetricMode = 'total';

function formatUnit(num) {
  if (num == null || isNaN(num)) return '0';
  num = Number(num);
  if (currentLang === 'en') {
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

const formatChinese = formatUnit;

function formatNumber(num) {
  if (num == null || isNaN(num)) return '0';
  return Number(num).toLocaleString();
}

function formatCountdown(isoString) {
  if (!isoString) return '';
  const diffMs = new Date(isoString).getTime() - Date.now();
  if (diffMs <= 0) return currentLang === 'en' ? 'Reset' : '已重置';
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 0) return hours + 'h ' + mins + 'm';
  return mins + 'm';
}

function showToast(msg) {
  if (!msg) return;
  const t = document.getElementById('toast');
  t.innerText = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

function applyI18n() {
  const t = I18N[currentLang] || I18N.zh;
  document.getElementById('topTitle').innerText = t.topTitle;
  document.getElementById('langBtnText').innerText = t.langBtn;
  document.getElementById('btnLang').title = t.langBtnTitle;
  document.getElementById('lblRefresh').innerText = t.refresh;
  document.getElementById('btnRefresh').title = t.refreshTitle;
  document.getElementById('lblCopy').innerText = t.copy;
  document.getElementById('btnCopy').title = t.copyTitle;
  document.getElementById('lblSync').innerText = t.sync;
  document.getElementById('btnSync').title = t.syncTitle;
  document.getElementById('cardAccount').title = t.accountTitle;

  document.getElementById('secQuotas').innerText = t.secQuotas;
  document.getElementById('lblGeminiPool').innerText = t.geminiPool;
  document.getElementById('geminiModelsHint').innerText = t.geminiHint;
  document.getElementById('lblGeminiWeekly').innerText = t.weeklyHealth;

  const lblG4 = document.getElementById('lblGemini4Pool');
  if (lblG4) {
    lblG4.innerText = t.gemini4Pool;
    const g4Hint = document.getElementById('gemini4ModelsHint');
    if (g4Hint) g4Hint.innerText = t.gemini4Hint;
  }

  document.getElementById('lblClaudePool').innerText = t.claudePool;
  document.getElementById('claudeModelsHint').innerText = t.claudeHint;
  document.getElementById('lblClaudeWeekly').innerText = t.weeklyHealth;

  document.getElementById('lblContextWindow').innerText = t.lblContextWindow;

  document.getElementById('secToday').innerText = t.secToday;
  document.getElementById('lblCacheHit').innerText = t.cacheRate;
  document.getElementById('lblInput').innerText = t.freshInput;
  document.getElementById('lblCache').innerText = t.promptCache;
  document.getElementById('subCache').innerText = t.accelerated;
  document.getElementById('lblOutput').innerText = t.modelOutput;
  document.getElementById('lblThink').innerText = t.thinking;
  document.getElementById('subThink').innerText = t.cotDesc;

  document.getElementById('lblHeatmap').innerText = t.secHeatmap;
  document.getElementById('heatHoverDate').innerText = t.heatHover;
  document.getElementById('lblHeatActive').innerText = t.heatActive;
  document.getElementById('lblHeatPeak').innerText = t.heatPeak;
  document.getElementById('lblHeatStreak').innerText = t.heatStreak;
  document.getElementById('lblHeatLess').innerText = t.less;
  document.getElementById('lblHeatMore').innerText = t.more;

  document.getElementById('lblHistory').innerText = t.secHistory;
  document.getElementById('lblHistorySub').innerText = t.subHistory;

  const lblWeekly = document.getElementById('lblWeeklyModels');
  if (lblWeekly) lblWeekly.innerText = t.secWeeklyModels;
  const btnMode = document.getElementById('btnWeeklyMetricMode');
  const lblMode = document.getElementById('lblWeeklyMetricMode');
  if (btnMode && lblMode) {
    btnMode.title = t.weeklyModeTip;
    btnMode.classList.toggle('active', weeklyMetricMode === 'effective');
    lblMode.innerText =
      weeklyMetricMode === 'effective' ? t.weeklyModeEffective : t.weeklyModeTotal;
  }

  const lblCliCtx = document.getElementById('lblCliContext');
  if (lblCliCtx) lblCliCtx.innerText = t.secCliContext;
  const cliOnlyBadge = document.getElementById('cliOnlyBadge');
  if (cliOnlyBadge) cliOnlyBadge.innerText = t.cliOnlyBadge;
  const lblStopDefault = document.getElementById('lblStopDefault');
  if (lblStopDefault) lblStopDefault.innerText = t.cliStopDefault;
  const lblStop512 = document.getElementById('lblStop512');
  if (lblStop512) lblStop512.innerText = t.cliStop512;
  const lblStop900 = document.getElementById('lblStop900');
  if (lblStop900) lblStop900.innerText = t.cliStop900;
  const cliNote = document.getElementById('cliContextNote');
  if (cliNote) cliNote.innerHTML = t.cliNoteHtml;
  renderCliContextWindow(lastCliContextWindow);
}

// Refresh action
function triggerRefresh() {
  const t = I18N[currentLang] || I18N.zh;
  const icon = document.getElementById('refreshIcon');
  icon.classList.add('spinning');
  vscode.postMessage({ command: 'refresh' });
  showToast(t.refreshingToast);
  setTimeout(() => icon.classList.remove('spinning'), 1500);
}

document.getElementById('btnRefresh').addEventListener('click', triggerRefresh);
document
  .getElementById('cardAccount')
  .addEventListener('click', triggerRefresh);

// Copy action
document.getElementById('btnCopy').addEventListener('click', () => {
  const t = I18N[currentLang] || I18N.zh;
  vscode.postMessage({ command: 'copy' });
  showToast(t.copiedToast);
});

// Sync action
document.getElementById('btnSync').addEventListener('click', () => {
  vscode.postMessage({ command: 'sync' });
});

// Language toggle action
document.getElementById('btnLang').addEventListener('click', () => {
  currentLang = currentLang === 'zh' ? 'en' : 'zh';
  vscode.postMessage({ command: 'setLanguage', lang: currentLang });
  applyI18n();
  if (lastQuota || lastTokens) {
    renderData(lastQuota, lastTokens);
  }
  showToast(currentLang === 'zh' ? '已切换为中文' : 'Switched to English');
});

const btnWeeklyModeEl = document.getElementById('btnWeeklyMetricMode');
if (btnWeeklyModeEl) {
  btnWeeklyModeEl.addEventListener('click', () => {
    weeklyMetricMode = weeklyMetricMode === 'total' ? 'effective' : 'total';
    applyI18n();
    if (lastTokens) {
      renderWeeklyModels(lastTokens.weekly_models);
    }
  });
}

// Message listener from extension
window.addEventListener('message', (event) => {
  const msg = event.data;
  if (msg.type === 'update') {
    if (msg.lang && (msg.lang === 'zh' || msg.lang === 'en')) {
      currentLang = msg.lang;
    }
    lastQuota = msg.quota;
    lastTokens = msg.tokens;
    if (msg.cliContextWindow) {
      lastCliContextWindow = msg.cliContextWindow;
    }
    applyI18n();
    renderData(msg.quota, msg.tokens);
  } else if (msg.type === 'cliContextWindow') {
    if (msg.cliContextWindow) {
      lastCliContextWindow = msg.cliContextWindow;
      renderCliContextWindow(lastCliContextWindow);
    }
    if (msg.saved && msg.cliContextWindow) {
      const t = I18N[currentLang] || I18N.zh;
      showToast(t.cliSavedToast + msg.cliContextWindow.contextWindow);
    }
  }
});

function renderData(quota, tokens) {
  const t = I18N[currentLang] || I18N.zh;

  // 1. Account Info
  if (quota) {
    if (quota.user_name || quota.user_email) {
      const name =
        quota.user_name || (currentLang === 'en' ? 'Connected' : '已连接');
      document.getElementById('accountName').innerText = name;
      document.getElementById('accountEmail').innerText =
        quota.user_email ||
        (currentLang === 'en' ? 'Official Account' : '官方账号');
      document.getElementById('accountTier').innerText =
        quota.tier_name || 'Google AI';

      const avatarEl = document.getElementById('accountAvatar');
      if (quota.user_avatar) {
        avatarEl.innerHTML = `<img src="${quota.user_avatar}" class="account-avatar-img" alt="${name}" referrerpolicy="no-referrer" />`;
      } else {
        avatarEl.innerText = name.charAt(0) || '👤';
      }
    }

    // 2. Quotas (Gemini Pool & Claude/GPT Pool)
    if (quota.gemini) {
      const g = quota.gemini;
      const gHint = document.getElementById('geminiModelsHint');
      if (gHint && g.models_hint) {
        gHint.innerText =
          currentLang === 'en'
            ? g.models_hint
                .replace('原生 1M 超长上下文 (104.8 万 tokens)', t.geminiHint)
                .replace('1M 上下文', '1M Context')
            : g.models_hint;
      }
      const fiveH = g.five_hour || g;
      document.getElementById('geminiPct').innerText =
        fiveH.remaining_pct + '%';
      document.getElementById('geminiBar').style.width =
        fiveH.remaining_pct + '%';
      document.getElementById('geminiUsed').innerText =
        t.fiveHUsed + fiveH.used_pct + '%';
      const cd = formatCountdown(fiveH.reset_time);
      document.getElementById('geminiReset').innerText = cd
        ? t.resetPrefix + cd
        : '';

      const dot = document.getElementById('geminiDot');
      dot.className =
        'dot ' +
        (fiveH.remaining_pct > 50
          ? 'dot-green'
          : fiveH.remaining_pct > 20
            ? 'dot-yellow'
            : 'dot-red');

      const wRow = document.getElementById('geminiWeeklyRow');
      if (g.weekly) {
        wRow.style.display = 'flex';
        document.getElementById('geminiWeeklyVal').innerText =
          t.remaining + g.weekly.remaining_pct + '%';
        const wCd = formatCountdown(g.weekly.reset_time);
        document.getElementById('geminiWeeklyReset').innerText = wCd
          ? '⏱ ' + wCd
          : '';
      } else {
        wRow.style.display = 'none';
      }
    }
    // Gemini 4 Argon / Carbon Pool (Desktop/New version)
    const cardG4 = document.getElementById('cardGemini4');
    if (cardG4) {
      if (quota.gemini4 && quota.gemini4.weekly) {
        cardG4.style.display = 'block';
        const g4 = quota.gemini4;
        const weekly = g4.weekly;
        if (g4.label) {
          const lblG4 = document.getElementById('lblGemini4Pool');
          if (lblG4) {
            lblG4.innerText =
              currentLang === 'en' ? g4.label.replace(' 额度池', ' Pool') : g4.label;
          }
        }
        if (g4.models_hint) {
          const g4Hint = document.getElementById('gemini4ModelsHint');
          if (g4Hint) {
            g4Hint.innerText =
              currentLang === 'en'
                ? g4.models_hint.replace(' 独立周额度 · 1M 超长上下文', ' Weekly Limit · 1M Context')
                : g4.models_hint;
          }
        }
        document.getElementById('gemini4Pct').innerText = weekly.remaining_pct + '%';
        document.getElementById('gemini4Bar').style.width = weekly.remaining_pct + '%';
        document.getElementById('gemini4Used').innerText = (currentLang === 'en' ? 'Weekly Used: ' : '周额度消耗: ') + weekly.used_pct + '%';
        const cd = formatCountdown(weekly.reset_time);
        document.getElementById('gemini4Reset').innerText = cd ? t.resetPrefix + cd : '';
        const dot = document.getElementById('gemini4Dot');
        if (dot) {
          dot.className =
            'dot ' +
            (weekly.remaining_pct > 50
              ? 'dot-green'
              : weekly.remaining_pct > 20
                ? 'dot-yellow'
                : 'dot-red');
        }
      } else {
        cardG4.style.display = 'none';
      }
    }

    // Claude Pool
    const cardClaude = document.getElementById('cardClaude');
    if (quota.has_claude === false) {
      if (cardClaude) cardClaude.classList.add('card-disabled');
      document.getElementById('claudePct').innerText = t.noAccessTag;
      document.getElementById('claudePct').style.color = '#9ca3af';
      document.getElementById('claudeBar').style.width = '0%';
      document.getElementById('claudeUsed').innerText = t.claudeNoAccess;
      document.getElementById('claudeReset').innerText = '';
      const dot = document.getElementById('claudeDot');
      if (dot) dot.className = 'dot dot-gray';
      const hint = document.getElementById('claudeModelsHint');
      if (hint) hint.innerText = t.claudeNoAccessHint;
      const wRow = document.getElementById('claudeWeeklyRow');
      if (wRow) wRow.style.display = 'none';
    } else if (quota.claude) {
      if (cardClaude) cardClaude.classList.remove('card-disabled');
      const hint = document.getElementById('claudeModelsHint');
      if (hint) hint.innerText = t.claudeHint;
      const c = quota.claude;
      const fiveH = c.five_hour || c;
      document.getElementById('claudePct').innerText =
        fiveH.remaining_pct + '%';
      document.getElementById('claudePct').style.color = '';
      document.getElementById('claudeBar').style.width =
        fiveH.remaining_pct + '%';
      document.getElementById('claudeUsed').innerText =
        t.fiveHUsed + fiveH.used_pct + '%';
      const cd = formatCountdown(fiveH.reset_time);
      document.getElementById('claudeReset').innerText = cd
        ? t.resetPrefix + cd
        : '';

      const dot = document.getElementById('claudeDot');
      if (dot) {
        dot.className =
          'dot ' +
          (fiveH.remaining_pct > 50
            ? 'dot-green'
            : fiveH.remaining_pct > 20
              ? 'dot-yellow'
              : 'dot-red');
      }

      const wRow = document.getElementById('claudeWeeklyRow');
      if (c.weekly) {
        wRow.style.display = 'flex';
        document.getElementById('claudeWeeklyVal').innerText =
          t.remaining + c.weekly.remaining_pct + '%';
        const wCd = formatCountdown(c.weekly.reset_time);
        document.getElementById('claudeWeeklyReset').innerText = wCd
          ? '⏱ ' + wCd
          : '';
      } else {
        wRow.style.display = 'none';
      }
    }
  }

  // Active Session Card
  const activeCard = document.getElementById('cardActiveSession');
  if (tokens && tokens.current_session) {
    const cs = tokens.current_session;
    activeCard.style.display = 'block';
    const title = cs.title || cs.id;
    const ctxLimit = cs.context_label || '1M';
    const pct = cs.context_pct != null ? cs.context_pct : 0;
    const pctStr = pct + '%';
    const modelName = cs.model || 'Gemini 3.8 Flash';

    // 1. Title & ID
    document.getElementById('activeSessionName').innerText = title;
    document.getElementById('activeSessionName').title =
      title + ' (ID: ' + (cs.full_id || cs.id) + ')';
    document.getElementById('activeSessionId').innerText = '#' + cs.id;

    // 2. Dedicated Context Box & Progress Bar
    const usedStr = formatUnit(cs.context_tokens || 0);
    document.getElementById('activeContextUsed').innerText = usedStr;
    document.getElementById('activeContextLimit').innerText = ctxLimit;
    document.getElementById('activeContextPct').innerText = pctStr;
    document.getElementById('activeCtxBox').title =
      (currentLang === 'en'
        ? 'Active context usage: '
        : '当前会话上下文占用: ') +
      formatNumber(cs.context_tokens || 0) +
      ' tokens / ' +
      ctxLimit +
      ' (' +
      pctStr +
      ')';

    const barFill = document.getElementById('activeContextBarFill');
    const boundedPct = Math.min(100, Math.max(0, pct));
    barFill.style.width = boundedPct + '%';
    if (pct >= 90) {
      barFill.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
      document.getElementById('activeContextPct').style.color = '#ef4444';
      document.getElementById('activeContextPct').style.background =
        'rgba(239, 68, 68, 0.12)';
    } else if (pct >= 75) {
      barFill.style.background = 'linear-gradient(90deg, #3b82f6, #f59e0b)';
      document.getElementById('activeContextPct').style.color = '#f59e0b';
      document.getElementById('activeContextPct').style.background =
        'rgba(245, 158, 11, 0.12)';
    } else {
      barFill.style.background = 'linear-gradient(90deg, #3b82f6, #60a5fa)';
      document.getElementById('activeContextPct').style.color = '#3b82f6';
      document.getElementById('activeContextPct').style.background =
        'rgba(59, 130, 246, 0.12)';
    }

    // 3. Model & Stats
    document.getElementById('activeSessionModel').innerText = '🤖 ' + modelName;
    document.getElementById('activeSessionModel').title =
      modelName +
      ' (' +
      (currentLang === 'en' ? 'Context Limit: ' : '上下文上限: ') +
      ctxLimit +
      ')';
    document.getElementById('activeSessionStats').innerText =
      (cs.turns || 0) +
      ' ' +
      t.turns +
      ' · ' +
      t.accumulated +
      ' ' +
      formatUnit(cs.total_tokens || 0);
  } else {
    activeCard.style.display = 'none';
  }

  // 3. Tokens Today
  if (tokens && tokens.today) {
    const td = tokens.today;
    document.getElementById('todayTotal').innerText = formatUnit(
      td.total_tokens
    );
    document.getElementById('todayTurns').innerText =
      td.turns +
      ' ' +
      t.turnsInteraction +
      ' · ' +
      td.sessions +
      ' ' +
      t.sessions;
    document.getElementById('cacheHitRate').innerText = td.cache_hit_rate + '%';

    document.getElementById('valInput').innerText = formatUnit(td.input_tokens);
    document.getElementById('subInput').innerText =
      formatNumber(td.input_tokens) + ' ' + t.tokensUnit;

    document.getElementById('valCache').innerText = formatUnit(
      td.cached_tokens
    );

    document.getElementById('valOutput').innerText = formatUnit(
      td.output_tokens
    );
    document.getElementById('subOutput').innerText =
      formatNumber(td.output_tokens) + ' ' + t.tokensUnit;

    document.getElementById('valThink').innerText = formatUnit(
      td.thinking_tokens
    );
    document.getElementById('subThink').innerText =
      formatNumber(td.thinking_tokens) + ' ' + t.tokensUnit;

    // Segmented proportions
    const sum = Math.max(1, td.total_tokens);
    document.getElementById('segInput').style.width =
      (td.input_tokens / sum) * 100 + '%';
    document.getElementById('segCache').style.width =
      (td.cached_tokens / sum) * 100 + '%';
    document.getElementById('segOutput').style.width =
      (td.output_tokens / sum) * 100 + '%';
    document.getElementById('segThink').style.width =
      (td.thinking_tokens / sum) * 100 + '%';
  }

  // 3.5 Weekly Quota Cycle Consumption by Model
  if (tokens) {
    renderWeeklyModels(tokens.weekly_models);
  }

  // 4. GitHub Heatmap Render
  if (tokens && tokens.all_daily) {
    renderHeatmap(tokens.all_daily);
  }

  // 5. Projects with Drill-down Sessions
  if (tokens && tokens.projects) {
    renderProjectsWithSessions(tokens.projects, tokens.current_project);
  }
}

// ==================== Weekly Models Breakdown ====================
function renderWeeklyModels(wm) {
  const t = I18N[currentLang] || I18N.zh;
  const summaryEl = document.getElementById('weeklyModelsSummary');
  const listEl = document.getElementById('weeklyModelsList');
  if (!summaryEl || !listEl) return;

  listEl.innerHTML = '';

  const models = wm && Array.isArray(wm.models) ? wm.models : [];
  if (models.length === 0) {
    summaryEl.innerHTML =
      currentLang === 'en'
        ? '<span>0 models · 0 turns</span>'
        : '<span>0 个模型 · 0 轮</span>';
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'weekly-models-empty';
    emptyDiv.innerText = t.weeklyEmpty;
    listEl.appendChild(emptyDiv);
    return;
  }

  const getMetric = (m) =>
    weeklyMetricMode === 'effective'
      ? m.effective_tokens || 0
      : m.total_tokens || 0;

  const sorted = [...models].sort((a, b) => getMetric(b) - getMetric(a));
  const maxVal = Math.max(1, getMetric(sorted[0]));
  const sumVal = sorted.reduce((acc, m) => acc + getMetric(m), 0);

  summaryEl.innerHTML = '';
  const sumLeft = document.createElement('span');
  sumLeft.innerText =
    currentLang === 'en'
      ? `${sorted.length} models · Total ${formatUnit(sumVal)}`
      : `共 ${sorted.length} 个模型 · 合计 ${formatUnit(sumVal)}`;
  const sumRight = document.createElement('span');
  sumRight.innerText = `${wm.total_turns || 0} ${t.turns}`;
  summaryEl.appendChild(sumLeft);
  summaryEl.appendChild(sumRight);

  const poolNames = {
    gemini: t.weeklyPoolGemini,
    gemini4: t.weeklyPoolGemini4,
    claude: t.weeklyPoolClaude,
  };

  sorted.forEach((m) => {
    const val = getMetric(m);
    const pctOfMax = Math.max(4, Math.round((val / maxVal) * 100));
    const sharePct =
      sumVal > 0 ? ((val / sumVal) * 100).toFixed(1) + '%' : '0%';
    const poolClass =
      m.pool === 'claude' || m.pool === 'gemini4' ? m.pool : 'gemini';
    const poolLabel = poolNames[poolClass] || t.weeklyPoolGemini;
    const cycleLabel = m.is_estimated
      ? t.weeklyEstimatedTag
      : m.window_label || t.weeklyEstimatedTag;

    const row = document.createElement('div');
    row.className = 'weekly-model-row';
    row.title =
      `${m.name} (${poolLabel})\n` +
      (currentLang === 'en' ? 'Cycle: ' : '周期: ') +
      (m.range_detail || cycleLabel) +
      (m.is_estimated
        ? currentLang === 'en'
          ? ' (rolling 7d fallback)'
          : ' (离线估算近7天)'
        : '') +
      `\n` +
      (currentLang === 'en' ? 'Total: ' : '总计: ') +
      `${formatNumber(m.total_tokens)} (${sharePct})\n` +
      (currentLang === 'en' ? 'Input: ' : '输入: ') +
      `${formatUnit(m.input_tokens)} · ` +
      (currentLang === 'en' ? 'Cache: ' : '缓存: ') +
      `${formatUnit(m.cached_tokens)}\n` +
      (currentLang === 'en' ? 'Output: ' : '输出: ') +
      `${formatUnit(m.output_tokens)} · ` +
      (currentLang === 'en' ? 'Thinking: ' : '思考: ') +
      `${formatUnit(m.thinking_tokens)}`;

    const top = document.createElement('div');
    top.className = 'weekly-model-top';

    const left = document.createElement('div');
    left.className = 'weekly-model-left';

    const dot = document.createElement('span');
    dot.className = `weekly-model-dot pool-dot-${poolClass}`;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'weekly-model-name';
    nameSpan.innerText = m.name;

    const badge = document.createElement('span');
    badge.className = `weekly-pool-badge pool-badge-${poolClass}`;
    badge.innerText = `${poolLabel} · ${cycleLabel}`;

    left.appendChild(dot);
    left.appendChild(nameSpan);
    left.appendChild(badge);

    const valSpan = document.createElement('div');
    valSpan.className = 'weekly-model-val';
    valSpan.innerText = formatUnit(val);

    top.appendChild(left);
    top.appendChild(valSpan);

    const barBg = document.createElement('div');
    barBg.className = 'weekly-model-bar-bg';
    const barFill = document.createElement('div');
    barFill.className = `weekly-model-bar-fill pool-fill-${poolClass}`;
    barFill.style.width = pctOfMax + '%';
    barBg.appendChild(barFill);

    const sub = document.createElement('div');
    sub.className = 'weekly-model-sub';

    const subLeft = document.createElement('span');
    if (weeklyMetricMode === 'effective') {
      subLeft.innerText =
        currentLang === 'en'
          ? `In ${formatUnit(m.input_tokens)} · Out ${formatUnit(m.output_tokens)} (Cache ${formatUnit(m.cached_tokens)})`
          : `输入 ${formatUnit(m.input_tokens)} · 输出 ${formatUnit(m.output_tokens)} (已排除缓存 ${formatUnit(m.cached_tokens)})`;
    } else {
      subLeft.innerText =
        currentLang === 'en'
          ? `In ${formatUnit(m.input_tokens)} · Cache ${formatUnit(m.cached_tokens)} · Out ${formatUnit(m.output_tokens)}`
          : `输入 ${formatUnit(m.input_tokens)} · 缓存 ${formatUnit(m.cached_tokens)} · 输出 ${formatUnit(m.output_tokens)}`;
    }

    const subRight = document.createElement('span');
    subRight.innerText = `${m.turns || 0} ${t.turns}`;

    sub.appendChild(subLeft);
    sub.appendChild(subRight);

    row.appendChild(top);
    row.appendChild(barBg);
    row.appendChild(sub);
    listEl.appendChild(row);
  });
}

// ==================== Heatmap Logic ====================
function renderHeatmap(allDaily) {
  const t = I18N[currentLang] || I18N.zh;
  const monthsRow = document.getElementById('githubMonthsRow');
  const weeksGrid = document.getElementById('githubWeeksGrid');
  const graphSection = document.getElementById('githubHeatmapSection');
  if (!monthsRow || !weeksGrid) return;

  monthsRow.innerHTML = '';
  weeksGrid.innerHTML = '';

  const dayMap = {};
  (allDaily || []).forEach(function (d) {
    dayMap[d.date] = d;
  });

  const today = new Date();
  const todayStr = toYMD(today);

  const numWeeks = 24;
  const totalDaysToDisplay = numWeeks * 7;

  const dayOfWeek = (today.getDay() + 6) % 7;
  const endOfGrid = new Date(today);
  endOfGrid.setDate(today.getDate() + (6 - dayOfWeek));

  const startOfGrid = new Date(endOfGrid);
  startOfGrid.setDate(endOfGrid.getDate() - totalDaysToDisplay + 1);

  const weeks = [];
  let curr = new Date(startOfGrid);

  for (let w = 0; w < numWeeks; w++) {
    const weekDays = [];
    for (let d = 0; d < 7; d++) {
      weekDays.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    weeks.push(weekDays);
  }

  let daysActive = 0;
  let totalTokens = 0;
  let peakDay = null;
  let totalDaysPast = 0;

  let dCursor = new Date(startOfGrid);
  while (dCursor <= today) {
    totalDaysPast++;
    const ds = toYMD(dCursor);
    const rec = dayMap[ds];
    if (rec && rec.total > 0) {
      daysActive++;
      totalTokens += rec.total;
      if (!peakDay || rec.total > peakDay.total) {
        peakDay = { date: ds, total: rec.total, turns: rec.turns || 0 };
      }
    }
    dCursor.setDate(dCursor.getDate() + 1);
  }

  const consistencyPct =
    totalDaysPast > 0 ? Math.round((daysActive / totalDaysPast) * 100) : 0;

  let currentStreak = 0;
  let streakCursor = new Date(today);
  const todayRec = dayMap[todayStr];
  if (!todayRec || todayRec.total <= 0) {
    streakCursor.setDate(streakCursor.getDate() - 1);
  }
  while (true) {
    const ds = toYMD(streakCursor);
    const rec = dayMap[ds];
    if (rec && rec.total > 0) {
      currentStreak++;
      streakCursor.setDate(streakCursor.getDate() - 1);
    } else {
      break;
    }
  }

  const elActive = document.getElementById('heatStatActive');
  if (elActive)
    elActive.innerText = daysActive + t.days + ' (' + consistencyPct + '%)';

  const elPeak = document.getElementById('heatStatPeak');
  if (elPeak) {
    elPeak.innerText = peakDay
      ? peakDay.date.slice(5) + ' · ' + formatUnit(peakDay.total)
      : currentLang === 'en'
        ? 'None'
        : '无';
  }

  const elStreak = document.getElementById('heatStatStreak');
  if (elStreak) elStreak.innerText = currentStreak + t.days;

  const elTotal = document.getElementById('heatTotalTokens');
  if (elTotal)
    elTotal.innerText =
      t.heatTotalPrefix +
      numWeeks +
      t.heatTotalSuffix +
      formatUnit(totalTokens);

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  let lastMonth = -1;
  let lastLabelCol = -10;
  weeks.forEach(function (w, colIdx) {
    const firstDay = w[0];
    const m = firstDay.getMonth();
    if (m !== lastMonth) {
      const canShowFirst = colIdx === 0 && firstDay.getDate() <= 10;
      const isMonthStart = colIdx > 0 && firstDay.getDate() <= 7;
      if ((canShowFirst || isMonthStart) && colIdx - lastLabelCol >= 3) {
        lastLabelCol = colIdx;
        const mLbl = document.createElement('div');
        mLbl.className = 'github-month-lbl';
        mLbl.textContent = monthNames[m];
        mLbl.style.left = colIdx * 14 + 'px';
        monthsRow.appendChild(mLbl);
      }
      lastMonth = m;
    }
  });

  weeks.forEach(function (w) {
    const weekCol = document.createElement('div');
    weekCol.className = 'github-week-col';

    w.forEach(function (cellDate) {
      const dateStr = toYMD(cellDate);
      const isFuture = dateStr > todayStr;
      const isToday = dateStr === todayStr;

      const cell = document.createElement('div');

      if (isFuture) {
        cell.className = 'github-cell empty';
        cell.style.visibility = 'hidden';
        weekCol.appendChild(cell);
        return;
      }

      const rec = dayMap[dateStr];
      const tokens = rec && rec.total ? rec.total : 0;
      const turns = rec && rec.turns ? rec.turns : 0;

      let lvl = 0;
      if (tokens > 0) {
        if (tokens < 2000000) lvl = 1;
        else if (tokens < 10000000) lvl = 2;
        else if (tokens < 50000000) lvl = 3;
        else lvl = 4;
      }

      cell.className =
        'github-cell heat-lvl-' +
        lvl +
        ' heat-' +
        lvl +
        (isToday ? ' is-today' : '');

      const formattedVal =
        tokens > 0
          ? formatUnit(tokens) +
            ' (' +
            formatNumber(tokens) +
            ' ' +
            t.tokensUnit +
            ' · ' +
            turns +
            ' ' +
            t.turns +
            ')'
          : t.noActivity;
      const tipText = dateStr + ': ' + formattedVal;
      cell.title = tipText;

      cell.addEventListener('mouseenter', function () {
        const hDate = document.getElementById('heatHoverDate');
        if (hDate) hDate.innerText = tipText;
      });

      cell.addEventListener('mouseleave', function () {
        const hDate = document.getElementById('heatHoverDate');
        if (hDate) hDate.innerText = t.heatHover;
      });

      weekCol.appendChild(cell);
    });

    weeksGrid.appendChild(weekCol);
  });

  if (graphSection) {
    setTimeout(function () {
      graphSection.scrollLeft = graphSection.scrollWidth;
    }, 50);
  }
}

function toYMD(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

// ==================== Projects with Drill-down Sessions ====================
function renderProjectsWithSessions(projects, currentProj) {
  const t = I18N[currentLang] || I18N.zh;
  const container = document.getElementById('projectsContainer');
  if (!container) return;
  container.innerHTML = '';

  const currentProjName = currentProj ? currentProj.name : '';

  projects.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'project-card-item';

    const isCurrent = p.name === currentProjName;
    const hasSessions = p.session_items && p.session_items.length > 0;
    const isArchived = p.is_archived || (hasSessions && p.session_items.every((s) => s.is_deleted_locally));

    // Header Row
    const header = document.createElement('div');
    header.className = 'project-header-row';

    const left = document.createElement('div');
    left.className = 'project-info-left';

    const arrow = document.createElement('span');
    arrow.className = 'project-arrow';
    arrow.innerText = '▶';

    const title = document.createElement('span');
    title.className = 'project-title';
    title.innerText =
      (isCurrent ? '⭐ ' : isArchived ? '📦 ' : '📁 ') +
      p.name +
      (isCurrent ? t.currentTag : '');
    if (isArchived) {
      const archSpan = document.createElement('span');
      archSpan.className = 'project-archived-tag';
      archSpan.innerText = t.archivedTag;
      archSpan.title = t.cleanTip;
      title.appendChild(archSpan);
    }
    title.title = p.name + (isArchived ? ' ' + t.cleanTip : '');

    left.appendChild(arrow);
    left.appendChild(title);

    const right = document.createElement('div');
    right.className = 'project-header-right';

    const totalSpan = document.createElement('span');
    totalSpan.className = 'project-total';
    totalSpan.innerText = formatUnit(p.total_tokens);
    right.appendChild(totalSpan);

    if (!isCurrent && !isArchived) {
      const delProjBtn = document.createElement('button');
      delProjBtn.className = 'btn-icon-action btn-delete-project';
      delProjBtn.title = t.delProjectTip;
      delProjBtn.innerHTML =
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
      delProjBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        vscode.postMessage({
          command: 'deleteProject',
          projectName: p.name,
          sessionItems: p.session_items || [],
        });
      });
      right.appendChild(delProjBtn);
    }

    header.appendChild(left);
    header.appendChild(right);
    card.appendChild(header);

    // Sessions Container
    if (hasSessions) {
      const sessBox = document.createElement('div');
      sessBox.className = 'sessions-container';

      p.session_items.forEach((s) => {
        const row = document.createElement('div');
        row.className = 'session-item';
        row.title =
          (currentLang === 'en' ? 'Session ID: ' : '会话完整ID: ') +
          s.full_id +
          '\n' +
          (currentLang === 'en' ? 'Input: ' : '输入: ') +
          formatUnit(s.input_tokens) +
          '\n' +
          (currentLang === 'en' ? 'Cache: ' : '缓存: ') +
          formatUnit(s.cached_tokens) +
          '\n' +
          (currentLang === 'en' ? 'Output: ' : '输出: ') +
          formatUnit(s.output_tokens) +
          '\n' +
          (currentLang === 'en' ? 'Thinking: ' : '思考: ') +
          formatUnit(s.thinking_tokens);

        const meta = document.createElement('div');
        meta.className = 'session-meta-col';

        const titleLine = document.createElement('div');
        titleLine.className = 'session-title-line';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'session-name-text';
        nameSpan.innerText = s.title || t.sessionWord + ' ' + s.id;
        nameSpan.title = s.title || s.full_id;

        const idSpan = document.createElement('span');
        idSpan.className = 'session-id';
        idSpan.innerText = '#' + s.id;

        titleLine.appendChild(nameSpan);
        titleLine.appendChild(idSpan);

        const subLine = document.createElement('div');
        subLine.className = 'session-sub-line';
        subLine.innerHTML =
          '<span>' + s.date + ' · ' + s.turns + ' ' + t.turns + '</span>';
        if (s.is_deleted_locally) {
          const archTag = document.createElement('span');
          archTag.className = 'session-archived-tag';
          archTag.innerText = t.archivedTag;
          archTag.title = t.cleanTip;
          subLine.appendChild(archTag);
        }
        if (s.context_tokens > 0) {
          const ctxTag = document.createElement('span');
          ctxTag.className = 'session-ctx-tag';
          const limitStr = s.context_label ? '/' + s.context_label : '';
          ctxTag.innerText =
            t.contextPrefix + formatUnit(s.context_tokens) + limitStr;
          ctxTag.title =
            (s.model ? s.model + ' · ' : '') +
            t.contextPrefix +
            formatNumber(s.context_tokens) +
            (s.context_window ? ' / ' + formatNumber(s.context_window) : '');
          subLine.appendChild(ctxTag);
        }

        meta.appendChild(titleLine);
        meta.appendChild(subLine);

        const rightCol = document.createElement('div');
        rightCol.className = 'session-right-col';

        const tokenSpan = document.createElement('span');
        tokenSpan.className = 'session-tokens';
        tokenSpan.innerText = formatUnit(s.total_tokens);
        rightCol.appendChild(tokenSpan);

        const activeSessId =
          currentProj && currentProj.active_session
            ? currentProj.active_session.full_id ||
              currentProj.active_session.id
            : '';
        const isThisSessionActive =
          activeSessId && (s.full_id === activeSessId || s.id === activeSessId);

        if (!isThisSessionActive && !s.is_deleted_locally) {
          const delSessBtn = document.createElement('button');
          delSessBtn.className = 'btn-icon-action btn-delete-session';
          delSessBtn.title = t.delSessionTip;
          delSessBtn.innerHTML =
            '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
          delSessBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            vscode.postMessage({
              command: 'deleteSession',
              sessionId: s.full_id || s.id,
              sessionTitle: s.title || s.id,
            });
          });
          rightCol.appendChild(delSessBtn);
        }

        row.appendChild(meta);
        row.appendChild(rightCol);
        sessBox.appendChild(row);
      });

      card.appendChild(sessBox);

      // Click header to toggle
      header.addEventListener('click', () => {
        if (sessBox.classList.contains('open')) {
          sessBox.classList.remove('open');
          arrow.classList.remove('expanded');
        } else {
          sessBox.classList.add('open');
          arrow.classList.add('expanded');
        }
      });
    }

    container.appendChild(card);
  });
}

// ==================== agy-cli Context Compaction Slider ====================
const CLI_CONTEXT_PRESETS = ['256K', '512K', '900K'];

function renderCliContextWindow(info) {
  const t = I18N[currentLang] || I18N.zh;
  const preset =
    info && CLI_CONTEXT_PRESETS.includes(info.contextWindow)
      ? info.contextWindow
      : '256K';
  const idx = CLI_CONTEXT_PRESETS.indexOf(preset);

  const slider = document.getElementById('cliContextSlider');
  const fill = document.getElementById('cliSliderFill');
  const curLabel = document.getElementById('cliContextCurrentLabel');
  const badge = document.getElementById('cliContextMultiplierBadge');
  const statusEl = document.getElementById('cliContextStatusText');

  if (slider) {
    slider.value = String(idx);
    slider.classList.toggle('is-warn', preset === '512K');
    slider.classList.toggle('is-heavy', preset === '900K');
  }

  if (fill) {
    fill.style.width = idx * 50 + '%';
    fill.classList.toggle('is-warn', preset === '512K');
    fill.classList.toggle('is-heavy', preset === '900K');
  }

  document.querySelectorAll('.cli-tick-dot').forEach((dot) => {
    const dotIdx = Number(dot.getAttribute('data-index'));
    dot.classList.toggle('active', dotIdx <= idx);
  });

  document.querySelectorAll('.cli-stop-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-preset') === preset);
  });

  if (curLabel) {
    curLabel.innerText = t.cliCurrentPrefix + preset;
  }

  if (badge) {
    badge.classList.remove('is-default', 'is-warn', 'is-heavy');
    if (preset === '512K') {
      badge.classList.add('is-warn');
      badge.innerText = t.cliMultiplier512;
    } else if (preset === '900K') {
      badge.classList.add('is-heavy');
      badge.innerText = t.cliMultiplier900;
    } else {
      badge.classList.add('is-default');
      badge.innerText = t.cliMultiplier256;
    }
  }

  if (statusEl) {
    const shortPath =
      (info && info.settingsPath) || '~/.gemini/antigravity-cli/settings.json';
    if (info && info.error) {
      statusEl.innerText = t.cliStatusError + info.error;
    } else if (info && info.fileExists === false) {
      statusEl.innerText = t.cliStatusMissing + shortPath;
    } else if (preset === '256K' && (!info || !info.rawValue)) {
      statusEl.innerText = t.cliStatusDefault;
    } else {
      statusEl.innerText = t.cliStatusWritten + shortPath + ' ("contextWindow": "' + preset + '")';
    }
  }
}

function commitCliContextWindow(preset) {
  if (!CLI_CONTEXT_PRESETS.includes(preset)) return;
  lastCliContextWindow = {
    ...(lastCliContextWindow || {}),
    contextWindow: preset,
    rawValue: preset === '256K' ? null : preset,
    fileExists: true,
    error: null,
  };
  renderCliContextWindow(lastCliContextWindow);
  vscode.postMessage({
    command: 'setCliContextWindow',
    contextWindow: preset,
  });
}

(function bindCliContextSlider() {
  const slider = document.getElementById('cliContextSlider');
  if (slider) {
    slider.addEventListener('input', () => {
      const idx = Math.max(0, Math.min(2, Number(slider.value) || 0));
      const preset = CLI_CONTEXT_PRESETS[idx] || '256K';
      renderCliContextWindow({
        ...(lastCliContextWindow || {}),
        contextWindow: preset,
      });
    });
    slider.addEventListener('change', () => {
      const idx = Math.max(0, Math.min(2, Number(slider.value) || 0));
      commitCliContextWindow(CLI_CONTEXT_PRESETS[idx] || '256K');
    });
  }

  document.querySelectorAll('.cli-stop-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      if (preset) commitCliContextWindow(preset);
    });
  });
})();

// Ready handshake
vscode.postMessage({ command: 'ready' });
