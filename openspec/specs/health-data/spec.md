> Synced: 2026-05-25 (add-health-metrics-to-krd)

# health-data Specification

## Purpose

Defines KRD v2.0 health-domain records — sleep, weight, HRV, daily wellness, body composition, and stress — as first-class `extensions.health.*` payloads with per-metric Zod sub-schemas, round-trip tolerances, and forward-compatible versioning. Establishes `@kaiord/fit` as the single bidirectional adapter for the six health KRD types in v2.0; other adapters declare workout-only partial coverage via the `adapter-contracts` capability.

## Requirements

### Requirement: Health Data Capability Scope

The `health-data` capability SHALL define the six health-metric KRD types (`sleep_record`, `weight_measurement`, `hrv_summary`, `daily_wellness`, `body_composition`, `stress_episode`), their tagged sub-schemas under `extensions.health.*`, and the contract that exactly one adapter implementation (`@kaiord/fit`) provides bidirectional read/write coverage for them in this proposal.

The capability is independent of `krd-format`: future health-data sources (e.g., WHOOP, Oura, Apple Health, Strava wellness) MAY claim conformance to `health-data` without modifying the canonical KRD format defined by `krd-format`.

#### Scenario: Capability covers exactly the six declared health metrics

- **WHEN** a contributor enumerates the metrics in scope for `health-data` v1
- **THEN** the enumeration SHALL be exactly `sleep_record`, `weight_measurement`, `hrv_summary`, `daily_wellness`, `body_composition`, `stress_episode` — neither more nor fewer

#### Scenario: Capability does not constrain non-Garmin sources

- **WHEN** a future adapter (e.g., `@kaiord/whoop`) targets the `health-data` capability
- **THEN** the adapter SHALL implement the same `extensions.health.*` sub-schemas without requiring modifications to `krd-format` or to the canonical KRD root shape

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

In this proposal, exactly one adapter package SHALL provide bidirectional read/write coverage for all six health KRD types: `@kaiord/fit`. Other format adapters (`@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`) SHALL be partial and SHALL reject health-type KRDs at write time per the `adapter-contracts` capability.

The `health-data` capability does NOT require any specific adapter; it requires that any conforming adapter implement the sub-schemas above without altering them. Future additive adapters may join later under their own changes.

#### Scenario: FIT adapter round-trips all six health types

- **WHEN** a fixture for each of the six health metrics is read by `@kaiord/fit` into KRD and re-written back to FIT
- **THEN** the resulting FIT binary preserves the metric within the documented per-metric tolerance, and the intermediate KRD validates against the corresponding sub-schema

#### Scenario: Workout-only adapters do not claim conformance

- **WHEN** a contributor inspects the adapter conformance table in `packages/core/docs/ADAPTER-COVERAGE.md`
- **THEN** `@kaiord/tcx`, `@kaiord/zwo`, and `@kaiord/garmin` SHALL be listed as `reject` for every health type, not as `read+write` or `read-only`

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
