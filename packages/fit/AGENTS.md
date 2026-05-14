<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# @kaiord/fit

## Purpose

FIT format adapter for the Kaiord health & fitness data framework. Uses Garmin FIT SDK to encode/decode binary FIT files (Garmin's proprietary format for workouts and activities) and maps them bidirectionally to KRD (Kaiord's canonical format). Implements the `BinaryReader` and `BinaryWriter` ports from `@kaiord/core` via strategy factories.

## Key Files

| File                                              | Description                                                                                               |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                                    | Public API exports: `fitReader`/`fitWriter` singletons and factories `createFitReader`/`createFitWriter`. |
| `src/adapters/garmin-fitsdk.ts`                   | Core adapter: wraps Garmin FIT SDK decoder/encoder, orchestrates message parsing and KRD conversion.      |
| `src/adapters/messages/messages.mapper.ts`        | FIT→KRD entry point: detects file type (workout/activity/course) and routes to appropriate mapper.        |
| `src/adapters/krd-to-fit/krd-to-fit.converter.ts` | KRD→FIT entry point: extracts workout data, converts to FIT messages, validates.                          |
| `src/adapters/shared/types.ts`                    | Type definitions for FIT SDK messages and internal domain types (FitMessages, FitFileId, FitWorkoutStep). |

## Subdirectories

| Directory                  | Purpose                                                                        |
| -------------------------- | ------------------------------------------------------------------------------ |
| `src/adapters/`            | FIT↔KRD conversion logic (see `src/adapters/AGENTS.md`).                       |
| `src/adapters/messages/`   | FIT message parsing and routing (activity/workout/course).                     |
| `src/adapters/krd-to-fit/` | KRD→FIT conversion (workout assembly, metadata, duration, targets).            |
| `src/adapters/metadata/`   | File metadata mapping (created time, manufacturer, sport type).                |
| `src/adapters/record/`     | Time-series record (sample) conversion (HR, power, cadence, pace).             |
| `src/adapters/session/`    | Activity session metadata (total time, distance, avg/max stats).               |
| `src/adapters/lap/`        | Lap segmentation (auto-pause, distance, trigger type).                         |
| `src/adapters/event/`      | Event message mapping (start, stop, trigger types).                            |
| `src/adapters/workout/`    | Structured workout mapping and step repetition logic.                          |
| `src/adapters/target/`     | Target zone conversion (power, HR, cadence, pace, swim stroke).                |
| `src/adapters/duration/`   | Workout step duration type mapping (time, distance, HR zone, power zone).      |
| `src/adapters/course/`     | Course (GPS route) file mapping and point aggregation.                         |
| `src/adapters/schemas/`    | Zod schemas for FIT domain types (enums, message keys, fields).                |
| `src/adapters/shared/`     | Shared utilities: message numbers, type guards, coordinate conversion.         |
| `src/adapters/extensions/` | Developer fields and unknown message extraction.                               |
| `src/adapters/round-trip/` | Round-trip conversion tests (FIT↔KRD tolerances).                              |
| `src/test-utils/`          | Test constants: time/power/HR/cadence samples, coordinates, tolerances.        |
| `src/types/`               | TypeScript definitions for Garmin FIT SDK (Decoder, Encoder, Stream, Profile). |

## For AI Agents

### Working In This Directory

**Hexagonal architecture:**

- `garmin-fitsdk.ts` is the only file that imports Garmin FIT SDK (`@garmin/fitsdk`). All other adapters work with plain JS objects (FitMessages).
- FIT→KRD: `garmin-fitsdk.ts` decoder → `FitMessages` object → `messages.mapper.ts` (detect type) → domain mapper → `KRD`.
- KRD→FIT: `krd-to-fit.converter.ts` extracts `Workout` from `KRD.extensions.structured_workout` → builders construct FIT message array → `garmin-fitsdk.ts` encoder → `Uint8Array`.

**Schema conventions:**

- Domain-side (KRD): `snake_case` enums (e.g., `indoor_cycling`, `structured_workout`).
- Adapter-side (FIT SDK): `camelCase` fields (e.g., `wktName`, `durationType`, `targetValue`).
- All schema validation via Zod in `schemas/` directory.

**Key patterns:**

- **Mappers** (`*.mapper.ts`): Simple field-level transformation, no logic, no tests.
- **Converters** (`*.converter.ts`): Complex logic (calculations, round-trip tolerance, edge cases), always tested.
- **Validators** (`*.validator.ts`): Message shape validation, error collection.
- **Creators** (`*-messages.creator.ts`, `*.builder.ts`): Assemble FIT message arrays from domain data.

**Round-trip tolerances (enforced in tests):**

- Time: ±1s
- Power: ±1W or ±1%FTP
- HR: ±1 bpm
- Cadence: ±1 rpm
- Coordinates: ±5 decimals (57 cm precision)

**Testing gotchas:**

- FIT SDK `Decoder.read()` returns `messages` (FIT field names are camelCase) and `errors` (array of strings).
- `Stream.fromByteArray()` requires `Array<number>`, not `Uint8Array`; convert with `Array.from()`.
- Encoder message writing is order-dependent; file ID and metadata must come first.
- Pool length defaults to meters; conversion to FIT units via `length-unit.mapper`.

### Testing Requirements

- **Coverage target:** 80% for core conversion logic.
- **AAA pattern:** Every `it()` must start with `"should "` and contain `// Arrange`, `// Act`, `// Assert` sections in order.
- **Test structure:**
  - Unit tests for mappers and converters (pure functions).
  - Integration tests for end-to-end FIT→KRD and KRD→FIT pipelines.
  - Round-trip tests (FIT file → KRD → FIT file → compare) in `adapters/round-trip/`.
  - Performance test (`perf-record-batch.test.ts`) for 10k-record batches (budget: 500ms).
- **Fixture patterns:**
  - Domain fixtures: `tests/fixtures/fit-duration.fixtures.ts`, `fit-target.fixtures.ts` (rosie factory builders).
  - Test constants: `test-utils/constants.ts` (time, power, HR, coordinates).

### Common Patterns

1. **File type detection:** `messages.mapper.ts` inspects FIT message array for workout/record/session keys; routes to correct mapper.
2. **Duration conversion:** FIT step duration is a tuple `(durationType, durationValue, durationTime, durationDistance, etc.)`. Each type (time, distance, HR, power) maps to KRD `StepDuration` via `duration.converter.ts`.
3. **Target conversion:** FIT target is a tuple `(targetType, targetValue, targetHrZone, targetPowerZone, etc.)`. Dispatcher in `target.converter.ts` routes to type-specific converter.
4. **Workout step assembly:** KRD steps may contain repetitions (e.g., 5x [warmup, main, cooldown]). `repetition.builder.ts` expands these into flat FIT step arrays.
5. **Record (time-series) batching:** Activity files contain 1000s of records. Mapper iterates in batches for performance; tests validate 10k-record batch ≤500ms.
6. **Extension fields:** Unknown FIT developer fields extracted via `extensions.extractor.ts`; preserved in `KRD.extensions` for round-trip fidelity.

## Dependencies

### Internal

- `@kaiord/core` - Domain types (KRD, Workout, sport enums), ports (BinaryReader, BinaryWriter), errors, logger.

### External

- `@garmin/fitsdk` ^21.202.0 - Garmin FIT SDK decoder/encoder.
- `zod` ^4.4.3 - Schema validation.

<!-- MANUAL: -->
