<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/

## Purpose

Adapter implementations for ZWO reading, writing, validation, and conversion. All exports depend on `@kaiord/core` only (hexagonal architecture). Organized into reader/writer (fast-xml-parser), validators (XSD + well-formedness), converters (orchestrators), and domain-specific helpers (intervals, targets, duration, schema definitions).

## Key Files

| File                           | Description                                                               |
| ------------------------------ | ------------------------------------------------------------------------- |
| `fast-xml-parser.ts`           | Reader and writer factories using XMLParser/XMLBuilder                    |
| `xsd-validator.ts`             | Dual-path validator: XSD in Node.js, well-formedness fallback in browsers |
| `xsd-schema-validator.ts`      | Node.js-only XSD validation using `xsd-schema-validator` package          |
| `xsd-validator-browser.ts`     | Browser-only well-formedness validator                                    |
| `well-formedness-validator.ts` | Lightweight XML well-formedness check (no schema validation)              |
| `xml-validator-helpers.ts`     | Shared validation utilities (input/output/structure checks)               |
| `krd-to-zwift.converter.ts`    | KRD → ZWO orchestrator; delegates to encoders                             |
| `zwift-to-krd.converter.ts`    | ZWO → KRD orchestrator; delegates to extractors                           |
| `node-modules-loader.ts`       | Dynamic loader for optional XSD validator in Node.js                      |

## Subdirectories

| Directory       | Purpose                                                               |
| --------------- | --------------------------------------------------------------------- |
| `duration/`     | Duration encoding/decoding (time vs. distance-based workouts)         |
| `interval/`     | ZWO interval type mappers (SteadyState, Ramp, IntervalsT, FreeRide)   |
| `krd-to-zwift/` | KRD → ZWO encoders (metadata, intervals, targets, steps, text events) |
| `target/`       | Target converters (power, pace, HR, cadence) between domains          |
| `zwift-to-krd/` | ZWO → KRD extractors (metadata, intervals, tags)                      |
| `schemas/`      | Zod domain schemas (ZwiftSport, ZwiftTarget, ZwiftInterval)           |
| `round-trip/`   | Round-trip test helpers and real-file comparison utilities            |

## For AI Agents

### Working In This Directory

- **Converter pattern**: `krd-to-zwift.converter` and `zwift-to-krd.converter` are orchestrators (business logic, tests required). They invoke domain-specific encoders/extractors in subdirectories.
- **Encoder/extractor pattern**: Files in `krd-to-zwift/` and `zwift-to-krd/` are domain-specific converters (complex logic, tests). Builders and helpers support them.
- **Mapper pattern**: Simple transformations (camelCase ↔ snake_case, type coercions) live in `*.mapper.ts` files (no tests, max 20 LOC).
- **Validation strategy**: Create validator via `createZwiftValidator()` (auto-detects environment). In Node.js, uses XSD. In browsers, falls back to well-formedness.
- **Error context**: All errors thrown are wrapped via `createZwiftParsingError()` with logger context for debugging.

### Testing Requirements

- **Vitest conventions**: `it()` titles start with `"should "`. Bodies have `// Arrange`, `// Act`, `// Assert` comments.
- **Converter tests** (`*converter.test.ts`): Test orchestration logic, error handling, and integration with sub-components.
- **Round-trip tests** (`round-trip/*.test.ts`): Verify KRD ↔ ZWO conversions with real files, check tolerance thresholds.
- **Validator tests** (`xsd-validator.test.ts`, `well-formedness-validator.test.ts`): Test error detection and validation result structure.
- **Parser tests** (`fast-xml-parser.test.ts`): Test XML parsing with edge cases (attributes, encoding, nested elements).

### Common Patterns

- **Logger pattern**: All factories accept optional logger. If omitted, use `createConsoleLogger()` from `@kaiord/core`.

  ```typescript
  const reader = createFastXmlZwiftReader(logger, validator);
  ```

- **Validator composition**: Validators are functions, not classes. Easy to compose or mock.

  ```typescript
  type ZwiftValidator = (xmlString: string) => Promise<ZwiftValidationResult>;
  ```

- **KRD extensions structure**:

  ```typescript
  {
    structured_workout: { name, sport, steps },     // KRD canonical
    zwift: { author, description, tags, ... },      // ZWO-specific metadata
    fit: { timeCreated, manufacturer, ... }         // FIT attributes (optional)
  }
  ```

- **Schema domain casing**:
  - **Domain** (snake_case in types): `structured_workout`, `sport_type`, `threshold_sec_per_km`, `text_events`
  - **XML/parsed** (camelCase in objects): `sportType`, `durationType`, `thresholdSecPerKm`, `textEvent`

- **File structure limits**: Keep individual files ≤100 lines. Converters/extractors split into domain-specific helpers in subdirectories.

## Dependencies

### Internal

- `@kaiord/core` — KRD, WorkoutStep, RepetitionBlock, Sport, Logger, error factories
- All subdirectories (`duration/`, `interval/`, `krd-to-zwift/`, `target/`, `zwift-to-krd/`, `schemas/`, `round-trip/`)

### External

- `fast-xml-parser@^5.7.3` — XML parsing and building
- `xsd-schema-validator@^0.11.0` — XSD validation (Node.js only, optional, loaded dynamically)
- `zod@^4.4.3` — Schema validation

<!-- MANUAL: -->
