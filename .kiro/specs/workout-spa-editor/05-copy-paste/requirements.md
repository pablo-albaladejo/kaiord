# Requirements Document - Copy/Paste Step Functionality

## Introduction

Enable users to copy and paste workout steps for efficient workout creation.

## Requirements

### Requirement 39.2 (Copy/Paste Notifications)

**User Story:** As a user, I want to copy and paste workout steps, so that I can reuse intervals efficiently

#### Acceptance Criteria

1. WHEN THE user copies a step, THE Workout SPA Editor SHALL display a notification confirming the copy to clipboard
2. WHEN THE user pastes a step, THE Workout SPA Editor SHALL insert the copied step at the current position
3. WHEN THE clipboard is empty and user triggers paste, THE Workout SPA Editor SHALL display a message indicating no content to paste
4. WHEN THE user copies a repetition block, THE Workout SPA Editor SHALL store the entire block with all contained steps
5. WHEN THE user pastes a step, THE Workout SPA Editor SHALL recalculate step indices for all subsequent steps

### Requirement 29 (Keyboard Shortcuts)

**User Story:** As a user, I want to use keyboard shortcuts, so that I can work more efficiently

#### Acceptance Criteria (Copy/Paste)

1. WHEN THE user presses Ctrl+C (or Cmd+C on Mac) with a step selected, THE Workout SPA Editor SHALL copy the selected step
2. WHEN THE user presses Ctrl+V (or Cmd+V on Mac), THE Workout SPA Editor SHALL paste the copied step
