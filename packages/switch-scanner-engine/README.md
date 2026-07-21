# Scan Engine

Headless scan engine for switch-scanning interfaces. This package provides scanning strategies (row/column, linear, snake, elimination, etc.) without any UI. You provide a `ScanSurface` adapter for your UI and wire `ScanCallbacks` for selection events.

## Install

```bash
npm install scan-engine
```

## Usage

```ts
import { LinearScanner, type ScanSurface, type ScanConfigProvider } from 'scan-engine';

const surface: ScanSurface = {
  getItemsCount: () => items.length,
  getColumns: () => 8,
  setFocus: (indices) => highlight(indices),
  setSelected: (index) => flash(index),
  getItemData: (index) => ({ label: items[index].label })
};

const config: ScanConfigProvider = {
  get: () => ({
    scanRate: 800,
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
    colorCode: { errorRate: 0.1, selectThreshold: 0.95 }
  })
};

const scanner = new LinearScanner(surface, config, {
  onSelect: (index) => console.log('Selected', index)
});

scanner.start();
```

## Continuous Scanning UI Hooks

Continuous scanning is headless. Provide optional hooks for UI:

```ts
import type { ContinuousUpdate, ScanSurface, ScanCallbacks } from 'scan-engine';

const surface: ScanSurface = {
  getItemsCount: () => items.length,
  getColumns: () => 8,
  setFocus: (indices) => highlight(indices),
  setSelected: (index) => flash(index),
  resolveIndexAtPoint: (xPercent, yPercent) => resolveIndex(xPercent, yPercent)
};

const callbacks: ScanCallbacks = {
  onContinuousUpdate: (state: ContinuousUpdate) => {
    renderContinuousOverlay(state);
  }
};
```

If you are using a DOM grid, the companion package `scan-engine-dom` provides an overlay renderer and hit-testing helper.

## Method constructors

The recommended way to build a scanner is `createScanner` paired with one of the strategy factories. Each factory returns a frozen, validated method descriptor, so a misconfigured strategy fails at construction instead of mid-session.

```ts
import {
  createScanner,
  continuous,
  elimination,
  type ScanConfig,
} from 'scan-engine';

const base: ScanConfig = {
  scanRate: 800,
  // …the rest of the config
};

const scanner = createScanner({
  method: continuous({ technique: 'gliding' }),
  surface,
  config: base,
  callbacks: { onSelect: (i) => console.log('selected', i) },
});

scanner.start();
```

| Factory | Method `kind` | Notes |
| --- | --- | --- |
| `rowColumn()` | `row-column` | Row group → cells in chosen row. |
| `columnRow()` | `column-row` | Column group → cells in chosen column. |
| `linear()` | `linear` | Item-by-item, top-left to bottom-right. |
| `snake()` | `snake` | Boustrophedon: direction alternates each row. |
| `quadrant()` | `quadrant` | Recursive quadrant subdivision. |
| `groupRowColumn()` | `group-row-column` | Nested group hierarchy. |
| `elimination({ switches })` | `elimination` | `switches` is an integer 2–8. |
| `continuous({ technique })` | `continuous` | `technique` is `crosshair` / `gliding` / `eight-direction`. |
| `probability()` | `probability` | PPM-reordered row–column (needs `PredictorManager`). |
| `causeEffect()` | `cause-effect` | Early switch training. |
| `colorCode()` | `color-code` | Error-tolerant selection. |

The lower-level scanner classes (`LinearScanner`, `ContinuousScanner`, …) are still exported; `createScanner` is the convenience layer on top.

## Snapshot & event channels

Every scanner exposes three observable channels:

```ts
const snapshot = scanner.getSnapshot();        // { status, highlight, stepCount, loopCount, overscanState }
const unsub = scanner.subscribe((s) => …);     // re-render on state changes
const stopEvents = scanner.observe((e) => …);  // feedback: scan.started, highlight.changed, item.selected…
```

Snapshots are for rendering; events are for feedback (audio, analytics, logging). React consumers should reach for `useScannerSnapshot` / `useScannerEvents` from `react-scan-engine`.

## Deterministic testing

`scan-engine/testing` ships a manual scheduler and a fixture so you can drive a full scan loop without vitest fake timers or jsdom:

```ts
import { LinearScanner } from 'scan-engine';
import { createTestScanner } from 'scan-engine/testing';

const { clock, scanner, fixture } = createTestScanner(
  LinearScanner,
  { scanRate: 1000 },
  6,
);

scanner.start();
clock.advanceBy(1000);
scanner.handleAction('select');
expect(fixture.selected).toEqual([0]);
```

## Optional stylesheet

Import the shipped stylesheet for an accessible focus + selection affordance out of the box:

```ts
import 'scan-engine/styles.css';
```

The React wrapper writes `data-scan-focused` / `data-scan-selected` / `data-scannable` attributes; the stylesheet turns those into visible affordances and honors `forced-colors` and `prefers-reduced-motion`. Override the `--scan-focus-*` / `--scan-selected-*` custom properties to brand it.

## Strategies

- Row/Column
- Linear
- Snake
- Quadrant
- Group-Row-Column
- Elimination
- Continuous (crosshair, gliding, eight-direction)
- Probability
- Cause/Effect
- ColorCode

## License

MIT
