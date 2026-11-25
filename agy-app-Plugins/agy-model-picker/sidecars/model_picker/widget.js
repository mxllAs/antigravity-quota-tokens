// Self-contained Periodic Table model picker & reasoning effort slider injected via CDP.
export function buildPickerWidgetScript(bindingName = '__agyModelPickerCall') {
  return `(() => {
  const BINDING = ${JSON.stringify(bindingName)};
  const HOST_ATTR = 'data-agy-model-picker-overlay';
  const TRIGGER_SEL = '[data-testid="model-selector-trigger"]';
  const VIEW_STORAGE_KEY = 'agyModelPicker:viewMode:v2';
  const TIER_ORDER = ['Low', 'Medium', 'High', 'XHigh'];
  const TIER_META = {
    Low: { zh: '快速', hint: '低推理开销，响应最快' },
    Medium: { zh: '均衡', hint: '日常开发推荐强度' },
    High: { zh: '深度', hint: '复杂问题与深层推理' },
    XHigh: { zh: '极限', hint: '最大思考深度' },
  };

  // Periods 1-3 main-group (s + p block, 8 columns) + extensible Period 4+ support.
  const PERIODIC_SLOTS = [
    // Period 1
    { z: 1, symbol: 'H', name: 'Hydrogen', zh: '氢', period: 1, col: 1, family: 'nonmetal' },
    { z: 2, symbol: 'He', name: 'Helium', zh: '氦', period: 1, col: 8, family: 'noble' },
    // Period 2
    { z: 3, symbol: 'Li', name: 'Lithium', zh: '锂', period: 2, col: 1, family: 'alkali' },
    { z: 4, symbol: 'Be', name: 'Beryllium', zh: '铍', period: 2, col: 2, family: 'alkaline' },
    { z: 5, symbol: 'B', name: 'Boron', zh: '硼', period: 2, col: 3, family: 'metalloid' },
    { z: 6, symbol: 'C', name: 'Carbon', zh: '碳', period: 2, col: 4, family: 'carbon' },
    { z: 7, symbol: 'N', name: 'Nitrogen', zh: '氮', period: 2, col: 5, family: 'nonmetal' },
    { z: 8, symbol: 'O', name: 'Oxygen', zh: '氧', period: 2, col: 6, family: 'nonmetal' },
    { z: 9, symbol: 'F', name: 'Fluorine', zh: '氟', period: 2, col: 7, family: 'halogen' },
    { z: 10, symbol: 'Ne', name: 'Neon', zh: '氖', period: 2, col: 8, family: 'noble' },
    // Period 3
    { z: 11, symbol: 'Na', name: 'Sodium', zh: '钠', period: 3, col: 1, family: 'alkali' },
    { z: 12, symbol: 'Mg', name: 'Magnesium', zh: '镁', period: 3, col: 2, family: 'alkaline' },
    { z: 13, symbol: 'Al', name: 'Aluminum', zh: '铝', period: 3, col: 3, family: 'metal' },
    { z: 14, symbol: 'Si', name: 'Silicon', zh: '硅', period: 3, col: 4, family: 'metalloid' },
    { z: 15, symbol: 'P', name: 'Phosphorus', zh: '磷', period: 3, col: 5, family: 'nonmetal' },
    { z: 16, symbol: 'S', name: 'Sulfur', zh: '硫', period: 3, col: 6, family: 'nonmetal' },
    { z: 17, symbol: 'Cl', name: 'Chlorine', zh: '氯', period: 3, col: 7, family: 'halogen' },
    { z: 18, symbol: 'Ar', name: 'Argon', zh: '氩', period: 3, col: 8, family: 'argon' },
  ];

  const EXTRA_ELEMENTS = {
    aluminium: { z: 13, symbol: 'Al', name: 'Aluminium', zh: '铝', period: 3, col: 3, family: 'metal' },
    krypton: { z: 36, symbol: 'Kr', name: 'Krypton', zh: '氪', period: 4, col: 8, family: 'noble' },
    xenon: { z: 54, symbol: 'Xe', name: 'Xenon', zh: '氙', period: 5, col: 8, family: 'noble' },
    radon: { z: 86, symbol: 'Rn', name: 'Radon', zh: '氡', period: 6, col: 8, family: 'noble' },
    titanium: { z: 22, symbol: 'Ti', name: 'Titanium', zh: '钛', period: 4, col: 4, family: 'metal' },
  };

  const DESC_ZH_BY_EN = {
    'For most deep reasoning and complex problems': '主打深度推理与复杂工程问题',
    'The original Gemini 4 model for advanced workflows': '原版 Gemini 4，适合高阶复杂工作流',
    'For speed and efficiency in execution tasks': '主打高速响应与高效执行日常任务',
    'Neon that may offload routine steps to Hydrogen. Same Neon-level quality, fewer tokens used.': 'Neon 编排：常规步自动交由 Hydrogen，省额度不降质',
    'Argon that may offload routine steps to Hydrogen. Same Argon-level quality, fewer tokens used.': 'Argon 编排：常规步自动交由 Hydrogen，省额度不降质',
    'Gemini 4 Carbon is currently available to Ultra plan subscribers.': '当前仅面向 Ultra 订阅用户开放',
    'GPT-OSS will be removed from Antigravity on November 30, 2026.': '开源 120B 模型（2026/11/30 下线）',
  };

  const DESC_ZH_BY_BASE = {
    'Gemini 4 Hydrogen': '主打高速响应与高效执行日常任务',
    'Gemini 4 Carbon': '当前仅面向 Ultra 订阅用户开放',
    'Gemini 4 Neon': '主打深度推理与复杂工程问题',
    'Gemini 4 Argon': '原版 Gemini 4，适合高阶复杂工作流',
    'Orchestrator': '智能编排：自选主规划模型及推理强度，常规步骤自动分流提速',
    'Orchestrator (Neon)': 'Neon 编排：常规步自动交由 Hydrogen，省额度不降质',
    'Orchestrator (Argon)': 'Argon 编排：常规步自动交由 Hydrogen，省额度不降质',
    'Gemini 3.8 Flash': '轻量高速模型，适合快速低开销任务',
    'Claude Opus 5.5': 'Anthropic 旗舰，擅长复杂架构与深度分析',
    'Claude Sonnet 5.5': 'Anthropic 均衡主力，兼顾编码质量与速度',
    'GPT-OSS 120B': '开源 120B 模型（2026/11/30 下线）',
  };

  function localizeDescription(entry) {
    if (!entry) return '';
    if (entry.isUnifiedOrchestrator) {
      return DESC_ZH_BY_BASE['Orchestrator'];
    }
    const raw = String(entry.tagDescription || '').trim();
    if (raw && DESC_ZH_BY_EN[raw]) return DESC_ZH_BY_EN[raw];
    if (raw) {
      if (/available to Ultra plan/i.test(raw)) return '当前仅面向 Ultra 订阅用户开放';
      if (/offload routine steps to Hydrogen/i.test(raw)) return '智能编排：常规步交由 Hydrogen，兼顾质量与省额度';
      if (/will be removed from Antigravity/i.test(raw)) return '该模型即将从 Antigravity 下线';
    }
    if (DESC_ZH_BY_BASE[entry.baseName]) return DESC_ZH_BY_BASE[entry.baseName];
    return raw || '点击切换到该模型';
  }

  function formatBannerTitle(entry) {
    if (!entry) return 'Gemini 4 元素周期表';
    if (entry.isUnifiedOrchestrator) {
      const pName = entry.activePlannerEntry?.baseName;
      return pName ? ('Orchestrator · ' + pName) : 'Orchestrator';
    }
    if (entry.element) {
      return '#' + entry.element.z + ' ' + entry.baseName + (entry.element.zh ? (' · ' + entry.element.zh) : '');
    }
    return entry.baseName;
  }

  function isOrchestratorOpt(opt) {
    if (!opt) return false;
    return /^orchestrator/i.test(opt.label || '') || /orchestrator/i.test(opt.modelId || '');
  }

  function formatPlannerShortName(baseName) {
    return String(baseName || '')
      .replace(/^Gemini\\s+4\\s+/i, '')
      .replace(/^Claude\\s+/i, '')
      .trim() || baseName;
  }

  const ELEMENT_BY_NAME = new Map();
  for (const el of PERIODIC_SLOTS) ELEMENT_BY_NAME.set(el.name.toLowerCase(), el);
  for (const [k, el] of Object.entries(EXTRA_ELEMENTS)) ELEMENT_BY_NAME.set(k, el);

  const FAMILY_COLORS = {
    nonmetal: { accent: '#0ea5e9', soft: 'rgba(14, 165, 233, 0.14)' },
    carbon: { accent: '#8b5cf6', soft: 'rgba(139, 92, 246, 0.14)' },
    noble: { accent: '#10b981', soft: 'rgba(16, 185, 129, 0.14)' },
    argon: { accent: '#6366f1', soft: 'rgba(99, 102, 241, 0.14)' },
    halogen: { accent: '#f59e0b', soft: 'rgba(245, 158, 11, 0.14)' },
    metalloid: { accent: '#14b8a6', soft: 'rgba(20, 184, 166, 0.14)' },
    alkali: { accent: '#ef4444', soft: 'rgba(239, 68, 68, 0.14)' },
    alkaline: { accent: '#f97316', soft: 'rgba(249, 115, 22, 0.14)' },
    metal: { accent: '#6366f1', soft: 'rgba(99, 102, 241, 0.14)' },
  };

  if (window.__agyModelPickerDispose) {
    try { window.__agyModelPickerDispose(); } catch {}
  }

  const quotaPending = new Map();
  let quotaSeq = 0;
  let liveQuotaSnapshot = null;

  function callHostQuota() {
    return new Promise((resolve) => {
      if (typeof window[BINDING] !== 'function' || quotaPending.size >= 6) {
        return resolve(null);
      }
      const id = ++quotaSeq;
      const timer = setTimeout(() => {
        const cur = quotaPending.get(id);
        if (cur?.fallbackTimer) clearTimeout(cur.fallbackTimer);
        quotaPending.delete(id);
        resolve(cur?.fallbackData ?? null);
      }, 3000);
      quotaPending.set(id, { resolve, timer, fallbackTimer: null, fallbackData: null });
      try {
        window[BINDING](JSON.stringify({ id, type: 'quota' }));
      } catch {
        clearTimeout(timer);
        quotaPending.delete(id);
        resolve(null);
      }
    });
  }

  window.__agyModelPickerResolve = (id, data) => {
    const item = quotaPending.get(id);
    if (!item) return;
    if (!data || !data.ok) {
      if (!item.fallbackData) item.fallbackData = data;
      if (!item.fallbackTimer) {
        item.fallbackTimer = setTimeout(() => {
          const cur = quotaPending.get(id);
          if (!cur) return;
          clearTimeout(cur.timer);
          quotaPending.delete(id);
          cur.resolve(cur.fallbackData ?? null);
        }, 500);
      }
      return;
    }
    clearTimeout(item.timer);
    if (item.fallbackTimer) clearTimeout(item.fallbackTimer);
    quotaPending.delete(id);
    item.resolve(data);
  };

  function lookupLiveSummaryQuota(baseName) {
    if (!liveQuotaSnapshot?.ok || !baseName) return null;
    if (liveQuotaSnapshot.byModelBase && liveQuotaSnapshot.byModelBase[baseName]) {
      return liveQuotaSnapshot.byModelBase[baseName];
    }
    const groups = Array.isArray(liveQuotaSnapshot.groups) ? liveQuotaSnapshot.groups : [];
    const low = baseName.toLowerCase();
    if (low.includes('argon')) {
      return groups.find((g) => /argon/i.test(g.name)) || null;
    }
    if (low.includes('claude') || low.includes('gpt')) {
      return groups.find((g) => /claude|gpt/i.test(g.name)) || null;
    }
    if (low.includes('gemini') || low.includes('orchestrator')) {
      return groups.find((g) => /gemini\\s*models/i.test(g.name)) || null;
    }
    return null;
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function parseRgb(str) {
    const nums = (String(str || '').match(/[\\d.]+/g) || []).map(Number);
    if (nums.length < 3) return null;
    const scale = String(str).startsWith('color(') ? 1 : 255;
    return [nums[0] / scale, nums[1] / scale, nums[2] / scale, nums[3] ?? 1];
  }

  function readHostTheme() {
    const rootStyle = getComputedStyle(document.documentElement);
    const bodyStyle = getComputedStyle(document.body);
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

    const fg = pickVar('--foreground') || bodyStyle.color || (isLight ? '#1f2328' : '#e6edf3');
    const muted = pickVar('--muted-foreground') || (isLight ? 'rgba(31, 35, 40, 0.62)' : 'rgba(230, 237, 243, 0.62)');
    const cardBg = pickVar('--card', '--popover', '--background') || (isLight ? '#ffffff' : '#181b20');
    const border = pickVar('--border', '--card-border') || (isLight ? 'rgba(0, 0, 0, 0.11)' : 'rgba(255, 255, 255, 0.12)');
    const surface = isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)';
    const surfaceHover = isLight ? 'rgba(0, 0, 0, 0.075)' : 'rgba(255, 255, 255, 0.095)';
    const font = pickVar('--font-family', '--font-sans', '--ui-font-family') || bodyStyle.fontFamily || 'system-ui, sans-serif';
    return { isLight, fg, muted, cardBg, border, surface, surfaceHover, font };
  }

  function findModelContext(triggerBtn) {
    if (!triggerBtn) return null;
    const fk = Object.keys(triggerBtn).find((k) => k.startsWith('__reactFiber$'));
    if (!fk) return null;
    let cur = triggerBtn[fk];
    while (cur) {
      const p = cur.memoizedProps;
      const v = p && p.value;
      const candidate =
        v && typeof v === 'object' && Array.isArray(v.modelOptions) && typeof v.setSelectedModel === 'function'
          ? v
          : p && Array.isArray(p.modelOptions) && typeof p.setSelectedModel === 'function'
            ? p
            : null;
      if (candidate) return candidate;
      cur = cur.return;
    }
    return null;
  }

  function splitLabelTier(label) {
    const m = String(label || '').trim().match(/^(.+?)\\s*\\((Low|Medium|High|XHigh)\\)$/i);
    if (m) {
      const tierNorm = TIER_ORDER.find((t) => t.toLowerCase() === m[2].toLowerCase()) || m[2];
      return { baseName: m[1].trim(), tier: tierNorm };
    }
    return { baseName: String(label || '').trim(), tier: null };
  }

  function matchPeriodicElement(baseName) {
    // Do not classify Orchestrator (Neon/Argon) as pure Gemini 4 Periodic Element tiles.
    if (/^orchestrator/i.test(baseName)) return null;
    const m = baseName.match(/\\b([A-Za-z]+)\\b$/);
    if (m) {
      const hit = ELEMENT_BY_NAME.get(m[1].toLowerCase());
      if (hit) return hit;
    }
    for (const [k, el] of ELEMENT_BY_NAME.entries()) {
      if (new RegExp('\\\\b' + k + '\\\\b', 'i').test(baseName)) return el;
    }
    return null;
  }

  function collectGroupedModels(ctx) {
    const rawOptions = [];
    const seenKeys = new Set();

    const pushOpt = (opt) => {
      if (!opt || !opt.label) return;
      const key = String(opt.modelId || opt.value || opt.label);
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      rawOptions.push(opt);
    };

    if (Array.isArray(ctx.modelSorts)) {
      for (const sort of ctx.modelSorts) {
        if (!Array.isArray(sort?.groups)) continue;
        for (const grp of sort.groups) {
          if (!Array.isArray(grp?.options)) continue;
          for (const opt of grp.options) pushOpt(opt);
        }
      }
    }
    if (Array.isArray(ctx.modelOptions)) {
      for (const opt of ctx.modelOptions) pushOpt(opt);
    }

    function parseResetSec(rt) {
      if (!rt) return null;
      if (typeof rt === 'number') return rt > 1e11 ? Math.floor(rt / 1000) : Math.floor(rt);
      if (rt.seconds != null) return Number(rt.seconds);
      if (typeof rt === 'string') {
        const num = Number(rt);
        if (!isNaN(num) && num > 0) return num > 1e11 ? Math.floor(num / 1000) : Math.floor(num);
        const parsed = Date.parse(rt);
        if (!isNaN(parsed)) return Math.floor(parsed / 1000);
      }
      return null;
    }

    const byBase = new Map();
    for (const opt of rawOptions) {
      const { baseName, tier } = splitLabelTier(opt.label);
      let entry = byBase.get(baseName);
      const optQuota = typeof opt.quotaInfo?.remainingFraction === 'number' ? opt.quotaInfo.remainingFraction : null;
      const optReset = parseResetSec(opt.quotaInfo?.resetTime);

      if (!entry) {
        entry = {
          baseName,
          element: matchPeriodicElement(baseName),
          options: [],
          tiersByName: new Map(),
          allDisabled: true,
          tagTitle: opt.tagTitle || '',
          tagDescription: opt.tagDescription || '',
          quotaFraction: optQuota,
          resetTimeSeconds: optReset,
        };
        byBase.set(baseName, entry);
      }
      entry.options.push({ opt, tier });
      if (tier && !entry.tiersByName.has(tier)) {
        entry.tiersByName.set(tier, opt);
      }
      if (!opt.disabled) entry.allDisabled = false;
      if (!entry.tagTitle && opt.tagTitle) entry.tagTitle = opt.tagTitle;
      if (!entry.tagDescription && opt.tagDescription) entry.tagDescription = opt.tagDescription;
      if (entry.quotaFraction == null && optQuota != null) {
        entry.quotaFraction = optQuota;
      }
      if (entry.resetTimeSeconds == null && optReset != null) {
        entry.resetTimeSeconds = optReset;
      }
    }

    // Give priority to selectedModel's live quotaInfo if available
    if (ctx.selectedModel?.label && ctx.selectedModel?.quotaInfo) {
      const { baseName } = splitLabelTier(ctx.selectedModel.label);
      const entry = byBase.get(baseName);
      if (entry && typeof ctx.selectedModel.quotaInfo.remainingFraction === 'number') {
        entry.quotaFraction = ctx.selectedModel.quotaInfo.remainingFraction;
        const selReset = parseResetSec(ctx.selectedModel.quotaInfo.resetTime);
        if (selReset != null) entry.resetTimeSeconds = selReset;
      }
    }

    // Inspect userStatus clientModelConfigs for any missing quotaInfo
    const clientConfigs = ctx.userStatus?.cascadeModelConfigData?.clientModelConfigs;
    if (Array.isArray(clientConfigs)) {
      for (const cfg of clientConfigs) {
        if (!cfg?.label || !cfg?.quotaInfo) continue;
        const { baseName } = splitLabelTier(cfg.label);
        const entry = byBase.get(baseName);
        if (entry) {
          if (entry.quotaFraction == null && typeof cfg.quotaInfo.remainingFraction === 'number') {
            entry.quotaFraction = cfg.quotaInfo.remainingFraction;
          }
          if (entry.resetTimeSeconds == null) {
            const cfgReset = parseResetSec(cfg.quotaInfo.resetTime);
            if (cfgReset != null) entry.resetTimeSeconds = cfgReset;
          }
        }
      }
    }

    for (const entry of byBase.values()) {
      if (!entry.allDisabled && liveQuotaSnapshot?.ok) {
        const live = lookupLiveSummaryQuota(entry.baseName);
        if (live && typeof live.remainingFraction === 'number') {
          entry.quotaFraction = live.remainingFraction;
          if (live.resetTimeSeconds != null) {
            entry.resetTimeSeconds = live.resetTimeSeconds;
          }
        }
      }
      entry.tiers = TIER_ORDER
        .filter((t) => entry.tiersByName.has(t))
        .map((t) => ({ tier: t, opt: entry.tiersByName.get(t) }));
      entry.defaultOpt =
        entry.tiersByName.get('Medium') ||
        entry.tiersByName.get('High') ||
        entry.tiers[0]?.opt ||
        entry.options[0]?.opt;
    }

    const hasUnifiedOrch =
      Array.isArray(ctx.orchestratorPlanners) &&
      ctx.orchestratorPlanners.length > 0 &&
      typeof ctx.orchestratorPick?.select === 'function';

    if (hasUnifiedOrch) {
      // Find the primary Orchestrator model option from ctx.groups (or modelOptions).
      let primaryOrchOpt = null;
      if (Array.isArray(ctx.groups)) {
        for (const g of ctx.groups) {
          const hit = (g?.options || []).find((o) => isOrchestratorOpt(o) && !o.disabled);
          if (hit) { primaryOrchOpt = hit; break; }
        }
      }
      if (!primaryOrchOpt) {
        primaryOrchOpt = rawOptions.find((o) => isOrchestratorOpt(o) && !o.disabled) ||
          rawOptions.find((o) => isOrchestratorOpt(o)) || null;
      }

      if (primaryOrchOpt) {
        // Group ctx.orchestratorPlanners by base model name (e.g. Gemini 4 Neon, Gemini 4 Argon, Claude Opus 5.5).
        const plannerByBase = new Map();
        for (const pOpt of ctx.orchestratorPlanners) {
          if (!pOpt || !pOpt.label) continue;
          const { baseName: pBase, tier: pTier } = splitLabelTier(pOpt.label);
          let pEntry = plannerByBase.get(pBase);
          if (!pEntry) {
            const refEntry = byBase.get(pBase);
            const live = !pOpt.disabled && liveQuotaSnapshot?.ok ? lookupLiveSummaryQuota(pBase) : null;
            const qFrac = (live && typeof live.remainingFraction === 'number')
              ? live.remainingFraction
              : (refEntry?.quotaFraction ?? (typeof pOpt.quotaInfo?.remainingFraction === 'number' ? pOpt.quotaInfo.remainingFraction : null));
            const rSec = (live && live.resetTimeSeconds != null)
              ? live.resetTimeSeconds
              : (refEntry?.resetTimeSeconds ?? parseResetSec(pOpt.quotaInfo?.resetTime));
            pEntry = {
              baseName: pBase,
              shortName: formatPlannerShortName(pBase),
              element: matchPeriodicElement(pBase),
              options: [],
              tiersByName: new Map(),
              allDisabled: true,
              quotaFraction: qFrac,
              resetTimeSeconds: rSec,
            };
            plannerByBase.set(pBase, pEntry);
          }
          pEntry.options.push({ opt: pOpt, tier: pTier });
          if (pTier && !pEntry.tiersByName.has(pTier)) {
            pEntry.tiersByName.set(pTier, pOpt);
          }
          if (!pOpt.disabled) pEntry.allDisabled = false;
        }
        const planners = [];
        for (const pEntry of plannerByBase.values()) {
          pEntry.tiers = TIER_ORDER
            .filter((t) => pEntry.tiersByName.has(t))
            .map((t) => ({ tier: t, opt: pEntry.tiersByName.get(t) }));
          pEntry.defaultOpt =
            pEntry.tiersByName.get('Medium') ||
            pEntry.tiersByName.get('High') ||
            pEntry.tiers[0]?.opt ||
            pEntry.options[0]?.opt;
          planners.push(pEntry);
        }

        const pickedVal = Number(ctx.orchestratorPick?.model || 0);
        const livePlannerOpt =
          (pickedVal > 0 ? ctx.orchestratorPlanners.find((p) => p.value === pickedVal) : null) ||
          ctx.orchestratorDefaultPlanner ||
          ctx.orchestratorPlanners[0] ||
          null;
        const activePlannerOpt = optimisticState?.plannerOpt || livePlannerOpt;
        const { baseName: activePlannerBase, tier: activePlannerTier } = splitLabelTier(activePlannerOpt?.label || '');
        const activePlannerEntry = plannerByBase.get(activePlannerBase) || planners[0] || null;

        // Remove individual flat Orchestrator (...) entries and replace with unified 'Orchestrator'.
        for (const k of Array.from(byBase.keys())) {
          if (/^orchestrator/i.test(k)) byBase.delete(k);
        }

        const orchEntry = {
          baseName: 'Orchestrator',
          element: null,
          isUnifiedOrchestrator: true,
          primaryOrchOpt,
          planners,
          plannerByBase,
          activePlannerOpt,
          activePlannerEntry,
          activePlannerTier: activePlannerTier || null,
          options: [{ opt: primaryOrchOpt, tier: null }],
          tiersByName: activePlannerEntry?.tiersByName || new Map(),
          tiers: activePlannerEntry?.tiers || [],
          defaultOpt: primaryOrchOpt,
          allDisabled: Boolean(primaryOrchOpt.disabled),
          tagTitle: primaryOrchOpt.tagTitle || 'New',
          tagDescription: DESC_ZH_BY_BASE['Orchestrator'],
          quotaFraction: activePlannerEntry?.quotaFraction ?? (typeof primaryOrchOpt.quotaInfo?.remainingFraction === 'number' ? primaryOrchOpt.quotaInfo.remainingFraction : null),
          resetTimeSeconds: activePlannerEntry?.resetTimeSeconds ?? parseResetSec(primaryOrchOpt.quotaInfo?.resetTime),
        };
        byBase.set('Orchestrator', orchEntry);
      }
    }

    const elements = [];
    const companions = [];
    for (const entry of byBase.values()) {
      if (entry.element) elements.push(entry);
      else if (entry.isUnifiedOrchestrator) companions.unshift(entry);
      else companions.push(entry);
    }
    elements.sort((a, b) => a.element.z - b.element.z);

    return { elements, companions, byBase, hasUnifiedOrch };
  }

  function formatResetTime(sec) {
    if (!sec || !Number.isFinite(sec)) return '';
    const diffMs = sec * 1000 - Date.now();
    if (diffMs <= 0) return '即将重置';
    const totalMin = Math.round(diffMs / 60000);
    if (totalMin < 60) return totalMin + 'm 后重置';
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (hrs >= 24) {
      const days = Math.floor(hrs / 24);
      return days + 'd ' + (hrs % 24) + 'h 后重置';
    }
    return hrs + 'h ' + mins + 'm 后重置';
  }

  // Create persistent portal host (attached lazily when opened).
  const overlayHost = document.createElement('div');
  overlayHost.setAttribute(HOST_ATTR, '1');
  overlayHost.style.cssText = 'position:fixed;inset:0;z-index:99998;pointer-events:none;display:none;';
  const shadow = overlayHost.attachShadow({ mode: 'open' });

  shadow.innerHTML = \`
    <style>
      :host {
        --ag-fg: #1f2328;
        --ag-muted: rgba(31, 35, 40, 0.56);
        --ag-card: #ffffff;
        --ag-border: rgba(0, 0, 0, 0.09);
        --ag-surface: rgba(0, 0, 0, 0.032);
        --ag-surface-hover: rgba(0, 0, 0, 0.065);
        --ag-slider: #f07a38;
        --ag-accent: #f07a38;
        --ag-accent-text: #d95f1e;
        --ag-accent-soft: rgba(240, 122, 56, 0.11);
        --ag-accent-border: rgba(240, 122, 56, 0.65);
        --ag-font: system-ui, sans-serif;
        font-family: var(--ag-font);
        color: var(--ag-fg);
      }
      * { box-sizing: border-box; }
      .panel {
        position: fixed;
        pointer-events: auto;
        width: min(412px, calc(100vw - 16px));
        background: var(--ag-card);
        color: var(--ag-fg);
        border: 1px solid var(--ag-border);
        border-radius: 16px;
        box-shadow: 0 18px 44px rgba(0, 0, 0, 0.16), 0 2px 10px rgba(0, 0, 0, 0.06);
        padding: 13px 14px 12px;
        font-size: 12px;
        line-height: 1.35;
        user-select: none;
        animation: agPopIn 0.14s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes agPopIn {
        from { opacity: 0; transform: translateY(6px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .hdr {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 10px;
      }
      .hdr-left {
        display: flex;
        align-items: center;
        gap: 7px;
        min-width: 0;
      }
      .hdr-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 28px;
        padding: 0 6px;
        border-radius: 8px;
        font-weight: 800;
        font-size: 12px;
        background: var(--ag-accent-soft);
        color: var(--ag-accent-text);
        flex-shrink: 0;
      }
      .hdr-title-wrap {
        min-width: 0;
      }
      .hdr-title {
        font-weight: 700;
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .hdr-sub {
        font-size: 10.5px;
        color: var(--ag-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .hdr-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
      }
      .icon-btn {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        height: 25px;
        padding: 0 8px;
        border-radius: 7px;
        border: 1px solid transparent;
        background: var(--ag-surface);
        color: var(--ag-muted);
        font-family: inherit;
        font-size: 10.5px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
      }
      .icon-btn:hover {
        background: var(--ag-surface-hover);
        color: var(--ag-fg);
      }
      .icon-btn.loading {
        opacity: 0.7;
        cursor: wait;
        pointer-events: none;
      }
      .icon-btn:disabled {
        opacity: 0.42;
        cursor: not-allowed;
        pointer-events: none;
      }
      .readonly-banner {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 9px;
        margin-bottom: 8px;
        border-radius: 8px;
        border: 1px solid rgba(245, 158, 11, 0.32);
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
        font-size: 10.5px;
        font-weight: 600;
        transition: transform 0.15s ease, background 0.15s ease;
      }
      .readonly-banner.pulse {
        transform: scale(1.015);
        background: rgba(245, 158, 11, 0.2);
      }
      .ro-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #f59e0b;
        flex-shrink: 0;
        animation: agyRoPulse 1.4s ease-in-out infinite;
      }
      @keyframes agyRoPulse {
        0%, 100% { opacity: 0.45; transform: scale(0.85); }
        50% { opacity: 1; transform: scale(1.15); }
      }
      .panel.readonly .el-card,
      .panel.readonly .pt-cell.live,
      .panel.readonly .comp-btn,
      .panel.readonly .orch-chip {
        cursor: not-allowed;
      }
      .panel.readonly .el-card:hover,
      .panel.readonly .pt-cell.live:hover,
      .panel.readonly .orch-chip:hover {
        transform: none;
      }
      .panel.readonly .slider-box {
        opacity: 0.58;
      }
      .panel.readonly .slider-track-wrap,
      .panel.readonly .stop-btn {
        cursor: not-allowed;
      }
      .sec-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.03em;
        color: var(--ag-muted);
        margin: 4px 0 6px;
      }
      .el-cards-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 7px;
        margin-bottom: 11px;
      }
      .el-card {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 7px 9px 9px;
        border-radius: 11px;
        border: 1px solid var(--ag-border);
        background: var(--ag-surface);
        cursor: pointer;
        transition: transform 0.12s ease, border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
        min-height: 76px;
        overflow: hidden;
      }
      .el-card:hover:not(.disabled) {
        transform: translateY(-1px);
        background: var(--ag-surface-hover);
        border-color: var(--ag-muted);
      }
      .el-card.active {
        background: var(--ag-accent-soft);
        border-color: var(--ag-accent-border);
        box-shadow: 0 0 0 1px var(--ag-accent-border);
      }
      .el-card.disabled {
        opacity: 0.44;
        border-style: dashed;
        cursor: not-allowed;
      }
      .el-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 9.5px;
        font-weight: 600;
        color: var(--ag-muted);
        font-variant-numeric: tabular-nums;
      }
      .el-tag {
        font-size: 9px;
        color: var(--ag-muted);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }
      .el-card.active .el-tag {
        color: var(--ag-accent-text);
        font-weight: 700;
      }
      .el-sym {
        font-size: 21px;
        font-weight: 800;
        line-height: 1.1;
        letter-spacing: -0.02em;
        color: var(--ag-fg);
        margin: 3px 0 1px;
      }
      .el-card.active .el-sym {
        color: var(--ag-accent-text);
      }
      .el-name {
        font-size: 10px;
        font-weight: 500;
        color: var(--ag-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .el-card.active .el-name {
        color: var(--ag-fg);
        font-weight: 600;
      }
      .el-quota-bar {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 2px;
        background: rgba(128, 128, 128, 0.12);
      }
      .el-quota-fill {
        height: 100%;
        background: var(--ag-muted);
        opacity: 0.45;
        transition: width 0.25s ease, background 0.15s ease;
      }
      .el-card.active .el-quota-fill,
      .pt-cell.live.active .el-quota-fill {
        background: var(--ag-accent);
        opacity: 1;
      }

      /* 8-Column Periods 1-3 Scientific Periodic Table View */
      .pt-grid {
        display: grid;
        grid-template-columns: repeat(8, minmax(0, 1fr));
        gap: 4px;
        margin-bottom: 11px;
      }
      .pt-banner {
        grid-row: 1;
        grid-column: 2 / 8;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 4px 10px;
        border-radius: 9px;
        background: var(--ag-surface);
        min-width: 0;
      }
      .pt-banner-title {
        font-size: 11px;
        font-weight: 700;
        color: var(--ag-fg);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .pt-banner-desc {
        font-size: 9.5px;
        color: var(--ag-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 1px;
      }
      .pt-cell {
        position: relative;
        height: 46px;
        border-radius: 8px;
        border: 1px solid transparent;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2px;
        overflow: hidden;
      }
      .pt-cell.ghost {
        border-color: var(--ag-border);
        opacity: 0.22;
        cursor: default;
      }
      .pt-cell.live {
        border-color: var(--ag-border);
        background: var(--ag-surface);
        cursor: pointer;
        transition: transform 0.1s ease, border-color 0.14s ease, background 0.14s ease;
      }
      .pt-cell.live:hover:not(.disabled) {
        transform: translateY(-1px);
        border-color: var(--ag-muted);
        background: var(--ag-surface-hover);
      }
      .pt-cell.live.active {
        background: var(--ag-accent-soft);
        border-color: var(--ag-accent-border);
        box-shadow: 0 0 0 1px var(--ag-accent-border);
      }
      .pt-cell.live.disabled {
        opacity: 0.42;
        border-style: dashed;
        cursor: not-allowed;
      }
      .pt-z {
        position: absolute;
        top: 2px;
        left: 4px;
        font-size: 8px;
        font-weight: 600;
        color: var(--ag-muted);
        font-variant-numeric: tabular-nums;
      }
      .pt-sym {
        font-size: 14px;
        font-weight: 800;
        line-height: 1;
        margin-top: 4px;
        color: var(--ag-fg);
      }
      .pt-cell.live.active .pt-sym {
        color: var(--ag-accent-text);
      }
      .pt-cell.ghost .pt-sym {
        font-size: 11px;
        font-weight: 600;
        color: var(--ag-muted);
      }
      .pt-sub {
        font-size: 8px;
        color: var(--ag-muted);
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      .pt-cell.live.active .pt-sub {
        color: var(--ag-accent-text);
        font-weight: 600;
      }

      /* Companion non-element models inside unified soft tray */
      .comp-tray {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 3px;
        padding: 4px;
        border-radius: 11px;
        border: 1px solid var(--ag-border);
        background: var(--ag-surface);
        margin-bottom: 8px;
      }
      .comp-btn {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        padding: 6px 8px;
        border-radius: 8px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--ag-fg);
        font-family: inherit;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        text-align: left;
        transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
        min-width: 0;
      }
      .comp-btn:hover:not(.disabled) {
        background: var(--ag-surface-hover);
      }
      .comp-btn.active {
        background: var(--ag-accent-soft);
        border-color: var(--ag-accent-border);
        color: var(--ag-accent-text);
        font-weight: 600;
      }
      .comp-btn.disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .comp-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .comp-meta {
        font-size: 10px;
        font-weight: 500;
        color: var(--ag-muted);
        flex-shrink: 0;
        font-variant-numeric: tabular-nums;
      }
      .comp-btn.active .comp-meta {
        color: var(--ag-accent-text);
        font-weight: 600;
      }
      .comp-btn.comp-btn-full {
        grid-column: 1 / -1;
      }
      .comp-left {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }
      .comp-subpill {
        font-size: 9.5px;
        font-weight: 500;
        padding: 1px 6px;
        border-radius: 999px;
        background: var(--ag-surface-hover);
        color: var(--ag-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 175px;
      }
      .comp-btn.active .comp-subpill {
        background: rgba(240, 122, 56, 0.14);
        color: var(--ag-accent-text);
      }

      /* Unified Orchestrator planner selector */
      .orch-box {
        border-top: 1px solid var(--ag-border);
        padding-top: 8px;
        margin-bottom: 8px;
      }
      .orch-hdr {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 10.5px;
        margin-bottom: 6px;
      }
      .orch-hdr-title {
        font-weight: 700;
        color: var(--ag-fg);
      }
      .orch-hdr-hint {
        font-size: 10px;
        color: var(--ag-muted);
      }
      .orch-planners {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 4px;
      }
      .orch-chip {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 1px;
        padding: 6px 8px;
        border-radius: 9px;
        border: 1px solid var(--ag-border);
        background: var(--ag-surface);
        color: var(--ag-fg);
        font-family: inherit;
        cursor: pointer;
        text-align: left;
        transition: background 0.12s ease, border-color 0.12s ease, transform 0.1s ease;
        min-width: 0;
      }
      .orch-chip:hover:not(.disabled) {
        background: var(--ag-surface-hover);
        border-color: var(--ag-muted);
        transform: translateY(-1px);
      }
      .orch-chip.active {
        background: var(--ag-accent-soft);
        border-color: var(--ag-accent-border);
        box-shadow: 0 0 0 1px var(--ag-accent-border);
        color: var(--ag-accent-text);
      }
      .orch-chip.disabled {
        opacity: 0.42;
        cursor: not-allowed;
      }
      .orch-chip-name {
        font-size: 11px;
        font-weight: 700;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .orch-chip-meta {
        font-size: 9.5px;
        color: var(--ag-muted);
        font-variant-numeric: tabular-nums;
      }
      .orch-chip.active .orch-chip-meta {
        color: var(--ag-accent-text);
        font-weight: 600;
      }

      /* Info banner & Effort Slider */
      .info-strip {
        font-size: 10px;
        color: var(--ag-muted);
        opacity: 0.85;
        margin: 0 2px 8px;
        min-height: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .slider-box {
        border-top: 1px solid var(--ag-border);
        padding-top: 9px;
      }
      .slider-hdr {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .slider-label {
        font-size: 11px;
        font-weight: 700;
        color: var(--ag-fg);
      }
      .slider-val {
        font-size: 11px;
        font-weight: 700;
        color: var(--ag-slider);
      }
      .slider-track-wrap {
        --sl-r: 16px;
        --sl-spring: cubic-bezier(0.34, 1.4, 0.64, 1);
        position: relative;
        height: 40px;
        display: flex;
        align-items: center;
        cursor: pointer;
        touch-action: none;
        outline: none;
      }
      .slider-track {
        position: relative;
        width: 100%;
        height: 32px;
        border-radius: 999px;
        background: var(--ag-surface-hover);
        overflow: hidden;
      }
      .slider-fill {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        border-radius: 999px;
        background: #f07a38;
        transition: width 0.42s var(--sl-spring);
      }
      .slider-dots {
        position: absolute;
        inset: 0;
      }
      .slider-dot {
        position: absolute;
        top: 50%;
        width: 4.5px;
        height: 4.5px;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        background: var(--ag-muted);
        opacity: 0.42;
        pointer-events: none;
        z-index: 1;
        transition: background 0.2s ease, opacity 0.2s ease;
      }
      .slider-dot.filled {
        background: rgba(255, 255, 255, 0.58);
        opacity: 1;
      }
      .slider-thumb {
        position: absolute;
        top: 50%;
        width: 28px;
        height: 28px;
        margin-top: -14px;
        margin-left: -14px;
        border-radius: 50%;
        background: #ffffff;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.14);
        transition: left 0.42s var(--sl-spring), transform 0.28s var(--sl-spring);
        pointer-events: none;
        z-index: 2;
      }
      .slider-track-wrap:hover .slider-thumb {
        transform: scale(1.03);
      }
      .slider-track-wrap.dragging .slider-fill,
      .slider-track-wrap.dragging .slider-thumb {
        transition: none;
      }
      .slider-track-wrap.dragging .slider-thumb {
        transform: scale(0.95);
      }
      .slider-stops {
        position: relative;
        height: 20px;
        margin-top: 4px;
      }
      .stop-btn {
        position: absolute;
        top: 0;
        border: none;
        background: transparent;
        color: var(--ag-muted);
        font-family: inherit;
        font-size: 10.5px;
        font-weight: 600;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 4px;
        white-space: nowrap;
        transition: color 0.12s ease, background 0.12s ease;
      }
      .stop-btn:hover:not(:disabled) {
        color: var(--ag-fg);
        background: var(--ag-surface);
      }
      .stop-btn.active {
        color: var(--ag-slider);
        font-weight: 700;
      }
      .stop-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .slider-fixed {
        font-size: 11px;
        color: var(--ag-muted);
        background: var(--ag-surface);
        border-radius: 8px;
        padding: 7px 10px;
        text-align: center;
      }
      .ftr-tip {
        margin-top: 8px;
        font-size: 9.5px;
        color: var(--ag-muted);
        text-align: center;
        opacity: 0.8;
      }
    </style>
    <div class="panel" role="dialog" aria-label="Periodic Model Picker"></div>
  \`;

  const panel = shadow.querySelector('.panel');
  let activeBtn = null;
  let hoveredNote = '';
  let optimisticState = null;
  let btnObserver = null;
  let viewMode = 'cards';
  try {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    if (saved === 'cards' || saved === 'pt') viewMode = saved;
  } catch {}

  function applyTheme() {
    const t = readHostTheme();
    overlayHost.style.setProperty('--ag-fg', t.fg);
    overlayHost.style.setProperty('--ag-muted', t.muted);
    overlayHost.style.setProperty('--ag-card', t.cardBg);
    overlayHost.style.setProperty('--ag-border', t.border);
    overlayHost.style.setProperty('--ag-surface', t.surface);
    overlayHost.style.setProperty('--ag-surface-hover', t.surfaceHover);
    overlayHost.style.setProperty('--ag-font', t.font);
    overlayHost.style.setProperty('--ag-accent-text', t.isLight ? '#d95f1e' : '#fb923c');
    overlayHost.style.setProperty('--ag-accent-soft', t.isLight ? 'rgba(240, 122, 56, 0.11)' : 'rgba(240, 122, 56, 0.16)');
  }

  function positionPanel() {
    if (!activeBtn || !activeBtn.isConnected) {
      closePicker();
      return;
    }
    const r = activeBtn.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    const pw = panel.offsetWidth || 408;
    const ph = panel.offsetHeight || 340;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - pw - 8));
    panel.style.left = left + 'px';

    if (r.top >= ph + 14) {
      panel.style.top = 'auto';
      panel.style.bottom = (window.innerHeight - r.top + 8) + 'px';
    } else {
      panel.style.bottom = 'auto';
      panel.style.top = Math.min(window.innerHeight - ph - 8, r.bottom + 8) + 'px';
    }
  }

  function detachBtnObserver() {
    if (btnObserver) {
      try { btnObserver.disconnect(); } catch {}
      btnObserver = null;
    }
  }

  let autoRefreshTimer = null;

  function stopAutoRefresh() {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer);
      autoRefreshTimer = null;
    }
  }

  function triggerQuotaRefresh(ctx) {
    const liveCtx = findModelContext(activeBtn) || ctx;
    const tasks = [];
    if (liveCtx && typeof liveCtx.refreshModels === 'function') {
      tasks.push(
        Promise.resolve(liveCtx.refreshModels()).catch(() => {})
      );
    }
    tasks.push(
      callHostQuota().then((snap) => {
        if (snap && snap.ok) {
          liveQuotaSnapshot = snap;
          if (overlayHost.style.display === 'block') {
            render();
          }
        }
      }).catch(() => {})
    );
    return Promise.all(tasks).then(() => {
      if (overlayHost.style.display === 'block') {
        render();
      }
    });
  }

  function startAutoRefresh(ctx) {
    stopAutoRefresh();
    autoRefreshTimer = setInterval(() => {
      if (overlayHost.style.display !== 'block' || !activeBtn) {
        stopAutoRefresh();
        return;
      }
      triggerQuotaRefresh(ctx);
    }, 10000);
  }

  function closePicker() {
    stopAutoRefresh();
    detachBtnObserver();
    if (overlayHost.style.display === 'none') return;
    overlayHost.style.display = 'none';
    activeBtn = null;
    hoveredNote = '';
    optimisticState = null;
  }

  function openNativeMenu(btn) {
    const ctx = findModelContext(btn);
    closePicker();
    if (ctx && typeof ctx.setIsOpen === 'function') {
      ctx.setIsOpen(true);
    }
  }

  function isPickerReadOnly(btn, ctx) {
    if (!btn) return false;
    if (btn.disabled || btn.getAttribute('aria-disabled') === 'true' || btn.hasAttribute('data-disabled')) {
      return true;
    }
    if (typeof ctx?.disabledReason === 'string' && ctx.disabledReason.trim()) {
      return true;
    }
    return false;
  }

  function pulseReadOnlyBanner() {
    const b = panel.querySelector('.readonly-banner');
    if (!b) return;
    b.classList.remove('pulse');
    void b.offsetWidth;
    b.classList.add('pulse');
    setTimeout(() => b.classList.remove('pulse'), 240);
  }

  function applySelectedOption(ctx, targetOpt) {
    if (!targetOpt || targetOpt.disabled) return;
    const liveCtx = findModelContext(activeBtn) || ctx;
    if (isPickerReadOnly(activeBtn, liveCtx)) {
      pulseReadOnlyBanner();
      return;
    }
    if (!liveCtx || typeof liveCtx.setSelectedModel !== 'function') return;
    optimisticState = { opt: targetOpt, plannerOpt: null, until: Date.now() + 450 };
    panel._settleUntil = 0;
    liveCtx.setSelectedModel(targetOpt);
    render();
    setTimeout(() => render(), 60);
    setTimeout(() => render(), 180);
  }

  function applyOrchestratorPick(ctx, orchEntry, targetPlannerOpt, keepSettle) {
    const liveCtx = findModelContext(activeBtn) || ctx;
    if (isPickerReadOnly(activeBtn, liveCtx)) {
      pulseReadOnlyBanner();
      return;
    }
    if (!liveCtx || typeof liveCtx.setSelectedModel !== 'function') return;
    const orchOpt = (isOrchestratorOpt(liveCtx.selectedModel) && !liveCtx.selectedModel.disabled)
      ? liveCtx.selectedModel
      : orchEntry?.primaryOrchOpt;
    if (!orchOpt || orchOpt.disabled) return;

    const plannerOpt = targetPlannerOpt || orchEntry?.activePlannerOpt || null;
    if (plannerOpt && typeof liveCtx.orchestratorPick?.select === 'function') {
      const defVal = liveCtx.orchestratorDefaultPlanner?.value;
      liveCtx.orchestratorPick.select(plannerOpt.value === defVal ? 0 : plannerOpt.value);
    }
    optimisticState = { opt: orchOpt, plannerOpt, until: Date.now() + 500 };
    if (!keepSettle) panel._settleUntil = 0;
    liveCtx.setSelectedModel(orchOpt);
    if (!keepSettle) {
      render();
      setTimeout(() => render(), 60);
      setTimeout(() => render(), 180);
    }
  }

  function selectOrchestratorPlanner(ctx, orchEntry, plannerEntry) {
    if (!orchEntry || !plannerEntry || plannerEntry.allDisabled) return;
    const curTier = orchEntry.activePlannerTier;
    let targetOpt = null;
    if (curTier && plannerEntry.tiersByName.has(curTier) && !plannerEntry.tiersByName.get(curTier).disabled) {
      targetOpt = plannerEntry.tiersByName.get(curTier);
    } else if (curTier && plannerEntry.tiers.length) {
      const wantIdx = TIER_ORDER.indexOf(curTier);
      const enabledTiers = plannerEntry.tiers.filter((x) => !x.opt.disabled);
      enabledTiers.sort((a, b) => Math.abs(TIER_ORDER.indexOf(a.tier) - wantIdx) - Math.abs(TIER_ORDER.indexOf(b.tier) - wantIdx));
      targetOpt = enabledTiers[0]?.opt || plannerEntry.defaultOpt;
    } else {
      targetOpt = plannerEntry.defaultOpt;
    }
    applyOrchestratorPick(ctx, orchEntry, targetOpt, false);
    triggerQuotaRefresh(ctx);
  }

  function selectBaseEntry(ctx, entry, currentTier) {
    if (!entry || entry.allDisabled) {
      hoveredNote = localizeDescription(entry) || (entry?.baseName + ' 当前不可用');
      render();
      triggerQuotaRefresh(ctx);
      return;
    }
    if (entry.isUnifiedOrchestrator) {
      applyOrchestratorPick(ctx, entry, entry.activePlannerOpt, false);
      triggerQuotaRefresh(ctx);
      return;
    }
    let targetOpt = null;
    if (currentTier && entry.tiersByName.has(currentTier) && !entry.tiersByName.get(currentTier).disabled) {
      targetOpt = entry.tiersByName.get(currentTier);
    } else if (currentTier && entry.tiers.length) {
      // Preserve effort closeness when switching from e.g. XHigh (Neon) -> Argon (max High).
      const wantIdx = TIER_ORDER.indexOf(currentTier);
      const enabledTiers = entry.tiers.filter((x) => !x.opt.disabled);
      enabledTiers.sort((a, b) => Math.abs(TIER_ORDER.indexOf(a.tier) - wantIdx) - Math.abs(TIER_ORDER.indexOf(b.tier) - wantIdx));
      targetOpt = enabledTiers[0]?.opt || entry.defaultOpt;
    } else {
      targetOpt = entry.defaultOpt;
    }

    applySelectedOption(ctx, targetOpt);
    triggerQuotaRefresh(ctx);
  }

  function render() {
    if (!activeBtn || !activeBtn.isConnected || overlayHost.style.display === 'none') return;
    // Let the slider's spring animation finish before rebuilding the panel DOM.
    const settleLeft = (panel._settleUntil || 0) - Date.now();
    if (settleLeft > 0) {
      clearTimeout(panel._settleTimer);
      panel._settleTimer = setTimeout(() => render(), settleLeft + 20);
      return;
    }
    const ctx = findModelContext(activeBtn);
    if (!ctx) {
      closePicker();
      return;
    }

    if (optimisticState) {
      const modelMatched = ctx.selectedModel?.value === optimisticState.opt.value;
      const plannerMatched = !optimisticState.plannerOpt || (() => {
        const picked = Number(ctx.orchestratorPick?.model || 0);
        const effVal = picked > 0 ? picked : ctx.orchestratorDefaultPlanner?.value;
        return effVal === optimisticState.plannerOpt.value;
      })();
      if ((modelMatched && plannerMatched) || Date.now() > optimisticState.until) {
        optimisticState = null;
      }
    }
    const effectiveSelected = optimisticState ? optimisticState.opt : ctx.selectedModel;

    const { elements, companions, byBase, hasUnifiedOrch } = collectGroupedModels(ctx);
    const selLabel = effectiveSelected?.label || '';
    const splitSel = splitLabelTier(selLabel);
    const isOrchSelected = hasUnifiedOrch && isOrchestratorOpt(effectiveSelected) && byBase.has('Orchestrator');
    const activeBaseName = isOrchSelected ? 'Orchestrator' : splitSel.baseName;
    const activeEntry = byBase.get(activeBaseName) || elements[0] || companions[0] || null;
    const activeTier = activeEntry?.isUnifiedOrchestrator ? activeEntry.activePlannerTier : splitSel.tier;
    const sliderSelectedVal = activeEntry?.isUnifiedOrchestrator ? activeEntry.activePlannerOpt?.value : effectiveSelected?.value;
    const activeElMeta = activeEntry?.element;

    const quotaPct = activeEntry?.quotaFraction != null ? Math.round(activeEntry.quotaFraction * 100) + '%' : '—';
    const resetText = formatResetTime(activeEntry?.resetTimeSeconds);
    const subLine = [
      quotaPct !== '—' ? ('配额 ' + quotaPct) : '',
      resetText,
    ].filter(Boolean).join(' · ') || (activeTier ? ('强度 ' + activeTier) : '标准模式');

    const hdrTitle = activeEntry?.isUnifiedOrchestrator && activeEntry.activePlannerEntry
      ? ('Orchestrator · ' + activeEntry.activePlannerEntry.shortName)
      : (activeEntry?.baseName || selLabel || '选择模型');

    const elementGridHtml = viewMode === 'pt'
      ? renderPeriodicGrid(elements, activeBaseName, activeEntry)
      : renderElementCards(elements, activeBaseName);

    const compHtml = companions.map((entry) => {
      const isActive = entry.baseName === activeBaseName;
      const pct = entry.quotaFraction != null ? Math.round(entry.quotaFraction * 100) + '%' : '';
      if (entry.isUnifiedOrchestrator) {
        const pShort = entry.activePlannerEntry?.shortName || '';
        const pTier = entry.activePlannerTier || '';
        const pillText = [pShort, pTier].filter(Boolean).join(' · ');
        return \`
          <button type="button" class="comp-btn comp-btn-full \${isActive ? 'active' : ''} \${entry.allDisabled ? 'disabled' : ''}" data-base="Orchestrator">
            <span class="comp-left">
              <span class="comp-name">Orchestrator</span>
              \${pillText ? \`<span class="comp-subpill">\${esc(pillText)}</span>\` : ''}
            </span>
            <span class="comp-meta">\${esc(pct || 'Agent')}</span>
          </button>
        \`;
      }
      const shortName = entry.baseName.replace(/^GPT-OSS 120B$/i, 'GPT-OSS 120B');
      const fallbackBadge = entry.baseName.startsWith('Orchestrator') ? 'Agent' : (entry.tiers.length > 1 ? entry.tiers.length + '档' : '固定');
      return \`
        <button type="button" class="comp-btn \${isActive ? 'active' : ''} \${entry.allDisabled ? 'disabled' : ''}" data-base="\${esc(entry.baseName)}">
          <span class="comp-name">\${esc(shortName)}</span>
          <span class="comp-meta">\${esc(pct || fallbackBadge)}</span>
        </button>
      \`;
    }).join('');

    const activeDesc = hoveredNote || localizeDescription(activeEntry);
    const orchPlannersHtml = activeEntry?.isUnifiedOrchestrator ? renderOrchestratorPlanners(activeEntry) : '';
    const sliderHtml = renderSliderSection(activeEntry, activeTier, sliderSelectedVal);
    const readOnly = isPickerReadOnly(activeBtn, ctx);
    panel.classList.toggle('readonly', readOnly);

    panel.innerHTML = \`
      <div class="hdr">
        <div class="hdr-left">
          <div class="hdr-badge">
            \${esc(activeElMeta ? activeElMeta.symbol : (activeBaseName.startsWith('Orchestrator') ? 'OR' : 'AI'))}
          </div>
          <div class="hdr-title-wrap">
            <div class="hdr-title">\${esc(hdrTitle)}</div>
            <div class="hdr-sub">\${esc(subLine)}</div>
          </div>
        </div>
        <div class="hdr-actions">
          <button type="button" class="icon-btn" data-act="toggle-view" title="切换 元素卡片 / 周期表视图">
            \${viewMode === 'pt' ? '卡片' : '周期表'}
          </button>
          <button type="button" class="icon-btn" data-act="refresh" title="刷新配额与模型列表">刷新</button>
          <button type="button" class="icon-btn" data-act="native" \${readOnly ? 'disabled title="Agent 运行中暂不可打开原生菜单"' : 'title="打开 Antigravity 原生菜单 (含 View Usage)"'}>原生</button>
        </div>
      </div>

      \${readOnly ? \`<div class="readonly-banner"><span class="ro-dot"></span><span>Agent 运行中 · 仅查看配额（结束后自动解锁）</span></div>\` : ''}

      <div class="sec-label">
        <span>Gemini 4 元素</span>
        <span>\${viewMode === 'pt' ? 'Periods 1–3' : '按原子序数'}</span>
      </div>
      \${elementGridHtml}

      \${companions.length ? \`
        <div class="sec-label">
          <span>其他模型</span>
          <span>剩余配额</span>
        </div>
        <div class="comp-tray">\${compHtml}</div>
      \` : ''}

      \${activeDesc && viewMode !== 'pt' ? \`<div class="info-strip">\${esc(activeDesc)}</div>\` : ''}
      \${orchPlannersHtml}
      \${sliderHtml}
      <div class="ftr-tip">\${readOnly ? '运行中仅支持查看与刷新配额 · 完成后自动恢复切换' : '双击模型直接关闭 · 右键或 Shift+点击按钮打开原生菜单'}</div>
    \`;

    wirePanelEvents(ctx, byBase, activeEntry, activeTier, effectiveSelected, sliderSelectedVal, readOnly);
    positionPanel();
    requestAnimationFrame(() => positionPanel());
  }

  function renderOrchestratorPlanners(orchEntry) {
    const planners = Array.isArray(orchEntry?.planners) ? orchEntry.planners : [];
    if (!planners.length) return '';
    const activeBase = orchEntry.activePlannerEntry?.baseName || '';
    const chips = planners.map((p) => {
      const isAct = p.baseName === activeBase;
      const pct = p.quotaFraction != null ? Math.round(p.quotaFraction * 100) + '%' : '';
      const prefix = p.element ? (p.element.symbol + ' · ') : '';
      return \`
        <button type="button" class="orch-chip \${isAct ? 'active' : ''} \${p.allDisabled ? 'disabled' : ''}" data-orch-planner="\${esc(p.baseName)}">
          <span class="orch-chip-name">\${esc(prefix + p.shortName)}</span>
          <span class="orch-chip-meta">\${esc(pct || (p.tiers.length + '档'))}</span>
        </button>
      \`;
    }).join('');
    return \`
      <div class="orch-box">
        <div class="orch-hdr">
          <span class="orch-hdr-title">规划模型 (Planner)</span>
          <span class="orch-hdr-hint">点击切换编排主力</span>
        </div>
        <div class="orch-planners">\${chips}</div>
      </div>
    \`;
  }

  function renderElementCards(elements, activeBaseName) {
    return '<div class="el-cards-grid">' + elements.map((entry) => {
      const el = entry.element;
      const isActive = entry.baseName === activeBaseName;
      const pct = entry.quotaFraction != null ? Math.round(entry.quotaFraction * 100) : null;
      const tag = entry.allDisabled ? 'Ultra' : (pct !== null ? (pct + '%') : ('P' + el.period));
      return \`
        <div class="el-card \${isActive ? 'active' : ''} \${entry.allDisabled ? 'disabled' : ''}"
             data-base="\${esc(entry.baseName)}">
          <div class="el-top">
            <span>\${String(el.z).padStart(2, '0')}</span>
            <span class="el-tag">\${esc(tag)}</span>
          </div>
          <div class="el-sym">\${esc(el.symbol)}</div>
          <div class="el-name">\${esc(el.name)}</div>
          <div class="el-quota-bar">
            <div class="el-quota-fill" style="width:\${entry.allDisabled ? 0 : (pct ?? 100)}%"></div>
          </div>
        </div>
      \`;
    }).join('') + '</div>';
  }

  function renderPeriodicGrid(elements, activeBaseName, activeEntry) {
    const liveByZ = new Map();
    const extras = [];
    for (const entry of elements) {
      if (entry.element.period <= 3) liveByZ.set(entry.element.z, entry);
      else extras.push(entry);
    }

    const bannerTitle = formatBannerTitle(activeEntry);
    const bannerDesc = hoveredNote || localizeDescription(activeEntry) || '点击高亮元素切换模型';
    const bannerHtml = \`
      <div class="pt-banner">
        <div class="pt-banner-title">\${esc(bannerTitle)}</div>
        <div class="pt-banner-desc">\${esc(bannerDesc)}</div>
      </div>
    \`;

    const cells = PERIODIC_SLOTS.map((slot) => {
      const entry = liveByZ.get(slot.z);
      const posStyle = \`grid-row:\${slot.period};grid-column:\${slot.col};\`;
      if (!entry) {
        return \`
          <div class="pt-cell ghost" style="\${posStyle}" title="\${esc(slot.z + ' ' + slot.name)}">
            <span class="pt-z">\${slot.z}</span>
            <span class="pt-sym">\${esc(slot.symbol)}</span>
          </div>
        \`;
      }
      const isActive = entry.baseName === activeBaseName;
      const pct = entry.quotaFraction != null ? Math.round(entry.quotaFraction * 100) : null;
      const subText = entry.allDisabled ? 'Ultra' : (pct !== null ? pct + '%' : slot.name);
      return \`
        <div class="pt-cell live \${isActive ? 'active' : ''} \${entry.allDisabled ? 'disabled' : ''}"
             data-base="\${esc(entry.baseName)}"
             style="\${posStyle}">
          <span class="pt-z">\${slot.z}</span>
          <span class="pt-sym">\${esc(slot.symbol)}</span>
          <span class="pt-sub">\${esc(subText)}</span>
          <div class="el-quota-bar">
            <div class="el-quota-fill" style="width:\${entry.allDisabled ? 0 : (pct ?? 100)}%"></div>
          </div>
        </div>
      \`;
    }).join('');

    const extraRow = extras.length ? renderElementCards(extras, activeBaseName) : '';
    return '<div class="pt-grid">' + bannerHtml + cells + '</div>' + extraRow;
  }

  function sliderPosCss(ratio) {
    return 'calc(16px + (100% - 32px) * ' + ratio + ')';
  }

  function sliderFillCss(ratio) {
    return 'calc(32px + (100% - 32px) * ' + ratio + ')';
  }

  function renderSliderSection(activeEntry, activeTier, selectedValue) {
    if (!activeEntry || activeEntry.tiers.length <= 1) {
      const note = activeEntry?.options[0]?.opt?.label || '固定推理强度';
      return \`
        <div class="slider-box">
          <div class="slider-hdr">
            <span class="slider-label">推理强度</span>
            <span class="slider-val" style="color:var(--ag-muted);">固定配置</span>
          </div>
          <div class="slider-fixed">\${esc(note)}（该模型无多档可调强度）</div>
        </div>
      \`;
    }

    const tiers = activeEntry.tiers;
    let activeIdx = tiers.findIndex((t) => t.tier === activeTier || t.opt.value === selectedValue);
    if (activeIdx < 0) activeIdx = 0;
    const ratio = tiers.length > 1 ? activeIdx / (tiers.length - 1) : 0;
    const thumbLeft = sliderPosCss(ratio);
    const fillWidth = sliderFillCss(ratio);

    const dots = tiers.map((_, i) => {
      const r = i / (tiers.length - 1);
      return \`<span class="slider-dot \${i <= activeIdx ? 'filled' : ''}" style="left:\${sliderPosCss(r)}"></span>\`;
    }).join('');

    const stops = tiers.map((t, i) => {
      const r = i / (tiers.length - 1);
      const posStyle = i === 0
        ? 'left:0;'
        : i === tiers.length - 1
          ? 'right:0;'
          : \`left:\${sliderPosCss(r)};transform:translateX(-50%);\`;
      return \`
        <button type="button" class="stop-btn \${i === activeIdx ? 'active' : ''}" data-tier-idx="\${i}" style="\${posStyle}" \${t.opt.disabled ? 'disabled' : ''}>
          \${esc(t.tier)}
        </button>
      \`;
    }).join('');

    return \`
      <div class="slider-box">
        <div class="slider-hdr">
          <span class="slider-label">推理强度</span>
        </div>
        <div class="slider-track-wrap" data-slider-track="1" data-ratio="\${ratio}" data-key="\${esc(activeEntry.baseName)}" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="\${tiers.length - 1}" aria-valuenow="\${activeIdx}">
          <div class="slider-track">
            <div class="slider-fill" style="width:\${fillWidth}"></div>
            <div class="slider-dots">\${dots}</div>
            <div class="slider-thumb" style="left:\${thumbLeft}"></div>
          </div>
        </div>
        <div class="slider-stops">\${stops}</div>
      </div>
    \`;
  }

  function wirePanelEvents(ctx, byBase, activeEntry, activeTier, effectiveSelected, sliderSelectedVal, readOnly) {
    panel.querySelector('[data-act="toggle-view"]')?.addEventListener('click', () => {
      viewMode = viewMode === 'pt' ? 'cards' : 'pt';
      try { localStorage.setItem(VIEW_STORAGE_KEY, viewMode); } catch {}
      panel._settleUntil = 0;
      render();
    });
    panel.querySelector('[data-act="refresh"]')?.addEventListener('click', async (ev) => {
      const btn = ev.currentTarget;
      if (btn.classList.contains('loading')) return;
      btn.classList.add('loading');
      btn.textContent = '刷新中…';
      try {
        await triggerQuotaRefresh(ctx);
      } finally {
        if (overlayHost.style.display === 'block') {
          render();
        }
      }
    });
    panel.querySelector('[data-act="native"]')?.addEventListener('click', () => {
      if (readOnly) {
        pulseReadOnlyBanner();
        return;
      }
      if (activeBtn) openNativeMenu(activeBtn);
    });

    for (const node of panel.querySelectorAll('[data-base]')) {
      const base = node.getAttribute('data-base');
      const entry = byBase.get(base);
      if (!entry) continue;
      node.addEventListener('mouseenter', () => {
        const desc = localizeDescription(entry);
        hoveredNote = desc;
        const strip = panel.querySelector('.info-strip');
        if (strip && desc) strip.textContent = desc;
        const bt = panel.querySelector('.pt-banner-title');
        const bd = panel.querySelector('.pt-banner-desc');
        if (bt) bt.textContent = formatBannerTitle(entry);
        if (bd) bd.textContent = desc;
      });
      node.addEventListener('mouseleave', () => {
        hoveredNote = '';
        const activeDesc = localizeDescription(activeEntry);
        const strip = panel.querySelector('.info-strip');
        if (strip) strip.textContent = activeDesc;
        const bt = panel.querySelector('.pt-banner-title');
        const bd = panel.querySelector('.pt-banner-desc');
        if (bt) bt.textContent = formatBannerTitle(activeEntry);
        if (bd) bd.textContent = activeDesc || '点击高亮元素切换模型';
      });
      node.addEventListener('click', () => {
        if (readOnly) {
          pulseReadOnlyBanner();
          return;
        }
        selectBaseEntry(ctx, entry, activeTier);
      });
      node.addEventListener('dblclick', () => {
        if (!readOnly && !entry.allDisabled) closePicker();
      });
    }

    if (activeEntry?.isUnifiedOrchestrator && activeEntry.plannerByBase) {
      for (const chip of panel.querySelectorAll('[data-orch-planner]')) {
        const pBase = chip.getAttribute('data-orch-planner');
        const pEntry = activeEntry.plannerByBase.get(pBase);
        if (!pEntry) continue;
        chip.addEventListener('click', () => {
          if (readOnly) {
            pulseReadOnlyBanner();
            return;
          }
          selectOrchestratorPlanner(ctx, activeEntry, pEntry);
        });
        chip.addEventListener('dblclick', () => {
          if (!readOnly && !pEntry.allDisabled) closePicker();
        });
      }
    }

    if (readOnly) {
      for (const btn of panel.querySelectorAll('[data-tier-idx], [data-slider-track]')) {
        btn.addEventListener('click', (ev) => {
          ev.preventDefault();
          pulseReadOnlyBanner();
        });
      }
      panel._isDraggingSlider = () => false;
    } else if (activeEntry && activeEntry.tiers.length > 1) {
      const tiers = activeEntry.tiers;
      let currentVal = sliderSelectedVal ?? effectiveSelected?.value;
      let isDraggingSlider = false;

      const syncSliderVisuals = (idx, moveThumb) => {
        const ratio = tiers.length > 1 ? idx / (tiers.length - 1) : 0;
        const fill = panel.querySelector('.slider-fill');
        const thumb = panel.querySelector('.slider-thumb');
        if (moveThumb !== false) {
          if (fill) fill.style.width = sliderFillCss(ratio);
          if (thumb) thumb.style.left = sliderPosCss(ratio);
          panel.querySelectorAll('.slider-dot').forEach((d, di) => d.classList.toggle('filled', di <= idx));
        }
        panel.querySelectorAll('.stop-btn').forEach((b, bi) => b.classList.toggle('active', bi === idx));
      };

      const selectTierIdx = (idx, moveThumb) => {
        const clamped = Math.max(0, Math.min(tiers.length - 1, idx));
        const item = tiers[clamped];
        if (!item || item.opt.disabled) return false;
        panel._settleUntil = Date.now() + 480;
        if (currentVal !== item.opt.value) {
          currentVal = item.opt.value;
          const liveCtx = findModelContext(activeBtn) || ctx;
          if (activeEntry.isUnifiedOrchestrator) {
            applyOrchestratorPick(liveCtx, activeEntry, item.opt, true);
          } else {
            optimisticState = { opt: item.opt, plannerOpt: null, until: Date.now() + 450 };
            liveCtx.setSelectedModel?.(item.opt);
          }
        }
        syncSliderVisuals(clamped, moveThumb);
        return true;
      };

      for (const btn of panel.querySelectorAll('[data-tier-idx]')) {
        btn.addEventListener('click', () => selectTierIdx(Number(btn.getAttribute('data-tier-idx')), true));
      }

      const trackWrap = panel.querySelector('[data-slider-track]');
      const track = panel.querySelector('.slider-track');
      if (trackWrap && track) {
        const ratioFromClientX = (clientX) => {
          const rect = track.getBoundingClientRect();
          const span = rect.width - 32;
          if (span <= 0) return 0;
          return Math.max(0, Math.min(1, (clientX - rect.left - 16) / span));
        };
        const followPointer = (clientX) => {
          const r = ratioFromClientX(clientX);
          const fill = panel.querySelector('.slider-fill');
          const thumb = panel.querySelector('.slider-thumb');
          if (thumb) thumb.style.left = sliderPosCss(r);
          if (fill) fill.style.width = sliderFillCss(r);
          panel.querySelectorAll('.slider-dot').forEach((d, di) => {
            const dotR = tiers.length > 1 ? di / (tiers.length - 1) : 0;
            d.classList.toggle('filled', dotR <= r + 0.01);
          });
          selectTierIdx(Math.round(r * (tiers.length - 1)), false);
        };

        trackWrap.addEventListener('pointerdown', (ev) => {
          if (ev.button !== 0) return;
          ev.preventDefault();
          isDraggingSlider = true;
          trackWrap.classList.add('dragging');
          try { trackWrap.setPointerCapture(ev.pointerId); } catch {}
          followPointer(ev.clientX);

          const onMove = (me) => followPointer(me.clientX);
          const onUp = (ue) => {
            isDraggingSlider = false;
            trackWrap.removeEventListener('pointermove', onMove);
            trackWrap.removeEventListener('pointerup', onUp);
            trackWrap.removeEventListener('pointercancel', onUp);
            // Release: re-enable transitions, then snap to the nearest stop with a spring bounce.
            trackWrap.classList.remove('dragging');
            const thumb = panel.querySelector('.slider-thumb');
            if (thumb) void thumb.offsetWidth;
            const r = ratioFromClientX(ue && typeof ue.clientX === 'number' ? ue.clientX : 0);
            const snapIdx = Math.round(r * (tiers.length - 1));
            selectTierIdx(snapIdx, true);
          };
          trackWrap.addEventListener('pointermove', onMove);
          trackWrap.addEventListener('pointerup', onUp);
          trackWrap.addEventListener('pointercancel', onUp);
        });

        trackWrap.addEventListener('keydown', (ev) => {
          const curIdx = Math.max(0, tiers.findIndex((t) => t.opt.value === currentVal));
          if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') {
            ev.preventDefault();
            selectTierIdx(curIdx + 1, true);
          } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') {
            ev.preventDefault();
            selectTierIdx(curIdx - 1, true);
          }
        });
      }
      panel._isDraggingSlider = () => isDraggingSlider;
    } else {
      panel._isDraggingSlider = () => false;
    }
  }

  function togglePicker(btn) {
    if (!overlayHost.isConnected) document.body.appendChild(overlayHost);
    if (overlayHost.style.display === 'block' && activeBtn === btn) {
      closePicker();
      return;
    }
    const ctx = findModelContext(btn);
    if (!ctx) return;
    detachBtnObserver();
    activeBtn = btn;
    hoveredNote = '';
    optimisticState = null;
    panel._settleUntil = 0;
    applyTheme();
    overlayHost.style.display = 'block';
    if (isPickerReadOnly(btn, ctx)) {
      // Dismiss native "Model cannot be changed..." tooltip peeking behind our panel.
      try {
        btn.dispatchEvent(new MouseEvent('pointerleave', { bubbles: true }));
        btn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        btn.blur?.();
      } catch {}
    }
    startAutoRefresh(ctx);
    btnObserver = new MutationObserver(() => {
      if (!panel._isDraggingSlider?.() && overlayHost.style.display === 'block') {
        render();
      }
    });
    btnObserver.observe(btn, {
      attributes: true,
      attributeFilter: ['aria-disabled', 'disabled', 'data-disabled'],
      childList: true,
      subtree: true,
      characterData: true,
    });
    render();
    triggerQuotaRefresh(ctx);
  }

  function matchTrigger(target) {
    if (!target || typeof target.closest !== 'function') return null;
    return target.closest(TRIGGER_SEL);
  }

  const onPointerOrMouseDown = (ev) => {
    const btn = matchTrigger(ev.target);
    if (btn && ev.button === 0 && !ev.shiftKey && findModelContext(btn)) {
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
      return;
    }
    if (overlayHost.style.display === 'block') {
      const path = typeof ev.composedPath === 'function' ? ev.composedPath() : [];
      if (!path.includes(overlayHost) && !path.includes(activeBtn)) {
        closePicker();
      }
    }
  };

  const onClickCapture = (ev) => {
    const btn = matchTrigger(ev.target);
    if (btn && ev.button === 0 && !ev.shiftKey && findModelContext(btn)) {
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
      togglePicker(btn);
    }
  };

  const onContextMenuCapture = (ev) => {
    const btn = matchTrigger(ev.target);
    const ctx = btn ? findModelContext(btn) : null;
    if (btn && ctx) {
      ev.preventDefault();
      ev.stopPropagation();
      if (isPickerReadOnly(btn, ctx)) togglePicker(btn);
      else openNativeMenu(btn);
    }
  };

  const onKeyDownCapture = (ev) => {
    if (ev.key === 'Escape' && overlayHost.style.display === 'block') {
      ev.preventDefault();
      ev.stopPropagation();
      closePicker();
    }
  };

  const onResize = () => {
    if (overlayHost.style.display === 'block') positionPanel();
  };

  document.addEventListener('pointerdown', onPointerOrMouseDown, true);
  document.addEventListener('mousedown', onPointerOrMouseDown, true);
  document.addEventListener('click', onClickCapture, true);
  document.addEventListener('contextmenu', onContextMenuCapture, true);
  document.addEventListener('keydown', onKeyDownCapture, true);
  window.addEventListener('resize', onResize);

  window.__agyModelPickerInstalled = true;
  window.__agyModelPickerToggle = togglePicker;
  window.__agyModelPickerDispose = () => {
    stopAutoRefresh();
    detachBtnObserver();
    document.removeEventListener('pointerdown', onPointerOrMouseDown, true);
    document.removeEventListener('mousedown', onPointerOrMouseDown, true);
    document.removeEventListener('click', onClickCapture, true);
    document.removeEventListener('contextmenu', onContextMenuCapture, true);
    document.removeEventListener('keydown', onKeyDownCapture, true);
    window.removeEventListener('resize', onResize);
    overlayHost.remove();
    delete window.__agyModelPickerInstalled;
    delete window.__agyModelPickerToggle;
    delete window.__agyModelPickerResolve;
    delete window.__agyModelPickerDispose;
  };
})();`;
}
