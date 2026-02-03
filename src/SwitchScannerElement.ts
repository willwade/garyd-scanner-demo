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
import { CauseEffectScanner } from './scanners/CauseEffectScanner';
import { ColorCodeScanner } from './scanners/ColorCodeScanner';
import { loadAACFile, getBrowserExtensions } from 'aac-board-viewer';
import type { AACTree, AACPage, AACButton } from 'aac-board-viewer';

function getAssetBase(): string {
  const globalBase = (window as unknown as { SWITCH_SCANNER_ASSET_BASE?: string }).SWITCH_SCANNER_ASSET_BASE;
  const base = globalBase && globalBase.length > 0 ? globalBase : '/';
  return base.endsWith('/') ? base : `${base}/`;
}

// Map image URLs by color for easy lookup
const SWITCH_IMAGES = {
  blue: { normal: `${getAssetBase()}switches/switch-blue.png`, depressed: `${getAssetBase()}switches/switch-blue-depressed.png` },
  green: { normal: `${getAssetBase()}switches/switch-green.png`, depressed: `${getAssetBase()}switches/switch-green-depressed.png` },
  red: { normal: `${getAssetBase()}switches/switch-red.png`, depressed: `${getAssetBase()}switches/switch-red-depressed.png` },
  yellow: { normal: `${getAssetBase()}switches/switch-yellow.png`, depressed: `${getAssetBase()}switches/switch-yellow-depressed.png` },
} as const;

export class SwitchScannerElement extends HTMLElement {
  private configManager!: ConfigManager;
  private audioManager!: AudioManager;
  private switchInput!: SwitchInput;
  private alphabetManager!: AlphabetManager;
  private gridRenderer!: GridRenderer;
  private settingsUI!: SettingsUI;

  private currentScanner: Scanner | null = null;
  private baseItems: GridItem[] = [];
  private customItems: GridItem[] | null = null;
  private forcedGridCols: number | null = null;
  private outputHistory: string[] = [];
  private redoStack: string[] = [];
  private boardTree: AACTree | null = null;
  private boardPageId: string | null = null;
  private boardLoadError: string | null = null;

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
    this.setupBoardControls();

    // Initial Grid & Scanner Setup
    const initialConfig = this.configManager.get();

    // Create scanner first so we can use it for mapping content during grid update
    this.currentScanner = this.createScanner(initialConfig);

    await this.initBoardIfNeeded();

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

