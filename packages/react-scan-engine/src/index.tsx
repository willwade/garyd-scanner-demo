import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  forwardRef,
} from 'react';
import {
  createScanner as createEngineScanner,
  methodFromConfig,
  type ScanConfig,
  type ScanConfigProvider,
  type ScanSurface,
  type Scanner as EngineScanner,
  type ScannerEvent,
  type ScannerEventListener,
  type ScannerSnapshot,
  type SwitchAction,
} from 'scan-engine';

type PartialScanConfig = Partial<Omit<ScanConfig, 'criticalOverscan' | 'colorCode'>> & {
  criticalOverscan?: Partial<ScanConfig['criticalOverscan']>;
  colorCode?: Partial<ScanConfig['colorCode']>;
};

type ScannerProps = {
  active?: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  columns?: number;
  config?: PartialScanConfig;
  onSelect?: (index: number, element: HTMLElement | null) => void;
  keyMap?: Partial<Record<string, SwitchAction>>;
} & Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'>;

type ScannableProps = {
  children: ReactElement;
  className?: string;
};

type ScannerContextValue = {
  register: (element: HTMLElement) => void;
  unregister: (element: HTMLElement) => void;
  /** The current scanner, or null before the effect runs. */
  scanner: EngineScanner | null;
};

const ScannerContext = createContext<ScannerContextValue | null>(null);

const DEFAULT_CONFIG: ScanConfig = {
  scanRate: 800,
  scanInputMode: 'auto',
  scanDirection: 'circular',
  scanPattern: 'row-column',
  scanTechnique: 'block',
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

const DEFAULT_KEY_MAP: Record<string, SwitchAction> = {
  Enter: 'select',
  ' ': 'select',
  Spacebar: 'select',
  ArrowRight: 'step',
  ArrowDown: 'step',
  Escape: 'cancel',
  Backspace: 'reset',
};

function mergeConfig(config?: PartialScanConfig): ScanConfig {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    criticalOverscan: {
      ...DEFAULT_CONFIG.criticalOverscan,
      ...config?.criticalOverscan,
    },
    colorCode: {
      ...DEFAULT_CONFIG.colorCode,
      ...config?.colorCode,
    },
  };
}

function buildScanner(
  surface: ScanSurface,
  configProvider: ScanConfigProvider,
  callbacks: { onSelect?: (index: number) => void },
): EngineScanner {
  // Defer to the engine's createScanner so there is a single source of truth
  // for "which class for which strategy". The React wrapper still owns the
  // config (caller may mutate it live); methodFromConfig just maps the
  // scanMode/scanPattern pair onto a method descriptor.
  return createEngineScanner({
    method: methodFromConfig(configProvider.get()),
    surface,
    config: configProvider,
    callbacks,
  });
}

function orderedItems(items: Set<HTMLElement>): HTMLElement[] {
  return Array.from(items).sort((a, b) => {
    if (a === b) return 0;
    const pos = a.compareDocumentPosition(b);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
}

function applyFocus(elements: HTMLElement[], indices: number[]) {
  for (const element of elements) {
    element.classList.remove('scan-focus');
    element.removeAttribute('data-scan-focused');
  }

  for (const index of indices) {
    const target = elements[index];
    if (target) {
      target.classList.add('scan-focus');
      target.setAttribute('data-scan-focused', 'true');
    }
  }
}

function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    }
  };
}

