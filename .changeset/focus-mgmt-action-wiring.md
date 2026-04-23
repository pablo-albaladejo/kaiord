---
"@kaiord/workout-spa-editor": patch
---

Focus management: wire store actions to focus-rule helpers (§6),
enforce single-parent multi-selection invariant (§8.8), and document
the store in `src/store/README.md` (§10).

**§6 — action wiring.** Every state-mutating action now writes a
`pendingFocusTarget` alongside the new workout snapshot:

- **Delete** (`deleteStep`, `deleteRepetitionBlock`) →
  `nextAfterDelete({ workout, deletedIndex })` — next-sibling /
  previous-sibling / empty-state.
- **Creation** (`createStep`, `duplicateStep`,
  `createEmptyRepetitionBlock`, `addStepToRepetitionBlock`,
  `duplicateStepInRepetitionBlock`, `createRepetitionBlock`,
  `pasteStep`) → `createdItemTarget(newId)`. `pasteStep` focuses the
  freshly-regenerated id, never the clipboard-supplied one.
- **Ungroup** → focus the first extracted child.
- **Clear** → `null`.
- **Undo delete** → `restoredAfterUndoTarget(workout, restoredId)`.
- **Undo/redo** → `preservedSelectionTarget(snapshot, priorSelection,
index)`, reading the parallel `selectionHistory` slice.
- **Reorder** (`reorderStep`, `reorderStepsInBlock`) →
  `createdItemTarget(movedId)` to keep focus on the dragged item.

`PasteStepResult` exposes a `pastedItemId` field so the store reducer
can set focus without re-walking the workout.

**§8.8 — single-parent multi-selection invariant.** A selection cannot
span the main list and the inside of a repetition block, nor span two
different blocks. `toggleStepSelection` now _replaces_ the selection
(rather than extending it) when a toggle would violate that invariant;
`selectAllSteps` filters to the subset that shares the first id's
parent. Covered by 7 new tests in `selection-invariant.test.ts`.

**§10 — store README.** `packages/workout-spa-editor/src/store/README.md`
documents the runtime state slices (workout / history / focus /
clipboard / selection), the action surface, the `pushHistorySnapshot`
and `stripIds` chokepoints, the pure focus-rule helpers, and the
narrow-selector discipline consumers must follow to avoid coupling to
full `WorkoutStore` shape.

Deferred to follow-up PRs: §7 focus hook + registry + overlay
observer, and §8.1–§8.5 component integration that depends on §7.
