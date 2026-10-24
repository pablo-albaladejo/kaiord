## Context

The athlete must be able to move any session to another day, coach sessions
included, without losing the trace of where it came from. Kaiord stores three
dates for a coach session:

| Entity                   | Field               | Written by                                                                                         | Meaning on `origin/main`                                                                                                            |
| ------------------------ | ------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `CoachingActivityRecord` | `date`              | Train2Go sync `upsertMany`                                                                         | The coach's current date: a mirror, overwritten on every sync. Its id survives a coach move (A6 of the Garmin change).              |
| `WorkoutRecord`          | `date`, `coachDate` | builders (`coachDate = activity.date`), `rescheduleWorkout` (`date`), `applyCoachDateMoves` (both) | `date` is the day the athlete trains. `coachDate` is the coach's last-seen date. `date !== coachDate` means "the athlete moved it". |
| `SessionMatch`           | `date`              | creation only (`match-session.ts:64`, `ensure-session-match.ts:49`)                                | Copied from the activity at creation. **No writer ever updates it.**                                                                |

`SPA` below means `packages/workout-spa-editor/src`. The facts below were
re-verified on `origin/main` @ `77f1236d9`:

- The calendar buckets a matched card by `match.date`
  (`SPA/components/pages/calendar-buckets.ts:65`). It removes the match's
  workout and executed ids from their own days' lanes (`:60,70`). The week
  query is the `[profileId+date]` index of `sessionMatches`
  (`SPA/hooks/use-matched-sessions-query.ts:18-26`).
- Executed auto-link looks recordings up by `match.date`
  (`SPA/application/coaching/match-executed-workouts.ts:43`). It runs from a
  live query of the visible week (`SPA/hooks/use-executed-match-auto.ts`).
- `rescheduleWorkout` writes `{ ...existing, date }` inside one transaction.
  It does not bump `updatedAt` and does not touch the match
  (`SPA/application/reschedule-workout.ts:23-35`). Its callers are the Grid
  drag (`calendar-dnd/use-grid-reschedule.ts:30`) and the detail's Move
  (`WorkoutDetail/use-move-workout.ts:24`).
- `applyCoachDateMoves` finds the workout by `sourceId`, writes
  `date`/`coachDate` and bumps `updatedAt`. It never touches the match
  (`SPA/application/coaching/apply-coach-date-moves.ts:55-74`). It returns
  counts only, with no per-workout detail.
- Drag is bound only for solo actuals that are not projected
  (`SPA/components/molecules/WorkoutCard/day-column-cards.tsx:62-81`).
  `MatchedSessionCard` and `CoachingActivityCard` get only `onClick`
  (`:46-61`). The coaching dialog's open goes to the editor
  (`CoachingActivityDialog.tsx:48-53`).
- Cloud sync: the comparison clock is `updatedAt ?? createdAt`
  (`SPA/application/sync/merge-record-key.ts:55-60`). The auto-push change
  token reads `count + max(updatedAt)` of `workouts` and the other tables in
  `SYNCED_TABLES` (`SPA/hooks/use-sync-auto-push.ts:25-34`).
  `sessionMatches` is **not** in that list, and `SessionMatch` has **no**
  `updatedAt`, so a re-dated match would tie with its remote copy on
  `createdAt`.
- TrainingPeaks: the bridge allowlist has a single workout route,
  `POST /fitness/v6/athletes/{id}/workouts`
  (`packages/trainingpeaks-bridge/background.js:93`). The payload carries
  `workoutDay: workout.date` (`SPA/hooks/use-trainingpeaks-push.ts:58`). The
  ledger keeps a content hash but not the pushed day.
- Train2Go: the bridge allowlist is GET-only (`ping`, `weekly`, `daily`,
  `tooltip`; `packages/train2go-bridge/background.js:149-158`).

## Goals / Non-Goals

- **Goal**: move a converted coach session, or any workout, to another day
  from the calendar (Grid drag), the coaching dialog or the workout detail.
  The card, executed auto-link, Garmin and cloud sync all follow one
  effective date.
- **Goal**: fix the stale-`match.date` bug class, for both athlete moves and
  coach moves.
