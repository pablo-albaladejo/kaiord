## ADDED Requirements

### Requirement: TrainingPeaks ledger rows record the pushed day

Every confirmed TrainingPeaks workout export-ledger row SHALL record the payload's `workoutDay` as `destinationDate` (`YYYY-MM-DD`). The single commit patch SHALL write it, on both the created path and the updated path. Rows for other destinations SHALL NOT receive it. Rows without it SHALL stay valid.

#### Scenario: Created and updated paths agree

- **GIVEN** the same TrainingPeaks payload for 2026-10-22
- **WHEN** it is committed once on the created path and once on the updated path
- **THEN** both rows SHALL have `destinationDate` 2026-10-22

#### Scenario: Garmin rows are untouched

- **WHEN** a Garmin workout push commits
- **THEN** its ledger row SHALL have no `destinationDate`

### Requirement: Re-push of a changed TrainingPeaks workout is blocked

TrainingPeaks workouts are create-only for Kaiord, so a re-push always creates a second copy. Before a TrainingPeaks push, the SPA SHALL block the push when a confirmed row exists for the workout and the row's `contentHash` differs from the new payload's hash. The reason SHALL be `moved` when the row's `destinationDate` is defined and differs from the workout's `date`. In every other blocked case the reason SHALL be `changed`. A blocked push SHALL send no workout write (`push-workout`) to the bridge; the read-only session probe still runs, because the payload hash covers the athlete id only the probe provides. It SHALL tell the athlete that TrainingPeaks already has the workout, naming the recorded date when the reason is `moved`, and that sending again creates a second copy. It SHALL offer "Send a copy anyway" behind a confirmation. The confirmation SHALL state that Kaiord will then track only the latest copy and forget the first. An unchanged re-send (equal hash) SHALL stay the existing idempotent skip.

#### Scenario: Moved workout is blocked

- **GIVEN** a workout pushed to TrainingPeaks on Tuesday and then moved to Thursday
- **WHEN** the athlete sends it to TrainingPeaks
- **THEN** no workout write (`push-workout`) SHALL reach the bridge and the message SHALL name Tuesday

#### Scenario: Edited workout is blocked

- **GIVEN** a workout pushed to TrainingPeaks whose steps were edited afterwards, its date unchanged
- **WHEN** the athlete sends it to TrainingPeaks
- **THEN** the push SHALL be blocked with reason `changed`

#### Scenario: Send a copy anyway

- **GIVEN** the blocked push of the moved workout
- **WHEN** the athlete confirms "Send a copy anyway"
- **THEN** exactly one workout write SHALL be sent and the row's `destinationDate` SHALL be Thursday

#### Scenario: Unchanged re-send is skipped

- **GIVEN** a confirmed row whose hash equals the new payload's
- **WHEN** the athlete sends the workout
- **THEN** no workout write SHALL be sent and the outcome SHALL be the existing skip
