## ADDED Requirements

### Requirement: Tanita CSV import persists weight and body composition

The SPA SHALL import weight and body-composition records from the
tanita-bridge `read-export-csv` relay, gated per data type by an enabled
`← tanita-bridge` import policy for the active profile. With neither route
enabled the SPA SHALL NOT read from the bridge.

#### Scenario: Both routes enabled imports both record types

- **GIVEN** enabled tanita-bridge import policies for weight and body-composition
- **AND** a CSV row carrying both weight and body-composition values
- **WHEN** the import runs
- **THEN** one weight record AND one body-composition record SHALL be persisted for that row

#### Scenario: Only the enabled data type is persisted

- **GIVEN** only the weight route is enabled
- **AND** a CSV row carrying both weight and body-composition values
- **WHEN** the import runs
- **THEN** only the weight record SHALL be persisted

### Requirement: Extraction is per health extension, not per KRD type

The import SHALL extract pending records from each health extension present
on a converted KRD, and SHALL NOT dispatch on the KRD `type` alone, because
one Tanita CSV row converts to a single KRD that can carry BOTH
`extensions.health.weight` and `extensions.health.bodyComposition`.

#### Scenario: Composition rows do not swallow weight

- **GIVEN** a KRD of type `body_composition` that also carries `health.weight`
- **WHEN** records are extracted with both routes enabled
- **THEN** two pending records SHALL result, one per data type

### Requirement: Imported Tanita records carry stable provenance

Each record SHALL be persisted through the shared inbound natural-key upsert
with `sourceBridgeId: "tanita-bridge"` and
`externalId = canonicalHash({ dataType, measuredAt })`.

#### Scenario: Re-running the import is idempotent

- **GIVEN** a previously imported Tanita measurement
- **WHEN** the same CSV is imported again
- **THEN** no duplicate row SHALL be created
