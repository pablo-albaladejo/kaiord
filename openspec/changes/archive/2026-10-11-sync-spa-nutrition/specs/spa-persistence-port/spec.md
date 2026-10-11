## ADDED Requirements

### Requirement: Nutrition syncs across devices

Intake entries and intake presets SHALL carry an `updatedAt` sync clock stamped by every writer, and their deletes through `PersistencePort` SHALL record tombstones. The `energyTargets` row is keyed by `profileId`, has no single-row delete and is removed only by the profile cascade, so it SHALL be classified as untombstonable; two devices holding a goal for one profile SHALL keep the most recently saved one. A snapshot that lacks a nutrition table SHALL be merged as carrying no information for it, so a device on an older build, which neither exports nor imports these tables, SHALL push the remote nutrition back unchanged.

#### Scenario: An intake created on one device reaches the other

- **WHEN** device A logs an intake and syncs, then device B syncs
- **THEN** device B SHALL hold the intake

#### Scenario: An intake deleted on one device leaves the other

- **GIVEN** two synced devices holding an intake
- **WHEN** device A deletes it and syncs, then device B syncs
- **THEN** neither device SHALL hold it

#### Scenario: The newest of two edits wins

- **WHEN** two devices edit the same intake and both sync
- **THEN** both SHALL hold the edit with the newest `updatedAt`

#### Scenario: An older build keeps the Drive nutrition

- **GIVEN** a remote snapshot with nutrition rows and tombstones
- **WHEN** a device whose snapshot has no nutrition tables syncs twice
- **THEN** the pushed snapshot SHALL still carry those rows and tombstones
- **AND** when the remote manifest is newer than that device's schema, the device SHALL refuse it before importing or pushing

### Requirement: Synced energy and intake stores

The persistence layer SHALL provide stores for `intakeEntries`
(indexed by `[profileId+date]`), `intakePresets` (indexed by `profileId`), and
`energyTargets` (per profile), introduced via a Dexie **v25** upgrade following the
existing versioned-schema migration pattern with a co-located migration test. These
stores SHALL travel in the cloud snapshot. Dexie **v37** SHALL backfill the
`updatedAt` sync clock of intake entries (from `loggedAt`) and presets (from
`createdAt`) written before it existed.

#### Scenario: New stores available after v25 upgrade

- **GIVEN** a database upgraded to Dexie v25
- **WHEN** the app reads the schema
- **THEN** `intakeEntries`, `intakePresets`, and `energyTargets` stores exist with their declared indexes

#### Scenario: Energy and intake stores ride the snapshot

- **GIVEN** populated `intakeEntries`, `intakePresets`, and `energyTargets` stores
- **WHEN** a cloud snapshot is produced
- **THEN** their rows appear in the snapshot, and `connections` does not

#### Scenario: Clock backfilled by the v37 upgrade

- **GIVEN** a v36 database with an intake entry and a preset that have no `updatedAt`
- **WHEN** the app opens it at v37
- **THEN** the entry's `updatedAt` equals its `loggedAt`, the preset's equals its `createdAt`, and a row that already had a clock is unchanged

## MODIFIED Requirements

### Requirement: Cloud sync reconciles the unclaimed default profile

`syncWithCloud` SHALL run, on every attempt including a retry after a moved revision, `mergeSnapshots`, then `reconcileAutoProfile(merged, remote, perProfileTables)`, then the import, then `cloud.push`. The reconcile SHALL take its target from the remote snapshot:

- with exactly one real remote profile, every row of the auto profile SHALL be re-keyed onto it, rewriting `profileId` and every composite id that embeds the profile id, with a collision rule per table; collisions SHALL be detected on every unique key, including the natural key of imported records (`[profileId+sourceBridgeId+externalId]`) and of session matches (one per planned activity and per workout), and a winning auto row SHALL keep the target row's id; the auto profile SHALL be removed without a tombstone, its own tombstones dropped rather than re-keyed, and its integration cursors dropped; `meta.activeProfileId` SHALL point at the target;
- with several real remote profiles, the sync SHALL stop before importing or pushing and SHALL ask the user to choose; the choice SHALL be stored locally and the sync re-run;
- with none, the auto profile SHALL be claimed and pushed.