- **Goal**: keep the trace locally. The coach's day stays readable as
  **Moved from {coachDate}**.
- **Goal**: never surprise the athlete with an external write. Nothing is
  pushed on a move. Kaiord shows what is still on the old day elsewhere and
  offers an explicit action.
- **Non-goal**: moving a coach plan that has not been converted to a workout
  yet (v1).
- **Non-goal**: auto-pushing to Garmin on a move. "A sync never pushes" and
  "a move never pushes" both hold.
- **Non-goal**: a real TrainingPeaks move. That needs a DELETE route, an id
  ledger and a privacy and CWS update; it is the follow-up
  `add-trainingpeaks-workout-move`.
- **Non-goal — Train2Go writes.** Train2Go is **read-only for Kaiord**. This
  is a technical limitation of Train2Go, not a product choice. There is no
  write probe, no session move upstream and no "tell the coach" day comment.
  The coach is not notified by Kaiord. Traceability toward the source is
  local only.
- **Non-goal**: moving solo executed recordings. Today's drag behaviour for
  solo cards is unchanged.
- **Non-goal**: changing where the coaching dialog's "open" navigates. That
  is a separate UX call.

## Assumptions

| #   | Assumption                                                                                                                                           | If false                                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | A converted coach workout has at most one `SessionMatch` in its profile (`(profileId, workoutId)` is unique, adapter-enforced).                      | `moveSession` would re-date only one of them. The uniqueness is already spec'd in `spa-session-match`, so this is not expected.                            |
| B2  | Whenever a converted workout is created, `workout.date === activity.date`. So for auto-converted matches, `match.date === workout.date` at creation. | A match created across days (manual "Match to…") keeps today's rule: the card sits on the plan's day until the first move. Accepted. See §3.1 "Invariant". |
| B3  | The coaching activity's `status` `completed` is set only by the coach side.                                                                          | A session could be blocked from moving without a recording. The block copy explains why, so the athlete is not left guessing.                              |
| B4  | The Garmin library hash does not include the date (`add-garmin-calendar-scheduling` ADR, "the date in the hash" was rejected).                       | "Update Garmin" would mint a library workout on each move. Today's placement pipeline already assumes B4 holds.                                            |

## Decision record (ADR)

### Decision

**The workout's `date` is the effective date.** `coachDate` and the coaching
activity's `date` are the trace, and no override record exists. Each writer
of a workout's date also re-dates the workout's `SessionMatch` in the same
transaction, and stamps `updatedAt` on both.

**One athlete date writer: `moveSession`.** It replaces `rescheduleWorkout`.
The calendar drag, the coaching dialog's Move, the workout detail's Move and
the notice's "Move back" all call it. A future chat-tool reschedule must call
it too; none exists on `origin/main`. It refuses a session
with an executed slot or a `completed` activity.

**Coach follow** (`applyCoachDateMoves`) re-dates the match too. It keeps the
settled decision table of `add-garmin-calendar-scheduling` §3.11 unchanged,
including "coach wins" when both moved it to different days. It also reports
the athlete days it overrode, so the notice can name them and offer
"Move back".

**External systems.**

- **Garmin**: nothing is pushed on a move. A persistent **Garmin still on
  {date}** state appears when the ledger's `Placed` date differs from the
  workout's date. The athlete-triggered **Update Garmin** action runs the
  existing placement move.
- **TrainingPeaks** (create-only): re-sending a moved workout that
  TrainingPeaks already has is blocked by default.
- **Train2Go** (read-only): only a local **Moved from {coachDate}** chip.

### Drivers

- One date must drive the card, executed auto-link, Garmin and cloud sync.
  Two drifting dates is how the invisible move happened.
- The precedence rules for coach and athlete moves are already settled and
  tested (§3.11); this change must not re-open them.
- The calendar's indexed week read (`[profileId+date]`) stays the query.
- No external write may happen without an explicit athlete action.
- Train2Go has no write surface that Kaiord can use.

### Alternatives considered

