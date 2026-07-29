## Why

Deleting a step from inside a repetition block destroyed a different,
top-level step — silent data loss on content the user never touched,
while the step they aimed at survived.

`StepList` addresses a nested step by its position **within the block's
own array** (`onRemoveStep(index)`), but that callback was wired
straight through to the top-level `deleteStep` store action, which
resolves its argument against `workout.steps` by the `stepIndex`
**field** and never descends into blocks. Clicking the trash on the 2nd
step of a block therefore deleted whichever top-level step had
`stepIndex === 1`. Two different index domains met at one callback, with
no type-level distinction between them.

The sibling duplicate affordance reads from the same block-local index
domain but was already block-scoped — its handler substitutes the block
id before reaching the store — so it never had this defect. Delete was
the one path that skipped that substitution.

Separately, the route announcer (`role="status" aria-live="polite"`)
rendered inside `#root` interacts badly with modal dialogs.
`aria-hidden`'s `hideOthers` — used by Radix `Dialog` — deliberately
exempts `[aria-live]` nodes _and their entire ancestor chain_, so `#root`
was spared and the hide fell onto its children instead of covering the
app subtree with one attribute.

## What Changes

- Add a block-scoped `deleteStepInRepetitionBlock(blockId, stepIndex)`
  store action that resolves the block by id and the step by its
  block-local position, mirroring the existing
  `duplicateStepInRepetitionBlock` idiom.
- Rewire the nested trash affordance to that action. The block-render
  path no longer receives the main-list `onStepDelete` at all, so the
  two index domains can no longer be confused.
- Emptying a block cascades: the parent block is removed in the same
  state update, as already required by `spa-editor-focus-management`
  ("Delete of only step inside repetition block").
- Nested deletes do **not** write the `deletedSteps` undo trail —
  `undoDeleteAction` splices restored entries into the top-level step
  list, so a nested entry would be resurrected in the wrong parent.
  Undo is served by the existing `undoHistory` snapshot, consistent with
  every other in-block mutation. The nested delete is therefore bound to
  the raw store action rather than `useDeleteStepWithToast`, which reads
  that trail and would otherwise surface a stale undo toast for an
  unrelated earlier deletion.
- Portal the route announcer to `document.body` so it becomes a sibling
  of `#root` rather than a descendant, restoring the intended
  root-level `aria-hidden` cover. The node is `sr-only` and
  position-independent, so the change is visually inert.

## Capabilities

### New Capabilities

- `spa-editor-block-step-editing`: how step mutations inside a
  repetition block are addressed (block id + block-local index), the
  empty-block cascade, and the undo channel they use.

### Modified Capabilities

- `spa-routing`: adds a placement constraint on the route announcer so
  modal `aria-hidden` covers the application root.

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No
  domain, adapter, port, schema or public-API change; no dependency
  change and no Dexie migration. Private package, so no changeset.
- **Store**: one new action file plus its registration through the
  existing block-action factory layers and the `WorkoutStoreActions`
  type; one new selector.
- **Components**: `onDeleteStepInRepetitionBlock` threaded down the
  existing `WorkoutList` prop chain; `onStepDelete` removed from the
  repetition-block render props.
- **Behaviour change**: a zero-step block is schema-valid
  (`repetitionBlockSchema.steps` has no `min(1)`), so leaving one would
  have been defensible — but `spa-editor-focus-management` already
  mandates the cascade, which this change now actually implements.
- **Tests**: a store-through-component regression test (the defect lived
  in the wiring, so a store-only test cannot observe it) plus
  accessibility assertions that background controls leave the
  accessibility tree while a dialog is open.
