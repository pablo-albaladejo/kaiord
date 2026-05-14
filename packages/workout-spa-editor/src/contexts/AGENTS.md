<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/contexts/`

## Purpose

React contexts that scope shared runtime state across the tree. Used for cross-cutting concerns that are NOT persisted (theme, analytics, the persistence handle itself, dialog visibility, bridge state, focus-registry).

## Key Files

- `analytics-context.tsx` / `.test.tsx` — `AnalyticsProvider` (composed at the root by `main.tsx`) and the `useAnalytics()` consumer hook.
- `persistence-context.tsx` — `PersistenceProvider` (carries the `PersistencePort` instance) and `usePersistence()`. The seam that lets tests inject an in-memory port.
- `ThemeContext.tsx` / `.test.tsx` + `theme-utils.ts` + `useThemeProvider.ts` — light/dark theme. Exposes `ThemeProvider`, `useTheme()`, and `Theme`/`ResolvedTheme` types.
- `ToastContext.tsx` — the Radix Toast viewport wiring.
- `settings-dialog-context.tsx` / `.test.tsx` — global "open settings" intent (set from the header → consumed by the Settings dialog).
- `garmin-bridge-context.tsx` / `.test.tsx` + `garmin-bridge-types.ts` — Garmin bridge runtime state (`GarminBridgeState`, `PushState`).
- `coaching-registry-context.tsx` + `coaching-registry-bootstrap.tsx` / `.test.tsx` — the coaching-registry React seam; bootstrap component wires the singleton into the tree.
- `focus-registry-context.tsx` / `.test.tsx` — the focus-registration store (which DOM elements claim which `ItemId`s).
- `focus-telemetry-context.tsx` / `.test.tsx` — re-exports the telemetry context from `store/providers` and provides a no-op default.
- `train2go-zones-sync-context.tsx` — zones-sync orchestration state.
- `index.ts` — module export surface for the most-used providers (`AnalyticsProvider`, `GarminBridgeProvider`, `SettingsDialogProvider`, `ThemeProvider` + `useTheme`).

## For AI Agents

### Working In This Directory

1. **Contexts hold transient runtime state**, never persisted data. Persisted-data reads go through Dexie + `useLiveQuery` hooks; this directory is for things like the active theme, the bridge handle, or the analytics instance.
2. **Provider composition order matters.** `main.tsx` wires analytics → persistence → theme → settings → garmin-bridge → coaching-registry → router. Don't reorder without checking each `useX()` consumer's expectations.
3. **Custom-hook export pattern.** Each provider exports both `<Provider>` and `useX()`. The hook throws if used outside the provider — this is the seam tests rely on for error-path coverage.

### Testing Requirements

- Each context has a `.test.tsx` that asserts (a) value propagation through the tree and (b) the "used outside provider" error.

### Common Patterns

- Type alias separate from the runtime constant (e.g. `Theme` vs `ThemeProvider`).
- Re-exported through `index.ts` for ergonomic root-level imports.

## Dependencies

### Internal

- `../ports/persistence-port` (carried by `PersistenceProvider`).
- `../store/providers/focus-telemetry`.
- `@kaiord/core` (`Analytics` type).

### External

- `react`.

<!-- MANUAL: -->

Contexts here are the "shared runtime" tier. Reach for one only when prop drilling becomes painful at depth-3 or more AND the data is not persisted.