- **B: a `sessionDateOverrides` table** keyed by coaching activity, holding
  `{athleteDate, coachDateAtMove, movedAt}`. It would cover unconverted plans.
  Rejected: it adds a third source of date truth that duplicates
  `date`/`coachDate`, plus a new Dexie table, a migration, merge and
  tombstone rules. Every reader (calendar, Daily, Garmin candidates, AI
  context) would have to apply it, and §3.11 would have to be re-decided.
- **C: bucket matched cards by `workout.date` at read time** and drop
  `match.date` as the key. Rejected: it breaks the indexed week read and the
  per-week budget of `use-matched-sessions.ts`. Executed auto-link would need
  the same rewrite, which makes it a larger refactor.
- **Athlete wins once moved**: rejected (Decision 2). Later coach edits would
  become invisible.
- **Auto re-place on Garmin after a move**: rejected (Decision 5). It reverses
  "a move never pushes" and adds lock, deadline and failure UI to a drag.
- **A Train2Go write probe or a day comment**: rejected (Decision 8). Train2Go
  cannot accept it (technical limitation).
- **Add `sessionMatches` to `SYNCED_TABLES`**: unnecessary. The workout write
  in the same transaction already advances the change token.

### Why chosen

- The domain already encodes the override as `date` + `coachDate`. Three
  things were missing: re-dating `match.date`, a merge clock on both rows,
  and a reachable Move.
- No new table and no index change. The diff stays small and in-layer.
- One use case means one place for the guards (executed, completed, not
  found) and for the stamping.

### Consequences

- `match.date` stays denormalised. Every writer of a workout's date must
  re-date the match. A writers test pins this
  (`move-session.writers.test.ts`, AC-6).
- After a coach move, the matched card now moves. That was the intent but it
  never happened, so it is a visible behaviour change and goes in the release
  notes.
- A re-dated match carries `updatedAt`, so it wins the merge against an older
  remote copy. Cross-device clock skew can still revert a move: the accepted
  last-writer-wins residual of `spa-persistence-port`.
- The coach plans against Tuesday while the athlete trains on Thursday.
  Train2Go never learns of it, so compliance on the coach's side may look
  like a missed session. This is accepted and stated as a non-goal.
- A TrainingPeaks copy of a moved workout stays on its old day until the
  athlete moves it by hand in TrainingPeaks, or chooses to send a second
  copy.

### Follow-ups

- `add-trainingpeaks-workout-move`: a TrainingPeaks placement model (store the
  TP workout id, create → delete old). It needs the DELETE route allowlisted,
  the privacy golden, the CWS listing and the Basic-tier horizon handling.
- Moving unconverted coach plans: Option B, if it becomes a must.
- Coach follow for manually matched workouts that were not built from the
  activity. This is carried over from `add-garmin-calendar-scheduling`.
- A read-side heal that re-dates a match whose `date` differs from its
  workout's `date`, for rows written before this change or by a tie.

## Design (normative)

### 3.1 Effective date model (domain types)

- `WorkoutRecord.date`: the effective date. `coachDate`: the coach's
  last-seen date, never written by an athlete move.
  `CoachingActivityRecord.date`: the coach's current date, written only by
  sync.
- `SessionMatch.date`: the session's effective date, equal to its workout's
  `date` after any date writer commits. The code comment "stable per match"
  (`types/session-match.ts:28-33`) is replaced.
- `SessionMatch.updatedAt?: ISO datetime`: optional, so legacy rows parse.
  Stamped by `updateDate`. `recordClock` already prefers it over
  `createdAt`, so no merge code changes.
- **Invariant (writers)**: for every workout W with a match M, after
  `moveSession(W)` or an `applyCoachDateMoves` write of W, `M.date === W.date`.
  Creation keeps today's rule: `match.date` is the activity's date. Per B2,
  that equals `workout.date` for converted workouts.
- `isAthleteMoved(w) := w.coachDate !== undefined && w.date !== w.coachDate`.
  This is the pure predicate behind the chip.

### 3.2 Port: `SessionMatchRepository.updateDate`

```ts
/**
 * Re-dates an existing match in place and stamps `updatedAt`. A no-op when
 * the row is missing (concurrent-delete tolerance, like `delete`). It runs
 * inside the caller's `PersistencePort.transaction` when called from one.
 */
updateDate: (matchId: string, date: string, updatedAt: string) => Promise<void>;
```

