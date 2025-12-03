# Requirements Document

## Introduction

This specification addresses a critical bug in the repetition block deletion functionality. When deleting a repetition block that is not the first block in the workout, the wrong block is deleted due to an index mismatch between the array position and the logical block index.

## Glossary

- **Array Index**: The position of an item in the `workout.steps` array (includes both individual steps and repetition blocks)
- **Block Index**: The logical index of repetition blocks only (0 for first block, 1 for second block, etc.)
- **Repetition Block**: A container that groups multiple workout steps with a repeat count
- **Workout Step**: An individual step in the workout (not part of a repetition block)

## Requirements

### Requirement 1

**User Story:** As a user, I want to delete any repetition block in my workout, so that I can remove unwanted repetitions regardless of their position.

#### Acceptance Criteria

1. WHEN a user deletes the first repetition block THEN the system SHALL remove that specific block
2. WHEN a user deletes a repetition block that is not the first block THEN the system SHALL remove that specific block, not a different one
3. WHEN a user deletes a repetition block at any position THEN the system SHALL remove only that block and its contained steps
4. WHEN a user deletes a repetition block THEN the system SHALL preserve all other blocks and steps in their correct order
5. WHEN a user deletes a repetition block THEN the system SHALL recalculate step indices correctly for all remaining steps

### Requirement 2

**User Story:** As a developer, I want the block deletion logic to use consistent indexing, so that the correct block is always deleted.

#### Acceptance Criteria

1. WHEN the UI passes a block identifier to the deletion action THEN the system SHALL use a consistent indexing scheme
2. WHEN the deletion action receives a block identifier THEN the system SHALL correctly map it to the actual block position
3. WHEN multiple blocks exist in the workout THEN the system SHALL maintain a clear distinction between array position and logical block index
4. WHEN the deletion logic searches for a block THEN the system SHALL use the correct index type for the search
5. WHEN the deletion logic removes a block THEN the system SHALL use the correct index type for the removal

### Requirement 3

**User Story:** As a user, I want the undo functionality to work correctly after deleting any block, so that I can restore accidentally deleted blocks.

#### Acceptance Criteria

1. WHEN a user deletes a block and then undoes THEN the system SHALL restore the exact block that was deleted
2. WHEN a user deletes a block at any position and then undoes THEN the system SHALL restore the block to its original position
3. WHEN a user deletes multiple blocks and undoes THEN the system SHALL restore each block correctly in reverse order
4. WHEN a user deletes a block, undoes, and redoes THEN the system SHALL delete the same block again
5. WHEN the undo system stores a deleted block THEN the system SHALL store both the block data and its correct position

### Requirement 4

**User Story:** As a user, I want to delete blocks without unnecessary confirmation modals, so that I can work efficiently knowing I can undo if needed.

#### Acceptance Criteria

1. WHEN a user deletes a repetition block THEN the system SHALL NOT show a confirmation modal
2. WHEN a user deletes a repetition block THEN the system SHALL immediately delete the block
3. WHEN a user deletes a repetition block THEN the system SHALL show a toast notification with undo option
4. WHEN a user clicks undo in the toast THEN the system SHALL restore the deleted block
5. WHEN the undo functionality is available THEN the system SHALL NOT show misleading "cannot be undone" messages

### Requirement 5

**User Story:** As a user, I want the delete button for repetition blocks to have the same visual style as other delete buttons, so that the interface is consistent.

#### Acceptance Criteria

1. WHEN a repetition block displays a delete button THEN the system SHALL use the same button style as step delete buttons
2. WHEN a repetition block displays a delete button THEN the system SHALL use the same icon as step delete buttons
3. WHEN a repetition block displays a delete button THEN the system SHALL use the same color scheme as step delete buttons
4. WHEN a repetition block displays a delete button THEN the system SHALL use the same size as step delete buttons
5. WHEN a repetition block displays a delete button THEN the system SHALL use the same hover/focus states as step delete buttons

### Requirement 5

**User Story:** As a developer, I want comprehensive tests for block deletion, so that this bug cannot regress.

#### Acceptance Criteria

1. WHEN testing block deletion THEN the system SHALL test deletion of the first block
2. WHEN testing block deletion THEN the system SHALL test deletion of middle blocks
3. WHEN testing block deletion THEN the system SHALL test deletion of the last block
4. WHEN testing block deletion THEN the system SHALL test deletion with mixed steps and blocks
5. WHEN testing block deletion THEN the system SHALL verify the correct block is deleted by checking block content, not just count
