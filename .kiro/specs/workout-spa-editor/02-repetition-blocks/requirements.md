# Requirements Document - Repetition Blocks Support

## Introduction

This feature adds support for repetition blocks in workouts, allowing users to group multiple steps and repeat them a specified number of times. This is essential for interval training and structured workout programs.

## Glossary

- **Repetition Block**: A group of workout steps that repeat a specified number of times
- **Repeat Count**: The number of times the steps within a block should be repeated (minimum 2)
- **Nested Steps**: Individual workout steps contained within a repetition block

## Requirements

### Requirement 4 (Repetition Blocks)

**User Story:** As a coach, I want to create repetition blocks, so that I can design interval workouts efficiently

#### Acceptance Criteria

1. WHEN THE user creates a repetition block, THE Workout SPA Editor SHALL allow grouping multiple steps and specifying the repeat count (minimum 2)
2. WHEN THE user views a repetition block, THE Workout SPA Editor SHALL visually group the repeated steps and display the repeat count
3. WHEN THE user edits a repetition block, THE Workout SPA Editor SHALL allow changing the repeat count and modifying nested steps
4. WHEN THE user deletes a step from a repetition block, THE Workout SPA Editor SHALL maintain the block structure if other steps remain
5. WHEN THE user deletes the last step in a repetition block, THE Workout SPA Editor SHALL remove the entire repetition block

### Requirement 5 (Workout Statistics with Repetitions)

**User Story:** As an athlete, I want to see accurate workout statistics that include repetition blocks, so that I understand the total training load

#### Acceptance Criteria

1. WHEN THE workout contains repetition blocks, THE Workout SPA Editor SHALL calculate total duration including all repetitions
2. WHEN THE workout contains repetition blocks, THE Workout SPA Editor SHALL calculate total distance including all repetitions
3. WHEN THE workout statistics are displayed, THE Workout SPA Editor SHALL clearly indicate which values include repetitions
4. WHEN THE user changes the repeat count, THE Workout SPA Editor SHALL recalculate statistics in real-time
5. WHEN THE workout contains nested repetition blocks, THE Workout SPA Editor SHALL calculate statistics correctly for all nesting levels
