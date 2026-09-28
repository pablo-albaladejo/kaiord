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
  so both match `^\d+$`.
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

The calendar **read** (`calendar-find`, task group 4) rests on assumptions that
were only observed in the web app, never verified against the API the bridge
calls. They are **unverified** until T0b records the evidence here; nothing in
task group 4 starts before that.

| #   | Assumption                                                                           | If false                                                                                   |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| A1  | Items from `GET /calendar-service/year/{Y}/month/{M}` carry the library `workoutId`. | Drop `calendar-find`. Resolution falls back to a human; a DELETE 404 becomes inconclusive. |
| A2  | Items carry a `YYYY-MM-DD` date.                                                     | Map the field that T0b records.                                                            |
| A3  | Some item field equals the `workoutScheduleId`.                                      | Use the conservative count rules in §3.4: a count of 0 ⇒ `uncertain`.                      |
| A4  | The month parameter is 0-based.                                                      | Flip the constant (unit-tested).                                                           |
| A5  | A write is visible to a read within `SETTLE_MS`.                                     | Raise `SETTLE_MS`; the gate still holds.                                                   |
| A6  | Train2Go keeps the `sourceId` when a coach moves a session.                          | The move arrives as delete + create; document it as a limitation.                          |
| A7  | A DELETE on an already-deleted entry returns 404.                                    | The read disambiguates.                                                                    |

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

