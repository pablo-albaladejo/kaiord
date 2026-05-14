<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/

## Purpose

Source root for `@kaiord/zwo`. Contains public API exports, type definitions, and adapter implementations organized by concern (readers, writers, validators, converters, helpers).

## Key Files

| File         | Description                                                                           |
| ------------ | ------------------------------------------------------------------------------------- |
| `index.ts`   | Main entry point; exports factories and pre-built instances                           |
| `types.ts`   | Validation result types (ZwiftValidator, ZwiftValidationResult, ZwiftValidationError) |
| `browser.ts` | Browser-safe entry point (well-formedness validation only)                            |

## Subdirectories

| Directory     | Purpose                                                             |
| ------------- | ------------------------------------------------------------------- |
| `adapters/`   | Reader, writer, validator, and converter implementations            |
| `schema/`     | Bundled XSD schema (symlinked from repo root at build time)         |
| `test-utils/` | Test fixtures and constants exported for use by downstream packages |

## For AI Agents

### Working In This Directory

- Entry point `index.ts` is the public API. All consumer imports go through here.
- Factories created here delegate to `adapters/` implementations.
- Types in `types.ts` are re-exported; see adapters for full domain types.
- Browser mode (`browser.ts`) is a lightweight variant for browser environments (no XSD validation).

### Testing Requirements

- No tests in `src/` root. All tests live in `adapters/` subdirectories alongside implementations.

### Common Patterns

- **Dual exports**: Pre-built instances (`zwiftReader`, `zwiftWriter`) use console logger by default. Factories accept optional logger override.
- **Schema access**: Bundled schema is in `schema/` and copied to `dist/schema/` at build time by `postbuild` script.

## Dependencies

### Internal

- `adapters/` (all implementations)

### External

None directly; all external dependencies are in adapters.

<!-- MANUAL: -->
