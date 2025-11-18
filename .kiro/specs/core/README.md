# Core Package Specs

This directory contains specifications for the `@kaiord/core` package, which provides bidirectional conversion between workout file formats and the canonical KRD (Kaiord Representation Definition) format.

## Specs Overview

### ✅ FIT ↔ KRD Conversion (COMPLETE)

**Status:** Implemented and tested (318 tests passing)

**Directory:** `fit-to-krd-conversion/`

**Description:** Bidirectional conversion between Garmin FIT workout files and KRD format. FIT is a binary format widely used by Garmin devices and platforms.

**Key Features:**

- FIT → KRD and KRD → FIT conversion
- Support for power, heart rate, cadence, and pace targets
- Time and distance-based durations
- Repetition blocks
- Swimming workouts (pool length, equipment)
- Advanced duration types (calorie, power conditionals, repeat conditionals)
- Round-trip validation with tolerances
- Extension preservation

**Implementation:**

- Uses `@garmin/fitsdk` for FIT parsing/encoding
- Hexagonal architecture with ports and adapters
- Zod schemas for type safety
- Comprehensive test coverage (unit, integration, round-trip)

---

### 🔄 TCX ↔ KRD Conversion (PLANNED)

**Status:** Spec complete, implementation pending

**Directory:** `tcx-to-krd-conversion/`

**Description:** Bidirectional conversion between Training Center XML (TCX) workout files and KRD format. TCX is an XML-based format developed by Garmin, widely used across fitness platforms.

**Key Features:**

- TCX → KRD and KRD → TCX conversion
- Support for heart rate, speed, and cadence targets
- Time, distance, and lap button durations
- Repetition blocks
- Extension preservation
- Round-trip validation with tolerances

**Implementation Plan:**

- Uses `fast-xml-parser` for XML parsing/building
- Reuses domain schemas from FIT conversion
- Reuses validation and tolerance checking
- Independent implementation (no FIT dependencies)

**Dependencies:**

- `fast-xml-parser` (^4.3.0)
- Shared domain layer with FIT conversion

---


### 🔄 Zwift ↔ KRD Conversion (PLANNED)

**Status:** Spec complete, implementation pending

**Directory:** `zwift-to-krd-conversion/`

**Description:** Bidirectional conversion between Zwift workout files (.zwo format) and KRD format. Zwift is an XML-based format used by the Zwift virtual cycling and running platform.

**Key Features:**

- Zwift → KRD and KRD → Zwift conversion
- Support for all Zwift interval types (SteadyState, Warmup, Ramp, Cooldown, IntervalsT, FreeRide)
- Power targets (FTP percentage), pace targets (sec/km), cadence targets
- Time and distance-based durations
- Text events (coaching cues with time/distance offsets)
- Tags and metadata preservation
- Extension preservation
- Round-trip validation with tolerances

**Implementation Plan:**

- Uses `fast-xml-parser` for XML parsing/building
- Reuses domain schemas from FIT conversion
- Reuses validation and tolerance checking
- Reuses XML patterns from TCX conversion
- Independent implementation (no FIT/TCX dependencies)

**Dependencies:**

- `fast-xml-parser` (^4.3.0)
- Shared domain layer with FIT conversion

---

## Architecture

All three conversions follow the same hexagonal architecture:

