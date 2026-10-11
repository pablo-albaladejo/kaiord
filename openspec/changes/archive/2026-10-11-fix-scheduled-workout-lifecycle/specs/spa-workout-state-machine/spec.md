## MODIFIED Requirements

### Requirement: PUSHED to MODIFIED transition on edit

A PUSHED workout that is edited SHALL transition to MODIFIED, indicating it needs re-pushing. Edits to a persisted workout SHALL be saved explicitly ("Save changes") through the `saveWorkoutEdits` use case, which re-reads the row in one transaction: a field changed meanwhile by another writer SHALL be kept, and a workout deleted meanwhile SHALL stay deleted. While the draft differs from the last loaded or saved copy, leaving the editor SHALL ask first.

#### Scenario: Edit a pushed workout

- **WHEN** the user edits the KRD of a PUSHED workout and saves
- **THEN** the state SHALL transition to `modified` and `modifiedAt` SHALL be updated

#### Scenario: Save without Garmin

- **WHEN** the user adds a step to a scheduled workout, saves and reloads, with no Garmin extension installed
- **THEN** the workout SHALL have the added step, and the editor SHALL no longer report unsaved changes

#### Scenario: Re-push a modified workout

- **WHEN** the user pushes a MODIFIED workout to Garmin Connect
- **THEN** the state SHALL transition to `pushed` and `garminPushId` SHALL be updated
