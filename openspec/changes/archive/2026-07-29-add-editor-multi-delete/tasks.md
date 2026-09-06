# Tasks

## 1. Failing tests first

- [x] 1.1 Store-level test: bulk delete removes exactly the selected steps
      (fails against a `forEach(deleteStep)` loop because of the reindex).
- [x] 1.2 Store-level test: one grouped undo restores all deleted steps.
- [x] 1.3 Store-level test: a bulk delete pushes exactly one history snapshot.
- [x] 1.4 Guard test: `canDelete` is true under a populated `selectedStepIds`
      (`editor-command-guards.test.ts` previously covered `canCut` only).

## 2. Stable undo-group identity

- [x] 2.1 Add `groupId` to `DeletedStep` and to the `WorkoutState` trail type.
- [x] 2.2 Add `newDeleteGroupId()` backed by the existing `defaultIdProvider`
      (never a clock read).
- [x] 2.3 Stamp a `groupId` in `deleteStepAction` and
      `deleteRepetitionBlockAction`.
- [x] 2.4 Re-key `undoDeleteAction` from `timestamp` to `groupId`; restore the
      whole group ascending; drain the whole group from the trail.
- [x] 2.5 Update the two toast call sites to pass `groupId`.

## 3. Bulk delete action

- [x] 3.1 Add `findStepsToDelete` / `filterOutSteps` helpers (one pass each).
- [x] 3.2 Add `deleteStepsAction`: one filter, one reindex, one history
      snapshot, one undo group, focus via `nextAfterMultiDelete`.
- [x] 3.3 Thread `deleteSteps` through the action surface, store methods, the
      action type, and the step selectors.

## 4. Command wiring

- [x] 4.1 Add `selectedTopLevelStepIndices`, resolving ids to _domain_
      `stepIndex` values (not the flat array positions `findById` returns).
- [x] 4.2 Teach `canDelete` and the `onDelete` thunk to read `selectedStepIds`.

## 5. Verification

- [x] 5.1 `pnpm -r build`
- [x] 5.2 SPA `test` and `tsc -b --noEmit`
- [x] 5.3 `pnpm test:scripts`, root `pnpm lint`, `pnpm lint:specs`
- [x] 5.4 `npx playwright test --list`
