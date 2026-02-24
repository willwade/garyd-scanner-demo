import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  forwardRef,
} from 'react';
import {
  CauseEffectScanner,
  ColorCodeScanner,
  ContinuousScanner,
  EliminationScanner,
  GroupScanner,
  LinearScanner,
  ProbabilityScanner,
  QuadrantScanner,
  RowColumnScanner,
  SnakeScanner,
  type ScanConfig,
  type ScanConfigProvider,
  type ScanSurface,
  type Scanner as EngineScanner,
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

function createScanner(
  surface: ScanSurface,
  configProvider: ScanConfigProvider,
  callbacks: { onSelect?: (index: number) => void },
): EngineScanner {
  const config = configProvider.get();

  if (config.scanMode === 'cause-effect') return new CauseEffectScanner(surface, configProvider, callbacks);
  if (config.scanMode === 'group-row-column') return new GroupScanner(surface, configProvider, callbacks);
  if (config.scanMode === 'continuous') return new ContinuousScanner(surface, configProvider, callbacks);
  if (config.scanMode === 'probability') return new ProbabilityScanner(surface, configProvider, callbacks);
  if (config.scanMode === 'color-code') return new ColorCodeScanner(surface, configProvider, callbacks);

  switch (config.scanPattern) {
    case 'linear':
      return new LinearScanner(surface, configProvider, callbacks);
    case 'snake':
      return new SnakeScanner(surface, configProvider, callbacks);
    case 'quadrant':
      return new QuadrantScanner(surface, configProvider, callbacks);
    case 'elimination':
      return new EliminationScanner(surface, configProvider, callbacks);
    case 'row-column':
    case 'column-row':
    default:
      return new RowColumnScanner(surface, configProvider, callbacks);
  }
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
    () => ({ register, unregister }),
    [register, unregister],
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

    scannerRef.current?.stop();
    scannerRef.current = createScanner(surface, configProvider, {
      onSelect: (index) => {
        const element = currentItems()[index] ?? null;
        if (element) element.click();
        onSelect?.(index, element);
      },
    });

    if (active) {
      scannerRef.current.start();
      runningRef.current = true;
    } else {
      runningRef.current = false;
    }

    return () => {
      scannerRef.current?.stop();
      runningRef.current = false;
    };
  }, [active, columns, currentItems, onSelect, mergedConfig.scanMode, mergedConfig.scanPattern]);

  useEffect(() => {
    if (!scannerRef.current) return;
    if (active && !runningRef.current) {
      scannerRef.current.start();
      runningRef.current = true;
    } else if (!active && runningRef.current) {
      scannerRef.current.stop();
      runningRef.current = false;
    }
  }, [active]);

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
