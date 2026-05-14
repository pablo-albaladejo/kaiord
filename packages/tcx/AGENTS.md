<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# @kaiord/tcx

## Purpose

TCX (Training Center XML) format adapter for Kaiord. Provides reading, writing, and XSD validation of Garmin Training Center XML files. Maps TCX structure to/from KRD (Kaiord Record Document) using `fast-xml-parser` for XML operations.

## Key Files

| File                              | Description                                                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                    | Public API exports. Factory functions (`createTcxReader`, `createTcxWriter`) and pre-built singletons (`tcxReader`, `tcxWriter`). |
| `src/types.ts`                    | Type definitions: `TcxValidator`, `TcxValidationResult`.                                                                          |
| `src/adapters/fast-xml-parser.ts` | Main reader/writer factories using `XMLParser`/`XMLBuilder`. Entry point for TCX ↔ KRD conversion.                                |
| `src/adapters/xsd-validator.ts`   | XSD validation using `XMLValidator` from fast-xml-parser.                                                                         |
| `package.json`                    | Dependencies: `@kaiord/core`, `fast-xml-parser@^5.7.3`, `zod@^4.4.3`.                                                             |
| `README.md`                       | Public documentation with usage examples and feature list.                                                                        |

## Subdirectories

| Directory         | Purpose                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `src/adapters/`   | Reader/writer/validator implementations and conversion logic (see `adapters/AGENTS.md`). |
| `src/test-utils/` | Fixture constants for test files (see `test-utils/AGENTS.md`).                           |

## For AI Agents

### Working In This Directory

**Hexagonal Architecture:**

- `@kaiord/tcx` is a pure adapter package: depends on `@kaiord/core` only.
- Exports implement `TextReader` and `TextWriter` ports from core.
- KRD is canonical; all conversions flow TCX → KRD → TCX.

**Export Strategy (Dual Variants):**

- Pre-built singletons: `tcxReader`, `tcxWriter` (no logger needed for defaults).
- Factory functions: `createTcxReader(logger?)`, `createTcxWriter(logger?)` (inject custom logger).
- `createXsdTcxValidator(logger?)` for standalone validation.
- Callers may use `createDefaultProviders({ tcx: createTcxProviders() })` for integration.

**File Naming:**

- Converters: `*.converter.ts` (complex domain logic, must test).
- Mappers: `*.mapper.ts` (simple transformation, no test).
- Helpers/Walkers: `*-helper.ts`, `*-walker.ts` (state machines, tested separately).

**Schemas (Domain Camel-Case in Adapters):**

- TCX XML uses camelCase field names (`trainingCenterDatabase`, `@_xsi`).
- KRD uses snake_case (`sport_type`, `indoor_cycling`).
- Schema enums in `schemas/` define mappings.

### Testing Requirements

**Coverage:** 80% for this package.

**Round-Trip Tolerances:**

- Time: ±1s
- Power: ±1W or ±1%FTP
- Heart rate: ±1bpm
- Cadence: ±1rpm

**Test Conventions (Enforced):**

- Every `it()` title MUST start with `"should "` (lowercase, no caps).
- Every `it()` body MUST have canonical `// Arrange`, `// Act`, `// Assert` sections (blank lines between).

**Key Test Patterns:**

- Unit tests for converters: isolated domain logic, mocked dependencies.
- Round-trip tests: TCX → KRD → TCX, verify output matches (within tolerance).
- Validation tests: XSD schema conformance, error reporting.
- Integration tests in `round-trip/` verify end-to-end workflows.

### Common Patterns

**Error Handling:**

- Use `createTcxParsingError()` for XML parse/structure issues.
- Use `createTcxValidationError()` for XSD validation failures.
- Errors include field path and message for debugging.

**Logging:**

- All public factories accept optional `Logger` (defaults to `createConsoleLogger`).
- Use `logger.debug()` for internal state (step index, extensions, etc.).
- Use `logger.info()` for major milestones (parsing complete, validation passed).
- Use `logger.warn()` for recoverable issues (missing optional fields).
- Use `logger.error()` for failures (throw after logging).

**Metadata & Extensions:**

- TCX extensions (e.g., Garmin power, cadence) are preserved in `Extensions` blocks.
- KRD stores extensions as `{ tcx: { /* raw */ } }` for round-trip fidelity.
- Metadata (name, description) extracted and stored in KRD top-level.

## Dependencies

### Internal

- `@kaiord/core`: Domain types, ports, error factories, logger interface.

### External

- `fast-xml-parser@^5.7.3`: XML parsing and building.
- `zod@^4.4.3`: Schema validation (sport enums, duration types).
- `@types/node`: Node.js type definitions.
- `typescript`: Language (strict mode).
- `vitest`: Testing framework.
