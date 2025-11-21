# Implementation Plan

- [x] 1. Create ID parsing utility function
  - Create `parseStepId` function in new file `src/utils/step-id-parser.ts`
  - Handle three ID formats: `step-{index}`, `block-{index}-step-{index}`, `block-{index}`
  - Return typed object with parsed components
  - _Requirements: 2.4_

- [x] 1.1 Write unit tests for ID parsing
  - **Property 2: ID Parsing Round-Trip**
  - **Validates: Requirements 2.4**
  - Test parsing main workout step IDs (`step-1`)
  - Test parsing block step IDs (`block-2-step-1`)
  - Test parsing block IDs (`block-2`)
  - Test error handling for invalid formats
  - Test round-trip: parse then reconstruct ID

- [x] 2. Update ID generation in use-workout-list-dnd.ts
  - Modify `generateStepId` function signature to accept optional `parentBlockIndex` parameter
  - Update logic to generate hierarchical IDs for steps in blocks
  - Keep existing format for main workout steps and blocks
  - Add JSDoc comments explaining the new format
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2.1 Write unit tests for ID generation
  - **Property 1: ID Uniqueness Across Workout**
  - **Validates: Requirements 1.3, 2.1, 2.2, 2.3**
  - Test main workout step ID generation
  - Test repetition block ID generation
  - Test block step ID generation with parent context
  - Test ID uniqueness across complex workout structures with multiple blocks
  - Generate workout with duplicate stepIndex values and verify all IDs are unique

- [x] 3. Update WorkoutListContent component
  - Pass `parentBlockIndex` to `generateStepId` when rendering items
  - Update prop types to support parent context
  - Ensure block index is correctly passed to nested step rendering
  - _Requirements: 2.2, 3.1_

- [x] 4. Update render-workout-item component
  - Accept and forward `parentBlockIndex` when rendering steps in blocks
  - Pass block index to `SortableRepetitionBlockCard`
  - Ensure ID generation includes parent context for block steps
  - _Requirements: 2.2, 3.2_

- [x] 5. Update SortableRepetitionBlockCard component
  - Generate unique IDs for steps within the block using block index
  - Update ID parsing logic to handle new hierarchical format
  - Use `parseStepId` utility for extracting step information
  - Pass correct parent context to child step rendering
  - _Requirements: 2.2, 3.1, 3.2_

- [x] 5.1 Write integration tests for step selection
  - **Property 3: Selection Isolation**
  - **Validates: Requirements 1.1, 1.2, 1.3, 3.1, 3.2, 3.3**
  - Create workout with steps having duplicate stepIndex values
  - Test selecting step in main workout only selects that step
  - Test selecting step in block only selects that step
  - Test that steps with same stepIndex in different contexts remain unselected
  - Verify selection state contains correct unique ID

- [x] 6. Update render-step component
  - Ensure `isSelected` check uses the new hierarchical ID format
  - Verify `isMultiSelected` check works with new IDs
  - Update any ID string manipulation to use `parseStepId` utility
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 6.1 Write integration tests for multi-selection
  - **Property 4: Multi-Selection Uniqueness**
  - **Validates: Requirements 5.1, 5.2, 5.3**
  - Create workout with multiple blocks containing steps with same stepIndex
  - Simulate Cmd/Ctrl+click on multiple steps across different blocks
  - Verify each step is independently added to selection
  - Verify selection set contains only explicitly clicked step IDs
  - Test removing steps from multi-selection

- [x] 7. Update RepetitionBlockCard component
  - Update any ID-related logic to use new format
  - Ensure step selection within blocks uses hierarchical IDs
  - Update `selectedStepIndex` extraction to use `parseStepId`
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 7.1 Write unit tests for block context preservation
  - **Property 5: Block Context Preservation**
  - **Validates: Requirements 2.2, 3.1, 3.2**
  - Create workout with multiple repetition blocks
  - Generate IDs for all steps in all blocks
  - Parse each ID and verify block context is present
  - Verify block index in ID matches actual parent block position

- [x] 8. Update WorkoutSection handlers
  - Review `useSelectedStep` hook for any ID parsing logic
  - Update selection handlers to work with new ID format
  - Ensure step editing uses correct hierarchical IDs
  - _Requirements: 1.1, 1.2_

- [x] 9. Add error handling for ID operations
  - Add try-catch blocks around `parseStepId` calls
  - Log warnings for invalid ID formats
  - Implement fallback behavior for malformed IDs
  - Add error handling for missing parent context
  - _Requirements: 2.4_

- [x] 9.1 Write unit tests for error handling
  - Test `parseStepId` with invalid formats
  - Test graceful degradation when parent context is missing
  - Test logging of warnings for malformed IDs
  - Verify fallback behavior doesn't crash the application

- [x] 10. Update E2E tests for step selection
  - Add test for selecting main workout step
  - Add test for selecting step in repetition block
  - Add test for multi-selection across blocks
  - Verify visual selection indicators appear only on selected steps
  - Test that steps with same stepIndex in different contexts are independently selectable
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
