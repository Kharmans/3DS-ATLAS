import { MODULE } from './constants.mjs';
import { collectSystemData, renderFullReport } from './diagnostics.mjs';
import { getRegisteredModules } from './registry.mjs';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Shared troubleshooter for all 3DS modules — scoped diagnostics for bug reports. */
export default class Troubleshooter extends HandlebarsApplicationMixin(ApplicationV2) {
  /** @type {string} Report scope: `'all'` or a registered module id. */
  #scope = 'all';

  /** @type {?{core: ?object, sizes: ?Object<string, number>}} Cached system metrics (fetched once). */
  #system = null;

  static DEFAULT_OPTIONS = {
    id: 'atlas-troubleshooter',
    classes: ['atlas', 'atlas-troubleshooter'],
    window: { title: 'ATLAS.Troubleshooter.Title', icon: 'fas fa-stethoscope', resizable: true, contentClasses: ['standard-form'] },
    position: { width: 720, height: 'auto' },
    actions: { copyReport: Troubleshooter.#onCopyReport, exportReport: Troubleshooter.#onExportReport }
  };

  static PARTS = {
    body: { template: `modules/${MODULE.ID}/templates/troubleshooter/body.hbs` },
    footer: { template: `modules/${MODULE.ID}/templates/troubleshooter/footer.hbs` }
  };

  /** @inheritdoc */
  async _prepareContext() {
    this.#system ??= await collectSystemData();
    const options = [{ value: 'all', label: game.i18n.localize('ATLAS.Troubleshooter.AllModules'), selected: this.#scope === 'all' }];
    for (const entry of getRegisteredModules().values()) options.push({ value: entry.id, label: entry.title, selected: entry.id === this.#scope });
    return { options, report: await renderFullReport(this.#scope, this.#system) };
  }

  /** @inheritdoc */
  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelector('select[name="atlas-scope"]')?.addEventListener('change', (event) => {
      this.#scope = event.target.value;
      this.render();
    });
  }

  /**
   * Copy the report for the current scope to the clipboard.
   * @returns {Promise<void>}
   */
  static async #onCopyReport() {
    await game.clipboard.copyPlainText(await renderFullReport(this.#scope, this.#system, 'copy'));
    ui.notifications.info('ATLAS.Troubleshooter.Copied');
  }

  /**
   * Download the report for the current scope as a timestamped Markdown file.
   * @returns {Promise<void>}
   */
  static async #onExportReport() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const stamp = `${p(d.getMonth() + 1)}-${p(d.getDate())}-${d.getFullYear()}-${p(d.getHours())}${p(d.getMinutes())}`;
    const scope = this.#scope === 'all' ? 'ALL' : this.#scope;
    foundry.utils.saveDataToFile(await renderFullReport(this.#scope, this.#system, 'export'), 'text/markdown', `3DSATLAS_TROUBLESHOOTER_${scope}_${stamp}.md`);
    ui.notifications.info('ATLAS.Troubleshooter.Exported');
  }
}
