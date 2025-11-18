# Implementation Plan: Zwift ↔ KRD Bidirectional Conversion

## Overview

This feature enables bidirectional conversion between Zwift workout files (.zwo format) and KRD format. Zwift is an XML-based format used by the Zwift virtual cycling and running platform. The implementation follows hexagonal architecture and reuses domain schemas and validation from the FIT and TCX conversion implementations.

## Prerequisites

- ✅ FIT ↔ KRD conversion complete (domain schemas, validation, error types)
- ✅ TCX ↔ KRD conversion complete (XML parsing patterns, XSD validation)
- ✅ Zod schemas for KRD, Workout, Duration, Target
- ✅ SchemaValidator and ToleranceChecker implemented
- ✅ Logger port and console adapter implemented

## TDD Workflow

Each task follows Test-Driven Development:

1. Write test with fixtures/mocks
2. Run test (should fail - red)
3. Implement minimal code to pass
4. Refactor if needed
5. Commit (functional commit)

## Tasks

- [x] 1. Add Zwift error types
  - [x] 1.1 Implement ZwiftParsingError type and factory
    - Add ZwiftParsingError type to domain/types/errors.ts
    - Create createZwiftParsingError factory function
    - Write co-located tests in errors.test.ts (error creation, cause preservation)
    - _Requirements: 13.1_
    - _Commit: "feat: add Zwift parsing error type"_
  - [x] 1.2 Implement ZwiftValidationError type and factory
    - Add ZwiftValidationError type to domain/types/errors.ts
    - Create createZwiftValidationError factory function
    - Include errors array with path and message for each validation error
    - Write co-located tests in errors.test.ts (error creation, errors array)
    - _Requirements: 18.2, 18.5_
    - _Commit: "feat: add Zwift validation error type"_

- [x] 2. Create Zwift adapter schemas
  - [x] 2.1 Implement Zwift sport schema
    - Create adapters/zwift/schemas/zwift-sport.ts with zwiftSportSchema
    - Define ZWIFT_TO_KRD_SPORT mapping (bike → cycling, run → running)
    - Export ZwiftSport type using z.infer
    - DO NOT create tests for schemas (TypeScript validates types)
    - _Requirements: 2.4_
    - _Commit: "feat: add Zwift sport schema"_
  - [x] 2.2 Implement Zwift interval type schema
    - Create adapters/zwift/schemas/zwift-interval.ts with zwiftIntervalTypeSchema
    - Define interval types (SteadyState, Warmup, Ramp, Cooldown, IntervalsT, FreeRide)
    - Export ZwiftIntervalType type using z.infer
    - DO NOT create tests for schemas (TypeScript validates types)
    - _Requirements: 7.1, 8.1, 9.1, 10.1_
    - _Commit: "feat: add Zwift interval type schema"_
  - [x] 2.3 Implement Zwift target schemas
    - Create adapters/zwift/schemas/zwift-target.ts
    - Define zwiftPowerTargetSchema (FTP percentage 0.0 to 3.0)
    - Define zwiftPaceTargetSchema (seconds per kilometer)
    - Define zwiftCadenceTargetSchema (RPM)
    - Export ZwiftPowerTarget, ZwiftPaceTarget, ZwiftCadenceTarget types using z.infer
    - DO NOT create tests for schemas (TypeScript validates types)
    - _Requirements: 4.1, 5.1, 6.1_
    - _Commit: "feat: add Zwift target schemas"_

- [x] 2.5. Add Zwift XSD schema
  - [x] 2.5.1 Create and add Zwift XSD schema
    - Create zwift-workout.xsd from the provided XSD schema
    - Save to packages/core/schema/zwift-workout.xsd
    - Add schema file to git repository
    - _Requirements: 18.1_
    - _Commit: "feat: add Zwift workout XSD schema"_

