import { MODULE } from './constants.mjs';
import { buildReport, reportToMarkdown } from './diagnostics.mjs';
import { getModule, getRegisteredModules, register } from './registry.mjs';
import { THEME_PRESETS } from './theme/presets.mjs';
import {
  applyModuleTheme,
  createCustomTheme,
  deleteCustomTheme,
  exportCustomTheme,
  getAppScopes,
  getColorsForTheme,
  getCustomThemes,
  getForcedTheme,
  getModuleThemes,
  importCustomTheme,
  initializeThemes,
  setForcedTheme,
  setModuleTheme,
  updateCustomTheme
} from './theme/theme-engine.mjs';
import Troubleshooter from './troubleshooter.mjs';
import { checkForUpdates } from './updates/update-checker.mjs';
import { callerModuleId, logAs } from './utils/logger.mjs';

/**
 * Log on behalf of the calling module.
 * @param {number} level  1=error, 2=warning, 3=verbose
 * @param {...*} args      Content to log
 */
function moduleLog(level, ...args) {
  if (MODULE.LOG_LEVEL <= 0 || level > MODULE.LOG_LEVEL) return;
  const id = callerModuleId();
  logAs(id ? (getModule(id)?.title ?? id) : MODULE.TITLE, level, ...args);
}

/** @type {object} The public ATLAS API exposed on the module and global namespace. */
export const ATLASAPI = {
  register,
  getModule,
  getRegisteredModules,
  log: moduleLog,
  theme: {
    presets: THEME_PRESETS,
    getColorsForTheme,
    getModuleThemes,
    getCustomThemes,
    getAppScopes,
    setModuleTheme,
    getForcedTheme,
    setForcedTheme,
    applyModuleTheme,
    initializeThemes,
    createCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    exportCustomTheme,
    importCustomTheme
  },
  updates: { checkForUpdates },
  diagnostics: { buildReport, reportToMarkdown, open: () => new Troubleshooter().render(true) }
};

/**
 * Expose the API on the module object and a global for console/macro access.
 * @returns {void}
 */
export function exposeApi() {
  game.modules.get(MODULE.ID).api = ATLASAPI;
  globalThis.ATLAS = ATLASAPI;
}