```
packages/core/
├── domain/
│   ├── schemas/                # Zod schemas (SHARED)
│   │   ├── krd.ts
│   │   ├── workout.ts
│   │   ├── duration.ts
│   │   ├── target.ts
│   │   ├── sport.ts
│   │   └── intensity.ts
│   ├── types/
│   │   └── errors.ts           # Error types (FitParsingError, TcxParsingError, ZwiftParsingError)
│   └── validation/             # Validation (SHARED)
│       ├── schema-validator.ts
│       └── tolerance-checker.ts
├── application/
│   ├── use-cases/
│   │   ├── convert-fit-to-krd.ts
│   │   ├── convert-krd-to-fit.ts
│   │   ├── convert-tcx-to-krd.ts
│   │   ├── convert-krd-to-tcx.ts
│   │   ├── convert-zwift-to-krd.ts
│   │   ├── convert-krd-to-zwift.ts
│   │   └── validate-round-trip.ts
│   └── providers.ts            # DI wiring for all formats
├── ports/
│   ├── fit-reader.ts
│   ├── fit-writer.ts
│   ├── tcx-reader.ts
│   ├── tcx-writer.ts
│   ├── zwift-reader.ts
│   ├── zwift-writer.ts
│   └── logger.ts               # Logger contract (SHARED)
└── adapters/
    ├── fit/
    │   └── garmin-fitsdk.ts    # @garmin/fitsdk implementation
    ├── tcx/
    │   └── fast-xml-parser.ts  # fast-xml-parser implementation
    ├── zwift/
    │   └── fast-xml-parser.ts  # fast-xml-parser implementation
    └── logger/
        └── console-logger.ts   # Console logger (SHARED)
```

## Shared Components

The following components are shared across all three conversions:

### Domain Layer (SHARED)

- **Zod Schemas**: KRD, Workout, Duration, Target, Sport, Intensity, Equipment
- **Validation**: SchemaValidator, ToleranceChecker
- **Error Types**: Base error types and factories

### Infrastructure (SHARED)

- **Logger**: Logger port and console adapter
- **Providers**: Dependency injection wiring

## Implementation Order

1. ✅ **FIT ↔ KRD** (Complete)
   - Establishes domain schemas
   - Implements validation and tolerance checking
   - Sets architectural patterns

2. 🔄 **TCX ↔ KRD** (Next)
   - Reuses domain schemas
   - Adds XML parsing capability
   - Independent of FIT implementation

3. 🔄 **Zwift ↔ KRD** (After TCX)
   - Reuses domain schemas
   - Reuses XML parsing patterns from TCX
   - Independent of FIT/TCX implementations

## Testing Strategy

All conversions follow the same testing approach:

### Unit Tests

- Mappers (simple data transformation, no tests)
- Converters (complex logic, must have tests)
- Validators
- Error handling

### Integration Tests

- Format → KRD conversion with sample files
- KRD → Format conversion with sample files
- Extension preservation

### Round-Trip Tests

- Format → KRD → Format with tolerance checking
- KRD → Format → KRD with tolerance checking
- Mixed duration types
- Mixed target types
- Repetition blocks

### Golden File Tests

- Compare converted KRD against expected JSON
- Validate output against format-specific schemas

## Tolerances

All conversions use the same tolerance thresholds:

- **Time**: ±1 second
- **Distance**: ±1 meter
- **Power**: ±1 watt
- **FTP**: ±1% FTP
- **Heart Rate**: ±1 bpm
- **Cadence**: ±1 rpm
- **Pace**: ±0.01 m/s

## Public API

The `@kaiord/core` package exports:

### Types and Schemas

- KRD, Workout, Duration, Target types
- Zod schemas for validation
- Error types

### Use Cases

- `convertFitToKrd`, `convertKrdToFit`
- `convertTcxToKrd`, `convertKrdToTcx` (planned)
- `convertZwiftToKrd`, `convertKrdToZwift` (planned)

### Providers

- `createDefaultProviders()` - DI wiring for all formats

### Ports

- FitReader, FitWriter
- TcxReader, TcxWriter (planned)
- ZwiftReader, ZwiftWriter (planned)
- Logger

## Dependencies

### External Libraries

- `@garmin/fitsdk` - FIT parsing/encoding
- `fast-xml-parser` - XML parsing/building (TCX, Zwift)
- `zod` - Schema validation
- `zod-to-json-schema` - JSON Schema generation

### Development Dependencies

- `vitest` - Testing framework
- `@faker-js/faker` - Test data generation
- `rosie` - Factory pattern for fixtures

## References

- [FIT SDK Documentation](https://github.com/garmin/fit-javascript-sdk)
- [TCX Schema](https://www8.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd)
- [Zwift Workout Format](https://zwift.com) - XML-based workout format
- [Zod Documentation](https://zod.dev)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
