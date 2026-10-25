## Context

The athlete must be able to move any session to another day, coach sessions
included, without losing the trace of where it came from. Kaiord stores three
dates for a coach session:

| Entity                   | Field               | Written by                                                                                         | Meaning on `origin/main`                                                                                                            |
| ------------------------ | ------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `CoachingActivityRecord` | `date`              | Train2Go sync `upsertMany`                                                                         | The coach's current date. It is a mirror, overwritten on every sync. Its id survives a coach move (A6 of the Garmin change).        |
| `WorkoutRecord`          | `date`, `coachDate` | builders (`coachDate = activity.date`), `rescheduleWorkout` (`date`), `applyCoachDateMoves` (both) | `date` is the day the athlete trains. `coachDate` is the coach's last-seen date. `date !== coachDate` means "the athlete moved it". |
| `SessionMatch`           | `date`              | creation only (`match-session.ts:64`, `ensure-session-match.ts:49`)                                | Copied from the activity at creation. **No writer ever updates it.**                                                                |

`SPA` below means `packages/workout-spa-editor/src`. The facts below were
re-verified on `origin/main` @ `77f1236d9`.

**Calendar and matching**

- The calendar buckets a matched card by `match.date`
  (`SPA/components/pages/calendar-buckets.ts:65`).
- It removes the match's workout and executed ids from their own days' lanes
  (`:60,70`).
- It hides a coach plan only when the plan's id is among the **visible
  week's** matches (`:55,66-68`).
- The week query reads `sessionMatches` through the `[profileId+date]` index,
  over the visible days (`SPA/hooks/use-matched-sessions-query.ts:14-27`).
- The Daily view reuses the same buckets
  (`SPA/components/pages/Daily/build-today-buckets.ts:38-46`).
- Executed auto-link looks recordings up by `match.date`. It deduplicates
  only within one match, never across matches
  (`SPA/application/coaching/match-executed-workouts.ts:43-55`). It runs from
  a live query of the visible week (`SPA/hooks/use-executed-match-auto.ts`).

**Date writers**

- `rescheduleWorkout` writes `{ ...existing, date }` inside one transaction.
  It does not bump `updatedAt` and does not touch the match
  (`SPA/application/reschedule-workout.ts:23-35`).
- Its callers are the Grid drag, whose `onDrop` has only
  `(workoutId, targetDayISO)` (`calendar-dnd/use-grid-reschedule.ts:27-33`),
  and the detail's Move (`WorkoutDetail/use-move-workout.ts:24`).
- `applyCoachDateMoves` finds the workout by `sourceId` and writes
  `date`/`coachDate`. It bumps `updatedAt` and never touches the match
  (`SPA/application/coaching/apply-coach-date-moves.ts:55-74`).
- It returns counts only. The notice state keeps only the two counters
  (`SPA/contexts/coach-move-notice-state.ts:21-35`).

**UI entry points**

- Drag is bound only for solo actuals that are not projected
  (`SPA/components/molecules/WorkoutCard/day-column-cards.tsx:62-81`).
- `MatchedSessionCard` and `CoachingActivityCard` get only `onClick`
  (`:46-61`).
- The coaching dialog's "open" goes to the editor
  (`CoachingActivityDialog.tsx:48-53`).

**Cloud sync**

- The comparison clock is `updatedAt ?? createdAt`
  (`SPA/application/sync/merge-record-key.ts:55-60`).
- The auto-push change token reads `count + max(updatedAt)` of `workouts`
  and the other tables in `SYNCED_TABLES`
  (`SPA/hooks/use-sync-auto-push.ts:25-34`). `sessionMatches` is **not** in
  that list.
- `SessionMatch` has **no** `updatedAt`.
- Workout and match rows merge independently, so a merge can tear them
  apart.

**Indexes** (`SPA/adapters/dexie/dexie-schemas-early.ts`)

- `sessionMatches`: `[profileId+coachingActivityId]` and `[profileId+date]`
  (`:30-31`). There is no multi-entry index on `executedWorkoutIds`.
- `workouts`: `[profileId+date]` (`:46-47`).
- `coachingActivities`: `[profileId+date]` (`:19-20`).

**Train2Go**

- The bridge allowlist is GET-only: `ping`, `weekly`, `daily` and `tooltip`
  (`packages/train2go-bridge/background.js:149-158`).

## Goals / Non-Goals

- **Goal**: move a converted coach session, or any workout, to another day.
  The move can start from the calendar (Grid drag), the coaching dialog or
  the workout detail. The card, executed auto-link, Garmin and cloud sync all
  follow one effective date.
- **Goal**: fix the stale-`match.date` bug class, for athlete moves and coach
  moves. This covers rows that are already wrong, matches that land in
  another week, and torn merges.
- **Goal**: keep the trace locally. The coach's day stays readable as
  **Moved from {coachDate}**.
- **Goal**: never surprise the athlete with an external write. Nothing is
  pushed on a move. Kaiord shows what is still on the old day elsewhere and
  offers an explicit action.
- **Non-goal**: moving a coach plan that has not been converted to a workout
  yet (v1).
- **Non-goal**: auto-pushing to Garmin on a move. "A sync never pushes" and
  "a move never pushes" both hold.
- **Non-goal: TrainingPeaks.** Nothing about TrainingPeaks changes here.
  - The re-push guard is its own change, `add-trainingpeaks-moved-repush-guard`.
  - A real TrainingPeaks move is the later `add-trainingpeaks-workout-move`.
- **Non-goal: Train2Go writes.** Train2Go is **read-only for Kaiord**.
  - This is a technical limitation of Train2Go, not a product choice.
  - There is no write probe, no session move upstream and no "tell the coach"
    day comment.
  - Kaiord does not notify the coach. Traceability toward the source is local
    only.
- **Non-goal**: moving a solo recording that is not part of any match. Today's
  drag behaviour for solo cards is unchanged.
- **Non-goal**: changing where the coaching dialog's "open" navigates. That
  is a separate UX call.

## Assumptions

