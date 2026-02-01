import { ConfigManager, AppConfig } from './ConfigManager';
import { AudioManager } from './AudioManager';
import { SwitchInput } from './SwitchInput';
import { GridRenderer, GridItem } from './GridRenderer';
import { SettingsUI } from './SettingsUI';
import { AlphabetManager } from './AlphabetManager';

import { Scanner } from './scanners/Scanner';
import { RowColumnScanner } from './scanners/RowColumnScanner';
import { LinearScanner } from './scanners/LinearScanner';
import { SnakeScanner } from './scanners/SnakeScanner';
import { QuadrantScanner } from './scanners/QuadrantScanner';
import { GroupScanner } from './scanners/GroupScanner';
import { EliminationScanner } from './scanners/EliminationScanner';
import { ContinuousScanner } from './scanners/ContinuousScanner';
import { ProbabilityScanner } from './scanners/ProbabilityScanner';

export class SwitchScannerElement extends HTMLElement {
  private configManager!: ConfigManager;
  private audioManager!: AudioManager;
  private switchInput!: SwitchInput;
  private alphabetManager!: AlphabetManager;
  private gridRenderer!: GridRenderer;
  private settingsUI!: SettingsUI;

  private currentScanner: Scanner | null = null;
  private baseItems: GridItem[] = [];

  private dwellTimer: number | null = null;
  private currentDwellTarget: HTMLElement | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    if (this.configManager) return; // Already initialized

    this.renderTemplate();
    this.setupStyles();

    // Parse attributes for initial config overrides
    const overrides = this.parseAttributes();

    // Managers
    this.configManager = new ConfigManager(overrides, false);

    this.audioManager = new AudioManager(this.configManager.get().soundEnabled);
    this.alphabetManager = new AlphabetManager();
    await this.alphabetManager.init(); // Wait for alphabets

    // Components
    this.switchInput = new SwitchInput(this.configManager, this);

    const gridContainer = this.shadowRoot!.querySelector('.grid-container') as HTMLElement;
    this.gridRenderer = new GridRenderer(gridContainer);

    const settingsOverlay = this.shadowRoot!.querySelector('.settings-overlay') as HTMLElement;
    this.settingsUI = new SettingsUI(this.configManager, this.alphabetManager, settingsOverlay);

    // Initial Grid & Scanner Setup
    const initialConfig = this.configManager.get();

    // Create scanner first so we can use it for mapping content during grid update
    this.currentScanner = this.createScanner(initialConfig);

    await this.updateGrid(initialConfig, true);

    this.currentScanner.start();

    if (initialConfig.viewMode !== 'standard') {
        this.updateGrid(initialConfig, false);
    }

    this.bindEvents();

