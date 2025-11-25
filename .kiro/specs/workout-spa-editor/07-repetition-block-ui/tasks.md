# Implementation Plan - Repetition Block UI

## Overview

Complete the repetition block functionality by implementing UI controls for creating, editing, and managing repetition blocks.

**Target Release:** v1.2.0  
**Estimated Effort:** 8-12 hours  
**Priority:** HIGH - Core feature missing UI

## Current State Analysis

**Already Implemented:**

- ✅ RepetitionBlockCard component (display, expand/collapse, edit count)
- ✅ CreateRepetitionBlockDialog component (basic dialog structure)
- ✅ createRepetitionBlockAction (store action)
- ✅ Type guards (isRepetitionBlock, isWorkoutStep)
- ✅ Workout stats calculation with repetitions
- ✅ Multi-select state management (selectedStepIds in store)
- ✅ Step selection with Ctrl/Cmd+Click (toggleStepSelection action)
- ✅ E2E tests for basic repetition block creation and editing

**Missing:**

- ❌ CreateRepetitionBlockButton component (shows when 2+ steps selected)
- ❌ Ungroup repetition block action and UI
- ❌ Context menu for block actions (Edit Count, Add Step, Ungroup, Delete)
- ❌ Keyboard shortcuts (Ctrl+G, Ctrl+Shift+G, Ctrl+A, Escape)
- ❌ Validation utilities for block creation
- ❌ Integration of CreateRepetitionBlockButton into WorkoutStepsList
- ❌ E2E tests for ungroup workflow and keyboard shortcuts

## Implementation Tasks

- [x] 1. Multi-select functionality (COMPLETED)
  - ✅ Store already has selectedStepIds state
  - ✅ toggleStepSelection action implemented
  - ✅ StepCard supports multi-select with Ctrl/Cmd+Click
  - ✅ E2E tests verify multi-selection works
  - _Requirements: 7.2_
  - _Note: Multi-select is fully functional, no additional work needed_

- [x] 2. Create CreateRepetitionBlockButton component
  - Show button only when 2+ steps selected
  - Display selected step count
  - Handle onClick to open dialog
  - Add proper accessibility labels
  - Write component tests (70%+ coverage)
  - _Requirements: 7.1.1_
  - _Files: components/molecules/CreateRepetitionBlockButton/CreateRepetitionBlockButton.tsx, components/molecules/CreateRepetitionBlockButton/CreateRepetitionBlockButton.test.tsx_

- [x] 3. Update CreateRepetitionBlockDialog validation
  - Change minimum repeat count from 1 to 2
  - Update error message to reflect minimum of 2
  - Update tests to verify new validation
  - _Requirements: 7.1.5_
  - _Files: components/molecules/CreateRepetitionBlockDialog/CreateRepetitionBlockDialog.tsx, components/molecules/CreateRepetitionBlockDialog/CreateRepetitionBlockDialog.test.tsx_

- [x] 4. Integrate CreateRepetitionBlockButton into WorkoutStepsList
  - Add CreateRepetitionBlockButton above AddStepButton
  - Show button only when selectedStepIds.length >= 2
  - Connect button to open CreateRepetitionBlockDialog
  - Connect dialog to createRepetitionBlock store action
  - Handle block creation workflow (create block, clear selection)
  - Add spacing and visual hierarchy
  - Ensure mobile responsiveness
  - Write integration tests
  - _Requirements: 7.1_
  - _Files: components/pages/WorkoutSection/WorkoutStepsList.tsx, components/pages/WorkoutSection/WorkoutSection.tsx_

- [x] 5. Implement ungroup repetition block action
  - Create ungroupRepetitionBlockAction store action
  - Extract steps from block
  - Recalculate step indices using existing recalculateStepIndices utility
  - Update workout and trigger re-render
  - Add ungroupRepetitionBlock method to workout store
  - Write unit tests for action (80%+ coverage)
  - _Requirements: 7.4_
  - _Files: store/actions/ungroup-repetition-block-action.ts, store/actions/ungroup-repetition-block-action.test.ts, store/workout-store.ts_

- [x] 6. Create RepetitionBlockContextMenu component
  - Dropdown menu with actions: Edit Count, Add Step, Ungroup, Delete
  - Handle all menu item clicks
  - Add proper icons for each action (Edit, Plus, Ungroup, Trash)
  - Write component tests (70%+ coverage)
  - _Requirements: 7.5_
  - _Files: components/molecules/RepetitionBlockCard/RepetitionBlockContextMenu.tsx, components/molecules/RepetitionBlockCard/RepetitionBlockContextMenu.test.tsx_

- [x] 7. Integrate context menu into RepetitionBlockCard
  - Add context menu trigger button to RepetitionBlockHeader
  - Connect menu actions to store methods
  - Handle Edit Count (activate inline editing)
  - Handle Add Step (call addStepToRepetitionBlock)
  - Handle Ungroup (call ungroupRepetitionBlock)
  - Handle Delete (show DeleteConfirmDialog, then delete block)
  - Write integration tests
  - _Requirements: 7.5_
  - _Files: components/molecules/RepetitionBlockCard/RepetitionBlockCard.tsx, components/molecules/RepetitionBlockCard/RepetitionBlockHeader.tsx_

- [x] 8. Implement keyboard shortcuts for repetition blocks
  - Extend existing useKeyboardShortcuts hook with new handlers
  - Add Ctrl/Cmd+G: Create block from selection (if 2+ steps selected)
  - Add Ctrl/Cmd+Shift+G: Ungroup selected block (if block is selected)
  - Add Ctrl/Cmd+A: Select all steps
  - Add Escape: Clear selection
  - Update tests to verify new shortcuts
  - _Requirements: 7.6_
  - _Files: hooks/useKeyboardShortcuts.ts, hooks/useKeyboardShortcuts.test.ts_

- [x] 9. Add validation utilities
  - Create validateRepetitionBlockCreation function
  - Validate minimum steps (2+)
  - Validate minimum repeat count (2+)
  - Return descriptive error messages
  - Write unit tests (80%+ coverage)
  - _Requirements: 7.1.5_
  - _Files: utils/repetition-block-validation.ts, utils/repetition-block-validation.test.ts_

- [x] 10. Update E2E tests for new functionality
  - Add tests to existing e2e/repetition-blocks.spec.ts file
  - **Ungroup Block Flow** (NEW)
    - Create repetition block
    - Open context menu
    - Click "Ungroup"
    - Verify steps extracted correctly
    - Verify step indices recalculated
  - **Keyboard Shortcuts** (NEW)
    - Test Ctrl+G creates block from selected steps
    - Test Ctrl+Shift+G ungroups selected block
    - Test Ctrl+A selects all steps
    - Test Escape clears selection
  - **Context Menu Actions** (NEW)
    - Test Edit Count opens inline editor
    - Test Add Step adds step to block
    - Test Delete shows confirmation and removes block
  - _Requirements: 7.4, 7.5, 7.6_
  - _Files: e2e/repetition-blocks.spec.ts_
  - _Note: Basic block creation and editing E2E tests already exist_

- [x] 11. Add property-based tests (OPTIONAL)
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
  - _Requirements: 7.1, 7.4_
  - _Files: store/actions/create-repetition-block-action.property.test.ts, store/actions/ungroup-repetition-block-action.property.test.ts_
  - _Note: Multi-select property tests already exist in WorkoutList.multi-selection.test.tsx_

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
