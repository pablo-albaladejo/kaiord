# Requirements Document

## Introduction

This specification defines the migration of TypeScript constant objects to Zod schemas as the single source of truth for all enumeration types in Kaiord. The current implementation uses plain TypeScript objects with `as const` assertions for constants like sport types, sub-sport types, duration types, and target types. This migration will align the codebase with the established Zod-first pattern, enabling runtime validation, type inference, and better maintainability.

## Glossary

- **Zod Schema**: A runtime validation schema that serves as the single source of truth for both TypeScript types and runtime validation
- **Constants File**: A TypeScript file containing plain objects with `as const` assertions (e.g., `constants.ts`, `sub-sport-fit.constants.ts`)
- **Enum Schema**: A Zod schema created with `z.enum()` that defines a set of allowed string literal values
- **Domain Schema**: A schema in `packages/core/src/domain/schemas/` representing KRD format concepts
- **Adapter Schema**: A schema in `packages/core/src/adapters/fit/schemas/` representing FIT SDK format concepts
- **Workout System**: The Kaiord conversion system that transforms between FIT and KRD formats
- **Round-trip Conversion**: Converting FIT → KRD → FIT while preserving all data

## Requirements

### Requirement 1: Sport Type Schema Migration

**User Story:** As a developer, I want sport types defined as Zod schemas, so that I can validate sport values at runtime and infer TypeScript types automatically.

#### Acceptance Criteria

1. THE Workout System SHALL define a `sportEnum` schema in `packages/core/src/domain/schemas/sport.ts` using `z.enum()`
2. THE Workout System SHALL include sport values: "cycling", "running", "swimming", "generic"
3. THE Workout System SHALL export a `Sport` type inferred from `sportEnum` using `z.infer<typeof sportEnum>`
4. THE Workout System SHALL define a `fitSportEnum` schema in `packages/core/src/adapters/fit/schemas/fit-sport.ts` for FIT SDK format
5. WHEN the sport schema is defined, THE Workout System SHALL remove the `FIT_SPORT_TYPE` constant object from `constants.ts`

### Requirement 2: Sub-Sport Type Schema Migration

**User Story:** As a developer, I want sub-sport types defined as Zod schemas with proper naming conventions, so that KRD uses snake_case and FIT uses camelCase consistently.

#### Acceptance Criteria

1. THE Workout System SHALL define a `subSportEnum` schema in `packages/core/src/domain/schemas/sub-sport.ts` with all 60+ sub-sport values in snake_case format
2. THE Workout System SHALL export a `SubSport` type inferred from `subSportEnum`
3. THE Workout System SHALL define a `fitSubSportEnum` schema in `packages/core/src/adapters/fit/schemas/fit-sub-sport.ts` with all values in camelCase format
4. THE Workout System SHALL export a `FitSubSport` type inferred from `fitSubSportEnum`
5. WHEN the sub-sport schemas are defined, THE Workout System SHALL remove `sub-sport-krd.constants.ts` and `sub-sport-fit.constants.ts` files
6. THE Workout System SHALL ensure snake_case values include: "indoor_cycling", "hand_cycling", "track_cycling", "lap_swimming", "open_water", etc.
7. THE Workout System SHALL ensure camelCase values include: "indoorCycling", "handCycling", "trackCycling", "lapSwimming", "openWater", etc.

### Requirement 3: Duration Type Schema Migration

**User Story:** As a developer, I want duration types defined as Zod schemas, so that FIT-specific duration types are separated from KRD domain types.

#### Acceptance Criteria

1. THE Workout System SHALL keep the existing `durationTypeEnum` in `packages/core/src/domain/schemas/duration.ts` for KRD format
2. THE Workout System SHALL define a `fitDurationTypeEnum` schema in `packages/core/src/adapters/fit/schemas/fit-duration.ts` for FIT SDK format
3. THE Workout System SHALL include FIT-specific values in `fitDurationTypeEnum`: "time", "distance", "repeatUntilStepsCmplt", "repeatUntilHrGreaterThan", "hrLessThan", "hrGreaterThan", "open"
4. THE Workout System SHALL export a `FitDurationType` type inferred from `fitDurationTypeEnum`
5. WHEN the FIT duration schema is defined, THE Workout System SHALL remove the `FIT_DURATION_TYPE` constant object from `constants.ts`

### Requirement 4: Target Type Schema Migration

