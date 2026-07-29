## Why

The workout editor supports multi-selection (`selectedStepIds`, populated by
ctrl/cmd-click and by `⌘A`), and uses it to group steps into a repetition
block. But **no bulk delete has ever existed**. This is a capability gap, not a
regression — the UI briefly advertised a menu entry that was removed in wave K2
because it did nothing.

The command silently no-ops today for a structural reason. `selectedStepId`
(scalar) and `selectedStepIds` (array) are mutually exclusive by design:
`selectStep` clears the array, while `toggleStepSelection` and `selectAllSteps`
both null the scalar. A multi-selection is therefore _definitionally_
`selectedStepId === null`. Every delete path — the `onDelete` keyboard thunk and
the `canDelete` guard alike — reads only the scalar, so it resolves to `null`
and returns `false`. This is true even for a **single** toggle-selected step.

The naive fix is wrong. `deleteStepAction` reindexes the entire list after every
call, so mapping the selection to indices and looping the singular action
deletes the _wrong_ steps from the second iteration onward.

## What Changes

- Add a `deleteSteps(stepIndices)` store action that removes every addressed
  main-list step in **one** state update: one filter pass, one reindex, **one**
  history snapshot (so one `⌘Z` undoes the whole operation), and **one** grouped
  undo entry set.
- Introduce a stable `groupId` on the delete-undo trail and re-key `undoDelete`
  from `timestamp` to `groupId`. `Date.now()` is not an identity: N deletes
  inside one millisecond share a value, and `undoDelete` did
  `find(d => d.timestamp === t)` then `filter(d => d.timestamp !== t)` — it
  restored **one** entry and discarded the rest. That was silent data loss.
  `timestamp` is retained, but now serves only the TTL sweep.
- Grouped restore re-inserts items in **ascending** original-index order, so a
  non-contiguous selection lands back in the right places.
- Teach the `canDelete` guard and the `onDelete` thunk to read `selectedStepIds`,
  fixing the single-toggle-selection no-op as a side effect.
- Focus after a bulk delete uses the already-present but previously unwired
  `nextAfterMultiDelete` rule.

## Scope boundaries

- **Main-list only.** By the single-parent invariant a multi-selection is either
  all main-list or all inside one block. The nested (inside-block) path needs a
  block-scoped `deleteStepInRepetitionBlock` action, which **does not exist on
  `main`** — it lives on the unmerged branch carrying commit `fa943f55`.
  Rather than author a conflicting duplicate, the guard keeps nested
  multi-selections non-deletable, which is exactly today's behaviour (no
  regression). The block-emptying cascade required by
  `spa-editor-focus-management` therefore remains that change's responsibility.
- **Delete only, not copy.** `canCopy` is also scalar-bound, so copy is dead
  under multi-selection too. Enabling it requires a multi-step clipboard payload
  (`copyStepAction` / `pasteStepAction` both marshal exactly one step), which is
  a materially larger change with its own round-trip concerns. Left out
  deliberately; `canCut` continues to refuse multi-selections for the same
  reason.

## Impact

- Affected specs: `spa-editor-multi-delete` (new).
- Affected code: `packages/workout-spa-editor/src/store/actions/` (new
  `delete-steps-action`, re-keyed `undo-delete-action`), the store action
  surface and selectors, `editor-command-guards`, `build-clipboard-handlers`.
- Behaviour preserved: single-step delete still emits one toast per delete and
  remains independently undoable (a single delete is simply a group of one), so
  the existing `e2e/delete-undo.spec.ts` "separate notifications for multiple
  deletions" expectation — which performs two sequential _singular_ deletes —
  continues to hold unchanged.
