# Implementation Plan: FIT ↔ KRD Bidirectional Conversion

## TDD Workflow

Each task follows Test-Driven Development:

1. Write test with fixtures/mocks
2. Run test (should fail - red)
3. Implement minimal code to pass
4. Refactor if needed
5. Commit (functional commit)

## Current Status

**Completed:**

- ✅ Project structure and test infrastructure
- ✅ KRD domain types (KRD, KRDMetadata, KRDSession, KRDLap, KRDRecord, KRDEvent)
- ✅ KRD fixtures with faker + rosie
- ✅ Logger port interface
- ✅ Test helpers (mock logger)

**In Progress:**

- 🔄 Console logger adapter (needs tests and implementation)

**Next Steps:**

- Workout domain types (WorkoutStep, RepetitionBlock, Duration, Target)
- Error types and factories
- Zod schema and validation
- FIT adapters (reader/writer)
- Use cases and DI provider

## Tasks

- [x] 1. Set up project structure and test infrastructure

  - Create directory structure (domain, application, ports, adapters)
  - Install dependencies (zod, zod-to-json-schema, @garmin/fitsdk, faker, rosie, vitest)
  - Configure vitest with co-located tests (file.ts → file.test.ts)
  - Create fixtures structure in src/tests/fixtures/
  - Create helpers structure in src/tests/helpers/
  - _Requirements: 17.5_
  - _Commit: "chore: set up project structure and test infrastructure"_

- [ ] 2. Migrate to Zod schemas (Schema-First Approach)

  - [x] 2.1 Create domain/schemas directory structure
    - Create domain/schemas/ directory
    - Move existing fixtures to use schema imports (will be updated in subsequent tasks)
    - _Requirements: 1.3_
    - _Commit: "refactor: create schemas directory structure"_
  - [x] 2.2 Implement Duration Zod schema
    - Create domain/schemas/duration.ts with durationSchema using z.discriminatedUnion
    - Define time, distance, and open duration variants
    - Export Duration type using z.infer
    - Remove domain/types/duration.ts (enum-based approach)
    - Create duration.fixtures.ts to import from schemas and validate with .after() hook
    - DO NOT create tests for schemas (TypeScript validates types at compile time)
    - DO NOT create tests for fixtures (they are test utilities, not production code)
    - _Requirements: 2.1, 2.2, 2.5_
    - _Commit: "refactor: migrate Duration to Zod schema"_
  - [ ] 2.3 Implement Target Zod schema
    - Create domain/schemas/target.ts with targetSchema using z.discriminatedUnion
    - Define power, heart_rate, cadence, pace, and open target variants
    - Define nested value schemas (powerValueSchema, heartRateValueSchema, etc.)
    - Export Target and value types using z.infer
    - Remove domain/types/target.ts (enum-based approach)
    - Create target.fixtures.ts to import from schemas and validate with .after() hook
    - DO NOT create tests for schemas (TypeScript validates types at compile time)
    - DO NOT create tests for fixtures (they are test utilities, not production code)
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 5.1, 5.1.2_
    - _Commit: "refactor: migrate Target to Zod schema"_
  - [ ] 2.4 Implement Workout Zod schema
    - Create domain/schemas/workout.ts with workoutSchema, workoutStepSchema, repetitionBlockSchema
    - Compose with durationSchema and targetSchema
    - Export Workout, WorkoutStep, RepetitionBlock types using z.infer
    - Remove domain/types/workout.ts (manual type approach)
    - Update workout.fixtures.ts to import from schemas and validate with .after() hook
    - DO NOT create tests for schemas (TypeScript validates types at compile time)
    - DO NOT create tests for fixtures (they are test utilities, not production code)
    - _Requirements: 6.1, 6.2, 7.1, 7.2_
    - _Commit: "refactor: migrate Workout to Zod schema"_
  - [ ] 2.5 Implement KRD Zod schema
    - Create domain/schemas/krd.ts with krdSchema and component schemas
    - Define krdMetadataSchema, krdSessionSchema, krdLapSchema, krdRecordSchema, krdEventSchema
    - Export KRD and component types using z.infer
    - Remove domain/types/krd.ts (manual type approach)
    - Update krd.fixtures.ts to import from schemas and validate with .after() hook
    - DO NOT create tests for schemas (TypeScript validates types at compile time)
    - DO NOT create tests for fixtures (they are test utilities, not production code)
    - _Requirements: 1.2, 8.1_
    - _Commit: "refactor: migrate KRD to Zod schema"_

