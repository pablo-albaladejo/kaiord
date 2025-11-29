# Implementation Plan - Delete Confirmation with Undo

## Overview

Add undo notifications for delete actions to prevent accidental data loss.

**Target Release:** v1.1.0  
**Estimated Effort:** 2-3 hours  
**Priority:** LOW - Nice-to-have safety feature

## Implementation Status

✅ **Core functionality implemented:**

- Store actions: `deleteStepAction`, `undoDeleteAction`, `clearExpiredDeletesAction`
- Store integration: `deletedSteps` state, `undoDelete`, `clearExpiredDeletes` methods
- UI integration: `useDeleteHandlers` hook with toast notification
- Auto-cleanup: `useDeleteCleanup` hook integrated in App.tsx
- Unit tests: All store actions and hooks tested (9/9 tests passing)

## Remaining Tasks

- [x] 1. Add unit tests for delete-step-action
  - Test step deletion tracking
  - Test deletedSteps array updates
  - Test timestamp recording
  - _Requirements: 39.3.1_

- [x] 2. Add E2E tests for delete with undo flow
  - Test delete step shows undo notification
  - Test undo button restores deleted step
  - Test notification auto-dismisses after 5 seconds
  - Test multiple delete operations show separate notifications
  - Test undo works correctly with step reindexing
  - _Requirements: 39.3.1, 39.3.2, 39.3.3, 39.3.4_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