| #   | Assumption                                                                                                                                                                        | If false                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | A workout has at most one `SessionMatch` in its profile. `(profileId, workoutId)` is unique, and the adapter enforces it.                                                         | `moveSession` would re-date only one of them. The uniqueness is already spec'd, so this is not expected.                                    |
| B2  | A converted workout is created with `workout.date === activity.date`.                                                                                                             | No impact on correctness: the heal (§3.5) re-dates the match to the workout's date.                                                         |
| B3  | Only the coach side sets the coaching activity's `status` to `completed`.                                                                                                         | A session could be blocked without a recording. The block copy says why.                                                                    |
| B4  | The Garmin library hash does not include the date. The `add-garmin-calendar-scheduling` ADR rejected "the date in the hash".                                                      | "Update Garmin" would mint a library workout. Today's placement pipeline already assumes B4.                                                |
| B5  | A profile has at most a few hundred `sessionMatches`, so one profile-scoped scan is cheap. The scan is used by the heal and by the "recording in a match" check in `moveSession`. | Add a multi-entry index on `executedWorkoutIds`, which needs a schema bump. Do this only if the profiling in PR-1 shows a cost above 50 ms. |

## Decision record (ADR)

### Decision

**The workout's `date` is the effective date.** `coachDate` and the coaching
activity's `date` are the trace. There is no override record.

- Each writer of a workout's date also re-dates the workout's `SessionMatch`
  in the same transaction and stamps `updatedAt` on both.
- When the two rows disagree anyway (legacy rows, torn merges), the
  **workout's date wins**. The heal re-dates the match.

**One athlete date writer: `moveSession`.** It replaces `rescheduleWorkout`.

- The calendar drag, the coaching dialog's Move, the workout detail's Move and
  the notice's "Move back" all call it. A future chat-tool reschedule must
  call it too. None exists on `origin/main`.
- It refuses:
  - a session with an executed slot
  - a session whose activity is `completed`
  - a recording that is the executed slot of a match

**Coach follow** (`applyCoachDateMoves`) re-dates the match too.

- It keeps the decision table of `add-garmin-calendar-scheduling` §3.11
  unchanged. That includes "coach wins" when both sides moved the session to
  different days.
- It reports the athlete days it overrode, so the notice can name them and
  offer "Move back".
- "Move back" is an ordinary athlete move, not a pin.

**The week view also hides coach plans whose match lives in another week.**
It looks matches up by `[profileId+coachingActivityId]` for the week's
activities.

**External systems**

- **Garmin**: a persistent **Garmin still on {date}** state, or **may still
  be on {date}** for an `unconfirmed` placement. The athlete triggers **Update
  Garmin**, which runs the existing placement move. Nothing is pushed on a
  move.
- **Train2Go** (read-only): only a local **Moved from {coachDate}** chip.
- **TrainingPeaks**: out of this change.

### Drivers

- One date must drive the card, executed auto-link, Garmin and cloud sync.
  The invisible move happened because two dates drifted apart.
- The precedence rules for coach and athlete moves are already settled and
  tested (§3.11). This change must not re-open them.
- The calendar's indexed week read stays the query.
- No external write may happen without an explicit athlete action.
- Train2Go has no write surface that Kaiord can use.
- The change must be able to archive without waiting on the unarchived
  TrainingPeaks change.

### Alternatives considered

- **B: a `sessionDateOverrides` table** keyed by coaching activity, holding
  `{athleteDate, coachDateAtMove, movedAt}`.
  - It would cover unconverted plans.
  - Rejected. It adds a third source of date truth, plus a new Dexie table, a
    migration, and merge and tombstone rules.
  - Every reader would have to apply it, and §3.11 would have to be
    re-decided.
- **C: bucket matched cards by `workout.date` at read time.** Rejected. It
  breaks the indexed week read and the per-week budget, and executed
  auto-link would need the same rewrite.
- **Athlete wins once moved, or a "Move back" pin.** Rejected (Decision 2).
  Later coach edits would become invisible.
- **Auto re-place on Garmin after a move.** Rejected (Decision 5).
- **A Train2Go write probe or day comment.** Rejected (Decision 8). Train2Go
  cannot accept either.
- **A heal only inside the visible week's live query.** Rejected. A stale
  match dated in another week is never loaded there, so it would never heal.
- **Add `sessionMatches` to `SYNCED_TABLES`.** Unnecessary. The workout write
  in the same transaction already advances the change token.
- **Keep the TrainingPeaks guard in this change.** Rejected (Decision 7).
  `spa-trainingpeaks-extension` exists only in an unarchived change, which
  would block this change's archive.

### Why chosen

- The domain already encodes the override as `date` + `coachDate`. Three
  things were missing: re-dating `match.date`, a merge clock on both rows,
  and a reachable Move.
- No new table and no index change. The diff stays small and stays in its
  layer.
- One use case means one place for the guards and the stamping. One heal
  repairs everything that is already wrong.

### Consequences

- `match.date` stays denormalised.
  - Every writer of a workout's date must re-date the match. A static guard
    pins this (§3.10).
  - The heal repairs anything that slips through.
- Coach-moved cards now move. The first launch after the update also moves
  existing cards that sat on a stale day. This is a visible change and goes in
  the release notes.
- A re-dated match carries `updatedAt`, so it wins the merge against an older
  remote copy. Cross-device clock skew can still revert a move. That is the
  accepted last-writer-wins residual of `spa-persistence-port`.
- A torn merge (workout from one device, match from another) resolves to the
  workout's date on the next heal.
- **A locked session keeps its match date.** A match that has an executed
  slot, or whose activity is `completed`, is never re-dated by coach follow or
  by the heal (§3.1). After a coach move, its workout's `date` and `coachDate`
  follow the coach as today, but the card stays on its recording's day. This
  is consistent with Decision 6 (executed sessions are not movable). The
  recording never re-appears as a solo card, and it is never linked to a
  second match.
- **A heal does not move the sync change token.** The heal writes only
  `sessionMatches`, and that table is not in `SYNCED_TABLES`.
  - The healed rows reach the cloud with the next push that some other change
    triggers.
  - This is accepted: every device runs the same deterministic heal from
    `workout.date` at startup and after every import. So a device that pulls
    an unhealed match heals it locally before rendering.
  - Adding `sessionMatches` to `SYNCED_TABLES` would need an `updatedAt`
    index and a schema bump, so it is not done here.
- A client that does not know the new field yet may drop
  `SessionMatch.updatedAt` when it syncs. That is harmless: the `date` travels
  with the row, and the heal re-stamps it.
