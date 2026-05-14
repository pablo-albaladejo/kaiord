<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/store/focus/`

## Purpose

The focus-intent slice composed into the workout store. Owns `pendingFocusTarget: FocusTarget | null` plus its setter, and the `FocusTarget` discriminated union type used everywhere the editor needs to redirect DOM focus after a mutation.

## Key Files

- `focus-slice.ts` / `.test.ts` — `createFocusSlice(set)` factory composed into `workout-store.ts`.
- `focus-target.types.ts` / `.test.ts` — `FocusTarget` union (`{ kind: 'item', id }`, `{ kind: 'empty-state' }`, etc.) + type guards.

## For AI Agents

### Working In This Directory

1. **Slice is intentionally minimal.** The interesting logic — what target a mutation should write — lives in `../focus-rules/`, not here.
2. **Every setter call returns a fresh object reference** so narrow-selector subscribers re-render exactly when the target changes.

### Testing Requirements

- The slice tests cover read-after-write semantics; the `focus-rules/` tests cover the mutation→target mapping.

## Dependencies

### Internal

- `../../types/ui-workout`.

<!-- MANUAL: -->