**Bulk "Send week"** runs the same pipeline over the visible week. "Retry failed" re-runs only the retryable failures.

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
- The ledger gains `library`, `placement`, `removalQueue` and `forceRepush`, plus a shape normalizer and a merge hook.
- Placement requires Web Locks, which exist only in secure contexts. Without them the push is library-only (today's behaviour).

### Follow-ups

- a liveness GET
- unscheduling when a workout is deleted in Kaiord
- following the coach for session-matched workouts
- matching a coach's delete + recreate
- cleaning up superseded library workouts
- library duplicates from cross-device `[U]` pushes

## Design (normative)

### 3.1 Ledger model

Location: `SPA/types/export-ledger.ts`. Applies to Garmin rows; every field is optional.

```ts
type GarminWorkoutId  = string & { readonly __b: "GarminWorkoutId" };   // ^\d+$ via parseGarminWorkoutId
type GarminScheduleId = string & { readonly __b: "GarminScheduleId" };  // ^\d+$ via parseGarminScheduleId
library?: { kind: "confirmed"; workoutId } | { kind: "unconfirmed" } | { kind: "missing"; workoutId }
forceRepush?: true
placement?: Placed
  | { kind: "attempting"; workoutId; date; at: string; posted: boolean; previous?: Placed }
  | { kind: "uncertain";  workoutId; date; previous?: Placed }
type Placed = { kind: "scheduled"; workoutScheduleId: GarminScheduleId; workoutId; date }
            | { kind: "unconfirmed"; workoutId; date }
removalQueue?: { workoutScheduleId: GarminScheduleId; workoutId; date; attempts: number; abandoned: boolean }[]
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

- No `navigator.locks` → **library-only**. Phase 1 runs exactly as it does today, placement is skipped, and the result is `library-only` (not `failed`). The UI names the reason: the calendar needs HTTPS or a supported browser. Web Locks exist only in secure contexts, so plain-HTTP LAN dev keeps today's library push.
- No `calendar-write-v1` capability → `failed:bridge-outdated`.

**1. Lock**

- A second caller in the same tab joins the running promise, via an in-tab `Map<kaiordRecordId, Promise>`.
- Otherwise, take `locks.request("garmin-place:"+id, {ifAvailable:true}, run)`.
  - A `null` lock → `failed:busy`, retryable.
  - Steps 2–8 run inside `run`. The lock is released when `run` settles.
- Chrome does not freeze a tab that holds a Web Lock, and a throttled tab keeps its lock.

**2. Phase 1.** `lost-race` → `failed:busy`.

**3. Library guard.** `library` is `unconfirmed` → `failed:library-id-unknown`.

**4. Claim** (`mutateByKey`). Branch on the current placement:

- A `Placed` equal to the desired placement → drain (§3.5) → `unchanged`.
- An `attempting{posted:false}`, no placement, or a different `Placed` → write `attempting{desired, at:now, posted:false, previous: current Placed}`. If the current state is already `attempting`, keep its `previous`.
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

- Write `scheduled`, or `unconfirmed` when Garmin returned no id.
- If `previous` was `scheduled`, add it to the removal queue.

**8. Drain** the removal queue (§3.5). Every queue write is guarded.

**Write guard (steps 5–8 and the resolve writes).** The lock excludes only other pipeline runs. It does not exclude the other ledger writers:

- the snapshot import;
- the workout-delete cascade (`dexie-export-ledger-cascade.ts:38-51`);
- the orphan sweep (`:54-71`);
- the repository (`dexie-export-ledger-repository.ts:30-45`);
- the v36 migration.

Therefore every write inside the lock is its own `rw` transaction that re-reads the row by natural key, then applies a guard:

- **While `attempting`**: the row exists and its placement is `attempting` with the expected `at`. At the step-5 guard, the expected `at` is the one written by the claim (step 4). At step 6, step 7 and the resolve writes, it is the `at` that step 5 rewrote.
- **After the commit** (step 8 and its queue writes): the row exists and its `Placed` still carries **our `workoutScheduleId`** (by id; for an `unconfirmed` commit, the same workoutId and date). The drain removes **only its own queue id** from the re-read row. It never writes the whole row, so concurrent queue additions survive.

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

**9. Result:** `scheduled | moved | unchanged | duplicate-left | uncertain | library-only | failed{reason, retryable, retryAfter?}`.

### 3.4 Deadline, classifier and resolve

**Service-worker deadline (MUST-A, S3, S4).** Each new action creates `signal = AbortSignal.timeout(D_MS)` at handler entry, with `D_MS = 30 s`.

- The action passes a `fetchImpl` that injects `signal` into every hop: the exchange, the mint hops, the 401 re-mint and both call attempts.
- It races `ensureToken`/`refreshToken`, including a joined `mintInFlight`, against `signal`.
- It refuses to start the POST once `entry + D_START_MS` (20 s) has passed. It then answers `{code:"deadline-before-send", retryable:true}`, which counts as a definite failure: nothing was sent.

Timeouts on the SPA side:

- `SPA_ACTION_TIMEOUT_MS` = `D_MS` + 5 s = 35 s. The generic 15 s timeout is unchanged for other actions.
- `POST_GATE_MS` = `D_MS` + `SETTLE_MS` + 10 s = 43 s.

**Classifier**

| Class             | Cases                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **definite-fail** | validation or guard reject; Garmin 400, 403, 404 or 409; 401 with `needsReauth`; `deadline-before-send`                           |
| **ambiguous**     | `delivered:false`; SPA timeout; `context invalidated`; no status, including a deadline abort after the send; 500, 502, 503 or 504 |
| **ok**            | 2xx                                                                                                                               |

**Resolve.** Runs on `attempting{workoutId, date, at, posted:true, previous}`.

**R1 — no find capability.** Without `calendar-find-v1`, the result is `uncertain`.

**R2 — find.** Call `calendar-find(workoutId, date)`. The `known` ids are `previous.workoutScheduleId` plus the ids in the removal queue.

- **When A3 is true**, candidates are the entries with `date === attempting.date` whose id is not in `known`.
  - One candidate → adopt it as `scheduled`.
  - More than one → adopt the lowest id and return `duplicate-left`.
  - None → go to the gate.
- **When A3 is false (MUST-C)**, let `n` be the number of entries at that date.
  - `n = 0` → `uncertain`. Never re-POST on a count.
  - `n ≥ 1`, and no queued entry has the same (workoutId, date) → adopt as `unconfirmed`. If `n > 1`, the result is `duplicate-left` with no id.
  - `n ≥ 1`, and a queued entry has the same (workoutId, date) → `uncertain`.

**Gate (A3 true only).**

- An absence read that _started_ at or after `at + POST_GATE_MS` → re-POST (steps 5–7).
- Otherwise → `failed{reason:"settling", retryable, retryAfter: at + POST_GATE_MS}`, with no POST.

**Read failure.** If the find read fails, the result is `uncertain`.

**Human actions on `uncertain`.**

- "It's in Garmin" → `unconfirmed`.
- "Send anyway" → POST, allowed only after `at + POST_GATE_MS`.

### 3.5 Removal queue

**Skip rule.** An entry whose id equals the current `Placed` or `attempting.previous` is never sent to `unschedule`. It is dropped from the queue as a merge artefact (MUST-D, defence in depth).

**`unschedule` outcomes**

| Outcome                            | Action                                                          |
| ---------------------------------- | --------------------------------------------------------------- |
| 204                                | dequeue                                                         |
| 401                                | keep; do not count the attempt                                  |
| 404, A3 true                       | dequeue if the id is absent from a find; otherwise `attempts++` |
| 404, A3 false                      | inconclusive: `attempts++`                                      |
| anything else, including ambiguous | `attempts++`                                                    |

**Abandoned entries**

- After 3 attempts, an entry becomes `abandoned`.
- An abandoned entry is re-checked with `calendar-find` on each push of its record. If A3 shows it absent, it is dequeued.
- The user can clear it with "I removed it" (dismiss).

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

**Pre-flight (once per run):** export route, Web Locks, `calendar-write-v1`.

**Statuses (7):** `scheduled`, `moved`, `unchanged`, `duplicate-left`, `uncertain`, `not-eligible`, `failed`. `library-only` cannot occur in bulk, because the bulk pre-flight requires Web Locks.

**"Retry failed"** re-runs only the retryable failures whose `retryAfter` has passed.

### 3.8 Entry points and UI

- All entry points call `pushWorkoutToGarminCalendar`.
- `push()` returns a `PlacementResult`.
- `onSent` fires iff the library push is confirmed.
- EditorPage persists the confirmed `workoutId` as the push id.
- The chat tool's result adds only an app-authored `calendar` enum.

**Analytics** (no ids, dates or names)

- `garmin-synced` counts as a success when the result is neither `failed` nor `uncertain`.
- `garmin-calendar-placement{result, reason?, durationMs, abandonedCount}`. `reason` is a closed enum: busy, settling, record-deleted, guard-failed, library-missing, library-id-unknown, schedule-endpoint, bridge-outdated, deadline-before-send, library-only.
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
- It derives `library` once, from `^\d+$`.
- It Zod-parses the row and drops any invalid parts.
- It runs in two places: the Dexie v36 upgrade, and inside `SnapshotPort.importTables` as the per-table normalizer for `exportLedger`, whatever the manifest version.

**`mergeGarminLedgerRows(a, b)` (MUST-D)**

1. Let `S` be the union of both queues' ids. The candidates are each row's `Placed` whose id is not in `S`. A `Placed` with kind `unconfirmed` has no id, so it is never in `S`.
2. Pick the merged `Placed`:
   - Two candidates with different ids → take the one from the row with the newer `updatedAt`, and queue the other.
   - One candidate → it wins.
   - No candidate (pathological) → keep the newer row's `Placed` and remove it from the queue. There is never a gap.
3. If neither row has a `Placed`, keep an `attempting` or `uncertain`, preferring `posted:true`.
   - An `attempting` never beats a `Placed`.
   - Dropping an `attempting{posted:true}` is the documented residual: a possibly untracked duplicate, never a gap.
4. The merged queue is the union by id, minus the merged `Placed` id and the merged `attempting.previous` id. It keeps `max(attempts)` and ORs `abandoned`.
5. `library` and `forceRepush` come only from the newer row (S2).
6. `updatedAt` is the max of the two.

**Review-3 D repro**

- Device A has `Placed S2` with queue `[S1]`. Device B has `Placed S1` and is newer.
- The merge gives `Placed S2` with queue `[S1]`.
- The drain deletes S1, leaving one entry, at D2.

### 3.10 `recordExport` caller audit

| Caller                               | Effect                                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `executeWorkoutPush` → Garmin        | The feature.                                                                                               |
| `executeWorkoutPush` → TrainingPeaks | Only the reorder, plus `buildCommitPatch` with no `library`. Rows are identical apart from `updatedAt`.    |
| Tanita `:81`                         | Only the reorder. Harmless: the caller already treats `lost-race` as not posted. A reorder test pins this. |

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
- **`D_START` gates every write attempt**, including the retry after a 401 and
  the `unschedule` DELETE. For a DELETE the cut-off changes nothing about
  correctness (any failure is `attempts++`), and one rule is simpler to test
  than two.
- **The deadline is an `AbortController` fired by `setTimeout(D_MS)`**, not
  `AbortSignal.timeout`. The behaviour is the same; the timer is the one fake
  timers control, and it is cleared when the action settles.
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
