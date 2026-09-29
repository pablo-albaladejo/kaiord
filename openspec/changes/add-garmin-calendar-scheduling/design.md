## Context

Kaiord can push a structured workout to the Garmin Connect **library**, but not
place it on the **calendar**, so nothing reaches the watch on its day. Phase 0
(2026-09-27) captured the calendar calls live from the Garmin Connect web app
against the athlete's own account. The bridge reaches the same endpoints on
`connectapi.garmin.com` with `Authorization: Bearer`, using the same
`gc-api/…` ↔ `connectapi/…` mapping as the existing library create.

```text
POST   /workout-service/schedule/{workoutId}           body {"date":"YYYY-MM-DD"}
       → 200, numeric `workoutScheduleId` at the root (plus the whole workout)
DELETE /workout-service/schedule/{workoutScheduleId}   → 204
```

Measured facts:

- The POST is **not idempotent**: two identical POSTs (same workout, same date)
  both answer 200, with different ids (`1790731208`, `1790731214`).
- A workout id that does not exist answers **404**.
- After a DELETE of every schedule id, the day holds 0 entries.
- Ids are numeric (`workoutId` `1707805999`, `workoutScheduleId` `1790718680`),
  so both match `^[1-9]\d*$`.
- No manifest or host-permission change is needed: `connectapi.garmin.com/*`
  and `write:workouts` are already declared.

`SPA` below means `packages/workout-spa-editor/src`.

## Goals / Non-Goals

- **Goal**: place a pushed workout on its date in the Garmin calendar, move it
  when its date or content changes (create first, delete after), and send a
  whole week in one action.
- **Goal**: follow the coach: a Train2Go date move moves the Kaiord workout.
- **Goal**: never leave a gap. A duplicate is tolerated and reported; a
  session missing from the calendar is not.
- **Non-goal**: deleting or recreating Garmin **library** workouts, all-or-nothing
  bulk semantics, TrainingPeaks, and unscheduling when a workout is deleted in
  Kaiord (a follow-up).

## Assumptions (checked by gate T0b; A6 is checked in the manual E2E)

The calendar **read** (`calendar-find`, task group 4) rests on assumptions
that were first observed only in the web app. T0b captured them live on
2026-09-28 (evidence below): A1–A5 hold, so `calendar-find` stays. A6 is
checked in the manual E2E; A7 and A8 remain unverified.

| #   | Assumption                                                                                              | If false                                                                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Items from `GET /calendar-service/year/{Y}/month/{M}` carry the library `workoutId`.                    | Drop `calendar-find`. Resolution falls back to a human; a DELETE 404 becomes inconclusive.                                                                                                                                                                                                                    |
| A2  | Items carry a `YYYY-MM-DD` date.                                                                        | Map the field that T0b records.                                                                                                                                                                                                                                                                               |
| A3  | Some item field equals the `workoutScheduleId`.                                                         | Use the conservative count rules in §3.4: a count of 0 ⇒ `uncertain`.                                                                                                                                                                                                                                         |
| A4  | The month parameter is 0-based.                                                                         | Flip the constant (unit-tested).                                                                                                                                                                                                                                                                              |
| A5  | A write is visible to a read within `SETTLE_MS`.                                                        | Raise `SETTLE_MS`; the gate still holds.                                                                                                                                                                                                                                                                      |
| A6  | Train2Go keeps the `sourceId` when a coach moves a session.                                             | The move arrives as delete + create; document it as a limitation.                                                                                                                                                                                                                                             |
| A7  | A DELETE on an already-deleted entry returns 404.                                                       | The read disambiguates.                                                                                                                                                                                                                                                                                       |
| A8  | A 401 on the schedule POST means Garmin did not process it. **Unverified live; T0b does not cover it.** | A 401 could hide a created entry. The bridge would have to stop treating a 401 write as not sent, so a hung re-mint after it answers `deadline-exceeded` (ambiguous) and a `needsReauth` after a 401 retry becomes ambiguous too; the SPA then resolves with `calendar-find` instead of restoring `previous`. |

### T0b evidence (live capture, 2026-09-28)

Captured from the DevTools console on `connect.garmin.com` through `/gc-api`,
the web app's cookie-and-CSRF mapping of connectapi
(`/gc-api/calendar-service/year/2026/month/9` ↔ connectapi
`/calendar-service/year/{Y}/month/{M}`). The bridge calls connectapi with a
Bearer token, the same mapping already proven for the workout create and the
schedule POST. No credential was recorded; the test entry was deleted (204).

- **Write:** `POST /workout-service/schedule/{workoutId}` with
  `{"date":"2026-10-06"}` answered 200 with `workoutScheduleId: 1792409369`.
- **A1 — holds.** Each workout item carries `workoutId`.
- **A2 — holds.** Each item carries `date` as `"YYYY-MM-DD"`.
- **A3 — holds.** The item's `id` equals the `workoutScheduleId` the POST
  returned, so the find is id-based and the count rules of §3.4 stay a
  fallback only.
- **A4 — holds.** Months are 0-based: October 2026 is `month/9`.
- **A5 — holds.** The new entry was visible on the first poll, 294 ms after the
  POST answered. `SETTLE_MS` stays 3 s, about ten times the measured lag, and
  the timing ordering of §3.4 holds with it and `D_MS` = 25 s. One schedule
  produced exactly one item for that workout on that day.
- **Ids are JSON numbers.** Both `id` and `workoutId` arrive as numbers while
  Kaiord stores digit strings, so the service worker converts them to strings
  before comparing or returning them.
- **Item shape.** An item has 70 keys, most of them for activities, races,
  badges and training plans (`title`, `distance`, `averageHR`, `calories`,
  `location`…). A redacted workout item:

  ```json
  {
    "id": 1792409369,
    "groupId": null,
    "trainingPlanId": 0,
    "itemType": "workout",
    "activityTypeId": null,
    "date": "2026-10-06",
    "sportTypeKey": "running",
    "workoutId": 1711500235,
    "protectedWorkoutSchedule": false,
    "workoutUuid": null
  }
  ```

  The service worker therefore keeps only `itemType === "workout"` items of
  the requested `workoutId`, and only their `id` and `date`.

- **Envelope key.** The month response holds its items in a
  `calendarItems` array: the probe read `calendarItems` and found the new
  item there, the only one for that workout on that day. A payload without
  that array still fails the read instead of answering an empty list.

Not covered by T0b, and still unverified:

- **A7.** The capture deleted a live entry (204); a DELETE of an
  already-deleted entry was not tried. Its fallback (the read disambiguates)
  is available because A1 and A3 hold.
- **A8.** A 401 on the schedule POST was not provoked.

If A1 is false, `calendar-find` and the `calendar-find-v1` feature are dropped
from this change: the action list in the `garmin-bridge` delta shrinks to 10,
ambiguity is resolved by a human (`uncertain`), and a DELETE 404 is
inconclusive (`attempts++`). Every pipeline rule already handles "no find
capability" (R1 in §3.4), so the rest of the design is unchanged.

## Decision record (ADR)

### Decision

Kaiord places workouts on the Garmin Connect calendar in two phases. Both run inside one Web Lock per record, taken with `navigator.locks.request("garmin-place:"+kaiordRecordId, {ifAvailable:true})`. If the lock is not available, the push returns `failed:busy`.

**Phase 1 — library push.** This is the existing governed push (`executeWorkoutPush` → `recordExport`), with these changes:

- It returns a narrow `library` state, applied by one commit helper on both the `created` and `updated` paths.
- It checks `pending` before comparing the content hash.
- It honours an explicit `forceRepush` flag.
- In bulk sends, it pushes without touching the global push UI state.

