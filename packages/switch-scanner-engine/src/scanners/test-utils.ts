import { vi } from 'vitest';
import type { ScanConfig, ScanConfigProvider, ScanSurface } from '../types';

export const baseConfig: ScanConfig = {
  scanRate: 100,
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

export function createConfig(overrides: Partial<ScanConfig> = {}) {
  let config: ScanConfig = { ...baseConfig, ...overrides };
  const provider: ScanConfigProvider = {
    get: () => config,
  };
  return {
    get config() {
      return config;
    },
    setConfig(next: Partial<ScanConfig>) {
      config = { ...config, ...next };
    },
    provider,
  };
}

export function createSurface(count = 12, cols = 4) {
  const focus: number[][] = [];
  const selected: number[] = [];
  const surface: ScanSurface = {
    getItemsCount: () => count,
    getColumns: () => cols,
    setFocus: vi.fn((indices: number[]) => {
      focus.push(indices);
    }),
    setSelected: vi.fn((index: number) => {
      selected.push(index);
    }),
    getItemData: (index) => ({ label: `Item ${index}`, isEmpty: false }),
  };
  return { surface, focus, selected };
}
