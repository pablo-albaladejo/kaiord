## ADDED Requirements

### Requirement: Calendar placement after the library push

Every Garmin push entry point SHALL call `pushWorkoutToGarminCalendar(deps, record)`, which runs the existing governed library push (Phase 1) and then places the workout on its date in the Garmin calendar (Phase 2).

Phase 2 SHALL diff the desired placement (library workout id, workout date) against the persisted one and, when they differ: persist `attempting{posted, at, previous}`; mark it `posted` and call `schedule`; commit the returned `workoutScheduleId` as `keep` and the superseded id as `retire` in the same write; and only then `unschedule` the superseded entry. A superseded entry SHALL be deleted only after its replacement has committed (create first, delete after), so a failure leaves a duplicate and never a gap. The pipeline SHALL NOT delete any Garmin library workout.

A pre-flight SHALL run before any call. Without `navigator.locks` the push SHALL run Phase 1 exactly as today, skip placement, and return `library-only{reason:"insecure-context"}` when the page is not a secure context (`!isSecureContext`), or `library-only{reason:"unsupported-browser"}` in a secure context whose browser lacks Web Locks (an old Safari), with neutral copy that blames neither the page nor the athlete. Without the `calendar-write-v1` feature it SHALL do the same and return `library-only{reason:"bridge-outdated"}`. Neither is a failure: the UI SHALL show the workout as in the library with no date, in the warning tone and never the error tone, and for `bridge-outdated` SHALL offer one action that opens the extension's store page.

The result SHALL be a `PlacementResult`: `scheduled | moved | unchanged | duplicate-left | uncertain | library-only{reason} | failed{reason, retryable, retryAfter?}`, with `library-only` reasons `insecure-context | unsupported-browser | bridge-outdated`.

#### Scenario: A date-only move places first and removes after

- **GIVEN** a workout already placed on D1 whose content is unchanged
- **WHEN** its date becomes D2 and the athlete pushes
- **THEN** the pipeline SHALL make 0 library pushes and 1 `schedule` call, persist the new placement and write the old id `retire` before calling `unschedule`, and return `moved` with 1 entry at D2

#### Scenario: An unchanged re-push makes no calls

- **GIVEN** a workout placed on its current date with unchanged content
- **WHEN** the athlete pushes again
- **THEN** the pipeline SHALL make 0 calls of any kind, leave the ledger row's `updatedAt` unchanged, and return `unchanged`

#### Scenario: A failed delete leaves a reported duplicate

- **WHEN** the `unschedule` of a superseded entry fails with 500, 403 or a timeout
- **THEN** both entries SHALL remain, the old id SHALL stay `retire` with `attempts: 1`, and the result SHALL be `duplicate-left` with the UI naming the old date

#### Scenario: No Web Locks keeps today's library push

- **GIVEN** `navigator.locks` is unavailable
- **WHEN** the athlete pushes
- **THEN** the pipeline SHALL make 1 library push and 0 calendar calls and return `library-only{reason:"insecure-context"}` on a non-secure page, or `library-only{reason:"unsupported-browser"}` on a secure one

### Requirement: One Web Lock per record serializes placement across tabs

The pipeline SHALL run Phase 1 and Phase 2 inside `navigator.locks.request("garmin-place:" + kaiordRecordId, { ifAvailable: true }, run)`. A second push of the same record in the same tab SHALL join the running run: every joined caller SHALL receive the confirmed library id, `garmin-synced` SHALL be emitted once (by the owning run), and a joiner's date and "Send anyway" SHALL be dropped — a joiner that asked for another date SHALL get `failed:busy`, whose copy SHALL NOT claim another tab. When the lock is held elsewhere (`null`), the result SHALL be `failed:busy` (retryable) with 0 calls, including 0 library pushes. The lock SHALL be released when `run` settles, on success, failure or throw. An exception after Phase 1 succeeded (a ledger error in the claim, commit or drain, or a thrown port) SHALL return `failed{reason: "placement-interrupted", retryable: true}`, whose copy says the workout is in the library and a re-send places it — never the copy of a failed library push. The chat tool SHALL return that `reason` with `calendar: "failed"`, and any exception on its path SHALL become an app-authored error code, never the exception's text.

