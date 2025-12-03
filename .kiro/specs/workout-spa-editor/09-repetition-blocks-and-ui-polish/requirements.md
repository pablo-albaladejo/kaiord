# Requirements Document

## Introduction

This specification addresses usability issues with repetition blocks in the Workout SPA Editor. Currently, users can create empty repetition blocks (which have no practical use) and cannot delete repetition blocks directly. These improvements will make repetition blocks more intuitive and user-friendly.

## Glossary

- **System**: The Workout SPA Editor application
- **Repetition Block**: A workout structure that groups multiple steps and repeats them a specified number of times
- **Empty Repetition Block**: A repetition block with no steps inside (currently possible but not useful)
- **Default Step**: A basic workout step with sensible default values (e.g., 5 minutes at moderate intensity)
- **Delete Operation**: Permanently removing a repetition block and all its contained steps from the workout
- **Ungroup Operation**: Converting a repetition block into individual steps (existing functionality)

## Requirements

### Requirement 1: Default Step in New Repetition Blocks

**User Story:** As a user creating a new repetition block, I want it to contain a default step automatically, so that I have a starting point and don't need to manually add the first step.

#### Acceptance Criteria

1. WHEN a user creates an empty repetition block THEN the system SHALL automatically add one default step inside the block
2. WHEN the default step is created THEN the system SHALL set duration to 5 minutes (300 seconds)
3. WHEN the default step is created THEN the system SHALL set target type to "open" (no specific target)
4. WHEN the default step is created THEN the system SHALL set intensity to "active"
5. WHEN the default step is created THEN the system SHALL assign a valid stepIndex within the block context
6. WHEN a repetition block is created from selected steps THEN the system SHALL NOT add a default step (preserve existing behavior)

### Requirement 2: Delete Repetition Block

**User Story:** As a user managing my workout structure, I want to delete entire repetition blocks, so that I can remove intervals I no longer need without having to ungroup and delete steps individually.

#### Acceptance Criteria

1. WHEN a user deletes a repetition block THEN the system SHALL remove the entire block and all its contained steps from the workout
2. WHEN a repetition block is deleted THEN the system SHALL recalculate stepIndex for all remaining steps in the workout
3. WHEN a repetition block is deleted THEN the system SHALL add the deletion to the undo history
4. WHEN a user undoes a block deletion THEN the system SHALL restore the block with all its steps at the original position
5. WHEN a repetition block is deleted THEN the system SHALL clear any selection that referenced steps within that block
6. WHEN the last repetition block is deleted THEN the system SHALL maintain a valid workout structure with remaining steps
7. WHEN a repetition block is deleted THEN the system SHALL update workout statistics (total duration, distance, etc.)

### Requirement 3: UI for Block Deletion

**User Story:** As a user, I want a clear way to delete repetition blocks from the UI, so that I can easily manage my workout structure.

#### Acceptance Criteria

1. WHEN a repetition block is displayed THEN the system SHALL show a delete button or action in the block header
2. WHEN the user clicks the delete button THEN the system SHALL immediately delete the block without confirmation
3. WHEN the delete button is focused THEN the system SHALL provide visual feedback indicating it is interactive
4. WHEN the delete button is hovered THEN the system SHALL show a tooltip explaining "Delete repetition block"
5. WHEN a repetition block is deleted via UI THEN the system SHALL provide visual feedback (e.g., animation or transition)
6. WHEN keyboard navigation is used THEN the system SHALL allow deleting blocks via keyboard shortcut (e.g., Delete key when block is selected)

### Requirement 4: Keyboard Accessibility for Block Operations

**User Story:** As a keyboard user, I want to delete repetition blocks using keyboard shortcuts, so that I can manage my workout without using a mouse.

#### Acceptance Criteria

1. WHEN a repetition block is selected THEN the system SHALL allow deletion via Delete or Backspace key
2. WHEN the Delete key is pressed on a selected block THEN the system SHALL delete the entire block
3. WHEN the Backspace key is pressed on a selected block THEN the system SHALL delete the entire block
4. WHEN a block is deleted via keyboard THEN the system SHALL move focus to the next logical element (next block or step)
5. WHEN the last block is deleted via keyboard THEN the system SHALL move focus to the previous element or the add step button
6. WHEN keyboard shortcuts are used THEN the system SHALL provide the same undo capability as mouse-based deletion

### Requirement 5: Metadata Section Button Visual Improvements

**User Story:** As a user viewing workout metadata, I want buttons to be visually appealing and well-organized, so that the interface looks professional and is easy to use.

#### Acceptance Criteria

1. WHEN the metadata section is displayed THEN the system SHALL organize buttons in a logical order based on action priority (primary actions first)
2. WHEN multiple buttons are displayed THEN the system SHALL use consistent spacing between buttons (e.g., 8px or 12px gap)
3. WHEN buttons are arranged THEN the system SHALL align them consistently (e.g., all left-aligned or centered as a group)
4. WHEN primary actions are displayed THEN the system SHALL use primary button styling (e.g., filled background)
5. WHEN secondary actions are displayed THEN the system SHALL use secondary button styling (e.g., outline or ghost style)
6. WHEN the viewport is narrow (mobile) THEN the system SHALL stack buttons vertically or wrap them gracefully
7. WHEN button labels are displayed THEN the system SHALL use consistent capitalization (e.g., "Save Workout" not "save workout")
8. WHEN buttons are grouped THEN the system SHALL use visual grouping (e.g., related actions together with separator or spacing)

### Requirement 6: Replace Browser Alerts with Modal Dialogs

**User Story:** As a user, I want confirmation messages to appear as in-app modal dialogs instead of browser alerts, so that the experience is consistent with modern web applications and doesn't break my workflow.

#### Acceptance Criteria

1. WHEN the system needs user confirmation THEN the system SHALL display a modal dialog instead of a browser alert
2. WHEN a modal dialog is shown THEN the system SHALL dim the background content to focus attention on the dialog
3. WHEN a modal dialog is displayed THEN the system SHALL trap keyboard focus within the dialog
4. WHEN a modal dialog has a confirmation action THEN the system SHALL clearly label the action button (e.g., "Delete", "Confirm", "Yes")
5. WHEN a modal dialog has a cancel action THEN the system SHALL provide a cancel button and allow Escape key to dismiss
6. WHEN a modal dialog is shown THEN the system SHALL prevent interaction with background content until the dialog is dismissed
7. WHEN a modal dialog is dismissed THEN the system SHALL return focus to the element that triggered it
8. WHEN destructive actions are confirmed THEN the system SHALL use warning colors (e.g., red) for the confirm button
9. WHEN modal dialogs are displayed on mobile THEN the system SHALL adapt to smaller screens appropriately

### Requirement 7: Backward Compatibility

**User Story:** As a developer, I want existing functionality to remain unchanged, so that current users don't experience breaking changes.

#### Acceptance Criteria

1. WHEN a repetition block is created from selected steps THEN the system SHALL preserve the existing behavior (no default step added)
2. WHEN the ungroup operation is used THEN the system SHALL continue to work as before (convert block to individual steps)
3. WHEN existing tests are run THEN the system SHALL pass all tests without modification (except for new default step behavior)
4. WHEN existing KRD files are loaded THEN the system SHALL handle them correctly regardless of whether blocks have steps
5. WHEN the API is used programmatically THEN the system SHALL maintain backward compatibility for all existing methods
