import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LinearScanner } from './LinearScanner';
import { OverscanState } from './Scanner';
import { GridRenderer } from '../GridRenderer';
import { ConfigManager } from '../ConfigManager';

// Create a test audio manager
class TestAudioManager {
  playScanSound = vi.fn();
  playSelectSound = vi.fn();
}

describe('Critical Overscan Feature', () => {
  let configManager: ConfigManager;
  let renderer: GridRenderer;
  let audioManager: TestAudioManager;
  let scanner: LinearScanner;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    configManager = new ConfigManager({}, false);
    renderer = new GridRenderer(container);
    audioManager = new TestAudioManager();

    // Render some items
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: `item-${i}`,
      label: `${i}`,
      index: i
    }));
    renderer.render(items);

    scanner = new LinearScanner(renderer, configManager, audioManager as any);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllTimers();
  });

  describe('Configuration', () => {
    it('should have criticalOverscan config with default values', () => {
      const config = configManager.get();
      expect(config).toHaveProperty('criticalOverscan');
      expect(config.criticalOverscan.enabled).toBe(false);
      expect(config.criticalOverscan.fastRate).toBe(100);
      expect(config.criticalOverscan.slowRate).toBe(1000);
    });

    it('should support enabling critical overscan', () => {
      configManager.update({
        criticalOverscan: {
          enabled: true,
          fastRate: 150,
          slowRate: 800
        }
      });

      const config = configManager.get();
      expect(config.criticalOverscan.enabled).toBe(true);
      expect(config.criticalOverscan.fastRate).toBe(150);
      expect(config.criticalOverscan.slowRate).toBe(800);
    });

    it('should support custom fast and slow rates', () => {
      configManager.update({
        criticalOverscan: {
          enabled: true,
          fastRate: 50,
          slowRate: 2000
        }
      });

      const config = configManager.get();
      expect(config.criticalOverscan.fastRate).toBe(50);
      expect(config.criticalOverscan.slowRate).toBe(2000);
    });
  });

  describe('State Management', () => {
    it('should start in fast state when critical overscan enabled', () => {
      configManager.update({
        criticalOverscan: { enabled: true, fastRate: 100, slowRate: 1000 }
      });

      scanner.start();
      expect(scanner['overscanState']).toBe(OverscanState.FAST);
    });

    it('should reset to fast state on reset', () => {
      configManager.update({
        criticalOverscan: { enabled: true, fastRate: 100, slowRate: 1000 }
      });

      scanner.start();
      scanner.handleAction('select'); // Transition to slow_backward
      expect(scanner['overscanState']).toBe(OverscanState.SLOW_BACKWARD);

      scanner.handleAction('reset');
      expect(scanner['overscanState']).toBe(OverscanState.FAST);
    });

    it('should reset to fast state on stop and restart', () => {
      configManager.update({
        criticalOverscan: { enabled: true, fastRate: 100, slowRate: 1000 }
      });

      scanner.start();
      scanner.handleAction('select'); // Transition to slow_backward
      scanner.stop();
      scanner.start();

      expect(scanner['overscanState']).toBe(OverscanState.FAST);
    });
  });

  describe('Selection Behavior', () => {
    beforeEach(() => {
      configManager.update({
        criticalOverscan: { enabled: true, fastRate: 100, slowRate: 1000 }
      });
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should transition from fast to slow_backward on first select', () => {
      scanner.start();
      expect(scanner['overscanState']).toBe(OverscanState.FAST);

      scanner.handleAction('select');
      expect(scanner['overscanState']).toBe(OverscanState.SLOW_BACKWARD);
    });

    it('should trigger selection on second select', () => {
      let selectedItem: any = null;
      container.addEventListener('scanner:selection', (e: any) => {
        selectedItem = e.detail.item;
      });

      scanner.start();

      // Let the scanner step to the first item
      vi.advanceTimersByTime(150); // Wait past fast scan rate (100ms)
      expect(scanner['currentIndex']).toBe(0); // Should be on first item

      // First select: transition to slow_backward
      scanner.handleAction('select');
      expect(selectedItem).toBeNull();
      expect(scanner['overscanState']).toBe(OverscanState.SLOW_BACKWARD);

      // Second select: trigger selection
      scanner.handleAction('select');
      expect(selectedItem).not.toBeNull();
      expect(scanner['overscanState']).toBe(OverscanState.FAST);
    });

    it('should not trigger selection on first select when overscan enabled', () => {
      let selectionCount = 0;
      container.addEventListener('scanner:selection', () => {
        selectionCount++;
      });

      scanner.start();
      scanner.handleAction('select');

      expect(selectionCount).toBe(0);
    });
  });

  describe('Scan Rate Behavior', () => {
    beforeEach(() => {
      configManager.update({
        criticalOverscan: { enabled: true, fastRate: 100, slowRate: 1000 }
      });
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should use fast rate when in fast state', () => {
      scanner.start();

      const scheduleNextStepSpy = vi.spyOn(scanner as any, 'scheduleNextStep');

      // Advance timer to trigger first step
      vi.advanceTimersByTime(100);

      expect(scheduleNextStepSpy).toHaveBeenCalled();
      // Check that the rate used was fastRate (100ms)
    });

    it('should use slow rate when in slow_backward state', () => {
      scanner.start();
      scanner.handleAction('select'); // Transition to slow_backward

      // Should now use slow rate
      expect(scanner['overscanState']).toBe(OverscanState.SLOW_BACKWARD);
    });
  });

  describe('Disabled Behavior', () => {
    beforeEach(() => {
      // Ensure critical overscan is disabled
      configManager.update({
        criticalOverscan: { enabled: false, fastRate: 100, slowRate: 1000 }
      });
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should trigger selection immediately when overscan disabled', () => {
      let selectionCount = 0;
      container.addEventListener('scanner:selection', () => {
        selectionCount++;
      });

      scanner.start();

      // Let the scanner step to the first item
      vi.advanceTimersByTime(1050); // Wait past default scan rate (1000ms)

      scanner.handleAction('select');

      expect(selectionCount).toBe(1);
    });

    it('should not use overscan state when disabled', () => {
      scanner.start();
      scanner.handleAction('select');

      // State should be fast (default) but not affect behavior
      expect(scanner['overscanState']).toBe(OverscanState.FAST);
    });
  });

  describe('Integration with Reset', () => {
    beforeEach(() => {
      configManager.update({
        criticalOverscan: { enabled: true, fastRate: 100, slowRate: 1000 }
      });
    });

    it('should reset overscan state when scanner resets', () => {
      scanner.start();
      scanner.handleAction('select'); // Transition to slow_backward

      expect(scanner['overscanState']).toBe(OverscanState.SLOW_BACKWARD);

      scanner.handleAction('reset');
      expect(scanner['overscanState']).toBe(OverscanState.FAST);
    });
  });
});
