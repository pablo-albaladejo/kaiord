# Implementation Plan: FIT ↔ KRD Bidirectional Conversion

## TDD Workflow

Each task follows Test-Driven Development:

1. Write test with fixtures/mocks
2. Run test (should fail - red)
3. Implement minimal code to pass
4. Refactor if needed
5. Commit (functional commit)

## Tasks

- [x] 1. Set up project structure and test infrastructure

  - Create directory structure (domain, application, ports, adapters)
  - Install dependencies (zod, zod-to-json-schema, @garmin/fitsdk, faker, rosie, vitest)
  - Configure vitest with co-located tests (file.ts → file.test.ts)
  - Create fixtures structure in src/tests/fixtures/
  - Create helpers structure in src/tests/helpers/
  - _Requirements: 17.5_
  - _Commit: "chore: set up project structure and test infrastructure"_

- [ ] 2. Create domain types

  - [x] 2.1 Write tests for KRD types
    - Create KRD type fixtures with faker + rosie
    - Test type structure and constraints
    - _Requirements: 1.2, 8.1_
  - [ ] 2.2 Implement KRD types
    - Define KRD, KRDMetadata, KRDSession, KRDLap, KRDRecord, KRDEvent types
    - _Requirements: 1.2, 8.1_
    - _Commit: "feat: add KRD domain types"_
  - [ ] 2.3 Write tests for Workout types
    - Create Workout, WorkoutStep, RepetitionBlock fixtures
    - _Requirements: 6.1, 6.2, 7.1, 7.2_
  - [ ] 2.4 Implement Workout types
    - Define Workout, WorkoutStep, RepetitionBlock types
    - _Requirements: 6.1, 6.2, 7.1, 7.2_
    - _Commit: "feat: add Workout domain types"_
  - [ ] 2.5 Write tests for Duration types
    - Create Duration fixtures for time, distance, open
    - _Requirements: 2.1, 2.2, 2.5_
  - [ ] 2.6 Implement Duration types
    - Define DurationType enum and Duration union type
    - _Requirements: 2.1, 2.2, 2.5_
    - _Commit: "feat: add Duration domain types"_
  - [ ] 2.7 Write tests for Target types
    - Create Target fixtures for power, HR, cadence, pace
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 5.1, 5.1.2_
  - [ ] 2.8 Implement Target types
    - Define TargetType enum and Target union types
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 5.1, 5.1.2_
    - _Commit: "feat: add Target domain types"_

- [ ] 3. Create error types

  - [ ] 3.1 Write tests for error factory functions
    - Test createFitParsingError, createKrdValidationError, createToleranceExceededError
    - _Requirements: 9.1, 9.3, 9.4, 9.5_
  - [ ] 3.2 Implement error types and factories
    - Define error types and factory functions
    - _Requirements: 9.1, 9.3, 9.4, 9.5_
    - _Commit: "feat: add error types and factories"_

- [ ] 4. Implement logger port and adapter

  - [ ] 4.1 Write tests for logger interface
    - Test logger contract (debug, info, warn, error)
    - _Requirements: 9.2_
  - [ ] 4.2 Implement logger port
    - Define Logger type
    - _Requirements: 9.2_
    - _Commit: "feat: add logger port"_
  - [ ] 4.3 Write tests for console logger
    - Test console logger implementation
    - _Requirements: 9.2_
  - [ ] 4.4 Implement console logger adapter
    - Create createConsoleLogger factory
    - _Requirements: 9.2_
    - _Commit: "feat: add console logger adapter"_

- [ ] 5. Implement Zod schema and validation

  - [ ] 5.1 Write tests for Zod schema
    - Test schema validation with valid KRD documents
    - Test schema validation with invalid documents
    - Test error message formatting
    - _Requirements: 1.3, 1.5, 9.3_
  - [ ] 5.2 Implement Zod schema
    - Define complete krdSchema with all fields and constraints
    - Export schema for JSON generation
    - _Requirements: 1.3_
    - _Commit: "feat: add Zod schema for KRD"_
  - [ ] 5.3 Write tests for schema validator
    - Test createSchemaValidator factory
    - Test validation with logger injection
    - Test error mapping
    - _Requirements: 1.3, 1.5, 9.3_
  - [ ] 5.4 Implement schema validator
    - Create createSchemaValidator factory function
    - Map Zod errors to ValidationError type
    - Inject logger for validation logging
    - _Requirements: 1.3, 1.5, 9.3_
    - _Commit: "feat: add schema validator with Zod"_
  - [ ] 5.5 Create JSON Schema generation script
    - Write script using zod-to-json-schema
    - Generate packages/core/schema/workout.json
    - Add prebuild hook to package.json
    - _Requirements: 1.4_
    - _Commit: "feat: add JSON Schema generation from Zod"_

