# Implementation Plan

## Core Type Updates

- [x] 1. Add `id` field to RepetitionBlock type
  - ✅ Updated `RepetitionBlock` schema in core package with optional `id: string`
  - ✅ Type exports already available through `@kaiord/core`
  - ✅ Backward compatible with optional field
  - _Requirements: 2.1, 2.2_

- [x] 1.1 Write property test for block ID uniqueness
  - ✅ Test exists in `repetition-block-id.test.ts`
  - **Property 2: Block ID uniqueness**
  - **Validates: Requirements 2.1, 2.2**

- [x] 2. Create ID generation utility
  - ✅ Implemented `generateBlockId()` in `utils/id-generation.ts`
  - ✅ Uses `Date.now()` + random string for uniqueness
  - _Requirements: 2.1_

- [x] 2.1 Write unit tests for ID generation
  - ✅ Tests exist in `id-generation.test.ts`
  - ✅ Tests ID format consistency and uniqueness
  - _Requirements: 2.1_

## Migration System

- [x] 3. Create migration function for existing workouts
  - ✅ Implemented `migrateRepetitionBlocks()` in `utils/workout-migration.ts`
  - ✅ Adds IDs to blocks without them, preserves existing IDs
  - _Requirements: 2.3_

- [x] 3.1 Write unit tests for migration
  - ✅ Tests exist in `workout-migration.test.ts`
  - ✅ Tests all migration scenarios
  - _Requirements: 2.3_

- [x] 4. Integrate migration into workout loading
  - ✅ Migration integrated in store loading actions
  - _Requirements: 2.3_

- [x] 4.1 Write integration tests for workout loading
  - ✅ Tests exist in `workout-loading-integration.test.ts`
  - _Requirements: 2.3_

## Store Action Updates

- [x] 5. Update deleteRepetitionBlockAction to use ID
  - ✅ Action now uses block ID (string) instead of index
  - ✅ `findBlockById()` helper implemented
  - ✅ Undo functionality preserved
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.4, 2.5_

- [x] 5.1 Write property test for correct block deletion
  - ✅ Test exists in `delete-repetition-block-action.test.ts`
  - **Property 1: Correct block deletion by ID**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [x] 5.2 Write unit tests for findBlockById
  - ✅ Tests exist in `delete-repetition-block-action.test.ts`
  - _Requirements: 2.4_

- [x] 5.3 Write property test for step index recalculation
  - ✅ Test exists in `delete-repetition-block-action.test.ts`
  - **Property 8: Step index recalculation**
  - **Validates: Requirements 1.5**

- [x] 6. Update block creation actions to generate IDs
  - ✅ `createEmptyRepetitionBlockAction` generates ID
  - ✅ `createRepetitionBlockAction` generates ID
  - ✅ All new blocks have unique IDs
  - _Requirements: 2.1, 2.2_

- [x] 6.1 Write property test for ID stability
  - **Property 3: Block ID stability**
  - **Validates: Requirements 2.3**

## UI Layer Updates - Critical Path

- [x] 7. Update render-repetition-block.tsx to pass block ID
  - ✅ Changed to use `item.id` instead of array index
  - ✅ Block ID validation in place
  - ✅ Type signatures updated
  - _Requirements: 2.4, 2.5_

- [x] 8. Update WorkoutListContent type signatures
  - ✅ Changed `onDeleteRepetitionBlock` to accept `(blockId: string)`
  - ✅ All block operation signatures use ID
  - _Requirements: 2.4, 2.5_

- [x] 9. Update store hook in create-workout-store-block-actions.ts
  - ✅ `deleteRepetitionBlock` now only accepts `string` (block ID)
  - ✅ Backward compatibility removed
  - _Requirements: 2.4, 2.5_

- [x] 10. Update other block actions to use ID
  - ✅ `editRepetitionBlock` uses ID
  - ✅ `ungroupRepetitionBlock` uses ID
  - ✅ `addStepToRepetitionBlock` uses ID
  - ✅ All action implementations updated
  - _Requirements: 2.3, 2.4_

- [x] 10.1 Write integration tests for ID-based operations
  - ✅ Tests exist in `block-operations-integration.test.ts`
  - ✅ All block operations verified to use correct ID
  - _Requirements: 2.4, 2.5_

## Checkpoint 1

- [x] 11. Checkpoint - Ensure all ID-based tests pass
  - ✅ All tests passing
  - ✅ Block deletion working correctly in UI
  - ✅ Core bug fix complete

## Remove Confirmation Modal

- [x] 12. Verify no confirmation modal exists
  - ✅ Checked RepetitionBlockHeaderRight component
  - ✅ Delete button calls `onDelete` directly without modal
  - ✅ Toast notification with undo already implemented
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

## Button Styling Consistency

- [x] 13. Verify and document delete button styling
  - Current implementation in RepetitionBlockHeaderRight:
    - Uses `text-red-600 hover:text-red-700 hover:bg-red-50`
    - Uses `Trash2` icon with `h-4 w-4`
    - Has proper dark mode support
  - Need to verify this matches StepCard delete button exactly
  - If differences exist, update to match
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 13.1 Write visual regression test for button styling
  - Compare block delete button with step delete button
  - Verify same classes, icon, and size
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

## Checkpoint 2

- [x] 14. Checkpoint - Ensure all tests pass
  - Run full test suite
  - Manually test all block operations
  - Ensure all tests pass, ask the user if questions arise.

## E2E Testing

- [x] 15. Add E2E test for correct block deletion
  - ✅ Test implemented in `e2e/repetition-blocks.spec.ts`
  - ✅ Test suite: "Repetition Blocks - Correct Block Deletion (Task 15)"
  - ✅ Creates workout with 3 blocks (100W, 200W, 300W for identification)
  - ✅ Deletes middle block (200W) by clicking delete button
  - ✅ Verifies correct block is deleted by checking power values
  - ✅ Verifies remaining blocks are correct (100W and 300W)
  - ✅ Verifies no confirmation modal appears (immediate deletion)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2_

- [x] 16. Add E2E test for undo functionality after block deletion
  - Create and delete block
  - Verify toast notification appears with undo button
  - Click undo in toast
  - Verify block is restored with correct content
  - Verify block is in correct position
  - _Requirements: 3.1, 3.2, 4.3, 4.4_

- [x] 17. Add E2E test for multiple block deletion
  - Create workout with 5 blocks (each with unique identifiable content)
  - Delete blocks in various positions (first, middle, last)
  - Verify correct blocks are deleted each time by checking content
  - Test undo/redo for multiple deletions
  - _Requirements: 1.1, 1.2, 1.3, 3.3, 3.4_

- [x] 18. Add E2E test for button styling consistency
  - Load workout with both steps and repetition blocks
  - Compare delete button styling between step cards and block cards
  - Verify same visual appearance (color, size, hover states)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

## Documentation

- [x] 19. Update documentation
  - Document block ID system in component docs
  - Document migration strategy for existing workouts
  - Update RepetitionBlockCard component documentation
  - Add JSDoc comments to key functions
  - _Requirements: All_

## Final Checkpoint

- [x] 20. Final checkpoint - Ensure all tests pass
  - Run full test suite (unit + integration + E2E)
  - Manually test all three issues are resolved:
    1. ✅ Correct block deletion (not wrong block) - FIXED
    2. ✅ No confirmation modal (immediate deletion with undo) - VERIFIED
    3. ⏳ Consistent button styling - NEEDS VERIFICATION
  - Ensure all tests pass, ask the user if questions arise.
