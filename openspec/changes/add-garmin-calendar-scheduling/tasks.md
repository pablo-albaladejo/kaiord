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

- [x] 2.1 Capture `GET /calendar-service/year/{Y}/month/{M}` and record in
      `design.md`, for A1–A5 and A7: the field names, the month base, one
      redacted item and the measured write-to-read lag. No token is stored;
      test entities are deleted afterwards (AC-1).
- [x] 2.2 If A1 is false, drop task group 4, the `calendar-find` requirement
      and the eleventh external action from the `garmin-bridge` delta. Not
      needed: A1 holds (T0b, 2026-09-28).

## 3. Bridge write verbs and deadline (T2, PR-1)

- [x] 3.1 Add the `POST` and `DELETE` `/workout-service/schedule/<digits>`
      allowlist entries, one physical line each (AC-3).
- [x] 3.2 Add the `schedule` and `unschedule` actions with input validation
      before any fetch (ids `^[1-9]\d*$`, a real `YYYY-MM-DD` date) and add them to
      `EXTERNAL_ACTIONS` (AC-4, AC-5).
- [x] 3.3 Run both actions under the per-action deadline: `D` = 25 s from
      handler entry on the call's own requests, no write started after
      `D_START` = 15 s (`deadline-before-send`), and an abort after the send
      answered with no status (AC-4 a, c, d).
- [x] 3.4 In `garmin-oauth.js`, run the token lifecycle on the untimed fetch
      and race only the caller's wait, a joined `mintInFlight` included,
      against the deadline signal, so no joiner is failed by another caller's
      deadline (AC-4 b).
- [x] 3.5 Add `features: ["calendar-write-v1"]` to the ping data (AC-9).
- [x] 3.6 Tests in `test/background.test.js` and `test/garmin-oauth.test.js`.
- [x] 3.7 Refresh the privacy-surface golden (+2 paths, +2 actions) and
      disclose the calendar write and delete in `privacy-justification.md` and
      `store-listing.md` (AC-6).
- [x] 3.8 Update `packages/garmin-bridge/AGENTS.md`; add a minor changeset for
      `@kaiord/garmin-bridge`.

## 4. Bridge calendar read (T3, PR-1, after T0b)

- [x] 4.1 Add the `GET /calendar-service/year/<yyyy>/month/<m>` allowlist
      entry and the `calendar-find{workoutId, date}` action, returning only
      `[{workoutScheduleId | null, date}]` for the target workout (AC-7).
- [x] 4.2 Map the date to the month parameter with the base T0b records
      (A4; a September date requests `month/8` if 0-based) (AC-8).
- [x] 4.3 Add `calendar-find-v1` to `features` (AC-9).
- [x] 4.4 Tests with a mixed month fixture; refresh the golden (+1 path,
      +1 action) and disclose the read in the CWS documents (AC-6).

## 5. Ledger model and Phase 1 (T4, PR-2)

- [x] 5.1 Ledger types and branded ids (`GarminWorkoutId`,
      `GarminScheduleId`) in `SPA/types/garmin-ledger.ts`, the optional fields
      on `SPA/types/export-ledger.ts` (AC-16).
- [x] 5.2 `buildCommitPatch` as the only `commitByKey` patch on both paths;
      `handleConstraintResult` checks `pending`, then `forceRepush`, then the
      hash (AC-10, AC-11).
- [x] 5.3 Stale-pending recovery (`PENDING_TTL_MS`), `pushQuiet`, and
      `do-push-to-garmin` persisting only a confirmed id (AC-17).
- [x] 5.4 `normalizeGarminLedgerRow`, the Dexie v36 upgrade, and an optional
      `normalize` on `RowMergeHook` applied on import (AC-13, AC-14).
- [x] 5.5 `mergeGarminLedgerRows`, replacing the `exportLedger` entry of
      `ROW_MERGE_HOOKS`; symmetric, supersession before clock (AC-15).
- [x] 5.6 Verify `mutateByKey` stamping for the new fields (AC-12).

## 6. Placement pipeline, detection and stub (T5, PR-3)

- [ ] 6.1 Pipeline core and ports: `classify-bridge-write`,
      `placement-{claim,resolve,schedule-step,commit,removal-step}`,
      `reconcile-garmin-placement`, `push-workout-to-garmin-calendar`,
      `garmin-calendar-port`, `record-lock-port` with a Web Locks adapter and
      an in-memory fake (AC-18..AC-34).
- [ ] 6.2 Wiring and UI: `garmin-calendar-operations` with the per-action
      timeout, detection `features`, `useGarminPush`, EditorPage,
      `do-push-to-garmin`, and the result / uncertain / dismiss UI in en and es
      (AC-35). Dismiss ("I removed it", writes `gone`) must cover `held`
      entries as well as abandoned ones: a seen `held` id is a durable
      legacy duplicate that only the athlete can clear; its copy warns
      that the entry may be the current placement on another device
      (design §3.9, held-dismiss residual). An `unconfirmed`
      commit records `supersedes` (every queue id at the commit);
      "It's in Garmin" and A3-false adoptions record `[]`.
- [ ] 6.3 E2E stub: numeric ids, an in-memory calendar, `calendar-find`,
      `features`, failure injection and delays.
- [ ] 6.4 Resolve `uncertain` through the ledger state lattice (design
      §3.9): commits write the new id `keep` and the superseded one
      `retire`; one `calendar-find` match is adopted `keep` (a `scheduled`
      `previous` becomes `retire`), seen held ids stay `held`, unseen ones
      `gone`; several matches →
      `duplicate-left` with states unchanged; the drain sends only
      `retire` ids and writes `gone` on 204 or a verified 404.
- [ ] 6.5 Carried over from T4:
  - AC-17's "0 schedule calls" half (a failed library push makes no
    calendar call) needs this pipeline; test it here.
  - `PENDING_TTL_MS` is 5 min: a quiet bulk push must never sit longer
    than that between the pending claim and the commit, or it must refresh
    the pending stamp, else another run recovers it and pushes twice.
  - A legacy row with `library: unconfirmed` and an equal hash is
    `skipped` forever; the placement path needs a way out (set
    `forceRepush`, or treat `unconfirmed` as not pushed for placement).
  - A rolled-back claim must not make a stale row newer: when a failed or
    definite push restores the placement and queue to their pre-claim
    value, restore the pre-claim `updatedAt` too, so the rollback is a
    no-op for the merge order. PR-2's `mutateByKey` cannot express this:
    its no-op (a row deep-equal to the current one) compares against the
    claimed row, and any other result is stamped `now`. Extend the
    contract here (for example, `fn` returns the captured pre-claim row
    and the repository stores it verbatim when the current row is still
    the claim it wrote).

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
