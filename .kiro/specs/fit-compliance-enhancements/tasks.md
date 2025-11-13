# Implementation Plan

## Overview

This implementation plan breaks down the FIT compliance enhancements into discrete, testable tasks. Each task builds incrementally on previous work and includes specific requirements references.

## Current Status

**Completed:**

- ✅ Task 1: Domain schemas updated with `subSport` and `notes` fields
- ✅ Task 2.1: FIT sub-sport enum schemas and mapper functions created with unit tests

**In Progress:**

- Task 2.2-2.3: Need to integrate subSport and notes into workout/step converters
- Task 3: Need integration and round-trip tests for Priority 1 fields

**Not Started:**

- Tasks 4-6: Swimming fields and advanced duration types
- Tasks 7-8: Testing and documentation

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

- [x] 1. Add Priority 1 fields to domain schemas

  - Update Workout schema with `subSport` field ✓
  - Update WorkoutStep schema with `notes` field ✓
  - Update Zod schemas as source of truth ✓
  - Ensure TypeScript types are inferred from Zod ✓
  - **Verify against**: [Garmin FIT Workout Spec](https://developer.garmin.com/fit/file-types/workout/) and [FIT SDK Documentation](https://github.com/garmin/fit-javascript-sdk)
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 8.1, 8.5_

- [x] 2. Implement Priority 1 FIT converters

  - [x] 2.1 Add FIT constants for sub-sport values

    - Define FIT sub-sport enum schema (camelCase) ✓
    - Define KRD sub-sport enum schema (snake_case) ✓
    - Add mapping functions between FIT and KRD formats ✓
    - Add unit tests for mapper functions ✓
    - _Requirements: 1.1, 1.2, 1.5_

  - [x] 2.2 Implement FIT → KRD converters for Priority 1 fields

    - Map `subSport` from FIT Workout message to KRD
    - Map `notes` from FIT WorkoutStep message to KRD
    - Handle undefined values (omit rather than null)
    - _Requirements: 1.1, 2.1, 10.1, 10.5_

  - [x] 2.3 Implement KRD → FIT converters for Priority 1 fields
    - Map `subSport` from KRD to FIT Workout message
    - Map `notes` from KRD to FIT WorkoutStep message
    - Validate notes length (max 256 characters)
    - _Requirements: 1.2, 2.2, 2.5, 10.1_

- [x] 3. Test Priority 1 fields

  - [x] 3.1 Write integration tests for Priority 1 converters

    - Test subSport mapping in workout converter (FIT → KRD)
    - Test subSport mapping in workout converter (KRD → FIT)
    - Test notes mapping in step converter (FIT → KRD)
    - Test notes mapping in step converter (KRD → FIT)
    - Test undefined value handling (fields omitted, not null)
    - Test notes length validation (max 256 characters)
    - _Requirements: 1.3, 2.3, 8.2, 9.6_

  - [x] 3.2 Write round-trip tests for Priority 1 fields
    - Test subSport preservation through FIT → KRD → FIT
    - Test notes preservation through FIT → KRD → FIT
    - Verify exact string values preserved
    - Test with real FIT files containing these fields
    - _Requirements: 1.3, 2.3, 9.1, 9.5_

- [x] 4. Add Priority 2 swimming fields to domain schemas

  - Update Workout schema with `poolLength` and `poolLengthUnit` fields
  - Update WorkoutStep schema with `equipment` field
  - Update Zod schemas as source of truth
  - _Requirements: 3.1, 3.2, 3.4, 8.1, 8.5_

- [x] 5. Implement Priority 2 swimming FIT converters

  - [x] 5.1 Add FIT equipment schemas and mappers

    - Create FIT equipment enum schema in `adapters/fit/schemas/fit-equipment.ts` (camelCase values)
    - KRD equipment enum already exists in `domain/schemas/equipment.ts` (snake_case values)
    - Create equipment mapper in `adapters/fit/equipment.mapper.ts` with bidirectional mapping
    - Add unit tests for equipment mapper functions
    - _Requirements: 3.4, 3.7_

  - [x] 5.2 Implement FIT → KRD converters for swimming fields

    - Map `poolLength` and `poolLengthUnit` from FIT to KRD
    - Convert pool length to meters (handle unit conversion)
    - Map `equipment` from FIT WorkoutStep to KRD
    - Handle undefined values (omit rather than null)
    - _Requirements: 3.1, 3.2, 3.4, 10.1, 10.5_

  - [x] 5.3 Implement KRD → FIT converters for swimming fields
    - Map `poolLength` from KRD to FIT (always in meters)
    - Set `poolLengthUnit` to meters (0) in FIT
    - Map `equipment` from KRD to FIT WorkoutStep
    - _Requirements: 3.3, 3.4, 10.1_

- [x] 6. Implement Priority 2 advanced duration types

  - [x] 6.1 Update duration schema with advanced types and fix naming

    - Fix naming: `heart_rate_greater_than` → `repeat_until_heart_rate_greater_than` in duration schema
    - Update all references in converters and mappers to use new naming
    - Update durationTypeEnum in workout schema to use new naming
    - Add calorie-based duration types to Zod schema (calories, repeat_until_calories)
    - Add power-based duration types to Zod schema (power_less_than, power_greater_than, repeat_until_power_less_than, repeat_until_power_greater_than)
    - Add additional repeat conditional types to Zod schema (repeat_until_time, repeat_until_distance, repeat_until_heart_rate_less_than)
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 6.1, 6.2, 7.2, 8.1_

  - [x] 6.2 Add FIT duration type schemas for advanced types

    - Create/update FIT duration type enum schema in `adapters/fit/schemas/fit-duration.ts` (camelCase values)
    - KRD duration type enum already exists in `domain/schemas/duration.ts` (snake_case values)
    - Update duration mapper to handle new types with bidirectional mapping
    - Ensure no hardcoded strings in mappers (use enum schema values)
    - _Requirements: 4.1, 5.1, 5.7, 5.8, 6.1, 6.2_

  - [x] 6.3 Implement FIT → KRD duration converters

    - Convert calorie-based durations (calories, repeatUntilCalories)
    - Convert power-based durations (powerLessThan, powerGreaterThan, repeatUntilPowerLessThan, repeatUntilPowerGreaterThan)
    - Convert additional repeat conditionals (repeatUntilTime, repeatUntilDistance, repeatUntilHrLessThan)
    - Use enum schema values for all type comparisons (no hardcoded strings)
    - _Requirements: 4.1, 4.2, 4.6, 5.1, 5.2, 5.7, 5.8, 6.1, 6.2, 6.3, 6.4_

  - [x] 6.4 Implement KRD → FIT duration converters
    - Convert calorie-based durations to FIT format
    - Convert power-based durations to FIT format
    - Convert repeat conditionals to FIT format
    - Map to correct FIT dynamic fields (durationCalories, durationPower, etc.)
    - Use enum schema values for all type comparisons (no hardcoded strings)
    - _Requirements: 4.3, 5.4, 6.5_

- [ ] 7. Test Priority 2 enhancements

  - [x] 7.1 Write integration tests for swimming converters

    - Test pool length conversion and unit handling (FIT → KRD)
    - Test pool length conversion (KRD → FIT, always meters)
    - Test equipment mapping (FIT ↔ KRD)
    - Test undefined value handling (fields omitted, not null)
    - _Requirements: 3.5, 3.6, 8.2, 9.6_

  - [x] 7.2 Write integration tests for advanced duration converters

    - Test each new duration type conversion (FIT → KRD)
    - Test each new duration type conversion (KRD → FIT)
    - Test dynamic field mapping (durationCalories, durationPower, etc.)
    - Test edge cases (boundary values, missing fields)
    - Use enum schema values in all test assertions (no hardcoded strings)
    - _Requirements: 4.4, 4.5, 5.5, 5.6, 6.6, 6.7, 8.2_

  - [x] 7.3 Write round-trip tests for all new fields

    - Test swimming fields preservation (pool length within ±0.01m tolerance)
    - Test calorie duration preservation (exact values)
    - Test power duration preservation (within ±1W tolerance)
    - Test repeat conditional preservation (within specified tolerances)
    - Test with real FIT files containing these fields
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6_

  - [x] 7.4 Create test fixtures for new field types
    - Build fixtures for workouts with subSport (already exists, verify completeness)
    - Build fixtures for workout steps with notes
    - Build fixtures for swimming workouts (poolLength, equipment)
    - Build fixtures for advanced duration types (calories, power, repeat conditionals)
    - Ensure fixtures use faker for realistic data
    - _Requirements: 8.2, 9.6_

- [ ] 8. Update documentation and finalize

  - [x] 8.1 Update JSON Schema generation

    - Regenerate JSON Schema from updated Zod schemas
    - Verify all new fields are included (subSport, notes, poolLength, poolLengthUnit, equipment)
    - Verify new duration types are included in schema
    - Run `pnpm -r build` to trigger schema generation
    - _Requirements: 8.1, 8.4_

  - [x] 8.2 Update naming consistency

    - Verify `heart_rate_greater_than` is correctly named `repeat_until_heart_rate_greater_than` in duration schema
    - Update all tests using old naming (if any exist)
    - Update all fixtures using old naming (if any exist)
    - Update any example KRD files in documentation
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 8.3 Verify backward compatibility

    - Run full test suite to ensure all existing tests pass
    - Test that KRD files without new fields still work
    - Test that FIT files without new fields still work
    - Verify no breaking changes to existing API
    - Confirm optional fields are truly optional (omitted, not null)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 8.4 Update project documentation
    - Update README with new field support
    - Add examples of new fields in documentation
    - Document swimming-specific fields
    - Document advanced duration types
    - Update CHANGELOG with new features
    - _Requirements: 7.5, 8.3_
