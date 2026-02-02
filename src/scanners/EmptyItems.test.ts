import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Scanner } from './Scanner';
import { GridRenderer, GridItem } from '../GridRenderer';
import { ConfigManager } from '../ConfigManager';
import { AudioManager } from '../AudioManager';

// Create a concrete test scanner implementation
class TestScannerWithEmptyItems extends Scanner {
  public stepCallCount = 0;
  public selectedItems: GridItem[] = [];

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

  public testTriggerSelection(item: GridItem) {
    this.triggerSelection(item);
  }

  public getStepCount(): number {
    return this.stepCount;
  }
}

describe('Empty Items Feature', () => {
  let scanner: TestScannerWithEmptyItems;
  let renderer: GridRenderer;
  let configManager: ConfigManager;
  let audioManager: AudioManager;
  let container: HTMLElement;
  let items: GridItem[];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    renderer = new GridRenderer(container);
    configManager = new ConfigManager({}, false);
    audioManager = {
      playScanSound: vi.fn(),
      playSelectSound: vi.fn(),
    } as any;

    scanner = new TestScannerWithEmptyItems(renderer, configManager, audioManager);

    // Create test items
    items = [
      { id: '1', label: 'Item 1', isEmpty: false },
      { id: '2', label: 'Item 2', isEmpty: false },
      { id: 'empty', label: '(Empty)', isEmpty: true },
      { id: '4', label: 'Item 4', isEmpty: false },
    ];
  });

  describe('GridItem Interface', () => {
    it('should support isEmpty property', () => {
      const emptyItem: GridItem = {
        id: 'test',
        label: 'Test',
        isEmpty: true
      };

      expect(emptyItem.isEmpty).toBe(true);
    });

    it('should default isEmpty to undefined', () => {
      const normalItem: GridItem = {
        id: 'test',
        label: 'Test'
      };

      expect(normalItem.isEmpty).toBeUndefined();
    });
  });

  describe('Configuration', () => {
    it('should have allowEmptyItems in config defaults', () => {
      const config = configManager.get();
      expect(config).toHaveProperty('allowEmptyItems');
      expect(config.allowEmptyItems).toBe(false);
    });

    it('should allow enabling empty items support', () => {
      configManager.update({ allowEmptyItems: true });
      expect(configManager.get().allowEmptyItems).toBe(true);
    });
  });

  describe('Selection Behavior', () => {
    beforeEach(() => {
      renderer.render(items);
      scanner.start();
    });

    it('should trigger selection event for normal item', () => {
      const mockListener = vi.fn();
      container.addEventListener('scanner:selection', mockListener);

      scanner.testTriggerSelection(items[0]);

      expect(mockListener).toHaveBeenCalledTimes(1);
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { item: items[0] } })
      );
      expect(audioManager.playSelectSound).toHaveBeenCalledTimes(1);
    });

    it('should NOT trigger selection event for empty item', () => {
      const mockListener = vi.fn();
      container.addEventListener('scanner:selection', mockListener);

      scanner.testTriggerSelection(items[2]); // Empty item

      expect(mockListener).not.toHaveBeenCalled();
      expect(audioManager.playSelectSound).not.toHaveBeenCalled();
    });

    it('should reset scan when empty item selected', () => {
      configManager.update({ scanInputMode: 'manual' });
      scanner.start();

      scanner.handleAction('step');
      scanner.handleAction('step');
      expect(scanner.getStepCount()).toBe(2);

      scanner.testTriggerSelection(items[2]); // Empty item

      // Should reset to beginning
      expect(scanner.getStepCount()).toBe(0);

      scanner.stop();
    });
  });

  describe('Config-Based Behavior', () => {
    beforeEach(() => {
      renderer.render(items);
    });

    it('should always skip empty items regardless of allowEmptyItems config', () => {
      configManager.update({ allowEmptyItems: false });
      scanner.start();

      const mockListener = vi.fn();
      container.addEventListener('scanner:selection', mockListener);

      // Even with allowEmptyItems = false, we still skip if item has isEmpty = true
      scanner.testTriggerSelection(items[2]); // Empty item

      expect(mockListener).not.toHaveBeenCalled();
    });

    it('should handle items with isEmpty = undefined', () => {
      const itemsWithoutFlag: GridItem[] = [
        { id: '1', label: 'Item 1' },
        { id: '2', label: 'Item 2' },
      ];

      renderer.render(itemsWithoutFlag);
      scanner.start();

      const mockListener = vi.fn();
      container.addEventListener('scanner:selection', mockListener);

      scanner.testTriggerSelection(itemsWithoutFlag[0]);

      expect(mockListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle all empty items', () => {
      const allEmpty: GridItem[] = [
        { id: '1', label: 'Empty 1', isEmpty: true },
        { id: '2', label: 'Empty 2', isEmpty: true },
      ];

      renderer.render(allEmpty);
      scanner.start();

      const mockListener = vi.fn();
      container.addEventListener('scanner:selection', mockListener);

      scanner.testTriggerSelection(allEmpty[0]);
      scanner.testTriggerSelection(allEmpty[1]);

      expect(mockListener).not.toHaveBeenCalled();
    });

    it('should handle mixed items correctly', () => {
      const mixed: GridItem[] = [
        { id: '1', label: 'Normal 1', isEmpty: false },
        { id: '2', label: 'Empty', isEmpty: true },
        { id: '3', label: 'Normal 2', isEmpty: false },
      ];

      renderer.render(mixed);
      scanner.start();

      const mockListener = vi.fn();
      container.addEventListener('scanner:selection', mockListener);

      // Normal item should trigger
      scanner.testTriggerSelection(mixed[0]);
      expect(mockListener).toHaveBeenCalledTimes(1);

      // Empty item should not trigger
      scanner.testTriggerSelection(mixed[1]);
      expect(mockListener).toHaveBeenCalledTimes(1); // Still 1

      // Normal item should trigger
      scanner.testTriggerSelection(mixed[2]);
      expect(mockListener).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration with Scanner State', () => {
    it('should reset timer when empty item selected', () => {
      configManager.update({
        scanInputMode: 'auto',
        scanRate: 100
      });

      renderer.render(items);
      scanner.start();

      // Simulate empty item selection
      scanner.testTriggerSelection(items[2]);

      // Scanner should still be running but reset
      expect(scanner['isRunning']).toBe(true);
      expect(scanner.getStepCount()).toBe(0);
    });

    it('should continue scanning after empty item reset', () => {
      configManager.update({
        scanInputMode: 'manual',
        scanRate: 100
      });

      renderer.render(items);
      scanner.start();

      // Take some steps
      scanner.handleAction('step');
      scanner.handleAction('step');
      expect(scanner.getStepCount()).toBe(2);

      // Select empty item
      scanner.testTriggerSelection(items[2]);
      expect(scanner.getStepCount()).toBe(0);

      // Should be able to continue scanning
      scanner.handleAction('step');
      expect(scanner.getStepCount()).toBe(1);
    });
  });
});