**User Story:** As a developer, I want target types defined as Zod schemas, so that FIT-specific target types are separated from KRD domain types.

#### Acceptance Criteria

1. THE Workout System SHALL keep the existing `targetTypeEnum` in `packages/core/src/domain/schemas/target.ts` for KRD format
2. THE Workout System SHALL define a `fitTargetTypeEnum` schema in `packages/core/src/adapters/fit/schemas/fit-target.ts` for FIT SDK format
3. THE Workout System SHALL include FIT-specific values in `fitTargetTypeEnum`: "power", "heartRate", "cadence", "speed", "swimStroke", "open"
4. THE Workout System SHALL export a `FitTargetType` type inferred from `fitTargetTypeEnum`
5. WHEN the FIT target schema is defined, THE Workout System SHALL remove the `FIT_TARGET_TYPE` constant object from `constants.ts`

### Requirement 5: Target Unit Schema Migration

**User Story:** As a developer, I want target units defined as Zod schemas, so that all unit types are validated at runtime.

#### Acceptance Criteria

1. THE Workout System SHALL keep the existing `targetUnitEnum` in `packages/core/src/domain/schemas/target-values.ts` for KRD format
2. THE Workout System SHALL ensure `targetUnitEnum` includes all unit values: "watts", "percent_ftp", "zone", "range", "bpm", "percent_max", "rpm", "spm", "mps", "min_per_km", "swim_stroke"
3. WHEN the target unit schema exists, THE Workout System SHALL remove the `KRD_TARGET_UNIT` constant object from `constants.ts`

### Requirement 6: Swim Stroke Schema Migration

**User Story:** As a developer, I want swim stroke types defined as Zod schemas with numeric mappings, so that I can validate stroke types and convert to FIT numeric values.

#### Acceptance Criteria

1. THE Workout System SHALL define a `swimStrokeEnum` schema in `packages/core/src/domain/schemas/swim-stroke.ts`
2. THE Workout System SHALL include stroke values: "freestyle", "backstroke", "breaststroke", "butterfly", "drill", "mixed", "im"
3. THE Workout System SHALL export a `SwimStroke` type inferred from `swimStrokeEnum`
4. THE Workout System SHALL define a `SWIM_STROKE_TO_FIT` mapping object for converting stroke names to FIT numeric values
5. THE Workout System SHALL define a `FIT_TO_SWIM_STROKE` mapping object for converting FIT numeric values to stroke names
6. WHEN the swim stroke schema is defined, THE Workout System SHALL remove the `FIT_SWIM_STROKE` constant object from `constants.ts`

### Requirement 7: File Type Schema Migration

**User Story:** As a developer, I want file types defined as Zod schemas, so that KRD and FIT file types are validated consistently.

#### Acceptance Criteria

1. THE Workout System SHALL define a `fileTypeEnum` schema in `packages/core/src/domain/schemas/file-type.ts`
2. THE Workout System SHALL include file type values: "workout", "activity", "course"
3. THE Workout System SHALL export a `FileType` type inferred from `fileTypeEnum`
4. WHEN the file type schema is defined, THE Workout System SHALL remove the `KRD_FILE_TYPE` and `FIT_FILE_TYPE` constant objects from `constants.ts`

### Requirement 8: Intensity Schema Validation

**User Story:** As a developer, I want to verify that the existing intensity schema is complete, so that all FIT intensity values are supported.

#### Acceptance Criteria

1. THE Workout System SHALL verify that `intensityEnum` in `packages/core/src/domain/schemas/intensity.ts` includes all values from `FIT_INTENSITY`
2. THE Workout System SHALL ensure `intensityEnum` includes: "warmup", "active", "cooldown", "rest", "recovery", "interval", "other"
3. WHEN the intensity schema is verified, THE Workout System SHALL remove the `FIT_INTENSITY` constant object from `constants.ts`

### Requirement 9: FIT Message Key Schema Migration

**User Story:** As a developer, I want FIT message keys defined as Zod schemas, so that message property names are validated at the adapter boundary.

#### Acceptance Criteria

1. THE Workout System SHALL define a `fitMessageKeyEnum` schema in `packages/core/src/adapters/fit/schemas/fit-message-keys.ts`
2. THE Workout System SHALL include message key values: "fileIdMesgs", "workoutMesgs", "workoutStepMesgs"
3. THE Workout System SHALL export a `FitMessageKey` type inferred from `fitMessageKeyEnum`
4. WHEN the message key schema is defined, THE Workout System SHALL remove the `FIT_MESSAGE_KEY` constant object from `constants.ts`