- [ ] 3. Create error types

  - [ ] 3.1 Implement error types and factories
    - Define FitParsingError, KrdValidationError, ToleranceExceededError types in domain/types/errors.ts
    - Create factory functions: createFitParsingError, createKrdValidationError, createToleranceExceededError
    - _Requirements: 9.1, 9.3, 9.4, 9.5_
    - _Commit: "feat: add error types and factories"_

- [x] 4. Implement logger port and adapter

  - [x] 4.1 Write tests for logger interface
    - Test logger contract (debug, info, warn, error)
    - _Requirements: 9.2_
  - [x] 4.2 Implement logger port
    - Define Logger type
    - _Requirements: 9.2_
    - _Commit: "feat: add logger port"_
  - [ ] 4.3 Implement console logger adapter
    - Create adapters/logger/console-logger.ts with createConsoleLogger factory
    - Write co-located tests in console-logger.test.ts
    - _Requirements: 9.2_
    - _Commit: "feat: add console logger adapter"_

- [ ] 5. Implement schema validation and JSON generation

  - [ ] 5.1 Implement schema validator
    - Create domain/validation/schema-validator.ts
    - Import krdSchema from domain/schemas/krd.ts
    - Define ValidationError type and SchemaValidator type
    - Implement createSchemaValidator factory with logger injection
    - Use krdSchema.safeParse() for validation
    - Write co-located tests in schema-validator.test.ts (valid/invalid KRD, error mapping)
    - _Requirements: 1.3, 1.5, 9.3_
    - _Commit: "feat: add schema validator using Zod"_
  - [ ] 5.2 Create JSON Schema generation script
    - Write scripts/generate-schema.ts using zod-to-json-schema
    - Import krdSchema from domain/schemas/krd.ts
    - Generate packages/core/schema/workout.json from Zod schema
    - Add "generate:schema" and "prebuild" scripts to package.json
    - Test that JSON Schema is generated correctly
    - _Requirements: 1.4_
    - _Commit: "feat: add JSON Schema generation from Zod"_

- [ ] 6. Implement tolerance checker

  - [ ] 6.1 Implement tolerance checker
    - Create domain/validation/tolerance-checker.ts
    - Define ToleranceConfig, ToleranceViolation, ToleranceChecker types
    - Implement createToleranceChecker factory with DEFAULT_TOLERANCES
    - Implement check functions (time, distance, power, HR, cadence, pace)
    - Write co-located tests in tolerance-checker.test.ts (within/exceeding tolerance, edge cases)
    - _Requirements: 2.3, 2.4, 3.4, 3.5, 4.3, 5.2, 5.1.3_
    - _Commit: "feat: add tolerance checker"_

- [ ] 7. Add test fixtures to repository

  - Copy WorkoutCustomTargetValues.fit to src/**fixtures**/fit-files/
  - Copy WorkoutIndividualSteps.fit to src/**fixtures**/fit-files/
  - Copy WorkoutRepeatGreaterThanStep.fit to src/**fixtures**/fit-files/
  - Copy WorkoutRepeatSteps.fit to src/**fixtures**/fit-files/
  - _Requirements: 17.1, 17.2, 17.3, 17.4_
  - _Commit: "test: add FIT test fixtures"_

