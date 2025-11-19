# Requirements Document - Repetition Block UI

## Introduction

Complete the repetition block functionality by adding UI controls for creating, editing, and managing repetition blocks. This builds on the existing RepetitionBlockCard component and store actions to provide a full user experience.

## Glossary

- **Repetition Block**: A group of workout steps that repeat a specified number of times
- **Multi-Select**: Ability to select multiple steps to group into a repetition block
- **Repeat Count**: The number of times steps within a block should be repeated (minimum 2)
- **Block Actions**: Operations that can be performed on repetition blocks (create, edit, delete, ungroup)

## Requirements

### Requirement 7.1 (Create Repetition Block from Steps)

**User Story:** As a coach, I want to select multiple steps and group them into a repetition block, so that I can create interval workouts efficiently

#### Acceptance Criteria

1. WHEN THE user selects multiple steps, THE Workout SPA Editor SHALL enable a "Create Repetition Block" button
2. WHEN THE user clicks "Create Repetition Block", THE Workout SPA Editor SHALL show a dialog to configure the repeat count
3. WHEN THE user confirms the repeat count (minimum 2), THE Workout SPA Editor SHALL wrap the selected steps in a repetition block
4. WHEN THE repetition block is created, THE Workout SPA Editor SHALL clear the selection and show the new block
5. WHEN THE user tries to create a block with only one step, THE Workout SPA Editor SHALL show an error message

### Requirement 7.2 (Multi-Step Selection)

**User Story:** As a user, I want to select multiple steps at once, so that I can perform batch operations like creating repetition blocks

#### Acceptance Criteria

1. WHEN THE user clicks on a step while holding Ctrl/Cmd, THE Workout SPA Editor SHALL add the step to the selection
2. WHEN THE user clicks on a step while holding Shift, THE Workout SPA Editor SHALL select all steps between the last selected and current step
3. WHEN THE user clicks on a selected step, THE Workout SPA Editor SHALL deselect it
4. WHEN THE user clicks outside the step list, THE Workout SPA Editor SHALL clear the selection
5. WHEN THE steps are selected, THE Workout SPA Editor SHALL visually highlight them

### Requirement 7.3 (Edit Repetition Block)

**User Story:** As a coach, I want to edit repetition blocks, so that I can adjust my workout structure

#### Acceptance Criteria

1. WHEN THE user clicks on a repetition block, THE Workout SPA Editor SHALL expand/collapse the block to show/hide nested steps
2. WHEN THE user clicks the repeat count, THE Workout SPA Editor SHALL allow inline editing of the count
3. WHEN THE user changes the repeat count, THE Workout SPA Editor SHALL update the block and recalculate statistics
4. WHEN THE user adds a step inside a block, THE Workout SPA Editor SHALL add it to the block's steps array
5. WHEN THE user removes a step from a block, THE Workout SPA Editor SHALL update the block or remove it if empty

### Requirement 7.4 (Ungroup Repetition Block)

**User Story:** As a user, I want to ungroup a repetition block, so that I can convert it back to individual steps

#### Acceptance Criteria

1. WHEN THE user right-clicks on a repetition block, THE Workout SPA Editor SHALL show a context menu with "Ungroup" option
2. WHEN THE user selects "Ungroup", THE Workout SPA Editor SHALL extract all steps from the block
3. WHEN THE block is ungrouped, THE Workout SPA Editor SHALL insert the steps at the block's position
4. WHEN THE block is ungrouped, THE Workout SPA Editor SHALL recalculate step indices
5. WHEN THE block is ungrouped, THE Workout SPA Editor SHALL update workout statistics

### Requirement 7.5 (Repetition Block Actions Menu)

**User Story:** As a user, I want quick access to repetition block actions, so that I can manage blocks efficiently

#### Acceptance Criteria

1. WHEN THE user hovers over a repetition block, THE Workout SPA Editor SHALL show action buttons
2. WHEN THE action menu is displayed, THE Workout SPA Editor SHALL show options: Edit Count, Add Step, Ungroup, Delete
3. WHEN THE user clicks "Edit Count", THE Workout SPA Editor SHALL activate inline editing
4. WHEN THE user clicks "Add Step", THE Workout SPA Editor SHALL add a new step inside the block
5. WHEN THE user clicks "Delete", THE Workout SPA Editor SHALL show a confirmation dialog before removing the block

### Requirement 7.6 (Keyboard Shortcuts for Blocks)

**User Story:** As a power user, I want keyboard shortcuts for repetition block operations, so that I can work faster

#### Acceptance Criteria

1. WHEN THE user presses Ctrl/Cmd+G with steps selected, THE Workout SPA Editor SHALL create a repetition block
2. WHEN THE user presses Ctrl/Cmd+Shift+G on a block, THE Workout SPA Editor SHALL ungroup the block
3. WHEN THE user presses Ctrl/Cmd+A, THE Workout SPA Editor SHALL select all steps
4. WHEN THE user presses Escape, THE Workout SPA Editor SHALL clear the selection
5. WHEN THE user presses Delete with a block selected, THE Workout SPA Editor SHALL delete the block

### Requirement 7.7 (Visual Feedback for Blocks)

**User Story:** As a user, I want clear visual distinction for repetition blocks, so that I can easily identify workout structure

#### Acceptance Criteria

1. WHEN THE workout contains repetition blocks, THE Workout SPA Editor SHALL display them with a distinct border style
2. WHEN THE block is collapsed, THE Workout SPA Editor SHALL show a summary (repeat count and step count)
3. WHEN THE block is expanded, THE Workout SPA Editor SHALL show all nested steps with indentation
4. WHEN THE user hovers over a block, THE Workout SPA Editor SHALL highlight it
5. WHEN THE block is selected, THE Workout SPA Editor SHALL show a selection indicator
