import {
  createScanner,
  linear,
  rowColumn,
  snake,
  quadrant,
  type ScanConfig,
  type ScanConfigProvider,
  type ScanSurface,
  type Scanner,
  type ScannerEvent,
  type ScannerSnapshot,
  type ScanMethod,
  type SwitchAction,
} from 'scan-engine';
import {
  GestureEngine,
  KeyboardAdapter,
  connectToScanner,
  type GestureEvent,
} from 'switch-input';

type StrategyId = ScanConfig['scanPattern'];

const STRATEGIES: Array<{ id: StrategyId; label: string; note: string; method: ScanMethod }> = [
  { id: 'row-column', label: 'Row–Column', note: 'Highlight each row, then each item in the chosen row.', method: rowColumn() },
  { id: 'linear', label: 'Linear', note: 'Move through items one at a time, top-left to bottom-right.', method: linear() },
  { id: 'snake', label: 'Snake', note: 'Boustrophedon: alternate row direction each row.', method: snake() },
  { id: 'quadrant', label: 'Quadrant', note: 'Split the grid into regions, then narrow down.', method: quadrant() },
];

const DEFAULT_CONFIG: ScanConfig = {
  scanRate: 800,
  scanInputMode: 'auto',
  scanDirection: 'circular',
  scanPattern: 'row-column',
  scanTechnique: 'block',
  scanMode: null,
  continuousTechnique: 'crosshair',
  compassMode: 'continuous',
  eliminationSwitchCount: 4,
  allowEmptyItems: false,
  initialItemPause: 0,
  scanLoops: 0,
  criticalOverscan: { enabled: false, fastRate: 100, slowRate: 1000 },
  colorCode: { errorRate: 0.1, selectThreshold: 0.95 },
};

const ITEMS = [
  'Hello', 'I want', 'Help', 'Yes',
  'No', 'Please', 'Thank you', 'More',
  'Stop', 'Go', 'Eat', 'Drink',
];

/**
 * Mutable config provider. The engine reads `get()` on every tick, so mutating
 * `set()` takes effect on the next scheduled step — exactly what we want for
 * "live reconfig without restarting the scan".
 */
function mutableConfig(initial: ScanConfig) {
  let current = initial;
  const provider: ScanConfigProvider = { get: () => current };
  return {
    provider,
    get: () => current,
    set(overrides: Partial<ScanConfig>) {
      current = { ...current, ...overrides };
    },
  };
}

function buildScanner(
  method: ScanMethod,
  surface: ScanSurface,
  configProvider: ScanConfigProvider,
  callbacks: { onSelect?: (index: number) => void },
): Scanner {
  return createScanner({
    method,
    surface,
    config: configProvider,
    callbacks,
  });
}

export class Workbench {
  private readonly host: HTMLElement;
  private readonly cells: HTMLElement[] = [];
  private readonly events: Array<{ at: number; text: string; kind: string }> = [];
  private readonly config = mutableConfig(DEFAULT_CONFIG);

  private scanner: Scanner | null = null;
  private unsubscribeSnapshot: (() => void) | null = null;
  private unsubscribeEvents: (() => void) | null = null;

  /** switch-input wiring (engine + keyboard adapter + scanner bridge) */
  private input: GestureEngine | null = null;
  private keyboard: KeyboardAdapter | null = null;
  private disconnectBridge: (() => void) | null = null;

  private statusEl: HTMLElement | null = null;
  private positionEl: HTMLElement | null = null;
  private loopsEl: HTMLElement | null = null;
  private eventLogEl: HTMLElement | null = null;
  private strategyButtons: HTMLButtonElement[] = [];

  constructor(host: HTMLElement) {
    this.host = host;
  }

  mount() {
    this.host.innerHTML = this.template();
    this.cacheRefs();
    this.bindControls();
    this.rebuildScanner(this.config.get().scanPattern as StrategyId);
  }

