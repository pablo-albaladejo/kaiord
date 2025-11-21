# Requirements Document

## Introduction

This specification addresses a bug in the step selection functionality of the Workout SPA Editor. When a user selects a workout step (e.g., Step 1), all steps with the same `stepIndex` value are incorrectly selected simultaneously. This occurs because steps inside repetition blocks have their own `stepIndex` values that start from 0 or 1, creating ID collisions with steps in the main workout sequence.

For example:

- Main workout has Step 1 (stepIndex: 1)
- Repetition Block A contains Step 1 (stepIndex: 1)
- Repetition Block B contains Step 1 (stepIndex: 1)

When the user clicks on the main workout's Step 1, all three steps are selected because they all generate the same ID: `step-1`.

## Glossary

- **stepIndex**: A property within WorkoutStep that indicates the step's logical position within its container (main workout or repetition block)
- **Step ID**: A unique identifier used to track step selection state in the UI
- **Repetition Block**: A container that groups multiple workout steps to be repeated a specified number of times
- **Selection State**: The UI state that tracks which step(s) are currently selected by the user
- **ID Collision**: When multiple distinct steps generate the same identifier, causing unintended behavior

## Requirements

### Requirement 1

**User Story:** As a user selecting workout steps, I want only the clicked step to be selected, so that I can edit or interact with a single specific step.

#### Acceptance Criteria

1. WHEN a user clicks on a step in the main workout THEN only that step SHALL be selected
2. WHEN a user clicks on a step inside a repetition block THEN only that specific step SHALL be selected
3. WHEN multiple steps have the same stepIndex value THEN clicking one step SHALL NOT select the others
4. WHEN a step is selected THEN the visual selection indicator SHALL appear only on that step

### Requirement 2

**User Story:** As a developer, I want each step to have a globally unique ID, so that the selection system can distinguish between steps with the same stepIndex.

#### Acceptance Criteria

1. WHEN generating IDs for steps in the main workout THEN the system SHALL create IDs that are unique across the entire workout
2. WHEN generating IDs for steps inside repetition blocks THEN the system SHALL include the parent block's identifier in the step ID
3. WHEN two steps have the same stepIndex but different parents THEN the system SHALL generate different IDs for them
4. WHEN comparing step IDs THEN the ID format SHALL clearly indicate the step's location in the workout hierarchy

### Requirement 3

**User Story:** As a user working with repetition blocks, I want to select steps independently within each block, so that I can edit steps without affecting other blocks.

#### Acceptance Criteria

1. WHEN a repetition block contains multiple steps THEN each step SHALL have a unique ID within the block
2. WHEN multiple repetition blocks exist THEN steps with the same stepIndex in different blocks SHALL have different IDs
3. WHEN selecting a step in Block A THEN steps in Block B SHALL remain unselected
4. WHEN the workout contains nested structures THEN the ID generation SHALL maintain uniqueness at all levels

### Requirement 4

**User Story:** As a QA engineer, I want tests to verify unique step selection, so that ID collision bugs are caught automatically.

#### Acceptance Criteria

1. WHEN tests simulate step selection THEN the tests SHALL verify that only one step is selected
2. WHEN tests check selection state THEN the tests SHALL verify that steps with the same stepIndex in different contexts have different IDs
3. WHEN tests run with repetition blocks THEN the tests SHALL verify that selecting a step in one block does not affect other blocks
4. WHEN tests inspect the DOM THEN the tests SHALL verify that all step IDs are unique across the entire workout

### Requirement 5

**User Story:** As a user performing multi-selection with modifier keys, I want to select multiple specific steps, so that I can perform batch operations on my chosen steps.

#### Acceptance Criteria

1. WHEN a user holds Cmd/Ctrl and clicks multiple steps THEN only the clicked steps SHALL be added to the selection
2. WHEN using multi-selection with repetition blocks THEN the system SHALL correctly identify each selected step by its unique ID
3. WHEN multi-selecting steps with the same stepIndex THEN the system SHALL only select the steps that were explicitly clicked
4. WHEN clearing multi-selection THEN all selected steps SHALL be deselected regardless of their location in the workout
