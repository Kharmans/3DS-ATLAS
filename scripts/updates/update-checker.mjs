import { MODULE, SETTINGS } from '../constants.mjs';
import { getRegisteredModules } from '../registry.mjs';
import { log } from '../utils/logger.mjs';

/**
 * Fetch the latest GitHub release for a repo.
 * @param {string} repo  GitHub "owner/repo"
 * @returns {Promise<{version: string, body: string, url: string}|null>}
 */
async function fetchLatestRelease(repo) {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const version = (data.tag_name || '').replace(/^release-/, '').replace(/^v/, '');
    return { version, body: data.body || '', url: data.html_url };
  } catch (err) {
    log(2, `Update check failed for ${repo}:`, err);
    return null;
  }
}

/**
 * Post a single whispered chat notice to the GM.
 * @param {string} title     Message heading
 * @param {string} bodyHtml  Inner HTML body
 * @returns {Promise<void>}
 */
async function postNotice(title, bodyHtml) {
  const content = `<div class="atlas-update-notice"><h3>${title}</h3>${bodyHtml}</div>`;
  await ChatMessage.create({ content, whisper: [game.user.id], speaker: { alias: MODULE.TITLE } });
}

/**
 * Check every registered module and emit at most two messages.
 * @returns {Promise<void>}
 */
export async function checkForUpdates() {
  if (!game.user.isGM) return;
  if (!game.settings.get(MODULE.ID, SETTINGS.UPDATE_NOTICES)) return;
  const seen = game.settings.get(MODULE.ID, SETTINGS.SEEN_VERSIONS) || {};
  const changed = [];
  const pending = [];
  let dirty = false;
  for (const entry of getRegisteredModules().values()) {
    if (!entry.github) continue;
    const installed = game.modules.get(entry.id)?.version;
    if (!installed) continue;
    if (seen[entry.id] && seen[entry.id] !== installed) {
      const release = await fetchLatestRelease(entry.github);
      const notes = release?.version === installed ? release.body : '';
      changed.push({ title: entry.title, version: installed, notes });
      seen[entry.id] = installed;
      dirty = true;
      continue;
    }
    const release = await fetchLatestRelease(entry.github);
    if (release?.version && foundry.utils.isNewerVersion(release.version, installed)) pending.push({ title: entry.title, version: release.version, url: release.url });
    if (!seen[entry.id]) {
      seen[entry.id] = installed;
      dirty = true;
    }
  }
  if (changed.length) {
    const items = changed
      .map((c) => `<li><strong>${c.title} ${c.version}</strong>${c.notes ? `<div class="atlas-update-notes">${foundry.utils.escapeHTML?.(c.notes) ?? c.notes}</div>` : ''}</li>`)
      .join('');
    await postNotice(_loc('ATLAS.Update.ChangedTitle'), `<ul class="atlas-update-list">${items}</ul>`);
  }
  if (pending.length) {
    const items = pending.map((p) => `<li><a href="${p.url}">${p.title} ${p.version}</a></li>`).join('');
    await postNotice(_loc('ATLAS.Update.PendingTitle'), `<ul class="atlas-update-list">${items}</ul>`);
  }
  if (dirty) await game.settings.set(MODULE.ID, SETTINGS.SEEN_VERSIONS, seen);
}
