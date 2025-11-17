# Implementation Plan: TCX ↔ KRD Bidirectional Conversion

## Overview

This feature enables bidirectional conversion between Training Center XML (TCX) workout files and KRD format. TCX is an XML-based format widely used across fitness platforms. The implementation follows hexagonal architecture and reuses domain schemas and validation from the FIT conversion implementation.

## Prerequisites

- ✅ FIT ↔ KRD conversion complete (domain schemas, validation, error types)
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

- [x] 1. Add TCX error types
  - [x] 1.1 Implement TcxParsingError type and factory
    - Add TcxParsingError type to domain/types/errors.ts
    - Create createTcxParsingError factory function
    - Write co-located tests in errors.test.ts (error creation, cause preservation)
    - _Requirements: 9.1_
    - _Commit: "feat: add TCX parsing error type"_
  - [x] 1.2 Implement TcxValidationError type and factory
    - Add TcxValidationError type to domain/types/errors.ts
    - Create createTcxValidationError factory function
    - Include errors array with path and message for each validation error
    - Write co-located tests in errors.test.ts (error creation, errors array)
    - _Requirements: 17.2, 17.5_
    - _Commit: "feat: add TCX validation error type"_
    - _Note: Class and factory implemented, but dedicated unit tests for TcxValidationError are missing. The error is tested indirectly through integration tests._

- [x] 2. Create TCX adapter schemas
  - [x] 2.1 Implement TCX sport schema
    - Create adapters/tcx/schemas/tcx-sport.ts with tcxSportSchema
    - Define TCX_TO_KRD_SPORT mapping (Running → running, Biking → cycling)
    - Export TcxSport type using z.infer
    - DO NOT create tests for schemas (TypeScript validates types)
    - _Requirements: 8.2_
    - _Commit: "feat: add TCX sport schema"_
  - [x] 2.2 Implement TCX duration schema
    - Create adapters/tcx/schemas/tcx-duration.ts with tcxDurationTypeSchema
    - Define duration types (Time, Distance, LapButton, HeartRateAbove, HeartRateBelow, CaloriesBurned)
    - Export TcxDurationType type using z.infer
    - DO NOT create tests for schemas (TypeScript validates types)
    - _Requirements: 2.1, 2.2, 2.5_
    - _Commit: "feat: add TCX duration schema"_
  - [x] 2.3 Implement TCX target schema
    - Create adapters/tcx/schemas/tcx-target.ts with tcxTargetTypeSchema
    - Define target types (HeartRate, Speed, Cadence, None)
    - Export TcxTargetType type using z.infer
    - DO NOT create tests for schemas (TypeScript validates types)
    - _Requirements: 3.1, 4.1, 5.1_
    - _Commit: "feat: add TCX target schema"_

- [x] 2.5. Download and add TCX XSD schema
  - [x] 2.5.1 Download Garmin TCX XSD schema
    - Download TrainingCenterDatabasev2.xsd from https://www8.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd
    - Save to packages/core/schema/TrainingCenterDatabasev2.xsd
    - Add schema file to git repository
    - _Requirements: 17.1_
    - _Commit: "feat: add Garmin TCX XSD schema"_

- [x] 2.6. Implement TCX XSD validator
  - [x] 2.6.1 Create TCX validator port
    - Create ports/tcx-validator.ts with TcxValidator type
    - Define TcxValidationResult type with valid flag and errors array
    - Define function signature: (xmlString: string) => Promise<TcxValidationResult>
    - _Requirements: 17.1_
    - _Commit: "feat: add TCX validator port"_
  - [x] 2.6.2 Implement XSD validator adapter
    - Create adapters/tcx/xsd-validator.ts
    - Implement createXsdTcxValidator factory with logger injection
    - Use fast-xml-parser XMLValidator for XML structure validation
    - Load XSD schema from packages/core/schema/TrainingCenterDatabasev2.xsd
    - Return validation result with errors array
    - Write co-located tests in xsd-validator.test.ts (valid XML, invalid XML, schema violations)
    - _Requirements: 17.1, 17.2_
    - _Commit: "feat: add TCX XSD validator adapter"_

