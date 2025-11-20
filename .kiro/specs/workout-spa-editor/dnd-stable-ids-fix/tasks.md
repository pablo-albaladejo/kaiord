# Implementation Plan

- [ ] 1. Fix ID generation to use position-based IDs
  - Update `generateStepId` function in `use-workout-list-dnd.ts` to use array index instead of `stepIndex`
  - Change step ID format from `step-${step.stepIndex}` to `step-${index}`
  - Change block ID format from `block-${step.repeatCount}-${index}` to `block-${index}`
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 1.1 Write property test for position-based ID generation
  - **Property 1: Position-based ID generation**
  - **Validates: Requirements 2.1**

- [ ] 1.2 Write property test for stable IDs during content changes
  - **Property 2: Stable IDs during content changes**
  - **Validates: Requirements 2.2**

- [ ] 1.3 Write property test for ID regeneration after reorder
  - **Property 3: ID regeneration after reorder**
  - **Validates: Requirements 2.3**

- [ ] 2. Verify React key usage matches generated IDs
  - Ensure `WorkoutListContent` uses `generateStepId` for React keys
  - Verify keys are passed correctly to `Fragment` components
  - _Requirements: 2.4_

- [ ] 2.1 Write property test for React key matching
  - **Property 5: React key matches generated ID**
  - **Validates: Requirements 2.4**

- [ ] 3. Verify stepIndex reindexing after reorder
  - Confirm `reindexSteps` function correctly updates stepIndex values
  - Ensure stepIndex values are sequential after reorder
  - _Requirements: 1.3_

- [ ] 3.1 Write property test for sequential stepIndex
  - **Property 4: Sequential stepIndex after reorder**
  - **Validates: Requirements 1.3**

- [ ] 4. Implement DragOverlay for repetition blocks
  - Add `DragOverlay` component to `WorkoutList`
  - Track active drag item ID in state
  - Render custom preview for repetition blocks during drag
  - Apply consistent styling (opacity, transform) to drag preview
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 4.1 Write property test for drag preview dimensions
  - **Property 6: Drag preview dimension preservation**
  - **Validates: Requirements 3.1, 3.2**

- [ ] 4.2 Write property test for dimension restoration
  - **Property 7: Dimension restoration after drop**
  - **Validates: Requirements 3.3**

- [ ] 4.3 Write property test for consistent drag styling
  - **Property 8: Consistent drag visual treatment**
  - **Validates: Requirements 3.4**

- [ ] 5. Update E2E tests for drag-and-drop
  - Add test for physical position swap (not content swap)
  - Add test for data integrity after reorder
  - Add test for repetition block drag preview dimensions
  - Verify all existing drag-and-drop tests pass
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
