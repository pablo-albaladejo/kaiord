## MODIFIED Requirements

### Requirement: Default local profile

When the database holds no profile, the SPA SHALL create exactly one profile with a random UUID, named in the browser's language, carrying `origin: "auto"`, and SHALL make it the active profile. The count, the put and the active-id write SHALL share one transaction, so two tabs booting at once yield one profile. The creation SHALL run from the database's `ready` hook on every open and hold every other queued database operation until it settles. The name SHALL be available without a network fetch, and an open that finds a profile SHALL only count. Deleting the last profile SHALL leave a fresh default profile in the same transaction, so a profile always exists. A failure SHALL leave the app in its no-profile state rather than break boot.

The profile SHALL become a real profile (`origin: "local"`) when it is claimed: on a user edit of the profile or its zones, on the first cloud sync against a remote with no real profile, or on importing a backup that carries it as a real profile (the device's own export). A profile without `origin` is a real profile. Dismissing the first-run notice SHALL NOT claim it, and neither SHALL a backup export.

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

#### Scenario: Importing its own backup claims the profile

- **GIVEN** the active profile has `origin: "auto"` and the user exported a backup from this browser
- **WHEN** the user imports that backup back into this browser
- **THEN** the profile SHALL be kept, with `origin: "local"`, and so SHALL its rows

## ADDED Requirements

### Requirement: Backup import

Settings → Privacy SHALL offer an "import backup" control that reads a `kaiord-backup` file and merges it into this browser, never replacing its data. The file SHALL be validated first: a file of another format or with malformed rows SHALL be rejected as not a Kaiord backup, and a backup `version` this app does not know, or a `manifest.schemaVersion` newer than the local database, SHALL be rejected with a message asking to update the app. A rejected file SHALL write nothing.

The import SHALL export the local snapshot, merge it last-write-wins with the file (`mergeSnapshots`), reconcile the unclaimed default profile against the file's profiles with the same `reconcileAutoProfile` as cloud sync, and import the result, all in one read-write transaction together with the device-local rewrite, so a failure rolls everything back. The file SHALL contribute only the tables the backup table policy includes, rewritten by it: `syncState`, `coachingSyncState`, `connections`, `bridges` and any `apiKey` in a file SHALL be ignored. `meta` SHALL stay the device's own, except that the file's `activeProfileId` SHALL be adopted when the device has no valid active profile.

- Tombstones on either side SHALL suppress older rows, so a record deleted after the backup SHALL stay deleted.
- With one profile in the file, the default profile's rows SHALL be re-keyed onto it and the device SHALL end with that one profile active; with several, the import SHALL write nothing and ask which profile to join, then re-run with the choice.
- Each AI provider SHALL keep the encrypted key this device holds for it; a provider only the file has SHALL be stored without a key, marked `apiKeyMissing`, SHALL not become the default when the device has one, SHALL be listed in the provider settings as missing its key, and SHALL never be offered to an AI feature.
- The file's nutrition SHALL be merged into `intakeEntries`, `intakePresets` and `energyTargets` by key, the device's row winning a tie, and only for profiles present after the import. Nutrition has no tombstones yet, so an entry deleted after the backup comes back; the summary SHALL warn about it.

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
