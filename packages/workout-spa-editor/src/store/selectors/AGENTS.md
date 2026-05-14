<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/store/selectors/`

## Purpose

Typed selector functions for the workout store. Centralises narrow-selector subscriptions so consumers can `useWorkoutStore(selectCurrentWorkout)` instead of inlining selectors at the call site (which would either re-render too widely or repeat the selector body).

## Key Files

- `workout-selectors.ts` — `selectCurrentWorkout`, top-level state reads.
- `step-selectors.ts` — read steps by id, by index, by parent.
- `repetition-block-selectors.ts` — read blocks by id.
- `selection-selectors.ts` — selected ids + helpers.
- `history-selectors.ts` — undo/redo availability.
- `modal-selectors.ts` — `isModalOpen`, `modalConfig`.
- `use-context-menu-store.ts` — selector hook for the editor context-menu state.
- `use-keyboard-store-selectors.ts` — selectors used by the keyboard-shortcut hooks.
- `index.ts` — module export surface.

## For AI Agents

### Working In This Directory

1. **Selectors are pure `(state) => derived` functions** — no hooks here except the explicit `useXxxStore` hook wrappers.
2. **One slice per file.** Don't bundle selectors from multiple slices.

### Testing Requirements

- Selectors are exercised indirectly via consumer tests.

## Dependencies

### Internal

- `../workout-store-types`, `../workout-state.types`.

<!-- MANUAL: -->