- [x] 2.6. Implement Zwift XSD validator
  - [x] 2.6.1 Create Zwift validator port
    - Create ports/zwift-validator.ts with ZwiftValidator type
    - Define ZwiftValidationResult type with valid flag and errors array
    - Define function signature: (xmlString: string) => Promise<ZwiftValidationResult>
    - _Requirements: 18.1_
    - _Commit: "feat: add Zwift validator port"_
  - [x] 2.6.2 Implement XSD validator adapter
    - Create adapters/zwift/xsd-validator.ts
    - Implement createXsdZwiftValidator factory with logger injection
    - Use fast-xml-parser XMLValidator for XML structure validation
    - Load XSD schema from packages/core/schema/zwift-workout.xsd
    - Return validation result with errors array
    - Write co-located tests in xsd-validator.test.ts (valid XML, invalid XML, schema violations)
    - _Requirements: 18.1, 18.2_
    - _Commit: "feat: add Zwift XSD validator adapter"_

- [x] 3. Implement Zwift reader port and adapter
  - [x] 3.1 Create Zwift reader port
    - Create ports/zwift-reader.ts with ZwiftReader type
    - Define function signature: (xmlString: string) => Promise<KRD>
    - _Requirements: 1.1_
    - _Commit: "feat: add Zwift reader port"_
  - [x] 3.2 Implement Zwift reader adapter skeleton
    - Create adapters/zwift/fast-xml-parser.ts
    - Implement createFastXmlZwiftReader factory with logger and validator injection
    - Validate XML against XSD before parsing using ZwiftValidator
    - Use fast-xml-parser XMLParser to parse XML
    - Handle validation errors with createZwiftValidationError
    - Handle parsing errors with createZwiftParsingError
    - Write co-located tests in fast-xml-parser.test.ts (valid XML, malformed XML, XSD violations, logger)
    - _Requirements: 1.1, 13.1, 18.3_
    - _Commit: "feat: add Zwift reader adapter skeleton with XSD validation"_
  - [x] 3.3 Implement Zwift to KRD conversion
    - Implement convertZwiftToKRD function in fast-xml-parser.ts
    - Extract workout_file structure
    - Convert workout metadata (name, author, description, sportType)
    - Convert tags to extensions.zwift.tags
    - Convert workout intervals
    - Preserve interval order
    - Add tests for metadata extraction, interval conversion
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 12.1_
    - _Commit: "feat: implement Zwift to KRD conversion"_

- [x] 4. Implement Zwift duration conversion
  - [x] 4.1 Implement duration mappers (Zwift → KRD)
    - Create adapters/zwift/duration/duration.mapper.ts
    - Map Duration attribute → time duration with seconds
    - Handle distance-based durations for running workouts
    - Use .safeParse() for validation with default fallback
    - DO NOT test mappers (simple data transformation, no logic)
    - _Requirements: 3.1, 3.2_
    - _Commit: "feat: add Zwift duration mappers"_
  - [x] 4.2 Implement duration converters (Zwift → KRD)
    - Create adapters/zwift/duration/duration.converter.ts
    - Convert time-based durations to seconds
    - Convert distance-based durations to meters (for running)
    - Write co-located tests in duration.converter.test.ts (time, distance, edge cases)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
    - _Commit: "feat: add Zwift duration converters"_

- [ ] 5. Implement Zwift target conversion
  - [ ] 5.1 Implement target mappers (Zwift → KRD)
    - Create adapters/zwift/target/target.mapper.ts
    - Map Power attribute → power target with percent_ftp unit
    - Map pace attribute → pace target (convert sec/km to m/s)
    - Map Cadence attribute → cadence target
    - Map FreeRide (no power) → open target
    - Use .safeParse() for validation with default fallback
    - DO NOT test mappers (simple data transformation, no logic)
    - _Requirements: 4.1, 5.1, 6.1, 10.1_
    - _Commit: "feat: add Zwift target mappers"_
  - [ ] 5.2 Implement target converters (Zwift → KRD)
    - Create adapters/zwift/target/target.converter.ts
    - Convert FTP percentage to percent_ftp (multiply by 100)
    - Convert PowerLow/PowerHigh to range targets
    - Convert pace from sec/km to m/s (1000 / secPerKm)
    - Handle running cadence (spm/2 → rpm)
    - Write co-located tests in target.converter.test.ts (power, pace, cadence, ranges)
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.4_
    - _Commit: "feat: add Zwift target converters"_

