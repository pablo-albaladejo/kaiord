# Requirements Document - Drag-and-Drop Reordering

## Introduction

Enable users to reorder workout steps using drag-and-drop interactions for intuitive workout editing.

## Requirements

### Requirement 3 (Step Reordering)

**User Story:** As a coach, I want to reorder workout steps, so that I can adjust the sequence of intervals

#### Acceptance Criteria

1. WHEN THE user initiates step reordering, THE Workout SPA Editor SHALL enable drag-and-drop functionality for workout steps
2. WHEN THE user drags a workout step, THE Workout SPA Editor SHALL provide visual feedback showing the drop target location
3. WHEN THE user drops a workout step, THE Workout SPA Editor SHALL update the step indices and reorder the workout structure
4. WHEN THE user reorders steps within a repetition block, THE Workout SPA Editor SHALL maintain the block integrity
5. WHEN THE user moves a step between repetition blocks, THE Workout SPA Editor SHALL update both blocks and recalculate step indices

### Requirement 29 (Keyboard Shortcuts)

**User Story:** As a user, I want to use keyboard shortcuts, so that I can work more efficiently

#### Acceptance Criteria (Reordering)

1. WHEN THE user presses Alt+Up with a step selected, THE Workout SPA Editor SHALL move the step up one position
2. WHEN THE user presses Alt+Down with a step selected, THE Workout SPA Editor SHALL move the step down one position
