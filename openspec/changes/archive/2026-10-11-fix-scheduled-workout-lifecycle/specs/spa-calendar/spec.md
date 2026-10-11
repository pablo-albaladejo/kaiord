## MODIFIED Requirements

### Requirement: Workout cards with state indicators

Each workout on the calendar SHALL be displayed as a card showing its title, sport, duration/distance, origin, and a state indicator. The title SHALL be the workout name in its KRD, else the imported title, else the localized sport name. The origin SHALL be named in words in the active language (for example "Kaiord" for a workout made in the editor), never as a raw source identifier. When the import states no duration, the card SHALL show the duration its structure adds up to, if computable. State indicators SHALL follow this visual priority order: STALE (orange) > MODIFIED > RAW (warning) > STRUCTURED > READY (star) > PUSHED (check) > SKIPPED.

#### Scenario: RAW workout card

- **WHEN** a workout with state `raw` is displayed on the calendar
- **THEN** the card SHALL show a warning indicator (⚠️), the workout title, sport icon, and the source name

#### Scenario: PUSHED workout card

- **WHEN** a workout with state `pushed` is displayed on the calendar
- **THEN** the card SHALL show a check indicator (✓), the workout title, sport icon, step count, and estimated duration

#### Scenario: Workout scheduled from the editor

- **GIVEN** a workout named "Tempo" scheduled from the editor, with no imported duration
- **WHEN** it is displayed on the calendar
- **THEN** the card SHALL be titled "Tempo", name its origin as "Kaiord" rather than `scratch`, and show the duration of its steps

### Requirement: Click interactions on calendar

Clicking a workout card SHALL open that workout's read-only detail view at `/workout/view/:id`, carrying the originating week so Back returns to it; editing is one step further, from the detail. A RAW or SKIPPED workout card, or a projected activity with no persisted workout, SHALL preview in place instead. Clicking a coaching activity card SHALL open a `CoachingActivityDialog` modal (see `spa-coaching-integration`) — the prior in-place description toggle is replaced. Clicking an empty day SHALL offer options to add a workout.

#### Scenario: Click a structured workout

- **WHEN** the user clicks the card of a STRUCTURED, READY, PUSHED or MODIFIED workout
- **THEN** the system SHALL navigate to `/workout/view/:id?from=calendar&week=<weekId>`

#### Scenario: Click RAW workout

- **WHEN** the user clicks a RAW workout card
- **THEN** the system SHALL open the raw workout dialog in place, showing the coach's description and its actions ("Process with AI", "Skip")

#### Scenario: Click coaching activity card

- **WHEN** the user clicks a coaching activity card (T2G or other source)
- **THEN** the system SHALL open the `CoachingActivityDialog` for that activity (no in-place toggle, no editor navigation)

#### Scenario: Click empty day

- **WHEN** the user clicks an empty calendar day
- **THEN** the system SHALL offer "Add from Library" and "Create new workout" options, with the date pre-filled

## ADDED Requirements

### Requirement: Manual surfaces are canonical for mutating a scheduled workout

The workout detail, the editor and their dialogs SHALL be the canonical surfaces for changing a scheduled workout. The conversation SHALL be an accelerator that calls the same use cases (`rescheduleWorkout`, `saveWorkoutEdits`, `workouts.delete`) rather than a separate write path. Calendar cards SHALL carry no mutation buttons. Dragging a card to another day SHALL be the only direct mutation on the calendar, and it SHALL have a keyboard alternative in the detail: "Move to another day" in its "More options" menu, which runs `rescheduleWorkout`.

#### Scenario: Move a workout with the keyboard

- **GIVEN** a scheduled workout's detail view
- **WHEN** the user opens "More options" with the keyboard, chooses "Move to another day", enters a date and confirms
- **THEN** the workout SHALL move to that day through `rescheduleWorkout`, and its card SHALL appear on the new day after a reload

#### Scenario: Move a workout deleted meanwhile

- **WHEN** the workout no longer exists as the move is confirmed
- **THEN** `rescheduleWorkout` SHALL throw `WorkoutNotFoundError`, the user SHALL be told the workout no longer exists, and the detail SHALL show "Workout not found"

### Requirement: Delete a scheduled workout with Undo

The detail's "More options" SHALL offer "Delete workout". Deleting SHALL ask for confirmation, delete through the tombstoning persistence port, return to the previous surface and offer Undo for 10 seconds. Undo SHALL write the workout back with an `updatedAt` later than its tombstone's `deletedAt`, stamped by the use case, so the restored row survives a merge with its own tombstone. Deleting SHALL NOT queue or send any Garmin removal and SHALL leave the Garmin export ledger as it is; when the workout is on the Garmin calendar, the confirmation SHALL say it is not deleted there.

#### Scenario: Undo a delete

- **WHEN** the user deletes a workout and chooses Undo within 10 seconds
- **THEN** the workout SHALL be back on the calendar, and still there after a reload

#### Scenario: Delete holds after a reload

- **WHEN** the user deletes a workout and does not undo
- **THEN** its card SHALL be gone after a reload

### Requirement: Unknown workout id

`/workout/:id` and `/workout/view/:id` SHALL show "Workout not found" with a way back to the calendar once the record lookup settles without a record, instead of loading indefinitely.

#### Scenario: Unknown id

- **WHEN** the user opens either route with an id that matches no workout
- **THEN** the page SHALL say "Workout not found" within 2 seconds
