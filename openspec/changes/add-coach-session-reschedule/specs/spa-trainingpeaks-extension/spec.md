## ADDED Requirements

### Requirement: Re-push of a moved workout is guarded

Because TrainingPeaks workouts are create-only for Kaiord, a confirmed TrainingPeaks export-ledger row SHALL record the pushed `workoutDay` as `destinationDate`. Before a TrainingPeaks push, the SPA SHALL block it when a confirmed row exists for the workout and either its `destinationDate` differs from the workout's `date`, or it has no `destinationDate` and its `contentHash` differs from the new payload's hash. A blocked push SHALL send no request to the bridge and SHALL tell the athlete that TrainingPeaks still has the workout (on its recorded date when known), that sending again creates a second copy, and offer "Send a copy anyway" behind a confirmation. An unchanged re-send SHALL stay the existing idempotent skip. Moving the TrainingPeaks workout itself is out of scope.

#### Scenario: Moved workout is blocked

- **GIVEN** a workout pushed to TrainingPeaks on Tuesday and then moved to Thursday
- **WHEN** the athlete sends it to TrainingPeaks
- **THEN** no request SHALL reach the bridge and the message SHALL name Tuesday

#### Scenario: Send a copy anyway

- **GIVEN** the blocked push above
- **WHEN** the athlete confirms "Send a copy anyway"
- **THEN** exactly one workout write SHALL be sent and the ledger row's `destinationDate` SHALL be Thursday

#### Scenario: Legacy row with changed content is blocked

- **GIVEN** a confirmed TrainingPeaks row without `destinationDate` whose hash differs from the new payload's
- **WHEN** the athlete sends the workout
- **THEN** the push SHALL be blocked without naming a date
