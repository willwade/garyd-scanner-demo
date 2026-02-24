# react-scan-engine

Tiny React wrapper around `scan-engine` with a familiar `react-scannable` style API.

## Install

```bash
npm install react-scan-engine scan-engine
```

## Quick start

```tsx
import React from 'react';
import { Scanner, Scannable } from 'react-scan-engine';

export function Example() {
  return (
    <Scanner active>
      <Scannable><button onClick={() => alert('A')}>A</button></Scannable>
      <Scannable><button onClick={() => alert('B')}>B</button></Scannable>
      <Scannable><button onClick={() => alert('C')}>C</button></Scannable>
    </Scanner>
  );
}
```

## Compatibility notes

- `Scanner` + `Scannable` pattern is compatible with the `react-scannable` style.
- `active` is supported.
- Default keyboard mapping:
  - `Enter` / `Space` -> `select`
  - `ArrowRight` / `ArrowDown` -> `step`
  - `Backspace` -> `reset`
  - `Escape` -> `cancel`
- Focused items get `scan-focus` and `data-scan-focused="true"`.
- Selected items briefly get `data-scan-selected="true"`.

## Why use this wrapper

You can keep React ergonomics while using the richer scan engine features from `scan-engine`:

- row/column, linear, snake, quadrant, elimination
- continuous, probability, cause/effect, color-code modes
- overscan, loop controls, configurable timing

Pass engine options through `config`:

```tsx
<Scanner
  active={isActive}
  columns={4}
  config={{
    scanPattern: 'row-column',
    scanTechnique: 'block',
    scanInputMode: 'auto',
    scanRate: 900
  }}
/>
```

## API

### `Scanner`

Props:

- `active?: boolean`
- `columns?: number`
- `config?: PartialScanConfig`
- `onSelect?: (index: number, element: HTMLElement | null) => void`
- `keyMap?: Partial<Record<string, SwitchAction>>`
- plus normal `div` props

### `Scannable`

Props:

- `children: ReactElement` (single child)
- `className?: string` (merged onto child)