    // Add tabindex to allow focus
    if (!this.hasAttribute('tabindex')) {
        this.setAttribute('tabindex', '0');
    }
  }

  static get observedAttributes() {
    return ['scan-strategy', 'scan-pattern', 'scan-technique', 'scan-mode', 'continuous-technique', 'compass-mode', 'grid-content', 'grid-size', 'language', 'scan-rate', 'acceptance-time', 'dwell-time'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (!this.configManager) return;
    if (oldValue === newValue) return;

    const updates: Partial<AppConfig> = {};
    switch (name) {
        case 'scan-strategy':
            // Legacy support - map to new structure
            this.mapLegacyStrategy(newValue, updates);
            break;
        case 'scan-pattern':
            updates.scanPattern = newValue as AppConfig['scanPattern'];
            updates.scanMode = null; // Clear mode when pattern is set
            break;
        case 'scan-technique':
            updates.scanTechnique = newValue as AppConfig['scanTechnique'];
            break;
        case 'scan-mode':
            updates.scanMode = newValue === 'null' ? null : newValue as AppConfig['scanMode'];
            break;
        case 'grid-content':
            updates.gridContent = newValue as AppConfig['gridContent'];
            break;
        case 'grid-size':
            updates.gridSize = parseInt(newValue, 10);
            break;
        case 'language':
            updates.language = newValue;
            break;
        case 'scan-rate':
            updates.scanRate = parseInt(newValue, 10);
            break;
        case 'acceptance-time':
            updates.acceptanceTime = parseInt(newValue, 10);
            break;
        case 'dwell-time':
            updates.dwellTime = parseInt(newValue, 10);
            break;
        case 'continuous-technique':
            updates.continuousTechnique = newValue as AppConfig['continuousTechnique'];
            break;
        case 'compass-mode':
            updates.compassMode = newValue as AppConfig['compassMode'];
            break;
    }
    this.configManager.update(updates);
  }

  private mapLegacyStrategy(strategy: string, updates: Partial<AppConfig>) {
      // Map old scanStrategy to new pattern/technique/mode structure
      if (strategy === 'group-row-column') {
          updates.scanMode = 'group-row-column';
      } else if (strategy === 'continuous') {
          updates.scanMode = 'continuous';
      } else if (strategy === 'probability') {
          updates.scanMode = 'probability';
      } else if (['row-column', 'column-row', 'linear', 'snake', 'quadrant', 'elimination'].includes(strategy)) {
          updates.scanPattern = strategy as AppConfig['scanPattern'];
          // Row-column and column-row default to block technique
          if (strategy === 'row-column' || strategy === 'column-row') {
              updates.scanTechnique = 'block';
          } else {
              updates.scanTechnique = 'point';
          }
      }
  }

  private parseAttributes(): Partial<AppConfig> {
    const overrides: Partial<AppConfig> = {};

    // Handle legacy scan-strategy attribute
    const strategy = this.getAttribute('scan-strategy');
    if (strategy) {
      this.mapLegacyStrategy(strategy, overrides);
    }

    // New separate attributes (take precedence)
    const pattern = this.getAttribute('scan-pattern');
    if (pattern) {
      overrides.scanPattern = pattern as AppConfig['scanPattern'];
      overrides.scanMode = null;
    }

    const technique = this.getAttribute('scan-technique');
    if (technique) overrides.scanTechnique = technique as AppConfig['scanTechnique'];

    const mode = this.getAttribute('scan-mode');
    if (mode) overrides.scanMode = mode === 'null' ? null : mode as AppConfig['scanMode'];

    const content = this.getAttribute('grid-content');
    if (content) overrides.gridContent = content as AppConfig['gridContent'];

    const size = this.getAttribute('grid-size');
    if (size) overrides.gridSize = parseInt(size, 10);

    const lang = this.getAttribute('language');
    if (lang) overrides.language = lang;

    const rate = this.getAttribute('scan-rate');
    if (rate) overrides.scanRate = parseInt(rate, 10);

    const acceptance = this.getAttribute('acceptance-time');
    if (acceptance) overrides.acceptanceTime = parseInt(acceptance, 10);

    const dwell = this.getAttribute('dwell-time');
    if (dwell) overrides.dwellTime = parseInt(dwell, 10);

    const contTechnique = this.getAttribute('continuous-technique');
    if (contTechnique) overrides.continuousTechnique = contTechnique as AppConfig['continuousTechnique'];

    const compassMode = this.getAttribute('compass-mode');
    if (compassMode) overrides.compassMode = compassMode as AppConfig['compassMode'];

    return overrides;
  }

  private renderTemplate() {
    this.shadowRoot!.innerHTML = `
      <div class="scanner-wrapper">
        <div class="status-bar">
          <span class="output-text"></span>
          <button class="settings-btn" title="Settings">⚙️</button>
        </div>
        <div class="grid-container"></div>
        <div class="controls">
           <button data-action="select">Select (Space)</button>
           <button data-action="step">Step (2)</button>
           <button data-action="reset">Reset (3)</button>
        </div>
        <div class="settings-overlay hidden"></div>
      </div>
    `;
  }

  private setupStyles() {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 400px;
        position: relative;
        font-family: sans-serif;
        border: 1px solid #ddd;
        box-sizing: border-box;
      }
      :host(:focus) {
        outline: 2px solid #2196F3;
      }

      .scanner-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        background: #fff;
      }

      .status-bar {
        background: #222;
        color: white;
        padding: 0.5rem 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: 40px;
      }

      .output-text {
        font-family: monospace;
        font-size: 1.2rem;
        white-space: pre-wrap;
      }

      .settings-btn {
        background: transparent;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
      }

      .grid-container {
        flex: 1;
        padding: 10px;
        display: grid;
        grid-gap: 5px;
        overflow: auto;
        position: relative; /* For absolute overlays */
      }

      .grid-cell {
        background: #f0f0f0;
        color: #333;
        border: 1px solid #ccc;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        user-select: none;
        min-height: 50px;
      }

      .scan-focus {
        outline: 4px solid yellow;
        outline-offset: -4px;
        z-index: 10;
      }

      .dwell-active {
         background-image: linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1));
         outline: 2px dashed #ff9800;
         outline-offset: -2px;
      }

      .selected {
        background-color: #4CAF50 !important;
        color: white;
      }

      .controls {
        display: flex;
        gap: 10px;
        padding: 10px;
        background: #eee;
        justify-content: center;
      }

      .controls button {
        padding: 10px 20px;
        font-size: 1rem;
        cursor: pointer;
        border: 1px solid #ccc;
        background: #fff;
        border-radius: 4px;
      }

      .controls button:active {
        background: #ddd;
      }

      .settings-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
        padding: 10px;
        box-sizing: border-box;
      }
      .settings-overlay.hidden {
        display: none !important;
      }
      .settings-content {
        background: white;
        border-radius: 12px;
        width: 100%;
        max-width: 600px;
        max-height: 100%;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      }

      /* Header with close button */
      .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #e0e0e0;
        position: sticky;
        top: 0;
        background: white;
        z-index: 10;
      }
      .settings-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #222;
      }
      .close-btn {
        background: #f5f5f5;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        transition: all 0.2s;
        flex-shrink: 0;
      }
      .close-btn:hover {
        background: #e0e0e0;
        color: #333;
      }
      .close-btn:active {
        transform: scale(0.95);
      }

      /* Intro section */
      .settings-intro {
        padding: 1rem 1.5rem;
        background: #f8f9fa;
        border-bottom: 1px solid #e0e0e0;
      }
      .settings-intro p {
        margin: 0;
        font-size: 0.9rem;
        color: #555;
        line-height: 1.5;
      }

      /* Form sections */
      .settings-section {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #f0f0f0;
      }
      .settings-section:last-child {
        border-bottom: none;
      }
      .settings-section h3 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #333;
      }

      /* Form elements */
      .form-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }
      .form-group {
        flex: 1;
        min-width: 200px;
        margin-bottom: 0.75rem;
      }
      .form-group label {
        display: block;
        font-weight: 600;
        font-size: 0.85rem;
        color: #444;
        margin-bottom: 0.35rem;
      }
      .form-group label .value-display {
        color: #2196F3;
        font-weight: normal;
      }
      .form-group small {
        display: block;
        color: #888;
        font-size: 0.8rem;
        margin-top: 0.25rem;
        line-height: 1.3;
      }
      .form-group input[type="number"],
      .form-group select {
        width: 100%;
        padding: 0.6rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.95rem;
        box-sizing: border-box;
        background: white;
        transition: border-color 0.2s;
      }
      .form-group input[type="number"]:focus,
      .form-group select:focus {
        outline: none;
        border-color: #2196F3;
      }
      .form-group input:disabled,
      .form-group select:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Range inputs */
      .range-input {
        -webkit-appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: #ddd;
        outline: none;
        padding: 0;
        border: none;
      }
      .range-input::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #2196F3;
        cursor: pointer;
        transition: background 0.2s;
      }
      .range-input::-webkit-slider-thumb:hover {
        background: #1976D2;
      }
      .range-input::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #2196F3;
        cursor: pointer;
        border: none;
      }

      /* Checkbox group */
      .checkbox-group label {
        display: flex;
        align-items: center;
        cursor: pointer;
        font-weight: 500;
      }
      .checkbox-group input[type="checkbox"] {
        width: 20px;
        height: 20px;
        margin-right: 0.5rem;
        cursor: pointer;
      }
      .checkbox-group span {
        user-select: none;
      }

      /* Mobile responsive */
      @media (max-width: 600px) {
        .settings-content {
          max-height: 100vh;
          border-radius: 0;
        }
        .settings-header {
          padding: 1rem;
        }
        .settings-header h2 {
          font-size: 1.25rem;
        }
        .settings-section {
          padding: 1rem;
        }
        .form-group {
          min-width: 100%;
        }
        .form-row {
          flex-direction: column;
          gap: 0.75rem;
        }
        .close-btn {
          width: 32px;
          height: 32px;
          font-size: 20px;
        }
        .settings-intro p {
          font-size: 0.85rem;
        }
      }
    `;
    this.shadowRoot!.appendChild(style);
  }

  private bindEvents() {
    // Config Changes
    let lastConfig = this.configManager.get();
    this.configManager.subscribe(async (cfg) => {
        this.audioManager.setEnabled(cfg.soundEnabled);

        const contentChanged = cfg.gridContent !== lastConfig.gridContent ||
                               cfg.gridSize !== lastConfig.gridSize ||
                               cfg.language !== lastConfig.language ||
                               cfg.layoutMode !== lastConfig.layoutMode;

        const scannerChanged = cfg.scanPattern !== lastConfig.scanPattern ||
                              cfg.scanTechnique !== lastConfig.scanTechnique ||
                              cfg.scanMode !== lastConfig.scanMode;

        if (scannerChanged) {
          console.log('[SwitchScannerElement] Scanner changed:', {
            old: { scanMode: lastConfig.scanMode, scanPattern: lastConfig.scanPattern },
            new: { scanMode: cfg.scanMode, scanPattern: cfg.scanPattern }
          });
        }

        const viewChanged = cfg.viewMode !== lastConfig.viewMode || cfg.heatmapMax !== lastConfig.heatmapMax;

        if (contentChanged) {
            // Need to update content.
            await this.updateGrid(cfg, true);
        } else if (scannerChanged) {
            this.setScanner(cfg);
            // Scanner change requires re-mapping content (e.g. Snake)
            await this.updateGrid(cfg, true);
        } else if (viewChanged) {
            await this.updateGrid(cfg, false);
        }
        lastConfig = cfg;
    });

    // Switch Input
    this.switchInput.addEventListener('switch', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail.action === 'menu') {
            this.settingsUI.toggle();
            return;
        }
        if (this.currentScanner) {
            this.currentScanner.handleAction(detail.action);
        }
    });

    // Settings Button
    this.shadowRoot!.querySelector('.settings-btn')?.addEventListener('click', () => {
        this.settingsUI.toggle();
    });

    // On-screen Controls
    this.shadowRoot!.querySelectorAll('.controls button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = (e.target as HTMLElement).getAttribute('data-action');
            if (action) {
                this.switchInput.triggerAction(action as any);
            }
        });
        btn.addEventListener('mousedown', (e) => e.preventDefault());
    });

    // Scanner Events (Selection & Redraw)
    const gridContainer = this.shadowRoot!.querySelector('.grid-container') as HTMLElement;

    gridContainer.addEventListener('scanner:selection', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        const item = detail.item;

        const output = this.shadowRoot!.querySelector('.output-text');
        if (output) {
             const label = item.label;

             if (label === 'Backspace') {
                  output.textContent = output.textContent?.slice(0, -1) || '';
             } else if (label === 'Clear') {
                  output.textContent = '';
             } else if (label === 'Enter') {
                  output.textContent += '\n';
             } else if (label === 'Space') {
                  output.textContent += ' ';
             } else {
                  output.textContent += label;
             }
        }
    });

    gridContainer.addEventListener('scanner:redraw', () => {
        // Trigger visual update (heatmap/cost)
        const config = this.configManager.get();
        this.updateGrid(config, false);
    });

    // Dwell Activation Logic
    gridContainer.addEventListener('mousemove', (e: MouseEvent) => {
        const target = (e.target as HTMLElement).closest('.grid-cell') as HTMLElement;
        this.handleDwell(target);
    });
    gridContainer.addEventListener('mouseleave', () => {
        this.handleDwell(null);
    });
  }

  private handleDwell(target: HTMLElement | null) {
      if (this.currentDwellTarget === target) return;

      // Clear previous
      if (this.dwellTimer) {
          window.clearTimeout(this.dwellTimer);
          this.dwellTimer = null;
      }
      if (this.currentDwellTarget) {
          this.currentDwellTarget.classList.remove('dwell-active');
      }

      this.currentDwellTarget = target;

      const config = this.configManager.get();
      if (target && config.dwellTime > 0) {
          target.classList.add('dwell-active');

          this.dwellTimer = window.setTimeout(() => {
              if (this.currentDwellTarget === target) {
                  this.triggerItemSelection(target);
                  // Reset
                  target.classList.remove('dwell-active');
                  this.currentDwellTarget = null;
              }
          }, config.dwellTime);
      }
  }

  private triggerItemSelection(target: HTMLElement) {
      const index = parseInt(target.dataset.index || '-1', 10);
      if (index >= 0) {
          this.gridRenderer.setSelected(index);

          const item = this.gridRenderer.getItem(index);
          if (item) {
               const event = new CustomEvent('scanner:selection', {
                    bubbles: true,
                    composed: true,
                    detail: { item }
               });
               this.gridRenderer.getContainer().dispatchEvent(event);

               if (this.audioManager) this.audioManager.playSelectSound();
          }
      }
  }

  private generateNumbers(size: number): GridItem[] {
    const items: GridItem[] = [];
    for (let i = 1; i <= size; i++) {
      items.push({
        id: `item-${i}`,
        label: i.toString(),
        type: 'action'
      });
    }
    return items;
  }

  private async generateKeyboard(config: AppConfig): Promise<GridItem[]> {
    await this.alphabetManager.loadLanguage(config.language);
    const chars = this.alphabetManager.getCharacters(config.layoutMode);

    const items: GridItem[] = chars.map((c, i) => ({
        id: `char-${i}`,
        label: c,
        type: 'char' as const
    }));

    [' ', '.', ',', '?', '!', 'Backspace', 'Clear', 'Enter'].forEach((c, i) => {
        items.push({
            id: `ctrl-${i}`,
            label: c === ' ' ? 'Space' : c,
            type: 'action'
        });
    });

    return items;
  }

  private getHeatmapColor(cost: number, max: number) {
    const t = Math.min(cost / max, 1);
    const hue = 120 * (1 - t);
    return `hsl(${hue}, 80%, 80%)`;
  }

  private applyVisualization(items: GridItem[], config: AppConfig): GridItem[] {
      if (!this.currentScanner) return items;
      if (config.viewMode === 'standard') return items;

      return items.map((item, index) => {
          // If item is empty/undefined (grid gap), skip?
          if (!item) return item;

          const cost = this.currentScanner!.getCost(index);
          const newItem = { ...item };

          if (config.viewMode === 'cost-numbers') {
              newItem.label = cost.toString();
          } else if (config.viewMode === 'cost-heatmap') {
              newItem.backgroundColor = this.getHeatmapColor(cost, config.heatmapMax);
              newItem.textColor = '#000';
          }
          return newItem;
      });
  }

  private async updateGrid(config: AppConfig, forceRegen: boolean = false) {
      // 1. Generate Base Content (Linear)
      if (forceRegen) {
          if (config.gridContent === 'keyboard') {
              this.baseItems = await this.generateKeyboard(config);
          } else {
              this.baseItems = this.generateNumbers(config.gridSize);
          }
      }

      // 2. Determine Dimensions
      const total = this.baseItems.length;
      const cols = Math.ceil(Math.sqrt(total));
      const rows = Math.ceil(total / cols);

      // 3. Map Content to Grid based on Strategy
      // We need the current scanner to do this mapping.
      // If we are changing strategy, we should have set the new scanner before calling updateGrid(..., true).
      // But in bindEvents, we call setScanner AFTER updateGrid for strategy changes?
      // Wait, if strategy changes, we want new layout. So we need the new scanner first.

      // I'll ensure setScanner is called before updateGrid if strategy changes.
      // Or simply assume currentScanner is correct.

      let displayItems = this.baseItems;
      if (this.currentScanner) {
          displayItems = this.currentScanner.mapContentToGrid(this.baseItems, rows, cols);
      }

      // 4. Render
      this.gridRenderer.render(displayItems, cols);

      // 5. Apply Visualization (if needed)
      if (config.viewMode !== 'standard' && this.currentScanner) {
          const visualItems = this.applyVisualization(displayItems, config);
          this.gridRenderer.render(visualItems, cols);
      }
  }

  private createScanner(config: AppConfig): Scanner {
    console.log('[SwitchScannerElement] Creating scanner with config:', {
      scanMode: config.scanMode,
      scanPattern: config.scanPattern,
      scanTechnique: config.scanTechnique,
      continuousTechnique: config.continuousTechnique
    });

    // Special modes take precedence
    if (config.scanMode === 'group-row-column') {
      return new GroupScanner(this.gridRenderer, this.configManager, this.audioManager);
    } else if (config.scanMode === 'continuous') {
      console.log('[SwitchScannerElement] Creating ContinuousScanner');
      return new ContinuousScanner(this.gridRenderer, this.configManager, this.audioManager);
    } else if (config.scanMode === 'probability') {
      return new ProbabilityScanner(this.gridRenderer, this.configManager, this.audioManager);
    }

    // Pattern-based scanners
    switch (config.scanPattern) {
      case 'linear':
        return new LinearScanner(this.gridRenderer, this.configManager, this.audioManager);
      case 'snake':
        return new SnakeScanner(this.gridRenderer, this.configManager, this.audioManager);
      case 'quadrant':
        return new QuadrantScanner(this.gridRenderer, this.configManager, this.audioManager);
      case 'elimination':
        return new EliminationScanner(this.gridRenderer, this.configManager, this.audioManager);
      case 'column-row':
        return new RowColumnScanner(this.gridRenderer, this.configManager, this.audioManager);
      case 'row-column':
      default:
        return new RowColumnScanner(this.gridRenderer, this.configManager, this.audioManager);
    }
  }

  private setScanner(config: AppConfig) {
    console.log('[SwitchScannerElement] setScanner called');

    if (this.currentScanner) {
      console.log('[SwitchScannerElement] Stopping current scanner');
      this.currentScanner.stop();
    }

    this.currentScanner = this.createScanner(config);

    console.log('[SwitchScannerElement] Starting new scanner:', this.currentScanner.constructor.name);
    this.currentScanner.start();
  }
}