**Phase 2 — placement.** It diffs the desired placement (library workout id, date) against the persisted one. When they differ:

1. Persist `attempting{posted, at, previous}`.
2. POST `/workout-service/schedule/{workoutId}` through a bridge action with one hard deadline `D`. `D` is measured from handler entry and spans the token mint, the 401 re-mint and the POST. No POST starts after `D_START`.
3. Commit the returned `workoutScheduleId`.
4. Only then `DELETE` the superseded entry, with at most 3 attempts per id.

**Resolving ambiguity.** An ambiguous outcome is resolved with a read-only `calendar-find`:

- The service worker returns only the entries of the given `workoutId`.
- The SPA matches on date and excludes every id the ledger already knows.
- A re-POST requires an absence read that _started_ no earlier than `at + POST_GATE_MS`, where `POST_GATE_MS` exceeds `D + SETTLE_MS` plus a margin.
- Aborting a fetch does not stop Garmin committing it. The margin covers ordinary server lag; a later commit surfaces as a duplicate, never a gap.
- If Garmin exposes no schedule id, a count of 0 is never taken as proof of absence. The outcome is `uncertain`, and a human decides.

**Concurrency.**

- Tabs are serialized by the lock.
- Devices are not serialized. A cross-device race ends in a duplicate that the merge heals: a queued id is never merged as `Placed`, and the merged queue excludes the merged `Placed`.

**Bulk "Send week"** runs the same pipeline over the visible week. "Retry" re-runs only the retryable failures and, once the bridge is updated, the `library-only{bridge-outdated}` items.

**Coach moves.** When a Train2Go sync sees that the coach changed a session's date, it moves `WorkoutRecord.date`.

### Drivers

- The POST is not idempotent.
- Transport failures can be ambiguous.
- The ledger is replicated across tabs and devices.
- A date move must never mint a library workout.

### Supersedes

The salvage ADR (add-only). Creating before deleting removes the window in which the session is gone from the calendar.

### Alternatives considered

- a composite bridge move
- flat optional fields
- the date in the hash
- the salvage in-`pushFn` gate
- reading before every POST
- always asking a human
- a DELETE kill switch
- detecting coach moves at convert or at push time
- a bespoke recreate path
- a single capability flag, or a semver gate
- a Dexie TTL lease with owner and CAS (v3)
- a newest-`updatedAt` merge

### Why chosen

- Every non-idempotent write has a persisted intent, a platform lock and a bounded deadline.
- Every ambiguity has an arbiter.
- DELETE receives only branded ids returned by Garmin, and only once they are superseded.

### Consequences

