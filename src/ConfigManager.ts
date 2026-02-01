export interface AppConfig {
  // Timing settings
  scanRate: number; // ms
  acceptanceTime: number; // ms
  dwellTime: number; // ms (0 = disabled)
  postSelectionDelay: number; // ms

  // SCANNING PATTERN (movement strategy)
  scanPattern: 'row-column' | 'column-row' | 'linear' | 'snake' | 'quadrant' | 'elimination';

  // SCANNING TECHNIQUE (how items are highlighted)
  // Only applicable for: row-column, column-row, linear, snake
  scanTechnique: 'block' | 'point';

  // SPECIAL MODES (patterns with built-in techniques)
  scanMode: 'group-row-column' | 'continuous' | 'probability' | null;

  // CONTINUOUS MODE TECHNIQUE (for scanMode='continuous')
  continuousTechnique: 'gliding' | 'crosshair' | 'eight-direction';

  // COMPASS MODE (for continuousTechnique='eight-direction')
  compassMode: 'continuous' | 'fixed-8';

  // Display settings
  gridContent: 'numbers' | 'keyboard';
  gridSize: number; // Total items (e.g. 64) or specific layout
  showUI: boolean;
  soundEnabled: boolean;

  // Language & Layout
  language: string;
  layoutMode: 'alphabetical' | 'frequency';
  viewMode: 'standard' | 'cost-numbers' | 'cost-heatmap';
  heatmapMax: number;
}

export class ConfigManager {
  private config: AppConfig;
  private listeners: ((config: AppConfig) => void)[] = [];

  public static readonly DEFAULTS: AppConfig = {
    scanRate: 1000,
    acceptanceTime: 0,
    dwellTime: 0,
    postSelectionDelay: 0,
    scanPattern: 'row-column',
    scanTechnique: 'block',
    scanMode: null,
    continuousTechnique: 'crosshair',
    compassMode: 'continuous',
    gridContent: 'numbers',
    gridSize: 64, // 8x8
    showUI: true,
    soundEnabled: false,
    language: 'en',
    layoutMode: 'alphabetical',
    viewMode: 'standard',
    heatmapMax: 20
  };

  constructor(overrides?: Partial<AppConfig>, loadFromUrl: boolean = true) {
    this.config = { ...ConfigManager.DEFAULTS, ...overrides };
    if (loadFromUrl) {
      this.loadFromUrl();
    }
  }

  private loadFromUrl() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('ui') && params.get('ui') === 'hidden') {
      this.config.showUI = false;
    }

    if (params.has('rate')) {
      const rate = parseInt(params.get('rate')!, 10);
      if (!isNaN(rate)) this.config.scanRate = rate;
    }

    if (params.has('dwell')) {
      const dwell = parseInt(params.get('dwell')!, 10);
      if (!isNaN(dwell)) this.config.dwellTime = dwell;
    }

    // Handle both old 'strategy' param and new separate params for backward compatibility
    if (params.has('strategy')) {
      const strategy = params.get('strategy')!;
      // Map old strategies to new structure
      if (strategy === 'group-row-column') {
        this.config.scanMode = 'group-row-column';
      } else if (strategy === 'continuous') {
        this.config.scanMode = 'continuous';
      } else if (strategy === 'probability') {
        this.config.scanMode = 'probability';
      } else if (['row-column', 'column-row', 'linear', 'snake', 'quadrant', 'elimination'].includes(strategy)) {
        this.config.scanPattern = strategy as AppConfig['scanPattern'];
      }
    }

    // New separate parameters (take precedence over 'strategy')
    if (params.has('pattern')) {
      const pattern = params.get('pattern') as AppConfig['scanPattern'];
      if (['row-column', 'column-row', 'linear', 'snake', 'quadrant', 'elimination'].includes(pattern)) {
        this.config.scanPattern = pattern;
        this.config.scanMode = null; // Clear mode when pattern is set
      }
    }

    if (params.has('technique')) {
      const technique = params.get('technique') as AppConfig['scanTechnique'];
      if (technique === 'block' || technique === 'point') {
        this.config.scanTechnique = technique;
      }
    }

    if (params.has('mode')) {
      const mode = params.get('mode');
      if (mode === 'group-row-column' || mode === 'continuous' || mode === 'probability') {
        this.config.scanMode = mode as AppConfig['scanMode'];
      } else if (mode === 'null' || mode === 'none' || mode === '') {
        this.config.scanMode = null;
      }
    }

    if (params.has('continuous-technique')) {
      const ct = params.get('continuous-technique');
      if (ct === 'gliding' || ct === 'crosshair') {
        this.config.continuousTechnique = ct as AppConfig['continuousTechnique'];
      }
    }

    if (params.has('content')) {
       if (params.get('content') === 'keyboard') this.config.gridContent = 'keyboard';
    }

    if (params.has('lang')) {
      this.config.language = params.get('lang')!;
    }

    if (params.has('layout')) {
      const layout = params.get('layout');
      if (layout === 'alphabetical' || layout === 'frequency') {
        this.config.layoutMode = layout;
      }
    }

    if (params.has('view')) {
      const view = params.get('view');
      if (view === 'standard' || view === 'cost-numbers' || view === 'cost-heatmap') {
        this.config.viewMode = view as AppConfig['viewMode'];
      }
    }

    if (params.has('heatmax')) {
      const val = parseInt(params.get('heatmax')!, 10);
      if (!isNaN(val)) this.config.heatmapMax = val;
    }
  }

  public get(): AppConfig {
    return { ...this.config };
  }

  public update(newConfig: Partial<AppConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.notify();
  }

  public subscribe(listener: (config: AppConfig) => void) {
    this.listeners.push(listener);
    listener(this.config); // Immediate callback
  }

  private notify() {
    this.listeners.forEach(l => l(this.config));
  }
}
