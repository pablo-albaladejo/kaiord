# Implementation Plan - Remove Delete Step Modal

## Task List

- [ ] 1. Remove DeleteConfirmDialog component
  - Delete `packages/workout-spa-editor/src/components/molecules/DeleteConfirmDialog/` directory
  - Remove all files: `DeleteConfirmDialog.tsx`, `DeleteConfirmDialog.test.tsx`, `DeleteConfirmDialog.stories.tsx`, `index.ts`
  - _Requirements: 2.1, 2.5_

- [ ] 2. Remove useDeleteHandlers hook
  - Delete `packages/workout-spa-editor/src/components/pages/WorkoutSection/useDeleteHandlers.tsx`
  - _Requirements: 2.2, 2.3, 2.4_

- [ ] 3. Update useWorkoutSectionHandlers hook
  - Remove `useDeleteHandlers` import
  - Remove `deleteHandlers` variable
  - Remove spreading of `deleteHandlers` in return statement
  - _Requirements: 2.2, 2.4_

- [ ] 4. Update useWorkoutSectionState hook
  - Add `useDeleteStep` import from store selectors
  - Add `deleteStep` variable using the hook
  - Return `deleteStep` directly instead of delete handlers
  - Remove `stepToDelete`, `handleDeleteRequest`, `handleDeleteConfirm`, `handleDeleteCancel` from return
  - _Requirements: 2.3, 2.4, 3.1_

- [ ] 5. Update WorkoutSection component
  - Remove `DeleteConfirmDialog` import
  - Remove `DeleteConfirmDialog` JSX element
  - Update `WorkoutStepsList` to pass `deleteStep` directly to `onStepDelete` prop
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 6. Verify deletion flow works correctly
  - Test that clicking delete button removes step immediately
  - Test that undo toast appears after deletion
  - Test that undo button restores the step
  - Test that deletion works inside repetition blocks
  - _Requirements: 1.1, 1.2, 1.3, 3.2, 3.3, 3.4, 3.5_

- [ ] 7. Update unit tests for WorkoutSection
  - Remove tests that verify modal appears on delete request
  - Add test: "should delete step immediately without modal"
  - Add test: "should show undo toast after deletion"
  - Add test: "should restore step when undo is clicked"
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 8. Update unit tests for useWorkoutSectionState
  - Remove tests for `stepToDelete`, `handleDeleteRequest`, `handleDeleteConfirm`, `handleDeleteCancel`
  - Add test: "should return deleteStep function from store"
  - Add test: "should call deleteStep with correct step index"
  - _Requirements: 2.3, 2.4, 3.1_

- [ ] 9. Update unit tests for useWorkoutSectionHandlers
  - Remove tests for delete handlers
  - Verify handlers no longer include delete-related functions
  - _Requirements: 2.4_

- [ ] 10. Update E2E tests
  - Update `repetition-blocks.spec.ts` to expect immediate deletion instead of modal
  - Update any other E2E tests that expect the delete confirmation modal
  - Add E2E test for undo functionality if not already present
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
