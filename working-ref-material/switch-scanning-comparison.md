# `@shayc/switch-scanning` vs our `scan-engine` — findings

Comparison done 2026-07-21 against `@shayc/switch-scanning` v0.1.1 cloned to `C:\github\switch-scanning`.

## TL;DR

Neither library is strictly "better." Different optimization targets.

- **`@shayc/switch-scanning`** is a small, opinionated, well-typed SDK with **4 timing methods** (auto / step / dwell / inverse) and a tight, deterministic core. ~5,500 LOC of source, ~3,800 LOC of tests. Zero runtime deps. React is an optional peer.
- **`scan-engine`** is a broader traversal catalog (RowColumn, ColumnRow, Linear, Snake, Quadrant, Group, Elimination, Continuous ×3 techniques, Probability, CauseEffect, ColorCode) plus PPM prediction, critical overscan, heatmap/cost visualization, OBF board support, audio, URL params. ~2,500 LOC in the engine package; the root app adds ~15 more modules (SettingsUI, GridRenderer, AudioManager, SwitchScannerElement web component, ScanSettingsAdvisor).

Their SDK surface is cleaner. Our feature surface is broader.

## What they have that we lack (worth cherry-picking)

### High-value, low-risk SDK gaps

1. **Injectable clock / scheduler.** Our `Scanner.ts:116` calls `window.setTimeout` directly. Their timing flows through a `Clock` + `Scheduler` port (`src/core/shared/clock.ts:43,82`), so the entire engine is deterministic in tests without `vi.useFakeTimers()`. Also unblocks SSR.
2. **A public testing entry (`scan-engine/testing`).** Theirs ships `createTestScanner` + `manualClock` + `recordScannerEvents` + `ScannerFixture` (`src/core/testing/index.ts:126`). We have `packages/switch-scanner-engine/src/scanners/test-utils.ts` but it is not exported from the package, and our tests rely on vitest fake timers.
3. **Snapshot + event channels on the engine.** Today we expose only 4 callbacks (`ScanCallbacks` in `types.ts:81-86`). They expose `getSnapshot()` / `subscribe(cb)` for render-state and `observe(listener)` for feedback (`src/core/types.ts:233-258`). Consumers can't currently read `status` / `highlight` / `pass` / `pending` without rolling their own. Pair with `useSyncExternalStore` in React for scoped re-renders.
4. **Modernize `react-scan-engine`.** `<Scannable>` clones a single child via `cloneElement` (`src/index.tsx:292-315`). Their `useScanTarget()` returns props to spread on any element — works with portals, fragments, third-party components that don't forward refs. Keep `<Scannable>` as a thin convenience, but expose a hook.
5. **Method constructors as data.** `react-scan-engine/src/index.tsx:107-129` does an `if/switch` over `scanMode` + `scanPattern` strings. They validate eagerly at construction (`src/core/methods/methods.ts:105-146`). Our strategies are classes — that's fine — but exposing `rowColumn()`, `linear()`, `elimination({ switches: 4 })`, `continuous({ technique: 'crosshair' })` as validated frozen factories would tighten the consumer API.

### Medium-value

6. **Advanced React entry** (`react-scan-engine/advanced`) — externally-owned scanner, custom DOM host, custom event target. Today's `<Scanner>` owns everything; no way to share one scanner across boundaries.
7. **Ship `styles.css`.** We already write `data-scan-focused` / `data-scan-selected` attributes. Their 40-line stylesheet uses CSS custom properties (`--scan-outline-*`) and is `forced-colors`-aware.
8. **Gesture recognition in the SDK.** Their `ScannerInputPort` (`press` / `release` / `disconnect` / `suspend`) + tap/hold engine with tremor filtering, repeat suppression, stuck-switch quarantine. We have `SwitchInput.ts` at the **app** layer — promote it to a package so SDK consumers get it.
9. **Diagnostic event codes.** They codify 8 stable `ScannerDiagnosticCode` strings. We have ad-hoc `console.warn`. Codifying makes consumer telemetry possible.

### Playground (their demo is the reference)

Their demo is a two-column workbench (`demo/App.tsx:95`): left = preview + event log (Events/State tabs), right = controls panel (`ControlsPanel.tsx`). Killer features:

- **Live `setOptions` without restarting the scan** — config changes flow through `Scanner.setOptions(...)` mid-session (`ControlsPanel.tsx:30-34`). Our `SettingsUI` rebuilds the scanner on changes.
- **Event inspector** — newest-first list of every `ScannerEvent` with prose descriptions (`EventLog.tsx:201`). Developers integrating the lib love this.
- **Runtime controls surface** (Start/Pause/Resume/Restart/Stop) reading from snapshot slices via `useScannerCommands()`.
- **Method radio-cards with per-method metadata** (label, switch count, mapped keys) from `methodMeta.ts`.

Our root app is richer (heatmap, cost numbers, audio, OBF boards, URL params, web component) — keep all that. The lift is the **workbench shell around it**.

## What we should NOT copy

- Don't collapse our strategy catalog to "4 methods." Our breadth (elimination, color-code, PPM prediction, continuous ×3, critical overscan) is the differentiator and is clinically motivated.
- Don't drop the visual debug tools or the `.obz`/OBF support — they're research features they don't have.

## Our strengths (they lack)

- 11 scan strategies vs their 4 timing methods.
- Predictive scanning via PPM (`@willwade/ppmpredictor`).
- Critical overscan, color-code mode, cause-effect, elimination scanning.
- Continuous scanning with 3 sub-techniques + dedicated `scan-engine-dom` overlay package.
- Visual debug tools: cost numbers, cost heatmap.
- URL-parameter configuration for embedding.
- Web Component (`SwitchScannerElement`) + OBF `.obz` board format support.
- Built-in audio feedback manager.
- `ScanSettingsAdvisor` — clinical heuristic helper.

## Picked three to do first

1. Injectable clock + public `scan-engine/testing` entry with `createTestScanner`.
2. Snapshot/event channels on `Scanner` + a `useScanTarget()` hook in `react-scan-engine` (keep `<Scannable>` as sugar).
3. Playground workbench: live `setOptions`, event log, runtime controls.

These three compound: the clock enables deterministic tests; the snapshot/event channels power both the React hook and the playground's event log + state inspector; the workbench surfaces all of it.