- The Dexie adapter uses `update(matchId, { date, updatedAt })`. The
  `[profileId+date]` index stays valid; only values change.
- The in-memory adapter mirrors it.
- `date` must be `YYYY-MM-DD`; anything else is rejected before the write.

### 3.3 Use case `moveSession` (application)

```ts
type MoveSessionDeps = Pick<
  PersistencePort,
  "workouts" | "sessionMatch" | "coaching" | "transaction"
> & { now: () => string };
type MoveSessionInput = {
  profileId: string;
  workoutId: string;
  targetDay: string;
};
type MoveSessionResult =
  | { kind: "moved"; from: string; to: string; matchId?: string }
  | { kind: "unchanged" };
class SessionNotMovableError extends Error {
  reason: "executed" | "completed";
}
// WorkoutNotFoundError is kept and re-exported from move-session.ts.
```

Inside one `transaction`, in this order:

1. Re-read the workout. If it is missing, throw `WorkoutNotFoundError`.
2. If `targetDay === workout.date`, return `unchanged` with no write.
3. Look up the match with `sessionMatch.getByWorkoutId(profileId, workoutId)`.
4. If the match has `executedWorkoutIds.length > 0`, throw
   `SessionNotMovableError("executed")`.
5. If the match's coaching activity has `status === "completed"`, throw
   `SessionNotMovableError("completed")`.
6. Write `workouts.put({ ...workout, date: targetDay, updatedAt: now })`.
   `coachDate`, `state`, `modifiedAt`, `garminPushId` and `krd` are
   untouched.
7. If a match exists, call `sessionMatch.updateDate(match.id, targetDay, now)`.

After the commit:

- Executed auto-link sees the new `match.date` on its next live-query run.
  Nothing extra is called.
- `rescheduleWorkout.ts` is deleted, and both callers move to `moveSession`.
- Projected records are never passed in: the UI gates them, as today.

### 3.4 Coach follow re-dates the match (application)

- `moveOne` in `apply-coach-date-moves.ts` gains a `sessionMatch` dependency.
  When `verdict.write.date !== workout.date`, it calls
  `sessionMatch.updateDate(match.id, verdict.write.date, now)` in the same
  transaction. The match is found with `getByWorkoutId(workout.profileId, workout.id)`.
- `persistSyncedWeek` passes `sessionMatch` through.
- The decision table of `add-garmin-calendar-scheduling` §3.11 is unchanged.
- `CoachDateMoves` gains `overridden: { workoutId, athleteDate, coachDate }[]`.
  `athleteDate` is the pre-write `date`. The array has one entry for each
  `overriddenLocalMoves++`, so its length always equals the counter.

### 3.5 Coach-move notice offers "Move back" (UI)

- When `overridden.length > 0`, the existing `CoachMoveNotice` names each
  overridden session's athlete day ("The coach moved {sport} to {coachDate};
  you had it on {athleteDate}") and shows a **Move back to {athleteDate}**
  button per entry, up to 3. Beyond 3 it shows a count. The copy is static,
  in en and es.
- **Move back** calls `moveSession(workoutId, athleteDate)`. The next sync,
  with the coach unchanged, keeps it (row 1 of §3.11). If the workout is no
  longer movable, the button shows the block reason instead.
- The notice still never pushes.

### 3.6 Entry points and guards (UI)

- **Grid drag**: `renderDayCards` wraps a `MatchedSessionCard` in the drag
  binding, keyed by `s.workout.id`, when the session is movable. A session is
  movable when it has no executed slot, its activity is not `completed`, and
  its workout is not projected. A session that is not movable gets no drag
  binding; its card and dialog show the reason. `CoachingActivityCard`
  (unconverted) is never draggable. The List view has no drag, as today.
- **Coaching dialog**: `MatchedActions` gains **Move to another day**. It opens
  the same date picker as the workout detail; the picker component is shared,
  not copied. When the session is not movable, the action is disabled and
  shows the reason ("Already done — it can't be moved"). For an unconverted
  plan, the dialog shows no Move and a hint: "Create the workout first to
  move it."
