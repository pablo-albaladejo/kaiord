# Implementation Plan - Repetition Blocks Support

## Overview

Add support for repetition blocks to enable interval training and structured workout programs.

**Target Release:** v1.1.0  
**Estimated Effort:** 10-12 hours  
**Priority:** MEDIUM - Important for interval workouts

## Testing Requirements

- Unit tests for type guards and validation (80%+ coverage)
- Component tests for RepetitionBlockCard (70%+ coverage)
- Integration tests for repetition block workflows
- E2E tests for creating and editing repetition blocks
- Performance tests for nested repetitions

## Implementation Tasks

- [ ] 1. Create RepetitionBlock type and schema
  - Define RepetitionBlock type with repeatCount and steps array
  - Add Zod schema for validation
  - Update KRD type to support union of WorkoutStep | RepetitionBlock
  - Write unit tests for type guards
  - _Requirements: 4_
  - _Files: types/krd.ts, types/schemas.ts, types/krd-guards.ts_

- [ ] 2. Create RepetitionBlockCard component
  - Visual container showing repeat count and nested steps
  - Collapsible/expandable view of nested steps
  - Edit repeat count inline
  - Add/remove steps within block
  - Write unit tests for component
  - _Requirements: 4_
  - _Files: components/molecules/RepetitionBlockCard/RepetitionBlockCard.tsx_

- [ ] 3. Add "Create Repetition Block" action
  - Button to wrap selected steps in repetition block
  - Dialog to set repeat count
  - Update store actions to handle repetition blocks
  - Write unit tests for store actions
  - _Requirements: 4_
  - _Files: store/actions/create-repetition-block-action.ts, components/organisms/StepEditor/StepEditor.tsx_

- [ ] 4. Update workout stats to calculate repetition blocks
  - Calculate total duration including repetitions
  - Calculate total distance including repetitions
  - Update WorkoutStats component to display correctly
  - Write unit tests for calculations
  - _Requirements: 4, 5_
  - _Files: utils/workout-stats.ts, components/organisms/WorkoutStats/WorkoutStats.tsx_

- [ ] 5. Implement comprehensive testing strategy for repetition blocks
  - **Unit Tests** (Coverage target: 80%+)
    - Test RepetitionBlock type guard functions
    - Test repetition block validation
    - Test stats calculation with repetitions
    - Test step index recalculation
  - **Component Tests** (Coverage target: 70%+)
    - Test RepetitionBlockCard renders correctly
    - Test expand/collapse functionality
    - Test editing repeat count
    - Test adding/removing steps within block
  - **Integration Tests**
    - Test creating repetition block from selected steps
    - Test moving steps in/out of repetition blocks
    - Test undo/redo with repetition blocks
  - **E2E Tests**
    - Test creating repetition block from steps
    - Test editing repeat count
    - Test adding/removing steps within block
    - Test stats calculation with repetitions
  - **Performance Tests**
    - Test rendering large repetition blocks (>20 steps)
    - Test deeply nested repetitions
  - _Requirements: 4, 5_
  - _Files: types/krd-guards.test.ts, utils/workout-stats.test.ts, components/molecules/RepetitionBlockCard/RepetitionBlockCard.test.tsx, e2e/repetition-blocks.spec.ts_

## Summary

This implementation adds repetition block support to enable efficient interval workout creation. Each task builds incrementally on the existing step infrastructure.

**Dependencies:**

- Existing WorkoutStep type and components
- Store actions for workout manipulation
- Statistics calculation utilities

**Success Criteria:**

- Users can create repetition blocks from selected steps
- Statistics correctly calculate repeated steps
- All tests passing with 80%+ unit coverage, 70%+ component coverage