- A move costs 2 calls, plus 1 read when the outcome is ambiguous.
- A failed DELETE leaves a visible duplicate until it clears or is dismissed.
- Library workouts are never deleted.
- A cross-device race can leave a duplicate, never a gap. The duplicate is untracked when a merge drops an ambiguous `attempting`.
- Cross-device clock skew above ~38 s, or a sending device that sleeps with its POST in flight, can let the gate's re-POST duplicate an entry that lands late (§3.4, residual L1): a duplicate, never a gap.
- The ledger gains `library`, `placement`, `removalQueue` and `forceRepush`, plus a shape normalizer and a merge hook.
- Placement requires Web Locks, which exist only in secure contexts. Without them the push is library-only (today's behaviour).
- Dexie v36 is a data-only bump (the store schema is v35's), but the snapshot manifest carries v36: a device still on v35 rejects the newer snapshot ("Snapshot schema v36 is newer than this app") until it updates. Release note: update every device.
- A cross-device conflict whose `Placed`s are all tainted resolves to `uncertain` with no state change: every entry stays on the calendar (a duplicate at worst) until the next push resolves it with `calendar-find`.
- The removal queue is a grow-only map of tombstones: an entry is never removed, only its state rises. It grows by a handful of ids per record (one per move plus adoptions), which is accepted.
- Legacy queue entries without a state are normalized to `held` (§3.9), so they are never drained until a `calendar-find` verifies them: duplicates at worst.

### Follow-ups

- a liveness GET
- unscheduling when a workout is deleted in Kaiord
- following the coach for session-matched workouts
- matching a coach's delete + recreate
- cleaning up superseded library workouts
- library duplicates from cross-device `[U]` pushes
- verify-before-delete makes each drain one `calendar-find` dearer; batching the verification with the drain's 404 re-checks is a possible optimisation
- a local-observation gate for the re-POST (time since this device first saw the `attempting{posted:true}`, not the writer's `at`), closing the clock-skew and sleeping-sender duplicate of §3.4 (L1)
- a conditional write on cloud sync: the Drive adapter checks `headRevisionId` and then PATCHes (`drive-rest.ts:66`), a check-then-write, and `syncWithCloud` imports its merge before the push that may be rejected (`sync-with-cloud.ts:34-38`); an atomic `If-Match` closes the first; importing only after an accepted push closes the second, and that is the half that matters: one ordinary rejected push already reaches a crossed pair (§3.9)

## Design (normative)

### 3.1 Ledger model

Location: the fields on `SPA/types/export-ledger.ts`, the branded ids and tagged unions in `SPA/types/garmin-ledger.ts` (kept apart for the 80-line cap). Applies to Garmin rows; every field is optional.

```ts
type GarminWorkoutId  = string & { readonly __b: "GarminWorkoutId" };   // ^[1-9]\d*$ via parseGarminWorkoutId
type GarminScheduleId = string & { readonly __b: "GarminScheduleId" };  // ^[1-9]\d*$ via parseGarminScheduleId
library?: { kind: "confirmed"; workoutId } | { kind: "unconfirmed" } | { kind: "missing"; workoutId }
forceRepush?: true
placement?: Placed
  | { kind: "attempting"; workoutId; date; at: string; posted: boolean; previous?: Placed;
      supersedes: GarminScheduleId[] }  // the queue ids read at the claim; sorted, unique; §3.9
  | { kind: "uncertain";  workoutId; date; previous?: Placed }
type Placed = { kind: "scheduled"; workoutScheduleId: GarminScheduleId; workoutId; date }
            | { kind: "unconfirmed"; workoutId; date; supersedes: GarminScheduleId[] }  // sorted, unique; §3.9
removalQueue?: { workoutScheduleId: GarminScheduleId; workoutId; date; attempts: number; abandoned: boolean;
                  state: "held" | "keep" | "retire" | "gone" }[]   // grow-only, one entry per id (§3.9)
```

Repository port changes:

- The port reuses `findByNaturalKey({kaiordRecordId, destinationBridgeId})` and `mutateByKey(key, fn)`, both already on `SPA/application/export/export-ledger-repository.port.ts` (**delivered by #1265**, which also replaced `deleteById` with `rollbackPending(id)` and removed the by-id `update`). This change adds no repository method.
- Every pipeline read and write addresses the row by its **natural key**, never by the ledger `id`. After T0c's dedupe, the surviving row may carry the other device's ledger `id`.
- `mutateByKey` runs as its own plain Dexie `rw` transaction and re-reads the row inside it. There is no owner and no CAS. `fn` receives `undefined` when the row is absent.
- `mutateByKey` stamps `updatedAt` only when `fn` actually changed the row (deep-equal check). This is a prerequisite for MUST-D.

### 3.2 Phase 1 changes

**`pushFn` and commits**

- `pushFn` returns `{externalId, library?}`.
- `buildCommitPatch` produces the only patch handed to `commitByKey` (`record-export-commit.ts`, delivered by #1265) on both the [C] and [U] paths. It also clears `forceRepush`.

**`handleConstraintResult` order**

1. `pending` → `lost-race`
2. `forceRepush` → `updated`
3. equal hash → `skipped`
4. otherwise → `updated`

**Other changes**

- `do-push-to-garmin` persists `garminPushId` only when `library` is `confirmed`.
- **Stale pending.** Recover a pending row once `now − clamp(exportedAt) > PENDING_TTL_MS` (5 min).
- **Bulk.** `pushQuiet` maps `executePush` to a `GarminPushOutcome` without calling `setPushing`.

**S1 — `[U]` has no pending marker**

- On the same device this is covered, because Phase 1 runs inside the record's lock.
- Across devices, two `[U]` pushes can mint two library workouts. That only orphans a library workout, never a calendar entry, and is listed as a follow-up.

### 3.3 Pipeline: `pushWorkoutToGarminCalendar(deps, record) → PlacementResult`

**0. Pre-flight** (0 calls if it fails)

- No `navigator.locks` → **library-only**. Phase 1 runs exactly as it does today, placement is skipped, and the result is `library-only{reason:"insecure-context"}` when `!isSecureContext`, else `library-only{reason:"unsupported-browser"}` (a secure page in a browser without Web Locks, such as an old Safari); neither is `failed`. The UI names the reason: the calendar needs HTTPS, or a browser that supports it (neutral copy). Web Locks exist only in secure contexts, so plain-HTTP LAN dev keeps today's library push.
- No `calendar-write-v1` capability → **library-only**, reason `bridge-outdated`. Phase 1 runs and placement is skipped, as above. Failing the push would throw away work that can be done, and in bulk it would fill the summary with red for something that is neither the athlete's fault nor the workout's; a silent library push would break the promise that the workout is on its date. So the UI shows the workout in the warning tone as "in your library, no date", with one action to update the extension (one notice per bulk run). Chrome updates extensions on its own within hours, so this state is rare and short-lived and gets no further UI. After the update, a re-push finds the content hash unchanged, makes 0 library pushes and only places the date.

**1. Lock**

- A second caller in the same tab joins the running run, via an in-tab `Map<kaiordRecordId, join>`.
  - Every joined caller's `onLibraryConfirmed` receives the confirmed library id, whenever it joined.
  - A joiner's `date` and `sendAnyway` are dropped: the run places the owner's request. A joiner that asked for another date gets `failed:busy` (the athlete retries once the run ends); one for the same date gets the owner's result.
  - Run-level side effects (`garmin-synced`) fire once, from the owning run (`onSettled`), never from a joiner.
- Otherwise, take `locks.request("garmin-place:"+id, {ifAvailable:true}, run)`.
  - A `null` lock → `failed:busy`, retryable.
  - Steps 2–8 run inside `run`. The lock is released when `run` settles.
- Chrome does not freeze a tab that holds a Web Lock, and a throttled tab keeps its lock.

**2. Phase 1.** `lost-race` → `failed:busy`.

**3. Library guard.** `library` is `unconfirmed` → `failed:library-id-unknown`.

**4. Claim** (`mutateByKey`). Branch on the current placement:

- A `Placed` equal to the desired placement → drain (§3.5) → `unchanged`.
- An `attempting{posted:false}`, no placement, or a different `Placed` → write `attempting{desired, at:now, posted:false, previous: current Placed, supersedes}`, where `supersedes` is every id in the queue this claim reads, sorted. If the current state is already `attempting`, keep its `previous`. The list is taken here, before the POST mints an id, never later (§3.9).
- An `attempting{posted:true}` → **resolve** (§3.4) before any POST. This is a leftover from a closed tab or a crashed service worker.
- `uncertain` → return `uncertain`, unless the user chose an action (§3.4).

**5. Mark posted** (`mutateByKey`). Guarded (see below). Set `posted:true, at:now`, then call `schedule` with the SPA timeout `SPA_ACTION_TIMEOUT_MS`, which is greater than `D`. **If the guard fails → `failed:busy`, with no POST.**

**6. Classify** (§3.4)

- `ok` → go to step 7.
- `definite-fail` with 404:
  - the library id was minted in this run → `failed:schedule-endpoint`;
  - otherwise → set `forceRepush` and `library:missing`, restore `previous`, return `failed:library-missing`.
- Any other `definite-fail` (including `deadline-before-send`) → restore `previous`, return `failed:<reason>`.
- `ambiguous` → keep `attempting{posted:true}`, wait `SETTLE_MS`, then resolve (R2, then the Gate). No POST in this run.

**7. Commit** (`mutateByKey`, guarded)

- Write `scheduled` with its id `keep`, or `unconfirmed` when Garmin returned no id. An `unconfirmed` commit copies `supersedes` from the claim's `attempting`; an id first learned between the claim and the commit (a sync can land after the POST) is never listed (§3.9).
- If `previous` was `scheduled`, write its id `retire` in the same write.

**8. Drain** the removal queue (§3.5). Every queue write is guarded.

**Write guard (steps 5–8 and the resolve writes).** The lock excludes only other pipeline runs. It does not exclude the other ledger writers:

- the snapshot import;
- the workout-delete cascade (`dexie-export-ledger-cascade.ts:38-51`);
- the orphan sweep (`:54-71`);
- the repository (`dexie-export-ledger-repository.ts:30-45`);
- the v36 migration.

Therefore every write inside the lock is its own `rw` transaction that re-reads the row by natural key, then applies a guard:

- **While `attempting`**: the row exists and its placement is `attempting` with the expected `at`. At the step-5 guard, the expected `at` is the one written by the claim (step 4). At step 6, step 7 and the resolve writes, it is the `at` that step 5 rewrote.
- **After the commit** (step 8 and its queue writes): the row exists and its `Placed` still carries **our `workoutScheduleId`** (by id; for an `unconfirmed` commit, the same workoutId and date). The drain writes **only its own queue id's state** on the re-read row. It never writes the whole row, so concurrent queue additions survive.

When the guard fails, the outcome depends on what happened to the row:

| Situation                                                  | Outcome                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Step 5 (before the POST)                                   | `failed:busy`, no POST.                                                                                                                                                                                                                                                                                                           |
| Row present but changed after a successful POST            | Merge our `Placed` into the current row with `mergeGarminLedgerRows` (as the "other" row).                                                                                                                                                                                                                                        |
| Row present but changed; failed or ambiguous POST          | No-op. Residual: an ambiguous POST may leave an untracked duplicate.                                                                                                                                                                                                                                                              |
| Drain                                                      | Stop draining, with no DELETE. The commit's result stands.                                                                                                                                                                                                                                                                        |
| Guard fails before the drain                               | The skip rule still applies: never unschedule the current `Placed` or `attempting.previous`.                                                                                                                                                                                                                                      |
| **Workout deleted mid-run** (row absent: cascade or sweep) | Do not recreate the row; the delete wins. Issue no DELETE. Skip the drain. Return `failed{reason:"record-deleted", retryable:false}` with a warning naming the date when the POST succeeded or was ambiguous ("an entry may remain in Garmin on {date}"). This is consistent with the follow-up "unschedule on delete in Kaiord". |

**Sync window: closed by T0c (delivered by #1265).** `syncWithCloud` exports before it imports (`sync-with-cloud.ts:33-37`). Clear + `bulkPut` from that stale export would wipe any commit made in between. T0c must therefore make `importTables` merge the `exportLedger` rows against the **live** rows inside its own `rw` transaction, using the per-table hook, not clear + `bulkPut` (AC-0). **Tombstone rule:** a live row absent from the merged snapshot is kept unless the snapshot carries a tombstone for its record. This covers a row created after the export.

- If T0c cannot deliver this, the fallback residual is an untracked duplicate, never a gap: the skip rule applies and `previous` is deleted only after a new `Placed` commits. It is recorded in R4.

**9. Result:** `scheduled | moved | unchanged | duplicate-left | uncertain | library-only{reason: insecure-context | unsupported-browser | bridge-outdated} | failed{reason, retryable, retryAfter?}`.

### 3.4 Deadline, classifier and resolve

**Service-worker deadline (MUST-A, S3, S4).** Each new action creates a deadline `signal` at handler entry, with `D_MS = 25 s`. `D_MS` stays below the ~30 s Chrome allows a pending fetch in an MV3 service worker, so the bridge, not Chrome, decides how a hung call ends.

- The action passes a `fetchImpl` that injects `signal` into its own request attempts (both attempts of the call).
- The token lifecycle (the exchange, the mint hops, the 401 re-mint) runs on the **untimed** `fetch`, and only this caller's wait for it is raced against `signal`, a joined `mintInFlight` included. A mint that other callers can join is never aborted by one caller's deadline, so a joiner is never failed with an error that is not its own. An aborted refresh is rethrown, never turned into a session re-mint.
- It refuses to start the POST once `entry + D_START_MS` (15 s, measured with `performance.now()`) has passed. It then answers `{error:"deadline-before-send", retryable:true}`, which counts as a definite failure: nothing was sent.

Timeouts on the SPA side, with `SETTLE_MS` = 3 s (A5):

- `SPA_ACTION_TIMEOUT_MS` = `D_MS` + 5 s = 30 s. It must exceed `D_MS` plus a margin for message delivery, so the bridge's own answer, definite or ambiguous, normally arrives before the SPA gives up. The generic 15 s timeout is unchanged for other actions.
- `POST_GATE_MS` = `D_MS` + `SETTLE_MS` + 10 s = 38 s. It must exceed `D_MS` (the latest a sent POST can still be in flight from the bridge) plus `SETTLE_MS` (write-to-read visibility) plus a margin for message delivery and for a server that commits a request after the client aborted it. An absence read that starts after the gate sees any POST of this attempt that Garmin committed.
- The ordering therefore holds: `D_START_MS` (15 s) < `D_MS` (25 s) < `SPA_ACTION_TIMEOUT_MS` (30 s) < `SPA_ACTION_TIMEOUT_MS` + `SETTLE_MS` (33 s) < `POST_GATE_MS` (38 s).

**Classifier**

| Class             | Cases                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **definite-fail** | Garmin 400, 403, 404 or 409; `needsReauth`, with or without a status; no status with `retryable === false` (validation or guard refusal); `deadline-before-send` |
| **ambiguous**     | `delivered:false`; SPA timeout; `context invalidated`; any other answer with no status, including `deadline-exceeded`; 500, 502, 503 or 504                      |
| **ok**            | 2xx                                                                                                                                                              |

Two bridge rules make the definite rows safe. The bridge sets `needsReauth` only before a write was sent (a mint that failed in `getToken`) or after a 401 retry, whose write Garmin refused (A8). And nothing that could have been sent carries `retryable: false`: only input validation and guard refusals do, and both happen before any fetch.

**Resolve.** Runs on `attempting{workoutId, date, at, posted:true, previous}`.

**R1 — no find capability.** Without `calendar-find-v1`, the result is `uncertain`.

**R2 — find.** Call `calendar-find(workoutId, date)`. The `known` ids are `previous.workoutScheduleId` plus the ids in the removal queue.

- **When A3 is true**, candidates are the entries with `date === attempting.date` whose id is not in `known`.
  - One candidate → adopt it as `scheduled`.
  - More than one → adopt the lowest id and return `duplicate-left`.
  - None → go to the gate.
- **When A3 is false (MUST-C)**, let `n` be the number of entries at that date.
  - `n = 0` → `uncertain`. Never re-POST on a count.
  - `n ≥ 1`, and no entry in a state other than `keep` has the same (workoutId, date) → adopt as `unconfirmed` with `supersedes: []` (the adopted entry may be a known one). If `n > 1`, the result is `duplicate-left` with no id.
  - `n ≥ 1`, and an entry in a state other than `keep` has the same (workoutId, date) → `uncertain`.

**Gate (A3 true only).**

- An absence read that _started_ at or after `at + POST_GATE_MS` → re-POST (steps 5–7).
- Otherwise → `failed{reason:"settling", retryable, retryAfter: at + POST_GATE_MS}`, with no POST.
- Residual (accepted, L1): the gate compares the reader's clock with the writer's `at`. A reader whose clock runs more than ~38 s ahead of the writer's, or a sender whose device slept with its POST still in flight, can pass the gate before that POST lands and re-POST: a duplicate, never a gap. A local-observation gate (time since this device first saw the attempt) would close it and is a follow-up.

**Read failure.** If the find read fails, the result is `uncertain`.

**Human actions on `uncertain`.**

- "It's in Garmin" → `unconfirmed` with `supersedes: []`: the entry the athlete sees may be a known id. Offered only when no entry in a state other than `keep` shares the `uncertain`'s workoutId and date; otherwise the new `unconfirmed` would be tainted at once, so the row stays `uncertain` for T5 or "Send anyway".
- "Send anyway" → POST, allowed only after `at + POST_GATE_MS`.

### 3.5 Removal queue

**Drainable = `retire`.** Only `retire` entries are sent to `unschedule`; `held`, `keep` and `gone` never are (§3.9). **Skip rule** (defence in depth): an entry whose id equals the current `Placed` or `attempting.previous` is never sent to `unschedule`, whatever its state. No entry is ever removed from the queue.

**Verify before delete** (the drain precondition). A drain with at least one `retire` to send first reads the calendar: one `calendar-find` for the current `Placed`'s workout at its date. It sends `unschedule` only when that read shows the `Placed`'s own schedule id. Otherwise it sends nothing:

| Read                                            | Action                                                                                                                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the `Placed` id is present                      | drain as below                                                                                                                                                 |
| A3 true and the id is absent                    | in one guarded write: the id `gone`, the placement `uncertain` for its workout and date; nothing is drained, and the next push resolves it (T5, "Send anyway") |
| failed, unreadable, or A3 false                 | drain nothing this run; every entry keeps its state and `attempts`                                                                                             |
| the `Placed` is `unconfirmed` (no id to verify) | no read and no drain while it stays `unconfirmed`: its `retire` entries wait, reported as `duplicate-left`                                                     |

A `Placed` whose id is absent was deleted by someone, so it cannot stand behind a delete: draining a loser behind it is exactly the gap of §3.9's skew counterexample. The read costs one `calendar-find` per drain that has something to send; the abandoned-entry re-checks send nothing and need no verification.

**`unschedule` outcomes**

| Outcome                              | Action                                                            |
| ------------------------------------ | ----------------------------------------------------------------- |
| 204                                  | write `gone`                                                      |
| 401, or no status with `needsReauth` | keep; do not count the attempt                                    |
| 404, A3 true                         | `gone` if the id is absent from a find; otherwise `attempts++`    |
| 404, A3 false                        | unreachable: an A3-false drain verifies nothing and sends nothing |
| anything else, including ambiguous   | `attempts++`                                                      |

**Abandoned entries**

- After 3 attempts, an entry becomes `abandoned`.
- An abandoned entry is re-checked with `calendar-find` on each push of its record. If A3 shows it absent, it is written `gone`.
- The user can clear it with "I removed it" (dismiss), which writes `gone`. Only an `abandoned` entry is dismissable; a `held` one never is (§3.9).

**`duplicate-left`** is returned iff this run created or kept a queue entry.

### 3.6 Bridge

**New `ALLOWED` entries**

- `POST /^\/workout-service\/schedule\/\d+$/`
- `DELETE` on the same path
- `GET /^\/calendar-service\/year\/\d{4}\/month\/\d{1,2}$/` (T3)

**New actions**

- `schedule{workoutId, date}`
- `unschedule{scheduleId}`
- `calendar-find{workoutId, date}`: returns only `[{workoutScheduleId|null, date}]` for the matching `workoutId`.

**Behaviour**

- Every action validates its inputs before any fetch and runs under the §3.4 deadline.
- `ping.features` gains `calendar-write-v1` (T2) and `calendar-find-v1` (T3).
- On the SPA side, `DetectionResult` and `GarminBridgeState` gain `features`, defaulting to `[]`.
- The deadline and signal plumbing live in `background.js` and `garmin-oauth.js`, both owned by the bridge. There is no vendored `bearer-fetch.js` change, because `fetchImpl` is injected.

### 3.7 Bulk "Send week"

**Candidates:** every workout in the visible week.

**`not-eligible`:** `raw`, `skipped` and `stale`. A `stale` workout needs the coach's change resolved first (F15).

**Runner**

- Sequential, with 500 ms between items.
- Uses `pushQuiet`.
- Takes the lock separately for each item.
- Can be cancelled between items.

**Pre-flight (once per run):** export route, Web Locks. A missing `calendar-write-v1` does not stop the run: each eligible item ends `library-only{bridge-outdated}`.

**Statuses (8):** `scheduled`, `moved`, `unchanged`, `duplicate-left`, `uncertain`, `library-only`, `not-eligible`, `failed`. `library-only` can only be `bridge-outdated` in bulk, because the bulk pre-flight requires Web Locks. It is shown in the warning tone, counted apart from the failures, and explained by one notice per run.

**"Retry"** re-runs only the retryable failures whose `retryAfter` has passed and, once the bridge reports `calendar-write-v1`, the `library-only{bridge-outdated}` items.

### 3.8 Entry points and UI

- All entry points call `pushWorkoutToGarminCalendar`.
- `push()` returns a `PlacementResult`.
- `onSent` fires iff the library push is confirmed.
- EditorPage persists the confirmed `workoutId` as the push id.
- The chat tool's result adds only app-authored enums: `calendar` (the result kind) and, for a `failed` one, its `reason`. Any exception on the chat path becomes an app-authored error code, never an exception's text.

**Analytics** (no ids, dates or names)

- `garmin-synced` counts as a success when the result is neither `failed` nor `uncertain`.
- `garmin-calendar-placement{result, reason?, durationMs, abandonedCount}`. `reason` is a closed enum: busy, settling, record-deleted, guard-failed, library-missing, library-id-unknown, schedule-endpoint, schedule-rejected, needs-reauth, library-push-failed, no-export-route, deadline-before-send, placement-interrupted (a `failed` result), and bridge-outdated, insecure-context, unsupported-browser (a `library-only` one); see "Pipeline details settled in T5".
- `garmin-calendar-bulk{counts}`

### 3.9 Normalization and merge (on top of T0c, delivered by #1265)

**T0c contract**

- `updatedAt` is stamped on every ledger write, and backfilled on existing rows.
- Rows are deduplicated by natural key.
- There is a per-table row-merge hook.

**As delivered by #1265** (closes the plan's OQ-9)

- The registry is `ROW_MERGE_HOOKS` in `SPA/application/sync/merge-row-hooks.ts`: one `{ key, merge(a, b) → row, clock? }` per table. It holds a single `exportLedger` entry today: `mergeExportLedgerRows`, whose clock is the later of `updatedAt` and `exportedAt`.
- `importTables(tables, { liveMerge })` takes an injected `LiveRowMerge` (`SPA/ports/snapshot-port.ts`), built by `createLiveRowMerge(tombstones)` in `import-snapshot.ts`. Every hooked table is merged against its live rows inside the import's `rw` transaction.
- The hook contract requires `merge` to be **symmetric**. `mergeGarminLedgerRows` therefore breaks an `updatedAt` tie the way `mergeExportLedgerRows` does (clock, then `id`, then serialisation), so `merge(a, b)` equals `merge(b, a)`.
- #1265's rule that a committed row beats a `"pending"` one is applied first, before MUST-D.
- **T4 replaces** the `exportLedger` entry's `merge` with a Garmin-aware one: Garmin rows go through `mergeGarminLedgerRows`, every other destination keeps `mergeExportLedgerRows`. It does not add a second entry.
- There is no normalizer slot. T4 adds one optional `normalize(row)` to `RowMergeHook`, applied to every row of the table before keying, in both the snapshot merge and the live merge. It is the only infrastructure T4 adds, and it is what "the per-table normalizer for `exportLedger`" below means.

**`normalizeGarminLedgerRow`**

- It is shape-based and idempotent.
- It derives `library` once, from `^[1-9]\d*$`.
- It Zod-parses the row and drops any invalid parts.
- A queue entry with no `state` (legacy) becomes `held`, and the id of a `scheduled` placement or `previous` becomes `keep` unless the queue already gives it a state (a stateless entry for that id is replaced: the old skip rule treated it as a merge artefact).
- It runs in two places: the Dexie v36 upgrade, and inside `SnapshotPort.importTables` as the per-table normalizer for `exportLedger`, whatever the manifest version.

**The id-state lattice** (review round 2). The removal queue is a grow-only map from schedule id to a state on

```
held  <  keep  <  retire  <  gone
```

- `held`: an id nobody has verified (legacy data). Never the merged `Placed`, never drained.
- `keep`: verified live and current: written by a commit (a 2xx `schedule` with an id) or by a `calendar-find` adoption.
- `retire`: verified superseded after having been `keep`. The only drainable state.
- `gone`: a tombstone: drained with 204 or a verified 404, dismissed, or verified absent by `calendar-find`. Never drained, never `Placed`.

Garmin schedule ids are unique and never reused, so one monotone state per id is sound. Every writer only raises a state, and the merge joins by `max`; nothing is ever removed, so no re-merge can resurrect an id (the H2 livelock) and a drained id keeps its taint (the H1 gap). Every drainable state ranks above `keep`, so joining a verified-live `keep` with a stale copy never makes it drainable, and joining a drain decision with a stale `keep` never un-drains it. `held` ranks below `keep` so that a verification by any device wins over the unverified legacy mark.

**Transitions** (every one only raises the state; absent counts as below `held`):

| Event                               | Writes                                                                                                                                                                        |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Normalization (v36, import)         | legacy stateless entry → `held`; the id of a `scheduled` placement or `previous` → `keep` when absent/stateless; an `unconfirmed` or `attempting` with no `supersedes` → `[]` |
| Commit (§3.3 step 7)                | new id → `keep`; superseded `scheduled` `previous` → `retire` (one write)                                                                                                     |
| Merge, two different free `Placed`s | winner → `keep`; `scheduled` loser → `retire`                                                                                                                                 |
| Merge, every `Placed` tainted       | nothing (no state is below `held`)                                                                                                                                            |
| T5, exactly one match               | adopted id → `keep`; a `scheduled` `previous` → `retire`; `held` ids the read sees stay `held`; unseen → `gone`                                                               |
| T5, several matches / none / failed | nothing                                                                                                                                                                       |
| Drain: 204, or 404 verified absent  | `retire` → `gone`                                                                                                                                                             |
| Dismiss ("I removed it")            | `abandoned` entry → `gone` (never a `held` one)                                                                                                                               |
| Merge join                          | per id: `max(state)`, `max(attempts)`, OR of `abandoned`                                                                                                                      |

**`mergeGarminLedgerRows(a, b)` (MUST-D)**

1. The merged queue is the join of both queues (table above), emitted in ascending id order.
2. A `Placed` is **tainted** when it may not be live:
   - a `scheduled` whose id's merged state is not `keep` (`held`, `retire` or `gone`); an absent id is not tainted;
   - an `unconfirmed` (no id) when an entry with its `workoutId` and `date` has a merged state other than `keep`: it may be that entry, and `gone` counts too, else a drained entry would lose its taint once drained, exactly H1. A `keep` match is a live known id, so it does not taint. **Exception:** an entry listed in the placement's `supersedes` that is `retire` or `gone` does not taint — see "Causal context for `unconfirmed`" below. A listed `held` entry still taints.

   The candidates are the untainted `Placed`s.

3. Pick the merged `Placed`:
   - Two `unconfirmed` for the same workout and date are one placement whose `supersedes` is the sorted **union** of both; it is tested for taint as one (before choosing).
   - The same entry on both sides (same id, or same workout and date when one side is `unconfirmed`) → keep the side that knows its schedule id, else the newer.
   - Two different candidates → the newer row's by the hook's total order wins; a `scheduled` loser is written `retire` (an `unconfirmed` loser has no id and is dropped: a duplicate at worst, never a gap).
   - One candidate → it wins.
   - The merged `Placed`'s id is written `keep` (a no-op for a well-formed row).
   - No candidate, no in-flight state (rule 4), but a `Placed` exists → `{kind:"uncertain", workoutId, date}` with no `previous`; no state changes.

   **The `uncertain` target rule.** `workoutId` and `date` come from the maximum `held` entry — latest `date`, then larger `workoutId`, then larger `workoutScheduleId`. With no `held` entry the same maximum is taken over **all** entries. Either way it is a function of the merged queue alone, which every re-merge reproduces, so the rule is absorbing. Rejected: "the newest row holding a `Placed`" — the re-merge sees a snapshot that holds the `uncertain`, not a `Placed`, and picks differently.

4. If no `Placed` is a candidate, keep an `attempting` or `uncertain` of either row, preferring `posted:true`, before synthesizing the `uncertain` of rule 3: the re-merge with a snapshot that holds that in-flight state must reproduce it (absorption). An `attempting` never beats a `Placed`; dropping an `attempting{posted:true}` is the documented residual (an untracked duplicate, never a gap).
5. `library` and `forceRepush` come only from the newer row (S2).
6. `updatedAt` is the later of the two by the ledger clock's own parse (unparsable = 0), ties broken by the larger string, so equal instants spelled differently still merge symmetrically.

**Why no release on merge** (round 2, H1). Round 1 cleared `held` when a free `Placed` won. "Free" only meant "in no queue", and a drained id left the queue, so a stale device's `Placed` S100, already drained elsewhere, won and released S1 and S2 for draining: a gap. With tombstones S100 is `gone` in the cloud and stays tainted, and `held` leaves only through a calendar-verified T5 resolution.

**Causal context for `unconfirmed`** (round 3, L). Tainting by (workoutId, date) alone taints a device's own fresh placement: place S1 on D1, move to S2 on D2, drain S1 (`gone`), then an id-less push back to D1 gives `{unconfirmed D1, queue [S1 D1 gone, S2 D2 retire]}`, and `merge(x, x)` is `uncertain` — idempotence broken on a reachable row, and if `calendar-find` never returns an id it stays `uncertain` forever. So an `unconfirmed` records `supersedes`, every id its row knew when the attempt was **claimed**, before the POST, and a listed `retire` / `gone` entry does not taint it.

- **Why the claim, not the commit.** A sync can land between the POST and the commit. Device B's T5 can adopt the freshly minted entry m as `keep` and sync; a commit-time list would then include m. When B later moves (m → `retire`), A's `unconfirmed` is untainted, newer, and wins, so B's new entry R retires too, and draining m and R empties the calendar. A list read at the claim cannot contain m, which did not exist yet.

- **Why a listed id is never the placement's own entry.** Ids are unique and minted by the POST; the list was taken before the POST that created the entry, so the entry's id cannot be on it. A listed id is another entry, already superseded or dead, and its state says nothing about this one. An unlisted non-`keep` entry at the same workout and date still taints: that is the concurrent case (another device adopted and later retired the very entry this row pushed without learning its id).
- **Only a committed POST lists ids.** An adoption ("It's in Garmin", or an A3-false `calendar-find` adoption) may be adopting a known entry, so it records `supersedes: []`; a legacy `unconfirmed` normalizes to `[]`. Both are the conservative round-2 rule.
- **Why the union on merge is safe.** Two `unconfirmed` rows for the same workout and date stand for one or more entries, each listed by nobody who created it. Take the latest-created of those entries: every list was taken before its creator's POST, so no list — and therefore not the union — contains it. If the union placement is untainted, that entry is `keep` or absent, so no device drains it and the merged `Placed` stands for a live entry. The union only grows, so a re-merge reproduces it (absorbing), and a row whose list is a subset is tainted whenever the union is (monotone).

**Absent id = free** (P3b). A stale device C, newer by clock skew, holds `Placed S100` (`keep`) and meets a live S5 whose row never saw S100. Both are candidates; C's row is newer, so S100 wins and S5 retires. If S100 is live, it remains. If S100 is dead, some device deleted it, and a device deletes only a `retire` id, written in the same write as the `keep` of the replacement it committed; once that replacement's row syncs, S100 is `gone` there, so S100 is tainted and the replacement wins.

That argument alone does **not** close the gap under clock skew: the replacement can change hands without its history. Counterexample (found by the placement-world simulator, C's clock a day ahead): C places S102 on D0 and syncs; C moves to S103 on D1, deleting S102, and does not sync. B, holding a leftover `attempting{posted:true}` for D1, reads D1, adopts S103 as its own POST (an id it does not know), moves to S104 and drains S103. B never saw S102 `gone`; the cloud's `Placed S102` looks a day newer, so it wins the merge and S104 retires. Without a check, B's drain deletes S104 and the calendar is empty. **Verify before delete** (§3.5) closes it: B's drain reads D0 first, finds S102 absent, writes S102 `gone` and the row `uncertain`, and sends nothing. S104 stays live. In general, a drain deletes only behind a `Placed` it has just seen on Garmin, so every delete leaves a live entry, whatever the merge chose. Skew can still cost a duplicate (residual L1), never a gap.

**Legacy entries → `held`** (fail-safe). A stateless entry cannot be proven superseded by a verified live entry, so it is never drained until `calendar-find` verifies it; the cost is a duplicate until T5. Mapping them to `retire` instead would drain an id whose superseder may be dead (the round-2 `normal < keep` repro: an old device drains S1 while another device's newer, verified S1 wins the merge). In production no row carries a `removalQueue` yet — T4 is the first writer — so both choices are equivalent there; `held` is the default for anything unproven.

**Adoption is gap-free.** T5 adopts only an id `calendar-find` just saw live, and the only id it retires is the `uncertain`'s own `scheduled` `previous`, superseded by the adopted id in the same write (the commit rule). `held` ids it sees stay `held`: never drained, never `Placed`. Another device can outrank the adoption only with a newer verified `keep` (then that one wins the merge and the adopted id is retired behind a live entry) or by a drain of a `retire` id, which the adoption never wrote for the adopted id.

**Crossed retire is unreachable** (assumption and argument). A crossed pair — one row with S1 `retire` / S2 `keep` and another with S2 `retire` / S1 `keep` — would let both devices drain, a gap. It cannot arise under these assumptions:

- Ids are unique and never reused.
- `retire` is only ever written together with the `keep` of its superseder, in one write (commit, merge loser, T5).
- A commit retires only in favour of an id it just created, so no earlier decision can have seen that id.
- Every sync is an atomic read–merge–write of the single cloud row: the cloud row only grows, so the first merge that sees a pair decides it and every later merge inherits the `retire`.
- T5 retires only the `uncertain`'s `previous`, together with the `keep` of the id it just adopted. It never retires a `held` id: `held` ids are legacy, unverified, and another device may still hold one as a verified `keep` (the implementation's exhaustive check found exactly that crossed pair when T5 retired seen `held` ids). A seen `held` id therefore stays a duplicate on the calendar until the athlete removes it — legacy data only, none in production.

Known residuals, both breaking the atomic-sync assumption: the Drive adapter checks `headRevisionId` and then PATCHes (`drive-rest.ts:66`), a check-then-write, not an atomic `If-Match`, so two syncs inside that window lose one update; and `syncWithCloud` imports its merge into the device before a push that may be rejected (`sync-with-cloud.ts:34-38`), so the device acts on a merge the cloud never received. One ordinary rejected push suffices for a crossed pair through that second window — for example, on legacy `held` data, `B:sync A:sync C:t5 C:sync-rejected` lets C's drain empty the calendar. Importing only after an accepted push is therefore the part of the follow-up that matters; `If-Match` closes the first window. This change touches neither.

**Dismiss covers abandoned entries only.** "I removed it" is offered for an `abandoned` entry and writes `gone`; a `held` entry is never dismissable from the app and leaves only through a calendar-verified T5 resolution. A `held` id may be another device's verified `Placed`: dismissing it would let the athlete's removal cross with that device's supersession and empty the calendar (the exhaustive check found 30 such paths in the legacy scenario). `held` exists only in legacy-shaped data, which production does not have, so the rule costs nothing real and removes a gap class the ledger would otherwise cause itself. A hand deletion in Garmin stays the athlete's own act.

**Invariant:** no id whose state is not `keep` ever becomes the merged `Placed`, and only `retire` ids are ever sent to `unschedule`.

**Laws** (property-tested). Symmetric, idempotent on well-formed rows (normalized, and whose own `Placed` is not tainted by its own queue), absorbing (`merge(x, merge(x, y)) = merge(x, y)` and `merge(merge(x, y), y) = merge(x, y)`). The pool is the set of rows produced by scripted, consistent histories — three devices, one offline for several steps, concurrent pushes of the same record, a drain while another device is stale, and T5 resolutions with one match, several matches and a failed read — with every order of sync, push and drain steps enumerated up to a bounded depth. The laws, idempotence included, are checked with no well-formedness filter — every row the explored histories produce is well-formed; that is a checked fact of the model, not a claim about every row the pipeline could write — over every pair of rows that co-exist in one reachable world (the devices' rows and the cloud row at the same step); rows from unrelated histories can hold contradictory verified states for one id and are not a meaningful input. Pairwise supersession cannot be associative, so the histories are also checked for **safety** after every step (a drain never leaves a record with a live entry without one, and no device drains its own `Placed`) and for **convergence** once all devices sync.

**Resolving `uncertain` (T5).** The next push of the record resolves it with `calendar-find` for the workout, over the dates of the `uncertain` and of its `held` entries:

- A **match** is an entry at the `uncertain`'s date whose id is not `retire` or `gone`; the entries seen at the `held` dates decide only which `held` ids are seen.
- Exactly one match → adopt it as the `Placed`, `keep`; a `scheduled` `previous` of the `uncertain` → `retire`. `held` ids the read sees stay `held` (see the crossed-retire argument); `held` ids it does not see → `gone`.
- Several matches → `duplicate-left`; no state changes.
- No match, or the read fails → the normal `uncertain` path (the athlete decides); no state changes.

**Review-3 D repro**

- Device A has `Placed S2` (S2 `keep`, S1 `retire`). Device B has `Placed S1` (S1 `keep`) and is newer.
- The merge gives `Placed S2` with S1 `retire` (S1 is tainted).
- The drain deletes S1, leaving one entry, at D2.

### 3.10 `recordExport` caller audit

| Caller                               | Effect                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `executeWorkoutPush` → Garmin        | The feature.                                                                                                                                                                                                                                                                                                                                                 |
| `executeWorkoutPush` → TrainingPeaks | Only the reorder, plus `buildCommitPatch` with no `library`. Rows are identical apart from `updatedAt`.                                                                                                                                                                                                                                                      |
| Tanita `:81`                         | The reorder: harmless, since the caller already treats `lost-race` as not posted (a reorder test pins this). Stale-pending recovery also applies: a Tanita row left `pending` for more than `PENDING_TTL_MS` with an equal hash is now re-uploaded instead of skipped forever — a possible duplicate measurement on Garmin, the duplicate-over-gap residual. |

### 3.11 Follow the coach

**Baseline**

- All three builders set `coachDate = activity.date`.
- `applyCoachDateMoves` runs in `persistSyncedWeek`, after `upsertMany`.
- The baseline is `workout.coachDate ?? preUpsertRow?.date`. If neither exists, set `coachDate = fetched.date` and stop.

**Decision table**

| Situation                                                  | Action                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| fetched date equals the baseline                           | Set `coachDate` if it is missing; keep `date`.         |
| The coach moved it; `date` equals the baseline             | Move `date` to the fetched date; `coachMoves++`.       |
| The coach moved it; `date` already equals the fetched date | Set `coachDate` only; no notice.                       |
| Both moved it, to different days                           | The coach wins: move `date`; `overriddenLocalMoves++`. |

**Writes**

- Each write re-reads the record and bumps `updatedAt`.
- It leaves `modifiedAt` and `state` untouched.
- `SyncWeekResult` gains the two counters, shown with static en/es copy.

## Bridge contract details settled in T2

These refine §3.4 and §3.6 where the plan met the real code.

- **The failure code travels in `error`.** The vendored envelope
  (`bridge-envelope.js`, `createEnvelope`) forwards only `error`, `status`,
  `retryable`, `needsReauth` and `resetSeconds`; it has no `code` field, and
  this change makes no bridge-core change. So `deadline-before-send` is the
  literal `error` string, with `retryable: true` and no `status`. An abort
  after the write was sent answers `error: "deadline-exceeded"`, also with no
  `status`, which the SPA classifies as ambiguous.
- **"Sent" means sent without a definitive refusal.** A write that came back
  `401` was refused before Garmin processed it, so a hung re-mint that runs
  into `D` afterwards still answers `deadline-before-send`. Any other write
  that left the service worker makes a later abort ambiguous.
- **The token lifecycle is untimed; only the wait is bounded.** The deadline
  signal rides on the call's own request attempts. Refresh, mint and 401
  re-mint run on the plain `fetch`, and `raceAbort(() => …, signal)` bounds
  only this caller's wait. A calendar action that starts a mint therefore
  leaves it running for anyone who joined it, exactly as a joined mint is left
  running for its starter. `raceAbort` takes a thunk and checks
  `signal.aborted` first, so an already-expired deadline starts nothing. An
  abort during the refresh exchange is rethrown rather than treated as a dead
  OAuth1 token.
- **Any abort before the send is `deadline-before-send`**, whatever its
  reason, and a disallowed path throws a `retryable: false` refusal, never an
  error with no status that the SPA would read as ambiguous.
- **`D_START` gates every write attempt**, including the retry after a 401 and
  the `unschedule` DELETE. For a DELETE the cut-off changes nothing about
  correctness (any failure is `attempts++`), and one rule is simpler to test
  than two.
- **The deadline is an `AbortController` fired by `setTimeout(D_MS)`**, not
  `AbortSignal.timeout`. The behaviour is the same; the timer is the one fake
  timers control, and it is cleared when the action settles. Its abort reason
  is a `DOMException` named `AbortError`. The cut-off is measured with
  `performance.now()`, which a wall-clock change cannot move.
- **`schedule` returns `{ workoutScheduleId }` only**, as a digit string or
  `null`. Garmin's response also carries the whole workout; the bridge drops
  it (the SPA already has it) and converts the number to the string form the
  branded SPA ids use. `null` means Garmin answered 2xx without a usable id,
  which the SPA stores as `unconfirmed`.
- **`unschedule` returns `null`** on any 2xx (Garmin answers 204). A 404, a
  500 or any other failure is thrown with its `status` intact.
- **`features` is a ping field, not a manifest field.** `BRIDGE_MANIFEST` and
  `bridge-identity.js` are held in lockstep by the parity guard, and
  `capabilities` is a closed enum in the SPA's `bridgeManifestSchema`. The
  calendar flags are a separate list the SPA reads from the ping data;
  `capabilities` and `bridge-identity.js` do not change.

## Pipeline details settled in T5

These fill gaps the plan left open, each by the rule "never a gap, worst case
a duplicate". None changes an invariant of §3.3–§3.9.

- **An unresolved attempt stays `attempting{posted: true}`.** When the
  resolve of §3.4 ends without an adoption (no `calendar-find-v1`, a failed
  read, an A3-false count of 0), the result is `uncertain` but the row keeps
  `attempting{posted: true, at}`: that is the exact state (a POST may exist,
  sent at `at`), the merge already ranks it with `uncertain` (§3.9 rule 4),
  and "Send anyway" needs `at` for its gate. The next push resolves it again
  before any POST. An `uncertain` placement in a row comes only from the
  merge (rule 3) or legacy data; it holds no POST of this device, so "Send
  anyway" on it claims a fresh attempt at once (a duplicate at worst).
- **No answer before the gate.** An `attempting{posted: true}` shown as
  `uncertain` carries `sendAfter = at + POST_GATE_MS`. Before it, the editor
  disables both actions and says it is still checking; "It's in Garmin"
  refuses with `failed{settling, retryAfter}` and writes nothing, even when
  called directly, since the POST may still land.
- **One POST per run.** A run sends `schedule` at most once. The gate's
  re-POST (§3.4) happens only on a leftover `attempting{posted: true}` whose
  absence read started after `at + POST_GATE_MS`; an ambiguous answer in the
  same run is never followed by a second POST.
- **A leftover attempt for another date** (the workout moved while an attempt
  was pending) is resolved first; a resolution that lands a `Placed` is then
  claimed again for the desired date in the same run, a move. A leftover
  proven absent after the gate is restored to its `previous` under the
  attempt guard, and the claim runs again: the gate's re-POST is the run's
  own claim of the desired workout and date, with a fresh `supersedes`,
  never a re-send of the leftover's workout id or date.
- **The library guard is the way out of a legacy `unconfirmed` library.** A
  row whose `library` is not `confirmed` (legacy `unconfirmed`, whose equal
  hash Phase 1 would skip forever) returns
  `failed{library-id-unknown, retryable: true}` with 0 calendar calls and
  sets `forceRepush` in the same guarded write, so the next push re-creates
  the library workout through the ledger's `updated` path (1 library push, a
  library duplicate at worst).
- **A rolled-back claim restores the pre-claim row verbatim.** `mutateByKey`'s
  `fn` may return `restoreLedgerRow(row)` instead of a row. The repository
  then stores that row as it is, `updatedAt` included (no stamp; a row
  deep-equal to the current one is still a no-op). The pipeline returns it
  only when the current row is byte-identical to the last row this run wrote
  and that row differs from the pre-claim row only in `placement` and
  `updatedAt`, so the rollback of a definite failure is invisible to the
  merge order; otherwise (another writer touched the row, before or after
  this run's writes) it restores `previous` with a normal, stamped write. The restore of a leftover proven absent is always
  a normal, stamped write. The port gains no method.
- **The pending window.** Phase 1's `pending` row lives only across the
  library POST, whose SPA timeout (15 s) is far below `PENDING_TTL_MS`
  (5 min); placement starts after the library commit, so no wait of Phase 2
  (the lock, `SETTLE_MS`, the gate) ever holds a `pending` row.
- **The `reason` enum**, closed: `busy`, `settling`, `record-deleted`,
  `guard-failed` (the row changed after a failed or ambiguous POST),
  `library-missing`, `library-id-unknown`, `schedule-endpoint`,
  `deadline-before-send`, and three §3.3 left unnamed: `schedule-rejected`
  (Garmin 400, 403 or 409, or a bridge refusal with `retryable: false`),
  `needs-reauth` (a `needsReauth` answer) and `library-push-failed` (Phase 1
  failed), plus `no-export-route` (Phase 1 found no active route) and
  `placement-interrupted` (an exception after Phase 1 succeeded — a Dexie
  error in the claim, commit or drain, or a thrown port: the workout is in
  the library, the date may not be placed, and a re-send finishes it). The
  `library-only` reasons are `insecure-context` (`!isSecureContext`),
  `unsupported-browser` (a secure page without Web Locks) and
  `bridge-outdated`.
- **`duplicate-left`** is returned when the run ends with a `retire` entry
  still in the queue (a failed or abandoned delete), when a resolve adopted
  the lowest of several candidates, or when a move superseded an
  `unconfirmed` `Placed` (its entry has no id to delete). The result names
  the dates of the entries left behind.
- **Drain order.** The drain sends each non-abandoned `retire` entry once per
  run, in ascending id order, and stops at the first answer that needs
  re-authentication. An abandoned entry is never sent again: it is re-checked
  by `calendar-find` and written `gone` only when an A3 read of its date
  lacks its id.
- **The T5 read** calls `calendar-find` once per distinct (workout, month)
  among the `uncertain` and its `held` entries; any failed read fails the
  whole resolution (no state change). An entry with no id counts as a match
  but proves nothing: a single id-less match is adopted as `unconfirmed`
  with `supersedes: []` under the "It's in Garmin" guard, and no `held` id
  is written `gone` from a read that lacks ids.
- **Record-deleted warning.** `failed{record-deleted}` carries the attempted
  date when the POST succeeded or was ambiguous, so the UI can say an entry
  may remain in Garmin on that date.
- **How the SPA knows A3.** A read of 0 entries cannot show whether Garmin
  exposes schedule ids, so A3 is not inferred from a count. It is a
  constant of the pipeline, `SCHEDULE_IDS_IN_FIND`, true per the T0b
  capture, and any single read that returns an entry with no id is taken as
  A3 false for that read. The absence rules (the gate, the 404 check, the
  abandoned re-check, T5's `gone`) apply only when both hold; otherwise the
  count rules of §3.4 apply. A wrong `true` can at worst re-POST after the
  gate (a duplicate); it can never delete an entry the read did not see
  without an id.
