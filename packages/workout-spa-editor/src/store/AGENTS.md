<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/store/`

## Purpose

Zustand stores for editor runtime ONLY. Holds the currently-edited workout, the undo/redo stack, selection (single + multi), the focus-intent slice, the clipboard, modal state, AI runtime state, and bridge-runtime stores (`train2go-store`, garmin push transport).

**CRITICAL RULE — `state-management` in `CLAUDE.md`:** Zustand stores in this directory MUST NOT auto-persist or write through to Dexie. The mechanical guard `scripts/check-no-zustand-writethrough.mjs` enforces three rules (R-DexieImport / R-PersistStateImport / R-AppDexieImport): files under `src/store/**` must not `import "dexie"`, must not import `dexie-persistence-adapter`, and must not import the `db` singleton. Persisted reads are surfaced via `useLiveQuery`-wrapping hooks under `src/hooks/`; the store stays in-memory.

## Key Files

### Workout store (the main slice)

- `workout-store.ts` — `create<WorkoutStore>(...)` factory. Composes `createFocusSlice`, `createWorkoutMethods`, `createSelectionActions`, `createHistoryMethods`, `createRecoveryMethods`, `createModalActions`.
- `workout-state.types.ts`, `workout-store-state.types.ts`, `workout-store-types.ts`, `workout-store-actions.types.ts` — type contracts.
- `workout-store-actions.ts`, `workout-store-step-actions.ts`, `workout-store-selection-actions.ts`, `workout-store-repetition-actions.ts`, `workout-store-modal-actions.ts`, `workout-store-history.ts`, `workout-actions.ts` — domain action surfaces.
- `create-workout-method-helpers.ts`, `create-workout-method-helpers-basic.ts`, `create-workout-methods.ts` — composition helpers (one method per call so the per-file/per-function caps hold).
- `create-base-workout-actions.ts`, `create-all-step-actions.ts`, `create-all-block-actions.ts`, `create-block-action-handlers.ts`, `create-step-action-handlers.ts`, `create-workout-store-block-actions.ts`, `create-workout-store-step-actions.ts` — per-action-type factories.
- `create-history-methods.ts`, `create-recovery-methods.ts` — undo/redo + last-backup recovery wiring.
- `hydrate-ui-workout.ts` / `.test.ts` — assigns fresh `ItemId`s when loading a KRD into the store.
- `strip-ids.ts` / `.test.ts` — outbound chokepoint: removes `id` fields before any KRD crosses a boundary (Dexie write, `saveWorkout`, `exportWorkout`).
- `find-by-id.ts` / `.test.ts` — typed lookup of a step or block by `ItemId`.
- `workout-store-history.test.ts`, `workout-store-undo-history.test.ts`, `workout-store-modal-actions.test.ts`, `workout-store-recovery.test.ts`, `workout-store.test.ts`, `workout-loading-integration.test.ts`, `workout-actions.test.ts`, `selection-invariant.test.ts` — store test suite.
- `index.ts` — module export surface (unused per direct-import rule; legacy).

### Auxiliary stores (still runtime-only)

- `ai-runtime-store.ts` / `.test.ts` + `ai-store-types.ts` — in-flight AI generation state (`pendingPromptId`, `status`, error). Not persisted; persisted AI config lives in Dexie via `AiProviderRepository`.
- `clipboard-store.ts` / `.test.ts` — clipboard payload for copy/paste of steps.
- `storage-store.ts` / `.test.ts` — `StorageAvailabilityBanner` flag; written from `use-storage-probe.ts`.
- `train2go-store.ts` + `train2go-{detect,extension-read-zones,extension-transport,store-actions,send-message,ping-result,pii-redaction,detect-integration}.ts` (+ tests) — Train2Go bridge transport state.
- `garmin-extension-transport.ts` / `.test.ts` — Garmin push transport state.

## Subdirectories

- `actions/` — per-action implementations (create/delete/duplicate/paste/reorder for steps and blocks). Each action has a co-located test.
- `focus/` — `focus-slice.ts` (focus-intent state + setter) + `focus-target.types.ts` (the `FocusTarget` discriminated union).
- `focus-rules/` — five pure functions computing the focus-target after each mutation (created/deleted/multi-deleted/restored/preserved). Purity is CI-enforced: no React, DOM, or testing-library references.
- `providers/` — observability + id-provider seams (`focus-telemetry.ts`, `id-provider.ts`, `item-id.ts`).
- `selectors/` — typed selector hooks (`history-selectors`, `modal-selectors`, `repetition-block-selectors`, `selection-selectors`, `step-selectors`, `workout-selectors`, `use-context-menu-store`, `use-keyboard-store-selectors`).
- `utils/` — `block-utils.ts`.

## For AI Agents

### Working In This Directory

1. **No Dexie. No `db`. No persistence adapter.** Imports `dexie` here fail CI. Persisted state belongs to Dexie + `useLiveQuery` hooks; this store is the editor's runtime.
2. **`stripIds()` is the outbound chokepoint.** Every export, save, or Dexie-write callsite passes the `UIWorkout` through `strip-ids.ts` first. New write paths add a call.
3. **History entries are paired.** `HistoryEntry = { workout, selection }` — atomic coupling enforced by the 1-arg `pushHistorySnapshot` signature. Don't introduce parallel arrays.
4. **`pendingFocusTarget` is the focus-intent seam.** Every mutating action writes a `FocusTarget`; the `useFocusAfterAction` hook applies it in `useLayoutEffect`. See `store/README.md` for the flushSync patterns.
5. **Narrow selectors only.** Wide subscriptions (`useWorkoutStore()`) cause re-renders on every focus-intent write. Use `useWorkoutStore((s) => s.field)`.

### Testing Requirements

- Each store action has a co-located unit test.
- `selection-invariant.test.ts` pins the cross-parent multi-select invariant.
- `workout-loading-integration.test.ts` covers the hydrate path end-to-end.

### Common Patterns

- Per-action files: `<verb>-<noun>-action.ts` + `<verb>-<noun>-action.test.ts` under `actions/`.
- The composition `create-*` files in this directory wire actions into the store factory.

## Dependencies

### Internal

- `../types/{ui-workout,krd,krd-ui,workout,errors}`.
- `../lib/raw-hash` (recovery hashing).
- `@kaiord/core` (KRD types, conversion ports for export paths only).

### External

- `zustand`.
- NO `dexie`, NO `dexie-react-hooks`.

<!-- MANUAL: -->

The Zustand-only-for-runtime rule is the single biggest invariant in this directory. The mechanical guard `check-no-zustand-writethrough.mjs` is set up so adding `import "dexie"` here fails CI; do not try to disable it. If something needs to read persisted data, write a `use-<entity>-live.ts(x)` hook in `src/hooks/` and consume its output from the component, NOT from the store.