    // Apply theme if present
    const theme = this.getAttribute('theme');
    if (theme) {
        this.updateTheme(theme);
    }
  }

  static get observedAttributes() {
    return [
      'scan-strategy',
      'scan-pattern',
      'scan-technique',
      'scan-mode',
      'scan-input-mode',
      'continuous-technique',
      'compass-mode',
      'grid-content',
      'grid-size',
      'board-src',
      'board-upload',
      'board-page',
      'language',
      'scan-rate',
      'acceptance-time',
      'dwell-time',
      'elimination-switch-count',
      'custom-items',
      'grid-cols',
      'theme',
      'cancel-method',
      'long-hold-time',
      'critical-overscan-enabled',
      'critical-overscan-fast-rate',
      'critical-overscan-slow-rate',
      'highlight-scan-line',
      'highlight-border-width',
      'highlight-border-color',
      'highlight-scale',
      'highlight-opacity',
      'highlight-animation'
    ];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'custom-items') {
        this.parseCustomItems(newValue);
        if (this.configManager) { // Only update if initialized
             this.updateGrid(this.configManager.get(), true);
        }
        return;
    }
    if (name === 'grid-cols') {
        this.forcedGridCols = parseInt(newValue, 10);
        if (this.configManager) {
             this.updateGrid(this.configManager.get(), true);
        }
        return;
    }
    if (name === 'theme') {
        this.updateTheme(newValue);
        return;
    }

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
        case 'scan-input-mode':
            updates.scanInputMode = newValue as AppConfig['scanInputMode'];
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
        case 'board-src':
            if (newValue) {
                this.configManager.update({ gridContent: 'board' });
                this.loadBoardFromUrl(newValue);
            }
            break;
        case 'board-page':
            if (newValue) {
                this.setBoardPage(newValue);
            }
            break;
        case 'board-upload':
            if (this.hasAttribute('board-upload')) {
                this.configManager.update({ gridContent: 'board' });
            }
            this.updateBoardControlsVisibility();
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
        case 'elimination-switch-count':
            updates.eliminationSwitchCount = parseInt(newValue, 10) as AppConfig['eliminationSwitchCount'];
            break;
        case 'cancel-method':
            updates.cancelMethod = newValue as AppConfig['cancelMethod'];
            break;
        case 'long-hold-time':
            updates.longHoldTime = parseInt(newValue, 10);
            break;
        case 'highlight-scan-line':
            updates.highlightScanLine = newValue === 'true' || newValue === '1';
            break;
        case 'highlight-border-width':
            updates.highlightBorderWidth = parseInt(newValue, 10);
            break;
        case 'highlight-border-color':
            updates.highlightBorderColor = newValue;
            break;
        case 'highlight-scale':
            updates.highlightScale = parseFloat(newValue);
            break;
        case 'highlight-opacity':
            updates.highlightOpacity = parseFloat(newValue);
            break;
        case 'highlight-animation':
            updates.highlightAnimation = newValue === 'true' || newValue === '1';
            break;
        case 'critical-overscan-enabled':
            updates.criticalOverscan = {
                ...this.configManager.get().criticalOverscan,
                enabled: newValue === 'true' || newValue === '1'
            };
            break;
        case 'critical-overscan-fast-rate':
            updates.criticalOverscan = {
                ...this.configManager.get().criticalOverscan,
                fastRate: parseInt(newValue, 10)
            };
            break;
        case 'critical-overscan-slow-rate':
            updates.criticalOverscan = {
                ...this.configManager.get().criticalOverscan,
                slowRate: parseInt(newValue, 10)
            };
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
      } else if (strategy === 'color-code') {
          updates.scanMode = 'color-code';
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

    const inputMode = this.getAttribute('scan-input-mode');
    if (inputMode) overrides.scanInputMode = inputMode as AppConfig['scanInputMode'];

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

    const elimSwitchCount = this.getAttribute('elimination-switch-count');
    if (elimSwitchCount) overrides.eliminationSwitchCount = parseInt(elimSwitchCount, 10) as AppConfig['eliminationSwitchCount'];

    const cancelMethod = this.getAttribute('cancel-method');
    if (cancelMethod) overrides.cancelMethod = cancelMethod as AppConfig['cancelMethod'];

    const longHold = this.getAttribute('long-hold-time');
    if (longHold) overrides.longHoldTime = parseInt(longHold, 10);

    const scanLine = this.getAttribute('highlight-scan-line');
    if (scanLine) overrides.highlightScanLine = scanLine === 'true' || scanLine === '1';

    const highlightBorderWidth = this.getAttribute('highlight-border-width');
    if (highlightBorderWidth) overrides.highlightBorderWidth = parseInt(highlightBorderWidth, 10);

    const highlightBorderColor = this.getAttribute('highlight-border-color');
    if (highlightBorderColor) overrides.highlightBorderColor = highlightBorderColor;

    const highlightScale = this.getAttribute('highlight-scale');
    if (highlightScale) overrides.highlightScale = parseFloat(highlightScale);

    const highlightOpacity = this.getAttribute('highlight-opacity');
    if (highlightOpacity) overrides.highlightOpacity = parseFloat(highlightOpacity);

    const highlightAnimation = this.getAttribute('highlight-animation');
    if (highlightAnimation) overrides.highlightAnimation = highlightAnimation === 'true' || highlightAnimation === '1';

    const criticalEnabled = this.getAttribute('critical-overscan-enabled');
    const criticalFast = this.getAttribute('critical-overscan-fast-rate');
    const criticalSlow = this.getAttribute('critical-overscan-slow-rate');
    if (criticalEnabled || criticalFast || criticalSlow) {
      overrides.criticalOverscan = {
        enabled: criticalEnabled === 'true' || criticalEnabled === '1',
        fastRate: criticalFast ? parseInt(criticalFast, 10) : 100,
        slowRate: criticalSlow ? parseInt(criticalSlow, 10) : 1000
      };
    }

    // Custom items and columns are handled separately, not in AppConfig directly
    const customItems = this.getAttribute('custom-items');
    if (customItems) this.parseCustomItems(customItems);

    const gridCols = this.getAttribute('grid-cols');
    if (gridCols) this.forcedGridCols = parseInt(gridCols, 10);

    return overrides;
  }

  private parseCustomItems(json: string) {
    try {
        this.customItems = JSON.parse(json);
    } catch (e) {
        console.error('Failed to parse custom-items:', e);
        this.customItems = null;
    }
  }

  private updateBoardControlsVisibility() {
      const boardControls = this.shadowRoot?.querySelector('.board-controls') as HTMLElement | null;
      if (!boardControls) return;
      const show = this.hasAttribute('board-upload');
      boardControls.classList.toggle('hidden', !show);
  }

  private async initBoardIfNeeded() {
      if (!this.configManager) return;
      const config = this.configManager.get();
      const boardSrc = this.getAttribute('board-src');
      const shouldLoad = config.gridContent === 'board' || !!boardSrc || this.hasAttribute('board-upload');
      if (!shouldLoad) return;

      if (config.gridContent !== 'board') {
          this.configManager.update({ gridContent: 'board' });
      }

      this.updateBoardControlsVisibility();

      if (boardSrc) {
          await this.loadBoardFromUrl(boardSrc);
      }
  }

  private async loadBoardFromUrl(url: string) {
      try {
          this.setBoardStatus('Loading board…');
          const resolvedUrl = this.resolveBoardUrl(url);
          const response = await fetch(resolvedUrl);
          if (!response.ok) {
              throw new Error(`Failed to load board: ${response.status}`);
          }
          const blob = await response.blob();
          const name = resolvedUrl.split('/').pop() || 'board';
          const file = new File([blob], name, { type: blob.type || 'application/octet-stream' });
          await this.loadBoardFromFile(file);
      } catch (err) {
          console.error(err);
          this.boardLoadError = err instanceof Error ? err.message : 'Failed to load board';
          this.setBoardStatus('Failed to load board.');
      }
  }

  private async loadBoardFromFile(file: File) {
      try {
          this.setBoardStatus(`Parsing ${file.name}…`);
          const tree = await loadAACFile(file);
          this.boardTree = tree;
          this.boardPageId = this.resolveBoardPageId(tree);
          this.boardLoadError = null;
          this.setBoardStatus(tree.metadata?.name ? tree.metadata.name : file.name);
          await this.updateGrid(this.configManager.get(), true);
          this.currentScanner?.start();
      } catch (err) {
          console.error(err);
          this.boardLoadError = err instanceof Error ? err.message : 'Failed to parse board';
          this.setBoardStatus('Failed to parse board.');
      }
  }

  private resolveBoardPageId(tree: AACTree): string | null {
      const meta = tree.metadata || {};
      const preferred = meta.defaultHomePageId || tree.rootId;
      if (preferred && tree.pages[preferred]) return preferred;

      const toolbarId = tree.toolbarId;
      const nonToolbar = Object.values(tree.pages).find(page => page.id !== toolbarId);
      return nonToolbar ? nonToolbar.id : Object.keys(tree.pages)[0] || null;
  }

  private setBoardStatus(text: string) {
      const status = this.shadowRoot?.querySelector('.board-status') as HTMLElement | null;
      if (status) {
          status.textContent = text;
      }
  }

  private resolveBoardUrl(url: string) {
      if (!url.startsWith('/')) return url;
      const base = getAssetBase();
      if (base === '/') return url;
      return `${base}${url.replace(/^\//, '')}`;
  }

  private getCurrentBoardPage(): AACPage | null {
      if (!this.boardTree || !this.boardPageId) return null;
      return this.boardTree.pages[this.boardPageId] || null;
  }

  private resolveBoardImage(button: AACButton): string | undefined {
      const resolved = button.resolvedImageEntry;
      if (resolved && typeof resolved === 'string' && resolved.startsWith('data:image/')) {
          return resolved;
      }
      const image = button.image;
      if (image && typeof image === 'string') {
          return image;
      }
      return undefined;
  }

  private buildBoardGrid() {
      const page = this.getCurrentBoardPage();
      if (!page) return null;

      const rows = page.grid.length;
      const cols = page.grid.reduce((max, row) => Math.max(max, row.length), 0);
      const items: GridItem[] = [];

      for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
              const button = page.grid[r]?.[c] ?? null;
              if (!button || button.visibility === 'Hidden' || button.visibility === 'Disabled' || button.visibility === 'Empty') {
                  items.push({
                      id: `empty-${r}-${c}`,
                      label: '',
                      type: 'action',
                      isEmpty: true
                  });
                  continue;
              }

              items.push({
                  id: button.id || `btn-${r}-${c}`,
                  label: button.label || '',
                  message: button.message || '',
                  targetPageId: button.targetPageId,
                  scanBlock: button.scanBlock ?? button.scanBlocks?.[0],
                  image: this.resolveBoardImage(button),
                  type: button.targetPageId ? 'action' : 'word',
                  backgroundColor: button.style?.backgroundColor,
                  textColor: button.style?.fontColor
              });
          }
      }

      return { items, cols };
  }

  private async setBoardPage(pageId: string) {
      if (!this.boardTree || !this.boardTree.pages[pageId]) return;
      this.boardPageId = pageId;
      await this.updateGrid(this.configManager.get(), true);
      this.currentScanner?.start();
  }

  private updateTheme(theme: string) {
      const wrapper = this.shadowRoot!.querySelector('.scanner-wrapper');
      if (wrapper) {
          wrapper.className = 'scanner-wrapper'; // reset
          if (theme) {
              wrapper.classList.add(theme);
          }
      }
  }

  private setupBoardControls() {
      const input = this.shadowRoot?.querySelector('.board-file') as HTMLInputElement | null;
      if (!input) return;

      try {
          const extensions = getBrowserExtensions?.() || [];
          if (extensions.length > 0) {
              const acceptList = extensions.map((ext) => (ext.startsWith('.') ? ext : `.${ext}`)).join(',');
              input.accept = acceptList;
          }
      } catch (err) {
          console.warn('Unable to set board file accept list.', err);
      }

      input.addEventListener('change', async () => {
          const file = input.files?.[0];
          if (!file) return;
          await this.loadBoardFromFile(file);
          input.value = '';
      });
  }

  private renderTemplate() {
    const isColorCode = this.getAttribute('scan-mode') === 'color-code';
    const isElimination = this.getAttribute('scan-pattern') === 'elimination';
    this.shadowRoot!.innerHTML = `
      <div class="scanner-wrapper">
        <div class="status-bar">
          <span class="output-text"></span>
          <button class="settings-btn" title="Settings">⚙️</button>
        </div>
        <div class="grid-container"></div>
        <div class="controls">
           <button data-action="select">${isColorCode || isElimination ? 'Blue (1)' : 'Select (Space)'}</button>
           <button data-action="step">${isColorCode ? 'Red (2)' : isElimination ? 'Switch 2 (2)' : 'Step (2)'}</button>
           <button data-action="reset">Reset (3)</button>
        </div>
        <div class="board-controls hidden">
          <label class="board-upload">
            <input class="board-file" type="file" />
            Load AAC Board
          </label>
          <span class="board-status"></span>
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
        overflow: hidden;
        position: relative;
      }

      .scan-focus {
        outline: var(--focus-border-width, 4px) solid var(--focus-color, #FF9800);
        outline-offset: calc(var(--focus-border-width, 4px) * -1);
        transform: scale(var(--focus-scale, 1.0));
        opacity: var(--focus-opacity, 1.0);
        transition: transform 0.2s ease-out, opacity 0.2s ease;
      }

      @keyframes pulse {
        0%, 100% {
          transform: scale(var(--focus-scale, 1.0));
          opacity: var(--focus-opacity, 1.0);
        }
        50% {
          transform: scale(calc(var(--focus-scale, 1.0) * 1.05));
          opacity: calc(var(--focus-opacity, 1.0) * 0.8);
        }
      }

      .scan-focus.animate-pulse {
        animation: pulse 1.5s ease-in-out infinite;
      }

      .scan-focus::after {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        opacity: 0;
        pointer-events: none;
        animation-duration: var(--scan-line-duration, 1000ms);
        animation-delay: var(--scan-line-delay, 0ms);
        animation-timing-function: linear;
        animation-iteration-count: 1;
        animation-fill-mode: both;
        animation-name: scan-line-horizontal;
        background: rgba(255,152,0,0.9);
        width: 2px;
        height: 100%;
      }

      .scan-focus.scan-line-vertical::after {
        animation-name: scan-line-vertical;
        width: 100%;
        height: 2px;
      }

      .scan-focus.scan-line-reverse::after {
        animation-direction: reverse;
      }

      @keyframes scan-line-horizontal {
        0% { left: 0; opacity: 0; }
        5% { opacity: var(--scan-line-enabled, 0); }
        95% { opacity: var(--scan-line-enabled, 0); }
        100% { left: calc(100% - 2px); opacity: 0; }
      }

      @keyframes scan-line-vertical {
        0% { top: 0; opacity: 0; }
        5% { opacity: var(--scan-line-enabled, 0); }
        95% { opacity: var(--scan-line-enabled, 0); }
        100% { top: calc(100% - 2px); opacity: 0; }
      }

      .scan-focus.scan-line-only {
        outline: none;
        outline-offset: 0;
        transform: none;
        opacity: 1;
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
        gap: 0.5rem;
        padding: 0.5rem;
        background: #f0f0f0;
        justify-content: center;
        border-top: 1px solid #ddd;
        flex-shrink: 0;
      }

      .controls button {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
        cursor: pointer;
        border: 1px solid #ccc;
        background: #fff;
        border-radius: 4px;
        min-height: 44px; /* Touch friendly */
      }

      .controls button:active {
        background: #ddd;
      }

      /* Image button styling */
      .controls button img {
        display: block;
        width: 100%;
        height: auto;
        user-select: none;
        -webkit-user-select: none;
        pointer-events: none;
      }

      .board-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        border-top: 1px solid #eee;
        background: #fafafa;
        font-size: 0.85rem;
        color: #333;
      }

      .board-controls.hidden {
        display: none;
      }

      .board-upload {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border: 1px solid #ccc;
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
        font-weight: 600;
      }

      .board-upload input {
        display: none;
      }

      .board-status {
        font-style: italic;
        color: #666;
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

      /* Sketch Theme */
      .scanner-wrapper.sketch {
          background-color: #fdfdfd;
          font-family: 'Patrick Hand', 'Comic Sans MS', cursive;
      }
      .scanner-wrapper.sketch .grid-cell {
          background: white;
          border: 2px solid #333;
          border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
          box-shadow: 2px 2px 5px rgba(0,0,0,0.05);
      }
      .scanner-wrapper.sketch .scan-focus {
          outline: none;
          box-shadow: 0 0 0 var(--focus-border-width, 4px) var(--focus-color, #FF9800);
          border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
          transform: scale(var(--focus-scale, 1.02));
          opacity: var(--focus-opacity, 1.0);
          transition: transform 0.1s, opacity 0.1s;
      }

      .scanner-wrapper.sketch .scan-focus.scan-line-only {
          box-shadow: none;
          transform: none;
          opacity: 1;
      }

      .scanner-wrapper.sketch .scan-focus.animate-pulse {
          animation: sketch-pulse 1.5s ease-in-out infinite;
      }

      @keyframes sketch-pulse {
        0%, 100% {
          transform: scale(var(--focus-scale, 1.02));
          opacity: var(--focus-opacity, 1.0);
        }
        50% {
          transform: scale(calc(var(--focus-scale, 1.02) * 1.05));
          opacity: calc(var(--focus-opacity, 1.0) * 0.8);
        }
      }
      .scanner-wrapper.sketch .controls {
          background: transparent;
          border-top: 2px dashed #ccc;
      }
      .scanner-wrapper.sketch .controls button {
          border: 2px solid #333;
          border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
          background: white;
          font-family: inherit;
          font-size: 1rem;
          padding: 5px 15px;
      }
      .scanner-wrapper.sketch .status-bar {
          background: #333;
          border-bottom: 2px solid #000;
          font-family: inherit;
      }
      /* Ensure images in cells fit well */
      .grid-cell img {
          display: block;
      }
    `;
    this.shadowRoot!.appendChild(style);
  }

  private updateControlsVisibility(config: AppConfig) {
    const controls = this.shadowRoot!.querySelector('.controls') as HTMLElement;
    if (!controls) return;

    const useImageButtons = config.useImageButton;
    controls.innerHTML = '';

    // 1. Elimination Mode
    if (config.scanPattern === 'elimination') {
      const numSwitches = config.eliminationSwitchCount || 4;
      for (let i = 1; i <= numSwitches; i++) {
        const btn = this.createButton('switch-' + i, `${i}`, config, i);
        controls.appendChild(btn);
      }
      // Add reset button for elimination (as it can get stuck deep in levels)
      const resetBtn = this.createButton('reset', '↺', config, 5);
      resetBtn.style.flex = '0 0 auto'; // Make reset button smaller
      controls.appendChild(resetBtn);
      return;
    }

    // 2. ColorCode (Two-button Bayesian)
    if (config.scanMode === 'color-code') {
      const blueBtn = this.createButton('switch-1', useImageButtons ? '' : 'Blue (1)', config, 1);
      const redBtn = this.createButton('switch-2', useImageButtons ? '' : 'Red (2)', config, 2);
      controls.appendChild(blueBtn);
      controls.appendChild(redBtn);
      const resetBtn = this.createButton('reset', useImageButtons ? '' : 'Reset (3)', config, 3);
      resetBtn.style.flex = '0 0 auto';
      controls.appendChild(resetBtn);
      return;
    }

    // 3. Manual / Step Scan
    if (config.scanInputMode === 'manual') {
       // Step (Move) Button - Switch 2
       const stepBtn = this.createButton('step', useImageButtons ? '' : 'Step (2)', config, 2);
       controls.appendChild(stepBtn);

       // Select Button - Switch 1
       const selectBtn = this.createButton('select', useImageButtons ? '' : 'Select (1)', config, 1);
       controls.appendChild(selectBtn);
       return;
    }

    // 4. Auto Scan (Default)
    // Only 'Select' is strictly needed
    const selectBtn = this.createButton('select', useImageButtons ? '' : 'Select (1)', config, 1);
    controls.appendChild(selectBtn);
  }

  private createButton(action: string, label: string, config: AppConfig, switchNum?: number): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.setAttribute('data-action', action);

    const useImageButtons = config.useImageButton;
    let buttonColor = config.buttonColor || 'blue';

    // For elimination mode, assign different colors to each switch
    if (switchNum) {
      const eliminationColors: Record<number, 'blue' | 'green' | 'red' | 'yellow'> = {
        1: 'blue',    // Top-left quadrant
        2: 'red',     // Top-right quadrant
        3: 'green',   // Bottom-left quadrant
        4: 'yellow',  // Bottom-right quadrant
        5: 'blue',    // Additional switches
        6: 'green',
        7: 'red',
        8: 'yellow',
      };
      buttonColor = eliminationColors[switchNum] || buttonColor;
    }

    const customImages = config.customButtonImages;

    if (useImageButtons && (customImages?.normal || customImages?.pressed)) {
      // Custom images with labels
      const actionLabel = this.getActionLabel(action);

      btn.style.cssText = `
        flex: 1;
        padding: 10px;
        cursor: pointer;
        border: none;
        background: transparent;
        min-width: 80px;
        min-height: 100px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
      `;
      btn.innerHTML = `
        <img src="${customImages.normal}" alt="${actionLabel}" style="width: 60px; height: 60px; max-width: 60px; transition: none;">
        <span style="font-size: 12px; font-weight: bold; color: #333; text-transform: uppercase;">${actionLabel}</span>
      `;

      // Handle depressed state
      const img = btn.querySelector('img')!;
      btn.addEventListener('mousedown', () => {
        if (customImages.pressed) {
          img.src = customImages.pressed;
        }
      });
      btn.addEventListener('mouseup', () => {
        img.src = customImages.normal!;
      });
      btn.addEventListener('mouseleave', () => {
        img.src = customImages.normal!;
      });
    } else if (useImageButtons) {
      // Built-in switch images with per-button colors
      const buttonImages = SWITCH_IMAGES[buttonColor];

      btn.style.cssText = `
        flex: 1;
        padding: 10px;
        cursor: pointer;
        border: none;
        background: transparent;
        min-width: 80px;
        min-height: 100px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
      `;

      // Get readable label for the action
      const actionLabel = this.getActionLabel(action);
      btn.innerHTML = `
        <img src="${buttonImages.normal}" alt="${actionLabel}" style="width: 60px; height: 60px; max-width: 60px;">
        <span style="font-size: 12px; font-weight: bold; color: #333; text-transform: uppercase;">${actionLabel}</span>
      `;

      // Handle depressed state
      const img = btn.querySelector('img')!;
      btn.addEventListener('mousedown', () => {
        img.src = buttonImages.depressed;
      });
      btn.addEventListener('mouseup', () => {
        img.src = buttonImages.normal;
      });
      btn.addEventListener('mouseleave', () => {
        img.src = buttonImages.normal;
      });
    } else {
      // Text buttons
      btn.textContent = label;
      btn.style.cssText = `
        flex: 1;
        padding: 10px 20px;
        font-size: 1rem;
        cursor: pointer;
        border: 1px solid #ccc;
        background: ${switchNum ? this.getSwitchColor(switchNum) : '#fff'};
        color: ${switchNum ? 'white' : '#333'};
        border-radius: 4px;
        font-weight: ${switchNum ? 'bold' : 'normal'};
        text-shadow: ${switchNum ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'};
      `;
    }

    btn.addEventListener('click', (_e) => {
      console.log('[SwitchScannerElement] Button clicked:', action);
      this.switchInput.triggerAction(action as any);
    });
    btn.addEventListener('mousedown', (e) => e.preventDefault());

    return btn;
  }

  private getSwitchColor(num: number): string {
    const colors: Record<number, string> = {
      1: '#2196F3', // Blue
      2: '#F44336', // Red
      3: '#4CAF50', // Green
      4: '#FFEB3B', // Yellow
      5: '#9C27B0', // Purple
      6: '#FF9800', // Orange
      7: '#00BCD4', // Cyan
      8: '#E91E63'  // Magenta
    };
    return colors[num] || '#2196F3';
  }

  private getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      'select': 'Choose',
      'step': 'Move',
      'reset': 'Reset',
      'cancel': 'Cancel'
    };

    // For numbered switches (elimination mode), use the number
    if (action.startsWith('switch-')) {
      const num = action.replace('switch-', '');
      return `Switch ${num}`;
    }

    return labels[action] || action;
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

    // Update controls visibility based on config
    this.updateControlsVisibility(this.configManager.get());

    // Subscribe to config changes to update controls
    this.configManager.subscribe((cfg) => {
        this.updateControlsVisibility(cfg);
        // Update highlight styles when visualization config changes
        this.gridRenderer.updateHighlightStyles(cfg);
    });

    // Scanner Events (Selection & Redraw)
    const gridContainer = this.shadowRoot!.querySelector('.grid-container') as HTMLElement;

    gridContainer.addEventListener('scanner:selection', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        const item = detail.item;

        const output = this.shadowRoot!.querySelector('.output-text');
        if (output) {
             const config = this.configManager.get();
             if (config.gridContent === 'board') {
                  if (item.targetPageId) {
                      this.setBoardPage(item.targetPageId);
                      return;
                  }

                  const text = item.message || item.label;
                  if (text) {
                      output.textContent = (output.textContent || '') + text;
                  }
                  return;
             }

             const label = item.label;
             const current = output.textContent || '';

             if (label === 'Undo') {
                  if (this.outputHistory.length > 0) {
                      this.redoStack.push(current);
                      output.textContent = this.outputHistory.pop() || '';
                  }
                  return;
             }

             if (label === 'Redo') {
                  if (this.redoStack.length > 0) {
                      this.outputHistory.push(current);
                      output.textContent = this.redoStack.pop() || '';
                  }
                  return;
             }

             // For any normal edit, track history and clear redo
             this.outputHistory.push(current);
             this.redoStack = [];

             if (label === 'Backspace') {
                  output.textContent = current.slice(0, -1);
             } else if (label === 'Clear') {
                  output.textContent = '';
             } else if (label === 'Enter') {
                  output.textContent = current + '\n';
             } else if (label === 'Space') {
                  output.textContent = current + ' ';
             } else {
                  output.textContent = current + label;
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
      // 1. Board content: use AAC grid layout directly.
      if (config.gridContent === 'board') {
          const boardGrid = this.buildBoardGrid();
          const displayItems = boardGrid?.items || [];
          const cols = boardGrid?.cols || 0;

          this.gridRenderer.render(displayItems, cols || 1);

          if (config.viewMode !== 'standard' && this.currentScanner) {
              const visualItems = this.applyVisualization(displayItems, config);
              this.gridRenderer.render(visualItems, cols || 1);
          }

          this.gridRenderer.updateHighlightStyles({
              highlightBorderWidth: config.highlightBorderWidth,
              highlightBorderColor: config.highlightBorderColor,
              highlightScale: config.highlightScale,
              highlightOpacity: config.highlightOpacity,
              highlightAnimation: config.highlightAnimation,
              highlightScanLine: config.highlightScanLine,
              scanDirection: config.scanDirection,
              scanPattern: config.scanPattern,
              scanRate: config.scanRate
          });
          return;
      }

      // 2. Generate Base Content (Linear)
      if (forceRegen) {
          if (this.customItems && this.customItems.length > 0) {
              this.baseItems = this.customItems;
          } else if (config.gridContent === 'keyboard') {
              this.baseItems = await this.generateKeyboard(config);
          } else {
              this.baseItems = this.generateNumbers(config.gridSize);
          }
      }

      // 3. Determine Dimensions
      const total = this.baseItems.length;
      let cols = Math.ceil(Math.sqrt(total));
      if (this.forcedGridCols && this.forcedGridCols > 0) {
          cols = this.forcedGridCols;
      }
      const rows = Math.ceil(total / cols);

      // 4. Map Content to Grid based on Strategy
      let displayItems = this.baseItems;
      if (this.currentScanner) {
          displayItems = this.currentScanner.mapContentToGrid(this.baseItems, rows, cols);
      }

      // 5. Render
      this.gridRenderer.render(displayItems, cols);

      // 6. Apply Visualization (if needed)
      if (config.viewMode !== 'standard' && this.currentScanner) {
          const visualItems = this.applyVisualization(displayItems, config);
          this.gridRenderer.render(visualItems, cols);
      }

      this.gridRenderer.updateHighlightStyles({
          highlightBorderWidth: config.highlightBorderWidth,
          highlightBorderColor: config.highlightBorderColor,
          highlightScale: config.highlightScale,
          highlightOpacity: config.highlightOpacity,
          highlightAnimation: config.highlightAnimation,
          highlightScanLine: config.highlightScanLine,
          scanDirection: config.scanDirection,
          scanPattern: config.scanPattern,
          scanRate: config.scanRate
      });
  }

  private createScanner(config: AppConfig): Scanner {
    console.log('[SwitchScannerElement] Creating scanner with config:', {
      scanMode: config.scanMode,
      scanPattern: config.scanPattern,
      scanTechnique: config.scanTechnique,
      continuousTechnique: config.continuousTechnique
    });

    // Special modes take precedence
    if (config.scanMode === 'cause-effect') {
      return new CauseEffectScanner(this.gridRenderer, this.configManager, this.audioManager);
    } else if (config.scanMode === 'group-row-column') {
      return new GroupScanner(this.gridRenderer, this.configManager, this.audioManager);
    } else if (config.scanMode === 'continuous') {
      console.log('[SwitchScannerElement] Creating ContinuousScanner');
      return new ContinuousScanner(this.gridRenderer, this.configManager, this.audioManager);
    } else if (config.scanMode === 'probability') {
      return new ProbabilityScanner(this.gridRenderer, this.configManager, this.audioManager);
    } else if (config.scanMode === 'color-code') {
      return new ColorCodeScanner(this.gridRenderer, this.configManager, this.audioManager);
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

    // Update highlight styles when config changes
    this.gridRenderer.updateHighlightStyles({
      highlightBorderWidth: config.highlightBorderWidth,
      highlightBorderColor: config.highlightBorderColor,
      highlightScale: config.highlightScale,
      highlightOpacity: config.highlightOpacity,
      highlightAnimation: config.highlightAnimation,
      highlightScanLine: config.highlightScanLine,
      scanDirection: config.scanDirection,
      scanPattern: config.scanPattern,
      scanRate: config.scanRate
    });

    console.log('[SwitchScannerElement] Starting new scanner:', this.currentScanner.constructor.name);
    this.currentScanner.start();
  }
}