export function Scanner({
  active = true,
  children,
  className,
  style,
  columns,
  config,
  onSelect,
  keyMap,
  tabIndex = 0,
  onKeyDown,
  ...rest
}: ScannerProps) {
  const itemsRef = useRef<Set<HTMLElement>>(new Set());
  const scannerRef = useRef<EngineScanner | null>(null);
  const [scanner, setScanner] = useState<EngineScanner | null>(null);
  const runningRef = useRef(false);

  const mergedConfig = useMemo(() => mergeConfig(config), [config]);
  const configRef = useRef<ScanConfig>(mergedConfig);
  configRef.current = mergedConfig;

  const register = useCallback((element: HTMLElement) => {
    itemsRef.current.add(element);
  }, []);

  const unregister = useCallback((element: HTMLElement) => {
    itemsRef.current.delete(element);
  }, []);

  const contextValue = useMemo<ScannerContextValue>(
    () => ({ register, unregister, scanner }),
    [register, unregister, scanner],
  );

  const currentItems = useCallback(() => orderedItems(itemsRef.current), []);

  useEffect(() => {
    const surface: ScanSurface = {
      getItemsCount: () => currentItems().length,
      getColumns: () => Math.max(1, columns ?? currentItems().length),
      setFocus: (indices) => applyFocus(currentItems(), indices),
      setSelected: (index) => {
        const element = currentItems()[index] ?? null;
        if (!element) return;
        element.setAttribute('data-scan-selected', 'true');
        window.setTimeout(() => element.removeAttribute('data-scan-selected'), 120);
      },
      getItemData: (index) => {
        const element = currentItems()[index];
        return element ? { isEmpty: element.getAttribute('aria-disabled') === 'true' } : { isEmpty: true };
      },
    };

    const configProvider: ScanConfigProvider = {
      get: () => configRef.current,
    };

    const next = buildScanner(surface, configProvider, {
      onSelect: (index) => {
        const element = currentItems()[index] ?? null;
        if (element) element.click();
        onSelect?.(index, element);
      },
    });
    scannerRef.current = next;
    setScanner(next);

    return () => {
      next.stop();
      runningRef.current = false;
      if (scannerRef.current === next) {
        scannerRef.current = null;
        setScanner(null);
      }
    };
  }, [columns, currentItems, onSelect, mergedConfig.scanMode, mergedConfig.scanPattern]);

  // Start/stop is its own effect so child components (useScannerEvents etc.)
  // re-subscribe to a freshly-created scanner before it starts emitting.
  useEffect(() => {
    const current = scannerRef.current;
    if (!current || !scanner) return;
    if (scanner !== current) return;
    if (active && !runningRef.current) {
      current.start();
      runningRef.current = true;
    } else if (!active && runningRef.current) {
      current.stop();
      runningRef.current = false;
    }
  }, [active, scanner]);

  const resolvedKeyMap = useMemo(() => ({ ...DEFAULT_KEY_MAP, ...keyMap }), [keyMap]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      const action = resolvedKeyMap[event.key];
      if (!action || !scannerRef.current) return;

      event.preventDefault();
      scannerRef.current.handleAction(action);
    },
    [onKeyDown, resolvedKeyMap],
  );

  return (
    <ScannerContext.Provider value={contextValue}>
      <div
        {...rest}
        className={className}
        style={style}
        tabIndex={tabIndex}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </ScannerContext.Provider>
  );
}

export const Scannable = forwardRef<HTMLElement, ScannableProps>(function Scannable(
  { children, className },
  forwardedRef,
) {
  const context = useContext(ScannerContext);
  const localRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!context || !localRef.current) return;
    context.register(localRef.current);
    return () => {
      if (localRef.current) context.unregister(localRef.current);
    };
  }, [context]);

  const child = children as ReactElement<any>;
  const mergedClassName = [child.props.className, className].filter(Boolean).join(' ') || undefined;

  return React.cloneElement(child, {
    ref: mergeRefs(localRef as React.Ref<HTMLElement>, child.props.ref, forwardedRef),
    className: mergedClassName,
    'data-scannable': 'true',
  } as any);
});

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export type ScanTargetProps = {
  ref: (node: HTMLElement | null) => void;
  'data-scannable': 'true';
};

export type UseScanTargetOptions = {
  /** Disable this target. Disabled items are skipped during scanning. */
  disabled?: boolean;
};

/**
 * Register any element as a scan target. Returns props to spread on the
 * element. No wrapper component is inserted, so portals, fragments, and
 * third-party components all work.
 *
 * ```tsx
 * const scan = useScanTarget();
 * return <button {...scan} onClick={...}>Click</button>;
 * ```
 *
 * To mirror the aria state of the element, also set `aria-disabled` when
 * `disabled` is true — the engine reads that attribute to skip empty items.
 */
