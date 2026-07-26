## ADDED Requirements

### Requirement: Supported-route filtering for shared capability tokens

The SPA SHALL restrict a bridge's route eligibility and Data Hub cells to a
declared supported-route set whenever the bridge's announced capability
token spans more managed data types than its SPA importer/exporter actually
persists. Bridges without a declaration SHALL remain unrestricted. The
filter SHALL apply to both `eligibleBridgeIds` and the Data Hub cell-state
derivation.

#### Scenario: Phantom import cells are hidden

- **GIVEN** tanita-bridge announces `read:body`
- **AND** its declared supported import types are weight and body-composition
- **WHEN** the Data Hub matrix is built
- **THEN** tanita cells for hrv, daily-wellness and stress SHALL render as not applicable

#### Scenario: Undeclared bridges are unaffected

- **GIVEN** a bridge with no supported-route declaration
- **WHEN** eligibility is derived
- **THEN** its capability tokens alone SHALL determine eligibility

### Requirement: Profile-snapshot push targets snapshot-capable bridges only

The profile-snapshot push (and clear) SHALL be sent only to bridges that
vendor the snapshot handler (per `bridge-core`'s vendoring set). The SPA
allowlist SHALL be mechanically checked against
`scripts/sync-bridge-core.mjs` `SNAPSHOT_BRIDGES` so the two cannot drift.

#### Scenario: Non-snapshot bridges receive no push

- **GIVEN** whoop-bridge, tanita-bridge and trainingpeaks-bridge are discovered
- **WHEN** the active profile changes
- **THEN** no `profile-snapshot` message SHALL be enqueued for those bridges

#### Scenario: Allowlist drift fails the suite

- **GIVEN** a bridge is added to `SNAPSHOT_BRIDGES` in `sync-bridge-core.mjs`
- **WHEN** the SPA allowlist is not updated to match
- **THEN** the parity test SHALL fail