- [x] 6. Implement Zwift interval type conversion
  - [x] 6.1 Implement SteadyState mapper
    - Create adapters/zwift/interval/steady-state.mapper.ts
    - Map SteadyState to KRD step with constant power target
    - Extract Duration, Power, Cadence attributes
    - Set intensity to "active"
    - DO NOT test mappers (simple data transformation, no logic)
    - _Requirements: 7.1, 7.2, 7.3_
    - _Commit: "feat: add SteadyState interval mapper"_
  - [x] 6.2 Implement Ramp mappers (Warmup, Ramp, Cooldown)
    - Create adapters/zwift/interval/ramp.mapper.ts
    - Map Warmup to KRD step with range target and intensity "warmup"
    - Map Ramp to KRD step with range target and intensity "active"
    - Map Cooldown to KRD step with range target and intensity "cooldown"
    - Extract Duration, PowerLow, PowerHigh, Cadence attributes
    - DO NOT test mappers (simple data transformation, no logic)
    - _Requirements: 8.1, 8.2, 12.4, 12.5_
    - _Commit: "feat: add Ramp interval mappers"_
  - [x] 6.3 Implement IntervalsT mapper
    - Create adapters/zwift/interval/intervals-t.mapper.ts
    - Map IntervalsT to KRD repetition block with 2 steps
    - Extract Repeat, OnDuration, OnPower, OffDuration, OffPower attributes
    - Create "on" step with OnDuration and OnPower
    - Create "off" step with OffDuration and OffPower
    - Handle Cadence and CadenceResting attributes
    - DO NOT test mappers (simple data transformation, no logic)
    - _Requirements: 9.1, 9.2, 9.3, 9.5_
    - _Commit: "feat: add IntervalsT interval mapper"_
  - [x] 6.4 Implement FreeRide mapper
    - Create adapters/zwift/interval/free-ride.mapper.ts
    - Map FreeRide to KRD step with open target
    - Extract Duration, Cadence attributes
    - Store FlatRoad attribute in extensions.zwift
    - DO NOT test mappers (simple data transformation, no logic)
    - _Requirements: 10.1, 10.2, 10.3_
    - _Commit: "feat: add FreeRide interval mapper"_

- [x] 7. Implement text event handling
  - [x] 7.1 Implement text event extraction
    - Add text event extraction to interval mappers
    - Extract textevent elements with message, timeoffset, distoffset attributes
    - Store primary message in step.notes
    - Store all text events with offsets in extensions.zwift.textEvents
    - Write tests for text event extraction, multiple events
    - _Requirements: 11.1, 11.2_
    - _Commit: "feat: add text event extraction"_

- [x] 8. Implement Zwift extensions preservation
  - [x] 8.1 Implement extension handling (Zwift → KRD)
    - Add extension extraction to convertZwiftToKRD
    - Store tags in extensions.zwift.tags
    - Store durationType in extensions.zwift.durationType
    - Store thresholdSecPerKm in extensions.zwift.thresholdSecPerKm
    - Store FlatRoad attributes in extensions.zwift
    - Write tests for extension preservation
    - _Requirements: 14.1, 14.2, 14.3_
    - _Commit: "feat: preserve Zwift extensions in KRD"_