- The coach plans against Tuesday while the athlete trains on Thursday.
  Train2Go never learns of it, so compliance on the coach's side may look like
  a missed session. This is accepted and stated as a non-goal.
- Until `add-trainingpeaks-moved-repush-guard` ships, re-sending a moved
  workout to TrainingPeaks duplicates it. That is today's behaviour.

### Follow-ups

- `add-trainingpeaks-moved-repush-guard`. Its skeleton is in this PR.
- `add-trainingpeaks-workout-move`. It needs a TrainingPeaks placement model,
  the DELETE route allowlisted, the privacy golden and the CWS listing.
- Moving unconverted coach plans: Option B, if it becomes a must.
- Coach follow for manually matched workouts. Carried over from
  `add-garmin-calendar-scheduling`.

## Design (normative)

### 3.1 Effective date model (domain types)

- `WorkoutRecord.date` is the effective date.
- `coachDate` is the coach's last-seen date. An athlete move never writes it.
- `CoachingActivityRecord.date` is the coach's current date. Only the sync
  writes it.
- `SessionMatch.date` is the session's effective date. It equals its
  workout's `date` after any date writer commits, and after the heal. This
  replaces the code comment "stable per match" (`types/session-match.ts:28-33`).
- `SessionMatch.updatedAt?: ISO datetime` is optional, so legacy rows parse.
  `updateDate` stamps it. `recordClock` already prefers it over `createdAt`,
  so the merge code does not change.
- **Locked match**: M is locked when `M.executedWorkoutIds.length > 0` or its
  coaching activity has `status === "completed"`.
- **Invariant**: for every coach-built workout W (`coachDate` set) with an
  **unlocked** match M, `M.date === W.date` holds after `moveSession(W)`,
  after an `applyCoachDateMoves` write of W, and after a heal pass.
- **Exception**: a locked M keeps its `date`. Coach follow and the heal never
  re-date it, and `moveSession` refuses it (§3.3). The card stays on the day
  of its recording.
- **Creation**: a new match is dated from the matched **workout's** `date`
  when the workout is coach-built (`coachDate` set), and from the activity's
  `date` otherwise.
  - Today every creator passes `activity.date`: `ensure-session-match.ts:49`
    via its callers, such as `convert-coaching-activity-manual-helpers.ts:39-43`
    and `persist-coaching-workout.ts:61-65`, and `match-session.ts:64`.
  - For a freshly built workout the two dates are equal.
  - They differ when an existing, athlete-moved workout is matched again. One
    case is the manual convert of an existing record. Another is the
    auto-heal in `use-coaching-auto-heal.ts:35`.
- Manual matches of workouts that were not coach-built keep today's rule: the
  match is dated on the plan's day at creation, and only `moveSession`
  re-dates it.
- `isAthleteMoved(w) := w.coachDate !== undefined && w.date !== w.coachDate`.
  This is the pure predicate behind the chip.

### 3.2 Port: `SessionMatchRepository`

```ts
/** Re-dates in place and stamps `updatedAt`. A no-op when the row is missing.
 *  Rejects a non-`YYYY-MM-DD` date. Joins the caller's transaction. */
updateDate: (matchId: string, date: string, updatedAt: string) => Promise<void>;
/** Matches of the given activities, any date: one `[profileId+coachingActivityId]`
 *  `anyOf` read. Used by the week view to hide plans matched in another week. */
listByActivityIds: (
  profileId: string,
  coachingActivityIds: readonly string[]
) => Promise<SessionMatch[]>;
/** Every match of a profile (profile-index scan). Used by the heal and by the
 *  "recording in a match" check (B5). */
listByProfile: (profileId: string) => Promise<SessionMatch[]>;
```

- The Dexie adapter:
  - implements `updateDate` as `update(matchId, { date, updatedAt })`
  - implements `listByActivityIds` with `where("[profileId+coachingActivityId]").anyOf(...)`
  - implements `listByProfile` with `where("profileId")`
- The `[profileId+date]` index stays valid, because only values change.
- The in-memory adapter mirrors all three.

### 3.3 Use case `moveSession` (application)

```ts
type MoveSessionDeps = Pick<
  PersistencePort,
  "workouts" | "sessionMatch" | "coaching" | "transaction"
> & { now: () => string };
type MoveSessionInput = { workoutId: string; targetDay: string };
type MoveSessionResult =
  | { kind: "moved"; from: string; to: string; matchId?: string }
  | { kind: "unchanged" };
class SessionNotMovableError extends Error {
  reason: "executed" | "completed";
}
// WorkoutNotFoundError is kept and re-exported from move-session.ts.
```

The input has no `profileId`. The drag's `onDrop` has none, so the profile is
taken from the re-read workout.

Inside one `transaction`, in this order:

1. Re-read the workout. If it is missing, throw `WorkoutNotFoundError`. Let
   `profileId = workout.profileId`.
2. If `targetDay === workout.date`, return `unchanged` and write nothing.
   This check comes **before** the executed and completed guards, on purpose.
   A no-op move of a done session is not an error, so dropping a done card
   on its own day stays silent.
3. Look up the match with `sessionMatch.getByWorkoutId(profileId, workoutId)`.
4. If the match has `executedWorkoutIds.length > 0`, throw
   `SessionNotMovableError("executed")`.
5. If the match's coaching activity has `status === "completed"`, throw
   `SessionNotMovableError("completed")`.
6. If there is no match where W is the planned side, and some match of the
   profile lists `workoutId` in `executedWorkoutIds`, throw
   `SessionNotMovableError("executed")`. This is the recording reached
   through `/workout/view/:id`. It uses `listByProfile`, per B5.
7. Write `workouts.put({ ...workout, date: targetDay, updatedAt: now })`.
   `coachDate`, `state`, `modifiedAt`, `garminPushId` and `krd` are left
   untouched.
8. If a match exists, call `sessionMatch.updateDate(match.id, targetDay, now)`.

After the commit:

- Executed auto-link sees the new `match.date` on its next live-query run.
- `rescheduleWorkout.ts` is deleted, and both callers move to `moveSession`
  **in PR-1**.
