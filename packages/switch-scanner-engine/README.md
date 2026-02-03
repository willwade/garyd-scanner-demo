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
