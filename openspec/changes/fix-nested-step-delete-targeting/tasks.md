## 1. Reproduce the data loss

- [x] 1.1 Write `WorkoutList.nested-delete.test.tsx` driving the real store through the real component tree — a store-only test cannot observe this defect, because `deleteStepAction` is correct for its own contract and the fault is in the wiring.
- [x] 1.2 Confirm it fails on the unmodified tree: deleting the 2nd nested step destroys the top-level step with `stepIndex === 1` while the targeted nested step survives.

## 2. Block-scoped delete action

- [x] 2.1 Create `store/actions/delete-step-in-repetition-block-action.ts`: resolve the block by id, bounds-check the block-local index, drop the step, reindex the block's steps.
- [x] 2.2 Cascade — when the block empties, remove the block and reindex top-level `stepIndex` values (`spa-editor-focus-management`).
- [x] 2.3 Focus intent — reuse `nextAfterDelete`, passing `parentBlockId` for the in-block case and the block's main-list position for the cascade case. The rule already supported `parentBlockId`; no caller had ever used it.
- [x] 2.4 Deliberately skip the `deletedSteps` trail (`undoDeleteAction` restores into the top-level list); clear selection only on cascade, mirroring `deleteRepetitionBlockAction`.

## 3. Store registration

- [x] 3.1 Register through the existing block-action factory layers: `workout-store-repetition-actions`, `create-block-action-handlers`, `create-workout-store-block-actions`, `create-all-block-actions`, `workout-store-actions`, `create-workout-method-helpers`.
- [x] 3.2 Add `deleteStepInRepetitionBlock` to `WorkoutStoreActions` and a `useDeleteStepInRepetitionBlock` selector.

## 4. Rewire the nested trash affordance

- [x] 4.1 Thread `onDeleteStepInRepetitionBlock` down the `WorkoutList` prop chain.
- [x] 4.2 Bind the nested delete in `render-repetition-block.tsx` and remove `onStepDelete` from `RenderRepetitionBlockProps`, so a block-local index can no longer reach the main-list action.
- [x] 4.3 Bind the raw store action in `use-repetition-block-handlers` — not `useDeleteStepWithToast`, which reads the `deletedSteps` trail and would surface a stale undo toast.

## 5. Verify the sibling path

- [x] 5.1 Confirm `onDuplicateStep` does **not** share the defect: its handler substitutes the block id before reaching the store. Pinned with a test.

## 6. Route announcer placement

- [x] 6.1 Verify the mechanism against the installed `aria-hidden@1.2.6` source: `hideOthers` pushes `[aria-live]` nodes into `targets` and `keep()` walks their ancestors.
- [x] 6.2 Portal the announcer to `document.body` in `MainLayout`, preserving role/live/atomic attributes and the test hook.
- [x] 6.3 Add outcome-based accessibility assertions to `ConfirmationModal.accessibility.test.tsx` (background controls unreachable by role), rather than asserting which node carries `aria-hidden`.

## 7. Gates

- [x] 7.1 `pnpm --filter @kaiord/workout-spa-editor test`
- [x] 7.2 `pnpm -r build`
- [x] 7.3 `pnpm --filter @kaiord/workout-spa-editor lint`
- [x] 7.4 `pnpm test:scripts` and `pnpm lint` at the root
