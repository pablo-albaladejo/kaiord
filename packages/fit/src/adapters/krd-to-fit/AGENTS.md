<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# krd-to-fit

## Purpose

KRD→FIT conversion. Transforms a KRD structured workout into an array of Garmin FIT messages (file ID, metadata, workout, steps). Handles metadata, workout assembly, step mapping, duration conversion, and target zone mapping.

## Key Files

| File                                   | Description                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| `krd-to-fit.converter.ts`              | Entry point: extracts Workout from KRD, assembles message array, validates.                 |
| `krd-to-fit-metadata.converter.ts`     | Converts KRD metadata to FIT file ID and workout message headers.                           |
| `krd-to-fit-workout.converter.ts`      | Maps KRD steps to FIT workout step messages; handles repetitions.                           |
| `krd-to-fit-duration.converter.ts`     | Maps KRD step duration to FIT duration fields (type, value, time, distance, HR/power zone). |
| `krd-to-fit-target.converter.ts`       | Maps KRD step target to FIT target fields (type, value, zones).                             |
| `krd-to-fit-step.converter.ts`         | Maps individual KRD step properties (name, intensity, equipment).                           |
| `krd-to-fit-manufacturer.converter.ts` | Looks up manufacturer enum from FIT Profile.                                                |
| `krd-to-fit-target-*.converter.ts`     | Type-specific target converters (power, HR, cadence, pace, stroke).                         |
| `krd-to-fit-step-count.helpers.ts`     | Calculates FIT step count from KRD repetitions.                                             |

## Subdirectories

| Directory              | Purpose                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `duration-converters/` | Duration type-specific converters: simple, repeat, conditional, repeat-hr-power (see `duration-converters/AGENTS.md`). |

## For AI Agents

### Working In This Directory

- **Entry point:** `krd-to-fit.converter.ts` extracts Workout from `KRD.extensions.structured_workout`, validates with Zod, then routes to mappers.
- **Message assembly:** Builds array in FIT order (file ID → metadata → workout → steps). Each message is a plain object with camelCase fields.
- **Repetition expansion:** KRD steps may have repetitions (e.g., 5x [warm, main, cool]). `krd-to-fit-workout.converter.ts` expands these into flat step arrays with correct message indices.
- **Validation:** Zod schema checks are strict; parsing errors include issue paths and messages.
- **Error handling:** All errors thrown as `FitParsingError` from `@kaiord/core`.

### Testing Requirements

- Unit tests for each converter (metadata, duration, target, step).
- Integration tests for full workout assembly.
- Round-trip tests verify KRD→FIT→KRD fidelity within tolerances.
- Tests validate repetition expansion logic.

### Common Patterns

- **Converters chain:** `krd-to-fit.converter.ts` → `krd-to-fit-metadata.converter.ts` → `krd-to-fit-workout.converter.ts` → duration/target converters.
- **Duration dispatch:** `krd-to-fit-duration.converter.ts` routes to type-specific converter in `duration-converters/`.
- **Target dispatch:** `krd-to-fit-target.converter.ts` routes to type-specific converter (power, HR, cadence, pace, stroke).
- **Step count helpers:** `krd-to-fit-step-count.helpers.ts` calculates correct FIT step indices for message arrays.

## Dependencies

### Internal

- `@kaiord/core` - KRD, Workout, Logger, error types, schemas.
- `../shared/` - Type definitions, message numbers.
- `duration-converters/` - Duration type-specific converters.

### External

- `zod` - Schema validation.

<!-- MANUAL: -->
