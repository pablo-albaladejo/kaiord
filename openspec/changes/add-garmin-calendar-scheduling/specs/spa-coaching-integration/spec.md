## ADDED Requirements

### Requirement: Coaching-built workouts record the coach's date

Every builder that creates a workout from a coaching activity — the AI conversion, the manual template and the persisted draft — SHALL set `WorkoutRecord.coachDate` to the activity's date. `coachDate` is the baseline against which a later coach move is detected; it SHALL NOT be edited by the athlete.

#### Scenario: Each builder sets the baseline

- **WHEN** a workout is created from a coaching activity dated D by any of the three builders
- **THEN** the new record's `coachDate` SHALL be D

### Requirement: Coach date moves follow the coach

After a Train2Go week sync upserts its activities, `persistSyncedWeek` SHALL run `applyCoachDateMoves` over the workouts converted from those activities. The baseline SHALL be `workout.coachDate`, else the pre-upsert activity's date; when neither exists it SHALL set `coachDate` to the fetched date and stop.

| Situation                                                  | Action                                                |
| ---------------------------------------------------------- | ----------------------------------------------------- |
| fetched date equals the baseline                           | set `coachDate` if missing; keep `date`               |
| the coach moved it; `date` equals the baseline             | move `date` to the fetched date; `coachMoves++`       |
| the coach moved it; `date` already equals the fetched date | set `coachDate` only; no notice                       |
| both moved it, to different days                           | the coach wins: move `date`; `overriddenLocalMoves++` |

Each write SHALL re-read the record, bump `updatedAt`, and leave `modifiedAt` and `state` untouched. `SyncWeekResult` SHALL gain `coachMoves` and `overriddenLocalMoves`, shown with static copy in en and es. A coaching activity that was never converted SHALL cause 0 writes. A move into another week SHALL be applied when that week syncs. An editor saving after a coach move SHALL keep the coach's date.

#### Scenario: The coach moved a session the athlete did not

- **GIVEN** a converted workout whose `date` equals its `coachDate` D1
- **WHEN** a sync fetches the activity on D2
- **THEN** `date` and `coachDate` SHALL both become D2, `updatedAt` SHALL be bumped, `modifiedAt` and `state` SHALL be unchanged, and `coachMoves` SHALL be 1

#### Scenario: The athlete moved a session the coach did not

- **GIVEN** a converted workout with `coachDate` D1 that the athlete moved to D3
- **WHEN** repeated syncs fetch the activity on D1
- **THEN** they SHALL make 0 writes

#### Scenario: Both moved it to different days

- **GIVEN** `coachDate` D1 and `date` D3
- **WHEN** a sync fetches the activity on D2
- **THEN** `date` SHALL become D2, `overriddenLocalMoves` SHALL be 1, and the notice SHALL show