- [x] 9. Implement Zwift writer port and adapter
  - [x] 9.1 Create Zwift writer port
    - Create ports/zwift-writer.ts with ZwiftWriter type
    - Define function signature: (krd: KRD) => Promise<string>
    - _Requirements: 15.2_
    - _Commit: "feat: add Zwift writer port"_
  - [x] 9.2 Implement Zwift writer adapter skeleton
    - Add createFastXmlZwiftWriter factory to adapters/zwift/fast-xml-parser.ts
    - Implement function using fast-xml-parser XMLBuilder
    - Validate generated XML against XSD using ZwiftValidator
    - Handle validation errors with createZwiftValidationError
    - Handle parsing errors with createZwiftParsingError
    - Inject logger and validator
    - Add tests for valid KRD, error handling, XSD validation, logger injection
    - _Requirements: 15.2, 15.5, 18.4_
    - _Commit: "feat: add Zwift writer adapter skeleton with XSD validation"_
  - [x] 9.3 Implement KRD to Zwift conversion
    - Implement convertKRDToZwift function in fast-xml-parser.ts
    - Create workout_file structure
    - Convert KRD metadata to author, name, description, sportType
    - Convert KRD steps to Zwift intervals
    - Determine interval type based on target and intensity
    - Encode repetition blocks as IntervalsT elements
    - Add tests for metadata, interval encoding, repetitions
    - _Requirements: 15.3, 15.4_
    - _Commit: "feat: implement KRD to Zwift conversion"_

- [x] 10. Implement Zwift duration conversion (KRD → Zwift)
  - [x] 10.1 Implement duration mappers (KRD → Zwift)
    - Add duration mapping functions to adapters/zwift/duration/duration.mapper.ts
    - Map time duration → Duration attribute in seconds
    - Map distance duration → Duration attribute in meters (for running)
    - DO NOT test mappers (simple data transformation, no logic)
    - _Requirements: 3.1, 3.2, 3.5_
    - _Commit: "feat: add KRD to Zwift duration mappers"_
  - [x] 10.2 Implement duration converters (KRD → Zwift)
    - Add duration conversion functions to adapters/zwift/duration/duration.converter.ts
    - Convert seconds to Duration attribute
    - Convert meters to Duration attribute for running
    - Write tests for all duration conversions
    - _Requirements: 3.1, 3.2, 3.5_
    - _Commit: "feat: add KRD to Zwift duration converters"_

- [x] 11. Implement Zwift target conversion (KRD → Zwift)
  - [x] 11.1 Implement target mappers (KRD → Zwift)
    - Add target mapping functions to adapters/zwift/target/target.mapper.ts
    - Map power target → Power attribute (divide by 100 for FTP%)
    - Map pace target → pace attribute (convert m/s to sec/km)
    - Map cadence target → Cadence attribute
    - Map open target → FreeRide element
    - Map range target → PowerLow/PowerHigh attributes
    - DO NOT test mappers (simple data transformation, no logic)
    - _Requirements: 4.4, 5.3, 6.5_
    - _Commit: "feat: add KRD to Zwift target mappers"_
  - [x] 11.2 Implement target converters (KRD → Zwift)
    - Add target conversion functions to adapters/zwift/target/target.converter.ts
    - Convert percent_ftp to FTP percentage (divide by 100)
    - Convert m/s to sec/km (1000 / metersPerSecond)
    - Handle running cadence (rpm → spm\*2)
    - Write tests for all target conversions
    - _Requirements: 4.4, 5.3, 6.5_
    - _Commit: "feat: add KRD to Zwift target converters"_