  private template(): string {
    return `
      <header class="wb-header">
        <h1>Scan Engine Workbench</h1>
        <p class="wb-subtitle">
          A small playground for the SDK's snapshot &amp; event channels.
          Built with <code>scan-engine</code> directly — no React.
        </p>
      </header>
      <main class="wb-main">
        <section class="wb-panel wb-preview">
          <h2>Preview</h2>
          <div class="wb-board" data-board>
            ${ITEMS.map((label, i) => `
              <button class="wb-cell" data-index="${i}" data-label="${label}">
                ${label}
              </button>`).join('')}
          </div>

          <div class="wb-runtime">
            <div class="wb-buttons">
              <button data-cmd="start">Start</button>
              <button data-cmd="stop">Stop</button>
              <button data-cmd="step">Step</button>
              <button data-cmd="select">Select</button>
              <button data-cmd="reset">Reset</button>
            </div>
            <p class="wb-hint">
              Keyboard via <code>switch-input</code>:
              <kbd>Space</kbd> tap=select / hold=cancel,
              <kbd>Enter</kbd>=step,
              <kbd>R</kbd>=reset.
            </p>
            <dl class="wb-state">
              <div><dt>Status</dt><dd data-state="status">idle</dd></div>
              <div><dt>Highlight</dt><dd data-state="highlight">—</dd></div>
              <div><dt>Steps</dt><dd data-state="steps">0</dd></div>
              <div><dt>Loops</dt><dd data-state="loops">0</dd></div>
            </dl>
          </div>
        </section>

        <aside class="wb-panel wb-controls">
          <h2>Controls</h2>

          <fieldset class="wb-fieldset">
            <legend>Strategy</legend>
            <div class="wb-strategies" data-strategies>
              ${STRATEGIES.map((s) => `
                <button type="button" class="wb-strategy" data-strategy="${s.id}" title="${s.note}">
                  <span class="wb-strategy-name">${s.label}</span>
                  <span class="wb-strategy-note">${s.note}</span>
                </button>`).join('')}
            </div>
          </fieldset>

          <fieldset class="wb-fieldset">
            <legend>Pace</legend>
            <label class="wb-field">
              <span>Scan rate (ms)</span>
              <input type="range" min="100" max="2000" step="100"
                     value="${DEFAULT_CONFIG.scanRate}" data-ctrl="scanRate">
              <output data-out="scanRate">${DEFAULT_CONFIG.scanRate}</output>
            </label>
            <label class="wb-field">
              <span>First-item pause (ms)</span>
              <input type="range" min="0" max="2000" step="100"
                     value="${DEFAULT_CONFIG.initialItemPause}" data-ctrl="initialItemPause">
              <output data-out="initialItemPause">${DEFAULT_CONFIG.initialItemPause}</output>
            </label>
            <label class="wb-field">
              <span>Stop after N loops (0 = forever)</span>
              <input type="range" min="0" max="10" step="1"
                     value="${DEFAULT_CONFIG.scanLoops}" data-ctrl="scanLoops">
              <output data-out="scanLoops">${DEFAULT_CONFIG.scanLoops}</output>
            </label>
          </fieldset>

          <fieldset class="wb-fieldset">
            <legend>Input &amp; traversal</legend>
            <label class="wb-field">
              <span>Input mode</span>
              <select data-ctrl="scanInputMode">
                <option value="auto">Auto (timer)</option>
                <option value="manual">Manual (step on input)</option>
              </select>
            </label>
            <label class="wb-field">
              <span>Direction</span>
              <select data-ctrl="scanDirection">
                <option value="circular">Circular</option>
                <option value="reverse">Reverse</option>
                <option value="oscillating">Oscillating</option>
              </select>
            </label>
          </fieldset>

          <fieldset class="wb-fieldset">
            <legend>Critical overscan</legend>
            <label class="wb-field wb-checkbox">
              <input type="checkbox" data-ctrl="overscanEnabled">
              <span>Enable (fast → slow-backward → select)</span>
            </label>
            <label class="wb-field">
              <span>Fast rate (ms)</span>
              <input type="range" min="50" max="500" step="50"
                     value="${DEFAULT_CONFIG.criticalOverscan.fastRate}" data-ctrl="overscanFast">
              <output data-out="overscanFast">${DEFAULT_CONFIG.criticalOverscan.fastRate}</output>
            </label>
            <label class="wb-field">
              <span>Slow rate (ms)</span>
              <input type="range" min="200" max="3000" step="100"
                     value="${DEFAULT_CONFIG.criticalOverscan.slowRate}" data-ctrl="overscanSlow">
              <output data-out="overscanSlow">${DEFAULT_CONFIG.criticalOverscan.slowRate}</output>
            </label>
          </fieldset>

          <details class="wb-event-log" open>
            <summary>Event log <span data-event-count>0</span></summary>
            <ul class="wb-event-list" data-event-log></ul>
          </details>
        </aside>
      </main>
    `;
  }

  private cacheRefs() {
    this.statusEl = this.host.querySelector('[data-state="status"]');
    this.positionEl = this.host.querySelector('[data-state="highlight"]');
    this.loopsEl = this.host.querySelector('[data-state="loops"]');
    this.eventLogEl = this.host.querySelector('[data-event-log]');
    this.cells.length = 0;
    this.cells.push(...Array.from(this.host.querySelectorAll<HTMLButtonElement>('.wb-cell')));
    this.strategyButtons = Array.from(this.host.querySelectorAll<HTMLButtonElement>('[data-strategy]'));
  }