### Requirement 10: Mapper Updates

**User Story:** As a developer, I want all mappers updated to use Zod schemas, so that values are validated at adapter boundaries.

#### Acceptance Criteria

1. THE Workout System SHALL update all mappers in `packages/core/src/adapters/fit/` to import from schema files instead of constants files
2. THE Workout System SHALL use `.parse()` or `.safeParse()` methods to validate values at adapter boundaries
3. THE Workout System SHALL replace constant object references (e.g., `FIT_SPORT_TYPE.CYCLING`) with enum references (e.g., `fitSportEnum.enum.cycling`)
4. THE Workout System SHALL update `sub-sport.mapper.ts` to use `fitSubSportEnum` and `subSportEnum`
5. THE Workout System SHALL ensure all mappers handle validation errors appropriately

### Requirement 11: Constants File Removal

**User Story:** As a developer, I want obsolete constants files removed, so that there is only one source of truth for enumeration types.

#### Acceptance Criteria

1. WHEN all schemas are migrated and all mappers are updated, THE Workout System SHALL remove `packages/core/src/adapters/fit/constants.ts`
2. WHEN sub-sport schemas are migrated, THE Workout System SHALL remove `packages/core/src/adapters/fit/sub-sport-fit.constants.ts`
3. WHEN sub-sport schemas are migrated, THE Workout System SHALL remove `packages/core/src/adapters/fit/sub-sport-krd.constants.ts`
4. THE Workout System SHALL verify that no files import from removed constants files
5. THE Workout System SHALL ensure all tests pass after constants file removal

### Requirement 12: Naming Convention Consistency

**User Story:** As a developer, I want consistent naming conventions for all schemas, so that the codebase is predictable and maintainable.

#### Acceptance Criteria

1. THE Workout System SHALL use `{concept}Enum` naming pattern for all `z.enum()` schemas (e.g., `sportEnum`, `subSportEnum`, `intensityEnum`)
2. THE Workout System SHALL use `{concept}Schema` naming pattern for all `z.object()` and `z.discriminatedUnion()` schemas
3. THE Workout System SHALL use `fit{Concept}Enum` naming pattern for FIT adapter schemas (e.g., `fitSportEnum`, `fitSubSportEnum`)
4. THE Workout System SHALL infer types with PascalCase names (e.g., `Sport`, `SubSport`, `FitSport`, `FitSubSport`)
5. THE Workout System SHALL use camelCase for schema variable names and PascalCase for inferred type names

### Requirement 13: Directory Structure

**User Story:** As a developer, I want a clear directory structure for schemas, so that domain and adapter concerns are properly separated.

#### Acceptance Criteria

1. THE Workout System SHALL place all KRD domain schemas in `packages/core/src/domain/schemas/`
2. THE Workout System SHALL create a new directory `packages/core/src/adapters/fit/schemas/` for FIT adapter schemas
3. THE Workout System SHALL ensure domain schemas do not import from adapter schemas
4. THE Workout System SHALL allow adapter schemas to import from domain schemas when needed for mapping
5. THE Workout System SHALL document the schema organization in the architecture steering rules

### Requirement 14: Backward Compatibility

**User Story:** As an existing Kaiord user, I want the schema migration to be backward compatible, so that existing functionality continues to work without modification.

#### Acceptance Criteria

1. THE Workout System SHALL maintain the same runtime behavior for all conversions
2. THE Workout System SHALL not change the KRD JSON output format
3. THE Workout System SHALL not change the FIT binary output format
4. THE Workout System SHALL ensure all existing tests pass without modification
5. THE Workout System SHALL maintain the same public API surface

### Requirement 15: Test Coverage

**User Story:** As a quality assurance engineer, I want comprehensive test coverage for schema validation, so that invalid values are caught at runtime.

#### Acceptance Criteria

1. THE Workout System SHALL add tests for each new schema file validating correct values
2. THE Workout System SHALL add tests for each new schema file rejecting invalid values
3. THE Workout System SHALL ensure mapper tests validate values using schemas
4. THE Workout System SHALL maintain overall test coverage ≥ 80%
5. THE Workout System SHALL maintain mapper test coverage ≥ 90%
