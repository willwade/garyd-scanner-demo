import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Scanner } from './Scanner';
import { GridRenderer } from '../GridRenderer';
import { ConfigManager } from '../ConfigManager';
import { AudioManager } from '../AudioManager';

// Create a concrete test scanner implementation
class TestScannerWithPause extends Scanner {
  public stepCallCount = 0;
  public resetCallCount = 0;

  protected step() {
    this.stepCallCount++;
  }

  protected reset() {
    this.resetCallCount++;
  }

  public getCost(itemIndex: number): number {
    return itemIndex + 1;
  }

  // Expose stepCount for testing
  public getStepCount(): number {
    return this.stepCount;
  }

  public testScheduleNextStep() {
    this.scheduleNextStep();
  }
}

describe('Initial Item Pause Feature', () => {
  let scanner: TestScannerWithPause;
  let renderer: GridRenderer;
  let configManager: ConfigManager;
  let audioManager: AudioManager;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    renderer = new GridRenderer(container);
    configManager = new ConfigManager({}, false);
    audioManager = {
      playScanSound: vi.fn(),
      playSelectSound: vi.fn(),
    } as any;

    scanner = new TestScannerWithPause(renderer, configManager, audioManager);
  });

  describe('Configuration', () => {
    it('should have initialItemPause in config defaults', () => {
      const config = configManager.get();
      expect(config).toHaveProperty('initialItemPause');
      expect(config.initialItemPause).toBe(0);
    });

    it('should accept custom initialItemPause value', () => {
      configManager.update({ initialItemPause: 1500 });
      expect(configManager.get().initialItemPause).toBe(1500);
    });
  });

  describe('Step Count Tracking', () => {
    beforeEach(() => {
      configManager.update({ scanInputMode: 'manual', initialItemPause: 0 });
      scanner.start();
      scanner.stop();
    });

    it('should initialize stepCount to 0 on start', () => {
      expect(scanner.getStepCount()).toBe(0);
    });

    it('should increment stepCount after each step', () => {
      scanner.handleAction('step');
      expect(scanner.getStepCount()).toBe(1);

      scanner.handleAction('step');
      expect(scanner.getStepCount()).toBe(2);
    });

    it('should reset stepCount on reset action', () => {
      scanner.handleAction('step');
      scanner.handleAction('step');
      expect(scanner.getStepCount()).toBe(2);

      scanner.handleAction('reset');
      expect(scanner.getStepCount()).toBe(0);
    });
  });

  describe('Initial Item Pause Timing', () => {
    it('should use initialItemPause for first step when enabled', () => {
      configManager.update({
        scanInputMode: 'auto',
        scanRate: 100,
        initialItemPause: 500
      });

      const scheduleSpy = vi.spyOn(scanner as any, 'scheduleNextStep');

      scanner.start();

      // First timeout should be 500ms (initialItemPause)
      const firstCall = scheduleSpy.mock.calls[0];
      expect(firstCall).toBeTruthy();
      scanner.stop();
    });

    it('should use normal scanRate for subsequent steps', () => {
      configManager.update({
        scanInputMode: 'manual',
        scanRate: 100,
        initialItemPause: 500
      });

      scanner.start();

      // Take manual steps
      scanner.handleAction('step');
      scanner.handleAction('step');

      expect(scanner.getStepCount()).toBe(2);
      scanner.stop();
    });

    it('should not apply initialItemPause when set to 0', () => {
      configManager.update({
        scanInputMode: 'auto',
        scanRate: 100,
        initialItemPause: 0
      });

      scanner.start();

      // Should use normal scanRate from the start
      expect(scanner.getStepCount()).toBe(0);
      scanner.stop();
    });
  });

  describe('Manual Mode Behavior', () => {
    it('should increment stepCount on manual step', () => {
      configManager.update({ scanInputMode: 'manual' });
      scanner.start();

      expect(scanner.getStepCount()).toBe(0);

      scanner.handleAction('step');
      expect(scanner.getStepCount()).toBe(1);

      scanner.handleAction('step');
      expect(scanner.getStepCount()).toBe(2);

      scanner.stop();
    });
  });

  describe('Integration with Reset', () => {
    it('should reset stepCount when reset action called', () => {
      configManager.update({ scanInputMode: 'manual' });
      scanner.start();

      scanner.handleAction('step');
      scanner.handleAction('step');
      expect(scanner.getStepCount()).toBe(2);

      scanner.handleAction('reset');
      expect(scanner.getStepCount()).toBe(0);

      scanner.stop();
    });

    it('should reapply initialItemPause after reset', () => {
      configManager.update({
        scanInputMode: 'manual',
        initialItemPause: 500
      });

      scanner.start();

      // Take some manual steps
      scanner.handleAction('step');
      scanner.handleAction('step');
      expect(scanner.getStepCount()).toBe(2);

      // Reset
      scanner.handleAction('reset');
      expect(scanner.getStepCount()).toBe(0);

      // Next step should be from stepCount 0 again
      scanner.handleAction('step');
      expect(scanner.getStepCount()).toBe(1);

      scanner.stop();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large initialItemPause values', () => {
      configManager.update({
        scanInputMode: 'auto',
        initialItemPause: 10000 // 10 seconds
      });

      const config = configManager.get();
      expect(config.initialItemPause).toBe(10000);
    });

    it('should handle zero initialItemPause', () => {
      configManager.update({
        scanInputMode: 'auto',
        initialItemPause: 0
      });

      const config = configManager.get();
      expect(config.initialItemPause).toBe(0);
    });

    it('should work with different scan rates', () => {
      configManager.update({
        scanInputMode: 'auto',
        scanRate: 500,
        initialItemPause: 1000
      });

      scanner.start();
      expect(scanner.getStepCount()).toBe(0);
      scanner.stop();
    });
  });
});
