---
"@kaiord/workout-spa-editor": patch
---

Internal refactor: focus target state + selection history (§4 of the
`spa-editor-focus-management` proposal).

- `FocusTarget` discriminated union (`{ kind: 'item'; id: ItemId }` |
  `{ kind: 'empty-state' }`) in `src/store/focus/focus-target.types.ts`,
  with `focusItem(id)` / `focusEmptyState` constructors.
- `FocusSlice` adds `pendingFocusTarget: FocusTarget | null` plus
  `setPendingFocusTarget(target)` to the workout store. Dumb setter: no
  DOM lookup, no resolution — the hook (§7) consumes the target.
- `selectionHistory: Array<ItemId | null>` kept exactly parallel to
  `workoutHistory` so undo/redo fallback rules (§6) can restore focus
  to the item that was selected immediately before the undone mutation.
- `pushHistorySnapshot(state, uiWorkout, selection)` helper in
  `src/store/workout-store-history.ts` — the ONLY production code path
  that appends to `workoutHistory`. `createUpdateWorkoutAction` now
  routes every mid-session push through it. Dev-mode length-drift
  assert + CI invariant enforce the single-call-site rule.
- `workout-store-types.ts` split into `workout-store-state.types.ts`
  - `workout-store-actions.types.ts` to respect the repo's
    ≤80-line-per-file ESLint rule.

No consumer wiring yet — that's §6 (focus-rule helpers into mutating
actions) and §7 (`useFocusAfterAction` hook). This PR only lays the
foundation.
