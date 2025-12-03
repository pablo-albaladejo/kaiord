# Requirements Document - Remove Delete Step Modal

## Introduction

Remove the obsolete Delete Step confirmation modal that conflicts with the current undo-based deletion workflow. The current implementation shows a confirmation modal before deleting steps, but according to spec 06-delete-undo, steps should be deleted immediately with an undo toast notification instead.

## Glossary

- **Delete Step Modal**: The `DeleteConfirmDialog` component that shows a confirmation dialog before deleting a step
- **Undo Toast**: A temporary notification with an "Undo" button that appears after deleting a step
- **Workout SPA Editor**: The frontend application for editing workout files

## Requirements

### Requirement 1

**User Story:** As a user, I want steps to be deleted immediately without a confirmation modal, so that the deletion workflow is consistent with the undo-based approach

#### Acceptance Criteria

1. WHEN the user clicks the delete button on a step THEN the Workout SPA Editor SHALL delete the step immediately without showing a confirmation modal
2. WHEN a step is deleted THEN the Workout SPA Editor SHALL display an undo toast notification for 5 seconds
3. WHEN the user clicks the undo button in the toast THEN the Workout SPA Editor SHALL restore the deleted step to its original position
4. WHEN the undo toast auto-dismisses after 5 seconds THEN the Workout SPA Editor SHALL permanently remove the step from undo history
5. WHEN the user deletes multiple steps THEN the Workout SPA Editor SHALL show separate undo notifications for each deletion

### Requirement 2

**User Story:** As a developer, I want to remove unused modal code, so that the codebase is clean and maintainable

#### Acceptance Criteria

1. WHEN reviewing the codebase THEN the Workout SPA Editor SHALL NOT contain the `DeleteConfirmDialog` component
2. WHEN reviewing the codebase THEN the Workout SPA Editor SHALL NOT contain the `useDeleteHandlers` hook
3. WHEN reviewing the codebase THEN the Workout SPA Editor SHALL NOT contain any references to `stepToDelete` state
4. WHEN reviewing the codebase THEN the Workout SPA Editor SHALL NOT contain any references to `handleDeleteRequest`, `handleDeleteConfirm`, or `handleDeleteCancel` functions
5. WHEN reviewing test files THEN the Workout SPA Editor SHALL NOT contain tests for the deleted modal component

### Requirement 3

**User Story:** As a user, I want the delete button to work correctly after the modal is removed, so that I can delete steps without issues

#### Acceptance Criteria

1. WHEN the user clicks the delete button on a step THEN the Workout SPA Editor SHALL call the `deleteStep` action directly
2. WHEN a step is deleted THEN the Workout SPA Editor SHALL update the workout state immediately
3. WHEN a step is deleted THEN the Workout SPA Editor SHALL show the undo toast notification
4. WHEN the user clicks undo THEN the Workout SPA Editor SHALL restore the step to its original position
5. WHEN the user deletes a step inside a repetition block THEN the Workout SPA Editor SHALL handle the deletion correctly