- [ ] 8. Implement FIT reader adapter (FIT → KRD)

  - [ ] 8.1 Create FIT reader port
    - Create ports/fit-reader.ts with FitReader type
    - Define readToKRD contract
    - _Requirements: 1.1_
    - _Commit: "feat: add FIT reader port"_
  - [ ] 8.2 Implement FIT reader adapter skeleton
    - Create adapters/fit/garmin-fitsdk.ts
    - Implement createGarminFitSdkReader factory with logger injection
    - Implement readToKRD using @garmin/fitsdk Decoder
    - Handle errors with createFitParsingError
    - Write co-located tests in garmin-fitsdk.test.ts (valid buffer, corrupted files, logger)
    - _Requirements: 1.1, 9.1_
    - _Commit: "feat: add FIT reader adapter skeleton"_
  - [ ] 8.3 Implement FIT message to KRD conversion
    - Implement convertMessagesToKRD function in garmin-fitsdk.ts
    - Extract workout messages to KRD metadata
    - Convert workout_step messages to KRD steps
    - Handle repetition blocks
    - Preserve step order
    - Add tests for message conversion, metadata extraction, step order, repetitions
    - _Requirements: 1.2, 6.1, 6.2, 7.1, 7.2, 8.1, 8.2, 8.3_
    - _Commit: "feat: implement FIT message to KRD conversion"_
  - [ ] 8.4 Implement duration conversion (FIT → KRD)
    - Add duration conversion functions to garmin-fitsdk.ts
    - Convert FIT time to seconds
    - Convert FIT distance to meters
    - Handle open durations
    - Add tests for time, distance, and open duration conversions
    - _Requirements: 2.1, 2.2, 2.5_
    - _Commit: "feat: implement FIT duration conversion"_
  - [ ] 8.5 Implement target conversion (FIT → KRD)
    - Add target conversion functions to garmin-fitsdk.ts
    - Convert power targets (watts, %FTP, zones)
    - Convert heart rate targets (bpm, zones, %max)
    - Convert cadence targets (rpm, ranges, handle running spm/2)
    - Convert pace targets (m/s, zones)
    - Add tests for all target types and conversions
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.4, 4.5, 5.1, 5.1.2, 5.1.4, 5.4_
    - _Commit: "feat: implement FIT target conversion"_
  - [ ] 8.6 Implement FIT extensions preservation
    - Add extension handling to convertMessagesToKRD
    - Store developer fields in extensions.fit
    - Store unknown message types in extensions.fit
    - Add tests for developer fields and unknown messages
    - _Requirements: 10.1, 10.2, 10.3_
    - _Commit: "feat: preserve FIT extensions in KRD"_

- [ ] 9. Implement FIT writer adapter (KRD → FIT)

  - [ ] 9.1 Create FIT writer port
    - Create ports/fit-writer.ts with FitWriter type
    - Define writeFromKRD contract
    - _Requirements: 11.2_
    - _Commit: "feat: add FIT writer port"_
  - [ ] 9.2 Implement FIT writer adapter skeleton
    - Add createGarminFitSdkWriter factory to adapters/fit/garmin-fitsdk.ts
    - Implement writeFromKRD using @garmin/fitsdk Encoder
    - Handle errors with createFitParsingError
    - Inject logger
    - Add tests for valid KRD, error handling, logger injection
    - _Requirements: 11.2, 11.5_
    - _Commit: "feat: add FIT writer adapter skeleton"_
  - [ ] 9.3 Implement KRD to FIT message conversion
    - Implement convertKRDToMessages function in garmin-fitsdk.ts
    - Convert KRD metadata to workout messages
    - Convert KRD steps to workout_step messages
    - Encode repetition blocks
    - Add tests for metadata, steps, and repetition encoding
    - _Requirements: 11.3, 11.4_
    - _Commit: "feat: implement KRD to FIT message conversion"_
  - [ ] 9.4 Implement duration conversion (KRD → FIT)
    - Add duration conversion functions to garmin-fitsdk.ts
    - Convert seconds to FIT time format
    - Convert meters to FIT distance format
    - Handle open durations
    - Add tests for all duration conversions
    - _Requirements: 12.1, 12.2, 12.5_
    - _Commit: "feat: implement KRD duration conversion"_
  - [ ] 9.5 Implement target conversion (KRD → FIT)
    - Add target conversion functions to garmin-fitsdk.ts
    - Convert power targets to FIT format
    - Convert heart rate targets to FIT format
    - Convert cadence targets to FIT format
    - Convert pace targets to FIT format
    - Add tests for all target conversions
    - _Requirements: 13.1, 13.2, 13.3, 14.1, 14.2, 14.5_
    - _Commit: "feat: implement KRD target conversion"_
  - [ ] 9.6 Implement FIT extensions restoration
    - Add extension restoration to convertKRDToMessages
    - Restore developer fields from extensions.fit
    - Restore unknown message types from extensions.fit
    - Add tests for extension restoration
    - _Requirements: 10.1, 10.2, 10.3_
    - _Commit: "feat: restore FIT extensions from KRD"_

