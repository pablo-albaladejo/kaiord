> Synced: 2026-04-17

# KRD Format

## Purpose

KRD (Kaiord Representation Definition) — the canonical intermediate format through which every conversion (FIT ↔ TCX ↔ ZWO ↔ GCN) must flow. Defines schema, MIME type, and round-trip invariants.

## Requirements

### Requirement: Canonical Format

All format conversions SHALL use KRD as the intermediate representation. Direct format-to-format conversion (e.g., FIT → TCX) without passing through KRD is forbidden.

#### Scenario: Conversion pipeline passes through KRD

- **GIVEN** a request to convert a FIT file to TCX
- **WHEN** the converter executes
- **THEN** it reads FIT into a KRD instance and writes the KRD instance out as TCX — never FIT → TCX directly

### Requirement: MIME Type

KRD files SHALL use the MIME type `application/vnd.kaiord+json`.

#### Scenario: Writer sets MIME type

- **GIVEN** a KRD payload served via HTTP
- **WHEN** the response headers are inspected
- **THEN** `Content-Type` is `application/vnd.kaiord+json`

### Requirement: Schema Validation

All KRD instances MUST validate against the Zod schemas in `packages/core/src/domain/schemas/`. Invalid KRD data MUST be rejected before reaching adapters.

`WorkoutStep` MUST satisfy two cross-field invariants enforced via Zod `.refine()` on `workoutStepSchema`:

- `durationType` MUST equal `duration.type`
- `targetType` MUST equal `target.type`

Validation fails at parse time if either invariant is violated.

#### Scenario: Invalid KRD rejected

- **GIVEN** a JSON object missing the required `version` field
- **WHEN** parsed as KRD
- **THEN** Zod validation throws a schema error before any adapter processes it

#### Scenario: WorkoutStep cross-field invariant rejected

- **GIVEN** a WorkoutStep where `durationType` is `"time"` but `duration.type` is `"distance"`
- **WHEN** parsed via `workoutStepSchema`
- **THEN** Zod throws a validation error: "durationType must match duration.type"

### Requirement: Round-Trip Safety

Converting data from any supported format to KRD and back MUST preserve values within defined tolerances:

- Time: ±1 second
- Power: ±1W or ±1% FTP
- Heart rate: ±1 bpm
- Cadence: ±1 rpm

#### Scenario: FIT to KRD round-trip

- **GIVEN** a valid FIT file with a running workout
- **WHEN** converted to KRD and back to FIT
- **THEN** all field values are within round-trip tolerances

### Requirement: Top-Level Structure

A KRD document SHALL contain:

- `version` (string, required): Schema version (e.g., "1.0")
- `type` (string, required): One of `"structured_workout"`, `"recorded_activity"`, `"course"`
- `metadata` (object, required): File-level metadata
- `sessions` (array, optional): Training sessions
- `laps` (array, optional): Lap/interval data
- `records` (array, optional): Time-series data points
- `events` (array, optional): Workout events
- `extensions` (object, optional): Structured data (e.g., `extensions.structured_workout` holds the Workout object)

#### Scenario: Missing required top-level field rejected

- **GIVEN** a KRD candidate without the `metadata` object
- **WHEN** parsed by `krdSchema`
- **THEN** validation fails with a Zod error naming the missing field

### Requirement: Naming Conventions

KRD field names SHALL use **camelCase** (e.g., `serialNumber`, `heartRate`, `subSport`). Domain enum values SHALL use **snake_case** (e.g., `indoor_cycling`, `lap_swimming`). Adapter schemas MAY use camelCase internally and MUST map enum values to snake_case when producing KRD.

#### Scenario: Adapter maps enum to snake_case

- **GIVEN** an adapter that internally represents a sub-sport as `"indoorCycling"` (camelCase)
- **WHEN** the adapter writes the KRD payload
- **THEN** the emitted KRD contains `"sub_sport": "indoor_cycling"`

### Requirement: Extension Namespaces

The `extensions` object SHALL reserve the following namespace keys for known extension payloads, and SHALL preserve any additional (adapter-defined or unknown) namespaces during round-trip conversions when the target format supports them:

- `extensions.structured_workout` (Workout): Full Workout object for structured workout KRDs, set by `createWorkoutKRD()`
- `extensions.fit` (object): Preserves FIT-specific data not mappable to KRD fields, containing:
  - `developerFields` (array): Developer-defined fields from FIT SDK
  - `unknownMessages` (array): Unrecognized FIT message types
- `extensions.course` (object): Course metadata for course-type KRDs
- `extensions.course_points` (array of KRDCoursePoint): Course waypoints, each containing `index`, `latitude`, `longitude`, `distance`, `type`, `name`, `favorite`, and optional `timestamp`

Adapters MUST NOT drop unknown extension namespaces silently; they MUST either round-trip them unchanged or fail the conversion with a descriptive error.

#### Scenario: Extension preservation

- **GIVEN** a FIT file with Garmin-specific extension fields
- **WHEN** converted to KRD
- **THEN** extension data is preserved in the `extensions` object

#### Scenario: Structured workout in extensions

- **GIVEN** a workout created via `createWorkoutKRD(workout)`
- **WHEN** the KRD document is inspected
- **THEN** `extensions.structured_workout` contains the full Workout object
