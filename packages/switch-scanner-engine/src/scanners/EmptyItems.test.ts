import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Scanner } from '../Scanner';
import type { ScanItemData, ScanSurface } from '../types';
import { createConfig } from './test-utils';

class TestScannerWithEmptyItems extends Scanner {
  public stepCallCount = 0;

  protected step() {
    this.stepCallCount++;
  }

  protected reset() {
    this.stepCallCount = 0;
  }

  protected doSelection() {
    // no-op for tests
  }

  public getCost(itemIndex: number): number {
    return itemIndex + 1;
  }

  public testTriggerSelection(index: number) {
    this.triggerSelection(index);
  }

  public getStepCount(): number {
    return this.stepCount;
  }
}

describe('Empty Items Feature', () => {
  let scanner: TestScannerWithEmptyItems;
  let configManager: ReturnType<typeof createConfig>;
  let items: ScanItemData[];
  let surface: ScanSurface;
  let onSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    configManager = createConfig();
    items = [
      { label: 'Item 1', isEmpty: false },
      { label: 'Item 2', isEmpty: false },
      { label: '(Empty)', isEmpty: true },
      { label: 'Item 4', isEmpty: false },
    ];
    onSelect = vi.fn();
    surface = {
      getItemsCount: () => items.length,
      getColumns: () => 2,
      setFocus: vi.fn(),
      setSelected: vi.fn(),
      getItemData: (index) => items[index] ?? null,
    };

    scanner = new TestScannerWithEmptyItems(surface, configManager.provider, { onSelect });
  });

  it('skips selection for empty items', () => {
    scanner.start();
    scanner.testTriggerSelection(2);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('fires selection for normal items', () => {
    scanner.start();
    scanner.testTriggerSelection(0);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('resets step counter on empty selection', () => {
    configManager.setConfig({ scanInputMode: 'manual' });
    scanner.start();
    scanner.handleAction('step');
    scanner.handleAction('step');
    expect(scanner.getStepCount()).toBe(2);

    scanner.testTriggerSelection(2);
    expect(scanner.getStepCount()).toBe(0);
  });
});
