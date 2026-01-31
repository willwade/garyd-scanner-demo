export interface AppConfig {
  scanRate: number; // ms
  acceptanceTime: number; // ms
  postSelectionDelay: number; // ms
  scanStrategy: 'row-column' | 'linear' | 'snake' | 'quadrant' | 'group-row-column' | 'elimination' | 'continuous' | 'probability';
  gridContent: 'numbers' | 'keyboard';
  gridSize: number; // Total items (e.g. 64) or specific layout
  showUI: boolean;
  soundEnabled: boolean;

  // New settings
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
    postSelectionDelay: 0,
    scanStrategy: 'row-column',
    gridContent: 'numbers',
    gridSize: 64, // 8x8
    showUI: true,
    soundEnabled: true,
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

    if (params.has('strategy')) {
      const strategy = params.get('strategy') as AppConfig['scanStrategy'];
      if (['row-column', 'linear', 'snake', 'quadrant', 'group-row-column', 'elimination', 'continuous', 'probability'].includes(strategy)) {
        this.config.scanStrategy = strategy;
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
