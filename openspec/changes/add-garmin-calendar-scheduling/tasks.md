## 0. Prerequisite: ledger cloud-sync fix (T0c, PR-0)

- [x] 0.1 Merged as #1265: `updatedAt` stamping and backfill, dedupe by
      natural key, `mutateByKey` / `commitByKey` / `rollbackPending`, the
      `ROW_MERGE_HOOKS` registry, and `importTables` merging `exportLedger`
      against the live rows through an injected `LiveRowMerge` (AC-0).

## 1. OpenSpec change (T1, PR-1)

- [x] 1.1 Write `proposal.md`, `design.md` (the ADR verbatim, the normative
      design and the assumptions) and this task list.
- [x] 1.2 Write the spec deltas: `garmin-bridge`, `spa-garmin-extension`,
      `spa-calendar`, `spa-coaching-integration`, `spa-persistence-port`,
      `privacy-policy`.
- [x] 1.3 `pnpm lint:specs` and
      `openspec validate add-garmin-calendar-scheduling --strict` pass (AC-2).

## 2. Live capture gate (T0b, PR-1)

- [ ] 2.1 Capture `GET /calendar-service/year/{Y}/month/{M}` and record in
      `design.md`, for A1–A5 and A7: the field names, the month base, one
      redacted item and the measured write-to-read lag. No token is stored;
      test entities are deleted afterwards (AC-1).
- [ ] 2.2 If A1 is false, drop task group 4, the `calendar-find` requirement
      and the eleventh external action from the `garmin-bridge` delta.

## 3. Bridge write verbs and deadline (T2, PR-1)

- [x] 3.1 Add the `POST` and `DELETE` `/workout-service/schedule/<digits>`
      allowlist entries, one physical line each (AC-3).
- [x] 3.2 Add the `schedule` and `unschedule` actions with input validation
      before any fetch (ids `^\d+$`, a real `YYYY-MM-DD` date) and add them to
      `EXTERNAL_ACTIONS` (AC-4, AC-5).
- [x] 3.3 Run both actions under the per-action deadline: `D` = 30 s from
      handler entry injected into every hop through `fetchImpl`, no write
      started after `D_START` = 20 s (`deadline-before-send`), and an abort
      after the send answered with no status (AC-4 a, c, d).
- [x] 3.4 In `garmin-oauth.js`, race the token lifecycle, a joined
      `mintInFlight` included, against the deadline signal (AC-4 b).
- [x] 3.5 Add `features: ["calendar-write-v1"]` to the ping data (AC-9).
- [x] 3.6 Tests in `test/background.test.js` and `test/garmin-oauth.test.js`.
- [x] 3.7 Refresh the privacy-surface golden (+2 paths, +2 actions) and
      disclose the calendar write and delete in `privacy-justification.md` and
      `store-listing.md` (AC-6).
- [x] 3.8 Update `packages/garmin-bridge/AGENTS.md`; add a minor changeset for
      `@kaiord/garmin-bridge`.

## 4. Bridge calendar read (T3, PR-1, after T0b)

- [ ] 4.1 Add the `GET /calendar-service/year/<yyyy>/month/<m>` allowlist
      entry and the `calendar-find{workoutId, date}` action, returning only
      `[{workoutScheduleId | null, date}]` for the target workout (AC-7).
- [ ] 4.2 Map the date to the month parameter with the base T0b records
      (A4; a September date requests `month/8` if 0-based) (AC-8).
- [ ] 4.3 Add `calendar-find-v1` to `features` (AC-9).
- [ ] 4.4 Tests with a mixed month fixture; refresh the golden (+1 path,
      +1 action) and disclose the read in the CWS documents (AC-6).

## 5. Ledger model and Phase 1 (T4, PR-2)

- [ ] 5.1 Ledger types and branded ids (`GarminWorkoutId`,
      `GarminScheduleId`) in `SPA/types/export-ledger.ts` (AC-16).
- [ ] 5.2 `buildCommitPatch` as the only `commitByKey` patch on both paths;
      `handleConstraintResult` checks `pending`, then `forceRepush`, then the
      hash (AC-10, AC-11).
- [ ] 5.3 Stale-pending recovery (`PENDING_TTL_MS`), `pushQuiet`, and
      `do-push-to-garmin` persisting only a confirmed id (AC-17).
- [ ] 5.4 `normalizeGarminLedgerRow`, the Dexie v36 upgrade, and an optional
      `normalize` on `RowMergeHook` applied on import (AC-13, AC-14).
- [ ] 5.5 `mergeGarminLedgerRows`, replacing the `exportLedger` entry of
      `ROW_MERGE_HOOKS`; symmetric, supersession before clock (AC-15).
- [ ] 5.6 Verify `mutateByKey` stamping for the new fields (AC-12).

## 6. Placement pipeline, detection and stub (T5, PR-3)

- [ ] 6.1 Pipeline core and ports: `classify-bridge-write`,
      `placement-{claim,resolve,schedule-step,commit,removal-step}`,
      `reconcile-garmin-placement`, `push-workout-to-garmin-calendar`,
      `garmin-calendar-port`, `record-lock-port` with a Web Locks adapter and
      an in-memory fake (AC-18..AC-34).
- [ ] 6.2 Wiring and UI: `garmin-calendar-operations` with the per-action
      timeout, detection `features`, `useGarminPush`, EditorPage,
      `do-push-to-garmin`, and the result / uncertain / dismiss UI in en and es
      (AC-35).
- [ ] 6.3 E2E stub: numeric ids, an in-memory calendar, `calendar-find`,
      `features`, failure injection and delays.

## 7. Follow the coach (T6, PR-4)

- [ ] 7.1 `coachDate` set by all three builders (AC-36).
- [ ] 7.2 `applyCoachDateMoves` in `persistSyncedWeek`, the decision table,
      the two `SyncWeekResult` counters and their copy (AC-37..AC-41).

## 8. Send week (T7, PR-4)

- [ ] 8.1 `select-week-push-candidates`, `send-week-to-garmin`, the hook, the
      organism, the `CalendarHeader` action and locales (AC-42..AC-45).

## 9. Docs, e2e, gates and manual validation (T8, PR-4)

- [ ] 9.1 Privacy policy: calendar read (filtered on the device), write and
      delete; the privacy-policy check passes (AC-46).
- [ ] 9.2 `packages/garmin/docs/API-FINDINGS.md`: the schedule calls.
- [ ] 9.3 `e2e/garmin-calendar-{bulk,move,ambiguity}.spec.ts`.
- [ ] 9.4 Manual E2E on a real Train2Go week (AC-47); evidence here, without
      tokens, and test entities removed afterwards.
- [ ] 9.5 `pnpm -r test && pnpm -r build && pnpm lint` pass (AC-48).
