## ADDED Requirements

### Requirement: The first-run guide reflects live progress and yields to coaching plans

The first-run guide SHALL mark each step that is already true for the active
profile: a coaching source is linked, an AI provider is configured, and the
Garmin bridge is detected. A step that is done SHALL show that it is done in
place of its call to action. The emphasis SHALL fall on the first step that is
still missing.

The guide SHALL NOT render while the visible week holds coaching plans that no
workout answers yet. Those plans are prose a watch cannot receive, so without an
AI provider the missing-key banner SHALL count them. The week SHALL NOT be
reported as empty while it holds them.

#### Scenario: A done step is ticked

- **GIVEN** a profile with a linked coaching source and no AI provider
- **WHEN** the first-run guide renders
- **THEN** the sources step SHALL be marked done and the AI key step SHALL keep its call to action

#### Scenario: A synced week replaces the guide

- **GIVEN** a profile with no workouts, no AI provider and three coaching plans in the visible week
- **WHEN** the calendar renders
- **THEN** the first-run guide and the empty-week state SHALL NOT render, and the missing-key banner SHALL report three sessions
