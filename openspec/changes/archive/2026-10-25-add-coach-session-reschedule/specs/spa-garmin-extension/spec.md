## ADDED Requirements

### Requirement: Garmin still on its old date

From the Garmin export-ledger row and the workout, the SPA SHALL derive a date drift. The drift holds only when the row's placement is a `Placed` (`scheduled` or `unconfirmed`) whose date differs from the workout's `date`; it is `placed` for a `scheduled` placement and `unconfirmed` for an `unconfirmed` one. `attempting` and `uncertain` rows, no row, and a locked session (a match with an executed recording, or a `completed` activity) SHALL give no drift; the existing placement notice covers those. While a drift holds, the workout's calendar card SHALL show a Garmin badge with the placed date. The workout detail and the coaching dialog SHALL show "Garmin still on {placed date}" for `placed`, or "Garmin may still be on {placed date}" for `unconfirmed`, together with an "Update Garmin" action. "Update Garmin" SHALL run the existing calendar placement push: the library is unchanged, then the workout is scheduled on the new date, verified, and the old entry is deleted. Moving a session and syncing a coaching week SHALL NOT push to Garmin. When the Garmin bridge is missing or lacks the calendar features, the state SHALL still show and the action SHALL be disabled with the existing capability reason. After a move of a drifting workout, the success toast SHALL name the Garmin date and carry an "Update Garmin" action. Reading the ledger for the visible week SHALL NOT delay the calendar's first render of the week.

#### Scenario: A move leaves Garmin on the old date

- **GIVEN** a workout placed in Garmin on Tuesday
- **WHEN** the athlete moves it to Thursday
- **THEN** no Garmin call SHALL be made and the card and detail SHALL show that Garmin still has it on Tuesday

#### Scenario: A done session shows no Garmin drift

- **GIVEN** a workout placed in Garmin on Tuesday whose session is locked, and a coach move of the workout to Thursday
- **WHEN** the card and the detail render
- **THEN** no Garmin drift badge, no "Garmin still on" state and no "Update Garmin" action SHALL show

#### Scenario: Unconfirmed placement uses the softer copy

- **GIVEN** a workout whose Garmin placement on Tuesday is `unconfirmed`, moved to Thursday
- **WHEN** the detail renders
- **THEN** it SHALL read "Garmin may still be on" Tuesday and offer "Update Garmin"

#### Scenario: Update Garmin moves the entry

- **GIVEN** the same workout showing "Garmin still on Tuesday" with a capable bridge
- **WHEN** the athlete chooses "Update Garmin"
- **THEN** Garmin SHALL receive a schedule for Thursday before the delete of the Tuesday entry, the ledger's `Placed` date SHALL be Thursday, and the state SHALL clear

#### Scenario: No bridge, no crash

- **GIVEN** a fresh profile with no Garmin bridge and a ledger row placed on Tuesday for a workout now on Thursday
- **WHEN** the detail renders
- **THEN** the state SHALL show and "Update Garmin" SHALL be disabled with the capability reason
