## ADDED Requirements

### Requirement: The first-run guide reflects live progress and yields to coaching plans

The first-run guide SHALL mark each step that is already true for the active
profile: a coaching source is linked on the profile (its `linkedAccounts`, not a
bridge session), an AI provider is configured, and the Garmin bridge is
detected. A step that is done SHALL show that it is done in
place of its call to action. The emphasis SHALL fall on the first step that is
still missing.

The guide is for a profile that has not started, so it SHALL render only while the
profile holds no workout and no coaching plan in any week. A coached profile
browsing a week without plans SHALL see the empty-week state instead. While it
is not yet known whether the profile holds plans, neither the guide nor the
empty-week state SHALL render, so the guide never flashes. The guide SHALL NOT
render while the visible week holds coaching plans that no workout answers yet. Those plans are prose a watch cannot receive, so without an
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

#### Scenario: A coached profile does not see the guide on a week without plans

- **GIVEN** a profile with no workouts and a coaching plan two weeks ago
- **WHEN** the calendar renders the current week
- **THEN** the empty-week state SHALL render and the first-run guide SHALL NOT

#### Scenario: A bridge session alone does not tick the sources step

- **GIVEN** a signed-in Train2Go session and a profile with no linked account
- **WHEN** the first-run guide renders
- **THEN** the sources step SHALL keep its call to action
