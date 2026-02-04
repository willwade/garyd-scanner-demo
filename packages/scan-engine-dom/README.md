# Scan Engine DOM

DOM helpers for `scan-engine` continuous scanning. This package provides a lightweight overlay renderer and a hit-testing helper for DOM grids.

## Install

```bash
npm install scan-engine-dom scan-engine
```

## Usage

```ts
import { ContinuousScanner } from 'scan-engine';
import { ContinuousOverlay, resolveIndexAtPoint } from 'scan-engine-dom';

const container = document.querySelector('.grid') as HTMLElement;
const overlay = new ContinuousOverlay(container);

const surface = {
  getItemsCount: () => items.length,
  getColumns: () => cols,
  setFocus: (indices: number[]) => highlight(indices),
  setSelected: (index: number) => flash(index),
  resolveIndexAtPoint: (x: number, y: number) => resolveIndexAtPoint(container, x, y)
};

const scanner = new ContinuousScanner(surface, configProvider, {
  onContinuousUpdate: (state) => overlay.update(state)
});

scanner.start();
```

Call `overlay.destroy()` when the overlay should be removed (for example, when switching scan modes).

## License

MIT
