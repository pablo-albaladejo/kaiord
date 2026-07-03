<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# schemas

## Purpose

Every Zod schema that defines the KRD domain model. The barrel `index.ts` re-exports schemas and `z.infer`-derived types so callers never construct types manually. Two subdirectories (`krd/`, `target-values/`) split large schema groups into per-concept files to stay under the 100-line rule.

## Key Files

| File | Description |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `index.ts` | Barrel — re-exports KRD envelope schemas, workout/step/duration/target schemas, sport/sub-sport/intensity/equipment/swim-stroke enums, file-type, length-unit, and `KRDLapTrigger`. |
| `krd.ts` | Re-export shim that forwards everything from `./krd/index` (the modular KRD schemas). |
| `workout.ts` | `workoutSchema` (sport, optional subSport, poolLength, steps as union of WorkoutStep | RepetitionBlock) and `repetitionBlockSchema` (`repeatCount`, `steps`). |
| `workout-step.ts` | `workoutStepSchema` — `stepIndex`, durationType+duration, targetType+target, optional intensity/notes/equipment. Refines so `durationType === duration.type` and `targetType === target.type`. |
| `duration.ts` | `durationSchema` — discriminated union of 14 duration variants (time, distance, calories, heart*rate_less_than, power_less_than/greater_than, and all `repeat_until*\*`siblings with`repeatFrom`). |
| `duration-type.ts` | `durationTypeSchema` — `z.enum([...])` covering every duration discriminator value (snake_case). |
| `target.ts` | `targetSchema` — discriminated union of power/heart_rate/cadence/pace/stroke_type/open targets, each referencing its `*ValueSchema`. |
| `target-type.ts` | `targetTypeSchema` — `z.enum(["power","heart_rate","cadence","pace","stroke_type","open"])`. |
| `target-values.ts` | Re-export shim forwarding everything from `./target-values/index`. |
| `sport.ts` | `sportSchema` — `z.enum(["cycling","running","swimming","generic"])`. |
| `sub-sport.ts` | `subSportSchema` — `z.enum([...])` listing 60+ snake_case sub-sport values (treadmill, trail, indoor_cycling, lap_swimming, gravel_cycling, …). |
| `intensity.ts` | `intensitySchema` — warmup, active, cooldown, rest, recovery, interval, other. |
| `equipment.ts` | `equipmentSchema` — swim_fins, swim_kickboard, swim_paddles, swim_pull_buoy, swim_snorkel, plus `none`. |
| `swim-stroke.ts` | `swimStrokeSchema` enum + `SWIM_STROKE_TO_FIT` (string → numeric code) and `FIT_TO_SWIM_STROKE` (inverse) lookup tables. |
| `file-type.ts` | `fileTypeSchema` — `z.enum(["structured_workout","recorded_activity","course"])` matching `KRD.type`. |
| `length-unit.ts` | `lengthUnitSchema` — `z.enum(["meters","yards"])`. |

## Subdirectories

| Directory        | Purpose                                                                                                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `krd/`           | The KRD envelope schemas: `krdSchema`, `krdMetadataSchema`, `krdSessionSchema`, `krdLapSchema`, `krdRecordSchema`, `krdEventSchema` (see `krd/AGENTS.md`)                                                      |
| `target-values/` | Per-target-type value schemas: `powerValueSchema`, `heartRateValueSchema`, `cadenceValueSchema`, `paceValueSchema`, `strokeTypeValueSchema`, and the shared `targetUnitSchema` (see `target-values/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- Domain schemas MUST use snake_case enum values (`indoor_cycling`, `lap_swimming`, `percent_ftp`, `swim_stroke`, `repeat_until_distance`). Adapter packages convert to camelCase or numeric codes at the wire boundary.
- Always access enum values via `.enum`: `sportSchema.enum.cycling`, never `"cycling"` as a magic string. This keeps refactors safe and stays consistent with the project rule.
- Every schema MUST have a co-located inferred type: `export type Foo = z.infer<typeof fooSchema>`. Don't duplicate as a hand-written interface.
- Discriminated unions: `Duration` discriminates on `type`, `Target` on `type`, target values on `unit`. Always use `z.discriminatedUnion(...)` (NOT `z.union(...)`) so Zod gives readable errors and TypeScript narrows correctly.
- `KRDMetadata.sport` and `KRDSession.sport` are `z.string()` (not `sportSchema`) — forward-compatible with unknown FIT sport values. Do not tighten this to the enum.

### Testing Requirements

- Coverage target: 80%. Schema tests typically live as part of converter/validator tests in `../converters/` and `../validation/` rather than per-schema; if you add custom refinements, add a dedicated `*.test.ts`. AAA + `should ` invariants apply.

### Common Patterns

- **Re-export shim** (`krd.ts`, `target-values.ts`) — single-line file forwarding from the modular subdirectory. Keeps the public import path stable when internals are reorganised.
- **Cross-format mapping constants** (`SWIM_STROKE_TO_FIT`, `FIT_TO_SWIM_STROKE`) — when a value must round-trip through FIT/TCX/ZWO, define the lookup table next to the enum.

## Dependencies

### Internal

None within this folder — schemas only import sibling schemas and `zod`.

### External

- `zod`.

<!-- MANUAL: -->