Inside the lock, every ledger write SHALL be its own read-write transaction that re-reads the row by its natural key and applies the write guard of `design.md` §3.3: while `attempting`, the row still holds the expected `at`; after the commit, the row still holds this run's `Placed`. A guard failure before the POST SHALL return `failed:busy` with no POST. A workout deleted mid-run SHALL return `failed{reason: "record-deleted", retryable: false}`, SHALL NOT recreate the row and SHALL issue no DELETE.

#### Scenario: A second tab is refused without calls

- **GIVEN** one tab holds the lock for a record
- **WHEN** a second tab pushes the same record
- **THEN** it SHALL return `failed:busy` with 0 calls

### Requirement: Ambiguous calendar writes are resolved by reading Garmin

The SPA SHALL classify every `schedule` outcome. Definite failures: Garmin 400, 403, 404 or 409; any answer with `needsReauth`, with or without a status; an answer with no status and `retryable === false` (a validation or guard refusal); `deadline-before-send`. Ambiguous: `delivered: false`, the SPA timeout, `context invalidated`, any other answer with no status (including `deadline-exceeded`), and 500, 502, 503 or 504. OK: any 2xx. These definite rows rely on the bridge contract: `needsReauth` is set only before a write was sent or after a 401 retry, and nothing that could have been sent carries `retryable: false`.

The SPA timeout for `schedule`, `unschedule` and `calendar-find` SHALL be `SPA_ACTION_TIMEOUT_MS` = 30 s, longer than the bridge deadline `D` (25 s) plus a margin; the 15 s timeout of other actions is unchanged.

An ambiguous outcome SHALL keep `attempting{posted: true}` and SHALL be resolved with `calendar-find`, matching on the attempted date and excluding every id the ledger already knows. A re-POST SHALL require an absence read that started no earlier than `at + POST_GATE_MS` (38 s: `D` + `SETTLE_MS` of 3 s + a 10 s margin), and SHALL restore the leftover's `previous` and claim the run's own workout and date, so a leftover for an older date or library id is never re-sent; before that the result SHALL be `failed{reason: "settling", retryAfter}` with no POST. When Garmin exposes no schedule id (A3 false), a count of 0 SHALL never be taken as absence: the result SHALL be `uncertain`. Without `calendar-find-v1`, or when the read fails, the result SHALL be `uncertain`, and the athlete decides: "It's in Garmin" stores the placement as `unconfirmed` with `supersedes: []` and SHALL be offered only when no entry in a state other than `keep` shares its workout and date (otherwise the row stays `uncertain`), "Send anyway" posts only after the gate.

A `schedule` 404 for a library id from an earlier push SHALL set `forceRepush` and `library: missing`, restore `previous`, and return `failed:library-missing`, so the next push re-creates the library workout through the ledger's `updated` path; a 404 for an id minted in the same run SHALL return `failed:schedule-endpoint`.

#### Scenario: An ambiguous POST adopts the unknown entry

- **GIVEN** a `schedule` that timed out
- **WHEN** `calendar-find` returns the new entry together with `previous` and the queued ids
- **THEN** the pipeline SHALL adopt only the unknown entry at the attempted date, with 1 `schedule` call in total

#### Scenario: Absence inside the gate does not re-POST

- **WHEN** the read finds no unknown entry before `at + POST_GATE_MS`
- **THEN** the result SHALL be `failed{settling}` with `retryAfter = at + POST_GATE_MS` and no second `schedule` call

### Requirement: Removal queue for superseded calendar entries