- In the same PR, both callers catch `SessionNotMovableError` and show the
  blocked toast (en and es). Otherwise the detail page's
  `use-move-workout.ts:25-28`, which rethrows anything that is not a
  `WorkoutNotFoundError`, would turn a refused move on `/workout/view/:id`
  into an unhandled rejection between PR-1 and PR-2.
- Projected records are never passed in. The UI gates them, as it does today.

### 3.4 Coach follow re-dates the match (application)

- `moveOne` in `apply-coach-date-moves.ts` gains a `sessionMatch` dependency.
- When `verdict.write.date !== workout.date`, `moveOne` finds the match with
  `getByWorkoutId(workout.profileId, workout.id)`. If the match is
  **unlocked** (§3.1), it calls
  `sessionMatch.updateDate(match.id, verdict.write.date, now)` in the same
  transaction.
- If the match is **locked**, `moveOne` still writes the workout's
  `date`/`coachDate` as today, but leaves `match.date` untouched. The card
  stays on its recording's day.
- `persistSyncedWeek` passes `sessionMatch` through.
- The §3.11 decision table is unchanged.
- `CoachDateMoves` gains `overridden: { workoutId, athleteDate, coachDate }[]`.
  - `athleteDate` is the `date` before the write. `coachDate` is the fetched
    date.
  - There is one entry per `overriddenLocalMoves++`.
- `reportMoves` keeps `overridden` in the notice state
  (`coach-move-notice-state.ts:30-33`). So does the `WeekNotice` type.

### 3.5 Heal: `healMatchDates` (application)

`healMatchDates({ profileId })` is a pure pass over the profile.

- It reads `listByProfile(profileId)` and their workouts with
  `workouts.getById`, batched.
- The batched read only picks candidates. For each candidate, the heal opens
  its own transaction and **re-reads both W and M**. Then it calls
  `updateDate(M.id, W.date, now)` only if all of these hold on the fresh rows:
  - W exists
  - `W.coachDate !== undefined`
  - `W.date !== M.date`
  - M is unlocked (§3.1)
- A concurrent move or link is therefore never overwritten with an older
  value.
- A locked match is never re-dated.
- Manual matches of workouts that were not coach-built (`coachDate`
  undefined) are never touched.
- It returns the number of matches it healed. It only reports this through
  analytics, as a count with no ids.
- **It runs** once per app session per profile after the database opens, and
  after every cloud import (`syncWithCloud` / snapshot import) completes.
- The existing `useMatchedSessionsHeal` is unchanged. It heals id shapes, not
  dates.
- This covers every stale `match.date` already stored:
  - the coach moves since the Garmin follow-the-coach PRs
  - every Move from the detail page
  - torn last-writer-wins merges, where the workout and match rows merged from
    different devices

### 3.6 Week view hides plans matched in another week (UI + application)

- The week's match source loads the visible days' matches, as today. It also
  calls `listByActivityIds(profileId, weekActivityIds)` for the week's coach
  activities.
- `buildCalendarBuckets` gains `crossWeekMatchedActivityIds`. Their activity
  ids join `matchedActivityIds`, so the coach plan is hidden. Those matches
  are **not** rendered in this week; their card renders in the week of
  `match.date`.
- The same cross-week matches also feed the **workout** suppression set: their
  `workoutId` and `executedWorkoutIds` join `collectMatchedWorkoutIds`
  (`calendar-buckets.ts:35-46`), so neither the planned workout nor a
  recording renders as a solo card in this week.
  - This matters for a locked match (§3.1). After a coach move across weeks,
    M stays on Tuesday of week 1 while `W.date` moves to Thursday of week 2.
    Without this, week 2 would show W as a solo card. That card would be
    draggable, and a drag would then be refused as executed.
- The Daily view gets the same treatment through `buildTodayBuckets`.
- **Read budget**: the extra `listByActivityIds` read sits inside the same
  `useMatchedSessions` live query, and inside its `performance.measure`
  (`use-matched-sessions-perf.ts`), so the Playwright performance spec
  covers it. That spec asserts the fastest of 5 steady-state re-fires
  against a 250 ms CI envelope, scaled by the runner's slowdown.
  `USE_MATCHED_SESSIONS_BUDGET_MS` (60 ms, the upper end of D16's
  aspirational 30–60 ms slice) is reported, not asserted. PR-1 extends that
  spec with a week whose activities have matches in another week.
  - A relative assertion was tried and dropped: the same spec re-fired the
    cross-week week and a twin 30-card week without cross-week matches,
    interleaved, and bounded the ratio of their fastest spans. It measured
    1.02–1.31 over six local runs against a 1.5 budget. The ratio of two
    ~25 ms floors moves with a few ms of jitter, and CI's 128–157 ms floor,
    dominated by IndexedDB latency, was never measured for it. A budget wide
    enough not to flake would catch nothing the envelope misses.
- Example: a session moved from Sunday of week 1 to Monday of week 2.
  - Week 1 shows nothing on Sunday.
  - Week 2 shows the matched card on Monday.

### 3.7 Executed auto-link dedups across matches (application)

- `matchExecutedWorkouts` builds one `taken` set from **every** input match's
  `workoutId` and `executedWorkoutIds` before any appends. It adds to that
  set as it appends.
- So a recording already linked to one match, or claimed earlier in the same
  pass, is never appended to a second match.
- The calendar only passes the visible week's matches, so a match dated in
  another week (a manual match, a torn merge) is outside that set. Two
  layers cover it:
  - `taken` is also seeded with the cross-week matches' ids (§3.6).
  - The root fix is in `appendExecutedWorkoutIds`, in both adapters. Its
    transaction reads the profile's matches and skips any id another match
    plans or holds, whatever its week.
- The consequence of a move: moving a session onto a day that has a
  same-sport recording which no match holds yet links that recording on the
  next run. The session then counts as executed and is locked against further
  moves (§3.3 step 4). The same-sport confirmation says so (§3.8).

### 3.8 Entry points and guards (UI)

**Grid drag**

- `renderDayCards` wraps a movable `MatchedSessionCard` in the drag binding,
  keyed by `s.workout.id`.
- A session is movable when it has no executed slot, its activity is not
  `completed`, and its workout is not projected.
- A session that is not movable gets no drag binding. Its dialog shows the
  reason.
- `CoachingActivityCard` (unconverted) is never draggable.
- The List view has no drag, as today.

