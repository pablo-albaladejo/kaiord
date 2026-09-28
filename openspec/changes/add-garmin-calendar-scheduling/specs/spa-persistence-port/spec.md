## ADDED Requirements

### Requirement: Garmin export-ledger placement model

Garmin rows of the `exportLedger` table SHALL be able to carry four optional fields, typed as tagged unions with branded ids (`GarminWorkoutId`, `GarminScheduleId`, both `^\d+$`, built only through their parsers so one cannot be passed where the other is expected):

- `library`: `{ kind: "confirmed"; workoutId } | { kind: "unconfirmed" } | { kind: "missing"; workoutId }`
- `forceRepush`: `true`
- `placement`: a `Placed` (`{ kind: "scheduled"; workoutScheduleId; workoutId; date } | { kind: "unconfirmed"; workoutId; date }`), or `{ kind: "attempting"; workoutId; date; at; posted; previous? }`, or `{ kind: "uncertain"; workoutId; date; previous? }`
- `removalQueue`: `{ workoutScheduleId; workoutId; date; attempts; abandoned }[]`

Every pipeline read and write SHALL address the row by its natural key `[kaiordRecordId+destinationBridgeId]` through `findByNaturalKey` and `mutateByKey` (both delivered by #1265), never by ledger `id`. `mutateByKey` SHALL stamp `updatedAt` only when the row actually changed, so a no-op leaves it byte-identical. The library push SHALL commit through one `buildCommitPatch` passed to `commitByKey` on both the created and updated paths; it SHALL check `pending` before the content hash, honour `forceRepush`, and never persist `"pending"` as a Garmin push id.

#### Scenario: A no-op mutation leaves the row untouched

- **WHEN** `mutateByKey` runs a function that returns the row unchanged
- **THEN** the stored row, `updatedAt` included, SHALL be byte-identical

#### Scenario: A pending row wins over an equal hash

- **GIVEN** a `pending` row with the same content hash
- **WHEN** a second push of that record runs
- **THEN** the outcome SHALL be `lost-race`, not `skipped`

### Requirement: Dexie v36 migration and import normalization of Garmin ledger rows

Dexie v36 SHALL upgrade existing Garmin ledger rows with `normalizeGarminLedgerRow`, a shape-based, idempotent function: a `destinationExternalId` matching `^\d+$` becomes `library: confirmed`; `pending` or `garmin-unconfirmed` becomes `library: unconfirmed`; invalid parts (for example a malformed queue id) are dropped after a schema parse. Rows of other destinations SHALL be untouched. The same function SHALL run on every `exportLedger` row a snapshot import brings in, through an optional `normalize` on the table's `RowMergeHook`, whatever the snapshot's manifest version, so a legacy row synced from an older device is normalized too.

#### Scenario: A v35 row is upgraded

- **GIVEN** a Garmin ledger row with `destinationExternalId: "1707805999"`
- **WHEN** the database opens at v36
- **THEN** the row SHALL carry `library: { kind: "confirmed", workoutId: "1707805999" }`

#### Scenario: Normalizing twice changes nothing

- **WHEN** `normalizeGarminLedgerRow` runs on its own output
- **THEN** the result SHALL equal its input

### Requirement: Garmin-aware export-ledger merge

The `exportLedger` entry of `ROW_MERGE_HOOKS` (delivered by #1265) SHALL be replaced by a Garmin-aware merge: Garmin rows SHALL merge through `mergeGarminLedgerRows`, every other destination SHALL keep `mergeExportLedgerRows`. The merge SHALL remain symmetric, as the hook contract requires. For Garmin rows, supersession SHALL beat the clock:

1. An id in either row's `removalQueue` SHALL never become the merged `Placed`. Of the remaining `Placed` candidates with different ids, the newer row's wins and the other is queued; with no candidate, the newer row's `Placed` is kept and removed from the queue, so there is never a gap.
2. An `attempting` or `uncertain` SHALL survive only when neither row has a `Placed`, preferring `posted: true`.
3. The merged queue SHALL be the union by id, minus the merged `Placed` id and `attempting.previous` id, keeping the maximum `attempts` and OR-ing `abandoned`.
4. `library` and `forceRepush` SHALL come only from the newer row, and `updatedAt` SHALL be the later of the two.

#### Scenario: A superseded placement never wins the merge

- **GIVEN** device A holds `Placed S2` with queue `[S1]` and device B, newer, holds `Placed S1`
- **WHEN** the rows merge
- **THEN** the result SHALL be `Placed S2` with queue `[S1]`, and draining it SHALL leave one calendar entry, at S2's date
