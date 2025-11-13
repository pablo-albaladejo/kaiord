# Requirements Document

## Introduction

This specification defines enhancements to the Kaiord FIT ↔ KRD conversion system based on the Garmin FIT Specification Compliance audit. The current implementation is production-ready with 100% coverage of common use cases. These enhancements will improve compatibility with advanced training platforms, swimming workouts, and structured training plans by implementing optional FIT specification fields.

## Glossary

- **KRD**: Kaiord Representation Definition - JSON-based canonical format for workout data
- **FIT**: Flexible and Interoperable Data Transfer - Garmin's binary workout file format
- **Workout System**: The Kaiord conversion system that transforms between FIT and KRD formats
- **Sub-sport**: A more specific categorization within a sport type (e.g., "trail" within "running")
- **Workout Step**: An individual interval or segment within a structured workout
- **Duration Type**: The condition that determines when a workout step ends
- **Target Type**: The performance metric being targeted during a workout step
- **Round-trip Conversion**: Converting FIT → KRD → FIT while preserving all data

## Requirements

### Requirement 1: Workout Metadata Enhancement

**User Story:** As a training platform developer, I want to specify sub-sport information in workouts, so that I can provide more detailed workout categorization and better user experience.

#### Acceptance Criteria

1. WHEN a FIT file contains a `sub_sport` field in the Workout message, THE Workout System SHALL map it to the KRD Workout schema
2. WHEN a KRD file contains a `subSport` field in the Workout object, THE Workout System SHALL map it to the FIT Workout message `sub_sport` field
3. WHEN converting FIT → KRD → FIT with `sub_sport` data, THE Workout System SHALL preserve the exact sub-sport value
4. WHERE the `sub_sport` field is absent, THE Workout System SHALL omit the field rather than setting it to null
5. THE Workout System SHALL validate that `subSport` values conform to the Garmin FIT sub-sport enumeration

### Requirement 2: Workout Step Notes

**User Story:** As a coach, I want to add instructional notes to workout steps, so that athletes receive coaching cues and guidance during their training.

#### Acceptance Criteria

1. WHEN a FIT file contains a `notes` field in a Workout Step message, THE Workout System SHALL map it to the KRD WorkoutStep schema
2. WHEN a KRD file contains a `notes` field in a WorkoutStep object, THE Workout System SHALL map it to the FIT Workout Step message `notes` field
3. WHEN converting FIT → KRD → FIT with step notes, THE Workout System SHALL preserve the exact text content
4. WHERE the `notes` field is absent, THE Workout System SHALL omit the field rather than setting it to null
5. THE Workout System SHALL support notes with a maximum length of 256 characters

### Requirement 3: Swimming Workout Support

**User Story:** As a swimming coach, I want to specify pool dimensions and equipment requirements, so that swimmers can execute workouts with proper context and equipment.

#### Acceptance Criteria

1. WHEN a FIT file contains `pool_length` in the Workout message, THE Workout System SHALL map it to the KRD Workout schema with value in meters
2. WHEN a FIT file contains `pool_length_unit` in the Workout message, THE Workout System SHALL convert the value to meters for KRD storage
3. WHEN a KRD file contains `poolLength` in meters, THE Workout System SHALL map it to the FIT Workout message with appropriate unit conversion
4. WHEN a FIT file contains `equipment` in a Workout Step message, THE Workout System SHALL map it to the KRD WorkoutStep schema
5. WHEN converting FIT → KRD → FIT with swimming fields, THE Workout System SHALL preserve pool length within ±0.01 meters tolerance
6. WHERE swimming fields are absent, THE Workout System SHALL omit the fields rather than setting them to null
7. THE Workout System SHALL validate that `equipment` values conform to the Garmin FIT equipment enumeration

### Requirement 4: Calorie-Based Duration Types

**User Story:** As a fitness app developer, I want to support calorie-based workout intervals, so that users can train based on energy expenditure goals.

#### Acceptance Criteria

1. WHEN a FIT file contains `duration_type` set to `CALORIES`, THE Workout System SHALL map it to KRD with type `calories`
2. WHEN a FIT file contains `durationCalories` field, THE Workout System SHALL map the calorie value to the KRD duration object
3. WHEN a KRD file contains duration type `calories`, THE Workout System SHALL map it to FIT `duration_type` CALORIES with `durationCalories` field
4. WHEN converting FIT → KRD → FIT with calorie durations, THE Workout System SHALL preserve the exact calorie value
5. THE Workout System SHALL validate that calorie values are positive integers
6. WHEN a FIT file contains `duration_type` set to `REPEAT_UNTIL_CALORIES`, THE Workout System SHALL map it to KRD with type `repeat_until_calories`

### Requirement 5: Power-Based Duration Types

**User Story:** As a cycling coach, I want to create intervals that end based on power thresholds, so that athletes can train adaptively based on their current power output.

#### Acceptance Criteria

