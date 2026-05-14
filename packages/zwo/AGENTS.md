<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# @kaiord/zwo - ZWO Format Adapter

## Purpose

Adapter implementing the Zwift Workout XML (ZWO) format for Kaiord. Provides reading, writing, and validation of Zwift workout files with KRD (Kaiord Canonical Format) round-trip conversion. Uses `fast-xml-parser` for XML I/O and XSD schema validation for correctness. Supports all major ZWO interval types: SteadyState, Warmup/Cooldown ramps, IntervalsT (structured intervals), and FreeRide segments.

## Key Files

| File                                     | Description                                                                                               |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                           | Public API exports: factories (`createZwiftReader/Writer`) and pre-built instances (`zwiftReader/Writer`) |
| `src/types.ts`                           | Validation types: `ZwiftValidator`, `ZwiftValidationResult`, `ZwiftValidationError`                       |
| `src/browser.ts`                         | Browser-safe exports (well-formedness validation only; no XSD)                                            |
| `src/adapters/fast-xml-parser.ts`        | Reader/writer factories using XMLParser/XMLBuilder                                                        |
| `src/adapters/xsd-validator.ts`          | Dual validation: XSD in Node.js, well-formedness in browsers                                              |
| `src/adapters/krd-to-zwift.converter.ts` | Orchestrates KRD → ZWO XML conversion                                                                     |
| `src/adapters/zwift-to-krd.converter.ts` | Orchestrates ZWO XML → KRD conversion                                                                     |
| `schema/zwift-workout.xsd`               | ZWO XSD schema; copied to `dist/schema/` at build time                                                    |

## Subdirectories

| Directory                    | Purpose                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------- |
| `src/adapters/`              | Reader, writer, validator, converter implementations and helpers                 |
| `src/adapters/duration/`     | Duration/time encoding/decoding (time vs. distance-based workouts)               |
| `src/adapters/interval/`     | ZWO interval types (SteadyState, Ramp, IntervalsT, FreeRide) mappers and helpers |
| `src/adapters/krd-to-zwift/` | KRD → ZWO encoders: metadata, intervals, targets, steps, text events             |
| `src/adapters/target/`       | Target (power/pace/HR/cadence) converters between KRD and ZWO                    |
| `src/adapters/zwift-to-krd/` | ZWO → KRD extractors: metadata, intervals, tags                                  |
| `src/adapters/schemas/`      | Zod domain schemas for ZWO types (sport, target, interval)                       |
| `src/adapters/round-trip/`   | Round-trip test helpers (comparison, tolerance checking)                         |
| `src/test-utils/`            | Test fixtures and constants                                                      |
| `schema/`                    | Bundled XSD schema (source and dist copy)                                        |

## For AI Agents

### Working In This Directory

- **Imports**: ZWO exports factories and pre-built instances from `index.ts`. Use `createZwiftReader(logger)` or `createZwiftValidator()` to inject custom loggers.
- **Hexagonal arch**: `adapters/` depend on `@kaiord/core` only. No external adapters imported. Domain types are read-only views of parsed ZWO.
- **XML I/O**: XMLParser/Builder configured with `@_` attribute prefix and value parsing. Fast-xml-parser handles all XML serialization.
- **Validation**: Dual-path validator checks XSD schema in Node.js (via `xsd-schema-validator`), well-formedness in browsers (lightweight fallback).
- **Converters**: `krd-to-zwift.converter` and `zwift-to-krd.converter` are orchestrators invoking domain-specific encoders/extractors. They are NOT simple mappers (they have logic and tests).
- **KRD round-trip**: Preserves Zwift metadata in `extensions.zwift` (author, description, tags, durationType, thresholdSecPerKm) and FIT attributes via kaiord namespace attributes.

### Testing Requirements

- **Vitest conventions**:
  - All `it()` titles start with `"should "` (lowercase).
  - Every test body has `// Arrange`, `// Act`, `// Assert` comments (in order, separated by blank lines).
  - Enforced by ESLint at IDE time and pre-commit hook.

- **Round-trip tolerances** (KRD → ZWO → KRD):
  - Time: ±1s
  - Power: ±1W or ±1% FTP
  - HR: ±1 bpm
  - Cadence: ±1 rpm

- **Coverage**: 80% for src/adapters/ (core logic). Test files in `round-trip/` and `*.test.ts` verify real Zwift files round-trip correctly.

- **Key test suites**:
  - `fast-xml-parser.test.ts` — Parser edge cases (attributes, nested elements, encoding).
  - `krd-to-zwift.converter.test.ts` — Metadata, intervals, steps encoding.
  - `zwift-to-krd.converter.test.ts` — Metadata, interval extraction, tag handling.
  - `round-trip/zwift-round-trip.test.ts` — Full KRD ↔ ZWO conversion round-trips.
  - `xsd-validator.test.ts` — XSD validation error detection.

### Common Patterns

- **Dual exports**: Factories accept optional `logger`, fall back to console logger. Pre-built instances (`zwiftReader`, `zwiftWriter`) use console logger.

  ```typescript
  import { createZwiftValidator } from "@kaiord/zwo";
  const validator = createZwiftValidator(myLogger);
  ```

- **Converters vs. Mappers**: Use `.converter.ts` when logic, state, or tests exist; `.mapper.ts` for simple transformations (no tests, <20 LOC). Both are in `src/adapters/`.

- **Schema domains**:
  - **ZWO domain** (snake_case): e.g., `structured_workout`, `sport_type`, `threshold_sec_per_km`. Used in KRD and ZWO extensions.
  - **Adapter domain** (camelCase): e.g., `sportType`, `durationType`, `thresholdSecPerKm`. Used when mapping ZWO XML parsed attributes.

- **Error handling**: Throw `createZwiftParsingError()` (from `@kaiord/core`) for ZWO-specific issues. Logger captures context.

- **Browser mode**: Use `src/browser.ts` export. Validator falls back to well-formedness checking (XML parsing only); XSD validation not available. Build system exports browser version via conditional `exports` in `package.json`.

## Dependencies

### Internal

- `@kaiord/core` — Domain types (KRD, WorkoutStep, RepetitionBlock, Sport, Logger), use cases, ports, error factories.

### External

- `fast-xml-parser@^5.7.3` — XMLParser (parse ZWO → JS object) and XMLBuilder (JS object → XML string).
- `xsd-schema-validator@^0.11.0` — XSD validation in Node.js; unused in browsers.
- `zod@^4.4.3` — Domain schema definitions (ZwiftSport, ZwiftTarget, ZwiftInterval types).

<!-- MANUAL: -->
