> Synced: 2026-03-06

# KRD Format

KRD (Kaiord Representation Definition) is the canonical intermediate format. All conversions between FIT, TCX, ZWO, and GCN pass through KRD.

## Requirements

### Requirement: Canonical Format

All format conversions SHALL use KRD as the intermediate representation. Direct format-to-format conversion (e.g., FIT → TCX) without passing through KRD is forbidden.

### Requirement: MIME Type

KRD files SHALL use the MIME type `application/vnd.kaiord+json`.

### Requirement: Schema Validation

All KRD instances MUST validate against the Zod schemas in `packages/core/src/domain/schemas/`. Invalid KRD data MUST be rejected before reaching adapters.

### Requirement: Round-Trip Safety

Converting data from any supported format to KRD and back MUST preserve values within defined tolerances:

- Time: ±1 second
- Power: ±1W or ±1% FTP
- Heart rate: ±1 bpm
- Cadence: ±1 rpm

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

### Requirement: Naming Conventions

KRD field names SHALL use **camelCase** (e.g., `serialNumber`, `heartRate`, `subSport`). Domain enum values SHALL use **snake_case** (e.g., `indoor_cycling`, `lap_swimming`). Adapter schemas MAY use camelCase internally and MUST map enum values to snake_case when producing KRD.

## Scenarios

#### Scenario: FIT to KRD round-trip

- **GIVEN** a valid FIT file with a running workout
- **WHEN** converted to KRD and back to FIT
- **THEN** all field values are within round-trip tolerances

#### Scenario: Invalid KRD rejected

- **GIVEN** a JSON object missing the required `version` field
- **WHEN** parsed as KRD
- **THEN** Zod validation throws a schema error before any adapter processes it

#### Scenario: Extension preservation

- **GIVEN** a FIT file with Garmin-specific extension fields
- **WHEN** converted to KRD
- **THEN** extension data is preserved in the `extensions` object

#### Scenario: Structured workout in extensions

- **GIVEN** a workout created via `createWorkoutKRD(workout)`
- **WHEN** the KRD document is inspected
- **THEN** `extensions.structured_workout` contains the full Workout object
