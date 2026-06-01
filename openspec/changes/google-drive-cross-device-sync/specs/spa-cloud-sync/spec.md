## ADDED Requirements

### Requirement: CloudSyncPort interface

The system SHALL define a `CloudSyncPort` interface exposing `isAuthenticated(): boolean`, `authenticate(): Promise<void>`, `pull(): Promise<RemoteSnapshot | null>`, and `push(snapshot, expectedRevision): Promise<string>`. Application use cases SHALL depend on this port, never on the Google Drive API or any HTTP client directly. The port SHALL NOT contain merge or conflict-resolution logic.

#### Scenario: Application code depends on the port

- **WHEN** an application use case needs to read or write the remote snapshot
- **THEN** it SHALL call `CloudSyncPort` methods, never the Drive REST API or `fetch` directly

#### Scenario: Pull returns null when no remote snapshot exists

- **GIVEN** the user has connected an account but never pushed
- **WHEN** `pull()` is called
- **THEN** it SHALL resolve to `null` rather than throwing

#### Scenario: Push returns the new revision identifier

- **WHEN** `push(snapshot, expectedRevision)` succeeds
- **THEN** it SHALL resolve to the remote file's new `headRevisionId` string for the caller to record

### Requirement: Google Drive appDataFolder adapter

The system SHALL provide a `googleDriveCloudSyncAdapter` implementing `CloudSyncPort` using Google Identity Services for client-side OAuth (scope `https://www.googleapis.com/auth/drive.appdata`) and the Drive REST API for file I/O. The adapter SHALL store exactly one canonical file named `kaiord-snapshot.json` in the user's `appDataFolder`. The adapter SHALL perform authentication and file I/O only and SHALL NOT perform snapshot merging.

#### Scenario: First push creates the canonical file

- **GIVEN** no `kaiord-snapshot.json` exists in `appDataFolder`
- **WHEN** `push()` is called
- **THEN** the adapter SHALL create the file in `appDataFolder` via a multipart upload and return its `headRevisionId`

#### Scenario: Subsequent push updates the same file

- **GIVEN** `kaiord-snapshot.json` already exists
- **WHEN** `push()` is called again
- **THEN** the adapter SHALL update the existing file (media PATCH) rather than creating a second file

#### Scenario: Pull reads file and revision together

- **WHEN** `pull()` is called and the file exists
- **THEN** the adapter SHALL return the parsed snapshot together with the file's current `headRevisionId`

#### Scenario: No backend dependency

- **WHEN** the SPA is built and deployed
- **THEN** cloud sync SHALL function from static hosting with only an OAuth Client ID, requiring no server-side component

### Requirement: SnapshotPort interface

The system SHALL define a `SnapshotPort` providing whole-database dump/restore: `schemaVersion()`, `exportTables()`, `importTables(tables)`, `listTombstones()`, and `replaceTombstones(tombstones)`. This port exists separately from the per-domain `PersistencePort` repositories because those expose only scoped readers (no uniform `getAll`/`clear`), so a generic whole-database snapshot cannot be assembled through `PersistencePort` alone. The Dexie adapter SHALL implement `SnapshotPort` by enumerating `db.tables`; an in-memory fake SHALL mirror it for tests. The `exportSnapshot`/`importSnapshot` use cases SHALL depend on `SnapshotPort` and SHALL NOT import `dexie-database` (preserving guard R-AppDexieImport).

#### Scenario: Snapshot use cases depend on the port, not Dexie

- **WHEN** `exportSnapshot` or `importSnapshot` reads or writes the whole database
- **THEN** it SHALL call `SnapshotPort` methods and SHALL NOT import `dexie-database`

#### Scenario: Adapter enumerates all tables generically

- **WHEN** the Dexie `SnapshotPort` adapter exports tables
- **THEN** it SHALL enumerate `db.tables` so a new table added in a future schema version is captured without changing the use cases

### Requirement: Full-database snapshot

`exportSnapshot` SHALL produce a snapshot containing every Dexie table's rows, a `tombstones` array, and a manifest carrying `schemaVersion`, `deviceId`, `exportedAt` (ISO 8601), and an `encrypted` flag. `importSnapshot` SHALL restore a snapshot into Dexie. Both SHALL be pure application use cases that depend only on `SnapshotPort` (not on `dexie-database` directly), keeping the merge/export logic testable with the in-memory fake.

#### Scenario: Snapshot includes all tables

- **WHEN** `exportSnapshot` runs against a database with workouts, templates, profiles, coaching activities, AI providers, and usage rows
- **THEN** the produced snapshot SHALL contain each of those tables' rows under `tables` and a `manifest.schemaVersion` equal to the current Dexie version

#### Scenario: Export then import round-trips

- **GIVEN** a populated database
- **WHEN** `exportSnapshot` is called, the database is cleared, and `importSnapshot` is called with the result
- **THEN** every table SHALL contain the same rows it held before export

#### Scenario: AI provider rows survive the round-trip

- **GIVEN** an `aiProviders` row whose API key is stored encrypted
- **WHEN** the snapshot is exported and imported on another device running the same code
- **THEN** the API key SHALL decrypt successfully on that device

### Requirement: Last-write-wins conflict resolution

`syncWithCloud` SHALL merge the local and remote snapshots per record, keyed by primary key, keeping the record whose `updatedAt` is newer, falling back to `createdAt` when `updatedAt` is absent. Tables without per-record timestamps (`meta`, `usage`) SHALL be merged whole-record using the snapshot manifest `exportedAt` as the comparison timestamp. The merge SHALL be a pure function with no Drive or Dexie dependency.

#### Scenario: Newer local edit wins

