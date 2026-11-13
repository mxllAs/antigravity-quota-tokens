const fs = require('fs');
const path = require('path');
const os = require('os');

const CONTEXT_WINDOW_PRESETS = ['256K', '512K', '900K'];

const PRESET_QUOTA_MULTIPLIERS = {
  '256K': '1x',
  '512K': '1.3x',
  '900K': '1.8x',
};

/**
 * Resolve the path to the agy-cli global settings.json file.
 * @param {string} [overridePath]
 * @returns {string}
 */
function getCliSettingsPath(overridePath) {
  if (overridePath && typeof overridePath === 'string') {
    return overridePath;
  }
  return path.join(os.homedir(), '.gemini', 'antigravity-cli', 'settings.json');
}

/**
 * Normalize a raw contextWindow setting string into one of the known presets.
 * Absent/empty/unknown values safely fall back to the official default '256K'.
 * @param {unknown} value
 * @returns {'256K' | '512K' | '900K'}
 */
function normalizeContextWindowPreset(value) {
  if (typeof value === 'string') {
    const upper = value.trim().toUpperCase();
    if (CONTEXT_WINDOW_PRESETS.includes(upper)) {
      return upper;
    }
  }
  return '256K';
}

/**
 * Read the current agy-cli contextWindow preset from settings.json.
 * @param {string} [overridePath]
 * @returns {{
 *   contextWindow: '256K' | '512K' | '900K',
 *   rawValue: string | null,
 *   fileExists: boolean,
 *   settingsPath: string,
 *   error: string | null
 * }}
 */
function readCliContextWindow(overridePath) {
  const settingsPath = getCliSettingsPath(overridePath);
  if (!fs.existsSync(settingsPath)) {
    return {
      contextWindow: '256K',
      rawValue: null,
      fileExists: false,
      settingsPath,
      error: null,
    };
  }

  try {
    const rawText = fs.readFileSync(settingsPath, 'utf8').replace(/^\uFEFF/, '');
    const parsed = rawText.trim() ? JSON.parse(rawText) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        contextWindow: '256K',
        rawValue: null,
        fileExists: true,
        settingsPath,
        error: 'settings.json root is not a JSON object',
      };
    }
    const rawValue = typeof parsed.contextWindow === 'string' ? parsed.contextWindow : null;
    return {
      contextWindow: normalizeContextWindowPreset(rawValue),
      rawValue,
      fileExists: true,
      settingsPath,
      error: null,
    };
  } catch (err) {
    return {
      contextWindow: '256K',
      rawValue: null,
      fileExists: true,
      settingsPath,
      error: err && err.message ? err.message : String(err),
    };
  }
}

/**
 * Update the agy-cli contextWindow preset in settings.json while preserving all
 * existing settings. Choosing the official default ('256K') removes the key cleanly.
 * @param {string} preset
 * @param {string} [overridePath]
 */
function writeCliContextWindow(preset, overridePath) {
  const normalized = typeof preset === 'string' ? preset.trim().toUpperCase() : '';
  if (!CONTEXT_WINDOW_PRESETS.includes(normalized)) {
    throw new Error(`Unsupported contextWindow preset: ${preset}`);
  }

  const settingsPath = getCliSettingsPath(overridePath);
  let settingsObj = {};

  if (fs.existsSync(settingsPath)) {
    const rawText = fs.readFileSync(settingsPath, 'utf8').replace(/^\uFEFF/, '');
    if (rawText.trim()) {
      const parsed = JSON.parse(rawText);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Existing agy-cli settings.json is not a JSON object');
      }
      settingsObj = parsed;
    }
  } else {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    settingsObj.$schema = 'https://antigravity.google/schemas/v1/settings.json';
  }

  if (normalized === '256K') {
    delete settingsObj.contextWindow;
  } else {
    settingsObj.contextWindow = normalized;
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settingsObj, null, 2) + '\n', 'utf8');

  return {
    contextWindow: normalized,
    rawValue: normalized === '256K' ? null : normalized,
    fileExists: true,
    settingsPath,
    error: null,
  };
}

module.exports = {
  CONTEXT_WINDOW_PRESETS,
  PRESET_QUOTA_MULTIPLIERS,
  getCliSettingsPath,
  normalizeContextWindowPreset,
  readCliContextWindow,
  writeCliContextWindow,
};
