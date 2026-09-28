## ADDED Requirements

### Requirement: Calendar placement after the library push

Every Garmin push entry point SHALL call `pushWorkoutToGarminCalendar(deps, record)`, which runs the existing governed library push (Phase 1) and then places the workout on its date in the Garmin calendar (Phase 2).

Phase 2 SHALL diff the desired placement (library workout id, workout date) against the persisted one and, when they differ: persist `attempting{posted, at, previous}`; mark it `posted` and call `schedule`; commit the returned `workoutScheduleId`; and only then queue and `unschedule` the superseded entry. A superseded entry SHALL be deleted only after its replacement has committed (create first, delete after), so a failure leaves a duplicate and never a gap. The pipeline SHALL NOT delete any Garmin library workout.

A pre-flight SHALL run before any call. Without `navigator.locks` (a non-secure context) the push SHALL run Phase 1 exactly as today, skip placement, and return `library-only` (not a failure). Without the `calendar-write-v1` feature it SHALL return `failed:bridge-outdated` with 0 library pushes.

The result SHALL be a `PlacementResult`: `scheduled | moved | unchanged | duplicate-left | uncertain | library-only | failed{reason, retryable, retryAfter?}`.

#### Scenario: A date-only move places first and removes after

- **GIVEN** a workout already placed on D1 whose content is unchanged
- **WHEN** its date becomes D2 and the athlete pushes
- **THEN** the pipeline SHALL make 0 library pushes and 1 `schedule` call, persist the new placement and queue the old id before calling `unschedule`, and return `moved` with 1 entry at D2

#### Scenario: An unchanged re-push makes no calls

- **GIVEN** a workout placed on its current date with unchanged content
- **WHEN** the athlete pushes again
- **THEN** the pipeline SHALL make 0 calls of any kind, leave the ledger row's `updatedAt` unchanged, and return `unchanged`

#### Scenario: A failed delete leaves a reported duplicate

- **WHEN** the `unschedule` of a superseded entry fails with 500, 403 or a timeout
- **THEN** both entries SHALL remain, the old id SHALL stay queued with `attempts: 1`, and the result SHALL be `duplicate-left` with the UI naming the old date

#### Scenario: No Web Locks keeps today's library push

- **GIVEN** `navigator.locks` is unavailable
- **WHEN** the athlete pushes
- **THEN** the pipeline SHALL make 1 library push and 0 calendar calls and return `library-only`

### Requirement: One Web Lock per record serializes placement across tabs

The pipeline SHALL run Phase 1 and Phase 2 inside `navigator.locks.request("garmin-place:" + kaiordRecordId, { ifAvailable: true }, run)`. A second push of the same record in the same tab SHALL join the running promise. When the lock is held elsewhere (`null`), the result SHALL be `failed:busy` (retryable) with 0 calls, including 0 library pushes. The lock SHALL be released when `run` settles, on success, failure or throw.

Inside the lock, every ledger write SHALL be its own read-write transaction that re-reads the row by its natural key and applies the write guard of `design.md` §3.3: while `attempting`, the row still holds the expected `at`; after the commit, the row still holds this run's `Placed`. A guard failure before the POST SHALL return `failed:busy` with no POST. A workout deleted mid-run SHALL return `failed{reason: "record-deleted", retryable: false}`, SHALL NOT recreate the row and SHALL issue no DELETE.

#### Scenario: A second tab is refused without calls

- **GIVEN** one tab holds the lock for a record
- **WHEN** a second tab pushes the same record
- **THEN** it SHALL return `failed:busy` with 0 calls

### Requirement: Ambiguous calendar writes are resolved by reading Garmin

The SPA SHALL classify every `schedule` outcome. Definite failures: a validation or guard refusal; Garmin 400, 403, 404 or 409; a 401 with `needsReauth`; `deadline-before-send`. Ambiguous: `delivered: false`, the SPA timeout, `context invalidated`, any answer with no status (including `deadline-exceeded`), and 500, 502, 503 or 504. OK: any 2xx.

The SPA timeout for `schedule`, `unschedule` and `calendar-find` SHALL be `SPA_ACTION_TIMEOUT_MS` = 35 s, longer than the bridge deadline `D` (30 s); the 15 s timeout of other actions is unchanged.

An ambiguous outcome SHALL keep `attempting{posted: true}` and SHALL be resolved with `calendar-find`, matching on the attempted date and excluding every id the ledger already knows. A re-POST SHALL require an absence read that started no earlier than `at + POST_GATE_MS` (43 s); before that the result SHALL be `failed{reason: "settling", retryAfter}` with no POST. When Garmin exposes no schedule id (A3 false), a count of 0 SHALL never be taken as absence: the result SHALL be `uncertain`. Without `calendar-find-v1`, or when the read fails, the result SHALL be `uncertain`, and the athlete decides: "It's in Garmin" stores the placement as `unconfirmed`, "Send anyway" posts only after the gate.

A `schedule` 404 for a library id from an earlier push SHALL set `forceRepush` and `library: missing`, restore `previous`, and return `failed:library-missing`, so the next push re-creates the library workout through the ledger's `updated` path; a 404 for an id minted in the same run SHALL return `failed:schedule-endpoint`.

#### Scenario: An ambiguous POST adopts the unknown entry

- **GIVEN** a `schedule` that timed out
- **WHEN** `calendar-find` returns the new entry together with `previous` and the queued ids
- **THEN** the pipeline SHALL adopt only the unknown entry at the attempted date, with 1 `schedule` call in total

#### Scenario: Absence inside the gate does not re-POST

- **WHEN** the read finds no unknown entry before `at + POST_GATE_MS`
- **THEN** the result SHALL be `failed{settling}` with `retryAfter = at + POST_GATE_MS` and no second `schedule` call

### Requirement: Removal queue for superseded calendar entries

Superseded schedule ids SHALL be kept in the ledger row's `removalQueue` and drained after every commit. `unschedule` outcomes: 204 dequeues; 401 keeps the entry without counting the attempt; 404 dequeues only when a `calendar-find` shows the id absent (otherwise `attempts++`); anything else, ambiguous included, is `attempts++`. After 3 attempts an entry SHALL be `abandoned`, re-checked on each push of its record, and dismissible by the athlete ("I removed it") with 0 calls. An id equal to the current `Placed` or to `attempting.previous` SHALL never be sent to `unschedule` and SHALL be dropped from the queue.

#### Scenario: The current placement is never deleted

- **GIVEN** a queue that, after a merge, contains the id of the current `Placed`
- **WHEN** the queue is drained
- **THEN** that id SHALL be dropped without an `unschedule` call

### Requirement: Push result and capability detection

`DetectionResult` and `GarminBridgeState` SHALL carry the bridge's `features`, parsed from the ping data and defaulting to `[]` when absent. `push()` SHALL return a `PlacementResult`; `onSent` SHALL fire if and only if the library push is confirmed; EditorPage SHALL persist the confirmed library `workoutId` as the push id, never a synthetic one. Placement analytics SHALL carry only enum values and counts: `garmin-calendar-placement{result, reason?, durationMs, abandonedCount}` with a closed `reason` enum, and no ids, dates or names.

#### Scenario: An older bridge is detected

- **GIVEN** a ping response with no `features`
- **WHEN** the athlete pushes
- **THEN** detection SHALL record `features: []` and the push SHALL return `failed:bridge-outdated` with 0 library pushes
