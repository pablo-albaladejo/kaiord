## MODIFIED Requirements

### Requirement: Health Data Capability Scope

The `health-data` capability SHALL define health-metric KRD types as tagged
sub-schemas under `extensions.health.*`, split into two tiers:

- **Bidirectional FIT core (six):** `sleep_record`, `weight_measurement`,
  `hrv_summary`, `daily_wellness`, `body_composition`, `stress_episode` — the
  types `@kaiord/fit` provides bidirectional read/write coverage for.
- **Read-only wearable-session metrics (three):** `strain_summary`,
  `vitals_summary`, `heart_rate_series` — sourced from authenticated wearable
  session APIs (e.g. WHOOP) that expose derived metrics with no FIT
  counterpart. These SHALL NOT require a bidirectional FIT adapter; a
  conforming source adapter provides read-only (source → KRD) coverage.

All nine SHALL appear in the `extensions.health.*` discriminated union and in
the `managedDataTypes` routing union (`strain`, `vitals`, `heart-rate-series`
join the existing tokens). Adding these three SHALL NOT modify `krd-format` or
the canonical KRD root shape.

#### Scenario: Capability covers exactly the nine declared health metrics

- **WHEN** a contributor enumerates the metrics in scope for `health-data`
- **THEN** the enumeration SHALL be exactly `sleep_record`, `weight_measurement`, `hrv_summary`, `daily_wellness`, `body_composition`, `stress_episode`, `strain_summary`, `vitals_summary`, `heart_rate_series` — neither more nor fewer

#### Scenario: Wearable-session metrics are read-only

- **WHEN** the adapter-coverage table is inspected for `strain_summary`, `vitals_summary`, and `heart_rate_series`
- **THEN** they SHALL be listed as read-only from their source adapters and SHALL NOT require `@kaiord/fit` bidirectional coverage

#### Scenario: Non-Garmin source targets the sub-schemas unchanged

- **WHEN** a future adapter (e.g. `@kaiord/whoop`) targets the `health-data` capability
- **THEN** the adapter SHALL implement the `extensions.health.*` sub-schemas without modifying `krd-format` or the canonical KRD root shape

### Requirement: Single Bidirectional Adapter For Health In v2.0

Exactly one adapter package SHALL provide bidirectional read/write coverage for
the six FIT-core health KRD types: `@kaiord/fit`. Other format adapters
(`@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`) SHALL be partial and SHALL
reject FIT-core health-type KRDs at write time per the `adapter-contracts`
capability.

The three read-only wearable-session metrics (`strain_summary`,
`vitals_summary`, `heart_rate_series`) SHALL NOT mandate any bidirectional
adapter: a source adapter (e.g. `@kaiord/whoop`) provides read-only coverage,
and format adapters are not required to write them.

#### Scenario: FIT adapter round-trips the six core health types

- **WHEN** a fixture for each of the six FIT-core health metrics is read by `@kaiord/fit` into KRD and re-written back to FIT
- **THEN** the resulting FIT binary preserves the metric within the documented per-metric tolerance, and the intermediate KRD validates against the corresponding sub-schema

#### Scenario: Read-only metrics need no FIT writer

- **WHEN** `@kaiord/whoop` produces a `strain_summary`, `vitals_summary`, or `heart_rate_series` KRD payload
- **THEN** it SHALL validate against the corresponding sub-schema, and no FIT writer SHALL be required for it to conform to `health-data`

## ADDED Requirements

### Requirement: Strain Summary Sub-Schema

`extensions.health.strain` SHALL conform to a Zod schema with `kind:
z.literal("strain")`, `version: z.string().regex(/^2\.\d+$/)`, `date:
z.string()` (ISO date, no time component), `strainScore: z.number().min(0).max(21)`
(the 0–21 cardiovascular-load scale), and the optional fields
`dayAverageHeartRate: z.number().int().min(0).max(300)`, `dayMaxHeartRate:
z.number().int().min(0).max(300)`, and `energyKilojoules:
z.number().nonnegative()`. It SHALL carry the optional provenance fields
`kaiordRecordId`, `sourceBridgeId`, `externalId`. The schema SHALL include a
refinement that `dayMaxHeartRate >= dayAverageHeartRate` when both are present.

#### Scenario: Strain payload validates

- **GIVEN** a strain payload `{ kind: "strain", version: "2.0", date: "2026-07-10", strainScore: 5.36, dayAverageHeartRate: 58, dayMaxHeartRate: 127, energyKilojoules: 7045 }`
- **WHEN** parsed via the strain sub-schema
- **THEN** validation succeeds

