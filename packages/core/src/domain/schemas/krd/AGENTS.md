<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# krd

## Purpose

The KRD envelope — Zod schemas for the canonical `application/vnd.kaiord+json` shape. The root `krdSchema` validates `{ version, type, metadata, sessions?, laps?, records?, events?, extensions? }`. Sub-schemas validate each child collection. Every conversion in the monorepo flows through these shapes.

## Key Files

| File          | Description                                                                                                                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`    | Defines `krdSchema` (root envelope: version `^\d+\.\d+$`, type enum, metadata + optional sessions/laps/records/events/extensions) and re-exports every child type/schema.                                                                                  |
| `metadata.ts` | `krdMetadataSchema` — `created` ISO datetime, optional manufacturer/product/serialNumber, **required `sport` as `z.string()`** (not `sportSchema`) for forward-compatibility with unknown FIT sports, optional `subSport: z.string()`.                     |
| `session.ts`  | `krdSessionSchema` — session-level aggregates: `startTime`, `totalElapsedTime`, optional timer/distance, sport, HR/cadence/power avg+max, normalizedPower, TSS, IF, calories, ascent/descent, speed avg+max.                                               |
| `lap.ts`      | `krdLapSchema` + `krdLapTriggerSchema` — per-lap aggregates (timing, distance, HR, cadence, power, speed, elevation, calories), `trigger` enum (manual/time/distance/position/session_end/fitness_equipment), workout step index, swimming lengths/stroke. |
| `record.ts`   | `krdRecordSchema` — single time-series sample (1Hz+): `timestamp`, optional `position {lat, lon}`, altitude, heartRate, cadence, power, speed, distance, temperature, running dynamics (verticalOscillation, stanceTime, stepLength).                      |
| `event.ts`    | `krdEventSchema` — workout/lap event records: `timestamp`, `eventType` enum (event_start/stop/pause/resume/lap/marker/timer/workout_step_change/session_start/activity_start), optional `eventGroup`/`data`/`message`.                                     |

## For AI Agents

### Working In This Directory

- `krdSchema.version` is the literal string regex `^\d+\.\d+$` (e.g. `"1.0"`). When bumping the format, change the producer; the schema accepts any well-formed `N.N` value.
- `krdSchema.type` is `z.enum(["structured_workout", "recorded_activity", "course"])`. The `extractWorkout` validator (in `../../validation/`) refuses anything except `"structured_workout"`.
- `metadata.sport` and `session.sport` use `z.string()`, NOT `sportSchema`, on purpose — FIT files emit sport codes we don't yet enumerate, and tightening this would break ingestion. Keep them open strings; the structured workout extension under `extensions.structured_workout.sport` is the place where `sportSchema` IS enforced (in `workoutSchema`).
- All `timestamp`/`created`/`startTime` fields use `z.iso.datetime()` — strict ISO 8601 with `Z`. Adapters MUST emit `toISOString()`, not local-time strings.
- HR fields clamp to `[0, 300]`. Lat/lon clamp to `[-90, 90]` / `[-180, 180]`. Don't relax these without first checking the adapter packages can produce valid data.

### Testing Requirements

- Coverage target: 80%. Direct schema tests are sparse — most coverage comes from `validate-krd.test.ts` and round-trip suites in `../../application/round-trip/`. AAA + `should ` invariants apply.

### Common Patterns

- **Optional everywhere except identity fields.** `startTime`, `totalElapsedTime`, `sport` are required on a session; everything else is optional so partial data from FIT/TCX still validates.
- **`extensions: z.record(z.string(), z.unknown()).optional()`** at the root and inside `workoutSchema` — forward-compatibility envelope for format-specific data (FIT developer fields, Zwift `<workout_file>` extras).

## Dependencies

### Internal

- `../sport`, `../sub-sport`, `../swim-stroke` — referenced from `lap.ts` for optional discriminators.

### External

- `zod`.

<!-- MANUAL: -->