- [ ] 10. Implement use cases

  - [ ] 10.1 Implement ConvertFitToKrd use case
    - Create application/use-cases/convert-fit-to-krd.ts
    - Define ConvertFitToKrd type and createConvertFitToKrd factory
    - Compose FitReader and SchemaValidator
    - Handle validation errors with createKrdValidationError
    - Inject logger
    - Write co-located tests with mocks (execute, validation errors, logger)
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
    - _Commit: "feat: add ConvertFitToKrd use case"_
  - [ ] 10.2 Implement ConvertKrdToFit use case
    - Create application/use-cases/convert-krd-to-fit.ts
    - Define ConvertKrdToFit type and createConvertKrdToFit factory
    - Compose FitWriter and SchemaValidator
    - Pre-validate KRD before conversion
    - Handle validation errors with createKrdValidationError
    - Inject logger
    - Write co-located tests with mocks (execute, pre-validation, errors, logger)
    - _Requirements: 11.1, 11.2, 11.3_
    - _Commit: "feat: add ConvertKrdToFit use case"_
  - [ ] 10.3 Implement ValidateRoundTrip use case
    - Create application/use-cases/validate-round-trip.ts
    - Define ValidateRoundTrip type and createValidateRoundTrip factory
    - Implement validateFitToKrdToFit function
    - Implement validateKrdToFitToKrd function
    - Implement compareKRDs helper with tolerance checking
    - Inject logger
    - Write co-located tests with mocks (both directions, compareKRDs, violations, logger)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_
    - _Commit: "feat: add ValidateRoundTrip use case"_

- [ ] 11. Implement dependency injection provider

  - [ ] 11.1 Implement createDefaultProviders
    - Create application/providers.ts
    - Define Providers type with all components
    - Implement createDefaultProviders factory function
    - Wire all adapters, validators, and use cases
    - Support optional logger injection (default to console logger)
    - Write co-located tests in providers.test.ts (component creation, wiring, logger injection)
    - _Requirements: 1.1, 1.2, 11.1, 11.2_
    - _Commit: "feat: add dependency injection provider"_

- [ ] 12. Integration tests with real fixtures

  - [ ] 12.1 Write FIT → KRD integration tests
    - Create src/tests/integration/fit-to-krd.test.ts
    - Test with WorkoutIndividualSteps.fit
    - Test with WorkoutRepeatSteps.fit
    - Test with WorkoutRepeatGreaterThanStep.fit
    - Test with WorkoutCustomTargetValues.fit
    - Verify complete KRD structure for each fixture
    - _Requirements: 6.5, 7.4, 16.1, 16.2_
  - [ ] 12.2 Write KRD → FIT integration tests
    - Create src/tests/integration/krd-to-fit.test.ts
    - Test with generated KRD documents using fixtures
    - Verify FIT file can be parsed by @garmin/fitsdk
    - _Requirements: 11.1, 11.2_
  - [ ] 12.3 Write round-trip tests (FIT → KRD → FIT)
    - Create src/tests/round-trip/fit-krd-fit.test.ts
    - Test with all 4 fixtures
    - Verify tolerance compliance for all conversions
    - Test mixed interval types (time/distance)
    - Test mixed target types (power/HR/cadence/pace)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 16.1, 16.2, 16.3, 16.4, 16.5_
  - [ ] 12.4 Write round-trip tests (KRD → FIT → KRD)
    - Create src/tests/round-trip/krd-fit-krd.test.ts
    - Test with generated KRD documents using fixtures
    - Verify tolerance compliance
    - _Requirements: 15.5, 15.6_
  - _Commit: "test: add integration and round-trip tests"_

- [ ] 13. Export public API
  - Update src/index.ts with public exports
  - Export domain types (KRD, KRDMetadata, Workout, Duration, Target, etc.)
  - Export error types and factories
  - Export use case types (ConvertFitToKrd, ConvertKrdToFit, ValidateRoundTrip)
  - Export createDefaultProviders factory
  - Export Logger type for custom implementations
  - Verify all components are accessible
  - _Requirements: 1.1, 1.2, 11.1, 11.2_
  - _Commit: "feat: export public API"_