The nutrition tables travel in the snapshot and SHALL be re-keyed inside it, `energyTargets` keeping the row with the newest `updatedAt` on a collision. `connections`, the only device-local table that never travels in the snapshot, SHALL be re-keyed in the same transaction as the import. `cloud.push` SHALL never receive a profile with `origin: "auto"`; `syncWithCloud` SHALL refuse, before importing or pushing, a reconciled snapshot that still carries one.

#### Scenario: One real remote profile absorbs the default profile

- **GIVEN** a device whose default profile holds a workout, a day note and an intake entry
- **WHEN** it syncs against a remote with one real profile
- **THEN** all three SHALL belong to the remote profile, the default profile SHALL be gone, and neither the local database nor the pushed snapshot SHALL contain its id

#### Scenario: Several remote profiles wait for a choice

- **GIVEN** a device with a default profile and a remote with two real profiles
- **WHEN** it syncs twice without a choice
- **THEN** nothing SHALL be pushed and the local database SHALL be unchanged
- **AND** after the user picks one, the next sync SHALL move the rows onto it

#### Scenario: An empty remote claims the default profile

- **WHEN** a device with a default profile syncs against a remote with no real profile
- **THEN** the pushed snapshot SHALL carry the profile with `origin: "local"`

#### Scenario: A record imported under both profiles stays one row

- **GIVEN** the auto profile and the remote profile both imported the same night from one source, under different ids
- **WHEN** the auto profile is re-keyed onto the remote profile
- **THEN** one row SHALL remain, under the remote profile's id

#### Scenario: The auto profile's deletes do not reach the target

- **GIVEN** the auto profile deleted a coaching activity the remote profile also holds
- **WHEN** the auto profile is re-keyed onto the remote profile
- **THEN** no tombstone SHALL name the remote profile's row

#### Scenario: The re-key and the import are atomic

- **WHEN** a step after the import fails inside the sync transaction
- **THEN** neither the imported rows nor the device-local re-key SHALL be committed

### Requirement: Backup export

Settings → Privacy SHALL offer an "export my data" control that downloads one plain-JSON file `{format: "kaiord-backup", version: 2, manifest, tables, tombstones}` and says that the file is not encrypted and holds no API key. The export SHALL reuse the snapshot export and a backup table policy that classifies every table of the schema:

- the user's records SHALL be included as the snapshot carries them;
- `syncState`, `coachingSyncState`, `connections`, `bridges` and the `tombstones` table SHALL be excluded; tombstones SHALL travel in the file's `tombstones` field;
- `aiProviders` SHALL be included without its `apiKey` field;
- `intakeEntries`, `intakePresets` and `energyTargets` SHALL be included in `tables` as the snapshot carries them;
- a table the policy does not classify SHALL be left out, and a guard over the live schema SHALL fail until it is classified.

The export SHALL write nothing locally: an unclaimed default profile SHALL be written to the file with `origin: "local"` and SHALL stay `origin: "auto"` in the database, so the file never carries `origin: "auto"` and the export never makes the local profile syncable.

#### Scenario: The file carries the records and no secret

- **GIVEN** a clean browser whose default profile holds a workout, a wellness value, an intake and an AI provider with a key
- **WHEN** the user exports their data
- **THEN** the file SHALL contain the workout, the wellness value, the intake and the provider's configuration
- **AND** it SHALL contain no `apiKey`, no `syncState` and no `"origin":"auto"`

#### Scenario: Exporting leaves the default profile unclaimed

- **GIVEN** the active profile has `origin: "auto"`
- **WHEN** the user exports their data
- **THEN** the file SHALL carry that profile with `origin: "local"`
- **AND** the database SHALL still hold it with `origin: "auto"`

#### Scenario: A new table is classified before it can reach a file

- **GIVEN** a schema version that adds a table
- **WHEN** the backup coverage guard runs
- **THEN** it SHALL fail until the table has a backup rule

### Requirement: Backup import

