## MODIFIED Requirements

### Requirement: Manual surfaces are canonical for mutating a scheduled workout

The workout detail, the editor and their dialogs SHALL be the canonical surfaces for changing a scheduled workout. The conversation SHALL be an accelerator that calls the same use cases (`moveSession`, `saveWorkoutEdits`, `workouts.delete`) rather than a separate write path. Calendar cards SHALL carry no mutation buttons. Dragging a card to another day — a solo workout card or a movable matched (coach) session card — SHALL be the only direct mutation on a calendar card; the coach-move notice's "Move back" and the toast actions SHALL call the same use cases. Dragging SHALL have a keyboard alternative: "Move to another day" in the detail's "More options" menu and in the coaching dialog, both of which run `moveSession`.

#### Scenario: Move a workout with the keyboard

- **GIVEN** a scheduled workout's detail view
- **WHEN** the user opens "More options" with the keyboard, chooses "Move to another day", enters a date and confirms
- **THEN** the workout SHALL move to that day through `moveSession`, and its card SHALL appear on the new day after a reload

#### Scenario: Move a workout deleted meanwhile

- **WHEN** the workout no longer exists as the move is confirmed
- **THEN** `moveSession` SHALL throw `WorkoutNotFoundError`, the user SHALL be told the workout no longer exists, and the detail SHALL show "Workout not found"

## ADDED Requirements

### Requirement: moveSession is the single athlete date writer

`moveSession({ workoutId, targetDay })` SHALL be the only use case through which the athlete changes a workout's date. Inside one persistence transaction it SHALL re-read the workout, take the profile from the re-read workout's `profileId`, write `date = targetDay` and `updatedAt = now`, and, when the workout has a `SessionMatch`, re-date that match to `targetDay` with the same `updatedAt`. It SHALL leave `coachDate`, `state`, `modifiedAt`, `garminPushId` and `krd` untouched. It SHALL return `unchanged` and write nothing when `targetDay` equals the current date. This same-day check SHALL run before the executed and completed checks, on purpose, so that a same-day call for a done session returns `unchanged` and does not throw. Otherwise it MUST throw `SessionNotMovableError` with reason `executed` when the workout's match has at least one executed workout id, or when the workout is itself an executed recording held in some match's `executedWorkoutIds`; and with reason `completed` when the matched coaching activity's status is `completed`. In each of these cases nothing SHALL be written. It MUST throw `WorkoutNotFoundError` when the workout no longer exists. It SHALL NOT call any bridge.

#### Scenario: Moving a matched session re-dates the match

- **GIVEN** a workout on 2026-10-20 with `coachDate` 2026-10-20 and a `SessionMatch` dated 2026-10-20 with no executed ids
- **WHEN** `moveSession` moves it to 2026-10-22
- **THEN** the workout's `date` SHALL be 2026-10-22, its `coachDate` SHALL stay 2026-10-20, its `updatedAt` SHALL be bumped, and the match's `date` SHALL be 2026-10-22 with the same `updatedAt`

#### Scenario: A done session is not moved

- **GIVEN** a matched session whose match has one executed workout id
- **WHEN** `moveSession` is called for it
- **THEN** it SHALL throw `SessionNotMovableError` with reason `executed` and neither the workout nor the match SHALL change

#### Scenario: A recording held by a match is not moved

- **GIVEN** a recording whose id is in a match's `executedWorkoutIds`
- **WHEN** `moveSession` is called for the recording from its detail page
- **THEN** it SHALL throw `SessionNotMovableError` with reason `executed` and nothing SHALL be written

#### Scenario: Moving to the same day writes nothing

- **WHEN** `moveSession` is called with the workout's current date
- **THEN** it SHALL return `unchanged` and `updatedAt` SHALL NOT change

#### Scenario: Same day for a done session returns unchanged

- **GIVEN** a matched session whose match has an executed workout id
- **WHEN** `moveSession` is called with the workout's current date
- **THEN** it SHALL return `unchanged`, SHALL NOT throw `SessionNotMovableError`, and SHALL write nothing

### Requirement: A moved session renders on its new day

The calendar SHALL bucket a matched session by its `SessionMatch.date`, which is the session's effective date. After `moveSession`, a coach move or a heal commits, the matched card SHALL render only on the new day, and neither a matched card nor a solo card of its workout SHALL render on the old day. The week view SHALL also load, through the `[profileId+coachingActivityId]` index, the matches of the visible week's coaching activities, whatever their date. It SHALL hide those activities' solo plan cards without rendering the matches in that week, and it SHALL hide, as solo cards, those matches' `workoutId` and `executedWorkoutIds`. The Daily view SHALL apply the same rule.

