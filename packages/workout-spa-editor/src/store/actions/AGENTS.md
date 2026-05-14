<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/store/actions/`

## Purpose

One file per workout-mutation action. Each action is a pure function that takes the current `WorkoutState` (or just `currentWorkout`) and returns the next state, leaving the caller (the store factory) to wire it into Zustand `set`. Co-located tests pin every action's behavior; the focus-intent for each mutation is asserted in `creation-focus-intent.test.ts` and `delete-focus-intent.test.ts`.

## Key Files

### Step actions

- `create-step-action.ts` — append a new step at the end of the main list.
- `copy-step-action.ts` / `.test.ts` — copy a step to the clipboard (does not mutate the workout).
- `paste-step-action.ts` / `.test.ts` + `paste-step-helpers.ts` + `paste-step-validators.ts` — paste from clipboard, validating compatibility.
- `duplicate-step-action.ts` / `.test.ts` — clone in place.
- `duplicate-step-in-repetition-block-action.ts` — clone inside a block.
- `delete-step-action.ts` / `.test.ts` + `delete-step-helpers.ts` — delete with focus-target via `nextAfterDelete`.
- `undo-delete-action.ts` / `.test.ts` — restore a step popped from `deletedSteps`.
- `reorder-step-action.ts` / `.test.ts` (+ `.test-fixtures.ts`) — main-list reorder.
- `reorder-steps-in-block-action.ts` / `.test.ts` — within-block reorder.
- `recalculate-step-indices.ts` — re-numbers `stepIndex` after any mutation.

### Block actions

- `create-empty-repetition-block-action.ts` / `.test.ts` — insert an empty block.
- `create-repetition-block-action.ts` / `.test.ts` (+ `.test-fixtures.ts`) — wrap selected steps in a block.
- `add-step-to-repetition-block-action.ts` — append a step to an existing block.
- `edit-repetition-block-action.ts` — patch a block's metadata (e.g. `repeatCount`).
- `delete-repetition-block-action.ts` / `.test.ts` — delete a block (cascade to children).
- `ungroup-repetition-block-action.ts` / `.test.ts` — unwrap a block into its children.
- `repetition-block-helpers.ts` — shared helpers.

### Cross-cutting

- `clear-expired-deletes-action.ts` / `.test.ts` (+ `.test-fixtures.ts`) — purges `deletedSteps` entries past their TTL.
- `history-actions.ts` — undo/redo action functions (kept here so the focus-rule wiring is co-located).
- `error-recovery-actions.ts` / `.test.ts` — `safeMode` + restore-from-`lastBackup` flow.
- `item-id-assignment.test.ts`, `block-id-stability.test.ts` — invariants pinned by tests rather than runtime code.
- `block-operations-integration.test.ts`, `copy-paste-integration.test.ts` (+ `.test-fixtures.ts`), `copy-paste-performance.test.ts`, `performance.test.ts`, `creation-focus-intent.test.ts`, `delete-focus-intent.test.ts` — integration and focus-rule tests.

## Subdirectories

- `_helpers/` — shared low-level utilities (`build-krd-with-workout`, `extract-workout`, `replace-block-at-position`). The leading underscore signals "private to actions/."

## For AI Agents

### Working In This Directory

1. **Each action is a pure function.** No `set` calls here — the action returns the next state; the store factory in `../create-*` files passes it to Zustand `set`.
2. **Every mutation writes `pendingFocusTarget`** via one of the helpers in `../focus-rules/` (created/deleted/preserved/restored). New actions choose the rule that matches their semantics.
3. **`stepIndex` is recomputed on every shape change** via `recalculate-step-indices.ts`.
4. **Tests live next to the action.** Integration tests cover cross-action interactions.

### Testing Requirements

- AAA pattern, `should ` titles.
- Pin every focus-target outcome (covered by `creation-focus-intent.test.ts` and `delete-focus-intent.test.ts`).

### Common Patterns

- Block actions delegate to step actions for child-step mutations; new block flows reuse `_helpers/replace-block-at-position` rather than reimplementing block-array splicing.

## Dependencies

### Internal

- `../../types/ui-workout`, `../../types/krd-ui`, `../../types/krd-guards`.
- `../focus-rules/*`.

<!-- MANUAL: -->
