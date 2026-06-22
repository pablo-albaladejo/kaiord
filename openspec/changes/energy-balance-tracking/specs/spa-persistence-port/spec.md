## ADDED Requirements

### Requirement: Energy and intake stores

The persistence layer SHALL provide device-local stores for `intakeEntries`
(indexed by `[profileId+date]`), `intakePresets` (indexed by `profileId`), and
`energyTargets` (per profile), introduced via a Dexie **v25** upgrade following the
existing versioned-schema migration pattern with a co-located migration test. These
stores SHALL be excluded from the cloud snapshot.

#### Scenario: New stores available after v25 upgrade

- **GIVEN** a database upgraded to Dexie v25
- **WHEN** the app reads the schema
- **THEN** `intakeEntries`, `intakePresets`, and `energyTargets` stores exist with their declared indexes

#### Scenario: Energy and intake stores excluded from snapshot

- **GIVEN** populated `intakeEntries`, `intakePresets`, and `energyTargets` stores
- **WHEN** a cloud snapshot is produced
- **THEN** none of these stores' rows appear in the snapshot