#### Scenario: Athlete-moved session

- **GIVEN** a matched session moved from Tuesday to Thursday of the same week
- **WHEN** the week renders
- **THEN** the matched card SHALL be on Thursday only and no solo card for its workout SHALL appear on either day

#### Scenario: Coach-moved session

- **GIVEN** a matched session the athlete never moved
- **WHEN** a Train2Go sync moves it from Tuesday to Friday
- **THEN** the matched card SHALL be on Friday only

#### Scenario: Session moved into the next week

- **GIVEN** a matched session whose coach activity is on Sunday of week 1, moved to Monday of week 2
- **WHEN** week 1 renders
- **THEN** no solo coach plan card and no matched card for it SHALL appear on Sunday
- **AND WHEN** week 2 renders
- **THEN** the matched card SHALL appear on Monday

#### Scenario: Locked match coach-moved into the next week

- **GIVEN** a coach-built workout with an executed recording, its locked match dated Tuesday of week 1, and a coach move of the workout to Thursday of week 2
- **WHEN** week 2 renders, in the Grid and in the Daily view of Thursday
- **THEN** no solo card for the workout or its recording SHALL appear, and the matched card SHALL stay on Tuesday of week 1

### Requirement: Drag to reschedule a coach session in the Grid view

In the Grid view a `MatchedSessionCard` SHALL be draggable to another day when its session is movable: it has no executed slot, its coaching activity is not `completed`, and its workout is not projected. A drop SHALL call `moveSession`. A card whose session is not movable SHALL NOT get a drag binding. A `CoachingActivityCard` (a coach plan not yet converted to a workout) SHALL NOT be draggable. The List view SHALL keep having no drag.

#### Scenario: Drag a coach session to another day

- **GIVEN** a movable matched session on Tuesday in the Grid view
- **WHEN** the user drags its card to Thursday
- **THEN** the card SHALL render on Thursday and stay there after a reload

#### Scenario: A done session cannot be dragged

- **GIVEN** a matched session with an executed recording
- **WHEN** the user presses and drags its card
- **THEN** no drag SHALL start and the session SHALL stay on its day

#### Scenario: Unconverted coach plan is not draggable

- **WHEN** the user presses and drags a `CoachingActivityCard`
- **THEN** no drag SHALL start

### Requirement: Same-sport target asks before moving

Before any athlete move (drag, dialog, detail, "Move back"), the UI SHALL check the target day for a session of the same canonical sport. It SHALL count the target day's matched sessions, solo workouts and unmatched solo coach plans, and SHALL exclude the moved workout and its own match. A target day inside the visible week SHALL be checked from that week's buckets. A target day outside it SHALL be checked with the `[profileId+date]` indexes of `sessionMatches`, `workouts` and `coachingActivities`. When the check finds a session, the UI SHALL ask for confirmation, and cancelling SHALL write nothing. When the same-sport session on the target day is an executed recording, the prompt SHALL also say that the recording will be linked to the moved session, which will then be locked against further moves. A target day holding only other sports SHALL be accepted without a prompt.

#### Scenario: Matched session of the same sport

- **GIVEN** Thursday holds a matched run session
- **WHEN** the user moves another run session onto Thursday and cancels the prompt
- **THEN** nothing SHALL be written

#### Scenario: Solo recording of the same sport

- **GIVEN** Thursday holds a solo run recording
- **WHEN** the user moves a run session onto Thursday
- **THEN** the prompt SHALL say the recording will be linked and the session locked

#### Scenario: Solo coach plan of the same sport

- **GIVEN** Thursday holds an unmatched coach plan for a run
- **WHEN** the user moves a run session onto Thursday
- **THEN** the prompt SHALL be shown

#### Scenario: Target outside the visible week

- **GIVEN** the visible week is week 1 and Monday of week 2 holds a solo run workout
- **WHEN** the user picks that Monday for a run session in the dialog
- **THEN** the prompt SHALL be shown

#### Scenario: Different sport moves without a prompt

- **GIVEN** Thursday holds only a swim
- **WHEN** the user moves a run session onto Thursday
- **THEN** no prompt SHALL be shown and the session SHALL move
