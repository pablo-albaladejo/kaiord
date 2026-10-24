## ADDED Requirements

### Requirement: Coach date moves re-date the session match

Whenever the coach-follow step (`applyCoachDateMoves`) writes a new `date` to a converted workout, it SHALL re-date that workout's `SessionMatch` to the same date, stamping `updatedAt`, in the same transaction as the workout write. Writes that only set `coachDate` SHALL NOT touch the match. The coach-follow decision table (coach wins when both moved it to different days) SHALL be unchanged. The result SHALL additionally list, for every overridden athlete move, `{ workoutId, athleteDate, coachDate }`, where `athleteDate` is the workout's date before the write; the list length SHALL equal `overriddenLocalMoves`.

#### Scenario: Coach move moves the matched card

- **GIVEN** a converted, matched workout with `date` and `coachDate` 2026-10-20 and a match dated 2026-10-20
- **WHEN** a sync fetches the activity on 2026-10-23
- **THEN** the workout's `date` and the match's `date` SHALL both be 2026-10-23 and `coachMoves` SHALL be 1

#### Scenario: Overridden athlete move is reported with its day

- **GIVEN** `coachDate` 2026-10-20 and an athlete-moved `date` 2026-10-22
- **WHEN** a sync fetches the activity on 2026-10-24
- **THEN** the workout and match SHALL be dated 2026-10-24, `overriddenLocalMoves` SHALL be 1 and the result SHALL list `athleteDate` 2026-10-22 for that workout

#### Scenario: Unchanged coach date leaves the athlete's move

- **GIVEN** `coachDate` 2026-10-20 and an athlete-moved `date` 2026-10-22
- **WHEN** a sync fetches the activity on 2026-10-20
- **THEN** neither the workout nor the match SHALL be written

### Requirement: Coach-move notice offers Move back

When a sync's result lists overridden athlete moves, the notice state SHALL keep that list, and the coach-move notice SHALL name the athlete's replaced day for up to three of them. Beyond three it SHALL show the remaining count. For each named entry it SHALL offer "Move back to {athleteDate}". "Move back" SHALL be an ordinary athlete move: it SHALL run the same flow as any other move, including the same-sport confirmation, and then `moveSession`. It SHALL NOT pin the date. A later coach move to another day SHALL override it again and SHALL be reported again. An entry SHALL be hidden once it has been used, or whenever the workout's current `date` differs from that entry's `coachDate`. If the workout is no longer movable, the action SHALL be replaced by the block reason. The copy SHALL be static, in en and es. "Move back" SHALL NOT push to any destination.

#### Scenario: Move back restores the athlete's day

- **GIVEN** the notice lists a session whose athlete day 2026-10-22 was replaced by the coach's 2026-10-24
- **WHEN** the user chooses "Move back to 2026-10-22"
- **THEN** the session SHALL be on 2026-10-22, the entry SHALL be hidden, and a later sync whose coach date is still 2026-10-24 SHALL NOT move it

#### Scenario: A later coach move overrides Move back again

- **GIVEN** the athlete used "Move back" to 2026-10-22 and the coach date is 2026-10-24
- **WHEN** a sync fetches the activity on 2026-10-25
- **THEN** the session SHALL be on 2026-10-25 and the notice SHALL report the override of 2026-10-22 again

#### Scenario: Entry hides when the session already moved again

- **GIVEN** a listed entry with `coachDate` 2026-10-24
- **WHEN** the athlete drags the session to 2026-10-23 before using "Move back"
- **THEN** the entry SHALL be hidden

### Requirement: Move a coach session from the coaching dialog

When the `CoachingActivityDialog` opens for a matched session, it SHALL offer "Move to another day", which opens the same date picker as the workout detail and runs `moveSession` for the matched workout. When the session is not movable (an executed slot, or a `completed` activity) the action SHALL be disabled and show the reason ("Already done — it can't be moved"). For a coach plan with no converted workout the dialog SHALL NOT offer a move and SHALL hint that creating the workout first makes it movable. The dialog's existing "open" navigation SHALL be unchanged.

#### Scenario: Move from the dialog

- **GIVEN** the dialog of a movable matched session on Tuesday
- **WHEN** the user chooses "Move to another day", picks Thursday and confirms
- **THEN** the session SHALL render on Thursday

#### Scenario: Done session cannot be moved from the dialog

- **GIVEN** the dialog of a matched session whose coaching activity is `completed`
- **WHEN** the dialog renders
- **THEN** "Move to another day" SHALL be disabled with the reason

#### Scenario: Unconverted plan hints to create first

- **GIVEN** the dialog of a coach plan with no converted workout
- **WHEN** the dialog renders
- **THEN** no move action SHALL be offered and the create-first hint SHALL be shown

### Requirement: Athlete-moved provenance is shown locally

A converted workout whose `date` differs from its `coachDate` SHALL show a "Moved from {coachDate}" chip on its matched card, in the coaching dialog and in the workout detail, with en/es copy and an accessible name carrying the full sentence. The chip SHALL disappear when `date` equals `coachDate` again. A workout without `coachDate` SHALL show no chip.

#### Scenario: Moved session shows its coach day

- **GIVEN** a workout with `coachDate` 2026-10-20 and `date` 2026-10-22
- **WHEN** its card renders
- **THEN** the card SHALL show "Moved from" with the 2026-10-20 day

#### Scenario: Moving back clears the chip

- **WHEN** the same workout is moved back to 2026-10-20
- **THEN** no chip SHALL be shown

### Requirement: Train2Go is not written on a move

Train2Go SHALL be treated as read-only: a technical limitation of Train2Go, not a product choice. A move, a "Move back" or a coach-follow write SHALL NOT call any Train2Go write, SHALL NOT probe for one and SHALL NOT post a day comment; the Train2Go bridge allowlist SHALL stay GET-only. Traceability toward the source SHALL be local only (`coachDate`, the namespaced `sourceId` and the provenance chip).

#### Scenario: A move sends nothing to Train2Go

- **GIVEN** the Train2Go bridge is linked
- **WHEN** the athlete moves a Train2Go-derived session
- **THEN** no message other than the existing read actions SHALL be sent to the Train2Go bridge