  private bindControls() {
    // Runtime buttons.
    for (const button of Array.from(this.host.querySelectorAll<HTMLButtonElement>('[data-cmd]'))) {
      button.addEventListener('click', () => {
        const cmd = button.dataset.cmd as SwitchAction | 'start' | 'stop';
        if (!this.scanner) return;
        if (cmd === 'start') this.scanner.start();
        else if (cmd === 'stop') this.scanner.stop();
        else this.scanner.handleAction(cmd);
      });
    }

    // Strategy buttons — require a rebuild.
    for (const button of this.strategyButtons) {
      button.addEventListener('click', () => {
        const id = button.dataset.strategy as StrategyId;
        this.config.set({ scanPattern: id });
        this.rebuildScanner(id);
        this.updateStrategyHighlight(id);
      });
    }
    this.updateStrategyHighlight(this.config.get().scanPattern as StrategyId);

    // Pace & traversal — live reconfig, no rebuild.
    const onChange = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      const key = target.dataset.ctrl;
      if (!key) return;
      this.applyControlChange(key, this.readControlValue(target));
    };
    this.host.addEventListener('change', onChange);
    this.host.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.dataset.ctrl) return;
      const out = this.host.querySelector<HTMLElement>(`[data-out="${target.dataset.ctrl}"]`);
      if (out) out.textContent = String(this.readControlValue(target));
    });
  }

  private readControlValue(target: HTMLInputElement | HTMLSelectElement): unknown {
    if (target instanceof HTMLInputElement) {
      if (target.type === 'checkbox') return target.checked;
      const raw = target.value;
      return raw === '' ? '' : Number(raw);
    }
    return target.value;
  }

  private applyControlChange(ctrl: string, value: unknown) {
    switch (ctrl) {
      case 'scanRate':         this.config.set({ scanRate: value as number }); break;
      case 'initialItemPause': this.config.set({ initialItemPause: value as number }); break;
      case 'scanLoops':        this.config.set({ scanLoops: value as number }); break;
      case 'scanInputMode':    this.config.set({ scanInputMode: value as ScanConfig['scanInputMode'] }); break;
      case 'scanDirection':    this.config.set({ scanDirection: value as ScanConfig['scanDirection'] }); break;
      case 'overscanEnabled':  this.mergeOverscan({ enabled: value as boolean }); break;
      case 'overscanFast':     this.mergeOverscan({ fastRate: value as number }); break;
      case 'overscanSlow':     this.mergeOverscan({ slowRate: value as number }); break;
    }
  }

  private mergeOverscan(overrides: Partial<ScanConfig['criticalOverscan']>) {
    this.config.set({ criticalOverscan: { ...this.config.get().criticalOverscan, ...overrides } });
  }

  private updateStrategyHighlight(active: StrategyId) {
    for (const button of this.strategyButtons) {
      button.classList.toggle('is-active', button.dataset.strategy === active);
    }
  }

  private rebuildScanner(strategy: StrategyId) {
    const strategyDef = STRATEGIES.find((s) => s.id === strategy) ?? STRATEGIES[0];
    if (this.unsubscribeSnapshot) this.unsubscribeSnapshot();
    if (this.unsubscribeEvents) this.unsubscribeEvents();
    this.scanner?.stop();
    for (const cell of this.cells) cell.classList.remove('wb-is-focused', 'wb-is-selected');

    const surface: ScanSurface = {
      getItemsCount: () => this.cells.length,
      getColumns: () => 4,
      setFocus: (indices) => {
        for (const cell of this.cells) cell.classList.remove('wb-is-focused');
        for (const index of indices) this.cells[index]?.classList.add('wb-is-focused');
      },
      setSelected: (index) => {
        const cell = this.cells[index];
        if (!cell) return;
        cell.classList.add('wb-is-selected');
        window.setTimeout(() => cell.classList.remove('wb-is-selected'), 200);
      },
      getItemData: (index) => {
        const cell = this.cells[index];
        if (!cell) return null;
        return { label: cell.dataset.label ?? '', isEmpty: cell.getAttribute('aria-disabled') === 'true' };
      },
    };

    this.scanner = buildScanner(strategyDef.method, surface, this.config.provider, {
      onSelect: (index) => {
        // Surface already flashed the cell; nothing else to do here.
        void index;
      },
    });

    this.unsubscribeSnapshot = this.scanner.subscribe((snapshot) => this.renderSnapshot(snapshot));
    this.unsubscribeEvents = this.scanner.observe((event) => this.recordEvent(event));
    this.events.length = 0;
    this.renderEventLog();
    this.scanner.start();
    this.attachInput();
  }

  /**
   * Wire keyboard input through the switch-input package: Space as primary
   * (tap=select, hold=cancel), Enter as secondary (tap=step). Demonstrates
   * the gesture layer on top of the engine.
   */
  private attachInput() {
    this.detachInput();
    this.input = new GestureEngine({ tapWindowMs: 250, holdThresholdMs: 450 });
    this.input.on('hold', (e: GestureEvent) => this.recordGesture(e));
    this.input.on('tap', (e: GestureEvent) => this.recordGesture(e));
    this.input.on('stuck', (e: GestureEvent) => this.recordGesture(e));
    this.input.on('quarantine', (e: GestureEvent) => this.recordGesture(e));

    this.disconnectBridge = connectToScanner(this.input, this.scanner!, {
      primary: { tap: 'select', hold: 'cancel' },
      secondary: 'step',
      tertiary: 'reset',
    });

    this.keyboard = new KeyboardAdapter(window, this.input, {
      Space: 'primary',
      Enter: 'secondary',
      KeyR: 'tertiary',
    });
  }

  private detachInput() {
    this.disconnectBridge?.();
    this.keyboard?.detach();
    this.input?.dispose();
    this.disconnectBridge = null;
    this.keyboard = null;
    this.input = null;
  }

  private recordGesture(event: GestureEvent) {
    const detail =
      event.type === 'tap' ? `Tap ${event.switchId}`
      : event.type === 'hold' ? `Hold ${event.switchId}`
      : event.type === 'stuck' ? `Stuck ${event.switchId} (force-released)`
      : event.type === 'quarantine' ? `Quarantined ${event.switchId} from ${event.sourceId}`
      : event.type;
    this.events.unshift({ at: event.at, kind: `gesture.${event.type}`, text: detail });
    if (this.events.length > 50) this.events.length = 50;
    this.renderEventLog();
  }

  private renderSnapshot(snapshot: ScannerSnapshot) {
    if (this.statusEl) this.statusEl.textContent = snapshot.status;
    if (this.positionEl) {
      this.positionEl.textContent = snapshot.highlight.length === 0
        ? '—'
        : snapshot.highlight.map((i) => ITEMS[i] ?? `#${i}`).join(', ');
    }
    const stepsEl = this.host.querySelector<HTMLElement>('[data-state="steps"]');
    if (stepsEl) stepsEl.textContent = String(snapshot.stepCount);
    if (this.loopsEl) this.loopsEl.textContent = String(snapshot.loopCount);
    if (snapshot.overscanState) {
      this.host.classList.toggle('wb-overscan-active', true);
    } else {
      this.host.classList.remove('wb-overscan-active');
    }
  }

  private recordEvent(event: ScannerEvent) {
    this.events.unshift({ at: event.at, kind: event.type, text: this.describe(event) });
    if (this.events.length > 50) this.events.length = 50;
    this.renderEventLog();
  }

  private describe(event: ScannerEvent): string {
    switch (event.type) {
      case 'scan.started':       return 'Scan started';
      case 'scan.stopped':       return 'Scan stopped';
      case 'scan.reset':         return 'Scan reset';
      case 'highlight.changed':
        return event.indices.length === 0
          ? 'Highlight cleared'
          : `Highlight → ${event.indices.map((i) => ITEMS[i] ?? `#${i}`).join(', ')}`;
      case 'item.selected':      return `Selected ${ITEMS[event.index] ?? `#${event.index}`}`;
      case 'item.skipped':       return `Skipped empty item ${ITEMS[event.index] ?? `#${event.index}`}`;
      case 'cycle.completed':    return `Cycle ${event.loopCount} complete`;
      case 'overscan.transition':return `Overscan ${event.from} → ${event.to}`;
      default: return (event as ScannerEvent).type;
    }
  }

  private renderEventLog() {
    if (!this.eventLogEl) return;
    this.eventLogEl.innerHTML = this.events.map((e) => `
      <li class="wb-event wb-event--${e.kind.replace(/\./g, '-')}">
        <span class="wb-event-time">t=${e.at}</span>
        <span class="wb-event-text">${e.text}</span>
      </li>`).join('');
    const countEl = this.host.querySelector<HTMLElement>('[data-event-count]');
    if (countEl) countEl.textContent = String(this.events.length);
  }
}
