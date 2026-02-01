import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EliminationScanner } from './EliminationScanner';
import { GridRenderer } from '../GridRenderer';
import { ConfigManager } from '../ConfigManager';
import { AudioManager } from '../AudioManager';

describe('EliminationScanner', () => {
  let scanner: EliminationScanner;
  let renderer: GridRenderer;
  let configManager: ConfigManager;
  let audioManager: AudioManager;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    renderer = new GridRenderer(container);
    configManager = new ConfigManager({
      gridSize: 64,
      scanInputMode: 'manual', // Use manual for predictable testing
    }, false);

    audioManager = {
      playScanSound: vi.fn(),
      playSelectSound: vi.fn(),
    } as any;

    scanner = new EliminationScanner(renderer, configManager, audioManager);
  });

  describe('Initialization', () => {
    it('should start with 4 switches by default', () => {
      scanner.start();
      // Scanner should be initialized
      expect(scanner['isRunning']).toBe(true);
      scanner.stop();
    });

    it('should start with configured switch count', () => {
      configManager.update({ eliminationSwitchCount: 8 });
      scanner.start();

      expect(scanner['numSwitches']).toBe(8);
      scanner.stop();
    });
  });

  describe('Partition Calculation', () => {
    beforeEach(() => {
      scanner.start();
    });

    it('should evenly partition 64 items into 4 blocks', () => {
      const partitions = scanner['calculatePartitions'](0, 64, 4);

      expect(partitions).toHaveLength(4);
      expect(partitions[0]).toEqual({ start: 0, end: 16 });
      expect(partitions[1]).toEqual({ start: 16, end: 32 });
      expect(partitions[2]).toEqual({ start: 32, end: 48 });
      expect(partitions[3]).toEqual({ start: 48, end: 64 });
    });

    it('should handle remainders when partitioning', () => {
      const partitions = scanner['calculatePartitions'](0, 10, 3);

      expect(partitions).toHaveLength(3);
      // 10 / 3 = 3 with remainder 1, so first partition gets extra
      expect(partitions[0]).toEqual({ start: 0, end: 4 });  // 4 items
      expect(partitions[1]).toEqual({ start: 4, end: 7 });  // 3 items
      expect(partitions[2]).toEqual({ start: 7, end: 10 }); // 3 items
    });

    it('should partition for binary (2 switches)', () => {
      configManager.update({ eliminationSwitchCount: 2 });
      scanner['numSwitches'] = 2;

      const partitions = scanner['calculatePartitions'](0, 64, 2);

      expect(partitions).toHaveLength(2);
      expect(partitions[0]).toEqual({ start: 0, end: 32 });
      expect(partitions[1]).toEqual({ start: 32, end: 64 });
    });

    it('should partition for octant (8 switches)', () => {
      configManager.update({ eliminationSwitchCount: 8 });
      scanner['numSwitches'] = 8;

      const partitions = scanner['calculatePartitions'](0, 64, 8);

      expect(partitions).toHaveLength(8);
      // Each partition should have 8 items
      partitions.forEach((p, i) => {
        expect(p.start).toBe(i * 8);
        expect(p.end).toBe((i + 1) * 8);
      });
    });
  });

  describe('Block Highlighting', () => {
    beforeEach(() => {
      // Create grid items
      const items = Array.from({ length: 64 }, (_, i) => ({ label: `${i}`, index: i, id: `item-${i}` }));
      renderer.render(items);
      scanner.start();
    });

    it('should highlight first block on start', () => {
      const cells = container.querySelectorAll('.grid-cell');
      expect(cells.length).toBe(64);
      // After manual mode start, should have initial highlights
    });

    it('should cycle through blocks in manual mode', () => {
      // Step action increments currentBlock
      const step = () => scanner['step']();
      const initialBlock = scanner['currentBlock'];

      step();
      expect(scanner['currentBlock']).toBe((initialBlock + 1) % 4);
    });
  });

  describe('Switch Actions', () => {
    beforeEach(() => {
      // Create grid items
      const items = Array.from({ length: 64 }, (_, i) => ({ label: `${i}`, index: i, id: `item-${i}` }));
      renderer.render(items);
      scanner.start();
    });

    it('should select and narrow to block 0 when switch-1 pressed', () => {
      scanner['currentBlock'] = 0; // Block 0 is highlighted
      scanner.handleAction('switch-1');

      // Should narrow to first 16 items
      expect(scanner['rangeStart']).toBe(0);
      expect(scanner['rangeEnd']).toBe(16);
    });

    it('should select and narrow to block 1 when switch-2 pressed', () => {
      scanner['currentBlock'] = 1; // Block 1 is highlighted
      scanner.handleAction('switch-2');

      // Should narrow to second 16 items
      expect(scanner['rangeStart']).toBe(16);
      expect(scanner['rangeEnd']).toBe(32);
    });

    it('should ignore switches beyond configured count', () => {
      configManager.update({ eliminationSwitchCount: 4 });
      scanner['numSwitches'] = 4;

      scanner.handleAction('switch-5'); // Should be ignored

      // Range should not have changed
      expect(scanner['rangeStart']).toBe(0);
      expect(scanner['rangeEnd']).toBe(64);
    });

    it('should allow higher switches when configured', () => {
      configManager.update({ eliminationSwitchCount: 8 });
      scanner['numSwitches'] = 8;
      scanner['currentBlock'] = 7;

      scanner.handleAction('switch-8');

      // Should work with switch 8
      expect(scanner['rangeStart']).toBe(56);
      expect(scanner['rangeEnd']).toBe(64);
    });
  });

  describe('Undo Functionality', () => {
    beforeEach(() => {
      // Create grid items
      const items = Array.from({ length: 64 }, (_, i) => ({ label: `${i}`, index: i, id: `item-${i}` }));
      renderer.render(items);
      scanner.start();
    });

    it('should go back one level on cancel', () => {
      // First selection
      scanner['currentBlock'] = 0;
      scanner.handleAction('switch-1');

      expect(scanner['rangeStart']).toBe(0);
      expect(scanner['rangeEnd']).toBe(16);

      // Cancel to go back
      scanner.handleAction('cancel');

      expect(scanner['rangeStart']).toBe(0);
      expect(scanner['rangeEnd']).toBe(64);
    });

    it('should track partition history', () => {
      scanner['currentBlock'] = 0;
      scanner.handleAction('switch-1');

      expect(scanner['partitionHistory']).toHaveLength(1);
      expect(scanner['partitionHistory'][0]).toEqual({ start: 0, end: 64 });
    });

    it('should reset fully when history is empty', () => {
      scanner['currentBlock'] = 0;
      scanner.handleAction('switch-1');
      scanner.handleAction('cancel');

      // Range should be back to full
      expect(scanner['rangeStart']).toBe(0);
      expect(scanner['rangeEnd']).toBe(64);
    });
  });

  describe('Cost Calculation', () => {
    beforeEach(() => {
      // Need to initialize the renderer with items before calculating cost
      const items = Array.from({ length: 64 }, (_, i) => ({ label: `${i}`, index: i, id: `item-${i}` }));
      renderer.render(items);
      scanner.start();
    });

    it('should calculate cost for 4-switch elimination', () => {
      configManager.update({ eliminationSwitchCount: 4 });
      scanner['numSwitches'] = 4;

      // Item 0: block 0, then block 0, then item 0 = 1 + 1 + 1 = 3
      expect(scanner.getCost(0)).toBe(3);

      // Item 16: block 1, then block 0, then item 0 = 2 + 1 + 1 = 4
      expect(scanner.getCost(16)).toBe(4);
    });

    it('should calculate cost for 2-switch (binary) elimination', () => {
      configManager.update({ eliminationSwitchCount: 2 });
      scanner['numSwitches'] = 2;

      // Binary search: log2(64) = 6 levels
      // Each level requires cycling to the right partition
      // Item 0: always first partition = 1+1+1+1+1+1 = 6
      expect(scanner.getCost(0)).toBe(6);

      // Item 63: always last/second partition = 2+2+2+2+2+2 = 12
      expect(scanner.getCost(63)).toBe(12);
    });

    it('should have lower cost with more switches', () => {
      const cost4Switch = scanner.getCost(0);

      configManager.update({ eliminationSwitchCount: 8 });
      scanner['numSwitches'] = 8;
      const cost8Switch = scanner.getCost(0);

      expect(cost8Switch).toBeLessThan(cost4Switch);
    });
  });

  describe('Manual Mode Behavior', () => {
    it('should not auto-cycle blocks in manual mode', () => {
      configManager.update({ scanInputMode: 'manual', eliminationSwitchCount: 4 });
      const items = Array.from({ length: 64 }, (_, i) => ({ label: `${i}`, index: i, id: `item-${i}` }));
      renderer.render(items);
      scanner.start();

      const initialBlock = scanner['currentBlock'];

      return new Promise(resolve => {
        setTimeout(() => {
          expect(scanner['currentBlock']).toBe(initialBlock);
          scanner.stop();
          resolve(null);
        }, 200);
      });
    });

    it('should only advance on step action in manual mode', () => {
      configManager.update({ scanInputMode: 'manual' });
      const items = Array.from({ length: 64 }, (_, i) => ({ label: `${i}`, index: i, id: `item-${i}` }));
      renderer.render(items);
      scanner.start();

      const steps = 5;
      for (let i = 0; i < steps; i++) {
        scanner['step']();
      }

      expect(scanner['currentBlock']).toBe(steps % 4);
    });
  });

  describe('Final Selection', () => {
    beforeEach(() => {
      const items = Array.from({ length: 64 }, (_, i) => ({ label: `${i}`, index: i, id: `item-${i}` }));
      renderer.render(items);
      scanner.start();
    });

    it('should trigger selection when reaching single item', () => {
      // Narrow down to single item through multiple selections
      scanner['currentBlock'] = 0;
      scanner.handleAction('switch-1');
      scanner['currentBlock'] = 0;
      scanner.handleAction('switch-1');
      scanner['currentBlock'] = 0;
      scanner.handleAction('switch-1');

      // Should have selected item 0
      expect(scanner['rangeStart']).toBe(0);
      expect(scanner['rangeEnd']).toBe(1);
    });
  });
});
