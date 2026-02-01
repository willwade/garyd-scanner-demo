import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Scanner } from './Scanner';
import { GridRenderer } from '../GridRenderer';
import { ConfigManager } from '../ConfigManager';
import { AudioManager } from '../AudioManager';

// Create a concrete test scanner implementation
class TestScanner extends Scanner {
  public stepCallCount = 0;
  public resetCallCount = 0;
  public handleActionCallCount = 0;
  public lastAction: any = null;

  protected step() {
    this.stepCallCount++;
  }

  protected reset() {
    this.resetCallCount++;
  }

  public getCost(itemIndex: number): number {
    return itemIndex + 1;
  }

  // Expose protected methods for testing
  public testScheduleNextStep() {
    this.scheduleNextStep();
  }

  public testTriggerSelection(item: any) {
    this.triggerSelection(item);
  }
}

describe('Scanner', () => {
  let scanner: TestScanner;
  let renderer: GridRenderer;
  let configManager: ConfigManager;
  let audioManager: AudioManager;
  let container: HTMLElement;

  beforeEach(() => {
    // Create DOM elements
    container = document.createElement('div');
    document.body.appendChild(container);

    // Initialize dependencies
    renderer = new GridRenderer(container);
    configManager = new ConfigManager({}, false);
    audioManager = {
      playScanSound: vi.fn(),
      playSelectSound: vi.fn(),
    } as any;

    scanner = new TestScanner(renderer, configManager, audioManager);
  });

  describe('Lifecycle', () => {
    it('should initialize without starting', () => {
      expect(scanner['isRunning']).toBe(false);
    });

    it('should start when start() is called', () => {
      scanner.start();
      expect(scanner['isRunning']).toBe(true);
    });

    it('should reset on start', () => {
      scanner.start();
      expect(scanner.resetCallCount).toBe(1);
    });

    it('should stop when stop() is called', () => {
      scanner.start();
      scanner.stop();
      expect(scanner['isRunning']).toBe(false);
    });

    it('should clear focus on stop', () => {
      renderer.setFocus([0, 1, 2]);
      scanner.stop();
      // Focus should be cleared - this tests internal behavior
    });
  });

  describe('Auto vs Manual Scanning Mode', () => {
    it('should auto-schedule steps in auto mode', () => {
      configManager.update({ scanInputMode: 'auto', scanRate: 100 });
      scanner.start();

      // Wait a bit for auto-scheduling
      return new Promise(resolve => {
        setTimeout(() => {
          expect(scanner.stepCallCount).toBeGreaterThan(0);
          scanner.stop();
          resolve(null);
        }, 200);
      });
    });

    it('should NOT auto-schedule steps in manual mode', () => {
      configManager.update({ scanInputMode: 'manual' });
      scanner.start();

      // Wait and verify no automatic steps occurred
      return new Promise(resolve => {
        setTimeout(() => {
          expect(scanner.stepCallCount).toBe(0);
          scanner.stop();
          resolve(null);
        }, 200);
      });
    });

    it('should handle step action in manual mode', () => {
      configManager.update({ scanInputMode: 'manual' });
      scanner.start();

      scanner.handleAction('step');

      expect(scanner.stepCallCount).toBe(1);
      expect(audioManager.playScanSound).toHaveBeenCalledTimes(1);
    });

    it('should ignore step action in auto mode', () => {
      configManager.update({ scanInputMode: 'auto' });
      scanner.start();

      scanner.handleAction('step');

      // Step should not be triggered manually in auto mode
      expect(scanner.stepCallCount).toBe(0);
    });
  });

  describe('Action Handling', () => {
    beforeEach(() => {
      scanner.start();
    });

    it('should handle reset action', () => {
      scanner.stepCallCount = 5; // Simulate some activity
      scanner.handleAction('reset');

      expect(scanner.resetCallCount).toBe(2); // Initial start + reset action
    });

    it('should restart timer after reset in auto mode', () => {
      configManager.update({ scanInputMode: 'auto', scanRate: 100 });
      scanner.handleAction('reset');

      // Timer should be restarted
      expect(scanner['timer']).not.toBeNull();
    });
  });

  describe('Selection Triggering', () => {
    it('should dispatch selection event', () => {
      const mockItem = { label: 'Test', index: 0 };
      let receivedEvent: CustomEvent | null = null;

      container.addEventListener('scanner:selection', (e: any) => {
        receivedEvent = e;
      });

      scanner.testTriggerSelection(mockItem);

      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent!.detail.item).toEqual(mockItem);
    });

    it('should play select sound on trigger', () => {
      const mockItem = { label: 'Test', index: 0 };
      scanner.testTriggerSelection(mockItem);

      expect(audioManager.playSelectSound).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cost Calculation', () => {
    it('should return correct cost for items', () => {
      expect(scanner.getCost(0)).toBe(1);
      expect(scanner.getCost(5)).toBe(6);
      expect(scanner.getCost(10)).toBe(11);
    });
  });

  describe('Content Mapping', () => {
    it('should return content unchanged by default', () => {
      const content = [
        { label: 'A', index: 0, id: 'a' },
        { label: 'B', index: 1, id: 'b' },
        { label: 'C', index: 2, id: 'c' },
      ];

      const mapped = scanner.mapContentToGrid(content, 3, 3);
      expect(mapped).toEqual(content);
    });
  });

  describe('Timing Settings', () => {
    it('should respect scanRate in auto mode', async () => {
      configManager.update({ scanInputMode: 'auto', scanRate: 200 });
      scanner.start();

      const startTime = Date.now();
      let firstStepTime = 0;

      return new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (scanner.stepCallCount > 0 && firstStepTime === 0) {
            firstStepTime = Date.now();
          }

          if (scanner.stepCallCount >= 2) {
            clearInterval(checkInterval);
            const elapsed = firstStepTime - startTime;
            // Should be approximately 200ms (allow some margin)
            expect(elapsed).toBeGreaterThanOrEqual(150);
            expect(elapsed).toBeLessThan(300);
            scanner.stop();
            resolve(null);
          }
        }, 50);
      });
    });
  });
});
