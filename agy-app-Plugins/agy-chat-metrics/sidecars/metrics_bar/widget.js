// Self-contained browser widget injected into Antigravity Desktop composer toolbar via CDP.
export function buildWidgetScript(bindingName) {
  return `(() => {
  const BINDING = ${JSON.stringify(bindingName)};
  const BAR_ATTR = 'data-agy-chat-metrics-bar';
  const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (window.__agyChatMetricsDispose) {
    try { window.__agyChatMetricsDispose(); } catch {}
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const pending = new Map();
  let seq = 0;
  function callHost(type, payload) {
    return new Promise((resolve) => {
      if (pending.size >= 8) return resolve(null);
      const id = ++seq;
      const timer = setTimeout(() => {
        pending.delete(id);
        resolve(null);
      }, 6000);
      pending.set(id, { resolve, timer });
      try {
        window[BINDING](JSON.stringify({ id, type, payload }));
      } catch {
        clearTimeout(timer);
        pending.delete(id);
        resolve(null);
      }
    });
  }

  window.__agyChatMetricsResolve = (id, data) => {
    const item = pending.get(id);
    if (!item) return;
    clearTimeout(item.timer);
    pending.delete(id);
    item.resolve(data);
  };

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function parseRgb(str) {
    const nums = (String(str || '').match(/[\\d.]+/g) || []).map(Number);
    if (nums.length < 3) return null;
    const scale = String(str).startsWith('color(') ? 1 : 255;
    return [nums[0] / scale, nums[1] / scale, nums[2] / scale, nums[3] ?? 1];
  }

  function readHostTheme() {
    const rootStyle = getComputedStyle(document.documentElement);
    const bodyStyle = getComputedStyle(document.body);
    const inputBox = document.querySelector('[data-testid="agent-input-box"]');
    const boxStyle = inputBox ? getComputedStyle(inputBox) : null;

    const pickVar = (...names) => {
      for (const n of names) {
        const v = (rootStyle.getPropertyValue(n) || bodyStyle.getPropertyValue(n) || '').trim();
        if (v) return v;
      }
      return '';
    };

    const bgProbe = pickVar('--background') || bodyStyle.backgroundColor || rootStyle.backgroundColor;
    const rgb = parseRgb(bgProbe);
    let isLight = true;
    if (rgb && rgb[3] > 0.1) {
      const lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
      isLight = lum >= 0.5;
    } else if (matchMedia('(prefers-color-scheme: dark)').matches) {
      isLight = false;
    }

    const fg = pickVar('--foreground') || boxStyle?.color || bodyStyle.color || (isLight ? '#1f2328' : '#e6edf3');
    const muted = pickVar('--muted-foreground') || (isLight ? 'rgba(31, 35, 40, 0.62)' : 'rgba(230, 237, 243, 0.62)');
    const cardBg = pickVar('--card') || (isLight ? '#ffffff' : '#1b1f24');
    const border = pickVar('--border', '--card-border') || (isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.12)');
    const pillBg = isLight ? 'rgba(0, 0, 0, 0.045)' : 'rgba(255, 255, 255, 0.065)';
    const pillHover = isLight ? 'rgba(0, 0, 0, 0.085)' : 'rgba(255, 255, 255, 0.12)';
    const font = pickVar('--font-family', '--font-sans', '--ui-font-family') || bodyStyle.fontFamily || 'system-ui, sans-serif';
    const accent = pickVar('--primary') || (isLight ? '#059669' : '#34d399');

    return { isLight, fg, muted, cardBg, border, pillBg, pillHover, font, accent };
  }

  function compactNum(n) {
    if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
    if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\\.00$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\\.0$/, '') + 'K';
    return String(Math.round(n));
  }

  function findConversationId(box) {
    let cur = box;
    for (let depth = 0; depth < 14 && cur && cur !== document.body; depth++) {
      const direct = cur.getAttribute?.('data-cascade-id');
      if (direct && GUID_RE.test(direct)) return direct.toLowerCase();
      const child = cur.querySelector?.('[data-cascade-id]');
      if (child) {
        const cid = child.getAttribute('data-cascade-id');
        if (cid && GUID_RE.test(cid)) return cid.toLowerCase();
      }
      cur = cur.parentElement;
    }
    const m = (location.pathname + location.hash + location.search).match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (m) return m[1].toLowerCase();
    return null;
  }

  function findComposers() {
    const results = [];
    const boxes = Array.from(document.querySelectorAll('[data-testid="agent-input-box"]')).filter(isVisible);
    for (const box of boxes) {
      const editor = Array.from(box.querySelectorAll('[contenteditable="true"]')).find(isVisible);
      if (!editor) continue;
      const modelBtn = Array.from(
        box.querySelectorAll('[data-testid="model-selector-trigger"], button[role="combobox"][aria-haspopup]')
      ).find(isVisible);
      if (!modelBtn) continue;

      let row = modelBtn.parentElement;
      while (row && row !== box && !row.contains(editor)) {
        if (row.parentElement && row.parentElement.contains(editor)) break;
        row = row.parentElement;
      }
      if (!row || row === box || row.contains(editor)) continue;

      let branch = modelBtn;
      while (branch.parentElement && branch.parentElement !== row) {
        branch = branch.parentElement;
      }
      if (branch.parentElement !== row) continue;

      results.push({ box, editor, modelBtn, row, branch });
    }
    return results;
  }

  const widgets = new Map();

  function createWidget(composer) {
    const host = document.createElement('div');
    host.setAttribute(BAR_ATTR, '1');
    host.style.cssText = 'display:inline-flex;align-items:center;position:relative;flex-shrink:0;margin-left:6px;vertical-align:middle;z-index:20;';

    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = \`
      <style>
        :host {
          --ag-fg: #1f2328;
          --ag-muted: rgba(31,35,40,0.62);
          --ag-card: #ffffff;
          --ag-border: rgba(0,0,0,0.1);
          --ag-pill-bg: rgba(0,0,0,0.045);
          --ag-pill-hover: rgba(0,0,0,0.085);
          --ag-font: system-ui, sans-serif;
          --ag-ok: #10b981;
          --ag-warn: #f59e0b;
          --ag-danger: #ef4444;
          --ag-accent: #059669;
          font-family: var(--ag-font);
          font-size: 11.5px;
          color: var(--ag-fg);
        }
        .wrap {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          position: relative;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          height: 22px;
          padding: 0 7px;
          border-radius: 999px;
          background: var(--ag-pill-bg);
          border: 1px solid transparent;
          color: var(--ag-muted);
          font-size: 11.5px;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          cursor: pointer;
          user-select: none;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
          white-space: nowrap;
        }
        .pill:hover, .pill.active {
          background: var(--ag-pill-hover);
          color: var(--ag-fg);
          border-color: var(--ag-border);
        }
        .ring-svg {
          width: 13px;
          height: 13px;
          transform: rotate(-90deg);
          flex-shrink: 0;
        }
        .ring-track {
          fill: none;
          stroke: currentColor;
          stroke-opacity: 0.22;
          stroke-width: 2.3;
        }
        .ring-fill {
          fill: none;
          stroke: var(--ag-ok);
          stroke-width: 2.3;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.35s ease, stroke 0.25s ease;
        }
        .bolt {
          width: 11px;
          height: 11px;
          flex-shrink: 0;
          color: var(--ag-accent);
        }
        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--ag-ok);
          animation: agPulse 1.2s ease-in-out infinite;
          display: none;
        }
        .pill.running .pulse-dot {
          display: inline-block;
        }
        .pill.running .bolt {
          display: none;
        }
        @keyframes agPulse {
          0%, 100% { opacity: 0.35; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        .popover {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 0;
          min-width: 228px;
          max-width: 280px;
          background: var(--ag-card);
          color: var(--ag-fg);
          border: 1px solid var(--ag-border);
          border-radius: 10px;
          padding: 10px 12px;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
          z-index: 99999;
          display: none;
          font-size: 11.5px;
          line-height: 1.45;
        }
        .popover.open {
          display: block;
          animation: agFadeUp 0.14s ease-out;
        }
        @keyframes agFadeUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pop-title {
          font-weight: 700;
          font-size: 11.5px;
          margin-bottom: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .pop-model {
          font-weight: 500;
          font-size: 10px;
          color: var(--ag-muted);
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pop-bar-bg {
          width: 100%;
          height: 5px;
          border-radius: 3px;
          background: var(--ag-pill-bg);
          overflow: hidden;
          margin: 5px 0 7px;
        }
        .pop-bar-fill {
          height: 100%;
          border-radius: 3px;
          background: var(--ag-ok);
          transition: width 0.3s ease;
        }
        .pop-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2px 0;
          font-size: 11px;
        }
        .pop-k {
          color: var(--ag-muted);
        }
        .pop-v {
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }
        .pop-sep {
          height: 1px;
          background: var(--ag-border);
          margin: 6px 0;
        }
        .hidden { display: none !important; }
      </style>
      <div class="wrap">
        <button type="button" class="pill" id="ctxPill" title="当前对话上下文占用">
          <svg class="ring-svg" viewBox="0 0 16 16">
            <circle class="ring-track" cx="8" cy="8" r="5.5"></circle>
            <circle class="ring-fill" id="ctxRing" cx="8" cy="8" r="5.5" stroke-dasharray="34.56" stroke-dashoffset="34.56"></circle>
          </svg>
          <span id="ctxText">—</span>
        </button>
        <button type="button" class="pill" id="spdPill" title="Token 生成速度 (tok/s)">
          <span class="pulse-dot"></span>
          <svg class="bolt" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.2 1.5L3.8 9.2h4l-.9 5.3 5.3-7.7h-4l1-5.3z"/>
          </svg>
          <span id="spdText">—</span>
        </button>

        <div class="popover" id="popover">
          <div id="popCtx" class="hidden">
            <div class="pop-title">
              <span>上下文窗口占用</span>
              <span class="pop-model" id="popCtxModel"></span>
            </div>
            <div class="pop-bar-bg"><div class="pop-bar-fill" id="popCtxBar" style="width:0%"></div></div>
            <div class="pop-row"><span class="pop-k">已用 / 上限</span><span class="pop-v" id="popCtxNums">—</span></div>
            <div class="pop-row"><span class="pop-k">剩余可用</span><span class="pop-v" id="popCtxRem">—</span></div>
            <div id="popQuotaBlock" class="hidden">
              <div class="pop-sep"></div>
              <div id="popQuotaRows"></div>
            </div>
          </div>

          <div id="popSpd" class="hidden">
            <div class="pop-title">
              <span>Token 生成速度</span>
              <span class="pop-model" id="popSpdSamples"></span>
            </div>
            <div class="pop-row"><span class="pop-k">最近速率</span><span class="pop-v" id="popSpdLatest">—</span></div>
            <div class="pop-row"><span class="pop-k">会话均速</span><span class="pop-v" id="popSpdAvg">—</span></div>
            <div class="pop-row"><span class="pop-k">峰值速率</span><span class="pop-v" id="popSpdPeak">—</span></div>
            <div class="pop-row"><span class="pop-k">平均首字 (TTFT)</span><span class="pop-v" id="popSpdTtft">—</span></div>
            <div class="pop-sep"></div>
            <div class="pop-row"><span class="pop-k">输出 (正文 / 思考)</span><span class="pop-v" id="popSpdTokens">—</span></div>
            <div class="pop-row"><span class="pop-k">缓存命中率</span><span class="pop-v" id="popSpdCache">—</span></div>
          </div>
        </div>
      </div>
    \`;

    const $ = (id) => shadow.getElementById(id);
    let activeCard = null;
    let hoverTimer = null;
    let leaveTimer = null;
    let pinned = false;
    let lastData = null;

    function syncTheme() {
      const th = readHostTheme();
      host.style.setProperty('--ag-fg', th.fg);
      host.style.setProperty('--ag-muted', th.muted);
      host.style.setProperty('--ag-card', th.cardBg);
      host.style.setProperty('--ag-border', th.border);
      host.style.setProperty('--ag-pill-bg', th.pillBg);
      host.style.setProperty('--ag-pill-hover', th.pillHover);
      host.style.setProperty('--ag-font', th.font);
      host.style.setProperty('--ag-accent', th.accent);
    }

    function openCard(kind, pin = false) {
      clearTimeout(leaveTimer);
      activeCard = kind;
      if (pin) pinned = true;
      $('popCtx').classList.toggle('hidden', kind !== 'ctx');
      $('popSpd').classList.toggle('hidden', kind !== 'spd');
      $('ctxPill').classList.toggle('active', kind === 'ctx');
      $('spdPill').classList.toggle('active', kind === 'spd');
      const pop = $('popover');
      pop.classList.add('open');

      requestAnimationFrame(() => {
        pop.style.left = '0px';
        pop.style.right = 'auto';
        const rect = pop.getBoundingClientRect();
        if (rect.right > window.innerWidth - 12) {
          pop.style.left = 'auto';
          pop.style.right = '0px';
        }
      });
    }

    function closeCard(force = false) {
      if (pinned && !force) return;
      activeCard = null;
      pinned = false;
      $('popover').classList.remove('open');
      $('ctxPill').classList.remove('active');
      $('spdPill').classList.remove('active');
    }

    function bindHover(el, kind) {
      el.addEventListener('mouseenter', () => {
        clearTimeout(leaveTimer);
        clearTimeout(hoverTimer);
        if (activeCard) openCard(kind, pinned);
        else hoverTimer = setTimeout(() => openCard(kind, false), 180);
      });
      el.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimer);
        leaveTimer = setTimeout(() => closeCard(false), 160);
      });
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        clearTimeout(hoverTimer);
        if (activeCard === kind && pinned) closeCard(true);
        else openCard(kind, true);
      });
    }

    bindHover($('ctxPill'), 'ctx');
    bindHover($('spdPill'), 'spd');

    $('popover').addEventListener('mouseenter', () => clearTimeout(leaveTimer));
    $('popover').addEventListener('mouseleave', () => {
      leaveTimer = setTimeout(() => closeCard(false), 160);
    });

    const onDocClick = (e) => {
      if (pinned && !host.contains(e.target)) closeCard(true);
    };
    document.addEventListener('click', onDocClick);

    function render(data) {
      lastData = data;
      syncTheme();

      const ctx = data?.context;
      const pct = typeof ctx?.usedPct === 'number' ? ctx.usedPct : null;
      const ring = $('ctxRing');
      const color =
        pct === null ? 'var(--ag-muted)' : pct >= 90 ? 'var(--ag-danger)' : pct >= 75 ? 'var(--ag-warn)' : 'var(--ag-ok)';

      $('ctxText').textContent = pct !== null ? Math.round(pct) + '%' : '—';
      const circ = 34.56;
      ring.style.strokeDashoffset = pct !== null ? String(circ * (1 - Math.min(100, pct) / 100)) : String(circ);
      ring.style.stroke = color;

      $('popCtxModel').textContent = ctx?.model || '';
      $('popCtxBar').style.width = pct !== null ? pct.toFixed(1) + '%' : '0%';
      $('popCtxBar').style.background = color;
      $('popCtxNums').textContent = ctx
        ? compactNum(ctx.usedTokens) + ' / ' + (ctx.maxTokens ? compactNum(ctx.maxTokens) : '—')
        : '暂无采样';
      $('popCtxRem').textContent = ctx?.remainingTokens != null ? compactNum(ctx.remainingTokens) + ' tokens' : '—';

      const qList = Array.isArray(data?.quota) ? data.quota : [];
      if (qList.length > 0) {
        $('popQuotaBlock').classList.remove('hidden');
        $('popQuotaRows').innerHTML = qList
          .map((q) => {
            const parts = [];
            if (q.fivePct != null) parts.push('5h ' + q.fivePct + '%');
            if (q.weekPct != null) parts.push('周 ' + q.weekPct + '%');
            return '<div class="pop-row"><span class="pop-k">' + esc(String(q.name || '').replace(/\\s*models$/i, '')) + '</span><span class="pop-v">' + esc(parts.join(' · ') || '—') + '</span></div>';
          })
          .join('');
      } else {
        $('popQuotaBlock').classList.add('hidden');
      }

      const sp = data?.speed;
      const tps = typeof sp?.displayTps === 'number' ? sp.displayTps : null;
      const isRun = Boolean(data?.isRunning);
      $('spdPill').classList.toggle('running', isRun);
      $('spdText').textContent = tps !== null ? Math.round(tps) + ' tok/s' : isRun ? '生成中...' : '—';

      $('popSpdSamples').textContent = sp?.validSamples ? sp.validSamples + ' 次采样' : '';
      $('popSpdLatest').textContent = sp?.latestTps != null ? sp.latestTps.toFixed(1) + ' tok/s' : '—';
      $('popSpdAvg').textContent = sp?.sessionTps != null ? sp.sessionTps.toFixed(1) + ' tok/s' : '—';
      $('popSpdPeak').textContent = sp?.peakTps != null ? sp.peakTps.toFixed(1) + ' tok/s' : '—';
      $('popSpdTtft').textContent = sp?.avgTtft != null ? sp.avgTtft.toFixed(2) + ' s' : '—';
      $('popSpdTokens').textContent = sp
        ? compactNum(sp.responseTokens) + ' / ' + compactNum(sp.thinkingTokens)
        : '—';
      $('popSpdCache').textContent = sp?.cacheHitRate != null ? sp.cacheHitRate.toFixed(1) + '%' : '—';
    }

    function attach(c) {
      if (host.parentElement !== c.branch) {
        c.branch.append(host);
      }
      syncTheme();
    }

    attach(composer);

    let lastCid = undefined;
    let inflight = false;

    async function poll() {
      if (inflight || !host.isConnected) return;
      const cid = findConversationId(composer.box);
      if (cid !== lastCid) {
        lastCid = cid;
      }
      inflight = true;
      try {
        const res = await callHost('metrics', { conversationId: cid });
        if (res && res.ok) render(res);
      } finally {
        inflight = false;
      }
    }

    poll();

    return {
      host,
      attach,
      poll,
      syncTheme,
      get isRunning() { return Boolean(lastData?.isRunning); },
      dispose() {
        document.removeEventListener('click', onDocClick);
        host.remove();
      },
    };
  }

  function reconcile() {
    const composers = findComposers();
    const activeBoxes = new Set(composers.map((c) => c.box));

    for (const [box, w] of widgets) {
      if (!box.isConnected || !activeBoxes.has(box)) {
        w.dispose();
        widgets.delete(box);
      }
    }

    for (const c of composers) {
      let w = widgets.get(c.box);
      if (!w) {
        w = createWidget(c);
        widgets.set(c.box, w);
      } else {
        w.attach(c);
      }
    }
  }

  reconcile();

  let fastTick = 0;
  const pollTimer = setInterval(() => {
    reconcile();
    fastTick++;
    for (const w of widgets.values()) {
      if (w.isRunning || fastTick % 2 === 0) {
        w.poll();
      }
    }
  }, 1100);

  const domObs = new MutationObserver(() => {
    reconcile();
  });
  domObs.observe(document.body, { childList: true, subtree: true });

  const themeObs = new MutationObserver(() => {
    for (const w of widgets.values()) w.syncTheme();
  });
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
  themeObs.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });

  window.__agyChatMetricsInstalled = true;
  window.__agyChatMetricsDispose = () => {
    clearInterval(pollTimer);
    domObs.disconnect();
    themeObs.disconnect();
    for (const w of widgets.values()) w.dispose();
    widgets.clear();
    document.querySelectorAll('[' + BAR_ATTR + ']').forEach((el) => el.remove());
    delete window.__agyChatMetricsInstalled;
    delete window.__agyChatMetricsResolve;
  };
})();`;
}
