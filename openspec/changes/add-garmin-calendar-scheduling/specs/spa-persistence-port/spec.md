## ADDED Requirements

### Requirement: Garmin export-ledger placement model

Garmin rows of the `exportLedger` table SHALL be able to carry four optional fields, typed as tagged unions with branded ids (`GarminWorkoutId`, `GarminScheduleId`, both `^[1-9]\d*$`, built only through their parsers so one cannot be passed where the other is expected):

- `library`: `{ kind: "confirmed"; workoutId } | { kind: "unconfirmed" } | { kind: "missing"; workoutId }`
- `forceRepush`: `true`
- `placement`: a `Placed` (`{ kind: "scheduled"; workoutScheduleId; workoutId; date } | { kind: "unconfirmed"; workoutId; date; supersedes }`, `supersedes` a sorted, unique list of schedule ids), or `{ kind: "attempting"; workoutId; date; at; posted; previous? }`, or `{ kind: "uncertain"; workoutId; date; previous? }`
- `removalQueue`: `{ workoutScheduleId; workoutId; date; attempts; abandoned; state }[]`, a grow-only map from schedule id to a state on the lattice `held < keep < retire < gone`. `held` is an id nobody has verified (never `Placed`, never drained); `keep` is a verified live, current entry (written by a commit or a calendar adoption); `retire` is a verified superseded entry (drainable); `gone` is a tombstone (drained with 204/404, or verified absent). An entry SHALL never be removed; only its state rises.