- **Workout detail**: keeps its Move, now through `moveSession`, with the same
  guards and copy.
- **Same-sport warning**: before calling `moveSession`, the UI runs
  `sameSportOnDay(targetDayCards, sport, canonicalSport)`, a pure function
  over the target day's matched and solo workouts, excluding the moved one.
  If it is true, the UI asks "There is already a {sport} session on {day}.
  Move anyway?". Cancelling reverts the drag optimistically. A busy day with a
  different sport moves without a prompt. There is no auto re-match: the
  match keeps its activity link.
- **Blocked toast**: a `SessionNotMovableError` caught by any entry point
  shows a toast with the reason. A `WorkoutNotFoundError` keeps today's
  "no longer exists" toast.

### 3.7 Local trace: "Moved from {coachDate}" (UI)

- `MatchedSessionCard`, the coaching dialog and the workout detail show a chip
  **Moved from {coachDate}** when `isAthleteMoved(workout)`.
- The date uses the locale's short weekday and day. In compact density the
  chip is an icon plus short text, and its `aria-label` carries the full
  sentence.
- The chip clears when the athlete moves the session back to `coachDate`, or
  when the coach follows the athlete's day (`date === coachDate`).
- This is the only trace toward Train2Go (§3.10).

### 3.8 Garmin: "Garmin still on {date}" + "Update Garmin" (application + UI)

- **Pure derivation**: `garminDateDrift(row, workout)` returns
  `{ placedOn }` iff `isGarminPlaced(row?.placement)` and
  `row.placement.date !== workout.date`. Otherwise it returns `undefined`.
  `attempting` and `uncertain` rows are left to the existing placement notice.
- **Card**: when there is drift, the matched or solo card shows a small badge
  "Garmin: {placedOn}". It reads the ledger rows of the visible week's
  workouts in one live query (`exportLedger` by `kaiordRecordId` `anyOf`).
  This runs after the first paint, outside the week's critical read.
- **Detail and dialog**: they show "Garmin still on {placedOn}" and an
  **Update Garmin** button. The button runs the existing
  `pushWorkoutToGarminCalendar` through `useGarminPush`: library unchanged
  (B4), then the placement move (schedule → verify → delete). The result uses
  the existing `PlacementResult` copy. If the bridge is missing or outdated,
  the state still shows and the button is disabled with the existing
  capability reason.
- **After a move**: if the moved workout has drift, the success toast reads
  "Moved. Garmin still has it on {placedOn}." and carries an **Update Garmin**
  action. A move and a sync never push.

### 3.9 TrainingPeaks re-push guard (application + UI)

- **Ledger field**: `ExportLedgerEntry.destinationDate?: YYYY-MM-DD` is
  optional. The TrainingPeaks push writes it on commit, equal to the payload's
  `workoutDay`. The non-Garmin merge is newest-`updatedAt`, and the field
  rides along with it.
