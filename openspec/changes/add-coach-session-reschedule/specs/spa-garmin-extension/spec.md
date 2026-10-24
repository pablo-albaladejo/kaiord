## ADDED Requirements

### Requirement: Garmin still on its old date

The SPA SHALL derive, from the Garmin export-ledger row and the workout, a date drift that holds iff the row's placement is `Placed` and its date differs from the workout's `date`. While it holds, the workout's calendar card SHALL show a "Garmin: {placed date}" badge, and the workout detail and the coaching dialog SHALL show "Garmin still on {placed date}" with an "Update Garmin" action. "Update Garmin" SHALL run the existing calendar placement push (library unchanged, then schedule on the new date, verify, delete the old entry). Moving a session and syncing a coaching week SHALL NOT push to Garmin. When the Garmin bridge is missing or lacks the calendar features, the state SHALL still show and the action SHALL be disabled with the existing capability reason. After a move of a drifting workout, the success toast SHALL name the Garmin date and carry an "Update Garmin" action. Reading the ledger for the visible week SHALL NOT delay the calendar's first render of the week.

#### Scenario: A move leaves Garmin on the old date

- **GIVEN** a workout placed in Garmin on Tuesday
- **WHEN** the athlete moves it to Thursday
- **THEN** no Garmin call SHALL be made and the card and detail SHALL show that Garmin still has it on Tuesday

#### Scenario: Update Garmin moves the entry

- **GIVEN** the same workout showing "Garmin still on Tuesday" with a capable bridge
- **WHEN** the athlete chooses "Update Garmin"
- **THEN** Garmin SHALL receive a schedule for Thursday before the delete of the Tuesday entry, the ledger's `Placed` date SHALL be Thursday, and the state SHALL clear

#### Scenario: No bridge, no crash

- **GIVEN** a fresh profile with no Garmin bridge and a ledger row placed on Tuesday for a workout now on Thursday
- **WHEN** the detail renders
- **THEN** the state SHALL show and "Update Garmin" SHALL be disabled with the capability reason
