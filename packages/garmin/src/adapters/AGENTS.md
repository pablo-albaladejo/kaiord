<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters

## Purpose

Core adapter implementations for GCN ↔ KRD conversion. Includes reader/writer factories, converters for GCN structured workouts, mappers for enums and targets, and Zod schemas for runtime validation of both GCN input (flexible) and output (strict) formats.

## Key Files

| File                                          | Description                                                                                          |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `garmin-reader.ts`                            | `TextReader` port implementation (GCN JSON → KRD). Creates reader via `createGarminReader(logger)`.  |
| `garmin-writer.ts`                            | `TextWriter` port implementation (KRD → GCN JSON). Creates writer via `createGarminWriter(options)`. |
| `converters/garmin-to-krd.converter.ts`       | GCN → KRD conversion logic. Parses GCN JSON, extracts sport, steps, targets.                         |
| `converters/krd-to-garmin.converter.ts`       | KRD → GCN conversion logic. Maps KRD workout to GCN input format.                                    |
| `converters/garmin-workout-step.converter.ts` | Maps KRD step → GCN workout step. Handles duration, target, condition, note.                         |
| `converters/garmin-repetition.converter.ts`   | Maps KRD repetition block → GCN repeat structure with nested child steps.                            |
| `converters/executable-step.converter.ts`     | Converts flat executable step → KRD step with duration and target.                                   |
| `converters/flatten-segments.converter.ts`    | Flattens multisport GCN segments into sequential KRD steps.                                          |
| `mappers/sport.mapper.ts`                     | Maps KRD sport → GCN sportTypeId/key (e.g., `running` → 1, `cycling` → 2).                           |
| `mappers/target-to-garmin.mapper.ts`          | Maps KRD target (power, HR, speed, cadence) → GCN target structure.                                  |
| `mappers/target-from-garmin.mapper.ts`        | Maps GCN target → KRD target fields.                                                                 |
| `mappers/target-pace.mapper.ts`               | Pace zone conversion for running: KRD speed ranges → GCN pace zones.                                 |
| `mappers/condition.mapper.ts`                 | Maps KRD condition → GCN conditionTypeId/key (e.g., `open` → 1).                                     |
| `mappers/equipment.mapper.ts`                 | Maps KRD equipment → GCN equipmentTypeId/key (e.g., `goggles` → 5).                                  |
| `mappers/intensity.mapper.ts`                 | Maps KRD intensity → GCN intensityTypeId/key (e.g., `easy` → 1).                                     |
| `mappers/stroke.mapper.ts`                    | Maps KRD stroke → GCN strokeTypeId/key (e.g., `freestyle` → 1).                                      |
| `schemas/garmin-workout-parse.schema.ts`      | Top-level Zod schema for parsing GCN workout JSON.                                                   |
| `schemas/common/`                             | Shared enum schemas (sport, condition, equipment, stroke, target, step, unit types).                 |
| `schemas/input/`                              | Flexible input schemas for GCN payloads sent to API.                                                 |
| `schemas/output/`                             | Strict output schemas for GCN payloads from API (with expanded type objects).                        |

## Subdirectories

| Directory     | Purpose                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `converters/` | GCN ↔ KRD converters and related helpers (see `converters/AGENTS.md`).                                 |
| `mappers/`    | Enum/domain mappers: sport, target, condition, equipment, intensity, stroke (see `mappers/AGENTS.md`). |
| `schemas/`    | Zod validators for GCN input/output and common enums (see `schemas/AGENTS.md`).                        |
| `utils/`      | Helpers (e.g., `is-logger.ts`).                                                                        |
| `round-trip/` | Round-trip integration tests (see `round-trip/AGENTS.md`).                                             |

## For AI Agents

### Working In This Directory

**Converter Pattern:**

- Converters handle complex domain transformation and are **always tested**.
- Example: `garmin-to-krd.converter.ts` parses GCN JSON, validates schema, extracts sport/steps/metadata, maps to KRD.
- Converters may compose mappers (which are pure, no tests needed).

**Mapper Pattern:**

- Mappers are pure transformations: `sourceEnum → targetEnum`.
- Examples: `sport.mapper.ts` maps KRD sport (`running`) → GCN ID (1).
- Mappers have **no dedicated tests** (they're tested via converter tests).
- Keep mappers ≤40 LOC.

**Schema Organization:**

- `schemas/common/` holds shared enums used by both input and output schemas.
- `schemas/input/` defines flexible input shapes (unions, optional fields, flexible types).
- `schemas/output/` defines strict output shapes (required fields, expanded type objects).
- Use `Zod.discriminatedUnion()` to distinguish step types by `stepType` discriminator.

**Error Propagation:**

- Validation errors thrown via `result.error.issues` mapped to readable messages.
- Include field path in error message for debugging.

### Testing Requirements

**Coverage:** 80% for entire adapter layer (converters + mappers combined).

**Test Conventions:**

- Every `it()` title starts with `"should "`.
- Every `it()` body has `// Arrange`, `// Act`, `// Assert` sections.

**Key Test Files:**

- `converters/*.converter.test.ts` — unit tests for conversion logic.
- `mappers/*.converter.test.ts` — integrated tests of mappers + converters (no isolated mapper tests).
- `round-trip/round-trip.test.ts` — end-to-end GCN → KRD → GCN round-trip with real fixtures.

**Round-Trip Fixtures:**

- Located in `test-fixtures/gcn/` (project root).
- Input files (`*Input.gcn`): minimal payloads for API submission.
- Output files (`*Output.gcn`): complete API responses with server-assigned IDs.
- Fixtures cover: running with nested repeats, cycling with power/cadence, swimming with all strokes, strength with reps, edge cases, multisport triathlon.

### Common Patterns

**Pool Info (Swimming):**

- `garmin-pool-info.mapper.ts` adds pool length, pool unit ID to GCN output for swimming.
- Only added if workout is swimming sport.

**Step Order Tracking:**

- Counter object `{ value: number }` passed through converters to maintain global step order.
- Critical for multisport: stepOrder must be sequential across ALL workoutSegments.

**Transition Flag:**

- Preserved from `krd.extensions.gcn.isSessionTransitionEnabled` → GCN `isSessionTransitionEnabled`.
- Optional; only included in GCN output if present in KRD.

**Multisport Handling:**

- Input schema supports single or multiple `workoutSegments`.
- Each segment has its own sport, steps, metrics.
- Flattening logic (`flatten-segments.converter.ts`) expands segments into sequential KRD steps.

## Dependencies

### Internal

- `@kaiord/core`: Domain types (Workout, KRD, Step), ports, error factories, logger.

### External

- `zod@^4.4.3`: Schema validation and parsing.

<!-- MANUAL: -->
