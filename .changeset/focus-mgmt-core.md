---
"@kaiord/workout-spa-editor": patch
---

Internal refactor: focus state, rules, and action wiring (focus-management core).

- Add `pendingFocusTarget: FocusTarget | null` to the workout store via a
  composable `FocusSlice` (state + `setPendingFocusTarget` action).
- Track a `selectionHistory` parallel to `workoutHistory`, routed through a
  single `pushHistorySnapshot(uiWorkout, selection, state)` chokepoint so
  snapshot length invariants stay enforceable.
- Ship pure per-action focus-rule helpers under `src/store/focus-rules/`
  (one function per file, no React/DOM dependencies): `nextAfterDelete`,
  `nextAfterMultiDelete`, `createdItemTarget`, `restoredAfterUndoTarget`,
  `preservedSelectionTarget`.
- Wire every mutating store action (delete, paste, create, duplicate,
  group, ungroup, undo, redo, undo-delete, reorder) to set
  `pendingFocusTarget` using the rule helpers.
- Add two CI invariants in `.github/workflows/ci.yml`: focus-rules purity
  grep, and `workoutHistory.push` confined to `workout-store-history.ts`.

No user-visible behavior change yet: the context/hook that consumes
`pendingFocusTarget` and drives DOM focus lands in a follow-up PR.
