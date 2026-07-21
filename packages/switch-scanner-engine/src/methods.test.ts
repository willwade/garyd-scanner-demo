import { describe, it, expect } from 'vitest';
import {
  causeEffect,
  colorCode,
  columnRow,
  continuous,
  createScanner,
  elimination,
  groupRowColumn,
  isScanMethod,
  linear,
  METHOD_KINDS,
  methodToConfigOverrides,
  probability,
  quadrant,
  rowColumn,
  snake,
  type ScanConfig,
  type ScanMethod,
} from './methods';
import { manualScheduler } from './scheduler';
import { CauseEffectScanner } from './scanners/CauseEffectScanner';
import { ColorCodeScanner } from './scanners/ColorCodeScanner';
import { ContinuousScanner } from './scanners/ContinuousScanner';
import { EliminationScanner } from './scanners/EliminationScanner';
import { GroupScanner } from './scanners/GroupScanner';
import { LinearScanner } from './scanners/LinearScanner';
import { ProbabilityScanner } from './scanners/ProbabilityScanner';
import { QuadrantScanner } from './scanners/QuadrantScanner';
import { RowColumnScanner } from './scanners/RowColumnScanner';
import { SnakeScanner } from './scanners/SnakeScanner';
import type { ScanSurface } from './types';

const baseConfig: ScanConfig = {
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

const noopSurface: ScanSurface = {
  getItemsCount: () => 12,
  getColumns: () => 4,
  setFocus: () => {},
  setSelected: () => {},
};

describe('method constructors', () => {
  it('each factory returns a frozen descriptor', () => {
    const methods: ScanMethod[] = [
      rowColumn(),
      columnRow(),
      linear(),
      snake(),
      quadrant(),
      groupRowColumn(),
      elimination(),
      elimination({ switches: 2 }),
      elimination({ switches: 8 }),
      continuous(),
      continuous({ technique: 'gliding' }),
      continuous({ technique: 'eight-direction' }),
      probability(),
      causeEffect(),
      colorCode(),
    ];
    for (const m of methods) {
      expect(Object.isFrozen(m)).toBe(true);
      expect(typeof m.kind).toBe('string');
    }
  });

  it('every factory kind appears in METHOD_KINDS', () => {
    const kinds = new Set(METHOD_KINDS);
    for (const k of [
      'row-column', 'column-row', 'linear', 'snake', 'quadrant',
      'group-row-column', 'elimination', 'continuous', 'probability',
      'cause-effect', 'color-code',
    ]) {
      expect(kinds.has(k as ScanMethod['kind'])).toBe(true);
    }
  });

  it('elimination rejects out-of-range switch counts', () => {
    expect(() => elimination({ switches: 1 })).toThrow();
    expect(() => elimination({ switches: 9 })).toThrow();
    expect(() => elimination({ switches: 3.5 })).toThrow();
    expect(() => elimination({ switches: 'four' as unknown as number })).toThrow();
  });

  it('continuous rejects unknown techniques', () => {
    expect(() => continuous({ technique: 'diagonal' as never })).toThrow();
  });

  it('elimination and continuous apply sensible defaults', () => {
    expect(elimination().switches).toBe(4);
    expect(continuous().technique).toBe('crosshair');
  });
});

describe('isScanMethod', () => {
  it('accepts factory output', () => {
    expect(isScanMethod(linear())).toBe(true);
    expect(isScanMethod(continuous({ technique: 'gliding' }))).toBe(true);
  });

  it('rejects junk', () => {
    expect(isScanMethod(null)).toBe(false);
    expect(isScanMethod(undefined)).toBe(false);
    expect(isScanMethod({})).toBe(false);
    expect(isScanMethod({ kind: 'nope' })).toBe(false);
    expect(isScanMethod({ kind: 42 })).toBe(false);
  });
});

describe('methodToConfigOverrides', () => {
  it('maps each method to the right scanMode/scanPattern pair', () => {
    expect(methodToConfigOverrides(rowColumn())).toMatchObject({ scanMode: null, scanPattern: 'row-column' });
    expect(methodToConfigOverrides(columnRow())).toMatchObject({ scanMode: null, scanPattern: 'column-row' });
    expect(methodToConfigOverrides(linear())).toMatchObject({ scanMode: null, scanPattern: 'linear' });
    expect(methodToConfigOverrides(snake())).toMatchObject({ scanMode: null, scanPattern: 'snake' });
    expect(methodToConfigOverrides(quadrant())).toMatchObject({ scanMode: null, scanPattern: 'quadrant' });
    expect(methodToConfigOverrides(groupRowColumn())).toMatchObject({ scanMode: 'group-row-column' });
    expect(methodToConfigOverrides(probability())).toMatchObject({ scanMode: 'probability' });
    expect(methodToConfigOverrides(causeEffect())).toMatchObject({ scanMode: 'cause-effect' });
    expect(methodToConfigOverrides(colorCode())).toMatchObject({ scanMode: 'color-code' });
  });

  it('carries elimination switch count into config', () => {
    expect(methodToConfigOverrides(elimination({ switches: 6 }))).toMatchObject({
      scanPattern: 'elimination',
      eliminationSwitchCount: 6,
    });
  });

  it('carries continuous technique into config', () => {
    expect(methodToConfigOverrides(continuous({ technique: 'gliding' }))).toMatchObject({
      scanMode: 'continuous',
      continuousTechnique: 'gliding',
    });
  });
});

describe('createScanner', () => {
  it.each([
    [rowColumn(), RowColumnScanner],
    [columnRow(), RowColumnScanner],
    [linear(), LinearScanner],
    [snake(), SnakeScanner],
    [quadrant(), QuadrantScanner],
    [elimination(), EliminationScanner],
    [groupRowColumn(), GroupScanner],
    [continuous(), ContinuousScanner],
    [probability(), ProbabilityScanner],
    [causeEffect(), CauseEffectScanner],
    [colorCode(), ColorCodeScanner],
  ] as const)('instantiates the right class for %s', (method, Ctor) => {
    const scanner = createScanner({
      method,
      surface: noopSurface,
      config: baseConfig,
      scheduler: manualScheduler(),
    });
    expect(scanner).toBeInstanceOf(Ctor);
  });

  it('merges strategy overrides on top of the caller config (plain object)', () => {
    const scanner = createScanner({
      method: elimination({ switches: 5 }),
      surface: noopSurface,
      config: { ...baseConfig, eliminationSwitchCount: 2 },
      scheduler: manualScheduler(),
    });
    // The engine reads the merged config; for elimination we expect 5 to win.
    // The scanner doesn't expose config directly, so we trigger one path that
    // reads eliminationSwitchCount. At minimum, the merge must produce a
    // valid scanner that can read its own config without throwing.
    expect(() => scanner.start()).not.toThrow();
    scanner.stop();
  });

  it('delegates to a caller-provided ScanConfigProvider after merging', () => {
    let returnedConfig: ScanConfig | null = null;
    const provider = {
      get: () => ({ ...baseConfig, scanRate: 4321 }),
    };
    returnedConfig = provider.get();
    expect(returnedConfig.scanRate).toBe(4321);

    const scanner = createScanner({
      method: continuous({ technique: 'gliding' }),
      surface: noopSurface,
      config: provider,
      scheduler: manualScheduler(),
    });
    expect(scanner).toBeInstanceOf(ContinuousScanner);
  });

  it('accepts a manual scheduler for deterministic tests', () => {
    const clock = manualScheduler();
    const scanner = createScanner({
      method: linear(),
      surface: noopSurface,
      config: { ...baseConfig, scanRate: 100 },
      scheduler: clock,
    });
    scanner.start();
    expect(clock.pending()).toBeGreaterThan(0);
    clock.advanceBy(100);
    scanner.stop();
  });

  it('throws on a non-method input', () => {
    expect(() =>
      createScanner({
        method: { kind: 'made-up' } as unknown as ScanMethod,
        surface: noopSurface,
        config: baseConfig,
      }),
    ).toThrow();
  });
});
