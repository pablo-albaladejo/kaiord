## MODIFIED Requirements

### Requirement: Top-Level Structure

A KRD document SHALL contain:

- `version` (string, required): Schema version. SHALL be `"2.0"` for documents that may carry the six health `type` variants. Documents carrying the three legacy `type` values MAY continue to declare `"1.0"` for backwards compatibility with v1.x producers; consumers SHALL accept both.
- `type` (string, required): One of `"structured_workout"`, `"recorded_activity"`, `"course"`, `"sleep_record"`, `"weight_measurement"`, `"hrv_summary"`, `"daily_wellness"`, `"body_composition"`, `"stress_episode"`. The first three are the legacy workout/activity types; the latter six are the health types introduced in v2.0.
- `metadata` (object, required): File-level metadata. The `metadata.sport` field is conditionally optional — see the modified Schema Validation requirement.
- `sessions` (array, optional): Training sessions. Present for workout/activity/course types; SHALL be absent or empty for the six health types.
- `laps` (array, optional): Lap/interval data. Present for workout/activity/course types; SHALL be absent or empty for the six health types.
- `records` (array, optional): Time-series data points. Present for recorded activities; SHALL be absent or empty for the six health types.
- `events` (array, optional): Workout events. Present for workout/activity types; SHALL be absent or empty for the six health types.
- `extensions` (object, optional): Tagged discriminated namespace store. See the modified Extension Namespaces requirement.

#### Scenario: Missing required top-level field rejected

- **GIVEN** a KRD candidate without the `metadata` object
- **WHEN** parsed by `krdSchema`
- **THEN** validation fails with a Zod error naming the missing field

#### Scenario: Health type accepts empty session arrays

- **GIVEN** a KRD with `type: "sleep_record"`, `metadata` without `sport`, `extensions.health.sleep` populated, and no `sessions`/`laps`/`records`/`events`
- **WHEN** parsed by `krdSchema`
- **THEN** validation succeeds — the health type does not require workout-shaped arrays

#### Scenario: Workout type still requires sport

- **GIVEN** a KRD with `type: "structured_workout"` and `metadata` without `sport`
- **WHEN** parsed by `krdSchema`
- **THEN** validation fails because the workout type still requires `metadata.sport` per the modified Schema Validation requirement

### Requirement: Schema Validation

All KRD instances MUST validate against the Zod schemas in `packages/core/src/domain/schemas/`. Invalid KRD data MUST be rejected before reaching adapters.

`WorkoutStep` MUST satisfy two cross-field invariants enforced via Zod `.refine()` on `workoutStepSchema`:

- `durationType` MUST equal `duration.type`
- `targetType` MUST equal `target.type`

`KRDMetadata.sport` MUST satisfy a conditional invariant enforced via `superRefine` on `krdSchema`:

- When `type ∈ { structured_workout, recorded_activity, course }`, `metadata.sport` MUST be a non-empty string. This preserves the v1.x invariant byte-equivalently for legacy types.
- When `type ∈ { sleep_record, weight_measurement, hrv_summary, daily_wellness, body_composition, stress_episode }`, `metadata.sport` MUST be absent or an empty string. Health records do not have an associated sport.

Validation fails at parse time if any invariant is violated.

#### Scenario: Invalid KRD rejected

- **GIVEN** a JSON object missing the required `version` field
- **WHEN** parsed as KRD
- **THEN** Zod validation throws a schema error before any adapter processes it

#### Scenario: WorkoutStep cross-field invariant rejected

- **GIVEN** a WorkoutStep where `durationType` is `"time"` but `duration.type` is `"distance"`
- **WHEN** parsed via `workoutStepSchema`
- **THEN** Zod throws a validation error: "durationType must match duration.type"

#### Scenario: Workout type without sport rejected

- **GIVEN** a KRD with `type: "recorded_activity"` and `metadata.sport` absent
- **WHEN** parsed via `krdSchema`
- **THEN** Zod throws a validation error citing the conditional sport invariant

#### Scenario: Health type with sport rejected

- **GIVEN** a KRD with `type: "sleep_record"` and `metadata.sport: "running"`
- **WHEN** parsed via `krdSchema`
- **THEN** Zod throws a validation error because health types must omit `sport`

### Requirement: Extension Namespaces

The `extensions` object SHALL be tagged via Zod discriminated members covering the reserved namespace keys, and SHALL preserve any additional (adapter-defined or unknown) namespaces during round-trip conversions when the target format supports them:

- `extensions.structured_workout` (Workout): Full Workout object for structured workout KRDs, set by `createWorkoutKRD()`
- `extensions.fit` (object): Preserves FIT-specific data not mappable to KRD fields, containing:
  - `developerFields` (array): Developer-defined fields from FIT SDK
  - `unknownMessages` (array): Unrecognized FIT message types
- `extensions.course` (object): Course metadata for course-type KRDs
- `extensions.course_points` (array of KRDCoursePoint): Course waypoints, each containing `index`, `latitude`, `longitude`, `distance`, `type`, `name`, `favorite`, and optional `timestamp`
- `extensions.health.sleep` (SleepRecord): Sleep session payload — see the `health-data` capability for the sub-schema
- `extensions.health.weight` (WeightMeasurement): Scalar weight payload — see the `health-data` capability
- `extensions.health.hrv` (HrvSummary): Heart rate variability summary — see the `health-data` capability
- `extensions.health.daily` (DailyWellness): Steps, calories, intensity minutes — see the `health-data` capability
- `extensions.health.bodyComposition` (BodyComposition): Body fat / lean mass / water — see the `health-data` capability
- `extensions.health.stress` (StressEpisode): Stress level over a time window — see the `health-data` capability

Adapters MUST NOT drop unknown extension namespaces silently; they MUST either round-trip them unchanged or fail the conversion with a descriptive error.

#### Scenario: Extension preservation

- **GIVEN** a FIT file with Garmin-specific extension fields
- **WHEN** converted to KRD
- **THEN** extension data is preserved in the `extensions` object

#### Scenario: Structured workout in extensions

- **GIVEN** a workout created via `createWorkoutKRD(workout)`
- **WHEN** the KRD document is inspected
- **THEN** `extensions.structured_workout` contains the full Workout object

#### Scenario: Sleep record in health namespace

- **GIVEN** a sleep-type KRD produced by reading a Garmin FIT sleep file
- **WHEN** the KRD document is inspected
- **THEN** `extensions.health.sleep` contains a `SleepRecord` payload validating against the `health-data` sleep sub-schema, and `extensions.structured_workout` is absent

#### Scenario: Unknown namespace round-trips

- **GIVEN** a KRD whose `extensions` carries an unknown `extensions.thirdPartyFoo: { x: 1 }` namespace produced by some external tool
- **WHEN** the KRD is read and re-written by a format adapter that supports preserving extensions
- **THEN** the re-emitted KRD still contains `extensions.thirdPartyFoo: { x: 1 }` byte-equivalently