- [x] 3. Implement TCX reader port and adapter
  - [x] 3.1 Create TCX reader port
    - Create ports/tcx-reader.ts with TcxReader type
    - Define function signature: (xmlString: string) => Promise<KRD>
    - _Requirements: 1.1_
    - _Commit: "feat: add TCX reader port"_
  - [x] 3.2 Implement TCX reader adapter skeleton
    - Create adapters/tcx/fast-xml-parser.ts
    - Implement createFastXmlTcxReader factory with logger and validator injection
    - Validate XML against XSD before parsing using TcxValidator
    - Use fast-xml-parser XMLParser to parse XML
    - Handle validation errors with createTcxValidationError
    - Handle parsing errors with createTcxParsingError
    - Write co-located tests in fast-xml-parser.test.ts (valid XML, malformed XML, XSD violations, logger)
    - _Requirements: 1.1, 9.1, 17.3_
    - _Commit: "feat: add TCX reader adapter skeleton with XSD validation"_
  - [x] 3.3 Implement TCX to KRD conversion
    - Implement convertTcxToKRD function in fast-xml-parser.ts
    - Extract TrainingCenterDatabase/Workouts/Workout structure
    - Convert workout metadata (name, sport)
    - Convert workout steps
    - Handle repetition blocks (Repeat elements)
    - Preserve step order
    - Add tests for metadata extraction, step conversion, repetitions
    - _Requirements: 1.2, 6.1, 6.2, 7.1, 7.2, 8.1, 8.2, 8.3_
    - _Commit: "feat: implement TCX to KRD conversion"_

- [x] 4. Implement TCX duration conversion
  - [x] 4.1 Implement duration mappers (TCX → KRD)
    - Create adapters/tcx/duration/duration.mapper.ts
    - Map Time → time duration with seconds
    - Map Distance → distance duration with meters
    - Map LapButton → open duration
    - Use .safeParse() for validation with default fallback
    - DO NOT test mappers (simple data transformation, no logic)
    - _Requirements: 2.1, 2.2, 2.5_
    - _Commit: "feat: add TCX duration mappers"_
  - [x] 4.2 Implement duration converters (TCX → KRD)
    - Create adapters/tcx/duration/duration.converter.ts
    - Convert HeartRateAbove/Below to extensions (not standard KRD)
    - Convert CaloriesBurned to extensions (not standard KRD)
    - Write co-located tests in duration.converter.test.ts (all duration types, edge cases)
    - _Requirements: 2.1, 2.2, 2.5_
    - _Commit: "feat: add TCX duration converters"_

- [x] 5. Implement TCX target conversion
  - [x] 5.1 Implement target mappers (TCX → KRD)
    - Create adapters/tcx/target/target.mapper.ts
    - Map HeartRate → heart_rate target
    - Map Speed → pace target (convert m/s)
    - Map Cadence → cadence target
    - Map None → open target
    - Use .safeParse() for validation with default fallback
    - DO NOT test mappers (simple data transformation, no logic)
    - _Requirements: 3.1, 4.1, 5.1_
    - _Commit: "feat: add TCX target mappers"_
  - [x] 5.2 Implement target converters (TCX → KRD)
    - Create adapters/tcx/target/target.converter.ts
    - Convert heart rate zones (1-5)
    - Convert heart rate ranges (low/high bpm)
    - Convert speed zones and ranges
    - Convert cadence ranges
    - Handle running cadence (spm/2 → rpm)
    - Write co-located tests in target.converter.test.ts (all target types, zones, ranges)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4_
    - _Commit: "feat: add TCX target converters"_

- [x] 6. Implement TCX extensions preservation
  - [x] 6.1 Implement extension handling (TCX → KRD)
    - Add extension extraction to convertTcxToKRD7u
    - Store TCX extension elements in extensions.tcx
    - Extract power data from extensions (if present)
    - Store custom fields in extensions
    - Write tests for extension preservation, power extraction
    - _Requirements: 10.1, 10.2, 10.3_
    - _Commit: "feat: preserve TCX extensions in KRD"_