export function useScanTarget(options: UseScanTargetOptions = {}): ScanTargetProps {
  const context = useContext(ScannerContext);
  const localRef = useRef<HTMLElement | null>(null);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      // Re-register whenever the node changes.
      if (context) {
        if (localRef.current) context.unregister(localRef.current);
        if (node) context.register(node);
      }
      localRef.current = node;
    },
    [context],
  );

  useEffect(() => {
    const node = localRef.current;
    if (!node) return;
    if (options.disabled) node.setAttribute('aria-disabled', 'true');
    else node.removeAttribute('aria-disabled');
  }, [options.disabled]);

  useEffect(() => {
    return () => {
      if (context && localRef.current) context.unregister(localRef.current);
    };
  }, [context]);

  return { ref, 'data-scannable': 'true' };
}

function useResolvedScanner(): EngineScanner | null {
  const context = useContext(ScannerContext);
  return context?.scanner ?? null;
}

const noopSubscribe = () => () => {};
const emptySnapshot: ScannerSnapshot = {
  status: 'idle',
  highlight: [],
  stepCount: 0,
  loopCount: 0,
  overscanState: null,
};
const getEmptySnapshot = () => emptySnapshot;

/**
 * Subscribe to a slice of the scanner snapshot. The component re-renders only
 * when the selected value changes (by reference for objects, by value for
 * primitives). Uses `useSyncExternalStore` under the hood.
 *
 * ```tsx
 * const status = useScannerSnapshot((s) => s.status);
 * const highlight = useScannerSnapshot((s) => s.highlight);
 * ```
 */
export function useScannerSnapshot<T>(
  selector: (snapshot: ScannerSnapshot) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T | null {
  const scanner = useResolvedScanner();
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const isEqualRef = useRef(isEqual);
  isEqualRef.current = isEqual;

  const cached = useRef<{ value: T | null; snapshot: ScannerSnapshot } | null>(null);

  const getSnapshot = useCallback((): T => {
    if (!scanner) {
      const empty = selectorRef.current(emptySnapshot);
      return empty;
    }
    const snapshot = scanner.getSnapshot();
    if (cached.current && cached.current.snapshot === snapshot) {
      return cached.current.value as T;
    }
    const next = selectorRef.current(snapshot);
    if (cached.current && isEqualRef.current(cached.current.value as T, next)) {
      cached.current.snapshot = snapshot;
      return cached.current.value as T;
    }
    cached.current = { value: next, snapshot };
    return next as T;
  }, [scanner]);

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!scanner) return noopSubscribe();
      return scanner.subscribe(() => {
        cached.current = null;
        onChange();
      });
    },
    [scanner],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getEmptySnapshot as () => T);
}

/**
 * Subscribe to the scanner event stream. The listener is stored in a ref so
 * identity changes never re-subscribe.
 *
 * ```tsx
 * useScannerEvents((event) => console.log(event));
 * ```
 */
export function useScannerEvents(listener: ScannerEventListener): void {
  const scanner = useResolvedScanner();
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    if (!scanner) return;
    return scanner.observe((event) => listenerRef.current(event));
  }, [scanner]);
}

export type ScannerCommands = {
  start: () => void;
  stop: () => void;
  handleAction: (action: SwitchAction) => void;
};

/**
 * Get imperative commands for the active scanner. Returns null if no scanner
 * is in scope. The same shape is also exposed as
 * `scanner.handleAction('select') | 'step' | 'reset' | 'cancel'` for input
 * adapters.
 */
export function useScannerCommands(): ScannerCommands | null {
  const scanner = useResolvedScanner();
  return useMemo(() => {
    if (!scanner) return null;
    return {
      start: () => scanner.start(),
      stop: () => scanner.stop(),
      handleAction: (action: SwitchAction) => scanner.handleAction(action),
    };
  }, [scanner]);
}

export type { ScannerEvent, ScannerSnapshot, ScannerEventListener };