**Coaching dialog**

- `MatchedActions` gains **Move to another day**. It opens the same date
  picker as the workout detail; the picker component is shared, not copied.
- When the session is not movable, the action is disabled and shows the
  reason ("Already done — it can't be moved").
- For an unconverted plan, the dialog shows no Move and a hint: "Create the
  workout first to move it."

**Workout detail**

- It keeps its Move, now through `moveSession`, with the same guards and
  copy.

**Same-sport confirmation**

- Before it calls `moveSession`, every entry point runs
  `sameSportOnDay(inputs, sport, canonicalSport)`, including "Move back".
- `inputs` comes from three sources on the target day, always excluding the
  moved workout and its own match:
  - matched sessions
  - solo workouts
  - solo coach plans that are not matched
- When the target day is inside the visible week, `inputs` comes from that
  week's buckets.
- When it is outside the visible week (a date typed in the picker), `inputs`
  is read with indexed queries:
  - `sessionMatches [profileId+date]`
  - `workouts [profileId+date]`
  - `coachingActivities [profileId+date]`
- If a recording of the same sport is on the target day, the prompt reads:
  "There is already a {sport} session on {day}. If it's a recording, it will
  be linked to this session and the session will be locked. Move anyway?"
  Otherwise it reads: "There is already a {sport} session on {day}. Move
  anyway?"
- Cancelling reverts the drag and writes nothing.
- A busy day with a different sport moves without a prompt.
- There is no auto re-match: the match keeps its activity link.

**Blocked toast**

- Any entry point that catches `SessionNotMovableError` shows a toast with
  the reason.
- `WorkoutNotFoundError` keeps today's "no longer exists" toast.

### 3.9 Coach-move notice: Move back (UI)

- When `overridden.length > 0`, `CoachMoveNotice` names each overridden
  session's athlete day: "The coach moved it to {coachDate}; you had it on
  {athleteDate}".
- It shows a **Move back to {athleteDate}** button for each entry, up to 3.
  Beyond 3 it shows a count. The copy is static, in en and es.
- **Move back** is an ordinary athlete move. It runs the §3.8 flow, including
  the same-sport confirmation, and then `moveSession(workoutId, athleteDate)`.
  - It is not a pin. A later coach move to another day overrides it again and
    is reported again (row 4 of §3.11).
  - The next sync with the coach unchanged keeps it (row 1).
- An entry is hidden once it has been used. It is also hidden whenever the
  workout's current `date !== entry.coachDate`, because the athlete or the
  coach has already moved it again.
- The notice state holds only the static `overridden` list. The current date
  comes from a live read: `CoachMoveNotice` runs one `useLiveQuery` of
  `workouts.bulkGet(overridden.map(o => o.workoutId))`. An entry whose
  workout is gone is hidden as well. The notice's "used" set is kept in
  memory per notice `seq`, like the existing dismissal.
- If the workout is no longer movable, the button shows the block reason.
- The notice never pushes.

### 3.10 Static guard and stale-snapshot writers

**Root fix for stale-snapshot writers (PR-1).** These writers `put` a copy of
the workout that was read before an `await`, outside any transaction. A move,
or a coach move, that lands during that window is silently reverted. The heal
would then move the match back to the stale date.

| Site                                                                       | Snapshot taken                                 |
| -------------------------------------------------------------------------- | ---------------------------------------------- |
| `components/pages/batch-process-one.ts:52`                                 | read before the AI call                        |
| `components/pages/use-dialog-handlers.ts:64` (skip)                        | the `selectedWorkout` React state              |
| `components/pages/use-dialog-handlers.ts:79` (unskip)                      | the `selectedWorkout` React state              |
| `application/coaching/convert-coaching-activity-with-ai-idempotency.ts:77` | `existingWorkout`, read before the LLM `await` |
| `application/coaching/convert-coaching-activity-manual-helpers.ts:29`      | `getById`, then `put`, with no transaction     |

- Each site moves to `updateWorkoutRecord(persistence, id, change)`
  (`application/save-workout-edits.ts:19-31`). That helper re-reads the row
  and writes it inside one transaction.
- The `change` callback merges only the fields that site owns:
  - the state transition plus `krd` and `aiMeta`, or
  - `state` and `krd` for the manual template.
- The re-read `date`, `coachDate` and `updatedAt` stamp are kept.
- A row that is gone is not resurrected.
- The callback checks the **fresh** row's `state` before transitioning. Say
  the row is no longer in the state the transition expects: for example, it
  was skipped while the AI call ran, or it is already structured. Then the
  transition is a no-op skip. It does not throw, and it writes nothing. The
  caller treats the outcome as skipped, not failed, and not as a success:
  - `updateWorkoutRecord` returns `false`.
  - The batch's `processOne` returns `written: false`. `processBatch` keeps
    the row in a `skipped` bucket and status, and the toast names it apart
    from the processed rows.
  - `processExistingRawInPlace` emits `coaching.convert_with_ai.skipped`
    instead of `success`.
  - Dialog skip and unskip close silently.
- Each site gets a test that interleaves a `moveSession` during the `await`,
  or between the snapshot and the write, and asserts the moved date survives.

**The guard: `scripts/check-workout-date-writers.mjs`**

- It scans `packages/workout-spa-editor/src`, excluding tests, for every call
  site of:
  - `put`, `bulkPut`, `update`, `add` and `bulkAdd` on `workouts`,
    including `deps.workouts`, `persistence.workouts` and `db.workouts`
  - the same methods on `table("workouts")`
- It classifies each site against a registry in the script. The registry is
  named `WORKOUT_DATE_WRITERS`, an exported array of
  `{ file, reason, note, via? }` objects.
  - `scripts/check-allowlists-empty.mjs` forbids only a non-empty
    `const ALLOWLIST = new Set([...])` in `scripts/check-*.mjs`.
  - This registry is not named `ALLOWLIST` and is not a `Set` of strings. It
    is a permanent classification of legitimate writers, not a drained
    allowlist, so it complies by name and by shape.