- [x] 7. Implement TCX writer port and adapter
  - [x] 7.1 Create TCX writer port
    - Create ports/tcx-writer.ts with TcxWriter type
    - Define function signature: (krd: KRD) => Promise<string>
    - _Requirements: 11.2_
    - _Commit: "feat: add TCX writer port"_
  - [x] 7.2 Implement TCX writer adapter skeleton
    - Add createFastXmlTcxWriter factory to adapters/tcx/fast-xml-parser.ts
    - Implement function using fast-xml-parser XMLBuilder
    - Validate generated XML against XSD using TcxValidator
    - Handle validation errors with createTcxValidationError
    - Handle parsing errors with createTcxParsingError
    - Inject logger and validator
    - Add tests for valid KRD, error handling, XSD validation, logger injection
    - _Requirements: 11.2, 11.5, 17.4_
    - _Commit: "feat: add TCX writer adapter skeleton with XSD validation"_
  - [x] 7.3 Implement KRD to TCX conversion
    - Implement convertKRDToTcx function in fast-xml-parser.ts
    - Create TrainingCenterDatabase structure with namespaces
    - Convert KRD metadata to Workout element
    - Convert KRD steps to Step elements
    - Encode repetition blocks as Repeat elements
    - Add tests for metadata, steps, and repetition encoding
    - _Requirements: 11.3, 11.4_
    - _Commit: "feat: implement KRD to TCX conversion"_

- [x] 8. Implement TCX duration conversion (KRD → TCX)
  - [x] 8.1 Implement duration mappers (KRD → TCX)
    - Add duration mapping functions to adapters/tcx/duration/duration.mapper.ts
    - Map time duration → Time element with Seconds
    - Map distance duration → Distance element with Meters
    - Map open duration → LapButton element
    - DO NOT test mappers (simple data transformation, no logic)
    - _Requirements: 12.1, 12.2, 12.5_
    - _Commit: "feat: add KRD to TCX duration mappers"_
  - [x] 8.2 Implement duration converters (KRD → TCX)
    - Add duration conversion functions to adapters/tcx/duration/duration.converter.ts
    - Restore HeartRateAbove/Below from extensions
    - Restore CaloriesBurned from extensions
    - Write tests for all duration conversions
    - _Requirements: 12.1, 12.2, 12.5_
    - _Commit: "feat: add KRD to TCX duration converters"_

- [x] 9. Implement TCX target conversion (KRD → TCX)
  - [x] 9.1 Implement target mappers (KRD → TCX)
    - Add target mapping functions to adapters/tcx/target/target.mapper.ts
    - Map heart_rate target → HeartRate element
    - Map pace target → Speed element (convert from m/s)
    - Map cadence target → Cadence element
    - Map open target → None
    - DO NOT test mappers (simple data transformation, no logic)
    - _Requirements: 13.1, 13.2, 13.5_
    - _Commit: "feat: add KRD to TCX target mappers"_
  - [x] 9.2 Implement target converters (KRD → TCX)
    - Add target conversion functions to adapters/tcx/target/target.converter.ts
    - Convert heart rate zones to PredefinedHeartRateZone
    - Convert heart rate ranges to CustomHeartRateZone
    - Convert speed zones and ranges to CustomSpeedZone
    - Convert cadence ranges
    - Handle running cadence (rpm → spm\*2)
    - Write tests for all target conversions
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
    - _Commit: "feat: add KRD to TCX target converters"_

- [x] 10. Implement TCX extensions restoration
  - [x] 10.1 Implement extension restoration (KRD → TCX)
    - Add extension restoration to convertKRDToTcx
    - Restore TCX extension elements from extensions.tcx
    - Restore power data to extensions (if present)
    - Restore custom fields
    - Write tests for extension restoration, power encoding
    - _Requirements: 10.1, 10.2, 10.3, 10.5_
    - _Commit: "feat: restore TCX extensions from KRD"_

