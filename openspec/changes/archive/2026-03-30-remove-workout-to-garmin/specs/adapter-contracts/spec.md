# Spec: No Convenience Conversion Shortcuts

## Requirements

### Requirement: KRD-Only Public Conversion API

Format adapter packages MUST NOT export public functions that accept a domain object (e.g., `Workout`) and produce a format-specific output. All public conversion functions SHALL operate on KRD as input or output.

### Requirement: No Use-Case Orchestration in Adapters

Format adapter packages SHALL NOT import or invoke core use-case functions (`toText`, `fromText`, `toBinary`, `fromBinary`) or domain converters (`createWorkoutKRD`). Adapters implement port interfaces only. Composing KRD creation with format conversion is the consumer's responsibility.

### Requirement: workoutToGarmin Removal

`@kaiord/garmin` MUST NOT export `workoutToGarmin`, `createWorkoutToGarmin`, or `WorkoutToGarminOptions`.

## Scenarios

#### Scenario: Standard Garmin conversion flow

- **GIVEN** a consumer has a `Workout` object
- **WHEN** they want to produce Garmin Connect JSON
- **THEN** they MUST call `createWorkoutKRD(workout)` then `toText(krd, garminWriter)`

#### Scenario: No shortcut exports

- **GIVEN** the `@kaiord/garmin` package public API
- **WHEN** a consumer inspects the exports
- **THEN** there SHALL be no function that accepts a raw `Workout` and returns a format string

#### Scenario: Build succeeds after removal

- **GIVEN** `workoutToGarmin` and `createWorkoutToGarmin` are removed
- **WHEN** `pnpm -r build` runs
- **THEN** zero TypeScript errors across all packages

#### Scenario: Coverage thresholds maintained

- **GIVEN** `workout-to-garmin.test.ts` is deleted
- **WHEN** `pnpm --filter @kaiord/garmin test -- --coverage` runs
- **THEN** all coverage thresholds pass at 80%