Every pipeline read and write SHALL address the row by its natural key `[kaiordRecordId+destinationBridgeId]` through `findByNaturalKey` and `mutateByKey` (both delivered by #1265), never by ledger `id`. `mutateByKey` SHALL stamp `updatedAt` only when the row actually changed, so a no-op leaves it byte-identical. The library push SHALL commit through one `buildCommitPatch` passed to `commitByKey` on both the created and updated paths; it SHALL check `pending` before the content hash, honour `forceRepush`, and never persist `"pending"` as a Garmin push id.

#### Scenario: A no-op mutation leaves the row untouched

- **WHEN** `mutateByKey` runs a function that returns the row unchanged
- **THEN** the stored row, `updatedAt` included, SHALL be byte-identical

#### Scenario: A pending row wins over an equal hash

- **GIVEN** a `pending` row with the same content hash
- **WHEN** a second push of that record runs
- **THEN** the outcome SHALL be `lost-race`, not `skipped`

### Requirement: Dexie v36 migration and import normalization of Garmin ledger rows

Dexie v36 SHALL upgrade existing Garmin ledger rows with `normalizeGarminLedgerRow`, a shape-based, idempotent function: a `destinationExternalId` matching `^[1-9]\d*$` becomes `library: confirmed`; `pending` or `garmin-unconfirmed` becomes `library: unconfirmed`; invalid parts (for example a malformed queue id) are dropped after a schema parse; a legacy queue entry with no `state` becomes `held`, the id of a `scheduled` placement or `previous` becomes `keep` unless the queue already gives it a state, and an `unconfirmed` placement with no `supersedes` gets `supersedes: []`. Rows of other destinations SHALL be untouched. The same function SHALL run on every `exportLedger` row a snapshot import brings in, through an optional `normalize` on the table's `RowMergeHook`, whatever the snapshot's manifest version, so a legacy row synced from an older device is normalized too.

#### Scenario: A v35 row is upgraded

- **GIVEN** a Garmin ledger row with `destinationExternalId: "1707805999"`
- **WHEN** the database opens at v36
- **THEN** the row SHALL carry `library: { kind: "confirmed", workoutId: "1707805999" }`

#### Scenario: Normalizing twice changes nothing

- **WHEN** `normalizeGarminLedgerRow` runs on its own output
- **THEN** the result SHALL equal its input

### Requirement: Garmin-aware export-ledger merge

The `exportLedger` entry of `ROW_MERGE_HOOKS` (delivered by #1265) SHALL be replaced by a Garmin-aware merge: Garmin rows SHALL merge through `mergeGarminLedgerRows`, every other destination SHALL keep `mergeExportLedgerRows`. The merge SHALL remain symmetric, as the hook contract requires. For Garmin rows, supersession SHALL beat the clock:

1. The merged queue SHALL be the join of both queues by id: the maximum `state` on `held < keep < retire < gone`, the maximum `attempts`, and the OR of `abandoned`; it SHALL be emitted in ascending id order. No entry SHALL ever be removed and no state SHALL ever be lowered, by the merge or by anyone else.
2. A `scheduled` `Placed` SHALL be **tainted** when its id's merged state is anything but `keep` (an absent id is not tainted). An `unconfirmed` `Placed` SHALL be tainted when an entry with its `workoutId` and `date` has a merged state other than `keep`, since it may be that entry, unless that entry is listed in the placement's `supersedes` and is `retire` or `gone` (it was known before the placement's entry existed, so it is another entry). Two `unconfirmed` for the same workout and date SHALL merge into one whose `supersedes` is the sorted union of both, tested for taint as one. The untainted `Placed`s are the candidates.
3. The same entry on both sides (same id, or same workout and date when one side is `unconfirmed`) SHALL keep the side that knows its schedule id, else the newer. Of two different candidates the newer row's SHALL win and a `scheduled` loser SHALL be written `retire` (an `unconfirmed` loser has no id). The merged `Placed`'s id SHALL appear in the queue as `keep`.
4. When every `Placed` present is tainted and neither row is `attempting` or `uncertain`, the merged placement SHALL be `{ kind: "uncertain", workoutId, date }` with no `previous`, and no state SHALL change. `workoutId` and `date` SHALL be those of the maximum `held` entry, or, when there is no `held` entry, of the maximum entry of the whole queue, by latest `date`, then larger `workoutId`, then larger `workoutScheduleId`.
5. When no `Placed` is a candidate, an `attempting` or `uncertain` of either row SHALL survive, preferring `posted: true`, before rule 4 applies.
6. `library` and `forceRepush` SHALL come only from the newer row, and `updatedAt` SHALL be the later of the two by the ledger clock's parse (an unparsable stamp counts as 0), ties broken by the larger string.

Only `retire` entries SHALL be sent to `unschedule`. A `held`, `keep` or `gone` entry SHALL never be.

The merge SHALL be symmetric (`merge(a, b) = merge(b, a)`), idempotent (`merge(x, x) = x` for a well-formed row: normalized, and whose own `Placed` is not tainted by its own queue; every row the pipeline produces is well-formed) and absorbing (`merge(x, merge(x, y)) = merge(x, y)` and `merge(merge(x, y), y) = merge(x, y)`), because a cloud sync merges each device's live row with a snapshot that already merged it. Pairwise supersession cannot be associative, so for devices syncing through the cloud the merge SHALL be safe (no drain ever empties the calendar of a record that has a live entry, and no device drains its own `Placed`) and SHALL converge.

#### Scenario: Two live placements merge to the newer one

- **GIVEN** device A holds `Placed S2` (S2 `keep`) and device B, newer, holds `Placed S1` (S1 `keep`)
- **WHEN** the rows merge, in either argument order
- **THEN** the result SHALL be `Placed S1` with S1 `keep` and S2 `retire`, and `merge(a, b)` SHALL equal `merge(b, a)`

#### Scenario: An unconfirmed placement that may be a drained entry does not win

- **GIVEN** device A, stale but newer by the clock, holds `Placed unconfirmed` for W on D1, and the cloud holds `Placed S3` (S3 `keep`) with S1, W on D1, `gone`
- **WHEN** A syncs
- **THEN** A's placement SHALL be tainted by S1, the result SHALL be `Placed S3`, and S3 SHALL never be drained

#### Scenario: A device's own id-less placement back at an earlier date stays placed (L)

- **GIVEN** a device placed S1 on D1, moved to S2 on D2, drained S1 (`gone`), then pushed back to D1 with no id returned, so its row holds `unconfirmed` for W on D1 with `supersedes [S1, S2]`, S1 `gone` and S2 `retire`
- **WHEN** the row merges with itself or with a copy of itself
- **THEN** the result SHALL equal the row, and the placement SHALL stay `unconfirmed` on D1

#### Scenario: A stale placement drained elsewhere never wins (H1)

- **GIVEN** device C, offline, holds `Placed S100` with S100 `keep`, and the cloud holds S100 `gone` with an `uncertain` placement and S1, S2 `held`
- **WHEN** C syncs
- **THEN** S100 SHALL be tainted, the result SHALL stay `uncertain`, and no `unschedule` SHALL be issued for S1 or S2

#### Scenario: An adoption survives the next sync (H2)

- **GIVEN** device A adopted S2 (`Placed S2`, S2 `keep`, S1 `retire`) and the stale cloud holds `uncertain` with S1 and S2 `held`
- **WHEN** A and then B sync with the cloud
- **THEN** both devices SHALL hold `Placed S2` with S2 `keep`, and only S1 SHALL ever be drained

#### Scenario: A legacy queue entry is never drained

- **GIVEN** device A holds `Placed S2` with a legacy queue `[S1]` (no state) and device B, newer, holds `Placed S1`
- **WHEN** both devices sync and drain in any order
- **THEN** A SHALL never drain S1 before the merge verified it `retire`, and one calendar entry SHALL survive
