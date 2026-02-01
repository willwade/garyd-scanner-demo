import { ConfigManager } from './ConfigManager';

export type SwitchAction =
  | 'select'
  | 'step'
  | 'reset'
  | 'cancel'
  | 'menu'
  | 'switch-1'
  | 'switch-2'
  | 'switch-3'
  | 'switch-4'
  | 'switch-5'
  | 'switch-6'
  | 'switch-7'
  | 'switch-8';

// Color mapping for switches
export const SWITCH_COLORS: Record<Exclude<SwitchAction, 'select' | 'step' | 'reset' | 'cancel' | 'menu'>, string> = {
  'switch-1': '#2196F3', // Blue
  'switch-2': '#F44336', // Red
  'switch-3': '#4CAF50', // Green
  'switch-4': '#FFEB3B', // Yellow
  'switch-5': '#9C27B0', // Purple
  'switch-6': '#FF9800', // Orange
  'switch-7': '#00BCD4', // Cyan
  'switch-8': '#E91E63'  // Magenta
};

type TimerKey = SwitchAction | 'reset_timer' | 'select_handled';

export class SwitchInput extends EventTarget {
  private configManager: ConfigManager;
  private keyMap: Map<string, SwitchAction>;
  private activeTimers: Map<TimerKey, number> = new Map();
  private targetElement: HTMLElement | Window;

  constructor(configManager: ConfigManager, targetElement: HTMLElement | Window = window) {
    super();
    this.configManager = configManager;
    this.targetElement = targetElement;

    // Default key mapping
    this.keyMap = new Map([
      [' ', 'select'],
      ['Enter', 'select'],
      ['1', 'switch-1'],
      ['2', 'switch-2'],
      ['3', 'switch-3'],
      ['4', 'switch-4'],
      ['5', 'switch-5'],
      ['6', 'switch-6'],
      ['7', 'switch-7'],
      ['8', 'switch-8'],
      ['r', 'reset'],
      ['R', 'reset'],
      ['c', 'cancel'],
      ['C', 'cancel'],
      ['s', 'menu'],
      ['S', 'menu']
    ]);

    this.bindEvents();
  }

  private isIgnoredEvent(e: Event): boolean {
    const path = e.composedPath ? e.composedPath() : [];
    for (const target of path) {
      if (target instanceof HTMLElement) {
        if (target.classList.contains('settings-overlay') || target.id === 'settings-overlay') return true;
        if (target.classList.contains('settings-btn')) return true;
        if (target.classList.contains('controls')) return true;
      }
    }
    // Fallback/Safety check using closest if available on target
    const target = e.target as HTMLElement;
    if (target && typeof target.closest === 'function') {
         if (target.closest('.settings-overlay') || target.closest('#settings-overlay')) return true;
         if (target.closest('.settings-btn')) return true;
         if (target.closest('.controls')) return true;
    }
    return false;
  }

  private bindEvents() {
    this.targetElement.addEventListener('keydown', this.handleKeyDown.bind(this) as EventListener);
    this.targetElement.addEventListener('keyup', this.handleKeyUp.bind(this) as EventListener);

    // Click listener for Switch 1 (Primary)
    this.targetElement.addEventListener('mousedown', (e) => {
      if (this.isIgnoredEvent(e)) return;
      this.handleSwitchDown('select');
    });

    this.targetElement.addEventListener('mouseup', (e) => {
      if (this.isIgnoredEvent(e)) return;
      this.handleSwitchUp('select');
    });

    // Touch support
    this.targetElement.addEventListener('touchstart', (e) => {
      if (this.isIgnoredEvent(e)) return;
      const evt = e as TouchEvent;
      evt.preventDefault(); // Prevent mouse emulation
      this.handleSwitchDown('select');
    });

    this.targetElement.addEventListener('touchend', (e) => {
       if (this.isIgnoredEvent(e)) return;
      this.handleSwitchUp('select');
    });
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.repeat) return; // Ignore auto-repeat
    if (this.keyMap.has(e.key)) {
      const action = this.keyMap.get(e.key)!;
      // Prevent default for space/enter to avoid scrolling
      if (action === 'select' || action === 'step') {
        e.preventDefault();
      }
      this.handleSwitchDown(action);
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    if (this.keyMap.has(e.key)) {
      const action = this.keyMap.get(e.key)!;
      this.handleSwitchUp(action);
    }
  }

  private handleSwitchDown(action: SwitchAction) {
    const config = this.configManager.get();
    const acceptanceTime = config.acceptanceTime;
    const longHoldTime = config.longHoldTime;
    const cancelMethod = config.cancelMethod;

    // Long-Hold Cancel functionality
    if (cancelMethod === 'long-hold' && longHoldTime > 0) {
      // Start long-hold timer for this action
      const longHoldTimer = window.setTimeout(() => {
        // Trigger cancel action on long hold
        this.triggerAction('cancel');

        // Cancel any pending action
        if (this.activeTimers.has(action)) {
          clearTimeout(this.activeTimers.get(action));
          this.activeTimers.delete(action);
        }

        // Mark as handled to prevent action on up
        this.activeTimers.set(`${action}_handled` as TimerKey, -1);
      }, longHoldTime);

      this.activeTimers.set(`${action}_longhold` as TimerKey, longHoldTimer);
    }

    if (acceptanceTime > 0) {
      // Start timer
      const timer = window.setTimeout(() => {
        // If we haven't already handled via long-hold...
        if (!this.activeTimers.has(`${action}_handled` as TimerKey)) {
          this.triggerAction(action);
          this.activeTimers.delete(action);

          // Clear long-hold timer if action fired
          if (this.activeTimers.has(`${action}_longhold` as TimerKey)) {
            clearTimeout(this.activeTimers.get(`${action}_longhold` as TimerKey));
            this.activeTimers.delete(`${action}_longhold` as TimerKey);
          }
        }
      }, acceptanceTime);
      this.activeTimers.set(action, timer);
    } else {
      // Immediate trigger
      // If using long-hold, we need to wait to see if it becomes a long-hold
      if (cancelMethod === 'long-hold' && longHoldTime > 0) {
        // Wait longer than long-hold time to ensure long-hold fires first if needed
        const immediateTimer = window.setTimeout(() => {
          if (!this.activeTimers.has(`${action}_handled` as TimerKey)) {
            this.triggerAction(action);
            this.activeTimers.delete(action);
          }
        }, longHoldTime + 50); // Wait past long-hold time
        this.activeTimers.set(action, immediateTimer);
      } else {
        this.triggerAction(action);
      }
    }
  }

  private handleSwitchUp(action: SwitchAction) {
    // Clear long-hold timer
    if (this.activeTimers.has(`${action}_longhold` as TimerKey)) {
      clearTimeout(this.activeTimers.get(`${action}_longhold` as TimerKey));
      this.activeTimers.delete(`${action}_longhold` as TimerKey);
    }

    // Clear Handled flag
    if (this.activeTimers.has(`${action}_handled` as TimerKey)) {
      this.activeTimers.delete(`${action}_handled` as TimerKey);
      return; // Don't process further
    }

    // If we have a pending timer, fire the action immediately and clear the timer
    if (this.activeTimers.has(action)) {
      clearTimeout(this.activeTimers.get(action));
      this.activeTimers.delete(action);
      this.triggerAction(action);
    }
  }

  public triggerAction(action: SwitchAction) {
    const event = new CustomEvent('switch', { detail: { action } });
    this.dispatchEvent(event);
    console.log(`Switch Action: ${action}`);
  }
}