- [x] 11. Implement use cases
  - [x] 11.1 Implement ConvertTcxToKrd use case
    - Create application/use-cases/convert-tcx-to-krd.ts
    - Define ConvertTcxToKrd type using ReturnType<typeof convertTcxToKrd>
    - Implement convertTcxToKrd factory with currying (tcxReader, validator, logger)
    - Compose TcxReader and SchemaValidator
    - Handle validation errors with createKrdValidationError
    - Write co-located tests with mocks (execute, validation errors, logger)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
    - _Commit: "feat: add ConvertTcxToKrd use case"_
  - [x] 11.2 Implement ConvertKrdToTcx use case
    - Create application/use-cases/convert-krd-to-tcx.ts
    - Define ConvertKrdToTcx type using ReturnType<typeof convertKrdToTcx>
    - Implement convertKrdToTcx factory with currying (tcxWriter, validator, logger)
    - Compose TcxWriter and SchemaValidator
    - Pre-validate KRD before conversion
    - Handle validation errors with createKrdValidationError
    - Write co-located tests with mocks (execute, pre-validation, errors, logger)
    - _Requirements: 11.1, 11.2, 11.3_
    - _Commit: "feat: add ConvertKrdToTcx use case"_

- [x] 12. Add TCX test fixtures
  - [x] 12.1 Add TCX test fixture files
    - Create src/tests/fixtures/tcx-files/ directory
    - Add sample TCX workout with heart rate targets
    - Add sample TCX workout with speed targets
    - Add sample TCX workout with repetition blocks
    - Add sample TCX workout with mixed duration types
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
    - _Commit: "test: add TCX test fixtures"_

- [x] 13. Implement round-trip tests
  - [x] 13.1 Implement TCX round-trip tests
    - Create adapters/tcx/round-trip/ directory
    - Create round-trip test files for each fixture
    - Test TCX → KRD → TCX with tolerance checking
    - Test KRD → TCX → KRD with tolerance checking
    - Verify duration conversions within tolerances
    - Verify target conversions within tolerances
    - Verify repetition blocks preserved
    - Verify extensions preserved
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
    - _Commit: "test: add TCX round-trip validation tests"_

- [x] 14. Update dependency injection
  - [x] 14.1 Update createDefaultProviders
    - Update application/providers.ts to include TCX components
    - Add tcxValidator: TcxValidator to Providers type
    - Add tcxReader: TcxReader to Providers type
    - Add tcxWriter: TcxWriter to Providers type
    - Add convertTcxToKrd: ConvertTcxToKrd to Providers type
    - Add convertKrdToTcx: ConvertKrdToTcx to Providers type
    - Wire TCX validator, adapters and use cases using functional composition
    - Update tests in providers.test.ts (TCX component creation, wiring)
    - _Requirements: 1.1, 1.2, 11.1, 11.2, 17.1_
    - _Commit: "feat: add TCX support to dependency injection"_

- [x] 15. Export public API
  - [x] 15.1 Update src/index.ts with TCX exports
    - Export TcxValidator, TcxReader and TcxWriter port types
    - Export TcxValidationResult type
    - Export ConvertTcxToKrd and ConvertKrdToTcx use case types
    - Export TcxParsingError type and createTcxParsingError factory
    - Export TcxValidationError type and createTcxValidationError factory
    - Verify all TCX components are accessible and properly typed
    - _Requirements: 1.1, 1.2, 11.1, 11.2, 17.1, 17.2_
    - _Commit: "feat: export TCX public API"_

## Notes

- **Reuse domain layer**: All domain schemas (KRD, Workout, Duration, Target) are shared with FIT conversion
- **Reuse validation**: SchemaValidator and ToleranceChecker are shared with FIT conversion
- **Reuse logger**: Logger port and console adapter are shared with FIT conversion
- **Independent implementation**: TCX conversion can be implemented without modifying FIT conversion
- **Mappers vs Converters**: Follow the same pattern as FIT - mappers have no logic (no tests), converters have logic (must have tests)
- **Functional style**: Use currying for dependency injection, no classes
- **Type safety**: Use Zod schemas for all TCX-specific types, infer TypeScript types with z.infer
- **XSD Validation**: TCX files are validated against the official Garmin XSD schema both on input (before parsing) and output (after generation) to ensure compliance with the TCX standard
- **Validation applies to all formats**: The XSD validation pattern for TCX should be replicated for other formats (FIT, PWX) to ensure input/output validation across all supported formats

## Dependencies

- **fast-xml-parser** (^4.3.0) - XML parsing and building
- **@kaiord/core domain** - Reuse KRD, Workout, Duration, Target schemas
- **@kaiord/core validation** - Reuse SchemaValidator and ToleranceChecker
- **@kaiord/core logger** - Reuse Logger port and console adapter
