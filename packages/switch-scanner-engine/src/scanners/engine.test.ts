import { describe, it, expect, vi } from 'vitest';
import { LinearScanner } from './LinearScanner';
import type { ScanConfig, ScanConfigProvider, ScanSurface } from '../types';

const baseConfig: ScanConfig = {
  scanRate: 50,
  scanInputMode: 'auto',
  scanDirection: 'circular',
  scanPattern: 'linear',
  scanTechnique: 'point',
  scanMode: null,
  continuousTechnique: 'crosshair',
  compassMode: 'continuous',
  eliminationSwitchCount: 4,
  allowEmptyItems: false,
  initialItemPause: 0,
  scanLoops: 0,
  criticalOverscan: { enabled: false, fastRate: 100, slowRate: 1000 },
  colorCode: { errorRate: 0.1, selectThreshold: 0.95 },
};

function createSurface(count = 6): { surface: ScanSurface; focus: number[][]; selected: number[] } {
  const focus: number[][] = [];
  const selected: number[] = [];
  const surface: ScanSurface = {
    getItemsCount: () => count,
    getColumns: () => 3,
    setFocus: (indices) => focus.push(indices),
    setSelected: (index) => selected.push(index),
    getItemData: (index) => ({ label: `Item ${index}` }),
  };
  return { surface, focus, selected };
}

describe('Scan Engine', () => {
  it('advances focus when auto-scanning', () => {
    const { surface, focus } = createSurface();
    const config: ScanConfigProvider = { get: () => baseConfig };
    const scanner = new LinearScanner(surface, config, { onScanStep: vi.fn() });

    vi.useFakeTimers();
    scanner.start();
    vi.advanceTimersByTime(120);

    expect(focus.length).toBeGreaterThan(0);
    scanner.stop();
    vi.useRealTimers();
  });

  it('selects item on action', () => {
    const { surface, selected } = createSurface();
    const config: ScanConfigProvider = { get: () => ({ ...baseConfig, scanInputMode: 'manual' }) };
    const scanner = new LinearScanner(surface, config, { onSelect: (index) => selected.push(index) });

    scanner.start();
    scanner.handleAction('step');
    scanner.handleAction('select');

    expect(selected.length).toBeGreaterThan(0);
  });
});
