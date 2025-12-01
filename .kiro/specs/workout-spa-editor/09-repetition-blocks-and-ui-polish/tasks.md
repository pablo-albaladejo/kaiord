# Implementation Plan

- [ ] 1. Implement default step in empty repetition blocks
  - Create default step template constant
  - Modify `createEmptyRepetitionBlockAction` to add default step
  - Update step index calculation to include default step
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 1.1 Write property test for default step creation
  - **Property 1: Empty blocks always contain default step**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

- [ ] 1.2 Write property test for blocks from selected steps
  - **Property 2: Blocks from selected steps preserve step count**
  - **Validates: Requirements 1.6, 7.1**

- [ ] 2. Implement block deletion action
  - Create `deleteRepetitionBlockAction` in store actions
  - Implement block removal logic
  - Implement step index recalculation after deletion
  - Add deletion to undo history
  - Clear selections that reference deleted block steps
  - Update workout statistics after deletion
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.7_

- [ ] 2.1 Write property test for block deletion
  - **Property 3: Block deletion removes all contained steps**
  - **Validates: Requirements 2.1**

- [ ] 2.2 Write property test for sequential indices
  - **Property 4: Step indices remain sequential after deletion**
  - **Validates: Requirements 2.2**

- [ ] 2.3 Write property test for deletion round-trip
  - **Property 5: Block deletion is undoable (round-trip)**
  - **Validates: Requirements 2.3, 2.4**

- [ ] 2.4 Write property test for selection clearing
  - **Property 6: Deletion clears affected selections**
  - **Validates: Requirements 2.5**

- [ ] 2.5 Write property test for statistics consistency
  - **Property 7: Statistics consistency after deletion**
  - **Validates: Requirements 2.7**

- [ ] 3. Add delete button to RepetitionBlockCard
  - Add delete button to block header
  - Implement onClick handler to call store action
  - Add tooltip "Delete repetition block"
  - Style button appropriately (destructive variant)
  - _Requirements: 3.1, 3.2, 3.4_

- [ ] 3.1 Write unit test for delete button rendering
  - Verify delete button appears in block header
  - Verify tooltip text is correct
  - _Requirements: 3.1, 3.4_

- [ ] 3.2 Write property test for UI delete action
  - **Property 8: UI delete triggers actual deletion**
  - **Validates: Requirements 3.2**

- [ ] 4. Implement keyboard shortcuts for block deletion
  - Add keyboard event handlers to RepetitionBlockCard
  - Handle Delete and Backspace keys when block is selected
  - Implement focus management after deletion
  - Move focus to next/previous block or add button
  - _Requirements: 3.6, 4.1, 4.4_

- [ ] 4.1 Write property test for keyboard delete equivalence
  - **Property 9: Keyboard delete equivalence**
  - **Validates: Requirements 3.6, 4.1, 4.6**

- [ ] 4.2 Write property test for focus management
  - **Property 10: Focus management after deletion**
  - **Validates: Requirements 4.4**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Create ConfirmationModal component
  - Create new component in `components/molecules/ConfirmationModal`
  - Implement modal structure with Radix UI Dialog
  - Add backdrop with dim effect
  - Implement focus trap using focus-trap-react
  - Add Escape key handler for dismissal
  - Implement focus restoration after dismissal
  - Style modal for desktop and mobile
  - _Requirements: 6.2, 6.3, 6.5, 6.6, 6.7, 6.9_

- [ ] 6.1 Write unit tests for ConfirmationModal
  - Test modal rendering with different props
  - Test backdrop click dismissal
  - Test button click handlers
  - _Requirements: 6.2, 6.4, 6.8_

- [ ] 6.2 Write property test for focus trap
  - **Property 14: Modal focus trap**
  - **Validates: Requirements 6.3**

- [ ] 6.3 Write property test for Escape dismissal
  - **Property 15: Modal dismissal with Escape**
  - **Validates: Requirements 6.5**

