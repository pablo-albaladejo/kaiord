# Implementation Plan - Repetition Block UI

## Overview

Complete the repetition block functionality by implementing UI controls for creating, editing, and managing repetition blocks.

**Target Release:** v1.2.0  
**Estimated Effort:** 12-16 hours  
**Priority:** HIGH - Core feature missing UI

## Current State Analysis

**Already Implemented:**

- ✅ RepetitionBlockCard component (display, expand/collapse, edit count)
- ✅ createRepetitionBlockAction (store action)
- ✅ Type guards (isRepetitionBlock, isWorkoutStep)
- ✅ Workout stats calculation with repetitions

**Missing:**

- ❌ Multi-select functionality for steps
- ❌ "Create Repetition Block" button and dialog
- ❌ Ungroup repetition block action
- ❌ Context menu for block actions
- ❌ Keyboard shortcuts
- ❌ E2E tests for block creation workflow

## Implementation Tasks

- [ ] 1. Implement multi-select functionality
  - Create useMultiSelect hook for selection state management
  - Support Ctrl/Cmd+Click for toggle selection
  - Support Shift+Click for range selection
  - Support regular click for single selection
  - Add clearSelection and selectAll methods
  - Write unit tests for hook (80%+ coverage)
  - _Requirements: 7.2_
  - _Files: hooks/useMultiSelect.ts, hooks/useMultiSelect.test.ts_

- [ ] 2. Update StepCard to support multi-select
  - Add isMultiSelected prop and styling
  - Add onMultiSelect handler
  - Update click handler to detect modifier keys
  - Add visual indicator for multi-selected state
  - Write component tests (70%+ coverage)
  - _Requirements: 7.2.5_
  - _Files: components/molecules/StepCard/StepCard.tsx, components/molecules/StepCard/StepCard.test.tsx_

- [ ] 3. Create CreateRepetitionBlockButton component
  - Show button only when 2+ steps selected
  - Display selected step count
  - Handle onClick to open dialog
  - Add proper accessibility labels
  - Write component tests (70%+ coverage)
  - _Requirements: 7.1.1_
  - _Files: components/molecules/CreateRepetitionBlockButton/CreateRepetitionBlockButton.tsx, components/molecules/CreateRepetitionBlockButton/CreateRepetitionBlockButton.test.tsx_

- [ ] 4. Create CreateRepetitionBlockDialog component
  - Dialog with repeat count input (min: 2)
  - Show selected step count
  - Validate repeat count on confirm
  - Handle confirm/cancel actions
  - Show error messages for invalid input
  - Write component tests (70%+ coverage)
  - _Requirements: 7.1.2, 7.1.3, 7.1.5_
  - _Files: components/molecules/CreateRepetitionBlockDialog/CreateRepetitionBlockDialog.tsx, components/molecules/CreateRepetitionBlockDialog/CreateRepetitionBlockDialog.test.tsx_

- [ ] 5. Integrate multi-select into WorkoutSection
  - Add selectedStepIndices to workout store state
  - Update WorkoutStepsList to pass multi-select props
  - Connect CreateRepetitionBlockButton to store
  - Connect CreateRepetitionBlockDialog to store action
  - Handle block creation workflow
  - Write integration tests
  - _Requirements: 7.1_
  - _Files: store/workout-store.ts, components/pages/WorkoutSection/WorkoutSection.tsx, components/pages/WorkoutSection/useWorkoutSectionState.ts_

- [ ] 6. Implement ungroup repetition block action
  - Create ungroupRepetitionBlockAction store action
  - Extract steps from block
  - Recalculate step indices
  - Update workout and trigger re-render
  - Write unit tests for action (80%+ coverage)
  - _Requirements: 7.4_
  - _Files: store/actions/ungroup-repetition-block-action.ts, store/actions/ungroup-repetition-block-action.test.ts_

- [ ] 7. Create RepetitionBlockContextMenu component
  - Dropdown menu with actions: Edit Count, Add Step, Ungroup, Delete
  - Handle all menu item clicks
  - Add proper icons for each action
  - Write component tests (70%+ coverage)
  - _Requirements: 7.5_
  - _Files: components/molecules/RepetitionBlockCard/RepetitionBlockContextMenu.tsx, components/molecules/RepetitionBlockCard/RepetitionBlockContextMenu.test.tsx_

- [ ] 8. Integrate context menu into RepetitionBlockCard
  - Add context menu trigger button
  - Connect menu actions to store
  - Handle Edit Count (activate inline editing)
  - Handle Add Step (add step inside block)
  - Handle Ungroup (call ungroup action)
  - Handle Delete (show confirmation dialog)
  - Write integration tests
  - _Requirements: 7.5_
  - _Files: components/molecules/RepetitionBlockCard/RepetitionBlockCard.tsx_

