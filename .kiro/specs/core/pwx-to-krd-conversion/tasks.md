# Implementation Plan: PWX ↔ KRD Bidirectional Conversion

## Overview

This feature enables bidirectional conversion between PowerAgent Workout XML (PWX) files and KRD format. PWX is TrainingPeaks' XML-based format for structured workouts. The implementation follows hexagonal architecture and reuses domain schemas and validation from the FIT conversion implementation.

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

- [ ] 1. Add PWX error type
  - [ ] 1.1 Implement PwxParsingError type and factory
    - Add PwxParsingError type to domain/types/errors.ts
    - Create createPwxParsingError factory function
    - Write co-located tests in errors.test.ts (error creation, cause preservation)
    - _Requirements: 10.1_
    - _Commit: "feat: add PWX parsing error type"_

- [ ] 2. Create PWX adapter schemas
  - [ ] 2.1 Implement PWX sport schema
    - Create adapters/pwx/schemas/pwx-sport.ts with pwxSportSchema
    - Define PWX_TO_KRD_SPORT mapping (Bike → cycling, Run → running, Swim → swimming)
    - Export PwxSport type using z.infer
    - DO NOT create tests for schemas (TypeScript validates types)
    - _Requirements: 9.2_
    - _Commit: "feat: add PWX sport schema"_
  - [ ] 2.2 Implement PWX duration schema
    - Create adapters/pwx/schemas/pwx-duration.ts with pwxDurationTypeSchema
    - Define duration types (time, distance, open)
    - Export PwxDurationType type using z.infer
    - DO NOT create tests for schemas (TypeScript validates types)
    - _Requirements: 2.1, 2.2, 2.5_
    - _Commit: "feat: add PWX duration schema"_
  - [ ] 2.3 Implement PWX target schema
    - Create adapters/pwx/schemas/pwx-target.ts with pwxTargetTypeSchema
    - Define target types (power, heartrate, speed, cadence, none)
    - Export PwxTargetType type using z.infer
    - DO NOT create tests for schemas (TypeScript validates types)
    - _Requirements: 3.1, 4.1, 5.1, 6.1_
    - _Commit: "feat: add PWX target schema"_

- [ ] 3. Implement PWX reader port and adapter
  - [ ] 3.1 Create PWX reader port
    - Create ports/pwx-reader.ts with PwxReader type
    - Define function signature: (xmlString: string) => Promise<KRD>
    - _Requirements: 1.1_
    - _Commit: "feat: add PWX reader port"_
  - [ ] 3.2 Implement PWX reader adapter skeleton
    - Create adapters/pwx/fast-xml-parser.ts
    - Implement createFastXmlPwxReader factory with logger injection
    - Use fast-xml-parser XMLParser to parse XML
    - Handle errors with createPwxParsingError
    - Write co-located tests in fast-xml-parser.test.ts (valid XML, malformed XML, logger)
    - _Requirements: 1.1, 10.1_
    - _Commit: "feat: add PWX reader adapter skeleton"_
  - [ ] 3.3 Implement PWX to KRD conversion
    - Implement convertPwxToKRD function in fast-xml-parser.ts
    - Extract workout structure
    - Convert workout metadata (name, sport)
    - Convert workout segments (steps)
    - Handle repetition blocks (repeat elements)
    - Preserve step order
    - Add tests for metadata extraction, step conversion, repetitions
    - _Requirements: 1.2, 7.1, 7.2, 8.1, 8.2, 9.1, 9.2, 9.3_
    - _Commit: "feat: implement PWX to KRD conversion"_

- [ ] 4. Implement PWX duration conversion
  - [ ] 4.1 Implement duration mappers (PWX → KRD)
    - Create adapters/pwx/duration/duration.mapper.ts
    - Map time → time duration with seconds
    - Map distance → distance duration with meters
    - Map open → open duration
    - Use .safeParse() for validation with default fallback
    - DO NOT test mappers (simple data transformation, no logic)
    - _Requirements: 2.1, 2.2, 2.5_
    - _Commit: "feat: add PWX duration mappers"_
  - [ ] 4.2 Implement duration converters (PWX → KRD)
    - Create adapters/pwx/duration/duration.converter.ts
    - Convert duration values with proper unit handling
    - Write co-located tests in duration.converter.test.ts (all duration types, edge cases)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
    - _Commit: "feat: add PWX duration converters"_

