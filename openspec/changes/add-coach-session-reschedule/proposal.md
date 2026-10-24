## Why

The athlete needs to move a session to another day, coach sessions included,
and still know where it came from. Today that does not work for the sessions
that matter most.

- **A coach session cannot be moved from the calendar.** Drag is wired only
  for solo workouts. `MatchedSessionCard` and `CoachingActivityCard` get a
  click handler and nothing else (`day-column-cards.tsx:46-61`). The coaching
  dialog's "open" goes to the editor, which has no Move.
- **A move made from the workout detail is invisible.** `rescheduleWorkout`
  writes only `WorkoutRecord.date`. The matched card is bucketed by
  `SessionMatch.date` (`calendar-buckets.ts:65`), and no writer ever updates
  that field. So the card stays on the coach's day, and the moved workout is
  suppressed on its new day (`:60,70`). Executed auto-link also keys on
  `match.date` (`match-executed-workouts.ts:43`), so a recording made on the
  new day never joins the session.
- **The same bug follows a coach move.** `applyCoachDateMoves` moves
  `workout.date` but not `match.date`. The notice "1 session moved to the
  coach's new date" shows, but the card stays where it was. Every coach move
  since the Garmin follow-the-coach PRs, and every Move from the detail page,
  has left a stale `match.date` in the store.
- **A move may not reach other devices.** `rescheduleWorkout` does not bump
  `updatedAt`. `SessionMatch` has no `updatedAt` at all, so its merge clock is
  `createdAt` (`merge-record-key.ts:55-60`). Auto-push can skip a move, and an
  older remote copy can undo it.
- **Nothing tells the athlete that the session is still on the old day
  elsewhere.** Garmin is re-placed only on the next send.

## What Changes

- **One date writer, `moveSession`, replaces `rescheduleWorkout`.** In one
  transaction it re-reads the workout, writes `date`, bumps `updatedAt` and
  re-dates the workout's `SessionMatch`.
  - It refuses a session that has already been done.
  - It refuses a recording that is the executed slot of a match.
  - `WorkoutRecord.date` is the effective date. `coachDate` and the coaching
    activity's `date` are left alone and form the trace.
- **Matches carry an effective date and a clock.** `SessionMatch.date`
  becomes the session's effective date. It gains an optional `updatedAt`.
  `SessionMatchRepository` gains `updateDate` and `listByActivityIds`.
- **Coach follow re-dates the match too.** `applyCoachDateMoves` re-dates the
  match in the same transaction. When the coach replaces a day the athlete
  had chosen, the notice names that day and offers **Move back**.
- **Heal for rows that are already wrong.** Some matches already have a
  `date` that differs from their workout's `date`: legacy coach moves, Moves
  from the detail page, and workout and match rows that merged independently.
  A one-shot pass re-dates those matches to the workout's date. It runs at
  startup and after every cloud import. It only touches coach-built workouts
  (`coachDate` set), so manual matches across days are left as they are.
- **No ghost cards across weeks.** The week view also loads the matches of the
  week's coach activities, so a session moved into another week no longer
  leaves a solo plan card behind.
- **Executed auto-link never double-links a recording.** A recording that
  already belongs to one match is not attached to another one.
- **Entry points.**
  - Coach (matched) cards can be dragged in the Grid view.
  - The coaching dialog gains **Move to another day**.
  - The workout detail keeps its Move.
  - A done session cannot be moved, and neither can a coach plan that has not
    been converted yet.
  - A move onto a day that already has a session of the same sport asks for
    confirmation first.
- **Local trace.** A card, the coaching dialog or the detail shows **Moved
  from {coachDate}** when `date` differs from `coachDate`.
- **Garmin.** Nothing is pushed on a move. When the ledger's `Placed` date
  differs from the workout's date, the card and the detail show **Garmin still
  on {date}**. For an `unconfirmed` placement they show **Garmin may still be
  on {date}**. Either way they offer **Update Garmin**, which runs the
  existing placement move (schedule → verify → delete).
- **Train2Go stays read-only.** Train2Go cannot accept writes from Kaiord.
  That is a technical limitation of Train2Go, not a choice. Kaiord does not
  probe for a write endpoint and does not post a day comment. Traceability
  toward the source is local only: the **Moved from** chip.

