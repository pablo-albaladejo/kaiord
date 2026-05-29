## MODIFIED Requirements

### Requirement: Editor tracks key product events

Three new integration lifecycle events and one gauge are added to the set of product events the SPA SHALL emit. All new events use the existing `analytics.event(name, props)` port. All payload fields MUST comply with the R-PIIInterpolation rule — no biometric values, no user-entered metric values, no record content. Only structural metadata (data type, bridge id, direction, outcome, duration) is permitted.

#### New event: `integration_policy.toggled`

Emitted when a user adds, removes, enables, disables, or changes the mode of an `IntegrationPolicy` row via the Data Flows section (plan T-28).

Payload shape:

```ts
{
  profileId: string;        // active profile id
  dataType: ManagedDataType;
  direction: 'import' | 'export';
  bridgeId: string;         // BridgeId of the affected row
  action: 'added' | 'removed' | 'enabled' | 'disabled' | 'mode_changed';
  newMode?: 'manual' | 'auto';  // only when action === 'mode_changed'
}
```

#### New event: `import_completed`

Emitted when an `upsert-imported-record` use case call resolves, regardless of whether the record was new or a deduped no-op (plan T-28).

Payload shape:

```ts
{
  profileId: string;
  dataType: ManagedDataType;
  sourceBridgeId: string;
  durationMs: number;
  outcome: "inserted" | "deduplicated";
}
```

#### New event: `export_completed`

Emitted when a `record-export` use case call resolves (plan T-28).

Payload shape:

```ts
{
  profileId: string;
  dataType: ManagedDataType;
  destinationBridgeId: string;
  durationMs: number;
  outcome: "posted" | "patched" | "skipped" | "error";
}
```

#### New gauge: `kaiord.export.ledger.size`

Emitted on every export operation via `analytics.event('kaiord.export.ledger.size', { dataType, count })` where `count` is the current number of `exportLedger` rows for that `dataType`. Alert threshold: ledger size > 10× current source-row count in the same `dataType` indicates leakage (plan M-2.4).

Payload shape:

```ts
{
  dataType: ManagedDataType;
  count: number;
}
```

#### Scenario: integration_policy.toggled fires on add

- **WHEN** the user adds a source row for `(dataType: 'weight', bridgeId: 'garmin-bridge', direction: 'import')` in the Data Flows section
- **THEN** `analytics.event('integration_policy.toggled', { profileId, dataType: 'weight', direction: 'import', bridgeId: 'garmin-bridge', action: 'added' })` is called
- **AND** no biometric payload value appears in any field of the event properties

#### Scenario: integration_policy.toggled fires on disable

- **WHEN** the user disables an existing `IntegrationPolicy` row via the enabled checkbox in the Data Flows section
- **THEN** `analytics.event('integration_policy.toggled', { ..., action: 'disabled' })` is called

#### Scenario: import_completed fires with deduplicated outcome on second import

- **WHEN** the same `(sourceBridgeId, externalId)` record is imported a second time
- **THEN** `analytics.event('import_completed', { ..., outcome: 'deduplicated' })` is called
- **AND** the `durationMs` field is a non-negative number

#### Scenario: export_completed fires with skipped outcome on unchanged re-export

- **WHEN** a record is exported and re-exported without edits (content hash unchanged)
- **THEN** `analytics.event('export_completed', { ..., outcome: 'skipped' })` is called

#### Scenario: export_completed fires with posted outcome on first export

- **WHEN** a record is exported for the first time (no ledger entry exists)
- **THEN** `analytics.event('export_completed', { ..., outcome: 'posted', durationMs: <non-negative> })` is called

#### Scenario: kaiord.export.ledger.size gauge emitted on export

- **WHEN** a `record-export` use case call completes for `dataType: 'workout'`
- **THEN** `analytics.event('kaiord.export.ledger.size', { dataType: 'workout', count: <current ledger row count for 'workout'> })` is called
- **AND** the `count` field is a non-negative integer

#### Scenario: No PII in any integration event payload

- **WHEN** any of the four new events is emitted
- **THEN** no field in the event properties SHALL contain a biometric value, a user-entered metric value, or any content from the health/workout records being imported or exported
- **AND** the existing R-PIIInterpolation static guard (enforced by `scripts/check-no-pii-leakage.mjs`) SHALL remain green for every call site emitting these events