- [ ] 6. Implement tolerance checker

  - [ ] 6.1 Write tests for tolerance checker
    - Test each check function (time, distance, power, HR, cadence, pace)
    - Test within tolerance (should return null)
    - Test exceeding tolerance (should return violation)
    - Test edge cases and boundaries
    - _Requirements: 2.3, 2.4, 3.4, 3.5, 4.3, 5.2, 5.1.3_
  - [ ] 6.2 Implement tolerance checker
    - Create createToleranceChecker factory
    - Implement check functions with DEFAULT_TOLERANCES
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

  - [ ] 8.1 Write tests for FIT reader factory
    - Test createGarminFitSdkReader with mock Decoder
    - Test readToKRD with valid FIT buffer
    - Test error handling for corrupted files
    - Test logger injection
    - _Requirements: 1.1, 9.1_
  - [ ] 8.2 Implement FIT reader factory
    - Create createGarminFitSdkReader factory
    - Implement readToKRD using @garmin/fitsdk Decoder
    - Handle errors with createFitParsingError
    - Inject logger
    - _Requirements: 1.1, 9.1_
    - _Commit: "feat: add FIT reader adapter skeleton"_
  - [ ] 8.3 Write tests for FIT message conversion
    - Test convertMessagesToKRD with workout messages
    - Test metadata extraction
    - Test step order preservation
    - Test repetition block handling
    - _Requirements: 1.2, 6.1, 6.2, 7.1, 7.2, 8.1, 8.2, 8.3_
  - [ ] 8.4 Implement FIT message conversion
    - Implement convertMessagesToKRD function
    - Extract workout messages to KRD metadata
    - Convert workout_step messages to KRD steps
    - Handle repetition blocks
    - _Requirements: 1.2, 6.1, 6.2, 7.1, 7.2, 8.1, 8.2, 8.3_
    - _Commit: "feat: implement FIT message to KRD conversion"_
  - [ ] 8.5 Write tests for duration conversion (FIT → KRD)
    - Test time-based duration conversion
    - Test distance-based duration conversion
    - Test open-ended duration handling
    - _Requirements: 2.1, 2.2, 2.5_
  - [ ] 8.6 Implement duration conversion (FIT → KRD)
    - Convert FIT time to seconds
    - Convert FIT distance to meters
    - Handle open durations
    - _Requirements: 2.1, 2.2, 2.5_
    - _Commit: "feat: implement FIT duration conversion"_
  - [ ] 8.7 Write tests for target conversion (FIT → KRD)
    - Test power target conversion (watts, %FTP, zones)
    - Test heart rate target conversion (bpm, zones, %max)
    - Test cadence target conversion (rpm, ranges)
    - Test pace target conversion (m/s, zones)
    - Test running cadence conversion (spm/2)
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.4, 4.5, 5.1, 5.1.2, 5.1.4, 5.4_
  - [ ] 8.8 Implement target conversion (FIT → KRD)
    - Convert power targets
    - Convert heart rate targets
    - Convert cadence targets (handle running spm/2)
    - Convert pace targets
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.4, 4.5, 5.1, 5.1.2, 5.1.4, 5.4_
    - _Commit: "feat: implement FIT target conversion"_
  - [ ] 8.9 Write tests for FIT extensions preservation
    - Test developer fields storage
    - Test unknown message types storage
    - _Requirements: 10.1, 10.2, 10.3_
  - [ ] 8.10 Implement FIT extensions preservation
    - Store developer fields in extensions.fit
    - Store unknown message types in extensions.fit
    - _Requirements: 10.1, 10.2, 10.3_
    - _Commit: "feat: preserve FIT extensions in KRD"_

- [ ] 9. Implement FIT writer adapter (KRD → FIT)

  - [ ] 9.1 Write tests for FIT writer factory
    - Test createGarminFitSdkWriter with mock Encoder
    - Test writeFromKRD with valid KRD
    - Test error handling
    - Test logger injection
    - _Requirements: 11.2, 11.5_
  - [ ] 9.2 Implement FIT writer factory
    - Create createGarminFitSdkWriter factory
    - Implement writeFromKRD using @garmin/fitsdk Encoder
    - Handle errors with createFitParsingError
    - Inject logger
    - _Requirements: 11.2, 11.5_
    - _Commit: "feat: add FIT writer adapter skeleton"_
  - [ ] 9.3 Write tests for KRD to FIT message conversion
    - Test convertKRDToMessages with KRD documents
    - Test metadata to workout message conversion
    - Test step to workout_step message conversion
    - Test repetition block encoding
    - _Requirements: 11.3, 11.4_
  - [ ] 9.4 Implement KRD to FIT message conversion
    - Implement convertKRDToMessages function
    - Convert KRD metadata to workout messages
    - Convert KRD steps to workout_step messages
    - Encode repetition blocks
    - _Requirements: 11.3, 11.4_
    - _Commit: "feat: implement KRD to FIT message conversion"_
  - [ ] 9.5 Write tests for duration conversion (KRD → FIT)
    - Test seconds to FIT time format
    - Test meters to FIT distance format
    - Test open duration handling
    - _Requirements: 12.1, 12.2, 12.5_
  - [ ] 9.6 Implement duration conversion (KRD → FIT)
    - Convert seconds to FIT time
    - Convert meters to FIT distance
    - Handle open durations
    - _Requirements: 12.1, 12.2, 12.5_
    - _Commit: "feat: implement KRD duration conversion"_
  - [ ] 9.7 Write tests for target conversion (KRD → FIT)
    - Test power target conversion to FIT
    - Test heart rate target conversion to FIT
    - Test cadence target conversion to FIT
    - Test pace target conversion to FIT
    - _Requirements: 13.1, 13.2, 13.3, 14.1, 14.2, 14.5_
  - [ ] 9.8 Implement target conversion (KRD → FIT)
    - Convert power targets to FIT format
    - Convert heart rate targets to FIT format
    - Convert cadence targets to FIT format
    - Convert pace targets to FIT format
    - _Requirements: 13.1, 13.2, 13.3, 14.1, 14.2, 14.5_
    - _Commit: "feat: implement KRD target conversion"_
  - [ ] 9.9 Write tests for FIT extensions restoration
    - Test developer fields restoration
    - Test unknown message types restoration
    - _Requirements: 10.1, 10.2, 10.3_
  - [ ] 9.10 Implement FIT extensions restoration
    - Restore developer fields from extensions.fit
    - Restore unknown message types from extensions.fit
    - _Requirements: 10.1, 10.2, 10.3_
    - _Commit: "feat: restore FIT extensions from KRD"_

