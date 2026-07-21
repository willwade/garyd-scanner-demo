# switch-input

Framework-agnostic switch input layer for [`scan-engine`](../switch-scanner-engine).

Adapters turn DOM events into `press` / `release` calls on a port; a
`GestureEngine` turns those into semantic gestures (tap, hold, repeat) with
tremor filtering, repeat suppression, and stuck-switch quarantine.

## Why

The engine's `handleAction(action)` is one-shot — it knows nothing about
how a switch was physically activated. This package fills the gap:

- Distinguish **tap** from **hold** on a single switch (great for AAC:
  tap = select, hold = cancel).
- Stabilize noisy input with a tremor filter and post-release suppression.
- Quarantine stuck switches when a `keyup` / `pointerup` is lost (window
  blur, BLE disconnect, focused element removed).
- Test all of it deterministically with a manual scheduler.

## Install

```bash
npm install switch-input scan-engine
```

## Quick start

```ts
import { GestureEngine, KeyboardAdapter, connectToScanner } from 'switch-input';
import { LinearScanner } from 'scan-engine';

const scanner = new LinearScanner(surface, config, callbacks);
const engine = new GestureEngine();

const keyboard = new KeyboardAdapter(window, engine, {
  Space: 'primary',
  Enter: 'secondary',
});

connectToScanner(engine, scanner, {
  primary: { tap: 'select', hold: 'cancel' },
  secondary: 'step',
});

// later:
keyboard.detach();
engine.dispose();
```

## Gestures

| Event          | Fires when                                                                |
| -------------- | ------------------------------------------------------------------------- |
| `press`        | Switch physically pressed.                                                |
| `release`      | Switch physically released (or force-released).                           |
| `tap`          | Press + release within `tapWindowMs`.                                     |
| `hold`         | Switch held past `holdThresholdMs`.                                       |
| `hold-release` | Switch released after a `hold` already fired.                             |
| `repeat`       | While held, every `repeatIntervalMs` after the first hold.                |
| `stuck`        | Switch held past `stuckTimeoutMs`; engine force-released it.              |
| `quarantine`   | A source disconnected while a switch was pressed; awaiting real release.  |
| `recover`      | The real release for a quarantined switch finally arrived.                |

## Adapters

- **`KeyboardAdapter`** — DOM `KeyboardEvent` → `press` / `release`. Uses
  `event.code` (physical key). Ignores OS auto-repeat. Force-releases on
  window blur.
- **`PointerAdapter`** — DOM `PointerEvent` (mouse, touch, pen) on a single
  element → `press` / `release`. One element owns one switch.

Write your own adapter by calling `port.press(id)` / `port.release(id)` —
anything that reduces to those two calls works.

## Testing

```ts
import { createManualGestureEngine } from 'switch-input';

const { engine, clock } = createManualGestureEngine({
  tapWindowMs: 100,
  holdThresholdMs: 200,
});

const taps: string[] = [];
engine.on('tap', (e) => taps.push(e.switchId));

engine.press('primary');
clock.advanceBy(50);
engine.release('primary');
expect(taps).toEqual(['primary']);
```

## License

MIT