- [x] 12. Implement Zwift interval type encoding (KRD → Zwift)
  - [x] 12.1 Implement interval type determination logic
    - Create adapters/zwift/interval/interval-type-detector.ts
    - Determine SteadyState for constant power targets
    - Determine Warmup for range targets with intensity "warmup"
    - Determine Cooldown for range targets with intensity "cooldown"
    - Determine Ramp for range targets with intensity "active"
    - Determine FreeRide for open targets
    - Write tests for all interval type detection scenarios
    - _Requirements: 7.4, 8.3, 10.4, 19.2_
    - _Commit: "feat: add interval type detection logic"_
  - [x] 12.2 Implement IntervalsT encoding
    - Add IntervalsT encoding to convertKRDToZwift
    - Detect repetition blocks with 2 steps
    - Encode as IntervalsT with Repeat, OnDuration, OnPower, OffDuration, OffPower
    - Handle Cadence and CadenceResting attributes
    - Write tests for IntervalsT encoding
    - _Requirements: 9.4, 9.5_
    - _Commit: "feat: add IntervalsT encoding"_

- [x] 13. Implement text event encoding
  - [x] 13.1 Implement text event encoding (KRD → Zwift)
    - Add text event encoding to interval encoding
    - Encode step.notes as primary textevent
    - Restore text events from extensions.zwift.textEvents
    - Encode timeoffset and distoffset attributes
    - Write tests for text event encoding, multiple events
    - _Requirements: 11.3, 11.4_
    - _Commit: "feat: add text event encoding"_

- [x] 14. Implement Zwift extensions restoration
  - [x] 14.1 Implement extension restoration (KRD → Zwift)
    - Add extension restoration to convertKRDToZwift
    - Restore tags from extensions.zwift.tags
    - Restore durationType from extensions.zwift.durationType
    - Restore thresholdSecPerKm from extensions.zwift.thresholdSecPerKm
    - Restore FlatRoad attributes from extensions.zwift
    - Write tests for extension restoration
    - _Requirements: 14.1, 14.2, 14.3, 14.5_
    - _Commit: "feat: restore Zwift extensions from KRD"_

- [x] 15. Implement use cases
  - [x] 15.1 Implement ConvertZwiftToKrd use case
    - Create application/use-cases/convert-zwift-to-krd.ts
    - Define ConvertZwiftToKrd type using ReturnType<typeof convertZwiftToKrd>
    - Implement convertZwiftToKrd factory with currying (zwiftReader, validator, logger)
    - Compose ZwiftReader and SchemaValidator
    - Handle validation errors with createKrdValidationError
    - Write co-located tests with mocks (execute, validation errors, logger)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
    - _Commit: "feat: add ConvertZwiftToKrd use case"_
  - [x] 15.2 Implement ConvertKrdToZwift use case
    - Create application/use-cases/convert-krd-to-zwift.ts
    - Define ConvertKrdToZwift type using ReturnType<typeof convertKrdToZwift>
    - Implement convertKrdToZwift factory with currying (zwiftWriter, validator, logger)
    - Compose ZwiftWriter and SchemaValidator
    - Pre-validate KRD before conversion
    - Handle validation errors with createKrdValidationError
    - Write co-located tests with mocks (execute, pre-validation, errors, logger)
    - _Requirements: 15.1, 15.2, 15.3_
    - _Commit: "feat: add ConvertKrdToZwift use case"_

- [x] 16. Add Zwift test fixtures
  - [x] 16.1 Add Zwift test fixture files
    - Create src/tests/fixtures/zwift-files/ directory
    - Add sample Zwift workout with SteadyState intervals
    - Add sample Zwift workout with IntervalsT blocks
    - Add sample Zwift workout with ramp intervals (Warmup, Ramp, Cooldown)
    - Add sample Zwift workout with mixed interval types
    - Add sample Zwift workout with text events
    - _Requirements: 17.1, 17.2, 17.3, 17.4_
    - _Commit: "test: add Zwift test fixtures"_

- [x] 17. Implement round-trip tests
  - [ ] 17.1 Implement Zwift round-trip tests
    - Create adapters/zwift/round-trip/ directory
    - Create round-trip test files for each fixture
    - Test Zwift → KRD → Zwift with tolerance checking
    - Test KRD → Zwift → KRD with tolerance checking
    - Verify duration conversions within tolerances
    - Verify target conversions within tolerances
    - Verify interval types preserved
    - Verify repetition blocks preserved
    - Verify text events preserved
    - Verify extensions preserved
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
    - _Commit: "test: add Zwift round-trip validation tests"_