- **Guard**: `trainingPeaksRepushGuard(row, workout, payloadHash)` is pure.
  It runs before `executeWorkoutPush`. It reads only a confirmed row, one
  whose `destinationExternalId` is not `"pending"`:
  - `row.destinationDate` defined and different from `workout.date` →
    `{ blocked: "moved", trainingPeaksDate: row.destinationDate }`.
  - `row.destinationDate` undefined (legacy row) and `payloadHash !==
row.contentHash` → `{ blocked: "changed" }`. TrainingPeaks is create-only,
    so any re-send duplicates.
  - Otherwise → allowed (today's idempotent skip or first push).
- **UI**: a blocked push shows "TrainingPeaks still has this workout on
  {date}. Sending again creates a second copy. Move it in TrainingPeaks, or
  send a copy anyway." The **Send a copy anyway** button is behind a
  confirmation and runs the push. No POST is sent until the athlete confirms.

### 3.10 Train2Go (non-goal, stated)

- Kaiord does not write to Train2Go. The bridge allowlist stays GET-only.
  There is no probe, no move endpoint and no comment.
- The trace is local: `coachDate` (the coach's day), `date` (the athlete's
  day) and the namespaced `sourceId`, surfaced as the §3.7 chip.

### 3.11 Cloud sync (persistence)

- Both date writers stamp `updatedAt` on the workout and on the match, with
  the same `now`.
- The workout write advances the auto-push change token.
- The match's `updatedAt` makes it win the snapshot merge against an older
  remote copy. Its clock was `createdAt` before.
- No schema version bump: both new fields are optional and unindexed.

## Acceptance criteria

| AC    | Criterion                                                                                                                                                                                    | PR   |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| AC-1  | `openspec validate add-coach-session-reschedule --strict` and `pnpm lint:specs` pass.                                                                                                        | PR-0 |
| AC-2  | `SessionMatch` parses with and without `updatedAt`. `updateDate` re-dates and stamps in both adapters, is a no-op on a missing row, and rejects a malformed date.                            | PR-1 |
| AC-3  | `moveSession` writes `date`, `updatedAt` and `match.date`/`match.updatedAt` in one transaction, and leaves `coachDate`, `state`, `modifiedAt`, `garminPushId` and `krd` untouched.           | PR-1 |
| AC-4  | `moveSession` throws `SessionNotMovableError("executed")` / `("completed")` and `WorkoutNotFoundError` with 0 writes. The same day returns `unchanged` with 0 writes.                        | PR-1 |
| AC-5  | `applyCoachDateMoves` re-dates the match in every row of the §3.11 table that moves `date`. `overridden` lists the athlete's day, and its length equals `overriddenLocalMoves`.              | PR-1 |
| AC-6  | A writers test fails if any code path changes a workout's `date` without re-dating its match (`move-session.writers.test.ts`).                                                               | PR-1 |
| AC-7  | `buildCalendarBuckets`: a moved matched session renders only on its new day, with no solo duplicate and nothing on the coach's day. The same holds after a coach move.                       | PR-1 |
| AC-8  | Executed auto-link attaches a recording made on the moved day to the moved match.                                                                                                            | PR-1 |
| AC-9  | Cloud merge: a moved workout and its match win against a stale remote copy, and the change token advances after a move.                                                                      | PR-1 |
| AC-10 | Grid: a movable matched card can be dragged to another day and persists after a reload. Executed, completed, unconverted and projected cards are not draggable.                              | PR-2 |
| AC-11 | The coaching dialog's **Move to another day** moves the session. When the session is not movable, the action is disabled with the reason. An unconverted plan shows the "create first" hint. | PR-2 |
| AC-12 | Same-sport target: a confirmation is shown, and cancelling makes 0 writes. A different sport moves without a prompt.                                                                         | PR-2 |
| AC-13 | **Moved from {coachDate}** shows iff `date !== coachDate`, on the card, the dialog and the detail, in en and es, with an accessible name.                                                    | PR-2 |
| AC-14 | The notice names the overridden athlete day, and **Move back** restores it through `moveSession`. A following unchanged sync keeps it.                                                       | PR-2 |
| AC-15 | `garminDateDrift` is true iff `Placed.date !== workout.date`. The card badge and the detail state show it, and no push happens on a move or a sync.                                          | PR-3 |
| AC-16 | **Update Garmin** runs the placement move (schedule new → verify → delete old) and the state clears. A missing or outdated bridge disables the action, and nothing crashes.                  | PR-3 |
| AC-17 | The TrainingPeaks push writes `destinationDate`. A moved, already-sent workout is blocked with 0 POSTs until the athlete confirms "Send a copy anyway".                                      | PR-4 |
| AC-18 | Legacy TrainingPeaks rows without `destinationDate` and with a different hash are blocked the same way. An unchanged re-send stays an idempotent skip.                                       | PR-4 |
| AC-19 | Playwright: the E2E flows of §Test plan PR-5 pass on a fresh profile, with the Train2Go and Garmin bridge stubs.                                                                             | PR-5 |
| AC-20 | `pnpm -r test && pnpm -r build && pnpm lint` pass.                                                                                                                                           | each |

## Test plan (per PR)

**PR-1: domain, port, use case, coach follow.** Vitest, in-memory persistence
plus the Dexie adapter tests.

- `session-match` schema: with and without `updatedAt` (AC-2).
- `updateDate` in the Dexie and in-memory adapters: re-date, stamp, missing
  row, malformed date (AC-2).
- `moveSession`: the happy path with a match and without one. Untouched
  fields. `unchanged`. Executed, completed, not found. A racing writer
  (a coach move or a push stamp between the caller's read and the
  transaction) is not rolled back, following the
  `reschedule-workout.writers.test.ts` pattern (AC-3, AC-4).
- `move-session.writers.test.ts`: lists every `workouts.put` that changes
  `date` and asserts that the match is re-dated (AC-6).
- `applyCoachDateMoves`: the 4 rows of §3.11 with a match, `match.date` and
  `match.updatedAt` after each write, and the `overridden` contents (AC-5).
- `buildCalendarBuckets`: athlete move and coach move (AC-7).
- `matchExecutedWorkouts` / `use-executed-match-auto`: a recording on the new
  day attaches (AC-8).
- Sync merge: a moved workout and match against a stale remote, and the
  change token before and after (AC-9).

**PR-2: entry points, chip, guards, Move back.** RTL component tests.

- `day-column-cards`: the drag binding on matched cards per guard (AC-10).
- `MatchedActions` / `CoachingActivityDialog`: Move enabled, disabled with
  the reason, and the unconverted hint (AC-11).
- `sameSportOnDay` (pure) and the confirm flow: cancel makes 0 writes
  (AC-12).
- The chip on the card, dialog and detail; en and es; the `aria-label`
  (AC-13).
- `CoachMoveNotice`: names the athlete's day, **Move back** calls
  `moveSession`, and the count beyond 3 (AC-14).

**PR-3: Garmin state and Update.** Vitest and RTL.

- `garminDateDrift` truth table: `Placed` same day or other day, `attempting`,
  `uncertain`, no row (AC-15).
- The card badge, the detail state, the post-move toast action, and no push
  on a move or sync (AC-15).
- **Update Garmin** with the fake calendar port: schedule, then verify, then
  delete, and the drift clears. A missing or outdated bridge disables the
  button (AC-16). Extend `coach-move-push.test.ts` with an athlete-move case.

**PR-4: TrainingPeaks guard.** Vitest and RTL.

- `trainingPeaksRepushGuard` truth table: no row, pending, same day, moved,
  legacy with the same hash, legacy with a different hash (AC-17, AC-18).
- The hook: blocked means 0 bridge POSTs; after the confirmation there is
  exactly 1 POST. `destinationDate` is written on commit (AC-17).

**PR-5: Playwright E2E and docs.** Train2Go and Garmin bridge stubs, fresh
profile (AC-19).

1. Fresh profile → link the Train2Go stub → sync → convert → drag the matched
   card Tue → Thu. The card is on Thu with "Moved from Tue", and a reload
   keeps it.
2. Re-sync with the stub unchanged: it stays on Thu, with no notice.
3. The stub's coach moves it to Fri: the card is on Fri, and the notice names
   Thu. **Move back** returns it to Thu.
4. A coach-only move (no athlete move): the card moves to the new day. This
   is the regression test for the stale `match.date`.
5. The Garmin stub: send → move → "Garmin still on Tue" → **Update Garmin**.
   The stub receives schedule(Thu), then delete(Tue), and the ledger has
   `Placed.date = Thu`.
6. An executed recording on the day: the card is not draggable, and the
   dialog's Move is disabled with the reason.
7. A fresh profile with no Garmin bridge: no badge and no crash. The List
   view: Move through the dialog works with no drag.

## Risks

- **Denormalised drift**: a future date writer that forgets the match brings
  the invisible move back. The writers test (AC-6) mitigates this.
- **Visible behaviour change**: coach-moved cards now move. Note it in the
  changelog.
- **Clock skew**: last-writer-wins can still revert a move across devices
  (accepted residual).
- **Silent divergence from the coach**: Train2Go is read-only (non-goal).
- **TrainingPeaks duplicates**: possible only when the athlete confirms "Send
  a copy anyway".
- **Sequencing with `add-garmin-calendar-scheduling`**: no shared requirement
  is modified (see `proposal.md`).