- [ ] 10. Implement use cases

  - [ ] 10.1 Write tests for ConvertFitToKrd use case
    - Test execute function with mock FitReader and SchemaValidator
    - Test validation error handling
    - Test logger injection
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  - [ ] 10.2 Implement ConvertFitToKrd use case
    - Create createConvertFitToKrd factory
    - Compose FitReader and SchemaValidator
    - Handle validation errors with createKrdValidationError
    - Inject logger
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
    - _Commit: "feat: add ConvertFitToKrd use case"_
  - [ ] 10.3 Write tests for ConvertKrdToFit use case
    - Test execute function with mock FitWriter and SchemaValidator
    - Test pre-validation
    - Test validation error handling
    - Test logger injection
    - _Requirements: 11.1, 11.2, 11.3_
  - [ ] 10.4 Implement ConvertKrdToFit use case
    - Create createConvertKrdToFit factory
    - Compose FitWriter and SchemaValidator
    - Handle validation errors with createKrdValidationError
    - Inject logger
    - _Requirements: 11.1, 11.2, 11.3_
    - _Commit: "feat: add ConvertKrdToFit use case"_
  - [ ] 10.5 Write tests for ValidateRoundTrip use case
    - Test validateFitToKrdToFit with mock adapters
    - Test validateKrdToFitToKrd with mock adapters
    - Test compareKRDs helper function
    - Test tolerance violation reporting
    - Test logger injection
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_
  - [ ] 10.6 Implement ValidateRoundTrip use case
    - Create createValidateRoundTrip factory
    - Implement validateFitToKrdToFit function
    - Implement validateKrdToFitToKrd function
    - Implement compareKRDs helper
    - Inject logger
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_
    - _Commit: "feat: add ValidateRoundTrip use case"_

- [ ] 11. Implement dependency injection provider

  - [ ] 11.1 Write tests for createDefaultProviders
    - Test provider factory creates all components
    - Test logger injection (default and custom)
    - Test component wiring
    - _Requirements: 1.1, 1.2, 11.1, 11.2_
  - [ ] 11.2 Implement createDefaultProviders
    - Create factory function
    - Wire all adapters, validators, and use cases
    - Support optional logger injection
    - _Requirements: 1.1, 1.2, 11.1, 11.2_
    - _Commit: "feat: add dependency injection provider"_

- [ ] 12. Integration tests with real fixtures

  - [ ] 12.1 Write FIT → KRD integration tests
    - Test with WorkoutIndividualSteps.fit
    - Test with WorkoutRepeatSteps.fit
    - Test with WorkoutRepeatGreaterThanStep.fit
    - Test with WorkoutCustomTargetValues.fit
    - Verify complete KRD structure
    - _Requirements: 6.5, 7.4, 16.1, 16.2_
  - [ ] 12.2 Write KRD → FIT integration tests
    - Test with generated KRD documents
    - Verify FIT file can be parsed
    - _Requirements: 11.1, 11.2_
  - [ ] 12.3 Write round-trip tests (FIT → KRD → FIT)
    - Test with all 4 fixtures
    - Verify tolerance compliance
    - Test mixed interval types
    - Test mixed target types
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 16.1, 16.2, 16.3, 16.4, 16.5_
  - [ ] 12.4 Write round-trip tests (KRD → FIT → KRD)
    - Test with generated KRD documents
    - Verify tolerance compliance
    - _Requirements: 15.5, 15.6_
  - _Commit: "test: add integration and round-trip tests"_

- [ ] 13. Export public API
  - Create index.ts with public exports
  - Export types, factories, and use cases
  - Verify all components are accessible
  - _Requirements: 1.1, 1.2, 11.1, 11.2_
  - _Commit: "feat: export public API"_
