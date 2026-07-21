/**
 * Strategy descriptors ("scan methods") and the {@link createScanner} factory.
 *
 * A method is a frozen, validated, serializable description of *which* scan
 * strategy to use — not behavior. The runtime reads the engine's
 * `ScanConfig` for timing/direction; the method only contributes the
 * strategy-specific fields (`scanMode`, `scanPattern`, switch counts,
 * continuous technique).
 *
 * Method constructors fail eagerly on bad input so a misconfigured scanner
 * can never start running.
 *
 * @example
 * ```ts
 * import { createScanner, elimination, type ScanConfig } from 'scan-engine';
 *
 * const baseConfig: ScanConfig = {
 *   scanRate: 1000,
 *   // ...the rest
 * };
 *
 * const scanner = createScanner(
 *   elimination({ switches: 4 }),
 *   surface,
 *   baseConfig,
 *   { onSelect: (i) => console.log('selected', i) },
 * );
 * scanner.start();
 * ```
 */

import type {
  ContinuousTechnique,
  ScanCallbacks,
  ScanConfig,
  ScanConfigProvider,
  ScanSurface,
} from './types';
import { systemScheduler, type Scheduler } from './scheduler';
import { Scanner } from './Scanner';
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

export type EliminationSwitchCount = 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface RowColumnMethod {
  readonly kind: 'row-column';
}
export interface ColumnRowMethod {
  readonly kind: 'column-row';
}
export interface LinearMethod {
  readonly kind: 'linear';
}
export interface SnakeMethod {
  readonly kind: 'snake';
}
export interface QuadrantMethod {
  readonly kind: 'quadrant';
}
export interface GroupRowColumnMethod {
  readonly kind: 'group-row-column';
}
export interface EliminationMethod {
  readonly kind: 'elimination';
  readonly switches: EliminationSwitchCount;
}
export interface ContinuousMethod {
  readonly kind: 'continuous';
  readonly technique: ContinuousTechnique;
}
export interface ProbabilityMethod {
  readonly kind: 'probability';
}
export interface CauseEffectMethod {
  readonly kind: 'cause-effect';
}
export interface ColorCodeMethod {
  readonly kind: 'color-code';
}

/**
 * Discriminated union of every supported scan strategy. The `kind` matches
 * the existing `scanMode` / `scanPattern` string values so the factory can
 * map straight onto the existing scanner classes.
 */
export type ScanMethod =
  | RowColumnMethod
  | ColumnRowMethod
  | LinearMethod
  | SnakeMethod
  | QuadrantMethod
  | GroupRowColumnMethod
  | EliminationMethod
  | ContinuousMethod
  | ProbabilityMethod
  | CauseEffectMethod
  | ColorCodeMethod;

export const METHOD_KINDS = [
  'row-column',
  'column-row',
  'linear',
  'snake',
  'quadrant',
  'group-row-column',
  'elimination',
  'continuous',
  'probability',
  'cause-effect',
  'color-code',
] as const satisfies readonly ScanMethod['kind'][];

export type MethodKind = (typeof METHOD_KINDS)[number];

