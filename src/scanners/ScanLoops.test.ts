import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LinearScanner } from './LinearScanner';

import { GridRenderer } from '../GridRenderer';
import { ConfigManager } from '../ConfigManager';

class TestAudioManager {
  playScanSound = vi.fn();
  playSelectSound = vi.fn();
}

describe('Scan Loops Feature', () => {
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

    // Render 5 items for testing
    const items = Array.from({ length: 5 }, (_, i) => ({
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
    it('should have scanLoops config with default value of 4', () => {
      const config = configManager.get();
      expect(config).toHaveProperty('scanLoops');
      expect(config.scanLoops).toBe(4);
    });

    it('should support changing scan loops', () => {
      configManager.update({ scanLoops: 2 });
      expect(configManager.get().scanLoops).toBe(2);

      configManager.update({ scanLoops: 0 });
      expect(configManager.get().scanLoops).toBe(0);

      configManager.update({ scanLoops: 10 });
      expect(configManager.get().scanLoops).toBe(10);
    });
  });

  describe('Loop Counting', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should increment loop count when cycle completes', () => {
      configManager.update({ scanLoops: 2, scanRate: 100 });
      scanner.start();

      // Initially loopCount should be 0
      expect(scanner['loopCount']).toBe(0);

      // Let scanner run through first cycle (5 items * 100ms = 500ms)
      vi.advanceTimersByTime(500);
      expect(scanner['loopCount']).toBe(1);

      // Let scanner run through second cycle
      vi.advanceTimersByTime(500);
      expect(scanner['loopCount']).toBe(2);

      // Scanner should have stopped after 2 loops
      expect(scanner['isRunning']).toBe(false);
    });

    it('should stop scanning after reaching loop limit', () => {
      configManager.update({ scanLoops: 1, scanRate: 100 });
      scanner.start();

      expect(scanner['isRunning']).toBe(true);

      // Let scanner complete one loop
      vi.advanceTimersByTime(500); // 5 items * 100ms

      expect(scanner['isRunning']).toBe(false);
      expect(scanner['loopCount']).toBe(0); // Reset after stopping
    });

    it('should scan indefinitely when scanLoops is 0', () => {
      configManager.update({ scanLoops: 0, scanRate: 100 });
      scanner.start();

      // Complete 3 loops
      vi.advanceTimersByTime(1500); // 3 * 5 items * 100ms

      // Scanner should still be running
      expect(scanner['isRunning']).toBe(true);
      expect(scanner['loopCount']).toBe(3);

      scanner.stop();
    });
  });

  describe('Reset Behavior', () => {
    it('should reset loop count when scanner is reset', () => {
      configManager.update({ scanLoops: 3, scanRate: 100 });
      scanner.start();

      vi.useFakeTimers();
      vi.advanceTimersByTime(500); // Complete one loop
      expect(scanner['loopCount']).toBe(1);

      scanner.handleAction('reset');
      expect(scanner['loopCount']).toBe(0);
      vi.useRealTimers();
    });

    it('should reset loop count when scanner restarts', () => {
      configManager.update({ scanLoops: 2, scanRate: 100 });
      scanner.start();

      vi.useFakeTimers();
      vi.advanceTimersByTime(500); // Complete one loop
      expect(scanner['loopCount']).toBe(1);

      scanner.stop();
      scanner.start();
      expect(scanner['loopCount']).toBe(0);
      vi.useRealTimers();
    });
  });

  describe('Integration with Scan Directions', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should count loops correctly in circular mode', () => {
      configManager.update({ scanLoops: 1, scanRate: 100, scanDirection: 'circular' });
      scanner.start();

      // Complete one loop (0,1,2,3,4,0)
      vi.advanceTimersByTime(600); // 6 steps * 100ms (wraps on 6th step)

      expect(scanner['loopCount']).toBe(1);
      expect(scanner['isRunning']).toBe(false);
    });

    it('should count loops correctly in reverse mode', () => {
      configManager.update({ scanLoops: 1, scanRate: 100, scanDirection: 'reverse' });
      scanner.start();

      // Complete one loop (4,3,2,1,0,4)
      vi.advanceTimersByTime(600); // 6 steps * 100ms (wraps on 6th step)

      expect(scanner['loopCount']).toBe(1);
      expect(scanner['isRunning']).toBe(false);
    });

    it('should count loops correctly in oscillating mode', () => {
      configManager.update({ scanLoops: 1, scanRate: 100, scanDirection: 'oscillating' });
      scanner.start();

      // Oscillating reports loop at both ends
      // Pattern: 0,1,2,3,4,3,2,1,0 (one complete back-and-forth)
      // Should report cycle at end and at start
      vi.advanceTimersByTime(900); // Let it run

      // Should have completed loops and stopped
      expect(scanner['loopCount']).toBeGreaterThanOrEqual(2);
      expect(scanner['isRunning']).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should handle scanLoops of 1 (single scan)', () => {
      configManager.update({ scanLoops: 1, scanRate: 100 });
      scanner.start();

      vi.advanceTimersByTime(600); // Complete one loop

      expect(scanner['isRunning']).toBe(false);
    });

    it('should handle large scanLoops values', () => {
      configManager.update({ scanLoops: 100, scanRate: 50 });
      scanner.start();

      // Run for several loops
      vi.advanceTimersByTime(3000); // Plenty of time for multiple loops

      expect(scanner['loopCount']).toBeGreaterThan(5);
      expect(scanner['isRunning']).toBe(true);

      scanner.stop();
    });

    it('should handle scanLoops of 0 (infinite)', () => {
      configManager.update({ scanLoops: 0, scanRate: 50 });
      scanner.start();

      // Let scanner run for a while
      vi.advanceTimersByTime(1000);

      // Should still be running with several loops completed
      expect(scanner['isRunning']).toBe(true);
      expect(scanner['loopCount']).toBeGreaterThan(0);

      scanner.stop();
    });
  });
});
