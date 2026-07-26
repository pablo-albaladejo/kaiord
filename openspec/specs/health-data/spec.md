> Synced: 2026-07-22 (rewrite-whoop-session-bridge)

# health-data Specification

## Purpose

Defines the nine KRD v2.0 health-domain records as first-class `extensions.health.*` payloads with per-metric Zod sub-schemas, round-trip tolerances, and forward-compatible versioning: the six bidirectional FIT-core types (sleep, weight, HRV, daily wellness, body composition, stress) plus three read-only wearable-session metrics (strain, vitals, heart-rate series) sourced from authenticated wearable APIs with no FIT counterpart. `@kaiord/fit` is the single bidirectional adapter for the six FIT-core types in v2.0; the three read-only metrics need only source → KRD coverage; other adapters declare workout-only partial coverage via the `adapter-contracts` capability.

## Requirements

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

### Requirement: Sleep Record Sub-Schema

`extensions.health.sleep` SHALL conform to a Zod schema with the discriminator `kind: z.literal("sleep")` and the following fields:

- `version: z.string().regex(/^2\.\d+$/)` — additive evolution marker within the v2.x line; the producer SHALL emit `"2.0"` initially; future v2.x producers MAY emit `"2.1"`, `"2.2"`, etc. without bumping the canonical KRD `version`
- `startTime: z.string()` — ISO datetime of sleep onset
- `endTime: z.string()` — ISO datetime of wake
- `totalDurationSeconds: z.number().int().nonnegative()` — total in-bed duration
- `stages: z.array(SleepStage)` — non-overlapping time-ordered stages where each `SleepStage` is `{ stage: "awake" | "light" | "deep" | "rem", startTime: string, durationSeconds: number }`
- `score: z.number().int().min(0).max(100).optional()` — Garmin sleep score
- `restingHeartRate: z.number().int().positive().optional()` — bpm

The schema SHALL include a `superRefine` that the sum of `stages[*].durationSeconds` is within ±60 seconds of `totalDurationSeconds`.

#### Scenario: Stages summing to total duration validates

- **GIVEN** a sleep record with `totalDurationSeconds: 28800` and four stages summing to 28820 seconds
- **WHEN** parsed via the sleep sub-schema
- **THEN** validation succeeds (within the ±60 s tolerance)

#### Scenario: Stages diverging from total duration rejected

- **GIVEN** a sleep record with `totalDurationSeconds: 28800` and stages summing to 30000 seconds
- **WHEN** parsed via the sleep sub-schema
- **THEN** validation fails with a Zod error citing the stage-total mismatch

#### Scenario: Missing required field rejected

- **GIVEN** a sleep record payload without `startTime`
- **WHEN** parsed via the sleep sub-schema
- **THEN** validation fails with a Zod error naming the missing field

### Requirement: Weight Measurement Sub-Schema

`extensions.health.weight` SHALL conform to a Zod schema with `kind: z.literal("weight")`, `version: z.string().regex(/^2\.\d+$/)`, `measuredAt: z.string()` (ISO datetime), and `weightKilograms: z.number().positive()`. Body composition (fat mass, lean mass, water, BMI) lives in the separate `body_composition` payload, not in `weight_measurement`, so weighing devices that only report scalar weight produce a valid `weight_measurement` without partial fields.

#### Scenario: Scalar weight validates

- **GIVEN** a weight payload `{ kind: "weight", version: "2.0", measuredAt: "2026-05-22T07:15:00Z", weightKilograms: 72.4 }`
- **WHEN** parsed via the weight sub-schema
- **THEN** validation succeeds

#### Scenario: Non-positive weight rejected

- **GIVEN** a weight payload with `weightKilograms: 0`
- **WHEN** parsed via the weight sub-schema
- **THEN** validation fails with a Zod error citing positivity

### Requirement: HRV Summary Sub-Schema

`extensions.health.hrv` SHALL conform to a Zod schema with `kind: z.literal("hrv")`, `version: z.string().regex(/^2\.\d+$/)`, `measuredAt: z.string()` (ISO datetime), `rMSSD: z.number().positive()` (milliseconds), `measurementWindow: z.enum(["overnight", "spot"])`, and an optional `score: z.number().int().min(0).max(100)`.

#### Scenario: Overnight HRV summary validates

- **GIVEN** an HRV payload `{ kind: "hrv", version: "2.0", measuredAt: "2026-05-22T06:00:00Z", rMSSD: 45.2, measurementWindow: "overnight", score: 72 }`
- **WHEN** parsed via the HRV sub-schema
- **THEN** validation succeeds

#### Scenario: Unknown measurement window rejected

- **GIVEN** an HRV payload with `measurementWindow: "morning"`
- **WHEN** parsed via the HRV sub-schema
- **THEN** validation fails because `morning` is not in the enum

### Requirement: Daily Wellness Sub-Schema

`extensions.health.daily` SHALL conform to a Zod schema with `kind: z.literal("daily")`, `version: z.string().regex(/^2\.\d+$/)`, `date: z.string()` (ISO date, no time component), `steps: z.number().int().nonnegative()`, `activeCalories: z.number().int().nonnegative()`, `restingCalories: z.number().int().nonnegative()`, `intensityMinutes: z.object({ moderate: z.number().int().nonnegative(), vigorous: z.number().int().nonnegative() })`, and `floorsClimbed: z.number().int().nonnegative().optional()`.

The Garmin FIT `file_type` values `monitoringA (15)`, `monitoringDaily (28)`, and `monitoringB (32)` SHALL all map to this single `daily` sub-schema; if a future consumer needs to discriminate the source, a sub-discriminator MAY be added in a later v2.x minor version without breaking change.