- Each entry's reason is one of the following. The lists were verified on
  `origin/main` @ `77f1236d9`.
  - `date-writer`: `application/move-session.ts` and
    `application/coaching/apply-coach-date-moves.ts`. The file must also call
    `sessionMatch.updateDate`, and the script asserts this.
    - `via` names the module that makes that call for the writer:
      `apply-coach-date-moves.ts` re-dates an unlocked match through
      `application/coaching/redate-followed-match.ts` (§3.4).
    - The file must import a relative specifier that resolves to its `via`.
      `via` is rejected on any reason other than `date-writer`.
  - `date-preserving`: re-read and write in one transaction, keeping the
    fresh `date`:
    - `application/save-workout-edits.ts`
    - `hooks/garmin-place-record.ts`
    - The five fixed sites are **not** listed. They call
      `updateWorkoutRecord` and have no `workouts.put` of their own, so an
      entry for them would fail as stale. `save-workout-edits.ts` covers
      them.
  - `creator`: writes a new row or restores a deleted one, so no match can be
    stale:
    - `application/coaching/convert-coaching-activity.ts`
    - `convert-coaching-activity-manual.ts`
    - `convert-coaching-activity-with-ai-helpers.ts`
    - `persist-coaching-workout.ts`
    - `application/library/schedule-template.ts`
    - `application/restore-deleted-workout.ts`
    - `components/organisms/ImportDropzoneOverlay/persist-imported-workout.ts`
    - `components/organisms/ScratchEditorSurface/persist-scratch-workout.ts`
    - `components/pages/CreateWorkout/use-save-and-push.ts`
    - `components/pages/use-schedule-template.ts`
    - `hooks/chat/chat-create-workout.ts`
- **Fails** when:
  - a call site is not in the registry (the message names the file and line)
  - a `date-writer` lacks `updateDate`, in the file and in its `via`
  - a `via` the file does not import, or a `via` on another reason
  - a registry entry matches no call site (a stale entry)
- **Generic imports**:
  - Snapshot import and the profile ops write through a generic
    `table.bulkPut(rows)` loop (`adapters/dexie/dexie-snapshot-port.ts:93`,
    `dexie-snapshot-profile-ops.ts:43`). Dexie migrations use
    `tx.table(storeName)`.
  - These call sites name no `workouts` literal, so the scan does not match
    them. There is no `import-exempt` entry, which would only match nothing
    and fail as stale.
  - The heal covers them instead. It runs after every import (§3.5), and a
    PR-1 unit test asserts the import path calls it.
- `scripts/check-workout-date-writers.test.mjs` sits next to the script. Its
  fixtures cover:
  - an unlisted writer, which fails
  - a `date-writer` without `updateDate`, which fails
  - a `date-writer` that re-dates through its imported `via`, which passes
  - a `via` the file does not import, and a `via` on a `creator`, which fail
  - a stale registry entry, which fails
  - a clean tree, which passes
- It is wired as `lint:workout-date-writers` in `lint:parallel`, like
  `lint:session-match-id-shape`. The test runs in `pnpm test:scripts`.

### 3.11 Garmin: "Garmin still on {date}" + "Update Garmin" (application + UI)

**Pure derivation**

- `garminDateDrift(row, workout)` returns `{ placedOn, certainty }`, or
  `undefined`:
  - It returns a value only when `isGarminPlaced(row?.placement)` holds and
    `placement.date !== workout.date`. On `origin/main`, `Placed` is
    `scheduled | unconfirmed` (`SPA/types/garmin-ledger.ts:71-101`).
  - `certainty: "placed"` when the placement kind is `scheduled`.
  - `certainty: "unconfirmed"` when the kind is `unconfirmed`: the schedule
    was sent, but Garmin's id was never confirmed.
  - `undefined` otherwise. `attempting` and `uncertain` stay with the existing
    placement notice.
  - `undefined` as well when the workout's session is **locked** (§3.1). A
    done session is not movable, so it shows no "Garmin still on" state and
    no **Update Garmin**. The caller passes `locked`:
    `garminDateDrift(row, workout, { locked })`.

**Card**

- The card shows a small badge, "Garmin: {placedOn}", or "Garmin?:
  {placedOn}" when the placement is unconfirmed.
- The week's ledger rows come from one live query (`exportLedger` by
  `kaiordRecordId` `anyOf`). It runs after the first paint, outside the week's
  critical read.

**Detail and dialog**

- They show "Garmin still on {placedOn}", or "Garmin may still be on
  {placedOn}" when unconfirmed, with an **Update Garmin** button.
- The button runs the existing `pushWorkoutToGarminCalendar` through
  `useGarminPush`. The library stays unchanged (B4), then the placement move
  runs: schedule → verify → delete. The result uses the existing
  `PlacementResult` copy.
- If the bridge is missing or outdated, the state still shows, and the button
  is disabled with the existing capability reason.

**After a move**

- If the moved workout has drift, the success toast names the Garmin date and
  carries an **Update Garmin** action.
- A move and a sync never push.

### 3.12 Train2Go (non-goal, stated)

- Kaiord does not write to Train2Go. The bridge allowlist stays GET-only.
  There is no probe, no move endpoint and no comment.
- The trace is local: `coachDate` (the coach's day), `date` (the athlete's
  day) and the namespaced `sourceId`, surfaced as the chip in §3.13.

### 3.13 Local trace: "Moved from {coachDate}" (UI)

- `MatchedSessionCard`, the coaching dialog and the workout detail show
  **Moved from {coachDate}** when `isAthleteMoved(workout)`.
- The date uses the locale's short weekday and day.
- In compact density the chip is an icon and short text. Its `aria-label`
  carries the full sentence.
- The chip clears when `date === coachDate` again.

### 3.14 Cloud sync (persistence)

- Both date writers and the heal stamp `updatedAt` on the match. The two date
  writers also stamp it on the workout, with the same `now`.
- The workout write advances the auto-push change token. The match's
  `updatedAt` makes it win the snapshot merge against an older copy.
- A torn merge resolves to the workout's date on the next heal (§3.5). The
  heal runs after every import.
- No schema version bump: `SessionMatch.updatedAt` is optional and
  unindexed.

## Acceptance criteria

