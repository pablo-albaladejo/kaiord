<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# adapters

## Purpose

FIT↔KRD conversion logic. Houses the strategy implementations for the `BinaryReader` and `BinaryWriter` ports from `@kaiord/core`. Organizes conversion in two directions: FIT→KRD (inbound parsing) via `messages/` and `krd-to-fit/` (outbound assembly), plus domain-specific converters for metadata, records, sessions, laps, workouts, targets, durations, courses, and events.

## Key Files

| File               | Description                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| `garmin-fitsdk.ts` | Core SDK adapter: wraps Garmin FIT decoder/encoder, calls `messages.mapper` and `krd-to-fit.converter`. |

## Subdirectories

| Directory     | Purpose                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `messages/`   | FIT→KRD: message parsing, file type detection, activity/workout/course routing (see `messages/AGENTS.md`).        |
| `krd-to-fit/` | KRD→FIT: workout assembly, metadata, duration, target converters (see `krd-to-fit/AGENTS.md`).                    |
| `metadata/`   | File metadata mapping: created time, manufacturer, product, sport type (see `metadata/AGENTS.md`).                |
| `record/`     | Time-series record conversion: heart rate, power, cadence, pace, elevation, temperature (see `record/AGENTS.md`). |
| `session/`    | Activity session metadata: total time, distance, avg/max stats (see `session/AGENTS.md`).                         |
| `lap/`        | Lap segmentation: auto-pause, distance, trigger type (see `lap/AGENTS.md`).                                       |
| `event/`      | Event messages: start, stop, markers (see `event/AGENTS.md`).                                                     |
| `workout/`    | Structured workout mapping and step repetition logic (see `workout/AGENTS.md`).                                   |
| `target/`     | Target zone conversion: power, HR, cadence, pace, swim stroke (see `target/AGENTS.md`).                           |
| `duration/`   | Workout step duration type mapping (see `duration/AGENTS.md`).                                                    |
| `course/`     | GPS course file mapping (see `course/AGENTS.md`).                                                                 |
| `schemas/`    | Zod schemas for FIT domain types (see `schemas/AGENTS.md`).                                                       |
| `shared/`     | Shared utilities: message numbers, type guards (see `shared/AGENTS.md`).                                          |
| `extensions/` | Developer field and unknown message extraction.                                                                   |
| `round-trip/` | Round-trip conversion tests and benchmarks.                                                                       |

## For AI Agents

### Working In This Directory

- **Inbound (FIT→KRD):** `garmin-fitsdk.ts` parses binary → `messages.mapper.ts` routes by file type → domain mappers build KRD.
- **Outbound (KRD→FIT):** `krd-to-fit.converter.ts` extracts Workout, builds message array → `garmin-fitsdk.ts` encodes binary.
- **Type safety:** All FIT message types defined in `shared/types.ts` (FitMessages, FitWorkoutStep, FitRecord, etc.); all domain types in KRD from `@kaiord/core`.

### Testing Requirements

- 80% coverage on converters and mappers.
- Round-trip tests in `round-trip/` verify tolerance ranges.
- Performance test in `round-trip/` validates 10k-record batch ≤500ms.

### Common Patterns

- **Mappers** (e.g., `metadata.mapper.ts`): Extract and transform FIT fields to domain types.
- **Converters** (e.g., `record/fit-to-krd-record.converter.ts`): Complex logic with validation and error handling.
- **Type detection:** File type (workout vs. activity) via `messages.mapper.ts` based on FIT message keys.

## Dependencies

### Internal

- `@kaiord/core` - KRD, Workout, domain types, ports, errors.

### External

- `@garmin/fitsdk` - Garmin FIT SDK (SDK-only import in `garmin-fitsdk.ts`; all other adapters work with plain objects).
- `zod` - Schema validation.

<!-- MANUAL: -->
