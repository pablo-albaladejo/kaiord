<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# core

## Purpose

`@kaiord/core` is the foundation of the kaiord monorepo: pure domain types and Zod schemas for the canonical KRD format, application-layer conversion use cases (`fromBinary`/`fromText`/`toBinary`/`toText`), port interfaces, and a console logger / noop analytics adapter. NO format adapter implementations live here — FIT/TCX/ZWO/GCN adapters depend on core, never the reverse. KRD (`application/vnd.kaiord+json`) is the canonical exchange format; every conversion goes through it.

## Key Files

| File             | Description                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`   | Public API barrel — re-exports schemas, types, errors, ports, application functions, round-trip validator, and profile-snapshot DTO.  |
| `package.json`   | Declares dual exports (`.` and `./test-utils`), `zod ^4.4.3` runtime dep, faker/rosie/tsup/vitest devDeps, schema/fixture generators. |
| `README.md`      | Public-facing API documentation with quick-start, schema validation, error types, and tree-shaking guidance.                          |
| `tsup.config.ts` | Build configuration (referenced by `package.json` build script — produces `dist/`).                                                   |

## Subdirectories

| Directory  | Purpose                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/`     | TypeScript source (see `src/AGENTS.md`)                                                                            |
| `docs/`    | Package-specific docs: API examples, tree-shaking, KRD fixture generation, Zwift extensions (see `docs/AGENTS.md`) |
| `schema/`  | Published JSON Schema + XSD artifacts referenced from `package.json` `files` (see `schema/AGENTS.md`)              |
| `scripts/` | Build-time generators: JSON Schema from Zod, KRD/Zwift fixtures from FIT (see `scripts/AGENTS.md`)                 |

## For AI Agents

### Working In This Directory

- This is the innermost layer of the monorepo. `domain` depends on nothing except `zod`. `application` MUST NOT import external libs or adapters. Adapter packages may depend on `@kaiord/core`; `@kaiord/core` MUST NOT import any other workspace package at runtime.
- Domain schemas use **snake_case** enum values (`indoor_cycling`, `lap_swimming`, `structured_workout`); access them via `sportSchema.enum.cycling`, never raw strings.
- KRD's `metadata.sport` and `session.sport` are `z.string()` (not `sportSchema`) for forward compatibility with unknown sport values from FIT files.
- All errors are exported as both a `class` (for `instanceof` checks) and a `create*` factory (for FP style) — see `src/domain/types/errors.ts`.
- Files MUST stay ≤100 lines (tests exempt). Functions <40 LOC. Use `type` over `interface`. Separate type imports (`import type { X } from ...`).

### Testing Requirements

- Coverage target: **80%** for this package (run `pnpm test:coverage` to verify).
- Vitest is the only runner. Tests live next to source as `*.test.ts`.
- Every `it()` title MUST start with the literal `"should "`. Every `it()` body MUST contain Pascal-case `// Arrange`, `// Act`, `// Assert` line comments in that order (enforced by `scripts/check-test-{title-should,aaa}.mjs` at the monorepo root).
- The exported `@kaiord/core/test-utils` subpath provides fixture loaders (`loadFitFixture`, `loadKrdFixture`, `loadFixturePair`, `FIXTURE_NAMES`) AND rosie-based factory builders (`buildKRD`, `buildWorkout`, `buildWorkoutStep`, `buildTarget`, `buildDuration`, …) for downstream packages.

### Common Patterns

- **Strategy injection.** `fromBinary(buffer, reader, logger?)` and `toBinary(krd, writer, logger?)` take a `BinaryReader`/`BinaryWriter` from a format adapter. Core never imports `@kaiord/fit` etc.
- **Zod-first.** Every domain type is `z.infer<typeof xxxSchema>` — schema is the source of truth.
- **Discriminated unions** for `Duration` (by `type`), `Target` (by `type`), `*Value` schemas (by `unit`).
- **Validation boundary.** `validateKrd(unknown)` throws `KrdValidationError`; `extractWorkout(krd)` extracts the typed `Workout` from `krd.extensions.structured_workout`.

## Dependencies

### Internal

None. This is the root of the dependency DAG.

### External

- `zod ^4.4.3` (runtime) — schema validation and type inference.
- `@faker-js/faker`, `rosie` (devDep, but RE-EXPORTED for tests under `./test-utils` via rosie factories).
- `tsup`, `tsx`, `typescript`, `vitest`, `@vitest/coverage-v8` (build/test only).

<!-- MANUAL: -->
