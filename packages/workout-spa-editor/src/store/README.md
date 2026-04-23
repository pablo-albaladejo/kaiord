# Store

Zustand stores for global state management.

## Workout Store

`workout-store.ts` is the central store. It owns the current workout,
selection, history (undo/redo), and the focus-intent slice.

### State

- `currentWorkout: UIWorkout | null` — the in-memory workout. A
  `UIWorkout` is structurally a `KRD` plus a stable `ItemId` on every
  step and block. See `../types/ui-workout.ts`.
- `workoutHistory: Array<UIWorkout>` — undo/redo snapshots.
- `historyIndex: number` — current position in `workoutHistory`.
- `selectionHistory: Array<string | null>` — parallel to
  `workoutHistory`; each entry is the `selectedStepId` at the moment
  the matching snapshot was pushed. Used by undo-of-add/paste/duplicate
  to restore focus to the item that was selected just before the undone
  mutation.
- `selectedStepId: string | null`, `selectedStepIds: Array<string>` —
  single- and multi-selection.
- `pendingFocusTarget: FocusTarget | null` — focus intent written by
  mutating actions. A hook (`useFocusAfterAction`, §7) reads it after
  each React commit and moves DOM focus accordingly.
- `isEditing`, `safeMode`, `lastBackup`, `deletedSteps`, `isModalOpen`,
  `modalConfig`, `createBlockDialogOpen` — misc UI slots.

### Actions

- `loadWorkout(krd)` / `createEmptyWorkout(name, sport)` / `clearWorkout()`
  — reset the store. Hydrate assigns fresh `ItemId`s on every load.
- `updateWorkout(uiWorkout)` — mid-session mutation push (preserves ids).
- `setPendingFocusTarget(target)` — dumb setter for the focus slice.
- `createStep` / `duplicateStep` / `pasteStep` / `addStepToRepetitionBlock`
  / `duplicateStepInRepetitionBlock` / `createRepetitionBlock`
  / `createEmptyRepetitionBlock` — produce new items with fresh
  `ItemId`s, set `pendingFocusTarget = createdItemTarget(newId)`.
- `deleteStep` / `deleteRepetitionBlock` — set `pendingFocusTarget` via
  `nextAfterDelete` (next sibling, previous sibling, empty-state, or
  block-cascade anchor).
- `undoDelete` — set `pendingFocusTarget` via `restoredAfterUndoTarget`.
- `undo` / `redo` — set `pendingFocusTarget` via
  `preservedSelectionTarget`, reading the parallel `selectionHistory`.
- `reorderStep` / `reorderStepsInBlock` — set `pendingFocusTarget` to
  the moved item's own id (stable across the reorder).
- `editRepetitionBlock` — leaves `pendingFocusTarget` untouched.
- `toggleStepSelection` / `selectAllSteps` — enforce the single-parent
  invariant: a multi-selection cannot span the main list and the
  inside of a block (cross-parent toggles replace rather than extend).

### History chokepoint

Every append to `workoutHistory` goes through
`pushHistorySnapshot(state, uiWorkout, selection)` in
`workout-store-history.ts`. The helper keeps `workoutHistory` and
`selectionHistory` parallel by construction (drift is structurally
impossible). A CI focus-invariant grep rejects any
`workoutHistory.push` / `.unshift` / `.splice` / `...slice, x` outside
that helper.

### Outbound ID chokepoint

`stripIds(uiWorkout): KRD` in `strip-ids.ts` removes `id` fields from
every step and block before the workout crosses a boundary. Every
Dexie write path, `saveWorkout`, and `exportWorkout` pass through it.
Direct calls to `@kaiord/core` conversion ports do the same.

### Focus-rule helpers

`focus-rules/` holds five pure functions (one per file) that compute
what `pendingFocusTarget` should be after each mutation:

- `createdItemTarget(id)` — newly-created items.
- `nextAfterDelete({ workout, deletedIndex, parentBlockId? })` —
  single-delete rules (main-list + block-child, cascade anchor).
- `nextAfterMultiDelete({ workout, deletedIndices })` — multi-select.
- `restoredAfterUndoTarget(workout, id)` — undo of delete.
- `preservedSelectionTarget(workout, priorSelection, fallbackIndex)` —
  undo of add/paste/duplicate and redo traversal.

Purity is CI-enforced: no `react`, `react-dom`, `@testing-library`,
`document.`, `window.`, or `HTMLElement` references allowed under
`focus-rules/`.

### Narrow-selector discipline

Every `setPendingFocusTarget({ kind: 'item', id })` produces a fresh
object reference, so any consumer subscribed with a wide selector
(`useWorkoutStore()` / `useWorkoutStore(s => s)`) would re-render on
every focus-intent write. Subscribe narrowly:

```ts
const target = useWorkoutStore((s) => s.pendingFocusTarget);
```

A CI grep check in §10.3.a will pin this discipline once the hook
consumer (§7) lands.

### flushSync patterns for focus continuations

`useFocusAfterAction` runs inside `useLayoutEffect`, so any mutation
that _also_ needs to read committed workout state on the same task
must first push React through a paint. Three canonical patterns
cover the call sites this repo uses:

**1. Paste-then-continuation.** The pasted item exists only after
commit; a continuation that needs its id (e.g. opening an inline
editor) must wait for commit:

```ts
import { flushSync } from "react-dom";

flushSync(() => {
  // Writes `pendingFocusTarget = createdItemTarget(newId)` and
  // updates `currentWorkout` in one setState.
  pasteStep();
});
// `currentWorkout` has the new step; `useFocusAfterAction` has
// already focused it. Safe to read ids and open an editor.
const newId = readLastStepId();
openInlineEditorFor(newId);
```

**2. Delete-then-continuation.** After a delete, the caller may need
to know the next-focused item (for example, to drag it into view
without waiting for the focus hook's own scroll). Wrap the mutation:

```ts
flushSync(() => {
  deleteStep(arrayIndex);
});
// `pendingFocusTarget` has been cleared by the hook. Read the new
// active element synchronously.
const fallback = document.activeElement;
```

**3. Paste-inside-dialog continuation.** When a dialog is open the
hook _stashes_ the target and re-applies it one animation frame
after the dialog closes. If a button inside the dialog wants to
close the dialog AND then commit a paste, the paste must be
committed first so the stashed target is the paste's item:

```ts
flushSync(() => {
  pasteStep(); // writes pendingFocusTarget (will be stashed)
});
setDialogOpen(false); // overlay close re-applies the stashed target
```

Every production `flushSync` call site in this store carries a
comment like `// §7.9 pattern #1` so readers can jump straight to
the relevant pattern.

## AI Store

`ai-store.ts` holds AI-provider config. It's independent from the
workout store and is persisted to Dexie via `ai-store-persistence`.

## Library Store

`library-store/` holds the saved-workouts library with Dexie
persistence. `stripIds` runs on every write path.

## Profile Store

`profile-store/` holds the active sport profile and its sport-zone
overrides.