- [x] 18. Update dependency injection
  - [x] 18.1 Update createDefaultProviders
    - Update application/providers.ts to include Zwift components
    - Add zwiftValidator: ZwiftValidator to Providers type
    - Add zwiftReader: ZwiftReader to Providers type
    - Add zwiftWriter: ZwiftWriter to Providers type
    - Add convertZwiftToKrd: ConvertZwiftToKrd to Providers type
    - Add convertKrdToZwift: ConvertKrdToZwift to Providers type
    - Wire Zwift validator, adapters and use cases using functional composition
    - Update tests in providers.test.ts (Zwift component creation, wiring)
    - _Requirements: 1.1, 1.2, 15.1, 15.2, 18.1_
    - _Commit: "feat: add Zwift support to dependency injection"_

- [x] 19. Export public API
  - [x] 19.1 Update src/index.ts with Zwift exports
    - Export ZwiftValidator, ZwiftReader and ZwiftWriter port types
    - Export ZwiftValidationResult type
    - Export ConvertZwiftToKrd and ConvertKrdToZwift use case types
    - Export ZwiftParsingError type and createZwiftParsingError factory
    - Export ZwiftValidationError type and createZwiftValidationError factory
    - Verify all Zwift components are accessible and properly typed
    - _Requirements: 1.1, 1.2, 15.1, 15.2, 18.1, 18.2_
    - _Commit: "feat: export Zwift public API"_

- [ ] 20. Update CLI to support Zwift format
  - [x] 20.1 Add .zwo file extension support
    - Update CLI to recognize .zwo file extension
    - Add Zwift to format detection logic
    - Update help text to include Zwift format
    - Add tests for Zwift file detection
    - _Requirements: 1.1, 15.1_
    - _Commit: "feat: add Zwift format support to CLI"_

## Notes

- **Reuse domain layer**: All domain schemas (KRD, Workout, Duration, Target) are shared with FIT and TCX conversions
- **Reuse validation**: SchemaValidator and ToleranceChecker are shared with FIT and TCX conversions
- **Reuse logger**: Logger port and console adapter are shared with FIT and TCX conversions
- **Reuse XML patterns**: XML parsing and XSD validation patterns from TCX conversion
- **Independent implementation**: Zwift conversion can be implemented without modifying FIT or TCX conversions
- **Mappers vs Converters**: Follow the same pattern as FIT/TCX - mappers have no logic (no tests), converters have logic (must have tests)
- **Functional style**: Use currying for dependency injection, no classes
- **Type safety**: Use Zod schemas for all Zwift-specific types, infer TypeScript types with z.infer
- **XSD Validation**: Zwift files are validated against the XSD schema both on input (before parsing) and output (after generation) to ensure compliance with the Zwift standard
- **Power conversion**: Zwift uses FTP percentage (0.0-2.0+), KRD uses percent_ftp (0-200+). Multiply by 100 when converting Zwift → KRD, divide by 100 when converting KRD → Zwift
- **Pace conversion**: Zwift uses sec/km, KRD uses m/s. Formula: m/s = 1000 / sec_per_km
- **Interval type inference**: Zwift interval types (SteadyState, Warmup, Ramp, Cooldown, IntervalsT, FreeRide) must be inferred from KRD step properties when converting KRD → Zwift
- **Text events**: Primary message stored in step.notes, all text events with offsets stored in extensions.zwift.textEvents

## Dependencies

- **fast-xml-parser** (^4.3.0) - XML parsing and building (already installed for TCX)
- **@kaiord/core domain** - Reuse KRD, Workout, Duration, Target schemas
- **@kaiord/core validation** - Reuse SchemaValidator and ToleranceChecker
- **@kaiord/core logger** - Reuse Logger port and console adapter
