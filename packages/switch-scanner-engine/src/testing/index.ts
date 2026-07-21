/**
 * Public testing utilities for `scan-engine`.
 *
 * `createTestScanner` wires an in-memory surface, a deterministic manual
 * scheduler, and an event recorder around any of the built-in scanners so
 * you can drive a full scan loop without vitest fake timers, jsdom, or a DOM.
 *
 * @example
 * ```ts
 * import { LinearScanner } from 'scan-engine';
 * import { createTestScanner } from 'scan-engine/testing';
 *
 * const { clock, scanner, fixture } = createTestScanner(
 *   LinearScanner,
 *   { scanRate: 1000 },
 *   6,
 * );
 * scanner.start();
 * clock.advanceBy(1000);  // first tick
 * clock.advanceBy(1000);  // second tick
 * scanner.handleAction('select');
 * expect(fixture.selected).toEqual([1]);
 * ```
 */

import type {
  ScanCallbacks,
  ScanConfig,
  ScanConfigProvider,
  ScanItemData,
  ScanSurface,
} from '../types';
import {
  manualScheduler,
  type ManualScheduler,
} from '../scheduler';

export interface FixtureItem extends ScanItemData {
  id: number;
}

export interface ScannerFixture {
  /** All items the fixture knows about, in scan order. */
  items: FixtureItem[];
  /** Indices passed to `surface.setFocus(...)` since the fixture was created. */
  focusCalls: number[][];
  /** Indices passed to `surface.setSelected(...)` since the fixture was created. */
  selected: number[];
  /** Mark an item as empty so the engine skips it. */
  markEmpty(index: number, isEmpty?: boolean): void;
  /** Read the live item data the engine sees. */
  surface: ScanSurface;
}

export interface CreateTestScannerResult<S> {
  /** The deterministic scheduler. Call `clock.advanceBy(ms)` to drive time. */
  clock: ManualScheduler;
  /** The constructed scanner. */
  scanner: S;
  /** In-memory surface state and assertions. */
  fixture: ScannerFixture;
  /** The config holder — mutate via `setConfig` to test live reconfig. */
  setConfig(overrides: Partial<ScanConfig>): void;
}

type ScannerConstructor<S> = new (
  surface: ScanSurface,
  config: ScanConfigProvider,
  callbacks: ScanCallbacks,
  scheduler: ManualScheduler,
) => S;

const BASE_CONFIG: ScanConfig = {
  scanRate: 1000,
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

export function createFixture(items: FixtureItem[] = []): ScannerFixture {
  const isEmptySet = new Set<number>();
  const focusCalls: number[][] = [];
  const selected: number[] = [];

  const surface: ScanSurface = {
    getItemsCount: () => items.length,
    getColumns: () => 4,
    setFocus: (indices) => {
      focusCalls.push([...indices]);
    },
    setSelected: (index) => {
      selected.push(index);
    },
    getItemData: (index) => {
      const item = items[index];
      if (!item) return null;
      const isEmpty = Boolean(isEmptySet.has(index) || item.isEmpty);
      return { label: item.label, isEmpty };
    },
  };

  return {
    items,
    focusCalls,
    selected,
    markEmpty(index, value = true) {
      if (value) isEmptySet.add(index);
      else isEmptySet.delete(index);
    },
    surface,
  };
}

export function createTestScanner<S>(
  ScannerCtor: ScannerConstructor<S>,
  configOverrides: Partial<ScanConfig> = {},
  itemCount = 6,
  items?: FixtureItem[],
  callbacks: ScanCallbacks = {},
): CreateTestScannerResult<S> {
  const fixtureItems: FixtureItem[] =
    items ?? Array.from({ length: itemCount }, (_, i) => ({ id: i, label: `Item ${i}` }));

  const fixture = createFixture(fixtureItems);
  let config: ScanConfig = { ...BASE_CONFIG, ...configOverrides };
  const provider: ScanConfigProvider = { get: () => config };
  const clock = manualScheduler();

  const scanner = new ScannerCtor(
    fixture.surface,
    provider,
    callbacks,
    clock,
  );

  return {
    clock,
    scanner,
    fixture,
    setConfig(overrides) {
      config = { ...config, ...overrides };
    },
  };
}