- [ ] 9. Implement keyboard shortcuts
  - Create useRepetitionBlockShortcuts hook
  - Ctrl/Cmd+G: Create block from selection
  - Ctrl/Cmd+Shift+G: Ungroup selected block
  - Ctrl/Cmd+A: Select all steps
  - Escape: Clear selection
  - Delete: Delete selected block
  - Write unit tests for hook (80%+ coverage)
  - _Requirements: 7.6_
  - _Files: hooks/useRepetitionBlockShortcuts.ts, hooks/useRepetitionBlockShortcuts.test.ts_

- [ ] 10. Add validation utilities
  - Create validateRepetitionBlockCreation function
  - Validate minimum steps (2+)
  - Validate minimum repeat count (2+)
  - Return descriptive error messages
  - Write unit tests (80%+ coverage)
  - _Requirements: 7.1.5_
  - _Files: utils/repetition-block-validation.ts, utils/repetition-block-validation.test.ts_

- [ ] 11. Update WorkoutStepsList layout
  - Add CreateRepetitionBlockButton above AddStepButton
  - Show button only when steps are selected
  - Add spacing and visual hierarchy
  - Ensure mobile responsiveness
  - Write component tests
  - _Requirements: 7.1.1_
  - _Files: components/pages/WorkoutSection/WorkoutStepsList.tsx_

- [ ] 12. Implement comprehensive E2E tests
  - **Create Block Flow**
    - Select multiple steps with Ctrl+Click
    - Click "Create Repetition Block"
    - Set repeat count
    - Verify block created
    - Verify stats updated
  - **Edit Block Flow**
    - Click block to expand
    - Edit repeat count
    - Verify stats recalculated
  - **Ungroup Block Flow**
    - Open context menu
    - Click "Ungroup"
    - Verify steps extracted
  - **Keyboard Shortcuts**
    - Test Ctrl+G creates block
    - Test Ctrl+Shift+G ungroups block
    - Test Ctrl+A selects all
    - Test Escape clears selection
  - **Multi-Select**
    - Test Ctrl+Click toggles selection
    - Test Shift+Click selects range
    - Test regular click selects single
  - **Mobile Flow**
    - Test touch selection
    - Test block creation on mobile
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - _Files: e2e/repetition-block-ui.spec.ts_

- [ ]\* 13. Add property-based tests
  - **Property 1: Multi-select consistency**
    - Generate random selection sequences
    - Verify selected indices are always valid
    - **Validates: Requirements 7.2.1, 7.2.2, 7.2.3**
  - **Property 2: Block creation preserves steps**
    - Generate random step selections
    - Create block and verify step data unchanged
    - **Validates: Requirements 7.1.3**
  - **Property 3: Ungroup is inverse of group**
    - Create block then ungroup
    - Verify steps match original
    - **Validates: Requirements 7.4.2, 7.4.3**
  - **Property 4: Step indices remain unique**
    - Perform random operations
    - Verify all indices unique and sequential
    - **Validates: Requirements 7.1.4, 7.4.4**
  - _Requirements: 7.1, 7.2, 7.4_
  - _Files: hooks/useMultiSelect.property.test.ts, store/actions/repetition-block-actions.property.test.ts_

## Testing Requirements

- **Unit Tests**: 80%+ coverage for hooks, actions, and utilities
- **Component Tests**: 70%+ coverage for all new components
- **Integration Tests**: Complete workflows (create, edit, ungroup)
- **E2E Tests**: Full user flows across all browsers
- **Property Tests**: Correctness properties for core operations

## Dependencies

- Existing RepetitionBlockCard component
- Existing createRepetitionBlockAction
- Radix UI Dialog component
- Radix UI DropdownMenu component
- Lucide React icons

## Success Criteria

- ✅ Users can select multiple steps with Ctrl/Cmd+Click
- ✅ Users can create repetition blocks from selected steps
- ✅ Users can edit repeat count inline
- ✅ Users can ungroup repetition blocks
- ✅ Users can use keyboard shortcuts (Ctrl+G, Ctrl+Shift+G)
- ✅ All tests passing with required coverage
- ✅ Mobile-responsive design
- ✅ Accessible keyboard navigation

## Notes

- This spec builds on existing work (02-repetition-blocks)
- Focus on completing the missing UI layer
- Maintain consistency with existing StepCard interactions
- Ensure mobile-first responsive design
- Follow existing component patterns (atoms/molecules/organisms)
