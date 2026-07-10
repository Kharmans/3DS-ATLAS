import { MODULE, SETTINGS } from '../constants.mjs';

/** @type {Object<number, string>} Console styling per log level. */
const STYLES = {
  1: 'color: #ef4444; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-shadow: 0 0 1px #000;',
  2: 'color: #fb923c; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-shadow: 0 0 1px #000;',
  3: 'color: #a78bfa; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-shadow: 0 0 1px #000;'
};

/**
 * Core logging function with a caller-supplied prefix.
 * @param {string} prefix  Label shown before the log line
 * @param {number} level   Log level (1=error, 2=warning, 3=verbose)
 * @param {...*} args      Content to log
 */
export function logAs(prefix, level, ...args) {
  if (MODULE.LOG_LEVEL <= 0 || level > MODULE.LOG_LEVEL) return;
  const fn = level === 1 ? console.error : level === 2 ? console.warn : console.debug;
  fn(`%c${prefix}%c |`, STYLES[level] ?? STYLES[3], 'color: #9ca3af;', ...args);
}

/**
 * Log under the ATLAS prefix.
 * @param {number} level  Log level (1=error, 2=warning, 3=verbose)
 * @param {...*} args     Content to log
 */
export function log(level, ...args) {
  logAs(MODULE.TITLE, level, ...args);
}

/**
 * Identify the calling module from the stack trace.
 * @returns {string|null}
 */
export function callerModuleId() {
  const stack = new Error().stack || '';
  for (const match of stack.matchAll(/\/modules\/([^/]+)\//g)) if (match[1] !== MODULE.ID) return match[1];
  return null;
}

/**
 * Initialize the shared log level from game settings.
 * @returns {void}
 */
export function initializeLogger() {
  MODULE.LOG_LEVEL = parseInt(game.settings.get(MODULE.ID, SETTINGS.LOGGING_LEVEL));
}
