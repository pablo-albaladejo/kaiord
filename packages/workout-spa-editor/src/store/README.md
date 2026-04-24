# Store

Zustand stores for global state management.

## Workout Store

`workout-store.ts` is the central store. It owns the current workout,
selection, history (undo/redo), and the focus-intent slice.

### State

- `currentWorkout: UIWorkout | null` — the in-memory workout. A
  `UIWorkout` is structurally a `KRD` plus a stable `ItemId` on every
  step and block. See `../types/ui-workout.ts`.
- `undoHistory: Array<HistoryEntry>` — undo/redo snapshots. Each entry
  is `{ workout: UIWorkout; selection: ItemId | null }`, atomically
  coupling the workout state with the selection that was active at the
  moment the snapshot was pushed. The paired shape structurally enforces
  the invariant that was previously maintained by a CI grep over two
  parallel arrays (`workoutHistory` + `selectionHistory`).
- `historyIndex: number` — current position in `undoHistory`.
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

Every append to `undoHistory` goes through
`pushHistorySnapshot(entry: HistoryEntry)` in `workout-store-history.ts`.
The 1-arg `HistoryEntry` signature enforces atomic coupling of workout +
selection by construction — parallel-array drift is structurally
impossible and requires no CI grep.

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

### FocusTelemetry observability port

`providers/focus-telemetry.ts` exports the `FocusTelemetry` function type
and `FocusTelemetryContext`. Wire a function at the `WorkoutSection`
boundary to observe focus events without coupling the hook to a specific
telemetry backend.

```tsx
// Sentry example
const onFocusEvent = useCallback((e: FocusTelemetryEvent) => {
  if (e.type === "focus-error") {
    Sentry.captureMessage(`focus-error phase=${e.phase}`, "error");
  } else {
    Sentry.addBreadcrumb({ category: "focus", message: e.type, data: e });
  }
}, []);

// Datadog RUM example
const onFocusEvent = useCallback((e: FocusTelemetryEvent) => {
  datadogRum.addAction(e.type, e);
}, []);

// Wire at WorkoutSection boundary
<FocusTelemetryContext.Provider value={onFocusEvent}>
  <WorkoutSection ... />
</FocusTelemetryContext.Provider>
```

**Stability requirement:** the wired function MUST be a stable reference
(defined outside the render tree or wrapped in `useCallback`). An inline
arrow creates a new function every render, invalidates the context value,
and causes the `FocusTelemetryContext.Provider`'s dev-mode ref-stability
guard to emit a `console.warn`.

#### Post-deploy smoke-test

Open the editor, perform a delete, and verify at least one `wiring-canary`
or mutation-driven telemetry event arrived in your monitoring dashboard
within 60 seconds. Absence indicates wiring failure.

#### Event-to-severity alert guidance

| Event                        | Expected rate                             | Suggested alert                                             | Response                                            |
| ---------------------------- | ----------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| `wiring-canary`              | One per editor mount with wired telemetry | **Absence > 30 min during editor-active hours = P3**        | Verify deployment includes telemetry provider       |
| `focus-error`                | Near zero                                 | **Any occurrence = P2 error**                               | Inspect phase field; file regression bug            |
| `unresolved-target-fallback` | Low, occasional                           | Info; **sustained ≥ 5× baseline for 6 h = P3**              | Check component unmount ordering / ref-registration |
| `form-field-short-circuit`   | Per-user, moderate (debounced)            | Debug; not pageable                                         | Statistical monitoring only                         |
| `overlay-deferred-apply`     | Per-user, moderate                        | Debug; outlier `deferredForMs ≥ 5000` may indicate UI stall | Investigate dialog-close handlers                   |

**Post-deploy missing-canary auto-alert pattern:** configure a rolling
30-minute window check — if `wiring-canary` count is zero during editor-active
hours (09:00–22:00 in `TELEMETRY_TIMEZONE`, defaults to UTC), fire a P3 alert.

**Incident ownership:** `focus-error` events in the open-source reference
deployment SHOULD result in a GitHub issue with the `incident` label assigned
to the `workout-spa-editor` CODEOWNERS.

**Desktop-AT version-drift policy:** AT evidence in
`docs/accessibility-evidence/` is valid for AT + OS + browser versions within
one major release of the pinned version. Outside that window, the quarterly
refresh cron or a dependency-bump-triggered manual refresh re-captures.

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
