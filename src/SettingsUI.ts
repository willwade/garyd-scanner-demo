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
          <div class="settings-header">
            <h2>Scanner Settings</h2>
            <button id="close-settings" class="close-btn" aria-label="Close settings">&times;</button>
          </div>
          <div id="settings-form"></div>
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
      <div class="settings-intro">
        <p><strong>Controls:</strong> Space/Enter=Select • 2=Step • 3=Reset • S=Menu</p>
      </div>

      <div class="settings-section">
        <h3>Scanning Mode</h3>

        <div class="form-group">
          <label for="scanMode">Special Mode</label>
          <select id="scanMode" class="setting-input" name="scanMode">
            <option value="null">None (use pattern below)</option>
            <option value="group-row-column">Row-Group-Column</option>
            <option value="continuous">Continuous (Gliding/Crosshair)</option>
            <option value="probability">Probability (PPM)</option>
          </select>
          <small>Special scanning modes that override standard patterns</small>
        </div>

        <div class="form-row" id="continuous-options" style="display: ${config.scanMode === 'continuous' ? 'flex' : 'none'}">
          <div class="form-group">
            <label for="continuousTechnique">Continuous Technique</label>
            <select id="continuousTechnique" class="setting-input" name="continuousTechnique">
              <option value="gliding">Gliding Cursor</option>
              <option value="crosshair">Crosshair</option>
            </select>
            <small>Gliding: Auto-scan with buffer zone | Crosshair: Tap X then Y</small>
          </div>
        </div>

        <div class="form-row" id="pattern-options" style="display: ${!config.scanMode ? 'flex' : 'none'}">
          <div class="form-group">
            <label for="scanPattern">Scan Pattern</label>
            <select id="scanPattern" class="setting-input" name="scanPattern">
              <option value="row-column">Row-Column</option>
              <option value="column-row">Column-Row</option>
              <option value="linear">Linear</option>
              <option value="snake">Snake</option>
              <option value="quadrant">Quadrant</option>
              <option value="elimination">Elimination</option>
            </select>
            <small>How the scanner moves through items</small>
          </div>

          <div class="form-group">
            <label for="scanTechnique">Scan Technique</label>
            <select id="scanTechnique" class="setting-input" name="scanTechnique">
              <option value="block">Block (Row → Item)</option>
              <option value="point">Point (Item by Item)</option>
            </select>
            <small id="techniqueHint">For row/col/linear/snake patterns only</small>
          </div>
        </div>

        <div class="form-group">
          <label for="scanRate">Scan Rate <span class="value-display">${config.scanRate}ms</span></label>
          <input type="range" id="scanRate" class="setting-input range-input" name="scanRate"
                 value="${config.scanRate}" min="100" max="5000" step="100">
          <small>Speed of scanning (lower = faster)</small>
        </div>
      </div>

      <div class="settings-section">
        <h3>Content</h3>

        <div class="form-row">
          <div class="form-group">
            <label for="gridContent">Grid Content</label>
            <select id="gridContent" class="setting-input" name="gridContent">
              <option value="numbers">Numbers</option>
              <option value="keyboard">Keyboard</option>
            </select>
            <small>What to display in the grid</small>
          </div>

          <div class="form-group">
            <label for="gridSize">Grid Size <span class="value-display">${config.gridSize}</span></label>
            <input type="number" id="gridSize" class="setting-input" name="gridSize"
                   value="${config.gridSize}" min="4" max="100">
            <small>Number of items (for numbers mode)</small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="language">Language</label>
            <select id="language" class="setting-input" name="language">
              ${langOptions}
            </select>
          </div>

          <div class="form-group">
            <label for="layoutMode">Layout</label>
            <select id="layoutMode" class="setting-input" name="layoutMode">
              <option value="alphabetical">Alphabetical</option>
              <option value="frequency">Frequency (Common First)</option>
            </select>
            <small>Keyboard layout order</small>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>Timing & Access</h3>

        <div class="form-group">
          <label for="acceptanceTime">Acceptance Time <span class="value-display">${config.acceptanceTime}ms</span></label>
          <input type="range" id="acceptanceTime" class="setting-input range-input" name="acceptanceTime"
                 value="${config.acceptanceTime}" min="0" max="2000" step="50">
          <small>How long to highlight selection before confirming (0 = instant)</small>
        </div>

        <div class="form-group">
          <label for="dwellTime">Dwell Time <span class="value-display">${config.dwellTime}ms</span></label>
          <input type="range" id="dwellTime" class="setting-input range-input" name="dwellTime"
                 value="${config.dwellTime}" min="0" max="5000" step="100">
          <small>Auto-select on hover (0 = off)</small>
        </div>
      </div>

      <div class="settings-section">
        <h3>Visualization</h3>

        <div class="form-row">
          <div class="form-group">
            <label for="viewMode">View Mode</label>
            <select id="viewMode" class="setting-input" name="viewMode">
              <option value="standard">Standard</option>
              <option value="cost-numbers">Cost Numbers</option>
              <option value="cost-heatmap">Cost Heatmap</option>
            </select>
            <small>Show scanning cost as colors/numbers</small>
          </div>

          <div class="form-group">
            <label for="heatmapMax">Heatmap Max</label>
            <input type="number" id="heatmapMax" class="setting-input" name="heatmapMax"
                   value="${config.heatmapMax}" min="1" max="100">
            <small>Max cost for heatmap color scale</small>
          </div>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="soundEnabled" ${config.soundEnabled ? 'checked' : ''}>
            <span>Sound Enabled</span>
          </label>
          <small>Play sounds when scanning and selecting</small>
        </div>
      </div>
    `;

    this.formContainer.innerHTML = html;

    // Set initial select values using names instead of IDs
    const setVal = (name: string, val: string) => {
        const el = this.formContainer.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement;
        if (el) el.value = val;
    };

    setVal('scanPattern', config.scanPattern);
    setVal('scanTechnique', config.scanTechnique);
    setVal('scanMode', config.scanMode || 'null');
    setVal('continuousTechnique', config.continuousTechnique);
    setVal('gridContent', config.gridContent);
    setVal('language', config.language);
    setVal('layoutMode', config.layoutMode);
    setVal('viewMode', config.viewMode);

    // Update UI state based on current config
    this.updateUIState(config);
  }

  private updateUIState(config: AppConfig) {
    const techniqueSelect = this.formContainer.querySelector('[name="scanTechnique"]') as HTMLSelectElement;
    const patternSelect = this.formContainer.querySelector('[name="scanPattern"]') as HTMLSelectElement;
    const continuousOptions = this.formContainer.querySelector('#continuous-options') as HTMLElement;
    const patternOptions = this.formContainer.querySelector('#pattern-options') as HTMLElement;

    // Show/hide continuous technique options
    if (continuousOptions) {
      continuousOptions.style.display = config.scanMode === 'continuous' ? 'flex' : 'none';
    }

    // Show/hide pattern options (hidden when special mode is active)
    if (patternOptions) {
      patternOptions.style.display = !config.scanMode ? 'flex' : 'none';
    }

    // Technique is only applicable for certain patterns
    const compatiblePatterns = ['row-column', 'column-row', 'linear', 'snake'];
    const techniqueEnabled = !config.scanMode && compatiblePatterns.includes(config.scanPattern);

    if (techniqueSelect) {
      techniqueSelect.disabled = !techniqueEnabled;
      techniqueSelect.style.opacity = techniqueEnabled ? '1' : '0.5';
    }

    // Update hint text
    const techniqueHint = this.formContainer.querySelector('#techniqueHint');
    if (techniqueHint && techniqueSelect) {
      if (!techniqueEnabled) {
        if (config.scanMode) {
          techniqueHint.textContent = 'Disabled by special mode';
        } else {
          techniqueHint.textContent = 'Not available for ' + patternSelect.value;
        }
      } else {
        techniqueHint.textContent = 'For row/col/linear/snake patterns only';
      }
    }
  }

  private bindEvents() {
    // Toggle visibility - scoped to container
    this.container.querySelector('.close-btn')?.addEventListener('click', () => {
      this.toggle(false);
    });

    // Close on background click
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.toggle(false);
      }
    });

    // Form Change Listeners
    this.formContainer.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      if (!target || !target.classList.contains('setting-input')) return;

      const name = target.getAttribute('name');
      const newConfig: Partial<AppConfig> = {};

      switch (name) {
          case 'scanPattern':
              newConfig.scanPattern = target.value as AppConfig['scanPattern'];
              newConfig.scanMode = null; // Clear mode when pattern is set
              break;
          case 'scanTechnique':
              newConfig.scanTechnique = target.value as AppConfig['scanTechnique'];
              break;
          case 'scanMode':
              const modeVal = target.value === 'null' ? null : target.value as AppConfig['scanMode'];
              newConfig.scanMode = modeVal;
              break;
          case 'continuousTechnique':
              newConfig.continuousTechnique = target.value as AppConfig['continuousTechnique'];
              break;
          case 'gridContent':
              newConfig.gridContent = target.value as AppConfig['gridContent'];
              break;
          case 'scanRate':
              newConfig.scanRate = parseInt(target.value, 10);
              this.updateValueDisplay('scanRate', target.value + 'ms');
              break;
          case 'acceptanceTime':
              newConfig.acceptanceTime = parseInt(target.value, 10);
              this.updateValueDisplay('acceptanceTime', target.value + 'ms');
              break;
          case 'dwellTime':
              newConfig.dwellTime = parseInt(target.value, 10);
              this.updateValueDisplay('dwellTime', target.value + 'ms');
              break;
          case 'gridSize':
              newConfig.gridSize = parseInt(target.value, 10);
              this.updateValueDisplay('gridSize', target.value);
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

      // Update UI state after config change
      if (name === 'scanPattern' || name === 'scanMode') {
        this.updateUIState({ ...this.configManager.get(), ...newConfig });
      }
    });

    // Real-time value display for range inputs
    this.formContainer.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (!target || !target.classList.contains('range-input')) return;

      const name = target.getAttribute('name');
      if (name) {
        this.updateValueDisplay(name, target.value + 'ms');
      }
    });
  }

  private updateValueDisplay(inputId: string, value: string) {
    const label = this.formContainer.querySelector(`label[for="${inputId}"]`);
    if (label) {
      const display = label.querySelector('.value-display');
      if (display) {
        display.textContent = value;
      }
    }
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
