# Implementation Plan

- [x] 1. Create domain schema files for KRD format

  - Create Zod enum schemas for core domain concepts in snake_case format
  - Export inferred TypeScript types from each schema
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 12.1, 12.4, 13.1_

- [x] 1.1 Create sport schema in domain/schemas/sport.ts

  - Define `sportEnum` with z.enum() containing: "cycling", "running", "swimming", "generic"
  - Export `Sport` type using z.infer
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.2 Create sub-sport schema in domain/schemas/sub-sport.ts

  - Define `subSportEnum` with all 60+ sub-sport values in snake_case
  - Include values like "indoor_cycling", "hand_cycling", "lap_swimming", etc.
  - Export `SubSport` type using z.infer
  - _Requirements: 2.1, 2.2, 2.6_

- [x] 1.3 Create file-type schema in domain/schemas/file-type.ts

  - Define `fileTypeEnum` with z.enum() containing: "workout", "activity", "course"
  - Export `FileType` type using z.infer
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 1.4 Create swim-stroke schema in domain/schemas/swim-stroke.ts

  - Define `swimStrokeEnum` with values: "freestyle", "backstroke", "breaststroke", "butterfly", "drill", "mixed", "im"
  - Export `SwimStroke` type using z.infer
  - Define `SWIM_STROKE_TO_FIT` mapping object for numeric conversion
  - Define `FIT_TO_SWIM_STROKE` mapping object for reverse conversion
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2. Create adapter schema files for FIT SDK format

  - Create schemas directory in adapters/fit/
  - Define Zod enum schemas for FIT-specific concepts in camelCase format
  - Export inferred TypeScript types from each schema
  - _Requirements: 1.4, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 9.1, 9.2, 9.3, 12.3, 12.4, 13.2_

- [x] 2.1 Create adapters/fit/schemas directory

  - Create new directory for FIT adapter schemas
  - _Requirements: 13.2_

- [x] 2.2 Create FIT sport schema in adapters/fit/schemas/fit-sport.ts

  - Define `fitSportEnum` with z.enum() containing: "cycling", "running", "swimming", "generic"
  - Export `FitSport` type using z.infer
  - _Requirements: 1.4_

- [x] 2.3 Create FIT sub-sport schema in adapters/fit/schemas/fit-sub-sport.ts

  - Define `fitSubSportEnum` with all 60+ sub-sport values in camelCase
  - Include values like "indoorCycling", "handCycling", "lapSwimming", etc.
  - Export `FitSubSport` type using z.infer
  - _Requirements: 2.3, 2.4, 2.7_

- [x] 2.4 Create FIT duration schema in adapters/fit/schemas/fit-duration.ts

  - Define `fitDurationTypeEnum` with values: "time", "distance", "repeatUntilStepsCmplt", "repeatUntilHrGreaterThan", "hrLessThan", "hrGreaterThan", "open"
  - Export `FitDurationType` type using z.infer
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2.5 Create FIT target schema in adapters/fit/schemas/fit-target.ts

  - Define `fitTargetTypeEnum` with values: "power", "heartRate", "cadence", "speed", "swimStroke", "open"
  - Export `FitTargetType` type using z.infer
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 2.6 Create FIT message keys schema in adapters/fit/schemas/fit-message-keys.ts

  - Define `fitMessageKeyEnum` with values: "fileIdMesgs", "workoutMesgs", "workoutStepMesgs"
  - Export `FitMessageKey` type using z.infer
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 3. Update sub-sport mapper to use Zod schemas

  - Replace constant imports with schema imports
  - Add runtime validation using safeParse()
  - Update mapping logic to use enum.enum.value
  - _Requirements: 2.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 3.1 Update sub-sport.mapper.ts imports and types

  - Import `subSportEnum` and `SubSport` from domain/schemas/sub-sport
  - Import `fitSubSportEnum` and `FitSubSport` from adapters/fit/schemas/fit-sub-sport
  - Update mapping object types to use `Record<FitSubSport, SubSport>`
  - _Requirements: 10.1, 10.3_

