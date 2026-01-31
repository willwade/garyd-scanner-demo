import { ConfigManager, AppConfig } from './ConfigManager';
import { AlphabetManager } from './AlphabetManager';

export class SettingsUI {
  private container: HTMLElement;
  private formContainer!: HTMLElement;
  private configManager: ConfigManager;
  private alphabetManager: AlphabetManager;
  private isVisible: boolean = false;

  constructor(configManager: ConfigManager, alphabetManager: AlphabetManager, container: HTMLElement) {
    this.configManager = configManager;
    this.alphabetManager = alphabetManager;
    this.container = container;

    // Check if container already has structure (backward compat or pre-rendered)
    // If not, render it.
    if (!this.container.querySelector('.settings-content')) {
        this.renderStructure();
    } else {
        this.formContainer = this.container.querySelector('#settings-form')!;
    }

    this.initUI();
    this.bindEvents();

    // Check initial visibility from config
    const config = this.configManager.get();
    if (!config.showUI) {
      this.container.classList.add('hidden');
    }
  }

  private renderStructure() {
      this.container.innerHTML = `
        <div class="settings-content">
          <h2>Scanner Settings</h2>
          <div id="settings-form"></div>
          <button id="close-settings">Close</button>
        </div>
      `;
      this.formContainer = this.container.querySelector('#settings-form')!;
  }

  private initUI() {
    // Build form based on config structure
    const config = this.configManager.get();
    const languages = this.alphabetManager.getLanguages();

    const langOptions = languages.map(l =>
        `<option value="${l.code}">${l.name}</option>`
    ).join('');

    const html = `
      <h3>Settings</h3>
      <p><small>Switch 1 (Space/Enter): Select. Switch 2 (2): Step. Switch 3 (3): Reset. Switch 4 (4): Cancel/Back. 'S': Toggle Menu.</small></p>
      <hr/>

      <div class="form-row">
          <div class="form-group">
            <label>Scan Strategy:</label>
            <select class="setting-input" name="scanStrategy">
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
            <label>Scan Rate (ms):</label>
            <input type="number" class="setting-input" name="scanRate" value="${config.scanRate}" min="100" max="5000" step="100">
          </div>
      </div>

      <div class="form-row">
          <div class="form-group">
            <label>Grid Content:</label>
            <select class="setting-input" name="gridContent">
              <option value="numbers">Numbers (1-64)</option>
              <option value="keyboard">Keyboard</option>
            </select>
          </div>

          <div class="form-group">
            <label>Grid Size (Numbers):</label>
            <input type="number" class="setting-input" name="gridSize" value="${config.gridSize}" min="4" max="100">
          </div>
      </div>

      <hr/>
      <h4>Language & Layout</h4>
      <div class="form-row">
          <div class="form-group">
            <label>Language:</label>
            <select class="setting-input" name="language">
              ${langOptions}
            </select>
          </div>

          <div class="form-group">
            <label>Layout Mode:</label>
            <select class="setting-input" name="layoutMode">
              <option value="alphabetical">Alphabetical</option>
              <option value="frequency">Frequency</option>
            </select>
          </div>
      </div>

      <hr/>
      <h4>Visualization</h4>
      <div class="form-row">
          <div class="form-group">
            <label>View Mode:</label>
            <select class="setting-input" name="viewMode">
              <option value="standard">Standard</option>
              <option value="cost-numbers">Cost (Numbers)</option>
              <option value="cost-heatmap">Cost (Heatmap)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Heatmap Max Cost:</label>
            <input type="number" class="setting-input" name="heatmapMax" value="${config.heatmapMax}" min="1" max="100">
          </div>
      </div>

      <div class="form-group">
        <label>Acceptance Time (ms):</label>
        <input type="number" class="setting-input" name="acceptanceTime" value="${config.acceptanceTime}" min="0" max="2000" step="50">
      </div>

      <div class="form-group">
        <label>Dwell Time (ms, 0=Off):</label>
        <input type="number" class="setting-input" name="dwellTime" value="${config.dwellTime}" min="0" max="5000" step="100">
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" class="setting-input" name="soundEnabled" ${config.soundEnabled ? 'checked' : ''}>
          Sound Enabled
        </label>
      </div>
    `;

    this.formContainer.innerHTML = html;

    // Set initial select values using names instead of IDs
    const setVal = (name: string, val: string) => {
        const el = this.formContainer.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement;
        if (el) el.value = val;
    };

    setVal('scanStrategy', config.scanStrategy);
    setVal('gridContent', config.gridContent);
    setVal('language', config.language);
    setVal('layoutMode', config.layoutMode);
    setVal('viewMode', config.viewMode);
  }

  private bindEvents() {
    // Toggle visibility - scoped to container
    this.container.querySelector('#close-settings')?.addEventListener('click', () => {
      this.toggle(false);
    });

    // Form Change Listeners
    this.formContainer.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      if (!target || !target.classList.contains('setting-input')) return;

      const name = target.getAttribute('name');
      const newConfig: Partial<AppConfig> = {};

      switch (name) {
          case 'scanStrategy':
              newConfig.scanStrategy = target.value as AppConfig['scanStrategy'];
              break;
          case 'gridContent':
              newConfig.gridContent = target.value as AppConfig['gridContent'];
              break;
          case 'scanRate':
              newConfig.scanRate = parseInt(target.value, 10);
              break;
          case 'acceptanceTime':
              newConfig.acceptanceTime = parseInt(target.value, 10);
              break;
          case 'dwellTime':
              newConfig.dwellTime = parseInt(target.value, 10);
              break;
          case 'gridSize':
              newConfig.gridSize = parseInt(target.value, 10);
              break;
          case 'soundEnabled':
              newConfig.soundEnabled = (target as HTMLInputElement).checked;
              break;
          case 'language':
              newConfig.language = target.value;
              break;
          case 'layoutMode':
              newConfig.layoutMode = target.value as 'alphabetical' | 'frequency';
              break;
          case 'viewMode':
              newConfig.viewMode = target.value as 'standard' | 'cost-numbers' | 'cost-heatmap';
              break;
          case 'heatmapMax':
              newConfig.heatmapMax = parseInt(target.value, 10);
              break;
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
