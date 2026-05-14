<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/krd-to-zwift/

## Purpose

KRD → ZWO XML encoders. Orchestrates conversion of KRD domain (WorkoutStep, metadata, targets) into ZWO XML structure. Responsible for building the full `workout_file` element with metadata, intervals, steps, and targets. Preserves round-trip data via kaiord namespace attributes.

## Key Files

| File                      | Description                                                    |
| ------------------------- | -------------------------------------------------------------- |
| `workout-file-builder.ts` | Orchestrates full ZWO file structure from KRD                  |
| `metadata-builder.ts`     | Builds ZWO metadata (author, name, sport, tags) from KRD       |
| `metadata-encoder.ts`     | Encodes KRD metadata into ZWO attributes                       |
| `intervals-encoder.ts`    | Encodes KRD WorkoutSteps into ZWO interval elements            |
| `intervals-t-encoder.ts`  | Encodes structured intervals (IntervalsT)                      |
| `duration-encoder.ts`     | Encodes duration (time vs. distance)                           |
| `step-encoder.ts`         | Encodes individual WorkoutStep into ZWO step element           |
| `target-encoder.ts`       | Encodes KRD target (power/pace/HR/cadence) into ZWO attributes |
| `power-encoder.ts`        | Encodes power targets with FTP percentage fallback             |
| `text-events-encoder.ts`  | Encodes text event metadata into ZWO textEvent elements        |
| `workout-properties.ts`   | Utility functions for workout property extraction              |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Encoder pattern**: Each encoder is a focused converter for a specific concern (metadata, intervals, targets, text events, etc.). All are converters (business logic, no tests in individual files, delegated to parent converter test).
- **Orchestration**: `workout-file-builder` is the entry point; it composes all encoders.
- **Round-trip preservation**: Kaiord namespace attributes (`@_kaiord:*`) embedded in ZWO for FIT metadata (timeCreated, manufacturer, product, serialNumber) to survive round-trip.
- **Power encoding**: FTP-relative power encoded as percentage; absolute power as watts. Fallback logic handles missing FTP.
- **Target validation**: Targets encoded only if present; missing targets result in omitted ZWO attributes (ZWO-compliant).

### Testing Requirements

- Vitest conventions: `it()` titles start with `"should "`, bodies have `// Arrange // Act // Assert` comments.
- No individual encoder tests; integration tested via parent `krd-to-zwift.converter.test.ts`.
- Round-trip tests in `round-trip/` verify encoder output survives KRD → ZWO → KRD cycle with tolerance thresholds.

### Common Patterns

- **Builder pattern**: `workout-file-builder` accepts config object with workoutData, zwiftExtensions, metadata, fitExtensions, logger.

  ```typescript
  const workoutFile = buildWorkoutFile({
    workoutData,
    zwiftExtensions,
    metadata: krd.metadata,
    fitExtensions: krd.extensions?.fit,
    logger,
  });
  ```

- **Encoder functions**: Each encoder is a pure function returning a partial ZWO object or array.

  ```typescript
  encodeMetadata(metadata, zwiftExtensions): { author?, name?, description?, ... }
  encodeIntervals(steps, durationType, logger): ZwiftInterval[]
  encodeTarget(target, metadata): { @_power?, @_pace?, @_hr?, @_cadence? }
  ```

- **Namespace attributes**: FIT metadata preserved as kaiord-namespaced attributes:

  ```typescript
  "@_kaiord:timeCreated": "2023-01-01T10:00:00Z",
  "@_kaiord:manufacturer": "...",
  ```

- **File structure limits**: Keep each encoder ≤100 lines. Complex logic (ramp interpolation, repeat expansion) lives in helpers.

## Dependencies

### Internal

- `@kaiord/core` (KRD, WorkoutStep, RepetitionBlock, Target, Metadata, Logger)
- `../target/` (power/pace/HR/cadence converters)
- `../duration/` (duration encoding)

### External

- `zod` (schema validation)

<!-- MANUAL: -->