## Impact

- **Affected packages**: `@kaiord/workout-spa-editor` only (private, no
  changeset). A new static guard is added, `scripts/check-workout-date-writers.mjs`.
  No bridge, allowlist, privacy-policy or Chrome Web Store change.
- **Hexagonal layers**:
  - domain types (`SessionMatch`)
  - the `SessionMatchRepository` port and its Dexie and in-memory adapters
  - application (`moveSession`, `applyCoachDateMoves`, `healMatchDates`,
    `matchExecutedWorkouts`)
  - UI (calendar drag and buckets, coaching dialog, chip, Garmin state,
    notice)
- **Ports**: `SessionMatchRepository.updateDate` and `listByActivityIds` are
  specified before their adapters (design §3.2).
- **Persistence**: one optional field, `SessionMatch.updatedAt`. It needs no
  index change and no schema version bump, and old rows parse as they are.
  If a client that does not know the field yet syncs, it may drop
  `updatedAt`. That is harmless: `date` travels with the row, and the heal
  repairs any tear.
- **User-visible behaviour change**: after a coach move, the matched card now
  moves to the coach's new day. The heal also moves existing cards that sat
  on a stale day: the first launch after the update moves them to their
  workout's date. Note both in the release notes.
- **Specs**:
  - `spa-calendar`: MODIFIED "Manual surfaces are canonical…", plus ADDED
    requirements
  - `spa-session-match`: MODIFIED "SessionMatch aggregate", plus ADDED
    requirements
  - `spa-coaching-integration`: ADDED
  - `spa-persistence-port`: ADDED
  - `spa-garmin-extension`: ADDED
- **Breaking public API**: none. `rescheduleWorkout` is internal to the SPA,
  and its two callers move to `moveSession`.

## Dependencies and sequencing

- **`add-garmin-calendar-scheduling` (not archived)**
  - **E2E**: its manual E2E (task 9.4) is in progress. Check 3, "A date move
    leaves one entry", needs a reachable Move on a sent workout.
    - For a coach (matched) session, the calendar cannot reach that Move
      today. The card opens the coaching dialog, and the dialog's "open" goes
      to the editor, not to the detail.
    - The detail's Move is reachable only by URL (`/workout/view/:id`). Even
      then, the matched card stays on the coach's day.
    - PR-2 of this change adds a reachable Move, and PR-1 makes the move
      visible.
    - Until PR-2 lands, check 3 should use a solo workout or open the detail
      by URL.
    - That same check 3 also covers this change's manual "Update Garmin" step
      against a real Garmin account.
  - **Specs**: its deltas add "Coach date moves follow the coach" and
    "Coach-move notice" to `spa-coaching-integration`. This change does
    **not** modify them. It adds separate requirements instead: "Coach date
    moves re-date the session match" and "Coach-move notice offers Move
    back". The two changes can therefore archive in either order.
  - **Implementation**: PR-3 (Garmin state) builds on its placement pipeline
    and `PlacementResult`, which are already merged.
- **TrainingPeaks: split out.** The re-push guard for a moved workout lives in
  its own change, `add-trainingpeaks-moved-repush-guard`. Its proposal, tasks
  and spec delta are in this PR. It is sequenced after
  `add-trainingpeaks-workout-push` archives, because
  `spa-trainingpeaks-extension` exists only in that change's deltas.
  `add-coach-session-reschedule` therefore has no TrainingPeaks delta and can
  archive on its own. Until the guard ships, re-sending a moved workout to
  TrainingPeaks creates a second TrainingPeaks workout. That is today's
  behaviour, unchanged.
- **Not in scope**
  - moving an unconverted coach plan
  - auto-pushing to Garmin on a move
  - any TrainingPeaks change (see above). A real TrainingPeaks move is the
    later `add-trainingpeaks-workout-move`.
  - any Train2Go write
  - moving a solo recording that is not part of a match (today's drag
    behaviour is unchanged)
  - coach follow for manually matched workouts that were not built from the
    activity (still a follow-up of `add-garmin-calendar-scheduling`)
