import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SwitchInput } from './SwitchInput';
import { ConfigManager } from './ConfigManager';
import { Scanner, type ScanSurface } from 'scan-engine';

// Create a simple test scanner
class TestScanner extends Scanner {
  public stepCallCount = 0;

  protected step() {
    this.stepCallCount++;
  }

  protected reset() {
    this.stepCallCount = 0;
  }

  protected doSelection() {
    // Test scanner - no-op
  }

  public getCost(itemIndex: number): number {
    return itemIndex + 1;
  }
}

describe('Long-Hold Cancel Feature', () => {
  let configManager: ConfigManager;
  let switchInput: SwitchInput;
  let container: HTMLElement;
  let scanner: TestScanner;
  let surface: ScanSurface;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    configManager = new ConfigManager({}, false);
    switchInput = new SwitchInput(configManager, container);

    surface = {
      getItemsCount: () => 10,
      getColumns: () => 5,
      setFocus: vi.fn(),
      setSelected: vi.fn()
    };

    scanner = new TestScanner(surface, configManager, {});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllTimers();
  });

  describe('Configuration', () => {
    it('should have cancelMethod in config defaults', () => {
      const config = configManager.get();
      expect(config).toHaveProperty('cancelMethod');
      expect(config.cancelMethod).toBe('button');
    });

    it('should have longHoldTime in config defaults', () => {
      const config = configManager.get();
      expect(config).toHaveProperty('longHoldTime');
      expect(config.longHoldTime).toBe(1000);
    });

    it('should support changing cancel method', () => {
      configManager.update({ cancelMethod: 'long-hold' });
      expect(configManager.get().cancelMethod).toBe('long-hold');

      configManager.update({ cancelMethod: 'button' });
      expect(configManager.get().cancelMethod).toBe('button');
    });

    it('should support custom long hold time', () => {
      configManager.update({ longHoldTime: 2000 });
      expect(configManager.get().longHoldTime).toBe(2000);

      configManager.update({ longHoldTime: 500 });
      expect(configManager.get().longHoldTime).toBe(500);
    });
  });

  describe('Button Cancel Mode (default)', () => {
    beforeEach(() => {
      configManager.update({ cancelMethod: 'button', longHoldTime: 1000 });
    });

    it('should trigger action immediately on switch press', () => {
      let receivedAction: string | null = null;
      switchInput.addEventListener('switch', (e: any) => {
        receivedAction = e.detail.action;
      });

      // Simulate key down
      const keyEvent = new KeyboardEvent('keydown', { key: ' ' });
      container.dispatchEvent(keyEvent);

      // Should trigger select immediately
      expect(receivedAction).toBe('select');
    });

    it('should trigger action on button press', () => {
      let receivedAction: string | null = null;
      switchInput.addEventListener('switch', (e: any) => {
        receivedAction = e.detail.action;
      });

      // Simulate mouse down
      const mouseEvent = new MouseEvent('mousedown', { bubbles: true });
      container.dispatchEvent(mouseEvent);

      // Should trigger select immediately
      expect(receivedAction).toBe('select');
    });
  });

  describe('Long-Hold Cancel Mode', () => {
    beforeEach(() => {
      configManager.update({
        cancelMethod: 'long-hold',
        longHoldTime: 500, // Short time for testing
      });
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should trigger action immediately when released before hold time', () => {
      let receivedAction: string | null = null;
      switchInput.addEventListener('switch', (e: any) => {
        receivedAction = e.detail.action;
      });

      // Key down
      const downEvent = new KeyboardEvent('keydown', { key: ' ' });
      container.dispatchEvent(downEvent);

      // Release before hold time
      vi.advanceTimersByTime(100);

      const upEvent = new KeyboardEvent('keyup', { key: ' ' });
      container.dispatchEvent(upEvent);

      // Should trigger select
      expect(receivedAction).toBe('select');
    });

    it('should trigger cancel action when held for longHoldTime', () => {
      let receivedAction: string | null = null;
      switchInput.addEventListener('switch', (e: any) => {
        receivedAction = e.detail.action;
      });

      // Key down
      const downEvent = new KeyboardEvent('keydown', { key: ' ' });
      container.dispatchEvent(downEvent);

      // Wait past long hold time
      vi.advanceTimersByTime(600);

      // Should have triggered cancel
      expect(receivedAction).toBe('cancel');

      // Release
      const upEvent = new KeyboardEvent('keyup', { key: ' ' });
      container.dispatchEvent(upEvent);

      // Should not trigger select
      expect(receivedAction).toBe('cancel'); // Still cancel
    });

    it('should not trigger action twice after long hold', () => {
      let actionCount = 0;
      switchInput.addEventListener('switch', (_e: any) => {
        actionCount++;
      });

      // Key down
      const downEvent = new KeyboardEvent('keydown', { key: ' ' });
      container.dispatchEvent(downEvent);

      // Wait past long hold time
      vi.advanceTimersByTime(600);

      // Should have triggered cancel once
      expect(actionCount).toBe(1);

      // Release
      const upEvent = new KeyboardEvent('keyup', { key: ' ' });
      container.dispatchEvent(upEvent);

      // Should not trigger again
      expect(actionCount).toBe(1);
    });
  });

  describe('Integration with Scanner', () => {
    it('should cancel scan when long hold activated', () => {
      configManager.update({
        cancelMethod: 'long-hold',
        longHoldTime: 500
      });
      vi.useFakeTimers();

      scanner.start();
      expect(scanner['isRunning']).toBe(true);

      let cancelCount = 0;
      switchInput.addEventListener('switch', (e: any) => {
        if (e.detail.action === 'cancel') {
          cancelCount++;
        }
      });

      // Hold select past long hold time
      const downEvent = new KeyboardEvent('keydown', { key: ' ' });
      container.dispatchEvent(downEvent);
      vi.advanceTimersByTime(600);

      // Should have received cancel
      expect(cancelCount).toBe(1);

      // Scanner should still be running (cancel doesn't stop it, just cancels)
      expect(scanner['isRunning']).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero longHoldTime', () => {
      configManager.update({
        cancelMethod: 'long-hold',
        longHoldTime: 0
      });

      // Even with 0ms, should not crash
      const config = configManager.get();
      expect(config.longHoldTime).toBe(0);
    });

    it('should handle very long hold time', () => {
      configManager.update({
        cancelMethod: 'long-hold',
        longHoldTime: 10000 // 10 seconds
      });

      const config = configManager.get();
      expect(config.longHoldTime).toBe(10000);
    });

    it('should work with different switch keys', () => {
      configManager.update({
        cancelMethod: 'long-hold',
        longHoldTime: 500
      });
      vi.useFakeTimers();

      let actions: string[] = [];
      switchInput.addEventListener('switch', (e: any) => {
        actions.push(e.detail.action);
      });

      // Test with switch-1 (key '1')
      const keyEvent1 = new KeyboardEvent('keydown', { key: '1' });
      container.dispatchEvent(keyEvent1);
      vi.advanceTimersByTime(600);

      expect(actions).toContain('cancel');
      actions = [];

      // Test with switch-2 (key '2')
      vi.advanceTimersByTime(100); // Clear timers
      const keyEvent2 = new KeyboardEvent('keydown', { key: '2' });
      container.dispatchEvent(keyEvent2);
      vi.advanceTimersByTime(600);

      expect(actions).toContain('cancel');

      vi.useRealTimers();
    });
  });
});
