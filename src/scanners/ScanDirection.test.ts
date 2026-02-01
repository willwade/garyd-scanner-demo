import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LinearScanner } from './LinearScanner';
import { GridRenderer } from '../GridRenderer';
import { ConfigManager } from '../ConfigManager';
import { AudioManager } from '../AudioManager';

describe('Scan Direction Feature', () => {
  let scanner: LinearScanner;
  let renderer: GridRenderer;
  let configManager: ConfigManager;
  let audioManager: AudioManager;
  let container: HTMLElement;
  let items: any[];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    renderer = new GridRenderer(container);
    configManager = new ConfigManager({}, false);
    audioManager = {
      playScanSound: vi.fn(),
      playSelectSound: vi.fn(),
    } as any;

    // Create 10 test items
    items = Array.from({ length: 10 }, (_, i) => ({
      id: `item-${i}`,
      label: `Item ${i}`,
      index: i
    }));

    renderer.render(items);
  });

  describe('Configuration', () => {
    it('should have scanDirection in config defaults', () => {
      const config = configManager.get();
      expect(config).toHaveProperty('scanDirection');
      expect(config.scanDirection).toBe('circular');
    });

    it('should support all three direction modes', () => {
      configManager.update({ scanDirection: 'reverse' });
      expect(configManager.get().scanDirection).toBe('reverse');

      configManager.update({ scanDirection: 'oscillating' });
      expect(configManager.get().scanDirection).toBe('oscillating');

      configManager.update({ scanDirection: 'circular' });
      expect(configManager.get().scanDirection).toBe('circular');
    });
  });

  describe('Circular Direction (default)', () => {
    beforeEach(() => {
      configManager.update({ scanDirection: 'circular' });
      scanner = new LinearScanner(renderer, configManager, audioManager);
      scanner.start();
    });

    it('should scan forward from 0 to n-1', () => {
      // Should start at -1, first step goes to 0
      scanner['step']();
      expect(scanner['currentIndex']).toBe(0);

      scanner['step']();
      expect(scanner['currentIndex']).toBe(1);

      scanner['step']();
      expect(scanner['currentIndex']).toBe(2);
    });

    it('should wrap around from n-1 back to 0', () => {
      scanner['currentIndex'] = 9; // Last item

      scanner['step']();
      expect(scanner['currentIndex']).toBe(0); // Should wrap to start

      scanner['step']();
      expect(scanner['currentIndex']).toBe(1);
    });

    it('should cycle through all items repeatedly', () => {
      const indices: number[] = [];

      // Take 15 steps (more than the 10 items)
      for (let i = 0; i < 15; i++) {
        scanner['step']();
        indices.push(scanner['currentIndex']);
      }

      expect(indices[0]).toBe(0);
      expect(indices[9]).toBe(9);
      expect(indices[10]).toBe(0); // Wrapped around
      expect(indices[14]).toBe(4);
    });
  });

  describe('Reverse Direction', () => {
    beforeEach(() => {
      configManager.update({ scanDirection: 'reverse' });
      scanner = new LinearScanner(renderer, configManager, audioManager);
      scanner.start();
    });

    it('should scan backward from n-1 to 0', () => {
      // Start at -1, first step should go to 9 (last item)
      scanner['step']();
      expect(scanner['currentIndex']).toBe(9);

      scanner['step']();
      expect(scanner['currentIndex']).toBe(8);

      scanner['step']();
      expect(scanner['currentIndex']).toBe(7);
    });

    it('should wrap around from 0 back to n-1', () => {
      scanner['currentIndex'] = 0;

      scanner['step']();
      expect(scanner['currentIndex']).toBe(9); // Should wrap to end

      scanner['step']();
      expect(scanner['currentIndex']).toBe(8);
    });

    it('should cycle through all items in reverse repeatedly', () => {
      const indices: number[] = [];

      // Take 15 steps
      for (let i = 0; i < 15; i++) {
        scanner['step']();
        indices.push(scanner['currentIndex']);
      }

      expect(indices[0]).toBe(9); // Starts at end
      expect(indices[9]).toBe(0);
      expect(indices[10]).toBe(9); // Wrapped around
      expect(indices[14]).toBe(5);
    });
  });

  describe('Oscillating Direction', () => {
    beforeEach(() => {
      configManager.update({ scanDirection: 'oscillating' });
      scanner = new LinearScanner(renderer, configManager, audioManager);
      scanner.start();
    });

    it('should scan forward then backward', () => {
      const indices: number[] = [];

      // Take 25 steps to see oscillation
      for (let i = 0; i < 25; i++) {
        scanner['step']();
        indices.push(scanner['currentIndex']);
      }

      // Forward: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
      expect(indices[0]).toBe(0);
      expect(indices[8]).toBe(8);
      expect(indices[9]).toBe(9);

      // Backward: 8, 7, 6, 5, 4, 3, 2, 1, 0
      expect(indices[10]).toBe(8);
      expect(indices[18]).toBe(0);

      // Forward again: 1, 2, 3, 4, 5
      expect(indices[19]).toBe(1);
      expect(indices[24]).toBe(6);
    });

    it('should change direction at endpoints', () => {
      // Scan to the end (9 steps from -1 to get to 9)
      for (let i = 0; i < 9; i++) {
        scanner['step']();
      }
      expect(scanner['currentIndex']).toBe(9);

      scanner['step'](); // 10th step - should change direction here
      expect(scanner['currentIndex']).toBe(8); // Now going backward

      // Scan back to start
      while (scanner['currentIndex'] > 0) {
        scanner['step']();
      }
      expect(scanner['currentIndex']).toBe(0);

      scanner['step'](); // Should change direction again
      expect(scanner['currentIndex']).toBe(1); // Now going forward
    });
  });

  describe('Edge Cases', () => {
    it('should handle single item grid', () => {
      const singleItem = [{ id: '1', label: 'Only', index: 0 }];
      renderer.render(singleItem);

      configManager.update({ scanDirection: 'circular' });
      scanner = new LinearScanner(renderer, configManager, audioManager);
      scanner.start();

      scanner['step']();
      expect(scanner['currentIndex']).toBe(0);

      scanner['step']();
      expect(scanner['currentIndex']).toBe(0); // Stays at 0
    });

    it('should handle two item grid in oscillating mode', () => {
      const twoItems = [
        { id: '1', label: 'A', index: 0 },
        { id: '2', label: 'B', index: 1 }
      ];
      renderer.render(twoItems);

      configManager.update({ scanDirection: 'oscillating' });
      scanner = new LinearScanner(renderer, configManager, audioManager);
      scanner.start();

      const indices: number[] = [];
      for (let i = 0; i < 6; i++) {
        scanner['step']();
        indices.push(scanner['currentIndex']);
      }

      // Should oscillate: 0, 1, 0, 1, 0, 1
      expect(indices).toEqual([0, 1, 0, 1, 0, 1]);
    });
  });

  describe('Direction Reset', () => {
    it('should reset direction on scanner reset', () => {
      configManager.update({ scanDirection: 'oscillating' });
      scanner = new LinearScanner(renderer, configManager, audioManager);
      scanner.start();

      // Scan to middle
      for (let i = 0; i < 5; i++) {
        scanner['step']();
      }
      expect(scanner['currentIndex']).toBe(5);

      scanner.handleAction('reset');

      expect(scanner['currentIndex']).toBe(-1);
      // After reset, should start forward again
      scanner['step']();
      expect(scanner['currentIndex']).toBe(0);
    });

    it('should reset direction on new start', () => {
      configManager.update({ scanDirection: 'oscillating' });
      scanner = new LinearScanner(renderer, configManager, audioManager);
      scanner.start();

      // Scan to change direction (go to end and back)
      for (let i = 0; i < 15; i++) {
        scanner['step']();
      }

      scanner.stop();
      scanner.start();

      expect(scanner['currentIndex']).toBe(-1);
      // After restart, should start forward again
      scanner['step']();
      expect(scanner['currentIndex']).toBe(0);
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate cost correctly for circular mode', () => {
      configManager.update({ scanDirection: 'circular' });
      scanner = new LinearScanner(renderer, configManager, audioManager);

      // Cost is simply index + 1 in circular mode
      expect(scanner.getCost(0)).toBe(1);
      expect(scanner.getCost(5)).toBe(6);
      expect(scanner.getCost(9)).toBe(10);
    });

    it('should calculate cost correctly for reverse mode', () => {
      configManager.update({ scanDirection: 'reverse' });
      scanner = new LinearScanner(renderer, configManager, audioManager);

      // In reverse mode, cost to reach item i from start is (n - i)
      // For 10 items (0-9):
      // Item 0: 10-0 = 10 steps (last item shown)
      // Item 5: 10-5 = 5 steps
      // Item 9: 10-9 = 1 step (first item shown)
      expect(scanner.getCost(0)).toBe(10);
      expect(scanner.getCost(5)).toBe(5);
      expect(scanner.getCost(9)).toBe(1);
    });

    it('should calculate cost correctly for oscillating mode', () => {
      configManager.update({ scanDirection: 'oscillating' });
      scanner = new LinearScanner(renderer, configManager, audioManager);

      // In oscillating mode, cost depends on position in cycle
      // Item 0: 1 step
      // Item 9: 10 steps (0→1→2→3→4→5→6→7→8→9)
      expect(scanner.getCost(0)).toBe(1);
      expect(scanner.getCost(9)).toBe(10);
    });
  });
});
