## 0. OpenSpec change (PR-0)

- [x] 0.1 Write `proposal.md`, `design.md` (the ADR, the normative design,
      the ACs and a test plan per PR) and this task list.
- [x] 0.2 Write the spec deltas for `spa-calendar`, `spa-session-match`,
      `spa-coaching-integration`, `spa-persistence-port` and
      `spa-garmin-extension`. The TrainingPeaks guard is split out into
      `add-trainingpeaks-moved-repush-guard`.
- [x] 0.3 `openspec validate add-coach-session-reschedule --strict`,
      `pnpm lint:specs` and `pnpm lint:post` pass (AC-1).

## 1. One date writer, match re-dating, heal and guards (PR-1)

Work inside-out with TDD, in this order: types → port → adapters → use cases
→ coach follow → buckets → callers → guard.

- [x] 1.1 Make `SessionMatch.updatedAt` optional in `SPA/types/session-match.ts`.
      Replace the "stable per match" comment with the effective-date rule.
      Write the schema tests first (AC-2).
- [x] 1.2 Add `SessionMatchRepository.updateDate`, `listByActivityIds` and
      `listByProfile` to the port, then to the Dexie and in-memory adapters
      (AC-2).
- [x] 1.3 Add `SPA/application/move-session.ts` with `moveSession`,
      `SessionNotMovableError` and the re-exported `WorkoutNotFoundError`.
      Take `profileId` from the re-read workout. Follow the order in design
      §3.3, including the check for a recording held by a match (AC-3, AC-4).
- [x] 1.4 Move both callers to `moveSession`
      (`calendar-dnd/use-grid-reschedule.ts` and
      `WorkoutDetail/use-move-workout.ts`), then delete
      `reschedule-workout.ts`. Port its tests, including
      `reschedule-workout.writers.test.ts`, to `move-session*.test.ts`. There
      is no chat-tool caller on `origin/main`.
- [x] 1.4b In the same PR, make both callers catch `SessionNotMovableError`
      and show the blocked toast, in en and es. `use-move-workout.ts:25-28`
      rethrows anything but `WorkoutNotFoundError`, so without this main
      would raise an unhandled rejection between PR-1 and PR-2 (AC-26).
- [x] 1.5 Make `applyCoachDateMoves` re-date the match in the same
      transaction and return `CoachDateMoves.overridden`. Have
      `persistSyncedWeek` pass `sessionMatch`. Keep `overridden` in
      `reportMoves` (`contexts/coach-move-notice-state.ts:30-33`) and in the
      `WeekNotice` type (AC-5). Leave a locked match's `date` untouched
      (design §3.1), with tests for an executed match and for a `completed`
      activity (AC-24).
- [x] 1.6 Add `healMatchDates({ profileId })` (design §3.5). Wire it once per
      session per profile after the database opens, and after every cloud
      import (AC-9, AC-10). Re-read W and M in each per-match transaction,
      and skip locked matches (AC-24). Assert the snapshot import path calls
      it.
- [x] 1.7 Make the week match source also call `listByActivityIds` for the
      week's coach activities. Add `crossWeekMatchedActivityIds` to
      `buildCalendarBuckets`, and route it through `buildTodayBuckets` (AC-7).
      Keep the read inside the `useMatchedSessions` measure, and extend the
      Playwright performance spec (250 ms CI envelope, 60 ms aspirational
      slice) with cross-week matches.
      Add the cross-week matches' `workoutId` and `executedWorkoutIds` to
      the solo-workout suppression set, in the Grid and Daily views. Test a
      locked match coach-moved across weeks (AC-28).
- [x] 1.8 Build `matchExecutedWorkouts`'s `taken` set from all matches
      (design §3.7) (AC-8).
- [x] 1.8b Fix the five stale-snapshot writers of design §3.10
      (`batch-process-one.ts:52`, `use-dialog-handlers.ts:64,79`,
      `convert-coaching-activity-with-ai-idempotency.ts:77`,
      `convert-coaching-activity-manual-helpers.ts:29`). Move each to
      `updateWorkoutRecord`, merging only the fields it owns and keeping the
      re-read `date`. Write a test per site that interleaves a `moveSession`
      during the `await` (AC-25). When the fresh row's state no longer fits
      the transition, skip as a no-op, with no throw and no write (AC-30).
- [x] 1.8c Date a new match from the workout's `date` for coach-built
      workouts. The callers of `ensureSessionMatch` and `match-session.ts`
      pass `coachDate !== undefined ? workout.date : activity.date`.
      `ensureSessionMatch` stays repository-only (AC-27).
