## ADDED Requirements

### Requirement: Default local profile

When the database holds no profile, the SPA SHALL create exactly one profile with a random UUID, named in the browser's language, carrying `origin: "auto"`, and SHALL make it the active profile. The count, the put and the active-id write SHALL share one transaction, so two tabs booting at once yield one profile. The creation SHALL run from the database's `ready` hook and hold every other queued database operation until it settles. A failure SHALL leave the app in its no-profile state rather than break boot.

The profile SHALL become a real profile (`origin: "local"`) when it is claimed: on a user edit of the profile or its zones, on the first cloud sync against a remote with no real profile, or before a backup export. A profile without `origin` is a real profile. Dismissing the first-run notice SHALL NOT claim it.

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
- **THEN** the dismissal SHALL be stored as a preference and the profile SHALL keep `origin: "auto"`

#### Scenario: Editing claims the profile

- **WHEN** the user edits the default profile or its zones
- **THEN** the profile SHALL be stored with `origin: "local"`

### Requirement: Cloud sync reconciles the unclaimed default profile

`syncWithCloud` SHALL run, on every attempt including a retry after a moved revision, `mergeSnapshots`, then `reconcileAutoProfile(merged, remote, perProfileTables)`, then the import, then `cloud.push`. The reconcile SHALL take its target from the remote snapshot:

- with exactly one real remote profile, every row of the auto profile SHALL be re-keyed onto it, rewriting `profileId` and every composite id that embeds the profile id, with a collision rule per table; the auto profile SHALL be removed without a tombstone and its integration cursors dropped; `meta.activeProfileId` SHALL point at the target;
- with several real remote profiles, the sync SHALL stop before importing or pushing and SHALL ask the user to choose; the choice SHALL be stored locally and the sync re-run;
- with none, the auto profile SHALL be claimed and pushed.

Device-local tables that never travel in the snapshot (`connections`, `intakeEntries`, `intakePresets`, `energyTargets`) SHALL be re-keyed in the same transaction as the import. `cloud.push` SHALL never receive a profile with `origin: "auto"`.

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

#### Scenario: The re-key and the import are atomic

- **WHEN** a step after the import fails inside the sync transaction
- **THEN** neither the imported rows nor the device-local re-key SHALL be committed