- [ ] 6.4 Write property test for background blocking
  - **Property 16: Modal blocks background interaction**
  - **Validates: Requirements 6.6**

- [ ] 6.5 Write property test for focus restoration
  - **Property 17: Focus restoration after modal**
  - **Validates: Requirements 6.7**

- [ ] 6.6 Write property test for responsive modal
  - **Property 18: Responsive modal layout**
  - **Validates: Requirements 6.9**

- [ ] 7. Add modal state management to store
  - Add `modalConfig` and `isModalOpen` to store state
  - Create `showConfirmationModal` action
  - Create `hideConfirmationModal` action
  - Integrate ConfirmationModal with store
  - _Requirements: 6.1_

- [ ] 7.1 Write unit tests for modal store actions
  - Test showConfirmationModal sets state correctly
  - Test hideConfirmationModal clears state
  - _Requirements: 6.1_

- [ ] 8. Replace browser alerts with modals
  - Identify all uses of window.alert, window.confirm, window.prompt
  - Replace with showConfirmationModal calls
  - Update confirmation handlers to use modal callbacks
  - _Requirements: 6.1, 6.4_

- [ ] 8.1 Write property test for no browser alerts
  - **Property 13: No browser alerts for confirmations**
  - **Validates: Requirements 6.1**

- [ ] 9. Improve ActionButtons component styling
  - Update button spacing to 12px gap
  - Implement consistent button variants (primary/secondary)
  - Fix button label capitalization to title case
  - Organize buttons by priority (primary left, secondary right)
  - Add responsive layout (stack on mobile)
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 9.1 Write unit tests for button styling
  - Test button spacing is correct
  - Test button alignment
  - Test primary/secondary variants
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [ ] 9.2 Write property test for button capitalization
  - **Property 11: Button capitalization consistency**
  - **Validates: Requirements 5.7**

- [ ] 9.3 Write property test for responsive layout
  - **Property 12: Responsive button layout**
  - **Validates: Requirements 5.6**

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Add E2E tests for block operations
  - Test create empty block → verify default step
  - Test delete block → verify removal
  - Test delete → undo → verify restoration
  - Test keyboard delete → verify focus management
  - _Requirements: 1.1, 2.1, 2.4, 4.4_

- [ ] 12. Add E2E tests for modal interactions
  - Test confirmation modal appears (not browser alert)
  - Test Escape key dismisses modal
  - Test backdrop click dismisses modal
  - Test focus trap in modal
  - Test responsive modal on mobile viewport
  - _Requirements: 6.1, 6.3, 6.5, 6.6, 6.9_

- [ ] 13. Add E2E tests for button improvements
  - Test button layout on desktop
  - Test button layout on mobile (stacked)
  - Test button capitalization
  - _Requirements: 5.6, 5.7_

- [ ] 14. Accessibility audit and fixes
  - Verify keyboard navigation for all new features
  - Test with screen reader (VoiceOver/NVDA)
  - Verify ARIA labels and roles
  - Check color contrast ratios
  - Verify focus indicators
  - Test minimum touch target sizes
  - _Requirements: 3.3, 4.1, 6.3, 6.7_

- [ ] 14.1 Write accessibility tests
  - Test keyboard navigation through blocks
  - Test screen reader announcements
  - Test ARIA attributes
  - _Requirements: 3.3, 4.1, 6.3_

- [ ] 15. Performance optimization
  - Measure block deletion performance
  - Measure undo operation performance
  - Measure modal open/close performance
  - Optimize if any operation exceeds budget
  - _Performance budgets: deletion < 100ms, undo < 100ms, modal < 200ms_

- [ ] 15.1 Write performance tests
  - Test block deletion completes in < 100ms
  - Test undo completes in < 100ms
  - Test modal operations complete in < 200ms

- [ ] 16. Update documentation
  - Update keyboard shortcuts documentation
  - Document new block deletion feature
  - Document modal system usage
  - Update component Storybook stories
  - _Requirements: 4.1_

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
