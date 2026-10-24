## MODIFIED Requirements

### Requirement: Manual surfaces are canonical for mutating a scheduled workout

The workout detail, the editor and their dialogs SHALL be the canonical surfaces for changing a scheduled workout. The conversation SHALL be an accelerator that calls the same use cases (`moveSession`, `saveWorkoutEdits`, `workouts.delete`) rather than a separate write path. Calendar cards SHALL carry no mutation buttons. Dragging a card to another day SHALL be the only direct mutation on the calendar, for solo workout cards and for movable matched (coach) session cards, and it SHALL have a keyboard alternative: "Move to another day" in the detail's "More options" menu and in the coaching dialog, both of which run `moveSession`.

#### Scenario: Move a workout with the keyboard

- **GIVEN** a scheduled workout's detail view
- **WHEN** the user opens "More options" with the keyboard, chooses "Move to another day", enters a date and confirms
- **THEN** the workout SHALL move to that day through `moveSession`, and its card SHALL appear on the new day after a reload

#### Scenario: Move a workout deleted meanwhile

- **WHEN** the workout no longer exists as the move is confirmed
- **THEN** `moveSession` SHALL throw `WorkoutNotFoundError`, the user SHALL be told the workout no longer exists, and the detail SHALL show "Workout not found"

## ADDED Requirements

### Requirement: moveSession is the single athlete date writer

`moveSession({ profileId, workoutId, targetDay })` SHALL be the only use case through which the athlete changes a workout's date. Inside one persistence transaction it SHALL re-read the workout, write `date = targetDay` and `updatedAt = now`, and, when the workout has a `SessionMatch`, re-date that match to `targetDay` with the same `updatedAt`. It SHALL leave `coachDate`, `state`, `modifiedAt`, `garminPushId` and `krd` untouched. It SHALL return `unchanged` and write nothing when `targetDay` equals the current date. It MUST throw `SessionNotMovableError` with reason `executed` when the match has at least one executed workout id, and with reason `completed` when the matched coaching activity's status is `completed`; in both cases nothing SHALL be written. It MUST throw `WorkoutNotFoundError` when the workout no longer exists. It SHALL NOT call any bridge.

#### Scenario: Moving a matched session re-dates the match

- **GIVEN** a workout on 2026-10-20 with `coachDate` 2026-10-20 and a `SessionMatch` dated 2026-10-20 with no executed ids
- **WHEN** `moveSession` moves it to 2026-10-22
- **THEN** the workout's `date` SHALL be 2026-10-22, its `coachDate` SHALL stay 2026-10-20, its `updatedAt` SHALL be bumped, and the match's `date` SHALL be 2026-10-22 with the same `updatedAt`

#### Scenario: A done session is not moved

- **GIVEN** a matched session whose match has one executed workout id
- **WHEN** `moveSession` is called for it
- **THEN** it SHALL throw `SessionNotMovableError` with reason `executed` and neither the workout nor the match SHALL change

#### Scenario: Moving to the same day writes nothing

- **WHEN** `moveSession` is called with the workout's current date
- **THEN** it SHALL return `unchanged` and `updatedAt` SHALL NOT change

### Requirement: A moved session renders on its new day

The calendar SHALL bucket a matched session by its `SessionMatch.date`, which is the session's effective date. After `moveSession` or a coach move commits, the matched card SHALL render only on the new day; no matched card and no solo duplicate of its workout SHALL render on the old day.

#### Scenario: Athlete-moved session

- **GIVEN** a matched session moved from Tuesday to Thursday
- **WHEN** the week renders
- **THEN** the matched card SHALL be on Thursday only and no solo card for its workout SHALL appear on either day

#### Scenario: Coach-moved session

- **GIVEN** a matched session the athlete never moved
- **WHEN** a Train2Go sync moves it from Tuesday to Friday
- **THEN** the matched card SHALL be on Friday only

### Requirement: Drag to reschedule a coach session in the Grid view

In the Grid view a `MatchedSessionCard` SHALL be draggable to another day when its session is movable: it has no executed slot, its coaching activity is not `completed`, and its workout is not projected. A drop SHALL call `moveSession`. A card whose session is not movable SHALL NOT get a drag binding. A `CoachingActivityCard` (a coach plan not yet converted to a workout) SHALL NOT be draggable. When the target day already holds a session of the same canonical sport (excluding the moved one), the UI SHALL ask for confirmation before calling `moveSession`; cancelling SHALL revert the drop and write nothing. A target day holding only other sports SHALL be accepted without a prompt. The List view SHALL keep having no drag.

#### Scenario: Drag a coach session to another day

- **GIVEN** a movable matched session on Tuesday in the Grid view
- **WHEN** the user drags its card to Thursday
- **THEN** the card SHALL render on Thursday and stay there after a reload

#### Scenario: A done session cannot be dragged

- **GIVEN** a matched session with an executed recording
- **WHEN** the user presses and drags its card
- **THEN** no drag SHALL start and the session SHALL stay on its day

#### Scenario: Same-sport target asks first

- **GIVEN** Thursday already holds a run and the user drags a matched run session onto Thursday
- **WHEN** the confirmation appears and the user cancels
- **THEN** the session SHALL stay on its original day and nothing SHALL be written

#### Scenario: Unconverted coach plan is not draggable

- **WHEN** the user presses and drags a `CoachingActivityCard`
- **THEN** no drag SHALL start