#### Scenario: Daily wellness payload validates

- **GIVEN** a daily payload with `steps: 9432`, `activeCalories: 412`, `restingCalories: 1684`, `intensityMinutes: { moderate: 23, vigorous: 8 }`, `floorsClimbed: 12`
- **WHEN** parsed via the daily sub-schema
- **THEN** validation succeeds

#### Scenario: Negative step count rejected

- **GIVEN** a daily payload with `steps: -1`
- **WHEN** parsed via the daily sub-schema
- **THEN** validation fails

### Requirement: Body Composition Sub-Schema

`extensions.health.bodyComposition` SHALL conform to a Zod schema with `kind: z.literal("bodyComposition")`, `version: z.string().regex(/^2\.\d+$/)`, `measuredAt: z.string()` (ISO datetime), and at least one of the optional fields `bodyFatPercent: z.number().min(0).max(100)`, `leanMassKilograms: z.number().positive()`, `boneMassKilograms: z.number().positive()`, `bodyWaterPercent: z.number().min(0).max(100)`, `bmi: z.number().positive()`. The schema SHALL include a refinement that at least one of those optional fields is present.

#### Scenario: Single-field body composition validates

- **GIVEN** a body composition payload with only `bodyFatPercent: 18.4`
- **WHEN** parsed via the body composition sub-schema
- **THEN** validation succeeds

#### Scenario: Empty body composition rejected

- **GIVEN** a body composition payload with no measurement fields populated
- **WHEN** parsed via the body composition sub-schema
- **THEN** validation fails because at least one measurement field is required

### Requirement: Stress Episode Sub-Schema

`extensions.health.stress` SHALL conform to a Zod schema with `kind: z.literal("stress")`, `version: z.string().regex(/^2\.\d+$/)`, `startTime: z.string()` (ISO datetime), `endTime: z.string()` (ISO datetime), `averageLevel: z.number().int().min(0).max(100)`, and `peakLevel: z.number().int().min(0).max(100)`. The schema SHALL include a refinement that `endTime >= startTime` and `peakLevel >= averageLevel`.

#### Scenario: Valid stress episode validates

- **GIVEN** a stress payload spanning 14:00 to 14:45 with `averageLevel: 58` and `peakLevel: 82`
- **WHEN** parsed via the stress sub-schema
- **THEN** validation succeeds

#### Scenario: Peak below average rejected

- **GIVEN** a stress payload with `averageLevel: 70` and `peakLevel: 60`
- **WHEN** parsed via the stress sub-schema
- **THEN** validation fails because `peakLevel >= averageLevel` is violated

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

### Requirement: Per-Metric Round-Trip Tolerances

The `health-data` capability SHALL document the round-trip tolerance for each metric explicitly. Tolerances apply to FIT ↔ KRD ↔ FIT round-trip:

- Sleep stage durations: ±60 seconds per stage, ±60 seconds total
- Weight: ±0.1 kilograms
- HRV rMSSD: ±1 millisecond
- Daily wellness step count: exact (±0)
- Daily wellness active calories: ±1 kcal
- Body composition body-fat percent: ±0.1 percentage points
- Stress level (average and peak): exact (±0, since the underlying value is an integer 0–100)

Tolerances SHALL be encoded as constants in `packages/core/src/domain/schemas/health/tolerances.ts` so test suites import them centrally rather than hardcoding values per fixture.

#### Scenario: Round-trip within tolerance accepted

- **GIVEN** a sleep fixture that round-trips with a 30-second drift in `totalDurationSeconds`
- **WHEN** the round-trip test compares pre- and post-round-trip values
- **THEN** the test SHALL pass because the drift is below the ±60 s tolerance

#### Scenario: Round-trip outside tolerance fails

- **GIVEN** a weight fixture that round-trips with a 0.5 kg drift
- **WHEN** the round-trip test compares pre- and post-round-trip values
- **THEN** the test SHALL fail because the drift exceeds the ±0.1 kg tolerance

### Requirement: Forward-Compatible Sub-Schema Versioning

Every `extensions.health.<metric>` payload SHALL carry a `version` field constrained by `z.string().regex(/^2\.\d+$/)` so additive evolution within the v2.x line (e.g., adding optional fields in a v2.1 of one sub-schema) is accepted without bumping the canonical KRD version.

Sub-schema readers SHALL accept any v2.x version string and SHALL ignore unknown top-level fields not declared in their own version's schema (Zod's default strip behaviour suffices), so a v2.1 producer can emit additional optional fields and a v2.0 consumer silently drops them. A payload whose `version` does not match the v2.x major SHALL be rejected.

#### Scenario: Baseline v2.0 payload accepted

- **GIVEN** a sleep payload with `version: "2.0"` and the v2.0 mandatory fields
- **WHEN** parsed by a v2.0 consumer
- **THEN** validation succeeds

#### Scenario: v2.0 consumer accepts v2.1 with forward-additive field

- **GIVEN** a sleep payload with `version: "2.1"` that adds an optional `sleepEfficiency` field unknown to the v2.0 schema
- **WHEN** parsed by a v2.0 consumer
- **THEN** validation succeeds (v2.1 matches the `/^2\.\d+$/` regex), and the unknown `sleepEfficiency` field is stripped from the parsed result without raising

#### Scenario: Wrong major version rejected

- **GIVEN** a sleep payload with `version: "1.0"`
- **WHEN** parsed by a v2.0 consumer
- **THEN** validation fails because `1.0` does not match `/^2\.\d+$/`

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
