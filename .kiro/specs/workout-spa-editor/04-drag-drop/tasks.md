# Implementation Plan - Drag-and-Drop Reordering

## Overview

Enable intuitive step reordering with drag-and-drop and keyboard shortcuts.

**Target Release:** v1.1.0  
**Estimated Effort:** 8-10 hours  
**Priority:** MEDIUM - Enhances UX

## Implementation Tasks

- [x] 1. Install and configure drag-and-drop library
  - Install @dnd-kit/core and @dnd-kit/sortable
  - Configure DndContext in StepEditor
  - Add accessibility announcements for screen readers
  - _Requirements: 3_

- [x] 2. Make StepCard draggable
  - Add drag handle icon to StepCard
  - Implement useSortable hook
  - Add visual feedback during drag (opacity, transform)
  - Ensure touch support for mobile
  - Write unit tests for drag interactions
  - _Requirements: 3_

- [x] 3. Implement drop zones and reordering logic
  - Add drop zones between steps
  - Update store action to reorder steps
  - Add to undo/redo history
  - Handle edge cases (drag to same position, drag out of bounds)
  - Write unit tests for reordering logic
  - _Requirements: 3_

- [x] 4. Add keyboard shortcuts for reordering
  - Alt+Up/Down to move step up/down
  - Update keyboard shortcuts hook
  - Add to help documentation
  - Write unit tests for keyboard reordering
  - _Requirements: 3, 29_

- [x] 5. Implement comprehensive testing strategy
  - **Unit Tests** (80%+): reorder logic, edge cases
  - **Component Tests** (70%+): drag interactions, visual feedback
  - **Integration Tests**: complete drag-and-drop flow
  - **E2E Tests**: mouse drag, keyboard reordering, mobile touch
  - **Performance Tests**: drag with >50 steps
  - _Requirements: 3, 29_