- **GIVEN** a workout exists in both snapshots with the same id, the local copy having a later `updatedAt`
- **WHEN** `syncWithCloud` merges them
- **THEN** the merged result SHALL contain the local copy

#### Scenario: Newer remote edit wins

- **GIVEN** a workout exists in both snapshots with the same id, the remote copy having a later `updatedAt`
- **WHEN** `syncWithCloud` merges them
- **THEN** the merged result SHALL contain the remote copy

#### Scenario: Record present on only one side is kept

- **GIVEN** a template exists in the local snapshot and is absent (and not tombstoned) in the remote
- **WHEN** the snapshots are merged
- **THEN** the merged result SHALL retain that template

#### Scenario: Timestampless table merges whole-record

- **GIVEN** a `meta` key differs between snapshots
- **WHEN** the snapshots are merged
- **THEN** the value from the snapshot with the later manifest `exportedAt` SHALL win

### Requirement: Deletions propagate via tombstones

`syncWithCloud` SHALL honor tombstones so that a record deleted on one device is removed on others rather than being resurrected by a stale snapshot. A record SHALL be removed when a tombstone for its `[table+id]` has a `deletedAt` newer than the record's `updatedAt`/`createdAt`; a record re-created after deletion (its `updatedAt` newer than the tombstone `deletedAt`) SHALL be retained.

#### Scenario: Delete on device A removes the record on device B

- **GIVEN** device A deletes a workout (producing a tombstone with `deletedAt`) and device B still holds the workout with an older `updatedAt`
- **WHEN** the two snapshots are merged
- **THEN** the merged result SHALL omit the workout and retain the tombstone

#### Scenario: Re-creation newer than the tombstone wins

- **GIVEN** a tombstone with `deletedAt` and a record with the same id whose `updatedAt` is later than `deletedAt`
- **WHEN** the snapshots are merged
- **THEN** the merged result SHALL retain the record

### Requirement: Optimistic concurrency on push

Before pushing, `syncWithCloud` SHALL compare the remote `headRevisionId` against the revision observed at the start of the sync. If the remote revision changed, the use case SHALL re-pull, re-merge, and retry the push, up to a bounded number of attempts, rather than overwriting the newer remote snapshot.

#### Scenario: Stale revision triggers re-merge

- **GIVEN** the remote file's `headRevisionId` changed between the pull and the push
- **WHEN** `syncWithCloud` attempts to push
- **THEN** it SHALL re-pull and re-merge before pushing, not overwrite the remote with the stale merge

#### Scenario: Clean revision pushes directly

- **GIVEN** the remote `headRevisionId` is unchanged since the pull
- **WHEN** `syncWithCloud` pushes the merged snapshot
- **THEN** the push SHALL succeed and the recorded local revision SHALL update to the returned value

### Requirement: Hybrid sync triggers

The SPA SHALL pull and merge on app open after persistence boot, SHALL push automatically (debounced) after edits settle, and SHALL provide a manual "Sync now" control. Sync failures SHALL be non-fatal: the local database SHALL remain the source of truth and fully usable offline.

#### Scenario: Pull on app open

- **GIVEN** a connected account and an existing remote snapshot
- **WHEN** the app finishes booting persistence
- **THEN** it SHALL pull, merge, and apply the remote snapshot before normal use

#### Scenario: Debounced push after edits

- **WHEN** the user makes several edits in quick succession
- **THEN** the app SHALL push once after the edits settle, not once per edit

#### Scenario: Manual sync available

- **WHEN** the user clicks "Sync now" in Settings
- **THEN** the app SHALL run a full pull-merge-push cycle and report success or failure

#### Scenario: Offline degradation

- **GIVEN** the device is offline or the Drive call fails
- **WHEN** a sync trigger fires
- **THEN** the failure SHALL be surfaced non-fatally and the local database SHALL remain fully usable

### Requirement: Optional end-to-end encryption

The SPA SHALL provide a Settings toggle to encrypt the snapshot end-to-end with a user-supplied passphrase (PBKDF2 → AES-256-GCM via Web Crypto) before upload, defaulting to off. The manifest SHALL remain in cleartext so other devices can detect that the payload is encrypted and prompt for the passphrase. When AI provider keys are in scope and encryption is off, the SPA SHALL display a one-time warning that API keys will be uploaded in effectively cleartext form.

#### Scenario: Encrypted snapshot is unreadable without the passphrase

- **GIVEN** encryption is enabled with a passphrase
- **WHEN** the snapshot is uploaded
- **THEN** the file's `tables` and `tombstones` payload SHALL be ciphertext and SHALL only decrypt with the correct passphrase, while the manifest's `encrypted` flag stays readable

#### Scenario: Receiving device prompts for the passphrase

- **GIVEN** a remote snapshot whose manifest marks it encrypted
- **WHEN** another device pulls it
- **THEN** that device SHALL prompt for the passphrase before importing and SHALL NOT apply the snapshot until decryption succeeds

#### Scenario: One-time plaintext warning for AI keys

- **GIVEN** the database contains AI provider keys and encryption is off
- **WHEN** the user connects an account or first enables sync
- **THEN** the SPA SHALL show a one-time warning that API keys will be uploaded without end-to-end encryption

### Requirement: Account connection UI

The SPA SHALL provide Settings controls to connect and disconnect a Google account for sync and to display sync status (last synced time, in-progress, error). Disconnecting SHALL stop further sync triggers without deleting local data.

#### Scenario: Connect an account

- **WHEN** the user connects a Google account from Settings
- **THEN** the SPA SHALL run the OAuth consent flow and, on success, show the account as connected with sync enabled

#### Scenario: Disconnect stops sync but keeps data

- **GIVEN** a connected account
- **WHEN** the user disconnects
- **THEN** automatic sync triggers SHALL stop and the local database SHALL remain intact