const CONTINUOUS_TECHNIQUES: readonly ContinuousTechnique[] = [
  'crosshair',
  'gliding',
  'eight-direction',
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/** Row-by-row group scan, then within the chosen row. */
export function rowColumn(): RowColumnMethod {
  return Object.freeze({ kind: 'row-column' });
}

/** Column-by-column group scan, then within the chosen column. */
export function columnRow(): ColumnRowMethod {
  return Object.freeze({ kind: 'column-row' });
}

/** Single-item traversal, top-left to bottom-right. */
export function linear(): LinearMethod {
  return Object.freeze({ kind: 'linear' });
}

/** Boustrophedon traversal — direction alternates each row. */
export function snake(): SnakeMethod {
  return Object.freeze({ kind: 'snake' });
}

/** Recursive quadrant subdivision. */
export function quadrant(): QuadrantMethod {
  return Object.freeze({ kind: 'quadrant' });
}

/** Nested group scan with explicit hierarchy (row → cell). */
export function groupRowColumn(): GroupRowColumnMethod {
  return Object.freeze({ kind: 'group-row-column' });
}

/**
 * Elimination scanning. Each switch press halves (or N-ths) the candidate
 * set until one item remains.
 *
 * @throws if `switches` is not an integer in [2, 8].
 */
export function elimination(
  options: { switches?: EliminationSwitchCount } = {},
): EliminationMethod {
  const switches = options.switches ?? 4;
  assert(
    Number.isInteger(switches) && switches >= 2 && switches <= 8,
    `elimination(): switches must be an integer 2–8, got ${JSON.stringify(switches)}`,
  );
  return Object.freeze({ kind: 'elimination', switches: switches as EliminationSwitchCount });
}

/**
 * Continuous (crosshair / gliding / eight-direction) scanning.
 *
 * @throws if `technique` is not a recognised value.
 */
export function continuous(
  options: { technique?: ContinuousTechnique } = {},
): ContinuousMethod {
  const technique = options.technique ?? 'crosshair';
  assert(
    (CONTINUOUS_TECHNIQUES as readonly string[]).includes(technique),
    `continuous(): technique must be one of ${CONTINUOUS_TECHNIQUES.join(', ')}, got ${JSON.stringify(technique)}`,
  );
  return Object.freeze({ kind: 'continuous', technique });
}

/** PPM-reordered row–column scan (depends on a `PredictorManager`). */
export function probability(): ProbabilityMethod {
  return Object.freeze({ kind: 'probability' });
}

/** Cause-and-effect scan for early switch training. */
export function causeEffect(): CauseEffectMethod {
  return Object.freeze({ kind: 'cause-effect' });
}

/** Color-coded scanning (error-tolerant selection). */
export function colorCode(): ColorCodeMethod {
  return Object.freeze({ kind: 'color-code' });
}

type ScannerConstructor = new (
  surface: ScanSurface,
  config: ScanConfigProvider,
  callbacks: ScanCallbacks,
  scheduler: Scheduler,
) => Scanner;

function classForMethod(method: ScanMethod): ScannerConstructor {
  switch (method.kind) {
    case 'row-column':
    case 'column-row':
      return RowColumnScanner;
    case 'linear':
      return LinearScanner;
    case 'snake':
      return SnakeScanner;
    case 'quadrant':
      return QuadrantScanner;
    case 'elimination':
      return EliminationScanner;
    case 'group-row-column':
      return GroupScanner;
    case 'continuous':
      return ContinuousScanner;
    case 'probability':
      return ProbabilityScanner;
    case 'cause-effect':
      return CauseEffectScanner;
    case 'color-code':
      return ColorCodeScanner;
  }
}

/**
 * Translate a method descriptor into the slice of `ScanConfig` the engine's
 * subclasses read at runtime. Today the classes look at `scanMode` /
 * `scanPattern` / `continuousTechnique` / `eliminationSwitchCount`; folding
 * those into the config keeps every existing code path working unchanged.
 */
export function methodToConfigOverrides(method: ScanMethod): Partial<ScanConfig> {
  switch (method.kind) {
    case 'row-column':
      return { scanMode: null, scanPattern: 'row-column' };
    case 'column-row':
      return { scanMode: null, scanPattern: 'column-row' };
    case 'linear':
      return { scanMode: null, scanPattern: 'linear' };
    case 'snake':
      return { scanMode: null, scanPattern: 'snake' };
    case 'quadrant':
      return { scanMode: null, scanPattern: 'quadrant' };
    case 'elimination':
      return {
        scanMode: null,
        scanPattern: 'elimination',
        eliminationSwitchCount: method.switches,
      };
    case 'group-row-column':
      return { scanMode: 'group-row-column', scanPattern: 'row-column' };
    case 'continuous':
      return { scanMode: 'continuous', scanPattern: 'row-column', continuousTechnique: method.technique };
    case 'probability':
      return { scanMode: 'probability', scanPattern: 'row-column' };
    case 'cause-effect':
      return { scanMode: 'cause-effect', scanPattern: 'row-column' };
    case 'color-code':
      return { scanMode: 'color-code', scanPattern: 'row-column' };
  }
}

/** True if a value looks like a {@link ScanMethod}. */
export function isScanMethod(value: unknown): value is ScanMethod {
  if (typeof value !== 'object' || value === null) return false;
  const kind = (value as { kind?: unknown }).kind;
  return (METHOD_KINDS as readonly string[]).includes(kind as string);
}

/**
 * Derive a {@link ScanMethod} from a legacy `ScanConfig`. Used by callers
 * (notably `react-scan-engine`) that still describe strategy via the
 * `scanMode` + `scanPattern` pair so they can hand off to {@link createScanner}
 * instead of maintaining their own switch statement.
 *
 * @throws if the config names an unknown strategy.
 */
export function methodFromConfig(config: ScanConfig): ScanMethod {
  if (config.scanMode) {
    switch (config.scanMode) {
      case 'group-row-column': return groupRowColumn();
      case 'continuous':       return continuous({ technique: config.continuousTechnique });
      case 'probability':      return probability();
      case 'cause-effect':     return causeEffect();
      case 'color-code':       return colorCode();
    }
  }
  switch (config.scanPattern) {
    case 'row-column': return rowColumn();
    case 'column-row': return columnRow();
    case 'linear':     return linear();
    case 'snake':      return snake();
    case 'quadrant':   return quadrant();
    case 'elimination':return elimination({ switches: config.eliminationSwitchCount });
  }
  throw new Error(`methodFromConfig: unrecognised strategy (scanMode=${config.scanMode}, scanPattern=${config.scanPattern})`);
}

export interface CreateScannerOptions {
  /** Strategy descriptor from one of the method factories. */
  method: ScanMethod;
  /** Surface the engine will drive. */
  surface: ScanSurface;
  /**
   * Either a fully-formed `ScanConfig` (we wrap it in a provider and merge
   * strategy-specific fields from `method`) or your own provider (we
   * delegate `get()` to it after merging).
   */
  config: ScanConfig | ScanConfigProvider;
  /** Optional engine callbacks. */
  callbacks?: ScanCallbacks;
  /** Optional scheduler; defaults to the real-time scheduler. */
  scheduler?: Scheduler;
}

/**
 * Construct the right scanner subclass for a method descriptor. This is the
 * recommended entry point for direct engine use: validate the strategy up
 * front, get the right class, and have the engine read the correct runtime
 * fields from its config.
 *
 * ```ts
 * const scanner = createScanner({
 *   method: continuous({ technique: 'gliding' }),
 *   surface,
 *   config: { scanRate: 800, /* ...rest *\/ },
 * });
 * ```
 */
export function createScanner(options: CreateScannerOptions): Scanner {
  const { method, surface, callbacks, scheduler = systemScheduler() } = options;
  assert(isScanMethod(method), `createScanner: method is not a ScanMethod`);

  const overrides = methodToConfigOverrides(method);

  let provider: ScanConfigProvider;
  if (typeof (options.config as ScanConfigProvider).get === 'function') {
    const inner = options.config as ScanConfigProvider;
    provider = { get: () => ({ ...inner.get(), ...overrides }) };
  } else {
    const base = options.config as ScanConfig;
    const merged: ScanConfig = { ...base, ...overrides };
    provider = { get: () => merged };
  }

  const ScannerCtor = classForMethod(method);
  return new ScannerCtor(surface, provider, callbacks ?? {}, scheduler);
}
