<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# domain

## Purpose

Pure domain layer: Zod schemas and inferred types for the KRD canonical format, converters (length unit, workout → KRD wrapper), validation primitives (Zod validator, tolerance checker, KRD extractor), Coggan power-zone math, type guards, and the full error-class taxonomy. Depends on nothing except `zod`.

## Key Files

| File                  | Description                                                                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`            | Barrel re-exporting every schema, type, error class/factory, validator, converter, and zone helper. Single import point for the public API.                                   |
| `type-guards.ts`      | `isRepetitionBlock(step)` — discriminates `WorkoutStep` from `RepetitionBlock` by checking for `repeatCount` and `steps` keys (the workout `steps` array is a union of both). |
| `type-guards.test.ts` | Tests for `isRepetitionBlock` covering positive, negative, and edge cases.                                                                                                    |

## Subdirectories

| Directory     | Purpose                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `schemas/`    | All Zod schemas (KRD envelope, workout, duration, target, sport enums, target-value subtypes) (see `schemas/AGENTS.md`)                      |
| `converters/` | Domain-level pure converters: `convertLengthToMeters`, `createWorkoutKRD` (see `converters/AGENTS.md`)                                       |
| `validation/` | `validateKrd`, `extractWorkout`, `createSchemaValidator`, `createToleranceChecker`, `mapZodErrors` (see `validation/AGENTS.md`)              |
| `zones/`      | Coggan 7-band power-zone-to-%FTP mapping and inverse, with strict `RangeError` semantics (see `zones/AGENTS.md`)                             |
| `types/`      | Error classes (`FitParsingError`, `KrdValidationError`, `ToleranceExceededError`, …) with dual class/factory exports (see `types/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- This is the innermost layer. The ONLY external dep allowed is `zod`. Importing from `../application`, `../ports`, `../adapters`, or any other workspace package is forbidden and will violate hexagonal layering.
- All public types are `z.infer<typeof schema>` — schema is the source of truth. Do NOT hand-write a type alongside its schema.
- Domain schema enum values use snake_case (`indoor_cycling`, `structured_workout`, `repeat_until_power_greater_than`). Adapter packages may translate to camelCase or numeric codes for wire format.
- Discriminated unions use a string discriminator: `Duration` discriminates on `type`, `Target` on `type`, `*Value` schemas on `unit`. Always use `z.discriminatedUnion("type", [...])` so error messages stay readable.

### Testing Requirements

- Coverage target: 80%. Every schema, converter, validator, zone helper, and error class has a co-located `*.test.ts`. AAA + `should ` invariants apply.

### Common Patterns

- **Schema → type via `z.infer`**: every public type comes from a schema.
- **Dual export for errors**: `class FooError` + `createFooError(...)`.
- **Strict discriminated unions** for duration/target.

## Dependencies

### Internal

None (root of the dependency DAG within core).

### External

- `zod` — schemas, validation, type inference.

<!-- MANUAL: -->
