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
              <option value="eight-direction">Eight-Direction (Compass)</option>
            </select>
            <small>Gliding: Buffer zone | Crosshair: X-Y lines | Compass: 8-directional movement</small>
          </div>

          <div class="form-group" id="compass-mode-option" style="display: ${config.continuousTechnique === 'eight-direction' ? 'block' : 'none'}">
            <label for="compassMode">Compass Mode</label>
            <select id="compassMode" class="setting-input" name="compassMode">
              <option value="continuous">Continuous (Fluid)</option>
              <option value="fixed-8">Fixed 8 Directions</option>
            </select>
            <small>Continuous: Smooth clock rotation | Fixed-8: 8 discrete directions</small>
          </div>
        </div>

      <div class="form-row" id="elimination-options" style="display: ${config.scanPattern === 'elimination' ? 'flex' : 'none'}">
        <div class="form-group">
          <label for="eliminationSwitchCount">Switch Count</label>
          <select id="eliminationSwitchCount" class="setting-input" name="eliminationSwitchCount">
            <option value="2">2 Switches (Binary)</option>
            <option value="3">3 Switches</option>
            <option value="4">4 Switches (Quadrant)</option>
            <option value="5">5 Switches</option>
            <option value="6">6 Switches</option>
            <option value="7">7 Switches</option>
            <option value="8">8 Switches (Octant)</option>
          </select>
          <small>More switches = faster selection (64 cells in 3 hits with 4 switches)</small>
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
          <label for="scanDirection">Scan Direction</label>
          <select id="scanDirection" class="setting-input" name="scanDirection">
            <option value="circular">Circular (0→1→2...→n→0...)</option>
            <option value="reverse">Reverse (n→n-1...→0→n...)</option>
            <option value="oscillating">Oscillating (0→1→...→n→n-1→...→0...)</option>
          </select>
          <small>Direction of scan cycling (for linear pattern)</small>
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
              <option value="board">AAC Board</option>
            </select>
            <small>What to display in the grid</small>
          </div>

          <div class="form-group">
            <label for="gridSize">Grid Size <span class="value-display">${config.gridSize}</span></label>
            <input type="number" id="gridSize" class="setting-input" name="gridSize"
                   value="${config.gridSize}" min="4" max="100"
                   ${config.gridContent === 'keyboard' || config.gridContent === 'board' ? 'disabled' : ''}>
            <small>Number of items (disabled for keyboard/board mode)</small>
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
          <label for="scanInputMode">Scan Input Mode</label>
          <select id="scanInputMode" class="setting-input" name="scanInputMode">
            <option value="auto">Auto-Scan</option>
            <option value="manual">Manual Step</option>
          </select>
          <small>Auto: Automatic advancement | Manual: User triggers each step</small>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="initialScanDelay">Initial Scan Delay <span class="value-display">${config.initialScanDelay}ms</span></label>
            <input type="range" id="initialScanDelay" class="setting-input range-input" name="initialScanDelay"
                   value="${config.initialScanDelay}" min="0" max="2000" step="100">
            <small>Delay before first scan starts</small>
          </div>

          <div class="form-group">
            <label for="scanPauseDelay">Scan Pause Delay <span class="value-display">${config.scanPauseDelay}ms</span></label>
            <input type="range" id="scanPauseDelay" class="setting-input range-input" name="scanPauseDelay"
                   value="${config.scanPauseDelay}" min="0" max="1000" step="50">
            <small>Pause between hierarchical stages</small>
          </div>
        </div>

        <div class="form-group">
          <label for="initialItemPause">Initial Item Pause <span class="value-display">${config.initialItemPause}ms</span></label>
          <input type="range" id="initialItemPause" class="setting-input range-input" name="initialItemPause"
                 value="${config.initialItemPause}" min="0" max="3000" step="100">
          <small>Extended highlight on first item (0 = normal scan rate)</small>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="autoRepeat" ${config.autoRepeat ? 'checked' : ''}>
            <span>Auto-Repeat Selections</span>
          </label>
          <small>Automatically repeat selections when holding</small>
        </div>

        <div class="form-row" id="repeat-options" style="display: ${config.autoRepeat ? 'flex' : 'none'}">
          <div class="form-group">
            <label for="repeatDelay">Repeat Delay <span class="value-display">${config.repeatDelay}ms</span></label>
            <input type="range" id="repeatDelay" class="setting-input range-input" name="repeatDelay"
                   value="${config.repeatDelay}" min="100" max="2000" step="100">
            <small>Hold time before repeat starts</small>
          </div>

          <div class="form-group">
            <label for="repeatTime">Repeat Time <span class="value-display">${config.repeatTime}ms</span></label>
            <input type="range" id="repeatTime" class="setting-input range-input" name="repeatTime"
                   value="${config.repeatTime}" min="50" max="1000" step="50">
            <small>Time between successive repeats</small>
          </div>
        </div>

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

        <div class="form-group">
          <label for="scanLoops">Scan Loops <span class="value-display">${config.scanLoops}</span></label>
          <input type="range" id="scanLoops" class="setting-input range-input" name="scanLoops"
                 value="${config.scanLoops}" min="0" max="20" step="1">
          <small>Number of complete scan cycles (0 = infinite)</small>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="allowEmptyItems" ${config.allowEmptyItems ? 'checked' : ''}>
            <span>Allow Empty Items</span>
          </label>
          <small>Enable items that skip selection and reset scan (for error recovery)</small>
        </div>

        <div class="form-group">
          <label for="cancelMethod">Cancel Method</label>
          <select id="cancelMethod" class="setting-input" name="cancelMethod">
            <option value="button">Button Press</option>
            <option value="long-hold">Long Hold</option>
          </select>
          <small>How to cancel scanning (button press or hold switch)</small>
        </div>

        <div class="form-group" id="longHoldOptions" style="display: ${config.cancelMethod === 'long-hold' ? 'block' : 'none'}">
          <label for="longHoldTime">Long Hold Time <span class="value-display">${config.longHoldTime}ms</span></label>
          <input type="range" id="longHoldTime" class="setting-input range-input" name="longHoldTime"
                 value="${config.longHoldTime}" min="500" max="3000" step="100">
          <small>Hold duration to trigger cancel (500-3000ms)</small>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="criticalOverscanEnabled" ${config.criticalOverscan.enabled ? 'checked' : ''}>
            <span>Enable Critical Overscan</span>
          </label>
          <small>Two-stage scanning: fast scan → slow backward scan → select</small>
        </div>

        <div id="criticalOverscanOptions" style="display: ${config.criticalOverscan.enabled ? 'block' : 'none'}">
          <div class="form-group">
            <label for="criticalOverscanFastRate">Fast Scan Rate <span class="value-display">${config.criticalOverscan.fastRate}ms</span></label>
            <input type="range" id="criticalOverscanFastRate" class="setting-input range-input" name="criticalOverscanFastRate"
                   value="${config.criticalOverscan.fastRate}" min="50" max="500" step="10">
            <small>Speed of initial fast scan (50-500ms)</small>
          </div>

          <div class="form-group">
            <label for="criticalOverscanSlowRate">Slow Scan Rate <span class="value-display">${config.criticalOverscan.slowRate}ms</span></label>
            <input type="range" id="criticalOverscanSlowRate" class="setting-input range-input" name="criticalOverscanSlowRate"
                   value="${config.criticalOverscan.slowRate}" min="500" max="3000" step="100">
            <small>Speed of slow backward scan (500-3000ms)</small>
          </div>
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

        <div class="form-group">
          <label for="highlightBorderWidth">Highlight Border Width <span class="value-display">${config.highlightBorderWidth}px</span></label>
          <input type="range" id="highlightBorderWidth" class="setting-input range-input" name="highlightBorderWidth"
                 value="${config.highlightBorderWidth}" min="0" max="10" step="1">
          <small>Thickness of highlight outline (0-10px)</small>
        </div>

        <div class="form-group">
          <label for="highlightBorderColor">Highlight Border Color</label>
          <input type="color" id="highlightBorderColor" class="setting-input" name="highlightBorderColor"
                 value="${config.highlightBorderColor}">
          <small>Color of highlight outline (orange by default)</small>
        </div>

        <div class="form-group">
          <label for="highlightScale">Highlight Scale <span class="value-display">${config.highlightScale}x</span></label>
          <input type="range" id="highlightScale" class="setting-input range-input" name="highlightScale"
                 value="${config.highlightScale}" min="1.0" max="1.5" step="0.05">
          <small>Size multiplier for highlighted items (1.0-1.5, 1.0 = no zoom)</small>
        </div>

        <div class="form-group">
          <label for="highlightOpacity">Highlight Opacity <span class="value-display">${config.highlightOpacity}</span></label>
          <input type="range" id="highlightOpacity" class="setting-input range-input" name="highlightOpacity"
                 value="${config.highlightOpacity}" min="0.3" max="1.0" step="0.05">
          <small>Opacity of highlighted items (0.3-1.0, 1.0 = fully opaque)</small>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="highlightAnimation" ${config.highlightAnimation ? 'checked' : ''}>
            <span>Highlight Animation</span>
          </label>
          <small>Enable pulse animation on highlighted items</small>
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
    setVal('scanDirection', config.scanDirection);
    setVal('cancelMethod', config.cancelMethod);
    setVal('longHoldTime', config.longHoldTime.toString());
    setVal('scanMode', config.scanMode || 'null');
    setVal('continuousTechnique', config.continuousTechnique);
    setVal('compassMode', config.compassMode);
    setVal('scanInputMode', config.scanInputMode);
    setVal('gridContent', config.gridContent);
    setVal('language', config.language);
    setVal('layoutMode', config.layoutMode);
    setVal('viewMode', config.viewMode);

    // Update UI state based on current config
    this.updateUIState(config);

    // Set initial visibility of repeat options
    const repeatOptions = this.formContainer.querySelector('#repeat-options') as HTMLElement;
    if (repeatOptions) {
      repeatOptions.style.display = config.autoRepeat ? 'flex' : 'none';
    }
  }

  private updateUIState(config: AppConfig) {
    const techniqueSelect = this.formContainer.querySelector('[name="scanTechnique"]') as HTMLSelectElement;
    const patternSelect = this.formContainer.querySelector('[name="scanPattern"]') as HTMLSelectElement;
    const continuousOptions = this.formContainer.querySelector('#continuous-options') as HTMLElement;
    const patternOptions = this.formContainer.querySelector('#pattern-options') as HTMLElement;
    const compassModeOption = this.formContainer.querySelector('#compass-mode-option') as HTMLElement;

    // Show/hide continuous technique options
    if (continuousOptions) {
      continuousOptions.style.display = config.scanMode === 'continuous' ? 'flex' : 'none';
    }

    // Show/hide compass mode option (only for eight-direction)
    if (compassModeOption) {
      compassModeOption.style.display = config.continuousTechnique === 'eight-direction' ? 'block' : 'none';
    }

    // Show/hide elimination options (only for elimination pattern)
    const eliminationOptions = this.formContainer.querySelector('#elimination-options') as HTMLElement;
    if (eliminationOptions) {
      eliminationOptions.style.display = config.scanPattern === 'elimination' ? 'flex' : 'none';
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
          case 'scanDirection':
              newConfig.scanDirection = target.value as AppConfig['scanDirection'];
              break;
          case 'scanMode':
              const modeVal = target.value === 'null' ? null : target.value as AppConfig['scanMode'];
              newConfig.scanMode = modeVal;
              break;
          case 'continuousTechnique':
              newConfig.continuousTechnique = target.value as AppConfig['continuousTechnique'];
              break;
          case 'compassMode':
              newConfig.compassMode = target.value as AppConfig['compassMode'];
              break;
          case 'eliminationSwitchCount':
              newConfig.eliminationSwitchCount = parseInt(target.value, 10) as AppConfig['eliminationSwitchCount'];
              break;
          case 'gridContent':
              newConfig.gridContent = target.value as AppConfig['gridContent'];
              // Enable/disable grid size based on content type
              const gridSizeInput = this.formContainer.querySelector('[name="gridSize"]') as HTMLInputElement;
              if (gridSizeInput) {
                gridSizeInput.disabled = target.value === 'keyboard';
              }
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
          case 'allowEmptyItems':
              newConfig.allowEmptyItems = (target as HTMLInputElement).checked;
              break;
          case 'cancelMethod':
              newConfig.cancelMethod = target.value as AppConfig['cancelMethod'];
              break;
          case 'longHoldTime':
              newConfig.longHoldTime = parseInt(target.value, 10);
              this.updateValueDisplay('longHoldTime', target.value + 'ms');
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
          case 'scanInputMode':
              newConfig.scanInputMode = target.value as 'auto' | 'manual';
              break;
          case 'initialScanDelay':
              newConfig.initialScanDelay = parseInt(target.value, 10);
              this.updateValueDisplay('initialScanDelay', target.value + 'ms');
              break;
          case 'scanPauseDelay':
              newConfig.scanPauseDelay = parseInt(target.value, 10);
              this.updateValueDisplay('scanPauseDelay', target.value + 'ms');
              break;
          case 'initialItemPause':
              newConfig.initialItemPause = parseInt(target.value, 10);
              this.updateValueDisplay('initialItemPause', target.value + 'ms');
              break;
          case 'scanLoops':
              newConfig.scanLoops = parseInt(target.value, 10);
              this.updateValueDisplay('scanLoops', target.value === '0' ? 'Infinite' : target.value);
              break;
          case 'autoRepeat':
              newConfig.autoRepeat = (target as HTMLInputElement).checked;
              break;
          case 'repeatDelay':
              newConfig.repeatDelay = parseInt(target.value, 10);
              this.updateValueDisplay('repeatDelay', target.value + 'ms');
              break;
          case 'repeatTime':
              newConfig.repeatTime = parseInt(target.value, 10);
              this.updateValueDisplay('repeatTime', target.value + 'ms');
              break;
          case 'criticalOverscanEnabled':
              newConfig.criticalOverscan = {
                  ...this.configManager.get().criticalOverscan,
                  enabled: (target as HTMLInputElement).checked
              };
              break;
          case 'criticalOverscanFastRate':
              newConfig.criticalOverscan = {
                  ...this.configManager.get().criticalOverscan,
                  fastRate: parseInt(target.value, 10)
              };
              this.updateValueDisplay('criticalOverscanFastRate', target.value + 'ms');
              break;
          case 'criticalOverscanSlowRate':
              newConfig.criticalOverscan = {
                  ...this.configManager.get().criticalOverscan,
                  slowRate: parseInt(target.value, 10)
              };
              this.updateValueDisplay('criticalOverscanSlowRate', target.value + 'ms');
              break;
          case 'highlightBorderWidth':
              newConfig.highlightBorderWidth = parseInt(target.value, 10);
              this.updateValueDisplay('highlightBorderWidth', target.value + 'px');
              break;
          case 'highlightBorderColor':
              newConfig.highlightBorderColor = target.value;
              break;
          case 'highlightScale':
              newConfig.highlightScale = parseFloat(target.value);
              this.updateValueDisplay('highlightScale', target.value + 'x');
              break;
          case 'highlightOpacity':
              newConfig.highlightOpacity = parseFloat(target.value);
              this.updateValueDisplay('highlightOpacity', target.value);
              break;
          case 'highlightAnimation':
              newConfig.highlightAnimation = (target as HTMLInputElement).checked;
              break;
      }

      this.configManager.update(newConfig);

      // Update UI state after config change
      if (name === 'scanPattern' || name === 'scanMode' || name === 'continuousTechnique' || name === 'cancelMethod') {
        this.updateUIState({ ...this.configManager.get(), ...newConfig });
      }

      // Show/hide long hold options based on cancel method
      if (name === 'cancelMethod') {
        const longHoldOptions = this.formContainer.querySelector('#longHoldOptions') as HTMLElement;
        if (longHoldOptions) {
          longHoldOptions.style.display = target.value === 'long-hold' ? 'block' : 'none';
        }
      }

      // Show/hide repeat options based on autoRepeat
      if (name === 'autoRepeat') {
        const repeatOptions = this.formContainer.querySelector('#repeat-options') as HTMLElement;
        if (repeatOptions) {
          repeatOptions.style.display = (target as HTMLInputElement).checked ? 'flex' : 'none';
        }
      }

      // Show/hide critical overscan options based on enabled state
      if (name === 'criticalOverscanEnabled') {
        const criticalOverscanOptions = this.formContainer.querySelector('#criticalOverscanOptions') as HTMLElement;
        if (criticalOverscanOptions) {
          criticalOverscanOptions.style.display = (target as HTMLInputElement).checked ? 'block' : 'none';
        }
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
