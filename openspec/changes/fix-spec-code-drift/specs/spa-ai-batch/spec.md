## ADDED Requirements

### Requirement: UsageRecord stores input and output tokens separately

To satisfy `Monthly AI usage tracking`'s "one row per `(yearMonth, provider)` ... showing provider, inputTokens, outputTokens, and costUsd", the `UsageRecord` Dexie schema SHALL expose `inputTokens` and `outputTokens` as distinct numeric fields. `totalTokens` SHALL remain in the schema as a derived convenience for legacy consumers and SHALL always equal `inputTokens + outputTokens` for rows written by the current application version.

#### Scenario: New UsageRecord writes expose split tokens

- **WHEN** a batch run persists a `UsageRecord`
- **THEN** the stored row SHALL contain `inputTokens`, `outputTokens`, `totalTokens`, and `costUsd` as numeric fields
- **AND** `totalTokens` SHALL equal `inputTokens + outputTokens`

#### Scenario: Legacy rows are migrated on Dexie version bump

- **GIVEN** a `UsageRecord` row written before the migration with only `totalTokens` set
- **WHEN** the Dexie database upgrades to the new schema version
- **THEN** the row SHALL have `inputTokens` set to its previous `totalTokens` value
- **AND** `outputTokens` SHALL be set to `0`
- **AND** the row SHALL be flagged as legacy so the usage panel renderer can show `—` for `outputTokens` instead of a misleading zero