- [ ] 5. Implement PWX target conversion
  - [ ] 5.1 Implement target mappers (PWX → KRD)
    - Create adapters/pwx/target/target.mapper.ts
    - Map power → power target
    - Map heartrate → heart_rate target
    - Map speed → pace target (convert m/s)
    - Map cadence → cadence target
    - Map none → open target
    - Use .safeParse() for validation with default fallback
    - DO NOT test mappers (simple data transformation, no logic)
    - _Requirements: 3.1, 4.1, 5.1, 6.1_
    - _Commit: "feat: add PWX target mappers"_
  - [ ] 5.2 Implement target converters (PWX → KRD)
    - Create adapters/pwx/target/target.converter.ts
    - Convert power targets (watts, %FTP, zones)
    - Convert heart rate targets (bpm, zones, %max)
    - Convert speed targets and ranges
    - Convert cadence targets and ranges
    - Handle running cadence (spm/2 → rpm)
    - Write co-located tests in target.converter.test.ts (all target types, zones, ranges)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_
    - _Commit: "feat: add PWX target converters"_

- [ ] 6. Implement PWX extensions preservation
  - [ ] 6.1 Implement extension handling (PWX → KRD)
    - Add extension extraction to convertPwxToKRD
    - Store PWX extension elements in extensions.pwx
    - Store TrainingPeaks-specific fields in extensions
    - Store custom fields in extensions
    - Write tests for extension preservation
    - _Requirements: 11.1, 11.2, 11.3_
    - _Commit: "feat: preserve PWX extensions in KRD"_

- [ ] 7. Implement PWX writer port and adapter
  - [ ] 7.1 Create PWX writer port
    - Create ports/pwx-writer.ts with PwxWriter type
    - Define function signature: (krd: KRD) => Promise<string>
    - _Requirements: 12.2_
    - _Commit: "feat: add PWX writer port"_
  - [ ] 7.2 Implement PWX writer adapter skeleton
    - Add createFastXmlPwxWriter factory to adapters/pwx/fast-xml-parser.ts
    - Implement function using fast-xml-parser XMLBuilder
    - Handle errors with createPwxParsingError
    - Inject logger
    - Add tests for valid KRD, error handling, logger injection
    - _Requirements: 12.2, 12.5_
    - _Commit: "feat: add PWX writer adapter skeleton"_
  - [ ] 7.3 Implement KRD to PWX conversion
    - Implement convertKRDToPwx function in fast-xml-parser.ts
    - Create workout structure with namespaces
    - Convert KRD metadata to workout element
    - Convert KRD steps to segment elements
    - Encode repetition blocks as repeat elements
    - Add tests for metadata, steps, and repetition encoding
    - _Requirements: 12.3, 12.4_
    - _Commit: "feat: implement KRD to PWX conversion"_

- [ ] 8. Implement PWX duration conversion (KRD → PWX)
  - [ ] 8.1 Implement duration mappers (KRD → PWX)
    - Add duration mapping functions to adapters/pwx/duration/duration.mapper.ts
    - Map time duration → time with duration value
    - Map distance duration → distance with duration value
    - Map open duration → open
    - DO NOT test mappers (simple data transformation, no logic)
    - _Requirements: 13.1, 13.2, 13.5_
    - _Commit: "feat: add KRD to PWX duration mappers"_
  - [ ] 8.2 Implement duration converters (KRD → PWX)
    - Add duration conversion functions to adapters/pwx/duration/duration.converter.ts
    - Convert duration values with proper unit handling
    - Write tests for all duration conversions
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
    - _Commit: "feat: add KRD to PWX duration converters"_

- [ ] 9. Implement PWX target conversion (KRD → PWX)
  - [ ] 9.1 Implement target mappers (KRD → PWX)
    - Add target mapping functions to adapters/pwx/target/target.mapper.ts
    - Map power target → power
    - Map heart_rate target → heartrate
    - Map pace target → speed (convert from m/s)
    - Map cadence target → cadence
    - Map open target → none
    - DO NOT test mappers (simple data transformation, no logic)
    - _Requirements: 14.1, 14.2, 15.1, 15.2, 15.5_
    - _Commit: "feat: add KRD to PWX target mappers"_
  - [ ] 9.2 Implement target converters (KRD → PWX)
    - Add target conversion functions to adapters/pwx/target/target.converter.ts
    - Convert power targets to PWX format
    - Convert heart rate targets to PWX format
    - Convert speed targets to PWX format
    - Convert cadence targets to PWX format
    - Handle running cadence (rpm → spm\*2)
    - Write tests for all target conversions
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 15.1, 15.2, 15.3, 15.4, 15.5_
    - _Commit: "feat: add KRD to PWX target converters"_