#### Scenario: Strain score out of range rejected

- **GIVEN** a strain payload with `strainScore: 25`
- **WHEN** parsed via the strain sub-schema
- **THEN** validation fails because `strainScore` exceeds 21

#### Scenario: Max heart rate below average rejected

- **GIVEN** a strain payload with `dayAverageHeartRate: 120` and `dayMaxHeartRate: 100`
- **WHEN** parsed via the strain sub-schema
- **THEN** validation fails because `dayMaxHeartRate >= dayAverageHeartRate` is violated

### Requirement: Vitals Summary Sub-Schema

`extensions.health.vitals` SHALL conform to a Zod schema with `kind:
z.literal("vitals")`, `version: z.string().regex(/^2\.\d+$/)`, `measuredAt:
z.string()` (ISO datetime), and at least one of the optional fields
`respiratoryRate: z.number().positive()` (breaths per minute), `spo2Percent:
z.number().min(0).max(100)`, `skinTempCelsius: z.number()`, and
`restingHeartRate: z.number().int().positive()` (bpm). It SHALL carry the
optional provenance fields `kaiordRecordId`, `sourceBridgeId`, `externalId`.
The schema SHALL include a refinement that at least one measurement field is
present.

#### Scenario: Single-field vitals validates

- **GIVEN** a vitals payload with only `spo2Percent: 96` beyond the required fields
- **WHEN** parsed via the vitals sub-schema
- **THEN** validation succeeds

#### Scenario: Full vitals payload validates

- **GIVEN** a vitals payload `{ kind: "vitals", version: "2.0", measuredAt: "2026-07-10T05:30:00Z", respiratoryRate: 17.1, spo2Percent: 96, skinTempCelsius: 35.4, restingHeartRate: 51 }`
- **WHEN** parsed via the vitals sub-schema
- **THEN** validation succeeds

#### Scenario: Empty vitals rejected

- **GIVEN** a vitals payload with no measurement field populated
- **WHEN** parsed via the vitals sub-schema
- **THEN** validation fails because at least one measurement field is required

### Requirement: Heart Rate Series Sub-Schema

`extensions.health.heartRateSeries` SHALL conform to a Zod schema with `kind:
z.literal("heartRateSeries")`, `version: z.string().regex(/^2\.\d+$/)`,
`startTime: z.string()` (ISO datetime of the first sample), `intervalSeconds:
z.number().int().positive()` (uniform spacing between samples), and `samples:
z.array(z.number().int().min(0).max(300).nullable())` where a `null` element
marks a gap with no reading. It SHALL carry the optional provenance fields
`kaiordRecordId`, `sourceBridgeId`, `externalId`.

#### Scenario: Uniform heart-rate series validates

- **GIVEN** a payload `{ kind: "heartRateSeries", version: "2.0", startTime: "2026-07-10T00:00:00Z", intervalSeconds: 600, samples: [75, 68, null, 88] }`
- **WHEN** parsed via the heart-rate-series sub-schema
- **THEN** validation succeeds and the `null` sample is preserved as a gap

#### Scenario: Non-positive interval rejected

- **GIVEN** a heart-rate-series payload with `intervalSeconds: 0`
- **WHEN** parsed via the heart-rate-series sub-schema
- **THEN** validation fails because `intervalSeconds` must be a positive integer

#### Scenario: Out-of-range sample rejected

- **GIVEN** a heart-rate-series payload whose `samples` contains `500`
- **WHEN** parsed via the heart-rate-series sub-schema
- **THEN** validation fails because a sample exceeds the 0–300 bpm bound

### Requirement: Wearable-Session Metric Conversion Tolerances

The `health-data` capability SHALL document source → KRD conversion tolerances
for the read-only wearable-session metrics, encoded as constants in
`packages/core/src/domain/schemas/health/tolerances.ts` alongside the FIT
tolerances:

- Strain score: ±0.1 (the underlying value is a real number on 0–21)
- Vitals respiratory rate: ±0.1 breaths per minute
- Vitals SpO₂ and resting heart rate: exact (±0)
- Heart-rate-series sample: ±1 bpm

Because these metrics are read-only (no FIT round-trip), the tolerances apply
to the source → KRD conversion, asserted by the source adapter's converter
tests rather than by a FIT round-trip test.

#### Scenario: Conversion tolerance constants are centralized

- **WHEN** a converter test for a wearable-session metric asserts a converted value
- **THEN** it SHALL import the tolerance constant from `tolerances.ts` rather than hardcoding the value
