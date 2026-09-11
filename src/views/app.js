const vscode = (typeof acquireVsCodeApi === 'function') ? acquireVsCodeApi() : {
  postMessage: function(msg) { console.log('Mock postMessage:', msg); },
  getState: function() { return {}; },
  setState: function(s) {}
};

    const I18N = {
      zh: {
        topTitle: '⚡ 实时配额与用量',
        refresh: '刷新',
        refreshTitle: '重新检测进程与账号配额 (换账号后点此)',
        copy: '复制',
        copyTitle: '复制今日 Markdown 报告',
        langBtn: 'EN',
        langBtnTitle: 'Switch to English / 切换为英文',
        accountTitle: '当前登录的 Antigravity 账号（更换账号后点击刷新即可热更新）',
        detecting: '检测中...',
        connecting: '正在连接语言服务',
        secQuotas: '官方实时模型配额',
        geminiPool: 'Gemini 额度池',
        geminiHint: '原生支持 1M 超长上下文 (104.8 万 tokens)',
        claudePool: 'Claude & GPT 额度池',
        claudeHint: 'Claude 200k 上下文 · GPT-OSS 128k 上下文',
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
        copiedToast: '报告已复制到剪贴板！',
        delProjectTip: '清理该项目的全部历史会话',
        delSessionTip: '删除此会话记录',
        contextPrefix: '上下文: ',
      },
      en: {
        topTitle: '⚡ Real-time Quota & Usage',
        refresh: 'Refresh',
        refreshTitle: 'Detect process & account quota (Click after switching accounts)',
        copy: 'Copy',
        copyTitle: "Copy today's Markdown summary report",
        langBtn: '中文',
        langBtnTitle: 'Switch to Chinese / 切换为中文',
        accountTitle: 'Active Antigravity account (Click refresh after switching accounts)',
        detecting: 'Detecting...',
        connecting: 'Connecting to Language Server',
        secQuotas: 'Official Real-time Quotas',
        geminiPool: 'Gemini Pool',
        geminiHint: 'Native 1M long context (1,048,576 tokens)',
        claudePool: 'Claude & GPT Pool',
        claudeHint: 'Claude 200k context · GPT-OSS 128k context',
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
        delProjectTip: 'Clean all sessions of this project',
        delSessionTip: 'Delete this session',
        contextPrefix: 'Context: ',
      }
    };

    let currentLang = 'zh';
    let lastQuota = null;
    let lastTokens = null;

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
      if (diffMs <= 0) return (currentLang === 'en' ? 'Reset' : '已重置');
      const totalMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      if (hours > 0) return hours + 'h ' + mins + 'm';
      return mins + 'm';
    }

    function showToast(msg) {
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
      document.getElementById('cardAccount').title = t.accountTitle;

      document.getElementById('secQuotas').innerText = t.secQuotas;
      document.getElementById('lblGeminiPool').innerText = t.geminiPool;
      document.getElementById('geminiModelsHint').innerText = t.geminiHint;
      document.getElementById('lblGeminiWeekly').innerText = t.weeklyHealth;

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
    document.getElementById('cardAccount').addEventListener('click', triggerRefresh);

    // Copy action
    document.getElementById('btnCopy').addEventListener('click', () => {
      const t = I18N[currentLang] || I18N.zh;
      vscode.postMessage({ command: 'copy' });
      showToast(t.copiedToast);
    });

    // Language toggle action
    document.getElementById('btnLang').addEventListener('click', () => {
      currentLang = (currentLang === 'zh' ? 'en' : 'zh');
      vscode.postMessage({ command: 'setLanguage', lang: currentLang });
      applyI18n();
      if (lastQuota || lastTokens) {
        renderData(lastQuota, lastTokens);
      }
      showToast(currentLang === 'zh' ? '已切换为中文' : 'Switched to English');
    });

    // Message listener from extension
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'update') {
        if (msg.lang && (msg.lang === 'zh' || msg.lang === 'en')) {
          currentLang = msg.lang;
        }
        lastQuota = msg.quota;
        lastTokens = msg.tokens;
        applyI18n();
        renderData(msg.quota, msg.tokens);
      }
    });

    function renderData(quota, tokens) {
      const t = I18N[currentLang] || I18N.zh;

      // 1. Account Info
      if (quota) {
        if (quota.user_name || quota.user_email) {
          const name = quota.user_name || (currentLang === 'en' ? 'Connected' : '已连接');
          document.getElementById('accountName').innerText = name;
          document.getElementById('accountEmail').innerText = quota.user_email || (currentLang === 'en' ? 'Official Account' : '官方账号');
          document.getElementById('accountTier').innerText = quota.tier_name || 'Google AI';
          document.getElementById('accountAvatar').innerText = name.charAt(0) || '👤';
        }

        // 2. Quotas (Gemini Pool & Claude/GPT Pool)
        if (quota.gemini) {
          const g = quota.gemini;
          const fiveH = g.five_hour || g;
          document.getElementById('geminiPct').innerText = fiveH.remaining_pct + '%';
          document.getElementById('geminiBar').style.width = fiveH.remaining_pct + '%';
          document.getElementById('geminiUsed').innerText = t.fiveHUsed + fiveH.used_pct + '%';
          const cd = formatCountdown(fiveH.reset_time);
          document.getElementById('geminiReset').innerText = cd ? (t.resetPrefix + cd) : '';

          const dot = document.getElementById('geminiDot');
          dot.className = 'dot ' + (fiveH.remaining_pct > 50 ? 'dot-green' : (fiveH.remaining_pct > 20 ? 'dot-yellow' : 'dot-red'));

          const wRow = document.getElementById('geminiWeeklyRow');
          if (g.weekly) {
            wRow.style.display = 'flex';
            document.getElementById('geminiWeeklyVal').innerText = t.remaining + g.weekly.remaining_pct + '%';
            const wCd = formatCountdown(g.weekly.reset_time);
            document.getElementById('geminiWeeklyReset').innerText = wCd ? ('⏱ ' + wCd) : '';
          } else {
            wRow.style.display = 'none';
          }
        }
        if (quota.claude) {
          const c = quota.claude;
          const fiveH = c.five_hour || c;
          document.getElementById('claudePct').innerText = fiveH.remaining_pct + '%';
          document.getElementById('claudeBar').style.width = fiveH.remaining_pct + '%';
          document.getElementById('claudeUsed').innerText = t.fiveHUsed + fiveH.used_pct + '%';
          const cd = formatCountdown(fiveH.reset_time);
          document.getElementById('claudeReset').innerText = cd ? (t.resetPrefix + cd) : '';

          const dot = document.getElementById('claudeDot');
          dot.className = 'dot ' + (fiveH.remaining_pct > 50 ? 'dot-green' : (fiveH.remaining_pct > 20 ? 'dot-yellow' : 'dot-red'));

          const wRow = document.getElementById('claudeWeeklyRow');
          if (c.weekly) {
            wRow.style.display = 'flex';
            document.getElementById('claudeWeeklyVal').innerText = t.remaining + c.weekly.remaining_pct + '%';
            const wCd = formatCountdown(c.weekly.reset_time);
            document.getElementById('claudeWeeklyReset').innerText = wCd ? ('⏱ ' + wCd) : '';
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
        document.getElementById('activeSessionName').title = title + ' (ID: ' + (cs.full_id || cs.id) + ')';
        document.getElementById('activeSessionId').innerText = '#' + cs.id;

        // 2. Dedicated Context Box & Progress Bar
        const usedStr = formatUnit(cs.context_tokens || 0);
        document.getElementById('activeContextUsed').innerText = usedStr;
        document.getElementById('activeContextLimit').innerText = ctxLimit;
        document.getElementById('activeContextPct').innerText = pctStr;
        document.getElementById('activeCtxBox').title = (currentLang === 'en' ? 'Active context usage: ' : '当前会话上下文占用: ') + formatNumber(cs.context_tokens || 0) + ' tokens / ' + ctxLimit + ' (' + pctStr + ')';

        const barFill = document.getElementById('activeContextBarFill');
        const boundedPct = Math.min(100, Math.max(0, pct));
        barFill.style.width = boundedPct + '%';
        if (pct >= 90) {
          barFill.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
          document.getElementById('activeContextPct').style.color = '#ef4444';
          document.getElementById('activeContextPct').style.background = 'rgba(239, 68, 68, 0.12)';
        } else if (pct >= 75) {
          barFill.style.background = 'linear-gradient(90deg, #3b82f6, #f59e0b)';
          document.getElementById('activeContextPct').style.color = '#f59e0b';
          document.getElementById('activeContextPct').style.background = 'rgba(245, 158, 11, 0.12)';
        } else {
          barFill.style.background = 'linear-gradient(90deg, #3b82f6, #60a5fa)';
          document.getElementById('activeContextPct').style.color = '#3b82f6';
          document.getElementById('activeContextPct').style.background = 'rgba(59, 130, 246, 0.12)';
        }

        // 3. Model & Stats
        document.getElementById('activeSessionModel').innerText = '🤖 ' + modelName;
        document.getElementById('activeSessionModel').title = modelName + ' (' + (currentLang === 'en' ? 'Context Limit: ' : '上下文上限: ') + ctxLimit + ')';
        document.getElementById('activeSessionStats').innerText = (cs.turns || 0) + ' ' + t.turns + ' · ' + t.accumulated + ' ' + formatUnit(cs.total_tokens || 0);
      } else {
        activeCard.style.display = 'none';
      }

      // 3. Tokens Today
      if (tokens && tokens.today) {
        const td = tokens.today;
        document.getElementById('todayTotal').innerText = formatUnit(td.total_tokens);
        document.getElementById('todayTurns').innerText = td.turns + ' ' + t.turnsInteraction + ' · ' + td.sessions + ' ' + t.sessions;
        document.getElementById('cacheHitRate').innerText = td.cache_hit_rate + '%';

        document.getElementById('valInput').innerText = formatUnit(td.input_tokens);
        document.getElementById('subInput').innerText = formatNumber(td.input_tokens) + ' ' + t.tokensUnit;

        document.getElementById('valCache').innerText = formatUnit(td.cached_tokens);

        document.getElementById('valOutput').innerText = formatUnit(td.output_tokens);
        document.getElementById('subOutput').innerText = formatNumber(td.output_tokens) + ' ' + t.tokensUnit;

        document.getElementById('valThink').innerText = formatUnit(td.thinking_tokens);
        document.getElementById('subThink').innerText = formatNumber(td.thinking_tokens) + ' ' + t.tokensUnit;

        // Segmented proportions
        const sum = Math.max(1, td.total_tokens);
        document.getElementById('segInput').style.width = ((td.input_tokens / sum) * 100) + '%';
        document.getElementById('segCache').style.width = ((td.cached_tokens / sum) * 100) + '%';
        document.getElementById('segOutput').style.width = ((td.output_tokens / sum) * 100) + '%';
        document.getElementById('segThink').style.width = ((td.thinking_tokens / sum) * 100) + '%';
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
      (allDaily || []).forEach(function(d) {
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

      const consistencyPct = totalDaysPast > 0 ? Math.round((daysActive / totalDaysPast) * 100) : 0;

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
      if (elActive) elActive.innerText = daysActive + t.days + ' (' + consistencyPct + '%)';

      const elPeak = document.getElementById('heatStatPeak');
      if (elPeak) {
        elPeak.innerText = peakDay ? (peakDay.date.slice(5) + ' · ' + formatUnit(peakDay.total)) : (currentLang === 'en' ? 'None' : '无');
      }

      const elStreak = document.getElementById('heatStatStreak');
      if (elStreak) elStreak.innerText = currentStreak + t.days;

      const elTotal = document.getElementById('heatTotalTokens');
      if (elTotal) elTotal.innerText = t.heatTotalPrefix + numWeeks + t.heatTotalSuffix + formatUnit(totalTokens);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      let lastMonth = -1;
      let lastLabelCol = -10;
      weeks.forEach(function(w, colIdx) {
        const firstDay = w[0];
        const m = firstDay.getMonth();
        if (m !== lastMonth) {
          const canShowFirst = (colIdx === 0 && firstDay.getDate() <= 10);
          const isMonthStart = (colIdx > 0 && firstDay.getDate() <= 7);
          if ((canShowFirst || isMonthStart) && (colIdx - lastLabelCol >= 3)) {
            lastLabelCol = colIdx;
            const mLbl = document.createElement('div');
            mLbl.className = 'github-month-lbl';
            mLbl.textContent = monthNames[m];
            mLbl.style.left = (colIdx * 14) + 'px';
            monthsRow.appendChild(mLbl);
          }
          lastMonth = m;
        }
      });

      weeks.forEach(function(w) {
        const weekCol = document.createElement('div');
        weekCol.className = 'github-week-col';

        w.forEach(function(cellDate) {
          const dateStr = toYMD(cellDate);
          const isFuture = (dateStr > todayStr);
          const isToday = (dateStr === todayStr);

          const cell = document.createElement('div');

          if (isFuture) {
            cell.className = 'github-cell empty';
            cell.style.visibility = 'hidden';
            weekCol.appendChild(cell);
            return;
          }

          const rec = dayMap[dateStr];
          const tokens = (rec && rec.total) ? rec.total : 0;
          const turns = (rec && rec.turns) ? rec.turns : 0;

          let lvl = 0;
          if (tokens > 0) {
            if (tokens < 2000000) lvl = 1;
            else if (tokens < 10000000) lvl = 2;
            else if (tokens < 50000000) lvl = 3;
            else lvl = 4;
          }

          cell.className = 'github-cell heat-lvl-' + lvl + ' heat-' + lvl + (isToday ? ' is-today' : '');

          const formattedVal = tokens > 0 ? (formatUnit(tokens) + ' (' + formatNumber(tokens) + ' ' + t.tokensUnit + ' · ' + turns + ' ' + t.turns + ')') : t.noActivity;
          const tipText = dateStr + ': ' + formattedVal;
          cell.title = tipText;

          cell.addEventListener('mouseenter', function() {
            const hDate = document.getElementById('heatHoverDate');
            if (hDate) hDate.innerText = tipText;
          });

          cell.addEventListener('mouseleave', function() {
            const hDate = document.getElementById('heatHoverDate');
            if (hDate) hDate.innerText = t.heatHover;
          });

          weekCol.appendChild(cell);
        });

        weeksGrid.appendChild(weekCol);
      });

      if (graphSection) {
        setTimeout(function() {
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

        const isCurrent = (p.name === currentProjName);
        const hasSessions = (p.session_items && p.session_items.length > 0);

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
        title.innerText = (isCurrent ? '⭐ ' : '📁 ') + p.name + (isCurrent ? t.currentTag : '');
        title.title = p.name;

        left.appendChild(arrow);
        left.appendChild(title);

        const right = document.createElement('div');
        right.className = 'project-header-right';

        const totalSpan = document.createElement('span');
        totalSpan.className = 'project-total';
        totalSpan.innerText = formatUnit(p.total_tokens);
        right.appendChild(totalSpan);

        if (!isCurrent) {
          const delProjBtn = document.createElement('button');
          delProjBtn.className = 'btn-icon-action btn-delete-project';
          delProjBtn.title = t.delProjectTip;
          delProjBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
          delProjBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            vscode.postMessage({
              command: 'deleteProject',
              projectName: p.name,
              sessionItems: p.session_items || []
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
            row.title = (currentLang === 'en' ? 'Session ID: ' : '会话完整ID: ') + s.full_id + '\n' +
              (currentLang === 'en' ? 'Input: ' : '输入: ') + formatUnit(s.input_tokens) + '\n' +
              (currentLang === 'en' ? 'Cache: ' : '缓存: ') + formatUnit(s.cached_tokens) + '\n' +
              (currentLang === 'en' ? 'Output: ' : '输出: ') + formatUnit(s.output_tokens) + '\n' +
              (currentLang === 'en' ? 'Thinking: ' : '思考: ') + formatUnit(s.thinking_tokens);

            const meta = document.createElement('div');
            meta.className = 'session-meta-col';

            const titleLine = document.createElement('div');
            titleLine.className = 'session-title-line';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'session-name-text';
            nameSpan.innerText = s.title || (t.sessionWord + ' ' + s.id);
            nameSpan.title = s.title || s.full_id;

            const idSpan = document.createElement('span');
            idSpan.className = 'session-id';
            idSpan.innerText = '#' + s.id;

            titleLine.appendChild(nameSpan);
            titleLine.appendChild(idSpan);

            const subLine = document.createElement('div');
            subLine.className = 'session-sub-line';
            subLine.innerHTML = '<span>' + s.date + ' · ' + s.turns + ' ' + t.turns + '</span>';
            if (s.context_tokens > 0) {
              const ctxTag = document.createElement('span');
              ctxTag.className = 'session-ctx-tag';
              const limitStr = s.context_label ? ('/' + s.context_label) : '';
              ctxTag.innerText = t.contextPrefix + formatUnit(s.context_tokens) + limitStr;
              ctxTag.title = (s.model ? (s.model + ' · ') : '') + t.contextPrefix + formatNumber(s.context_tokens) + (s.context_window ? (' / ' + formatNumber(s.context_window)) : '');
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

            const activeSessId = (currentProj && currentProj.active_session) ? (currentProj.active_session.full_id || currentProj.active_session.id) : '';
            const isThisSessionActive = activeSessId && (s.full_id === activeSessId || s.id === activeSessId);

            if (!isThisSessionActive) {
              const delSessBtn = document.createElement('button');
              delSessBtn.className = 'btn-icon-action btn-delete-session';
              delSessBtn.title = t.delSessionTip;
              delSessBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
              delSessBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                vscode.postMessage({
                  command: 'deleteSession',
                  sessionId: s.full_id || s.id,
                  sessionTitle: s.title || s.id
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

    // Ready handshake
    vscode.postMessage({ command: 'ready' });