- [x] 3.2 Add validation to mapSubSportToKrd function

  - Use `fitSubSportEnum.safeParse()` to validate input
  - Return `subSportEnum.enum.generic` for invalid values
  - Use validated value for mapping lookup
  - _Requirements: 10.2, 10.5_

- [x] 3.3 Add validation to mapSubSportToFit function

  - Use `subSportEnum.safeParse()` to validate input
  - Return `fitSubSportEnum.enum.generic` for invalid values
  - Use validated value for mapping lookup
  - _Requirements: 10.2, 10.5_

- [x] 3.4 Update sub-sport mapper tests

  - Add tests for validation with invalid inputs
  - Verify generic fallback behavior
  - Ensure existing round-trip tests still pass
  - _Requirements: 15.3, 15.4_

- [x] 4. Update duration converter to use Zod schemas

  - Replace FIT_DURATION_TYPE constant with fitDurationTypeEnum
  - Add validation at adapter boundary
  - Update all duration type comparisons
  - _Requirements: 3.5, 10.1, 10.2, 10.3, 10.5_

- [x] 4.1 Update duration.converter.ts imports

  - Import `fitDurationTypeEnum` from adapters/fit/schemas/fit-duration
  - Import `durationTypeEnum` from domain/schemas/duration
  - Remove import of `FIT_DURATION_TYPE` from constants
  - _Requirements: 10.1_

- [x] 4.2 Add validation to convertFitDuration function

  - Use `fitDurationTypeEnum.safeParse()` to validate durationType
  - Return open duration for invalid values
  - Update all duration type comparisons to use `fitDurationTypeEnum.enum.value`
  - _Requirements: 10.2, 10.3, 10.5_

- [x] 4.3 Update duration converter tests

  - Add tests for validation with invalid duration types
  - Verify open duration fallback behavior
  - Ensure existing conversion tests still pass
  - _Requirements: 15.3, 15.4_

- [x] 5. Update target mappers to use Zod schemas

  - Replace FIT_TARGET_TYPE and KRD_TARGET_TYPE constants with schemas
  - Update all target type comparisons
  - Update target unit comparisons
  - _Requirements: 4.5, 5.3, 10.1, 10.2, 10.3, 10.5_

- [x] 5.1 Update krd-to-fit-target.mapper.ts

  - Import `fitTargetTypeEnum` from adapters/fit/schemas/fit-target
  - Import `targetTypeEnum` from domain/schemas/target
  - Update all target type comparisons to use `enum.enum.value`
  - _Requirements: 10.1, 10.3_

- [x] 5.2 Update krd-to-fit-target-power.mapper.ts

  - Import schemas instead of constants
  - Update target type and unit comparisons to use `enum.enum.value`
  - _Requirements: 10.1, 10.3_

- [x] 5.3 Update krd-to-fit-target-heart-rate.mapper.ts

  - Import schemas instead of constants
  - Update target type and unit comparisons to use `enum.enum.value`
  - _Requirements: 10.1, 10.3_

- [x] 5.4 Update krd-to-fit-target-cadence.mapper.ts

  - Import schemas instead of constants
  - Update target type and unit comparisons to use `enum.enum.value`
  - _Requirements: 10.1, 10.3_

- [x] 5.5 Update krd-to-fit-target-pace.mapper.ts

  - Import schemas instead of constants
  - Update target type and unit comparisons to use `enum.enum.value`
  - _Requirements: 10.1, 10.3_

- [x] 5.6 Update target mapper tests

  - Verify all target type conversions still work
  - Ensure existing tests pass without modification
  - _Requirements: 15.3, 15.4_

- [x] 6. Update step and workout mappers to use Zod schemas

  - Replace duration and target constants with schemas
  - Update message key access
  - _Requirements: 10.1, 10.3, 10.5_

- [x] 6.1 Update krd-to-fit-step.mapper.ts

  - Import `fitDurationTypeEnum` from adapters/fit/schemas/fit-duration
  - Import `fitMessageKeyEnum` from adapters/fit/schemas/fit-message-keys
  - Update duration type assignments to use `fitDurationTypeEnum.enum.value`
  - _Requirements: 10.1, 10.3_