- [x] 1.9 Add `scripts/check-workout-date-writers.mjs` and its co-located
      `check-workout-date-writers.test.mjs`. The registry is
      `WORKOUT_DATE_WRITERS`, an array of `{ file, reason, note }` with
      reasons `date-writer`, `date-preserving` and `creator`, so
      `check-allowlists-empty.mjs` does not apply. Fail on stale entries.
      Wire it as `lint:workout-date-writers` in `lint:parallel` (AC-6).
- [x] 1.10 Add regression tests: buckets after an athlete move, a coach move
      and a cross-week move (AC-7); the auto-link (AC-8); merge, change token,
      torn merge and heal (AC-9); and mixed-version import with no
      `updatedAt`.
- [x] 1.11 Run `pnpm -r test && pnpm -r build && pnpm lint && pnpm test:scripts`
      (AC-23).

## 2. Entry points, trace chip, same-sport check and Move back (PR-2, after PR-1)

- [x] 2.1 Add `isMovableSession(session)` and
      `sameSportOnDay(inputs, sport, canonicalSport)` as pure functions, with
      inputs for matched sessions, solo workouts and solo plans. Write their
      unit tests first, one per input (AC-11, AC-13..AC-15).
- [x] 2.2 Add an indexed read of the target day's inputs for a date outside
      the visible week, using `[profileId+date]` on `sessionMatches`,
      `workouts` and `coachingActivities` (AC-16).
- [x] 2.3 Add Grid drag on movable `MatchedSessionCard`s in `renderDayCards`.
      Do not bind cards that are not movable, and never bind
      `CoachingActivityCard` (AC-11).
- [x] 2.4 Extract a shared date picker. Add **Move to another day** to
      `MatchedActions`, disabled with the reason when the session is not
      movable. Show the create-first hint for an unconverted plan (AC-12).
- [x] 2.5 Show the same-sport confirmation on every entry point, Move back
      included. Add the "will be linked and locked" sentence when the target
      day has a recording. Cancelling writes nothing (AC-13..AC-16).
- [x] 2.6 Add the **Moved from {coachDate}** chip, in en and es, with an
      `aria-label` (AC-17).
- [x] 2.7 Make `CoachMoveNotice` name the overridden athlete days, with
      **Move back** for each, up to 3. Hide an entry once used or once
      `date !== entry.coachDate`, read live with one `useLiveQuery` of
      `workouts.bulkGet` (design §3.9). Provide en and es copy (AC-18).
- [x] 2.8 Reuse the blocked toast of 1.4b on the new entry points, and add
      the not-found toast, in en and es.
- [x] 2.9 Add `e2e/coach-session-drag.spec.ts`: on a fresh profile with the
      Train2Go stub, drag a matched card and reload; an executed session must
      not be draggable (AC-21).
- [x] 2.10 Run `pnpm -r test && pnpm -r build && pnpm lint && pnpm test:scripts`
      (AC-23).

## 3. Garmin out-of-date placement state (PR-3, after PR-1)

- [ ] 3.1 Add `garminDateDrift(row, workout)` as a pure function, covering
      `placed` and `unconfirmed`, plus no drift for a locked session. Write
      the truth-table tests first (AC-19, AC-29).
- [ ] 3.2 Read the visible week's ledger rows with one live query. Show the
      card badge ("Garmin:" / "Garmin?:") off the week's critical read
      (AC-19).
- [ ] 3.3 Show the detail and dialog state ("still on" / "may still be on")
      and **Update Garmin**, which goes through `useGarminPush` →
      `pushWorkoutToGarminCalendar`. When the bridge is missing or outdated,
      disable it and show the existing reason (AC-20).
- [ ] 3.4 Add the **Update Garmin** action to the post-move toast. Assert
      that a move and a sync never push. Extend `coach-move-push.test.ts` with
      an athlete-move case (AC-19, AC-20). The manual check against a real
      account is covered by `add-garmin-calendar-scheduling` task 9.4
      (check 3).
- [ ] 3.5 Run `pnpm -r test && pnpm -r build && pnpm lint && pnpm test:scripts`
      (AC-23).

## 4. E2E, docs and release note (PR-4, after PR-2 and PR-3)

- [ ] 4.1 Extend the Train2Go bridge stub so a coach move can be scripted
      between syncs: same `sourceId`, new date.
- [ ] 4.2 Add `e2e/coach-session-reschedule.spec.ts` with flows 1–4 and 6 of
      design §Test plan PR-4, on a fresh profile (AC-22).
- [ ] 4.3 Add `e2e/coach-session-reschedule-garmin.spec.ts` with flow 5,
      using the Garmin calendar stub (AC-22).
- [ ] 4.4 Write the user docs: moving a session, what "Moved from" and
      "Garmin still on" mean, and that Train2Go is not updated. Write the
      release note: coach-moved cards now move, and stale cards are healed on
      the first launch.
- [ ] 4.5 Run `pnpm -r test && pnpm -r build && pnpm lint && pnpm test:scripts`
      (AC-23).