- [ ] 10. Implement PWX extensions restoration
  - [ ] 10.1 Implement extension restoration (KRD → PWX)
    - Add extension restoration to convertKRDToPwx
    - Restore PWX extension elements from extensions.pwx
    - Restore TrainingPeaks-specific fields
    - Restore custom fields
    - Write tests for extension restoration
    - _Requirements: 11.1, 11.2, 11.3, 11.5_
    - _Commit: "feat: restore PWX extensions from KRD"_

- [ ] 11. Implement use cases
  - [ ] 11.1 Implement ConvertPwxToKrd use case
    - Create application/use-cases/convert-pwx-to-krd.ts
    - Define ConvertPwxToKrd type using ReturnType<typeof convertPwxToKrd>
    - Implement convertPwxToKrd factory with currying (pwxReader, validator, logger)
    - Compose PwxReader and SchemaValidator
    - Handle validation errors with createKrdValidationError
    - Write co-located tests with mocks (execute, validation errors, logger)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
    - _Commit: "feat: add ConvertPwxToKrd use case"_
  - [ ] 11.2 Implement ConvertKrdToPwx use case
    - Create application/use-cases/convert-krd-to-pwx.ts
    - Define ConvertKrdToPwx type using ReturnType<typeof convertKrdToPwx>
    - Implement convertKrdToPwx factory with currying (pwxWriter, validator, logger)
    - Compose PwxWriter and SchemaValidator
    - Pre-validate KRD before conversion
    - Handle validation errors with createKrdValidationError
    - Write co-located tests with mocks (execute, pre-validation, errors, logger)
    - _Requirements: 12.1, 12.2, 12.3_
    - _Commit: "feat: add ConvertKrdToPwx use case"_

- [ ] 12. Add PWX test fixtures
  - [ ] 12.1 Add PWX test fixture files
    - Create src/tests/fixtures/pwx-files/ directory
    - Add sample PWX workout with power targets
    - Add sample PWX workout with heart rate targets
    - Add sample PWX workout with repetition blocks
    - Add sample PWX workout with mixed duration types
    - _Requirements: 18.1, 18.2, 18.3, 18.4_
    - _Commit: "test: add PWX test fixtures"_

- [ ] 13. Implement round-trip tests
  - [ ] 13.1 Implement PWX round-trip tests
    - Create adapters/pwx/round-trip/ directory
    - Create round-trip test files for each fixture
    - Test PWX → KRD → PWX with tolerance checking
    - Test KRD → PWX → KRD with tolerance checking
    - Verify duration conversions within tolerances
    - Verify target conversions within tolerances
    - Verify repetition blocks preserved
    - Verify extensions preserved
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
    - _Commit: "test: add PWX round-trip validation tests"_

- [ ] 14. Update dependency injection
  - [ ] 14.1 Update createDefaultProviders
    - Update application/providers.ts to include PWX components
    - Add pwxReader: PwxReader to Providers type
    - Add pwxWriter: PwxWriter to Providers type
    - Add convertPwxToKrd: ConvertPwxToKrd to Providers type
    - Add convertKrdToPwx: ConvertKrdToPwx to Providers type
    - Wire PWX adapters and use cases using functional composition
    - Update tests in providers.test.ts (PWX component creation, wiring)
    - _Requirements: 1.1, 1.2, 12.1, 12.2_
    - _Commit: "feat: add PWX support to dependency injection"_

- [ ] 15. Export public API
  - [ ] 15.1 Update src/index.ts with PWX exports
    - Export PwxReader and PwxWriter port types
    - Export ConvertPwxToKrd and ConvertKrdToPwx use case types
    - Export PwxParsingError type and createPwxParsingError factory
    - Verify all PWX components are accessible and properly typed
    - _Requirements: 1.1, 1.2, 12.1, 12.2_
    - _Commit: "feat: export PWX public API"_

## Notes

- **Reuse domain layer**: All domain schemas (KRD, Workout, Duration, Target) are shared with FIT and TCX conversion
- **Reuse validation**: SchemaValidator and ToleranceChecker are shared with FIT and TCX conversion
- **Reuse logger**: Logger port and console adapter are shared with FIT and TCX conversion
- **Independent implementation**: PWX conversion can be implemented without modifying FIT or TCX conversion
- **Mappers vs Converters**: Follow the same pattern as FIT/TCX - mappers have no logic (no tests), converters have logic (must have tests)
- **Functional style**: Use currying for dependency injection, no classes
- **Type safety**: Use Zod schemas for all PWX-specific types, infer TypeScript types with z.infer

## Dependencies

- **fast-xml-parser** (^4.3.0) - XML parsing and building
- **@kaiord/core domain** - Reuse KRD, Workout, Duration, Target schemas
- **@kaiord/core validation** - Reuse SchemaValidator and ToleranceChecker
- **@kaiord/core logger** - Reuse Logger port and console adapter