- [x] 6.2 Update krd-to-fit-workout.mapper.ts

  - Import schemas instead of constants
  - Update duration and target type assignments
  - Update message key access if needed
  - _Requirements: 10.1, 10.3_

- [x] 6.3 Update workout/workout.mapper.ts

  - Import `fitDurationTypeEnum` from adapters/fit/schemas/fit-duration
  - Update duration type comparisons to use `fitDurationTypeEnum.enum.value`
  - _Requirements: 10.1, 10.3_

- [x] 6.4 Update step and workout mapper tests

  - Verify all conversions still work correctly
  - Ensure existing round-trip tests pass
  - _Requirements: 15.3, 15.4, 15.5_

- [x] 7. Update types.ts to use schema for FIT message keys

  - Replace FIT_MESSAGE_KEY type import with fitMessageKeyEnum
  - Update FitMessages type definition
  - _Requirements: 9.4, 10.1_

- [x] 7.1 Update adapters/fit/types.ts

  - Import `fitMessageKeyEnum` from ./schemas/fit-message-keys
  - Update `FitMessages` type to use inferred type if needed
  - Remove import of `FIT_MESSAGE_KEY` from constants
  - _Requirements: 9.4, 10.1_

- [x] 8. Remove obsolete constants files

  - Delete constants.ts after verifying no imports remain
  - Delete sub-sport constants files
  - Update sub-sport.ts exports
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 8.1 Verify no imports from constants files remain

  - Search codebase for imports from constants.ts
  - Search for imports from sub-sport-fit.constants.ts
  - Search for imports from sub-sport-krd.constants.ts
  - Ensure all mappers have been updated
  - _Requirements: 11.4_

- [x] 8.2 Delete adapters/fit/constants.ts

  - Remove the main constants file
  - _Requirements: 11.1_

- [x] 8.3 Delete adapters/fit/sub-sport-fit.constants.ts

  - Remove FIT sub-sport constants file
  - _Requirements: 11.2_

- [x] 8.4 Delete adapters/fit/sub-sport-krd.constants.ts

  - Remove KRD sub-sport constants file
  - _Requirements: 11.3_

- [x] 8.5 Update adapters/fit/sub-sport.ts exports

  - Remove exports of constant objects
  - Export schemas and types from schema files instead
  - _Requirements: 11.4_

- [ ] 9. Run full test suite and verify

  - Run all unit tests
  - Run round-trip tests
  - Verify test coverage meets requirements
  - Check for any remaining references to old constants
  - _Requirements: 11.5, 14.1, 14.2, 14.3, 14.4, 14.5, 15.4, 15.5_

- [ ] 9.1 Run all tests and verify they pass

  - Execute `pnpm -r test` to run all tests
  - Verify no test failures
  - _Requirements: 11.5, 14.4_

- [ ] 9.2 Verify round-trip tests pass

  - Specifically check round-trip conversion tests
  - Ensure no data loss in FIT ↔ KRD conversions
  - _Requirements: 14.1, 14.2, 14.3_

- [ ] 9.3 Check test coverage

  - Run coverage report
  - Verify overall coverage ≥ 80%
  - Verify mapper coverage ≥ 90%
  - _Requirements: 15.4, 15.5_

- [ ] 9.4 Verify no remaining constant references

  - Search for `FIT_DURATION_TYPE`, `FIT_TARGET_TYPE`, `FIT_SPORT_TYPE`
  - Search for `KRD_TARGET_TYPE`, `KRD_TARGET_UNIT`
  - Search for `FIT_SUB_SPORT`, `KRD_SUB_SPORT`
  - Ensure all have been replaced with schema references
  - _Requirements: 11.4_

- [ ] 10. Update documentation
  - Update architecture steering rules to document schema organization
  - Update code-style guide with schema naming conventions
  - Add examples of schema usage to zod-patterns guide
  - _Requirements: 13.5_
