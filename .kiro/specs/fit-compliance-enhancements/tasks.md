# Implementation Plan

## Overview

This implementation plan breaks down the FIT compliance enhancements into discrete, testable tasks. Each task builds incrementally on previous work and includes specific requirements references.

## Task Structure

- **Priority 1 tasks** (1-3): High-value fields (subSport, notes)
- **Priority 2 tasks** (4-6): Swimming and advanced duration types
- **Integration tasks** (7-8): Testing and documentation

## Verification Requirements

**All tasks MUST be verified against official Garmin documentation:**

- [Garmin FIT Workout File Type](https://developer.garmin.com/fit/file-types/workout/)
- [Garmin FIT JavaScript SDK](https://github.com/garmin/fit-javascript-sdk)
- [FIT Workout Files Cookbook](https://developer.garmin.com/fit/cookbook/encoding-workout-files/)

Before marking any task as complete, verify that:

1. Field names match the JavaScript SDK (camelCase for FIT, snake_case for KRD)
2. Field types match the FIT specification
3. Dynamic fields are correctly mapped based on message type
4. Enumeration values match the SDK constants

---

## Tasks

- [ ] 1. Add Priority 1 fields to domain schemas

  - Update Workout schema with `subSport` field
  - Update WorkoutStep schema with `notes` field
  - Update Zod schemas as source of truth
  - Ensure TypeScript types are inferred from Zod
  - **Verify against**: [Garmin FIT Workout Spec](https://developer.garmin.com/fit/file-types/workout/) and [FIT SDK Documentation](https://github.com/garmin/fit-javascript-sdk)
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 8.1, 8.5_

- [ ] 2. Implement Priority 1 FIT converters

  - [ ] 2.1 Add FIT constants for sub-sport values

    - Define `FIT_SUB_SPORT` constants (strings, camelCase)
    - Define `KRD_SUB_SPORT` constants (strings, snake_case)
    - Add mapping functions between FIT and KRD formats
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 2.2 Implement FIT → KRD converters for Priority 1 fields

    - Map `subSport` from FIT Workout message to KRD
    - Map `notes` from FIT WorkoutStep message to KRD
    - Handle undefined values (omit rather than null)
    - _Requirements: 1.1, 2.1, 10.1, 10.5_

  - [ ] 2.3 Implement KRD → FIT converters for Priority 1 fields
    - Map `subSport` from KRD to FIT Workout message
    - Map `notes` from KRD to FIT WorkoutStep message
    - Validate notes length (max 256 characters)
    - _Requirements: 1.2, 2.2, 2.5, 10.1_

- [ ] 3. Test Priority 1 fields

  - [ ] 3.1 Write unit tests for Priority 1 converters

    - Test subSport mapping (FIT ↔ KRD)
    - Test notes mapping (FIT ↔ KRD)
    - Test undefined value handling
    - Test notes length validation
    - _Requirements: 1.3, 2.3, 8.2, 9.6_

  - [ ] 3.2 Write round-trip tests for Priority 1 fields
    - Test subSport preservation through FIT → KRD → FIT
    - Test notes preservation through FIT → KRD → FIT
    - Verify exact string values preserved
    - _Requirements: 1.3, 2.3, 9.1, 9.5_

- [ ] 4. Add Priority 2 swimming fields to domain schemas

  - Update Workout schema with `poolLength` and `poolLengthUnit` fields
  - Update WorkoutStep schema with `equipment` field
  - Update Zod schemas as source of truth
  - _Requirements: 3.1, 3.2, 3.4, 8.1, 8.5_

- [ ] 5. Implement Priority 2 swimming FIT converters

  - [ ] 5.1 Add FIT constants for swimming fields

    - Define `FIT_EQUIPMENT` constants (strings, camelCase)
    - Define `KRD_EQUIPMENT` constants (strings, snake_case)
    - Add mapping functions between FIT and KRD formats
    - _Requirements: 3.4, 3.7_

  - [ ] 5.2 Implement FIT → KRD converters for swimming fields

    - Map `poolLength` and `poolLengthUnit` from FIT to KRD
    - Convert pool length to meters (handle unit conversion)
    - Map `equipment` from FIT WorkoutStep to KRD
    - Handle undefined values (omit rather than null)
    - _Requirements: 3.1, 3.2, 3.4, 10.1, 10.5_

  - [ ] 5.3 Implement KRD → FIT converters for swimming fields
    - Map `poolLength` from KRD to FIT (always in meters)
    - Set `poolLengthUnit` to meters (0) in FIT
    - Map `equipment` from KRD to FIT WorkoutStep
    - _Requirements: 3.3, 3.4, 10.1_

- [ ] 6. Implement Priority 2 advanced duration types

  - [ ] 6.1 Update duration schema with advanced types

    - Add calorie-based duration types to Zod schema
    - Add power-based duration types to Zod schema
    - Add additional repeat conditional types to Zod schema
    - Fix naming: `heart_rate_greater_than` → `repeat_until_heart_rate_greater_than`
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 6.1, 6.2, 7.2, 8.1_

  - [ ] 6.2 Add FIT constants for advanced duration types

    - Define `FIT_DURATION_TYPE` constants for new types (strings, camelCase)
    - Define `KRD_DURATION_TYPE` constants for new types (strings, snake_case)
    - Ensure no hardcoded strings in constants
    - _Requirements: 4.1, 5.1, 5.7, 5.8, 6.1, 6.2_

  - [ ] 6.3 Implement FIT → KRD duration converters

    - Convert calorie-based durations (CALORIES, REPEAT_UNTIL_CALORIES)
    - Convert power-based durations (POWER*LESS_THAN, POWER_GREATER_THAN, REPEAT_UNTIL_POWER*\*)
    - Convert additional repeat conditionals (REPEAT_UNTIL_TIME, REPEAT_UNTIL_DISTANCE, REPEAT_UNTIL_HR_LESS_THAN)
    - Use constants for all type comparisons (no hardcoded strings)
    - _Requirements: 4.1, 4.2, 4.6, 5.1, 5.2, 5.7, 5.8, 6.1, 6.2, 6.3, 6.4_

  - [ ] 6.4 Implement KRD → FIT duration converters
    - Convert calorie-based durations to FIT format
    - Convert power-based durations to FIT format
    - Convert repeat conditionals to FIT format
    - Map to correct FIT dynamic fields (durationCalories, durationPower, etc.)
    - Use constants for all type comparisons (no hardcoded strings)
    - _Requirements: 4.3, 5.4, 6.5_

- [ ] 7. Test Priority 2 enhancements

  - [ ] 7.1 Write unit tests for swimming converters

    - Test pool length conversion and unit handling
    - Test equipment mapping (FIT ↔ KRD)
    - Test undefined value handling
    - _Requirements: 3.5, 3.6, 8.2, 9.6_

  - [ ] 7.2 Write unit tests for advanced duration converters

    - Test each new duration type conversion (FIT → KRD)
    - Test each new duration type conversion (KRD → FIT)
    - Test dynamic field mapping (durationCalories, durationPower, etc.)
    - Test edge cases (boundary values, missing fields)
    - Use constants in all test assertions
    - _Requirements: 4.4, 4.5, 5.5, 5.6, 6.6, 6.7, 8.2_

  - [ ] 7.3 Write round-trip tests for all new fields

    - Test swimming fields preservation (pool length within ±0.01m tolerance)
    - Test calorie duration preservation (exact values)
    - Test power duration preservation (within ±1W tolerance)
    - Test repeat conditional preservation
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6_

  - [ ] 7.4 Create test fixtures for new field types
    - Build fixtures for workouts with subSport
    - Build fixtures for workout steps with notes
    - Build fixtures for swimming workouts
    - Build fixtures for advanced duration types
    - _Requirements: 8.2, 9.6_

- [ ] 8. Update documentation and finalize

  - [ ] 8.1 Update JSON Schema generation

    - Regenerate JSON Schema from updated Zod schemas
    - Verify all new fields are included
    - _Requirements: 8.1, 8.4_

  - [ ] 8.2 Update naming consistency

    - Update all tests using old `heart_rate_greater_than` naming
    - Update all fixtures using old naming
    - Update any example KRD files in documentation
    - _Requirements: 7.2, 7.3, 7.4_

  - [ ] 8.3 Verify backward compatibility

    - Test that files without new fields still work
    - Verify no breaking changes to existing API
    - Confirm all existing tests still pass
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 8.4 Update project documentation
    - Update README with new field support
    - Add examples of new fields in documentation
    - Update CHANGELOG with new features
    - _Requirements: 7.5, 8.3_
