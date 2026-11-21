import { EXACT_ZH_MAP, PREFIX_RULES, PATTERN_RULES } from './dictionary.js';

/**
 * Normalize whitespace inside dictionary lookup strings while preserving
 * exact outer leading/trailing spaces on DOM Text nodes.
 * @param {string} text
 * @returns {string}
 */
function normalizeLookupKey(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

/**
 * Pure translation helper (also exported for Node unit tests).
 * @param {string} rawText
 * @param {Record<string, string>} exactMap
 * @param {Array<[string, string]>} prefixRules
 * @param {Array<{source: string, flags?: string, replace: string}>} patternRules
 * @returns {string | null}
 */
function translateText(
  rawText,
  exactMap = EXACT_ZH_MAP,
  prefixRules = PREFIX_RULES,
  patternRules = PATTERN_RULES,
) {
  if (typeof rawText !== 'string' || !rawText.trim()) return null;

  const leadingMatch = rawText.match(/^\s*/);
  const trailingMatch = rawText.match(/\s*$/);
  const leading = leadingMatch ? leadingMatch[0] : '';
  const trailing = trailingMatch ? trailingMatch[0] : '';
  const core = normalizeLookupKey(rawText);
  if (!core) return null;

  if (Object.prototype.hasOwnProperty.call(exactMap, core)) {
    return leading + exactMap[core] + trailing;
  }

  for (let i = 0; i < prefixRules.length; i += 1) {
    const [prefix, zhPrefix] = prefixRules[i];
    if (core.startsWith(prefix)) {
      const rest = core.slice(prefix.length);
      const translatedRest = Object.prototype.hasOwnProperty.call(exactMap, rest)
        ? exactMap[rest]
        : rest;
      return leading + zhPrefix + translatedRest + trailing;
    }
  }

  for (let i = 0; i < patternRules.length; i += 1) {
    const rule = patternRules[i];
    const re =
      rule instanceof RegExp
        ? rule
        : new RegExp(rule.source, rule.flags || '');
    if (re.test(core)) {
      let out = core.replace(re, rule.replace);
      if (rule.localizeUnits) {
        out = localizeDurationUnits(out);
      }
      return leading + out + trailing;
    }
  }

  return null;
}

function localizeDurationUnits(text) {
  return String(text)
    .replace(/(\d+)\s*days?,?\s*/gi, '$1 天 ')
    .replace(/(\d+)\s*hours?,?\s*/gi, '$1 小时 ')
    .replace(/(\d+)\s*minutes?,?\s*/gi, '$1 分钟 ')
    .replace(/(\d+)\s*seconds?,?\s*/gi, '$1 秒 ')
    .replace(/\s+/g, ' ')
    .replace(/\s+(?=后完全刷新)/g, ' ');
}

/**
 * Build the self-contained browser DOM translator script injected via CDP.
 * Uses WeakMap to preserve original English strings for instant live toggling
 * and zero-residue teardown when disabled.
 * @returns {string}
 */
function buildTranslatorWidgetScript() {
  const payload = JSON.stringify({
    exactMap: EXACT_ZH_MAP,
    prefixRules: PREFIX_RULES,
    patternRules: PATTERN_RULES,
  });

  return `(() => {
  'use strict';

  try {
    if (typeof window.__agyZhCnDispose === 'function') {
      window.__agyZhCnDispose();
    }
  } catch {}

  const CONFIG = ${payload};
  const EXACT_MAP = CONFIG.exactMap;
  const PREFIX_RULES = CONFIG.prefixRules;
  const PATTERN_RULES = CONFIG.patternRules.map((r) => ({
    regex: new RegExp(r.source, r.flags || ''),
    replace: r.replace,
    localizeUnits: Boolean(r.localizeUnits),
  }));

  const STORAGE_KEY = 'agy-zh-cn-lang';
  const TOGGLE_BTN_ID = 'agy-zh-cn-toggle-btn';
  const TRANSLATABLE_ATTRS = ['placeholder', 'aria-label', 'title', 'data-tooltip-content'];
  const SKIP_TAGS = new Set([
    'SCRIPT',
    'STYLE',
    'NOSCRIPT',
    'TEXTAREA',
    'INPUT',
    'SELECT',
    'OPTION',
    'CODE',
    'PRE',
    'KBD',
    'SAMP',
    'SVG',
    'CANVAS',
    'MATH',
  ]);

  const origText = new WeakMap();
  const lastAppliedText = new WeakMap();
  const translatedNodes = new Set();

  const origAttrs = new WeakMap();
  const lastAppliedAttrs = new WeakMap();
  const translatedElements = new Set();

  let currentLang = (() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved === 'en' ? 'en' : 'zh';
    } catch {
      return 'zh';
    }
  })();

  let disposed = false;
  let isApplying = false;
  let scheduled = false;
  let observer = null;
  let periodicTimer = null;

  function normalizeCore(str) {
    return String(str || '').replace(/\\s+/g, ' ').trim();
  }

  function lookupZh(raw) {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    const lead = (raw.match(/^\\s*/) || [''])[0];
    const trail = (raw.match(/\\s*$/) || [''])[0];
    const core = normalizeCore(raw);
    if (!core) return null;

    if (Object.prototype.hasOwnProperty.call(EXACT_MAP, core)) {
      return lead + EXACT_MAP[core] + trail;
    }

    for (let i = 0; i < PREFIX_RULES.length; i += 1) {
      const prefix = PREFIX_RULES[i][0];
      const zhPrefix = PREFIX_RULES[i][1];
      if (core.startsWith(prefix)) {
        const rest = core.slice(prefix.length);
        const mappedRest = Object.prototype.hasOwnProperty.call(EXACT_MAP, rest)
          ? EXACT_MAP[rest]
          : rest;
        return lead + zhPrefix + mappedRest + trail;
      }
    }

    for (let i = 0; i < PATTERN_RULES.length; i += 1) {
      const rule = PATTERN_RULES[i];
      if (rule.regex.test(core)) {
        let out = core.replace(rule.regex, rule.replace);
        if (rule.localizeUnits) {
          out = out
            .replace(/(\\d+)\\s*days?,?\\s*/gi, '$1 天 ')
            .replace(/(\\d+)\\s*hours?,?\\s*/gi, '$1 小时 ')
            .replace(/(\\d+)\\s*minutes?,?\\s*/gi, '$1 分钟 ')
            .replace(/(\\d+)\\s*seconds?,?\\s*/gi, '$1 秒 ')
            .replace(/\\s+/g, ' ')
            .replace(/\\s+(?=后完全刷新)/g, ' ');
        }
        return lead + out + trail;
      }
    }

    return null;
  }

  function isHardSkippedElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return true;
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.id === TOGGLE_BTN_ID) return true;
    if (el.closest('#' + TOGGLE_BTN_ID)) return true;
    if (
      el.closest(
        'pre, code, kbd, [contenteditable="true"], .cm-editor, .monaco-editor, .ProseMirror, .markdown-body, [data-agy-zh-cn-ignore="true"]',
      )
    ) {
      return true;
    }
    return false;
  }

  function isWithinTranslatableZone(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;

    // 1. Settings dialogs, modal dialogs, and radix/select/context portals
    if (
      el.closest(
        '[role="dialog"], [role="alertdialog"], [role="menu"], [role="menuitem"], [role="listbox"], [role="option"], [role="tooltip"], [data-radix-popper-content-wrapper], [data-select-popup], [data-radix-menu-content], [data-testid="title-menu-bar"], .agy-card',
      )
    ) {
      // Even inside dialogs/cards, avoid user project/conversation links in sidebar lists
      if (el.closest('a[href*="/c/"]')) return false;
      return true;
    }

    // 2. Settings container rendered inline without role="dialog"
    if (el.closest('[data-testid*="settings" i]')) {
      return true;
    }

    // 3. Left navigation sidebar chrome (strictly skipping project/conversation items & prose)
    const inSidebar = el.closest('aside, nav, [class*="sidebar" i], [data-testid*="sidebar" i]');
    if (inSidebar) {
      if (el.closest('a[href*="/c/"], [data-conversation-id], [data-project-id]')) {
        return false;
      }
      // Allow top-level sidebar chrome (.agy-button, h2 headings, footer) even when using .truncate
      if (
        el.classList &&
        el.classList.contains('truncate') &&
        !el.closest('h2, .agy-button, footer, [data-testid*="nav" i], [data-testid*="footer" i]')
      ) {
        return false;
      }
      return true;
    }

    // 4. Fallback for top-left sidebar shell in Desktop 2.34
    if (
      !el.closest('[data-message-id], [data-testid*="message" i], [data-testid*="chat" i], [data-testid*="composer" i], a[href*="/c/"]')
    ) {
      const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      if (
        rect &&
        rect.left < 280 &&
        (!el.classList?.contains('truncate') || el.closest('h2, .agy-button'))
      ) {
        return true;
      }
    }

    return false;
  }

  function syncTextNode(node) {
    const parent = node.parentElement;
    if (!parent || SKIP_TAGS.has(parent.tagName)) return;

    const currentVal = node.nodeValue || '';
    if (!currentVal.trim()) return;

    const prevApplied = lastAppliedText.get(node);
    if (prevApplied !== currentVal) {
      // Fresh node or React updated this text node cleanly; record current raw source
      origText.set(node, currentVal);
      if (prevApplied !== undefined) {
        lastAppliedText.delete(node);
      }
    }

    if (currentLang === 'en') {
      const orig = origText.get(node);
      if (orig !== undefined && currentVal !== orig) {
        node.nodeValue = orig;
        lastAppliedText.delete(node);
        translatedNodes.delete(node);
      }
      return;
    }

    const sourceVal = origText.get(node) ?? currentVal;
    const translated = lookupZh(sourceVal);
    if (!translated || translated === currentVal) return;

    if (isHardSkippedElement(parent) || !isWithinTranslatableZone(parent)) return;

    if (!origText.has(node)) {
      origText.set(node, sourceVal);
    }
    node.nodeValue = translated;
    lastAppliedText.set(node, translated);
    translatedNodes.add(node);
  }

  function syncElementAttributes(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
    if (el.id === TOGGLE_BTN_ID || el.closest('#' + TOGGLE_BTN_ID)) return;
    if (
      el.closest(
        'pre, code, [contenteditable="true"], .cm-editor, .monaco-editor, .ProseMirror, [data-agy-zh-cn-ignore="true"]',
      )
    ) {
      return;
    }

    const canTranslate = currentLang === 'zh' && isWithinTranslatableZone(el);

    for (let i = 0; i < TRANSLATABLE_ATTRS.length; i += 1) {
      const attr = TRANSLATABLE_ATTRS[i];
      if (!el.hasAttribute(attr)) continue;
      const val = el.getAttribute(attr);
      if (!val || !val.trim()) continue;

      let origMap = origAttrs.get(el);
      let appliedMap = lastAppliedAttrs.get(el);

      if (!origMap) {
        origMap = new Map();
        origAttrs.set(el, origMap);
      }
      if (!appliedMap) {
        appliedMap = new Map();
        lastAppliedAttrs.set(el, appliedMap);
      }

      if (appliedMap.get(attr) !== val) {
        origMap.set(attr, val);
        appliedMap.delete(attr);
      }

      if (currentLang === 'en') {
        const orig = origMap.get(attr);
        if (orig !== undefined && val !== orig) {
          el.setAttribute(attr, orig);
          appliedMap.delete(attr);
        }
        continue;
      }

      if (!canTranslate) continue;

      const sourceVal = origMap.get(attr) ?? val;
      const translated = lookupZh(sourceVal);
      if (translated && translated !== val) {
        el.setAttribute(attr, translated);
        appliedMap.set(attr, translated);
        translatedElements.add(el);
      }
    }
  }

  function findSettingsDialog() {
    const dialogs = document.querySelectorAll('[role="dialog"]');
    for (let i = 0; i < dialogs.length; i += 1) {
      const dlg = dialogs[i];
      if (
        dlg.querySelector('.agy-card') ||
        dlg.querySelector('#project4kMode') ||
        /General|Appearance|Application|Notifications|Shortcuts|常规|外观|应用程序/.test(
          dlg.textContent || '',
        )
      ) {
        return dlg;
      }
    }
    return null;
  }

  function ensureTogglePill() {
    const existing = document.getElementById(TOGGLE_BTN_ID);
    const settingsDlg = findSettingsDialog();

    if (!settingsDlg) {
      if (existing) existing.remove();
      return;
    }

    let btn = existing;
    if (!btn) {
      btn = document.createElement('button');
      btn.id = TOGGLE_BTN_ID;
      btn.type = 'button';
      btn.setAttribute('data-agy-zh-cn-ignore', 'true');
      btn.style.cssText = [
        'position:absolute',
        'top:14px',
        'right:46px',
        'z-index:20',
        'display:inline-flex',
        'align-items:center',
        'gap:4px',
        'height:24px',
        'padding:0 9px',
        'border-radius:999px',
        'font-size:11px',
        'font-weight:500',
        'line-height:1',
        'cursor:pointer',
        'user-select:none',
        'border:1px solid rgba(128,128,128,0.28)',
        'background:rgba(128,128,128,0.10)',
        'color:inherit',
        'opacity:0.78',
        'transition:opacity 120ms ease, background 120ms ease',
      ].join(';');

      btn.addEventListener('mouseenter', () => {
        btn.style.opacity = '1';
        btn.style.background = 'rgba(128,128,128,0.18)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.opacity = '0.78';
        btn.style.background = 'rgba(128,128,128,0.10)';
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.__agyZhCnToggleLang?.();
      });
    }

    if (btn.parentElement !== settingsDlg) {
      const style = window.getComputedStyle(settingsDlg);
      if (style.position === 'static') {
        settingsDlg.style.position = 'relative';
      }
      settingsDlg.appendChild(btn);
    }

    const label = currentLang === 'zh' ? '中 / EN' : 'EN / 中';
    if (btn.textContent !== label) {
      btn.textContent = label;
    }
    btn.title =
      currentLang === 'zh'
        ? '点击切换桌面端界面为英文 (English)'
        : 'Click to switch Desktop UI back to Simplified Chinese (简体中文)';
  }

  function applyPass() {
    if (disposed || isApplying || !document.body) return;
    isApplying = true;
    try {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
      );
      let node;
      while ((node = walker.nextNode())) {
        syncTextNode(node);
      }

      const attrEls = document.body.querySelectorAll(
        '[placeholder], [aria-label], [title], [data-tooltip-content]',
      );
      for (let i = 0; i < attrEls.length; i += 1) {
        syncElementAttributes(attrEls[i]);
      }

      ensureTogglePill();
    } finally {
      isApplying = false;
    }
  }

  function schedulePass() {
    if (disposed || scheduled) return;
    scheduled = true;
    const run = () => {
      scheduled = false;
      applyPass();
    };
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(run);
    } else {
      setTimeout(run, 16);
    }
  }

  function restoreAllEnglish() {
    isApplying = true;
    try {
      translatedNodes.forEach((node) => {
        if (!node.isConnected) return;
        const orig = origText.get(node);
        const applied = lastAppliedText.get(node);
        if (orig !== undefined && node.nodeValue === applied) {
          node.nodeValue = orig;
        }
        lastAppliedText.delete(node);
      });
      translatedNodes.clear();

      translatedElements.forEach((el) => {
        if (!el.isConnected) return;
        const origMap = origAttrs.get(el);
        const appliedMap = lastAppliedAttrs.get(el);
        if (!origMap || !appliedMap) return;
        appliedMap.forEach((appliedVal, attr) => {
          const origVal = origMap.get(attr);
          if (origVal !== undefined && el.getAttribute(attr) === appliedVal) {
            el.setAttribute(attr, origVal);
          }
        });
        appliedMap.clear();
      });
      translatedElements.clear();
    } finally {
      isApplying = false;
    }
  }

  function onUserInteraction() {
    schedulePass();
    setTimeout(() => {
      if (!disposed) applyPass();
    }, 80);
    setTimeout(() => {
      if (!disposed) applyPass();
    }, 280);
  }

  observer = new MutationObserver(() => {
    if (isApplying || disposed) return;
    schedulePass();
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRS,
    });
  }

  document.addEventListener('click', onUserInteraction, true);
  document.addEventListener('keydown', schedulePass, true);

  periodicTimer = setInterval(() => {
    if (!disposed) applyPass();
  }, 1200);

  window.__agyZhCnToggleLang = (nextLang) => {
    if (disposed) return;
    currentLang =
      nextLang === 'en' || nextLang === 'zh'
        ? nextLang
        : currentLang === 'zh'
          ? 'en'
          : 'zh';
    try {
      window.localStorage.setItem(STORAGE_KEY, currentLang);
    } catch {}
    if (currentLang === 'en') {
      restoreAllEnglish();
      ensureTogglePill();
    } else {
      applyPass();
    }
  };

  window.__agyZhCnDispose = () => {
    if (disposed) return;
    disposed = true;
    try {
      observer?.disconnect();
    } catch {}
    try {
      clearInterval(periodicTimer);
    } catch {}
    try {
      document.removeEventListener('click', onUserInteraction, true);
      document.removeEventListener('keydown', schedulePass, true);
    } catch {}
    try {
      restoreAllEnglish();
    } catch {}
    try {
      document.getElementById(TOGGLE_BTN_ID)?.remove();
    } catch {}
    try {
      delete window.__agyZhCnInstalled;
      delete window.__agyZhCnToggleLang;
      delete window.__agyZhCnDispose;
    } catch {}
  };

  window.__agyZhCnInstalled = true;
  applyPass();
})();`;
}

export {
  normalizeLookupKey,
  translateText,
  buildTranslatorWidgetScript,
};
