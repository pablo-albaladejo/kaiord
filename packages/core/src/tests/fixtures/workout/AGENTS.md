<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# workout

## Purpose

Rosie factory builders for the workout domain: full `Workout` envelopes, individual `WorkoutStep`s with discriminated-union duration/target, `RepetitionBlock`s, plus specialised variants (swimming, advanced duration types, with-equipment, with-notes, with-subsport). The granular per-shape duration/target builders are SEPARATE files because `workout-step.fixtures.ts` is already large.

## Key Files

| File                                      | Description                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workout.fixtures.ts`                     | `buildWorkout: Factory<Workout>` — name, sport (running/cycling/swimming), sport-constrained subSport (`SUB_SPORTS: Record<Sport, SubSport[]>` lookup), steps = `[buildWorkoutStep, buildRepetitionBlock, buildWorkoutStep]`.                                                                                                                                           |
| `workout-step.fixtures.ts`                | `buildWorkoutStep: Factory<WorkoutStep>` — picks durationType from `[time,distance,open]`, picks targetType from `[power,heart_rate,cadence,pace,open]`, and builds matching discriminated-union shape inline (per-unit branches: watts/percent_ftp/zone/range for power, bpm/zone/percent_max/range for HR, etc.). Truncates notes to `WORKOUT_STEP_NOTES_MAX_LENGTH`. |
| `repetition-block.fixtures.ts`            | `buildRepetitionBlock: Factory<RepetitionBlock>` — `repeatCount: 2..10`, `steps: [buildWorkoutStep, buildWorkoutStep]`.                                                                                                                                                                                                                                                 |
| `duration.fixtures.ts`                    | `buildDuration: Factory<Duration>` — picks from all 14 duration types via a `DURATION_BUILDERS: Record<string, () => Duration>` lookup applied in `.after()`. The CANONICAL duration factory; standalone files in `../duration/` only cover narrower groups.                                                                                                            |
| `target.fixtures.ts`                      | `buildTarget: Factory<Target>` — picks from all 6 target types and builds the matching value via per-type helpers (`buildPowerValue`, `buildHeartRateValue`, `buildCadenceValue`, `buildPaceValue`, `buildStrokeTypeValue`). The CANONICAL target factory.                                                                                                              |
| `swimming-workout.fixtures.ts`            | `buildSwimmingWorkout: Factory<Workout>` — sport fixed to `"swimming"`, subSport from `[open_water, lap_swimming]`, `poolLength` from `[POOL_LENGTH_25, POOL_LENGTH_50]`, `poolLengthUnit:"meters"`.                                                                                                                                                                    |
| `advanced-workout.fixtures.ts`            | `buildAdvancedWorkoutStep` + `buildAdvancedWorkout` — covers the advanced duration types (calories, power*less_than/greater_than, repeat_until*\*) that `buildWorkoutStep` skips. Used for adapter capability tests.                                                                                                                                                    |
| `workout-step-with-equipment.fixtures.ts` | `buildWorkoutStepWithEquipment` — `.extend(buildWorkoutStep)` adding a swim equipment value (`swim_fins`/`swim_kickboard`/`swim_paddles`/`swim_pull_buoy`/`swim_snorkel`).                                                                                                                                                                                              |
| `workout-step-with-notes.fixtures.ts`     | `buildWorkoutStepWithNotes` — `.extend(buildWorkoutStep)` forcing a notes string truncated to `WORKOUT_STEP_NOTES_MAX_LENGTH=256`.                                                                                                                                                                                                                                      |
| `workout-with-subsport.fixtures.ts`       | `buildWorkoutWithSubSport` — `.extend(buildWorkout)` overriding subSport with sport-specific options including `gravel` (note: NOT a valid `SubSport` — used in tests that intentionally exercise unknown subSports).                                                                                                                                                   |

## For AI Agents

### Working In This Directory

- `buildWorkoutStep` only covers the THREE most common duration types (time/distance/open). For tests that need calorie/power-conditional/repeat-conditional durations, use `buildAdvancedWorkoutStep` from `advanced-workout.fixtures.ts` instead.
- The `target` attr inside `buildWorkoutStep` is a giant inline switch over `targetType × unit`. If you add a new target unit (rare — see `../../../domain/schemas/target-values/unit.ts`), you must update BOTH this file AND `target.fixtures.ts`.
- Discriminated-union pattern for `buildDuration` and `buildTarget`: pick discriminator → look up builder → `Object.assign` in `.after()`. Don't refactor to inline `if`-chains; the lookup keeps each branch testable.
- `workout-with-subsport.fixtures.ts` intentionally uses `"gravel"` (not `"gravel_cycling"`) — that's a typo-style fixture to verify schema rejection. Don't "fix" it.

<!-- MANUAL: -->
