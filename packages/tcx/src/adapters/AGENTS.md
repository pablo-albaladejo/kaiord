<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-05-14 -->

# adapters

## Purpose

Conversion and validation logic for TCX ↔ KRD transformations. Implements XML parsing/building, schema validation, and step-by-step conversion from TCX format to KRD (Kaiord Record Document) and vice versa.

## Key Files

| File                 | Description                                                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fast-xml-parser.ts` | Main reader/writer entry points. Uses `XMLParser`/`XMLBuilder` from `fast-xml-parser` library. Reader: TCX XML → intermediate object → KRD. Writer: KRD → intermediate object → TCX XML. |
| `xsd-validator.ts`   | XSD schema validation. Wraps `XMLValidator.validate()` and returns structured error array.                                                                                               |

## Subdirectories

| Directory     | Purpose                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `workout/`    | Conversion of TCX Workout structure to/from KRD (see `workout/AGENTS.md`).                        |
| `target/`     | Conversion of TCX Target (pace, heart rate, cadence) to/from KRD Target (see `target/AGENTS.md`). |
| `duration/`   | Conversion of TCX Duration (time, distance) to/from KRD Duration (see `duration/AGENTS.md`).      |
| `schemas/`    | Zod schemas and enum mappings for sport types and duration (see `schemas/AGENTS.md`).             |
| `round-trip/` | Integration test for end-to-end TCX → KRD → TCX workflows.                                        |

## For AI Agents

### Working In This Directory

**Conversion Flow:**

1. **Reader** (`fast-xml-parser.ts`):
   - Parse XML string → JavaScript object tree (attributes prefixed `@_`).
   - Validate structure (must have `TrainingCenterDatabase.Workouts.Workout`).
   - Extract metadata, extensions, and workout.
   - Convert TCX workout structure to KRD via `convertTcxToKRD()`.

2. **Writer** (`fast-xml-parser.ts`):
   - Convert KRD to TCX structure via `convertKRDToTcx()` (delegates to `workout/tcx.converter.ts`).
   - Build XML tree.
   - Validate against XSD schema via `TcxValidator`.
   - Return formatted XML string.

**Validator** (`xsd-validator.ts`):

- Uses `XMLValidator.validate()` to check XML structure only (basic well-formedness).
- Note: full XSD schema validation not implemented; validator checks XML syntax only.

**Key Interfaces:**

- `TextReader`: `(xmlString: string) => Promise<KRD>`
- `TextWriter`: `(krd: KRD) => Promise<string>`
- `TcxValidator`: `(xmlString: string) => Promise<TcxValidationResult>`

### Testing Requirements

**Coverage:** 80% (includes all subdirectories).

**Test Files:**

- `fast-xml-parser.test.ts`: Tests reader/writer at integration level (sample TCX → KRD → TCX).
- `xsd-validator.test.ts`: Tests validation with valid/invalid XML.
- Subdirectory tests: Unit tests for each converter (see subdirectory AGENTS.md).

**Round-Trip Tolerances (Enforced in Round-Trip Tests):**

- Time: ±1s (seconds)
- Power: ±1W or ±1%FTP
- Heart rate: ±1bpm
- Cadence: ±1rpm

### Common Patterns

**Parsing Untyped XML:**

- XML is parsed as JavaScript object trees; use `as Record<string, unknown>` for type safety.
- Attributes are prefixed `@_` (e.g., `@_xsi`, `@_xmlns`).
- Missing optional fields return `undefined`; wrap arrays: `Array.isArray(x) ? x : [x]`.

**Error Handling:**

- Throw `createTcxParsingError()` for structure/format violations.
- Throw `createTcxValidationError()` for XSD failures (with error list).

**Logger Usage:**

- All converters accept `Logger` parameter.
- Use `logger.debug()` for detailed state.
- Use `logger.info()` for major step completion.
- Use `logger.warn()` for recoverable issues.
- Use `logger.error()` before throwing.

**Extensions Preservation:**

- TCX `Extensions` blocks are extracted and stored in KRD as `extensions: { tcx: { /* raw */ } }`.
- During write, if KRD has `extensions.tcx`, reconstruct that block in output.
- Enables round-trip preservation of non-standard Garmin fields.

## Dependencies

### Internal

- `@kaiord/core`: Domain types (KRD, Duration, Target, WorkoutStep, Sport, Logger), error factories, parsing/validation error constructors.

### External

- `fast-xml-parser@^5.7.3`: `XMLParser`, `XMLBuilder`, `XMLValidator`.
- `zod@^4.4.3`: Schema validation (sport, duration type enums).
