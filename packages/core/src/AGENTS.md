<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src

## Purpose

TypeScript source for `@kaiord/core`. Organised by hexagonal layer: `domain` (pure types, Zod schemas, validation, zones, errors), `application` (use cases over ports), `ports` (interfaces only), `adapters` (in-package adapter implementations — currently only a console logger and noop analytics), and `tests`/`test-utils` (fixtures and round-trip helpers).

## Key Files

| File       | Description                                                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts` | Public API barrel — explicit named re-exports for tree-shaking. Imports must not introduce side effects (package is `"sideEffects": false`). |

## Subdirectories

| Directory      | Purpose                                                                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/`      | Pure Zod schemas, types, validators, error classes, power-zone math (see `domain/AGENTS.md`)                                                                            |
| `application/` | `fromBinary`/`fromText`/`toBinary`/`toText` use cases that orchestrate a reader/writer port and `validateKrd` (see `application/AGENTS.md`)                             |
| `ports/`       | Interface-only contracts: `BinaryReader`/`Writer`, `TextReader`/`Writer`, `Logger`, `AuthProvider`, `TokenStore`, `WorkoutService`, `Analytics` (see `ports/AGENTS.md`) |
| `adapters/`    | The two in-package adapter implementations: `console-logger` and `noop-analytics` (see `adapters/AGENTS.md`)                                                            |
| `test-utils/`  | Exposed via the `./test-utils` subpath: fixture loaders, factory builders, tolerance constants, profile-snapshot fixtures (see `test-utils/AGENTS.md`)                  |
| `tests/`       | Test-only fixtures and round-trip comparison utilities (see `tests/AGENTS.md`)                                                                                          |
| `types/`       | Cross-cutting protocol DTOs that don't belong in `domain` — currently only `ProfileSnapshot` for the SPA-Bridge handshake (see `types/AGENTS.md`)                       |

## For AI Agents

### Working In This Directory

- Import direction is strict: `domain` ← `ports` ← `application` / `adapters`. `domain` never imports `ports`/`application`/`adapters`. `application` never imports `adapters`.
- `index.ts` is the only allowed surface for `@kaiord/core` consumers. Add new public exports here; don't ask consumers to deep-import from subpaths (except `./test-utils`, which has its own entry).
- Keep file size ≤100 lines (tests exempt). Split into a folder of focused modules when growing.

### Testing Requirements

- Coverage target: 80%. Co-located `*.test.ts` next to each source file. Title rule (`should ...`) and AAA rule (`// Arrange`, `// Act`, `// Assert`) enforced repo-wide.

### Common Patterns

- Factory functions over classes: `createConsoleLogger()`, `createSchemaValidator()`, `createToleranceChecker()`.
- Errors are dual-exported: `class KrdValidationError` + `createKrdValidationError(message, errors)`.

<!-- MANUAL: -->
