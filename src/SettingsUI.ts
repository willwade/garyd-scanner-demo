import { ConfigManager, AppConfig } from './ConfigManager';

export class SettingsUI {
  private container: HTMLElement;
  private formContainer: HTMLElement;
  private configManager: ConfigManager;
  private isVisible: boolean = false;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.container = document.getElementById('settings-overlay')!;
    this.formContainer = document.getElementById('settings-form')!;

    this.initUI();
    this.bindEvents();

    // Check initial visibility from config
    const config = this.configManager.get();
    if (!config.showUI) {
      this.container.classList.add('hidden');
    }
  }

  private initUI() {
    // Build form based on config structure
    const config = this.configManager.get();

    const html = `
      <h3>Instructions</h3>
      <p><small>Switch 1 (Space/Enter): Select. Switch 2 (2): Step. Switch 3 (3): Reset. Switch 4 (4): Cancel/Back. 'S': Toggle Menu.</small></p>
      <hr/>
      <div class="form-group">
        <label>Scan Strategy:</label>
        <select id="setting-strategy">
          <option value="row-column">Row-Column</option>
          <option value="column-row">Column-Row</option>
          <option value="linear">Linear</option>
          <option value="snake">Snake</option>
          <option value="quadrant">Quadrant</option>
          <option value="group-row-column">Row-Group-Column</option>
          <option value="elimination">Elimination</option>
          <option value="continuous">Continuous (Mouse)</option>
          <option value="probability">Probability (PPM)</option>
        </select>
      </div>

      <div class="form-group">
        <label>Grid Content:</label>
        <select id="setting-content">
          <option value="numbers">Numbers (1-64)</option>
          <option value="keyboard">Keyboard (A-Z)</option>
        </select>
      </div>

      <div class="form-group">
        <label>Scan Rate (ms):</label>
        <input type="number" id="setting-rate" value="${config.scanRate}" min="100" max="5000" step="100">
      </div>

      <div class="form-group">
        <label>Acceptance Time (ms):</label>
        <input type="number" id="setting-acceptance" value="${config.acceptanceTime}" min="0" max="2000" step="50">
        <small>Hold time required to activate</small>
      </div>

      <div class="form-group">
        <label>Grid Size (Total items):</label>
        <input type="number" id="setting-gridsize" value="${config.gridSize}" min="4" max="100">
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" id="setting-sound" ${config.soundEnabled ? 'checked' : ''}>
          Sound Enabled
        </label>
      </div>
    `;

    this.formContainer.innerHTML = html;

    // Set initial select value
    const selectStrategy = this.formContainer.querySelector('#setting-strategy') as HTMLSelectElement;
    if (selectStrategy) selectStrategy.value = config.scanStrategy;

    const selectContent = this.formContainer.querySelector('#setting-content') as HTMLSelectElement;
    if (selectContent) selectContent.value = config.gridContent;
  }

  private bindEvents() {
    // Toggle visibility
    document.getElementById('close-settings')?.addEventListener('click', () => {
      this.toggle(false);
    });

    // Listen for 'S' key to toggle settings (handled via SwitchInput usually, but we want a direct listener for the overlay)
    // Actually, SwitchInput maps 's' to 'menu'. Main.ts should handle toggling.
    // But for now let's expose a public toggle method.

    // Form Change Listeners
    this.formContainer.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      if (!target) return;

      const newConfig: Partial<AppConfig> = {};

      if (target.id === 'setting-strategy') {
        newConfig.scanStrategy = target.value as AppConfig['scanStrategy'];
      } else if (target.id === 'setting-content') {
        newConfig.gridContent = target.value as AppConfig['gridContent'];
      } else if (target.id === 'setting-rate') {
        newConfig.scanRate = parseInt(target.value, 10);
      } else if (target.id === 'setting-acceptance') {
        newConfig.acceptanceTime = parseInt(target.value, 10);
      } else if (target.id === 'setting-gridsize') {
        newConfig.gridSize = parseInt(target.value, 10);
      } else if (target.id === 'setting-sound') {
        newConfig.soundEnabled = (target as HTMLInputElement).checked;
      }

      this.configManager.update(newConfig);
    });
  }

  public toggle(force?: boolean) {
    this.isVisible = force !== undefined ? force : !this.isVisible;
    if (this.isVisible) {
      this.container.classList.remove('hidden');
    } else {
      this.container.classList.add('hidden');
    }
  }
}