Every schedule id the pipeline learns SHALL be written to the ledger row's `removalQueue` with a state on `held < keep < retire < gone` (spa-persistence-port), and no entry SHALL ever be removed or lowered. A commit SHALL write the new id `keep` and a superseded `scheduled` `previous` `retire`, in the same write; the claim SHALL record on `attempting` a `supersedes` list of every id in the queue it reads, sorted, and a commit with no id returned SHALL write `unconfirmed` with that list. An id first learned between the claim and the commit SHALL never be listed. Only `retire` entries SHALL be drained, after every commit. `unschedule` outcomes: 204 writes `gone`; 401, or an answer with no status and `needsReauth`, keeps the entry without counting the attempt; 404 writes `gone` only when a `calendar-find` shows the id absent (otherwise `attempts++`); anything else, ambiguous included, is `attempts++`. After 3 attempts an entry SHALL be `abandoned`, re-checked on each push of its record, and dismissible by the athlete ("I removed it", which writes `gone`) with 0 calls. A `held` entry SHALL never be dismissable; it leaves only through the calendar-verified resolution of `uncertain`. An id equal to the current `Placed` or to `attempting.previous` SHALL never be sent to `unschedule`. A `held`, `keep` or `gone` entry SHALL never be sent to `unschedule`. Before each `unschedule` it sends, a drain SHALL read the calendar (`calendar-find` for the current `Placed`'s workout at its date) and SHALL send only when the read shows the `Placed`'s schedule id. A read (A3 true) that shows that id absent SHALL be followed, `SETTLE_MS` later, by a second read, and only a second proof of absence SHALL count. When both reads show the id absent and the `Placed` did not come from this run's own ok POST, the drain SHALL write, in one guarded write, the id `gone` and the placement `uncertain` for its workout and date, and send nothing; the run SHALL then report `uncertain` for that date, never `scheduled`, `moved`, `unchanged` or `duplicate-left`. When both reads show absent the `Placed` of this run's own ok POST, the drain SHALL write nothing and send nothing, and the run SHALL report `duplicate-left` for its `retire` dates; that id SHALL never be written `gone` by a drain. An entry with no id counts against A3 only on the date being judged: an id-less entry on that date SHALL make the read prove nothing, while one on another date of the month SHALL not. When the read fails, is unreadable, or A3 is false, the drain SHALL send nothing and leave every state and attempt count unchanged. While the `Placed` is `unconfirmed`, no `unschedule` SHALL be sent.

An `uncertain` placement SHALL be resolved by `calendar-find` for its workout over the dates of the `uncertain` and of its `held` entries. Exactly one match SHALL be adopted as the `Placed` and written `keep`; a `scheduled` `previous` of the `uncertain` SHALL be written `retire`; `held` ids that the read sees SHALL stay `held` (never drained); `held` ids it does not see SHALL be written `gone`. Several matches SHALL return `duplicate-left` with every state unchanged. No match or a failed read SHALL take the normal `uncertain` path with every state unchanged.

#### Scenario: The current placement is never deleted

- **GIVEN** a queue that, after a merge, holds the id of the current `Placed` or of `attempting.previous`
- **WHEN** the queue is drained
- **THEN** that id SHALL not be sent to `unschedule`, whatever its state

#### Scenario: A drain never deletes behind a dead placement

- **GIVEN** device C, its clock a day ahead, synced `Placed S102` and then moved to S103 without syncing, and device B adopted S103, moved to S104 and deleted S103
- **AND** B's sync merges the cloud's newer `Placed S102` over its S104, so S104 is `retire`
- **WHEN** B drains its queue
- **THEN** B SHALL read the calendar at S102's date, find S102 absent on two reads `SETTLE_MS` apart, and write S102 `gone` and the placement `uncertain`
- **AND** no id SHALL be sent to `unschedule`, so S104 stays on the calendar
- **AND** B's push SHALL report `uncertain` for S102's date, not a success

#### Scenario: A read that lags a fresh POST does not kill the placement

- **GIVEN** S1 on D1, and a push that moves the workout to D2 with an ok POST that returns S2
- **WHEN** the drain's first read of D2 does not show S2 yet, and the read `SETTLE_MS` later does
- **THEN** S2 SHALL stay `keep`, S1 SHALL be sent to `unschedule`, and the push SHALL report `moved`

#### Scenario: A fresh POST is never written gone

- **GIVEN** a push that moves the workout from S1 on D1 to D2 with an ok POST that returns S2
- **WHEN** both of the drain's reads of D2 show S2 absent
- **THEN** no id SHALL be sent to `unschedule`, S2 SHALL stay `keep` and S1 `retire`, and the push SHALL report `duplicate-left` for D1

#### Scenario: A placement moved to another month inside Garmin

- **GIVEN** a `Placed` S2 on D2 with S1 `retire`, and the athlete has dragged S2 inside Garmin to a date in another month
- **WHEN** the record is pushed again to D2
- **THEN** both reads of D2's month SHALL show S2 absent, S2 SHALL be written `gone` and the placement `uncertain`, and nothing SHALL be sent to `unschedule`
- **AND** the athlete's way on SHALL be "Send anyway", which places a new entry on D2 and leaves the moved one

#### Scenario: A drain that cannot verify its placement sends nothing

