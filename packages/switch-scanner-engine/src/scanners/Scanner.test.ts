import { describe, it, expect, vi } from 'vitest';
import { Scanner } from '../Scanner';
import type { ScanSurface } from '../types';
import { createConfig } from './test-utils';

class TestScanner extends Scanner {
  public stepCallCount = 0;
  public resetCallCount = 0;

  protected step() {
    this.stepCallCount++;
  }

  protected reset() {
    this.resetCallCount++;
  }

  protected doSelection() {
    // no-op
  }

  public getCost(itemIndex: number): number {
    return itemIndex + 1;
  }
}

describe('Scanner base', () => {
  it('starts and stops', () => {
    const { provider } = createConfig();
    const surface: ScanSurface = {
      getItemsCount: () => 5,
      getColumns: () => 5,
      setFocus: vi.fn(),
      setSelected: vi.fn(),
    };
    const scanner = new TestScanner(surface, provider, {});

    scanner.start();
    expect(scanner['isRunning']).toBe(true);
    scanner.stop();
    expect(scanner['isRunning']).toBe(false);
  });

  it('manual step triggers step', () => {
    const config = createConfig({ scanInputMode: 'manual' });
    const surface: ScanSurface = {
      getItemsCount: () => 5,
      getColumns: () => 5,
      setFocus: vi.fn(),
      setSelected: vi.fn(),
    };
    const scanner = new TestScanner(surface, config.provider, {});
    scanner.start();
    scanner.handleAction('step');
    expect(scanner.stepCallCount).toBe(1);
  });
});