Settings → Privacy SHALL offer an "import backup" control that reads a `kaiord-backup` file and merges it into this browser, never replacing its data. The file SHALL be validated first: a file of another format or with malformed rows SHALL be rejected as not a Kaiord backup, a `version: 1` file SHALL be read with its `nutrition` field folded into `tables` (the `updatedAt` clock backfilled as the v37 upgrade does), and a backup `version` this app does not know, or a `manifest.schemaVersion` newer than the local database, SHALL be rejected with a message asking to update the app. A rejected file SHALL write nothing.

The import SHALL export the local snapshot, merge it last-write-wins with the file (`mergeSnapshots`), reconcile the unclaimed default profile against the file's profiles with the same `reconcileAutoProfile` as cloud sync, and import the result, all in one read-write transaction together with the device-local rewrite, so a failure rolls everything back. The file SHALL contribute only the tables the backup table policy includes, rewritten by it: `syncState`, `coachingSyncState`, `connections`, `bridges` and any `apiKey` in a file SHALL be ignored. `meta` SHALL stay the device's own, except that the file's `activeProfileId` SHALL be adopted when the device has no valid active profile.

- Tombstones on either side SHALL suppress older rows, so a record deleted after the backup SHALL stay deleted.
- With one profile in the file, the default profile's rows SHALL be re-keyed onto it and the device SHALL end with that one profile active; with several, the import SHALL write nothing and ask which profile to join, then re-run with the choice.
- Each AI provider SHALL keep the encrypted key this device holds for it; a provider only the file has SHALL be stored without a key, marked `apiKeyMissing`, SHALL not become the default when the device has one, SHALL be listed in the provider settings as missing its key, and SHALL never be offered to an AI feature.
- Nutrition SHALL merge like every other included table, and only for profiles present after the import; an intake deleted after the backup SHALL stay deleted and the summary SHALL carry no nutrition warning.

The import SHALL end with a summary of the rows it added, updated and did not restore because they were deleted after the backup.

#### Scenario: A clean browser restores a backup under one profile

- **GIVEN** a backup of a profile with a workout, a wellness value, an intake and an AI provider
- **WHEN** a clean browser imports it
- **THEN** it SHALL hold that one profile, active, with the workout, the wellness value and the intake
- **AND** its own default profile's rows SHALL have moved onto that profile
- **AND** the provider SHALL be listed as missing its key

#### Scenario: Importing never wipes local data

- **GIVEN** a browser with records of its own and a newer copy of a row the backup also holds
- **WHEN** it imports the backup
- **THEN** its own records SHALL remain and the newer row SHALL not be overwritten

#### Scenario: A delete made after the backup holds

- **GIVEN** a workout deleted after the backup was exported
- **WHEN** the backup is imported
- **THEN** the workout SHALL stay deleted and the summary SHALL count it as not restored

#### Scenario: An intake deleted after the backup holds

- **GIVEN** an intake entry deleted after the backup was exported, on this device or on another device that synced the delete
- **WHEN** the backup is imported
- **THEN** the entry SHALL stay deleted on every device and the summary SHALL count it as not restored

#### Scenario: A version 1 backup still imports

- **GIVEN** a `version: 1` file whose intake rows sit in `nutrition` without `updatedAt`
- **WHEN** it is imported
- **THEN** its intake rows SHALL be restored with `updatedAt` taken from `loggedAt`

#### Scenario: Importing twice changes nothing

- **WHEN** the same backup is imported a second time
- **THEN** the database SHALL be unchanged and the summary SHALL report nothing added or updated

#### Scenario: A tampered file cannot bring secrets or cursors

- **GIVEN** a file that carries `apiKey`, `syncState`, `coachingSyncState` or `connections`
- **WHEN** it is imported
- **THEN** none of them SHALL be written

#### Scenario: A backup from a newer app is refused

- **GIVEN** a backup whose `manifest.schemaVersion` is newer than the local database
- **WHEN** the user imports it
- **THEN** nothing SHALL be written and the page SHALL ask to update the app

## REMOVED Requirements

### Requirement: Energy and intake stores

**Reason**: The stores no longer stay out of the cloud snapshot; nutrition syncs across devices.

**Migration**: Dexie v37 backfills the `updatedAt` clock; no user action is needed. See "Synced energy and intake stores".