1. WHEN a FIT file contains `duration_type` set to `POWER_LESS_THAN`, THE Workout System SHALL map it to KRD with type `power_less_than`
2. WHEN a FIT file contains `duration_type` set to `POWER_GREATER_THAN`, THE Workout System SHALL map it to KRD with type `power_greater_than`
3. WHEN a FIT file contains `durationPower` field, THE Workout System SHALL map the power threshold to the KRD duration object
4. WHEN a KRD file contains power-based duration types, THE Workout System SHALL map them to corresponding FIT duration types with `durationPower` field
5. WHEN converting FIT → KRD → FIT with power durations, THE Workout System SHALL preserve power values within ±1 watt tolerance
6. THE Workout System SHALL validate that power threshold values are positive numbers
7. WHEN a FIT file contains `duration_type` set to `REPEAT_UNTIL_POWER_LESS_THAN`, THE Workout System SHALL map it to KRD with type `repeat_until_power_less_than`
8. WHEN a FIT file contains `duration_type` set to `REPEAT_UNTIL_POWER_GREATER_THAN`, THE Workout System SHALL map it to KRD with type `repeat_until_power_greater_than`

### Requirement 6: Additional Repeat Conditionals

**User Story:** As a training platform developer, I want to support comprehensive repeat conditions, so that workouts can repeat based on various performance metrics and cumulative goals.

#### Acceptance Criteria

1. WHEN a FIT file contains `duration_type` set to `REPEAT_UNTIL_TIME`, THE Workout System SHALL map it to KRD with type `repeat_until_time`
2. WHEN a FIT file contains `duration_type` set to `REPEAT_UNTIL_DISTANCE`, THE Workout System SHALL map it to KRD with type `repeat_until_distance`
3. WHEN a FIT file contains `duration_type` set to `REPEAT_UNTIL_HR_LESS_THAN`, THE Workout System SHALL map it to KRD with type `repeat_until_heart_rate_less_than`
4. WHEN a FIT file contains `durationTime` field with repeat conditional, THE Workout System SHALL map the time threshold to the KRD duration object
5. WHEN a FIT file contains `durationDistance` field with repeat conditional, THE Workout System SHALL map the distance threshold to the KRD duration object
6. WHEN a FIT file contains `durationHr` field with repeat conditional, THE Workout System SHALL map the heart rate threshold to the KRD duration object
7. WHEN converting FIT → KRD → FIT with repeat conditionals, THE Workout System SHALL preserve threshold values within specified tolerances (±1 second, ±1 meter, ±1 bpm)
8. THE Workout System SHALL validate that repeat conditional threshold values are positive numbers

### Requirement 7: Duration Type Naming Consistency

**User Story:** As a developer, I want consistent naming between KRD duration types and FIT duration types, so that the mapping is intuitive and maintainable.

#### Acceptance Criteria

1. THE Workout System SHALL use consistent naming patterns for all duration types
2. WHERE FIT uses `REPEAT_UNTIL_HR_GREATER_THAN`, THE Workout System SHALL use `repeat_until_heart_rate_greater_than` in KRD (not `heart_rate_greater_than`)
3. THE Workout System SHALL document any naming transformations between FIT and KRD formats
4. THE Workout System SHALL maintain backward compatibility with existing `heart_rate_greater_than` duration type
5. THE Workout System SHALL provide migration guidance for users with existing KRD files using old naming

### Requirement 8: Schema Validation

**User Story:** As a developer, I want all new fields to be validated against schemas, so that data integrity is maintained throughout the conversion process.

#### Acceptance Criteria

1. THE Workout System SHALL update the KRD JSON Schema to include all new optional fields
2. THE Workout System SHALL validate all KRD files against the updated schema before conversion
3. WHEN validation fails, THE Workout System SHALL provide clear error messages indicating which fields are invalid
4. THE Workout System SHALL update Zod schemas to match the JSON Schema definitions
5. THE Workout System SHALL ensure TypeScript types are inferred from Zod schemas

### Requirement 9: Round-Trip Safety

**User Story:** As a quality assurance engineer, I want all new fields to maintain round-trip safety, so that no data is lost during bidirectional conversions.

#### Acceptance Criteria

1. WHEN converting FIT → KRD → FIT with new fields, THE Workout System SHALL preserve all field values within specified tolerances
2. THE Workout System SHALL apply tolerance of ±0.01 meters for pool length
3. THE Workout System SHALL apply tolerance of ±1 watt for power thresholds
4. THE Workout System SHALL apply tolerance of ±1 calorie for calorie values
5. THE Workout System SHALL preserve exact string values for notes, sub-sport, and equipment fields
6. THE Workout System SHALL include round-trip tests for all new duration types and fields

### Requirement 10: Backward Compatibility

**User Story:** As an existing Kaiord user, I want the enhancements to be backward compatible, so that my existing workflows continue to function without modification.

#### Acceptance Criteria

1. THE Workout System SHALL treat all new fields as optional
2. WHEN processing files without new fields, THE Workout System SHALL function identically to the previous version
3. THE Workout System SHALL not break existing tests or functionality
4. THE Workout System SHALL maintain the same API surface for existing use cases
5. WHEN new fields are absent, THE Workout System SHALL omit them from output rather than including null values
