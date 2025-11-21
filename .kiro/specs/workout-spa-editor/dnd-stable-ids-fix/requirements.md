# Requirements Document

## Introduction

This specification addresses two bugs in the drag-and-drop (DnD) functionality of the Workout SPA Editor:

1. **Content Swap Bug**: When users drag and drop workout step cards, the cards appear to swap content instead of physically swapping positions. This occurs because the DnD system uses content-based IDs (derived from `stepIndex`) rather than position-based IDs, causing React to incorrectly reconcile DOM elements after reordering.

2. **Repetition Block Visual Bug**: When dragging repetition block cards, the drag preview appears compressed/squashed during the drag operation. The blocks function correctly when dropped, but the visual feedback during dragging is incorrect.

## Glossary

- **DnD**: Drag-and-Drop functionality using @dnd-kit library
- **Stable ID**: An identifier that remains constant for a DOM element regardless of content changes
- **stepIndex**: A property within WorkoutStep that indicates the step's logical position in the workout
- **Position-based ID**: An ID derived from the element's position in the array, not from its content
- **Content-based ID**: An ID derived from properties within the element's data (e.g., stepIndex)

## Requirements

### Requirement 1

**User Story:** As a user dragging workout steps, I want the cards to physically swap positions, so that the visual feedback matches the actual reordering operation.

#### Acceptance Criteria

1. WHEN a user drags a workout step card over another card THEN the cards SHALL physically swap positions in the DOM
2. WHEN a user releases a dragged card THEN the card SHALL remain in its new position without content swapping
3. WHEN the reorder operation completes THEN the workout data SHALL reflect the new order with correctly updated stepIndex values
4. WHEN React reconciles the DOM after reordering THEN each card element SHALL maintain its identity based on array position, not content

### Requirement 2

**User Story:** As a developer, I want the DnD system to use stable, position-based IDs, so that React can correctly track element identity during reordering.

#### Acceptance Criteria

1. WHEN generating IDs for sortable items THEN the system SHALL use the array index as the primary identifier
2. WHEN a step's content changes (including stepIndex) THEN the DOM element's ID SHALL remain stable if its array position hasn't changed
3. WHEN steps are reordered THEN the ID generation SHALL produce IDs that reflect the new array positions
4. WHEN rendering workout items THEN the key prop SHALL use the position-based ID to ensure correct React reconciliation

### Requirement 3

**User Story:** As a user dragging repetition block cards, I want the drag preview to maintain the correct dimensions, so that I have accurate visual feedback during the drag operation.

#### Acceptance Criteria

1. WHEN a user drags a repetition block card THEN the drag overlay SHALL maintain the same dimensions as the original card
2. WHEN dragging a repetition block THEN the preview SHALL not appear compressed or squashed
3. WHEN a repetition block is dropped THEN it SHALL maintain its correct dimensions in the final position
4. WHEN comparing drag previews THEN both workout steps and repetition blocks SHALL have consistent visual treatment

### Requirement 4

**User Story:** As a QA engineer, I want E2E tests to verify correct DnD behavior, so that regressions in drag-and-drop functionality are caught automatically.

#### Acceptance Criteria

1. WHEN E2E tests perform drag-and-drop operations THEN the tests SHALL verify that cards physically swap positions
2. WHEN E2E tests check the final state THEN the tests SHALL verify that the workout data reflects the correct order
3. WHEN E2E tests inspect DOM elements THEN the tests SHALL verify that element IDs are stable and position-based
4. WHEN E2E tests run after the fix THEN all drag-and-drop tests SHALL pass consistently