| AC    | Criterion                                                                                                                                                                                                                                                                                                    | PR   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| AC-1  | `openspec validate add-coach-session-reschedule --strict`, `pnpm lint:specs` and `pnpm lint:post` pass.                                                                                                                                                                                                      | PR-0 |
| AC-2  | `SessionMatch` parses with and without `updatedAt`. In both adapters, `updateDate` re-dates and stamps, is a no-op on a missing row and rejects a malformed date. `listByActivityIds` and `listByProfile` return the right rows.                                                                             | PR-1 |
| AC-3  | `moveSession` writes `date`, `updatedAt`, `match.date` and `match.updatedAt` in one transaction. It takes `profileId` from the re-read workout and leaves `coachDate`, `state`, `modifiedAt`, `garminPushId` and `krd` untouched.                                                                            | PR-1 |
| AC-4  | `moveSession` throws `SessionNotMovableError("executed")` for a session with an executed slot and for a recording held by a match. It throws `("completed")` for a completed activity and `WorkoutNotFoundError` for a missing workout. Each makes 0 writes. The same day returns `unchanged` with 0 writes. | PR-1 |
| AC-5  | `applyCoachDateMoves` re-dates the match in every row of the §3.11 table that moves `date`. `overridden` lists the athlete's day, and its length equals `overriddenLocalMoves`. `reportMoves` keeps it.                                                                                                      | PR-1 |
| AC-6  | `scripts/check-workout-date-writers.mjs` fails on an unlisted `workouts` write call site, on a `date-writer` without `updateDate` and on a stale registry entry. It passes on the tree. Its co-located test covers all four cases.                                                                           | PR-1 |
| AC-7  | `buildCalendarBuckets` puts a moved matched session only on its new day, with no solo duplicate. This holds after a coach move. When the session crosses weeks (Sun W1 → Mon W2), W1 shows no solo plan card. The Daily view behaves the same.                                                               | PR-1 |
| AC-8  | Executed auto-link attaches a same-sport recording on the moved day to the moved match. It never attaches a recording already held by another match.                                                                                                                                                         | PR-1 |
| AC-9  | Cloud merge: a moved workout and its match win against a stale remote copy, and the change token advances after a move. A torn merge (workout from A on Thu, match from B on Tue) ends with the match on Thu after the post-import heal.                                                                     | PR-1 |
| AC-10 | `healMatchDates` re-dates a stale match of a coach-built workout and stamps `updatedAt`. It leaves a manual cross-day match (`coachDate` undefined) untouched. It runs at startup and after an import.                                                                                                       | PR-1 |
| AC-11 | Grid: a movable matched card can be dragged to another day, and the move persists after a reload. Executed, completed, unconverted and projected cards are not draggable.                                                                                                                                    | PR-2 |
| AC-12 | Dialog: **Move to another day** moves the session. It is disabled with the reason when the session is not movable. An unconverted plan shows the create-first hint.                                                                                                                                          | PR-2 |
| AC-13 | Same-sport check, matched input: a matched session of the same sport on the target day triggers the prompt, and cancelling makes 0 writes.                                                                                                                                                                   | PR-2 |
| AC-14 | Same-sport check, solo workout input: a solo workout of the same sport triggers the prompt. A recording adds the "will be linked and locked" sentence.                                                                                                                                                       | PR-2 |
| AC-15 | Same-sport check, solo coach plan input: an unmatched coach plan of the same sport triggers the prompt.                                                                                                                                                                                                      | PR-2 |
| AC-16 | Same-sport check, target outside the visible week: it is read with the three indexed queries and gives the same verdicts. A different sport never prompts, and the moved session is never counted.                                                                                                           | PR-2 |
| AC-17 | **Moved from {coachDate}** shows iff `date !== coachDate`, on the card, the dialog and the detail, in en and es, with an accessible name.                                                                                                                                                                    | PR-2 |
| AC-18 | The notice names the overridden athlete day. **Move back** restores it through the same flow, including the same-sport check. The entry hides once used, or once `date !== entry.coachDate`. A later coach move overrides it again and is reported again.                                                    | PR-2 |
| AC-19 | `garminDateDrift` gives `placed` / `unconfirmed` / `undefined` per §3.11. The card badge and the detail state show it with the matching copy. No push happens on a move or a sync.                                                                                                                           | PR-3 |
| AC-20 | **Update Garmin** runs schedule new → verify → delete old, and the state clears. A missing or outdated bridge disables the action, and nothing crashes.                                                                                                                                                      | PR-3 |
| AC-21 | Playwright E2E: drag on a matched card persists after a reload, and blocked cards are not draggable.                                                                                                                                                                                                         | PR-2 |
| AC-22 | Playwright E2E: the flows of the PR-4 test plan pass on a fresh profile with the Train2Go and Garmin bridge stubs.                                                                                                                                                                                           | PR-4 |
| AC-23 | `pnpm -r test && pnpm -r build && pnpm lint && pnpm test:scripts` pass.                                                                                                                                                                                                                                      | each |
| AC-24 | A locked match (an executed slot, or a `completed` activity) is never re-dated. After a coach move, the workout's `date`/`coachDate` follow the coach while `match.date` stays. A heal pass leaves it as it is. The recording does not re-appear as a solo card and is not linked to a second match.         | PR-1 |
| AC-25 | The five stale-snapshot writers of §3.10 re-read and write in one transaction. In each, a `moveSession` interleaved during the `await` keeps its date.                                                                                                                                                       | PR-1 |
| AC-26 | On `/workout/view/:id`, a refused move (`SessionNotMovableError`) shows the blocked toast (en and es) and raises no unhandled rejection. This holds already after PR-1.                                                                                                                                      | PR-1 |
| AC-27 | A new match for a coach-built workout is dated from the workout's `date`. A non-coach-built workout's match is dated from the activity's `date`.                                                                                                                                                             | PR-1 |
| AC-28 | A locked match whose coach-built workout is coach-moved into the next week (M on Tue W1, `W.date` on Thu W2) renders its matched card in W1 only. W2 shows no solo card for W or its recordings, and the Daily view on Thursday shows none either.                                                           | PR-1 |
| AC-29 | `garminDateDrift` returns `undefined` for a locked session. A done session shows no "Garmin still on" state and no **Update Garmin**.                                                                                                                                                                        | PR-3 |
| AC-30 | A stale-snapshot writer whose fresh row changed state during the `await` (for example, skipped during the AI call) writes nothing and does not throw. Its outcome is skipped.                                                                                                                                | PR-1 |

## Test plan (per PR)

