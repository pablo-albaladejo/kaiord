## 0. OpenSpec change (PR-0)

- [x] 0.1 Write `proposal.md`, `design.md` (ADR, normative design, ACs, test
      plan per PR) and this task list.
- [x] 0.2 Write the spec deltas: `spa-calendar`, `spa-session-match`,
      `spa-coaching-integration`, `spa-persistence-port`,
      `spa-garmin-extension`, `spa-trainingpeaks-extension`.
- [x] 0.3 `openspec validate add-coach-session-reschedule --strict` and
      `pnpm lint:specs` pass (AC-1).

## 1. One date writer and match re-dating (PR-1)

Inside-out, TDD: types → port → adapters → use case → coach follow → callers.

- [ ] 1.1 `SessionMatch.updatedAt` optional in `SPA/types/session-match.ts`.
      Replace the "stable per match" comment with the effective-date rule.
      Write the schema tests first (AC-2).
- [ ] 1.2 `SessionMatchRepository.updateDate(matchId, date, updatedAt)` in the
      port, then the Dexie and in-memory adapters. No-op on a missing row,
      malformed date rejected (AC-2).
- [ ] 1.3 `SPA/application/move-session.ts`: `moveSession`,
      `SessionNotMovableError`, and the re-exported `WorkoutNotFoundError`,
      with the transaction order of design §3.3 (AC-3, AC-4).
- [ ] 1.4 Move both callers (`calendar-dnd/use-grid-reschedule.ts`,
      `WorkoutDetail/use-move-workout.ts`) to `moveSession`. There is no chat
      tool caller on `origin/main`; any future one uses `moveSession`, per the
      `spa-calendar` delta. Delete `reschedule-workout.ts`. Port its tests, including
      `reschedule-workout.writers.test.ts`, to `move-session*.test.ts`.
- [ ] 1.5 `applyCoachDateMoves` re-dates the match in the same transaction.
      `CoachDateMoves.overridden` holds the athlete's days.
      `persistSyncedWeek` passes `sessionMatch` (AC-5).
- [ ] 1.6 `move-session.writers.test.ts`: every path that changes a workout's
      `date` re-dates its match (AC-6).
- [ ] 1.7 Regression tests: `buildCalendarBuckets` after an athlete move and
      after a coach move (AC-7). Executed auto-link on the moved day (AC-8).
      The cloud merge and the change token after a move (AC-9).
- [ ] 1.8 `pnpm -r test && pnpm -r build && pnpm lint` (AC-20).

## 2. Entry points, trace chip, guards and Move back (PR-2, after PR-1)

- [ ] 2.1 `isMovableSession(session)`, a pure function (no executed slot, not
      `completed`, not projected), and `sameSportOnDay(...)`, also pure. Write
      the unit tests first (AC-10, AC-12).
- [ ] 2.2 Grid drag on movable `MatchedSessionCard`s in `renderDayCards`.
      Non-movable cards are not bound. `CoachingActivityCard` is never bound
      (AC-10).
- [ ] 2.3 Extract the detail's date picker into a shared component. Add
      **Move to another day** to `MatchedActions`, disabled with the reason
      when the session is not movable. Show the "Create the workout first to
      move it" hint for an unconverted plan (AC-11).
- [ ] 2.4 The same-sport confirmation on drag, dialog and detail. Cancelling
      reverts and makes 0 writes (AC-12).
- [ ] 2.5 The **Moved from {coachDate}** chip on the card, dialog and detail,
      with en and es copy and an `aria-label` (AC-13).
- [ ] 2.6 `CoachMoveNotice` names the overridden athlete day. Add
      **Move back** per entry, up to 3, with a count beyond that. en and es
      (AC-14).
- [ ] 2.7 Blocked and not-found toasts with en and es copy for every entry
      point.
- [ ] 2.8 `pnpm -r test && pnpm -r build && pnpm lint` (AC-20).

## 3. Garmin out-of-date placement state (PR-3, after PR-1)

- [ ] 3.1 `garminDateDrift(row, workout)`, a pure function. Write the
      truth-table tests first (AC-15).
- [ ] 3.2 One live query of the visible week's ledger rows. The
      "Garmin: {date}" badge on cards stays off the week's critical read
      (AC-15).
- [ ] 3.3 In the detail and dialog, the state "Garmin still on {date}" and an
      **Update Garmin** action through `useGarminPush` →
      `pushWorkoutToGarminCalendar`. A missing or outdated bridge disables
      it with the existing reason (AC-16).
- [ ] 3.4 The post-move toast carries an **Update Garmin** action when there
      is drift. Assert that a move or sync never pushes. Extend
      `coach-move-push.test.ts` with an athlete-move case (AC-15, AC-16).
- [ ] 3.5 `pnpm -r test && pnpm -r build && pnpm lint` (AC-20).

## 4. TrainingPeaks re-push guard (PR-4, after PR-1)

- [ ] 4.1 `ExportLedgerEntry.destinationDate` optional. The TrainingPeaks
      push writes it on commit (AC-17).
- [ ] 4.2 `trainingPeaksRepushGuard(row, workout, payloadHash)`, a pure
      function. Write the truth-table tests first (AC-17, AC-18).
- [ ] 4.3 The guard in `useTrainingPeaksPush` /
      `TrainingPeaksPushButton`: the blocked copy, and **Send a copy anyway**
      behind a confirmation. Blocked means 0 POSTs (AC-17).
- [ ] 4.4 `pnpm -r test && pnpm -r build && pnpm lint` (AC-20).

## 5. E2E, docs and release note (PR-5, after PR-2..PR-4)

- [ ] 5.1 Extend the Train2Go bridge stub so a coach move can be scripted
      between syncs (the same `sourceId`, a new date).
- [ ] 5.2 Add `e2e/coach-session-reschedule.spec.ts` with flows 1–4 and 6–7
      of design §Test plan PR-5, on a fresh profile (AC-19).
- [ ] 5.3 Add `e2e/coach-session-reschedule-garmin.spec.ts` with flow 5,
      using the Garmin calendar stub (AC-19).
- [ ] 5.4 User docs: moving a session, what "Moved from" and "Garmin still
      on" mean, and that Train2Go and TrainingPeaks are not updated.
      Release note: coach-moved cards now move.
- [ ] 5.5 `pnpm -r test && pnpm -r build && pnpm lint` (AC-20).
