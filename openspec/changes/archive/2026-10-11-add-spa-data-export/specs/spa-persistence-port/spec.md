## MODIFIED Requirements

### Requirement: Default local profile

When the database holds no profile, the SPA SHALL create exactly one profile with a random UUID, named in the browser's language, carrying `origin: "auto"`, and SHALL make it the active profile. The count, the put and the active-id write SHALL share one transaction, so two tabs booting at once yield one profile. The creation SHALL run from the database's `ready` hook on every open and hold every other queued database operation until it settles. The name SHALL be available without a network fetch, and an open that finds a profile SHALL only count. Deleting the last profile SHALL leave a fresh default profile in the same transaction, so a profile always exists. A failure SHALL leave the app in its no-profile state rather than break boot.

The profile SHALL become a real profile (`origin: "local"`) when it is claimed: on a user edit of the profile or its zones, or on the first cloud sync against a remote with no real profile. A profile without `origin` is a real profile. Dismissing the first-run notice SHALL NOT claim it, and neither SHALL a backup export.

Every profile-scoped surface SHALL work with the default profile, and any control that still cannot act without a profile SHALL say why instead of being disabled silently.

#### Scenario: A clean browser gets one active default profile

- **GIVEN** a database with no profile
- **WHEN** the SPA opens it
- **THEN** exactly one profile with `origin: "auto"` SHALL exist and be active

#### Scenario: Writes queued during open run after the creation

- **GIVEN** a database with no profile
- **WHEN** profiles are cleared and another profile is written while the database is still opening
- **THEN** only that profile SHALL remain, because the creation settled before those writes ran

#### Scenario: Dismissing the notice does not claim the profile

- **GIVEN** the active profile has `origin: "auto"`
- **WHEN** the user dismisses the first-run notice
- **THEN** the dismissal SHALL be stored on the device only, never as a synced preference, and the profile SHALL keep `origin: "auto"`

#### Scenario: Editing claims the profile

- **WHEN** the user edits the default profile or its zones
- **THEN** the profile SHALL be stored with `origin: "local"`

## ADDED Requirements

### Requirement: Backup export

Settings → Privacy SHALL offer an "export my data" control that downloads one plain-JSON file `{format: "kaiord-backup", version: 1, manifest, tables, tombstones, nutrition}` and says that the file is not encrypted and holds no API key. The export SHALL reuse the snapshot export and a backup table policy that classifies every table of the schema:

- the user's records SHALL be included as the snapshot carries them;
- `syncState`, `coachingSyncState`, `connections`, `bridges` and the `tombstones` table SHALL be excluded; tombstones SHALL travel in the file's `tombstones` field;
- `aiProviders` SHALL be included without its `apiKey` field;
- `intakeEntries`, `intakePresets` and `energyTargets` SHALL be read for every profile through their repositories into `nutrition`;
- a table the policy does not classify SHALL be left out, and a guard over the live schema SHALL fail until it is classified.

The snapshot and the nutrition reads SHALL share one read transaction. The export SHALL write nothing locally: an unclaimed default profile SHALL be written to the file with `origin: "local"` and SHALL stay `origin: "auto"` in the database, so the file never carries `origin: "auto"` and the export never makes the local profile syncable.

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