- **GIVEN** a `Placed` S2 with S1 `retire`
- **WHEN** the drain's read fails, or A3 is false, or the `Placed` is `unconfirmed`
- **THEN** no id SHALL be sent to `unschedule` and S1 SHALL stay `retire` with its attempt count unchanged

#### Scenario: Held ids are resolved by reading the calendar

- **GIVEN** an `uncertain` placement with S1, S2 and S3 `held`, and a `calendar-find` that returns S2 at the `uncertain` date and S1 at another date
- **WHEN** the record is pushed
- **THEN** S2 SHALL become the `Placed` and `keep`, S1 SHALL stay `held`, S3 SHALL become `gone`, and no id SHALL be sent to `unschedule`

### Requirement: Push result and capability detection

`DetectionResult` and `GarminBridgeState` SHALL carry the bridge's `features`, parsed from the ping data and defaulting to `[]` when absent. `push()` SHALL return a `PlacementResult`; `onSent` SHALL fire if and only if the library push is confirmed; EditorPage SHALL persist the confirmed library `workoutId` as the push id, never a synthetic one. Placement analytics SHALL carry only enum values and counts: `garmin-calendar-placement{result, reason?, durationMs, abandonedCount}` with a closed `reason` enum, and no ids, dates or names. Every push the send control starts SHALL emit exactly one such event, including one that throws before the pipeline starts (`failed{library-push-failed}`).

A result that needs the athlete (every result except `scheduled`, `moved` and `unchanged`, plus any dismissable entry) SHALL stay on the editor after the workout becomes `pushed`: the editor's delivery ribbon SHALL show it in a compact panel, and plain results SHALL stay silent. `uncertain` and the dismissable entries SHALL be derived from the record's persisted ledger row (one live query per page), so they survive a reload and reach other devices through sync, and a row that is no longer `uncertain` SHALL never show one. The outcomes the ledger does not hold (`failed`, `library-only`) SHALL be kept in ephemeral per-record state that outlives the send control, never persisted. The ribbon's live region SHALL hold only its headline, detail and result message; its actions, the gate countdown included, SHALL sit outside every live region, so a ticking countdown is never re-announced.

A sent outcome SHALL name the date it was sent for. Once the workout's date differs from that date, the send control SHALL offer a new send, and no message SHALL claim the new date is on the Garmin calendar.

#### Scenario: An uncertain placement survives a reload

- **GIVEN** a push that returned `uncertain` and a workout persisted as `pushed`
- **WHEN** the athlete reloads the editor
- **THEN** the ribbon SHALL show the `uncertain` result with "It's in Garmin" (when allowed) and "Send anyway"
- **AND** once the row is no longer `uncertain`, the panel SHALL disappear with no call

#### Scenario: A date change after a send reopens the send

- **GIVEN** a push for D1 that returned `scheduled`
- **WHEN** the workout's date changes to D2
- **THEN** the send control SHALL be enabled again
- **AND** no message SHALL say the workout is on the Garmin calendar on D2

#### Scenario: A posted attempt is not answered before its gate

- **GIVEN** a row holding `attempting{posted: true}` whose `at + POST_GATE_MS` is still in the future
- **WHEN** the editor shows it as `uncertain`
- **THEN** "It's in Garmin" and "Send anyway" SHALL be disabled, and the panel SHALL say Garmin is still being checked, with the seconds left
- **AND** "It's in Garmin" invoked before the gate SHALL write nothing and return `failed{settling, retryAfter: at + POST_GATE_MS}`, because the POST may still land and a confirmation would retire and drain the `previous` of a workout that may not be in Garmin

#### Scenario: An older bridge is detected

- **GIVEN** a ping response with no `features`
- **WHEN** the athlete pushes
- **THEN** detection SHALL record `features: []`, and the push SHALL make 1 library push and 0 calendar calls and return `library-only{reason:"bridge-outdated"}`
- **AND** the UI SHALL show the workout as in the library with no date, in the warning tone, with one action that opens the extension's store page

#### Scenario: Pushing again after the update only places the date

- **GIVEN** a workout that returned `library-only{reason:"bridge-outdated"}` and whose content has not changed
- **WHEN** the bridge now reports `calendar-write-v1` and the athlete pushes again
- **THEN** the pipeline SHALL make 0 library pushes and 1 `schedule` call, and return `scheduled`
