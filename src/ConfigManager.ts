export interface AppConfig {
  // Timing settings
  scanRate: number; // ms (time between items in auto-scan)
  acceptanceTime: number; // ms (time to confirm selection)
  dwellTime: number; // ms (0 = disabled)

  // Scan timing
  initialScanDelay: number; // ms (delay before first item)
  initialItemPause: number; // ms (extended highlight on first item of each cycle)
  scanPauseDelay: number; // ms (delay between stages in hierarchical scans)
  scanLoops: number; // Number of complete scan cycles (0 = infinite)

  // Scan mode
  scanInputMode: 'auto' | 'manual'; // auto-scan vs manual step

  // Repeat functions (for auto-repeating selections)
  autoRepeat: boolean; // Enable auto-repeat for selections
  repeatDelay: number; // ms (time to hold before repeat starts)
  repeatTime: number; // ms (time between successive repeats)

  postSelectionDelay: number; // ms

  // SCAN DIRECTION CONTROL
  scanDirection: 'circular' | 'reverse' | 'oscillating'; // How scan cycles through items

  // SCANNING PATTERN (movement strategy)
  scanPattern: 'row-column' | 'column-row' | 'linear' | 'snake' | 'quadrant' | 'elimination';

  // SCANNING TECHNIQUE (how items are highlighted)
  // Only applicable for: row-column, column-row, linear, snake
  scanTechnique: 'block' | 'point';

  // SPECIAL MODES (patterns with built-in techniques)
  scanMode: 'group-row-column' | 'continuous' | 'probability' | 'cause-effect' | 'color-code' | null;

  // CONTINUOUS MODE TECHNIQUE (for scanMode='continuous')
  continuousTechnique: 'gliding' | 'crosshair' | 'eight-direction';

  // COMPASS MODE (for continuousTechnique='eight-direction')
  compassMode: 'continuous' | 'fixed-8';

  // ELIMINATION SCANNING
  eliminationSwitchCount: 2 | 3 | 4 | 5 | 6 | 7 | 8; // Number of switches for elimination (2=binary, 4=quadrant, etc.)

  // ERROR HANDLING
  allowEmptyItems: boolean; // Allow items that don't trigger output (for scan reset)
  cancelMethod: 'button' | 'long-hold'; // How to cancel scan
  longHoldTime: number; // ms (hold time for long-hold cancel)

  // CRITICAL OVERSCAN (two-stage scanning)
  criticalOverscan: {
    enabled: boolean; // Enable two-stage scanning
    fastRate: number; // ms (fast scan rate, e.g., 100ms)
    slowRate: number; // ms (slow backward scan rate, e.g., 1000ms)
  };

  // COLOR CODE (two-button Bayesian)
  colorCode: {
    errorRate: number; // Probability of clicking the wrong color
    selectThreshold: number; // Probability threshold to select a key
  };

  // Display settings
  gridContent: 'numbers' | 'keyboard';
  gridSize: number; // Total items (e.g. 64) or specific layout
  showUI: boolean;
  soundEnabled: boolean;

  // BUTTON VISUALIZATION
  useImageButton: boolean; // Use image buttons instead of text
  buttonColor: 'blue' | 'green' | 'red' | 'yellow'; // Switch color for images
  customButtonImages: {
    normal?: string; // Path to custom normal state image
    pressed?: string; // Path to custom pressed state image
  };

  // HIGHLIGHT VISUALIZATION
  highlightBorderWidth: number; // px (0-10, thickness of highlight outline)
  highlightBorderColor: string; // CSS color for highlight border/outline
  highlightScale: number; // number (1.0-1.5, scale factor for highlighted items, 1.0 = no zoom)
  highlightOpacity: number; // number (0.3-1.0, opacity of highlighted items)
  highlightAnimation: boolean; // Enable pulse animation on highlighted items

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

    // Scan timing
    initialScanDelay: 500, // 500ms delay before first scan
    initialItemPause: 0, // 0 = normal scan rate, >0 = extended first item highlight
    scanPauseDelay: 300, // 300ms pause between stages
    scanLoops: 4, // Number of complete scan cycles (0 = infinite)
    scanInputMode: 'auto', // auto-scan by default

    // Repeat functions
    autoRepeat: false,
    repeatDelay: 500, // 500ms hold before repeat
    repeatTime: 200, // 200ms between repeats

    scanDirection: 'circular', // circular by default (0,1,2,...,n-1,0,1,2,...)
    scanPattern: 'row-column',
    scanTechnique: 'block',
    scanMode: null,
    continuousTechnique: 'crosshair',
    compassMode: 'continuous',
    eliminationSwitchCount: 4,
    allowEmptyItems: false, // Disabled by default
    cancelMethod: 'button', // Button press cancel
    longHoldTime: 1000, // 1 second hold
    criticalOverscan: {
      enabled: false, // Disabled by default (backward compatible)
      fastRate: 100, // 100ms fast scan
      slowRate: 1000, // 1000ms slow backward scan
    },
    colorCode: {
      errorRate: 0.1,
      selectThreshold: 0.95,
    },
    gridContent: 'numbers',
    gridSize: 64, // 8x8
    showUI: true,
    soundEnabled: false,

    // Button visualization
    useImageButton: true, // Image buttons by default
    buttonColor: 'blue', // Default switch color for images
    customButtonImages: {
      normal: undefined,
      pressed: undefined,
    },

    language: 'en',
    layoutMode: 'alphabetical',
    viewMode: 'standard',
    heatmapMax: 20,

    // Highlight visualization
    highlightBorderWidth: 4, // 4px outline
    highlightBorderColor: '#FF9800', // Orange (contrast with blue, red, green elimination colors)
    highlightScale: 1.0, // 1.0 = no zoom, 1.2 = 20% larger
    highlightOpacity: 1.0, // Full opacity
    highlightAnimation: false, // No animation by default
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
      if (mode === 'group-row-column' || mode === 'continuous' || mode === 'probability' || mode === 'cause-effect') {
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