Every PR runs `pnpm -r test && pnpm -r build && pnpm lint && pnpm test:scripts`.
`pnpm lint` does not run the scripts' unit tests (AC-23).

**PR-1: domain, port, use case, coach follow, heal, cross-week, auto-link
dedup, writers guard.** Vitest, with in-memory persistence and the Dexie
adapter tests, plus `node --test`.

- Schema: `SessionMatch` with and without `updatedAt` (AC-2).
- Adapters: `updateDate`, `listByActivityIds` and `listByProfile`, in Dexie
  and in memory (AC-2).
- `moveSession`:
  - happy path, with and without a match
  - `profileId` taken from the workout
  - untouched fields, and `unchanged`
  - executed slot, recording held by a match, completed, not found
  - a racing writer is not rolled back, following the
    `reschedule-workout.writers.test.ts` pattern (AC-3, AC-4)
- `applyCoachDateMoves`: the 4 rows of §3.11 with a match, the `overridden`
  contents, and `reportMoves` (AC-5).
- `check-workout-date-writers` and its `.test.mjs` (AC-6).
- `buildCalendarBuckets` and `buildTodayBuckets`: an athlete move, a coach
  move, and a cross-week move (AC-7).
- `matchExecutedWorkouts`: links a recording on the new day. A recording held
  by another match, or claimed earlier in the same pass, is not linked (AC-8).
- Sync merge:
  - a stale remote copy loses
  - the change token advances
  - a torn merge followed by the heal ends with the match on the workout's
    date (AC-9)
- `healMatchDates`: a stale coach-built match is re-dated, a manual cross-day
  match is left alone. The heal is wired at startup and after import (AC-10).
- Mixed-version sync: a snapshot whose matches have no `updatedAt` imports,
  and the heal re-stamps any that are stale.
- Locked matches (AC-24):
  - `applyCoachDateMoves` with an executed match and with a `completed`
    activity: the workout moves and the match stays
  - the heal skips locked matches
  - buckets keep the card on the recording's day, and the recording is not
    shown as a solo card
- The heal re-reads W and M: a move between the batch read and the write is
  not reverted.
- Stale-snapshot writers (AC-25): one interleaving test per site.
- `use-move-workout`: a `SessionNotMovableError` shows the toast and is not
  rethrown (AC-26).
- Match creation date for coach-built and other workouts (AC-27).
- Locked match plus a coach move across weeks: no solo card in week 2, in the
  Grid and Daily views (AC-28).
- Stale-snapshot writer whose state changed during the `await`: no write and
  no throw (AC-30).
- The `useMatchedSessions` performance spec (250 ms CI envelope, 60 ms
  aspirational slice) with cross-week matches (§3.6).

**PR-2: entry points, chip, same-sport check, Move back.** RTL, plus one
Playwright spec.

- `day-column-cards`: the drag binding per guard (AC-11).
- `MatchedActions` / `CoachingActivityDialog` (AC-12).
- `sameSportOnDay`, one test per input:
  - matched (AC-13)
  - solo workout, and a recording (AC-14)
  - solo plan (AC-15)
  - outside the visible week (AC-16)
- The chip (AC-17).
- `CoachMoveNotice`, Move back, entry hiding and re-override (AC-18).
- `e2e/coach-session-drag.spec.ts`, with the Train2Go stub on a fresh profile:
  - sync → convert → drag Tue → Thu, and a reload keeps it
  - an executed session is not draggable (AC-21)

**PR-3: Garmin state and Update.** Vitest and RTL.

- The `garminDateDrift` truth table: `Placed` on the same day and on another
  day, `unconfirmed`, `attempting`, `uncertain`, no row (AC-19), and a locked
  session (AC-29).
- The badge, the detail state and the post-move toast. No push happens on a
  move or a sync (AC-19).
- **Update Garmin** with the fake calendar port runs schedule → verify →
  delete. A missing or outdated bridge disables it. Extend
  `coach-move-push.test.ts` with an athlete-move case (AC-20).
- **Manual**: "Update Garmin" against a real account is covered by
  `add-garmin-calendar-scheduling` task 9.4 (manual E2E check 3). No separate
  runbook.

**PR-4: Playwright E2E and docs.** Train2Go and Garmin bridge stubs, fresh
profile (AC-22).

1. Re-sync with the stub unchanged after an athlete move. The session stays
   on Thu, with no notice.
2. The stub's coach moves the session to Fri. The card is on Fri, and the
   notice names Thu. **Move back** returns it to Thu.
3. A coach-only move. The card moves to the new day. This is the regression
   test for the stale `match.date`.
4. A cross-week move from Sun to the next Mon. The old week shows no solo
   plan card, and the new week shows the matched card on Mon.
5. The Garmin stub: send → move → "Garmin still on Tue" → **Update Garmin**.
   The stub receives schedule(Thu) and then delete(Tue). The ledger has
   `Placed.date = Thu`.
6. A fresh profile with no Garmin bridge: no badge and no crash. In the List
   view, Move through the dialog works with no drag.
7. Docs and the release note: coach-moved cards now move, and existing stale
   cards are healed.

## Risks

- **Denormalised drift**: a future date writer that forgets the match.
  Mitigated by the static guard (§3.10) and the heal (§3.5).
- **Visible behaviour change**: coach-moved cards and healed stale cards
  move. Note it in the changelog.
- **Clock skew**: last-writer-wins can still revert a move across devices.
  This is an accepted residual. A torn merge heals to the workout's date.
- **Clock-skewed future `updatedAt` (known limitation, out of scope)**:
  - The auto-push change token is the `max(updatedAt)` over the synced
    tables. If a synced workout carries an `updatedAt` in the future, from a
    device whose clock ran ahead, a move stamped with the real `now` may not
    raise that maximum.
  - The token then does not change, and auto-push can skip the move until a
    later write passes the skewed stamp. A manual push still sends it.
  - This is a property of the existing last-writer-wins token, not of this
    change. A fix belongs to cloud sync, for example a per-write counter or
    clamping future stamps on import.
- **Silent divergence from the coach**: Train2Go is read-only (non-goal).
- **Profile scan cost** for the heal and the recording check (B5). Profiled
  in PR-1.
- **Sequencing with `add-garmin-calendar-scheduling`**: no shared requirement
  is modified. See `proposal.md`.
