import { ConfigManager, AppConfig } from './ConfigManager';
import { AlphabetManager } from './AlphabetManager';

export class SettingsUI {
  private container: HTMLElement;
  private formContainer: HTMLElement;
  private configManager: ConfigManager;
  private alphabetManager: AlphabetManager;
  private isVisible: boolean = false;

  constructor(configManager: ConfigManager, alphabetManager: AlphabetManager) {
    this.configManager = configManager;
    this.alphabetManager = alphabetManager;
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
            <label>Scan Rate (ms):</label>
            <input type="number" id="setting-rate" value="${config.scanRate}" min="100" max="5000" step="100">
          </div>
      </div>

      <div class="form-row">
          <div class="form-group">
            <label>Grid Content:</label>
            <select id="setting-content">
              <option value="numbers">Numbers (1-64)</option>
              <option value="keyboard">Keyboard</option>
            </select>
          </div>

          <div class="form-group">
            <label>Grid Size (Numbers):</label>
            <input type="number" id="setting-gridsize" value="${config.gridSize}" min="4" max="100">
          </div>
      </div>

      <hr/>
      <h4>Language & Layout</h4>
      <div class="form-row">
          <div class="form-group">
            <label>Language:</label>
            <select id="setting-language">
              ${langOptions}
            </select>
          </div>

          <div class="form-group">
            <label>Layout Mode:</label>
            <select id="setting-layout">
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
            <select id="setting-view">
              <option value="standard">Standard</option>
              <option value="cost-numbers">Cost (Numbers)</option>
              <option value="cost-heatmap">Cost (Heatmap)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Heatmap Max Cost:</label>
            <input type="number" id="setting-heatmax" value="${config.heatmapMax}" min="1" max="100">
          </div>
      </div>

      <div class="form-group">
        <label>Acceptance Time (ms):</label>
        <input type="number" id="setting-acceptance" value="${config.acceptanceTime}" min="0" max="2000" step="50">
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" id="setting-sound" ${config.soundEnabled ? 'checked' : ''}>
          Sound Enabled
        </label>
      </div>
    `;

    this.formContainer.innerHTML = html;

    // Set initial select values
    const setVal = (id: string, val: string) => {
        const el = this.formContainer.querySelector(id) as HTMLInputElement | HTMLSelectElement;
        if (el) el.value = val;
    };

    setVal('#setting-strategy', config.scanStrategy);
    setVal('#setting-content', config.gridContent);
    setVal('#setting-language', config.language);
    setVal('#setting-layout', config.layoutMode);
    setVal('#setting-view', config.viewMode);
  }

  private bindEvents() {
    // Toggle visibility
    document.getElementById('close-settings')?.addEventListener('click', () => {
      this.toggle(false);
    });

    // Form Change Listeners
    this.formContainer.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      if (!target) return;

      const newConfig: Partial<AppConfig> = {};

      switch (target.id) {
          case 'setting-strategy':
              newConfig.scanStrategy = target.value as AppConfig['scanStrategy'];
              break;
          case 'setting-content':
              newConfig.gridContent = target.value as AppConfig['gridContent'];
              break;
          case 'setting-rate':
              newConfig.scanRate = parseInt(target.value, 10);
              break;
          case 'setting-acceptance':
              newConfig.acceptanceTime = parseInt(target.value, 10);
              break;
          case 'setting-gridsize':
              newConfig.gridSize = parseInt(target.value, 10);
              break;
          case 'setting-sound':
              newConfig.soundEnabled = (target as HTMLInputElement).checked;
              break;
          case 'setting-language':
              newConfig.language = target.value;
              break;
          case 'setting-layout':
              newConfig.layoutMode = target.value as 'alphabetical' | 'frequency';
              break;
          case 'setting-view':
              newConfig.viewMode = target.value as 'standard' | 'cost-numbers' | 'cost-heatmap';
              break;
          case 'setting-heatmax':
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
