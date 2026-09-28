## ADDED Requirements

### Requirement: Garmin export-ledger placement model

Garmin rows of the `exportLedger` table SHALL be able to carry four optional fields, typed as tagged unions with branded ids (`GarminWorkoutId`, `GarminScheduleId`, both `^[1-9]\d*$`, built only through their parsers so one cannot be passed where the other is expected):

- `library`: `{ kind: "confirmed"; workoutId } | { kind: "unconfirmed" } | { kind: "missing"; workoutId }`
- `forceRepush`: `true`
- `placement`: a `Placed` (`{ kind: "scheduled"; workoutScheduleId; workoutId; date } | { kind: "unconfirmed"; workoutId; date }`), or `{ kind: "attempting"; workoutId; date; at; posted; previous? }`, or `{ kind: "uncertain"; workoutId; date; previous? }`
- `removalQueue`: `{ workoutScheduleId; workoutId; date; attempts; abandoned; held?: true }[]`. A `held` entry is an id the merge could not trust (it may be the entry another device treats as current): it SHALL never become the merged `Placed` and SHALL never be sent to `unschedule`.

Every pipeline read and write SHALL address the row by its natural key `[kaiordRecordId+destinationBridgeId]` through `findByNaturalKey` and `mutateByKey` (both delivered by #1265), never by ledger `id`. `mutateByKey` SHALL stamp `updatedAt` only when the row actually changed, so a no-op leaves it byte-identical. The library push SHALL commit through one `buildCommitPatch` passed to `commitByKey` on both the created and updated paths; it SHALL check `pending` before the content hash, honour `forceRepush`, and never persist `"pending"` as a Garmin push id.

#### Scenario: A no-op mutation leaves the row untouched

- **WHEN** `mutateByKey` runs a function that returns the row unchanged
- **THEN** the stored row, `updatedAt` included, SHALL be byte-identical

#### Scenario: A pending row wins over an equal hash

- **GIVEN** a `pending` row with the same content hash
- **WHEN** a second push of that record runs
- **THEN** the outcome SHALL be `lost-race`, not `skipped`

### Requirement: Dexie v36 migration and import normalization of Garmin ledger rows

Dexie v36 SHALL upgrade existing Garmin ledger rows with `normalizeGarminLedgerRow`, a shape-based, idempotent function: a `destinationExternalId` matching `^[1-9]\d*$` becomes `library: confirmed`; `pending` or `garmin-unconfirmed` becomes `library: unconfirmed`; invalid parts (for example a malformed queue id) are dropped after a schema parse. Rows of other destinations SHALL be untouched. The same function SHALL run on every `exportLedger` row a snapshot import brings in, through an optional `normalize` on the table's `RowMergeHook`, whatever the snapshot's manifest version, so a legacy row synced from an older device is normalized too.

#### Scenario: A v35 row is upgraded

- **GIVEN** a Garmin ledger row with `destinationExternalId: "1707805999"`
- **WHEN** the database opens at v36
- **THEN** the row SHALL carry `library: { kind: "confirmed", workoutId: "1707805999" }`

#### Scenario: Normalizing twice changes nothing

- **WHEN** `normalizeGarminLedgerRow` runs on its own output
- **THEN** the result SHALL equal its input

### Requirement: Garmin-aware export-ledger merge

The `exportLedger` entry of `ROW_MERGE_HOOKS` (delivered by #1265) SHALL be replaced by a Garmin-aware merge: Garmin rows SHALL merge through `mergeGarminLedgerRows`, every other destination SHALL keep `mergeExportLedgerRows`. The merge SHALL remain symmetric, as the hook contract requires. For Garmin rows, supersession SHALL beat the clock:

1. An id in either row's `removalQueue`, `held` or not, SHALL never become the merged `Placed`; nor SHALL an `unconfirmed` `Placed` whose `workoutId` and `date` match a queued entry, since it may be that entry. Of the remaining `Placed` candidates with different ids, the newer row's wins and the other is queued.
2. When no candidate remains because every `Placed` present is tainted that way, the merged placement SHALL be `{ kind: "uncertain", workoutId, date }` with no `previous`, and every tainted id SHALL be kept in the merged queue marked `held` — never removed, never sent to `unschedule`. `workoutId` and `date` SHALL be a function of the merged `held` entries alone: those of the entry with the latest `date`, then the larger `workoutId`, then the larger `workoutScheduleId`. The worst case is an untracked duplicate, never a gap.
3. An `attempting` or `uncertain` SHALL survive only when neither row has a `Placed`, preferring `posted: true`.
4. The merged queue SHALL be the union by id, keeping the maximum `attempts` and OR-ing `abandoned` and `held`, minus the merged `Placed` id and the `previous` id unless held, in ascending id order. When the merged placement is a `Placed`, every `held` mark SHALL be cleared: that `Placed` is a trusted entry that is none of the queued ones, so removing them can leave no gap.
5. `library` and `forceRepush` SHALL come only from the newer row, and `updatedAt` SHALL be the later of the two by the ledger clock's parse (an unparsable stamp counts as 0), ties broken by the larger string.

The merge SHALL be symmetric (`merge(a, b) = merge(b, a)`), idempotent (`merge(x, x) = x` for a well-formed row) and absorbing (`merge(x, merge(x, y)) = merge(x, y)` and `merge(merge(x, y), y) = merge(x, y)`), because a cloud sync merges each device's live row with a snapshot that already merged it. Pairwise supersession cannot be associative, so for three devices the merge SHALL be safe in every grouping (the merged `Placed` is never drained, and some live entry survives the drain) and SHALL converge under sequential syncs.

#### Scenario: Placements that are all queued merge to uncertain

- **GIVEN** device A holds `Placed S2` with queue `[S1]` and device B holds `Placed S1` with queue `[S2]`
- **WHEN** the rows merge, in either argument order
- **THEN** the result SHALL be `uncertain` with the `workoutId` and `date` of S2 (the later held entry), no `previous`, and both S1 and S2 in the queue marked `held`
- **AND** `merge(a, b)` SHALL equal `merge(b, a)`, and no `unschedule` SHALL be issued for S1 or S2

#### Scenario: A re-merge after a cloud sync changes nothing

- **GIVEN** the rows of the previous scenario and their merge `m`
- **WHEN** each device merges its own live row with `m`, as the snapshot import does, and the devices sync again
- **THEN** both devices SHALL hold rows equal to `m`, so neither drain issues an `unschedule` and the placement never flips

#### Scenario: An unconfirmed placement that may be a queued entry does not win

- **GIVEN** device A holds `Placed unconfirmed` for workout W on D1 and device B holds only the queue `[S1]`, where S1 is W on D1
- **WHEN** the rows merge
- **THEN** the result SHALL be `uncertain` for W on D1, with S1 kept and marked `held`

#### Scenario: A superseded placement never wins the merge

- **GIVEN** device A holds `Placed S2` with queue `[S1]` and device B, newer, holds `Placed S1`
- **WHEN** the rows merge
- **THEN** the result SHALL be `Placed S2` with queue `[S1]`, and draining it SHALL leave one calendar entry, at S2's date
