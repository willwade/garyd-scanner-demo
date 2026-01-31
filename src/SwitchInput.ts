import { ConfigManager } from './ConfigManager';

export type SwitchAction = 'select' | 'step' | 'reset' | 'cancel' | 'menu';

type TimerKey = SwitchAction | 'reset_timer' | 'select_handled';

export class SwitchInput extends EventTarget {
  private configManager: ConfigManager;
  private keyMap: Map<string, SwitchAction>;
  private activeTimers: Map<TimerKey, number> = new Map();

  constructor(configManager: ConfigManager) {
    super();
    this.configManager = configManager;

    // Default key mapping
    this.keyMap = new Map([
      [' ', 'select'],
      ['Enter', 'select'],
      ['1', 'select'],
      ['2', 'step'],
      ['3', 'reset'],
      ['4', 'cancel'],
      ['s', 'menu'],
      ['S', 'menu']
    ]);

    this.bindEvents();
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Global click listener for Switch 1 (Primary)
    // We need to be careful not to trigger this when clicking settings
    document.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).closest('#settings-overlay')) return;
      // Map left click to select
      this.handleSwitchDown('select');
    });

    document.addEventListener('mouseup', (e) => {
      if ((e.target as HTMLElement).closest('#settings-overlay')) return;
      this.handleSwitchUp('select');
    });

    // Touch support
    document.addEventListener('touchstart', (e) => {
      if ((e.target as HTMLElement).closest('#settings-overlay')) return;
      e.preventDefault(); // Prevent mouse emulation
      this.handleSwitchDown('select');
    });

    document.addEventListener('touchend', (e) => {
       if ((e.target as HTMLElement).closest('#settings-overlay')) return;
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

    // Special case for Switch 1 (Select) -> Long Hold Reset
    if (action === 'select') {
        const resetTimer = window.setTimeout(() => {
            // Trigger Reset
            this.triggerAction('reset');
            // Cancel any pending select action
            if (this.activeTimers.has('select')) {
                clearTimeout(this.activeTimers.get('select'));
                this.activeTimers.delete('select');
            }
            // Mark as handled to prevent select on up
            this.activeTimers.set('select_handled', -1);
        }, 1000); // 1000ms for reset
        // Store reset timer separately or use a different key?
        // Using a prefixed key
        this.activeTimers.set('reset_timer', resetTimer);
    }

    if (acceptanceTime > 0) {
      // Start timer
      const timer = window.setTimeout(() => {
        // If we haven't already reset...
        if (!this.activeTimers.has('select_handled')) {
            this.triggerAction(action);
            this.activeTimers.delete(action);
             // Also clear reset timer if select fired?
             // Usually select fires immediately after acceptance.
             // If Acceptance < 1000, Select fires first.
             // If Select fires, do we cancel reset?
             // Spec says "Long-Hold Reset". Usually implies exclusive.
             // If Select fired, we consumed the input.
             if (this.activeTimers.has('reset_timer')) {
                 clearTimeout(this.activeTimers.get('reset_timer'));
                 this.activeTimers.delete('reset_timer');
             }
        }
      }, acceptanceTime);
      this.activeTimers.set(action, timer);
    } else {
      // Immediate trigger (if not waiting for long hold?)
      // If immediate, we can't really distinguish long hold unless we delay 'select'.
      // But typically "Immediate" means fire on down.
      // If we fire Select immediately, we can't do Long Hold Reset easily without double firing.
      // Unless Reset is a separate event that overrides.
      // For now, if acceptanceTime == 0, we fire select immediately.
      // To support Reset, user might need to release?
      // "Holding Switch 1... forces...".
      // If I hold, Select fires. Then Reset fires later?
      // That triggers 2 actions.

      this.triggerAction(action);
    }
  }

  private handleSwitchUp(action: SwitchAction) {
    // Clear Reset Timer
    if (action === 'select' && this.activeTimers.has('reset_timer')) {
        clearTimeout(this.activeTimers.get('reset_timer'));
        this.activeTimers.delete('reset_timer');
    }

    // Clear Handled flag
    if (action === 'select' && this.activeTimers.has('select_handled')) {
        this.activeTimers.delete('select_handled');
        return; // Don't process further
    }

    // If we have a pending timer, clear it (acceptance time requirement not met)
    if (this.activeTimers.has(action)) {
      clearTimeout(this.activeTimers.get(action));
      this.activeTimers.delete(action);
    }
  }

  private triggerAction(action: SwitchAction) {
    const event = new CustomEvent('switch', { detail: { action } });
    this.dispatchEvent(event);
    console.log(`Switch Action: ${action}`);
  }
}
