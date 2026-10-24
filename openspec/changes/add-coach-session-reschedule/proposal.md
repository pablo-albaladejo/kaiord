## Why

The athlete needs to move a session to another day, coach sessions included,
and still know where the session came from. Today that does not work for the
sessions that matter most.

- **A coach session cannot be moved from the calendar.** Drag is wired only
  for solo workouts. `MatchedSessionCard` and `CoachingActivityCard` get a
  click handler and nothing else (`day-column-cards.tsx:46-61`). The coaching
  dialog's "open" goes to the editor, which has no Move.
- **A move made from the workout detail is invisible.** `rescheduleWorkout`
  writes only `WorkoutRecord.date`. The matched card is bucketed by
  `SessionMatch.date` (`calendar-buckets.ts:65`), which no writer ever
  updates, so the card stays on the coach's day and the moved workout is
  suppressed on its new one (`:60,70`). Executed auto-link also keys on
  `match.date` (`match-executed-workouts.ts:43`), so a recording made on the
  new day never joins the session.
- **The same bug follows a coach move.** `applyCoachDateMoves` moves
  `workout.date` but not `match.date`, so the "1 session moved to the coach's
  new date" notice shows while the card stays where it was.
- **A move may not reach other devices.** `rescheduleWorkout` does not bump
  `updatedAt`. Cloud sync merges newest-`updatedAt` first and its change token
  reads `max(updatedAt)`, so a move can be skipped by auto-push and undone by
  an older remote copy.
- **Nothing tells the athlete what is still on the old day elsewhere.** Garmin
  is re-placed only on the next send, and TrainingPeaks has a create-only API:
  sending a moved workout again creates a second TrainingPeaks workout.

## What Changes

- **One date writer, `moveSession`.** It replaces `rescheduleWorkout`. In one
  transaction it re-reads the workout, writes `date`, bumps `updatedAt` and
  re-dates the workout's `SessionMatch`. It refuses a session that has
  already been done. `WorkoutRecord.date` is the effective date.
  `coachDate` and the coaching activity's `date` are left alone and form the
  trace.
- **Matches carry an effective date and a clock.** `SessionMatch.date`
  becomes the session's effective date. It gains an optional `updatedAt`, so a
  re-dated match wins the cloud merge. `SessionMatchRepository` gains
  `updateDate`.
- **Coach follow re-dates the match too.** `applyCoachDateMoves` re-dates the
  match in the same transaction. This fixes the card that does not move after
  a coach move. When the coach replaces a day the athlete chose, the notice
  names that day and offers **Move back**.
- **Entry points.** Coach (matched) cards can be dragged in the Grid view. The
  coaching dialog gains **Move to another day**, and the workout detail keeps
  its Move. A done session cannot be moved, and neither can a coach plan that
  has not been converted to a workout yet. Moving onto a day that already has
  a session of the same sport asks for confirmation.
- **Local trace.** A card or dialog whose `date` differs from its `coachDate`
  shows **Moved from {coachDate}**.
- **Garmin.** Nothing is pushed on a move. When the ledger's `Placed` date
  differs from the workout's date, the card and the detail show **Garmin still
  on {date}** and offer **Update Garmin**, which runs the existing placement
  move (schedule → verify → delete).
- **TrainingPeaks.** Sending a moved workout that TrainingPeaks already has is
  blocked, and the athlete is told where it still is. A real TrainingPeaks
  move is the follow-up `add-trainingpeaks-workout-move`.
- **Train2Go stays read-only.** Train2Go cannot accept writes from Kaiord.
  That is a technical limitation of Train2Go, not a choice. Kaiord does not
  probe for a write endpoint and does not post a day comment. Traceability
  toward the source is local only: the **Moved from** chip.

## Impact

- **Affected packages**: `@kaiord/workout-spa-editor` only (private, no
  changeset). No bridge, allowlist, privacy-policy or Chrome Web Store change.
- **Hexagonal layers**:
  - domain types (`SessionMatch`, `ExportLedgerEntry`)
  - the `SessionMatchRepository` port and its Dexie and in-memory adapters
  - application (`moveSession`, `applyCoachDateMoves`, the TrainingPeaks
    guard)
  - UI (calendar drag, coaching dialog, chip, Garmin state, notice)
- **Ports**: `SessionMatchRepository.updateDate(matchId, date, updatedAt)` is
  specified before its adapters (design §3.2).
- **Persistence**: two optional fields, `SessionMatch.updatedAt` and
  `ExportLedgerEntry.destinationDate`. No index changes. Old rows parse as
  they are.
- **Behaviour change, user-visible**: after a coach move, the matched card
  now moves to the coach's new day. This was the intent of
  `add-garmin-calendar-scheduling` §3.11, but it never happened for matched
  cards. Note it in the release notes.
- **Specs**:
  - `spa-calendar`: MODIFIED "Manual surfaces are canonical…", plus ADDED
    requirements
  - `spa-session-match`: ADDED
  - `spa-coaching-integration`: ADDED
  - `spa-persistence-port`: ADDED
  - `spa-garmin-extension`: ADDED
  - `spa-trainingpeaks-extension`: ADDED
- **Breaking public API**: none. `rescheduleWorkout` is internal to the SPA,
  and its two callers move to `moveSession`.

## Dependencies and sequencing

- **`add-garmin-calendar-scheduling` (not archived)**:
  - **E2E**: its manual E2E (task 9.4) is in progress. Check 3, "A date move
    leaves one entry", needs a reachable Move on a sent workout. For a coach
    (matched) session, the calendar cannot reach that Move today. The card
    opens the coaching dialog, and the dialog's "open" goes to the editor,
    not to the detail. The detail's Move is reachable only by URL
    (`/workout/view/:id`), and even then the matched card stays on the coach's
    day. PR-2 of this change adds a reachable Move, and PR-1 makes it
    visible. Until PR-2 lands, check 3 should use a solo workout or open the
    detail by URL.
  - **Specs**: its spec deltas add "Coach date moves follow the coach" and
    "Coach-move notice" to `spa-coaching-integration`. This change does
    **not** modify them. It ADDs separate requirements: "Coach date moves
    re-date the session match" and "Coach-move notice offers Move back". The
    two changes can therefore archive in either order without a conflicting
    delta.
  - **Implementation**: PR-3 (Garmin state) builds on its placement pipeline
    and `PlacementResult`, which are already merged.
- **`add-trainingpeaks-workout-push` (not archived)**: the
  `spa-trainingpeaks-extension` capability exists only in that change's
  deltas. This change ADDs one requirement to the same capability and should
  archive **after** it.
- **Not in scope**:
  - moving an unconverted coach plan
  - auto-pushing to Garmin on a move
  - a real TrainingPeaks move
  - any Train2Go write
  - moving a solo executed recording (today's drag behaviour for solo cards is
    unchanged)
  - coach follow for manually matched workouts that were not built from the
    activity (still a follow-up of `add-garmin-calendar-scheduling`)
