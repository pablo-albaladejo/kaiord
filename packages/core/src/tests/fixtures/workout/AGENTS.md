<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# workout

## Purpose

Rosie factory builders for the workout domain: full `Workout` envelopes, individual `WorkoutStep`s with discriminated-union duration/target, `RepetitionBlock`s, plus the canonical `Duration` and `Target` factories.

## Key Files

| File                           | Description                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workout.fixtures.ts`          | `buildWorkout: Factory<Workout>` — name, sport (running/cycling/swimming), sport-constrained subSport (`SUB_SPORTS: Record<Sport, SubSport[]>` lookup), steps = `[buildWorkoutStep, buildRepetitionBlock, buildWorkoutStep]`.                                                                                                                                           |
| `workout-step.fixtures.ts`     | `buildWorkoutStep: Factory<WorkoutStep>` — picks durationType from `[time,distance,open]`, picks targetType from `[power,heart_rate,cadence,pace,open]`, and builds matching discriminated-union shape inline (per-unit branches: watts/percent_ftp/zone/range for power, bpm/zone/percent_max/range for HR, etc.). Truncates notes to `WORKOUT_STEP_NOTES_MAX_LENGTH`. |
| `repetition-block.fixtures.ts` | `buildRepetitionBlock: Factory<RepetitionBlock>` — `repeatCount: 2..10`, `steps: [buildWorkoutStep, buildWorkoutStep]`.                                                                                                                                                                                                                                                 |
| `duration.fixtures.ts`         | `buildDuration: Factory<Duration>` — picks from all 14 duration types via a `DURATION_BUILDERS: Record<string, () => Duration>` lookup applied in `.after()`. The CANONICAL duration factory.                                                                                                                                                                           |
| `target.fixtures.ts`           | `buildTarget: Factory<Target>` — picks from all 6 target types and builds the matching value via per-type helpers (`buildPowerValue`, `buildHeartRateValue`, `buildCadenceValue`, `buildPaceValue`, `buildStrokeTypeValue`). The CANONICAL target factory.                                                                                                              |

## For AI Agents

### Working In This Directory

- `buildWorkoutStep` only covers the THREE most common duration types (time/distance/open); build other duration variants inline in the test or via `buildDuration`.
- The `target` attr inside `buildWorkoutStep` is a giant inline switch over `targetType × unit`. If you add a new target unit (rare — see `../../../domain/schemas/target-values/unit.ts`), you must update BOTH this file AND `target.fixtures.ts`.
- Discriminated-union pattern for `buildDuration` and `buildTarget`: pick discriminator → look up builder → `Object.assign` in `.after()`. Don't refactor to inline `if`-chains; the lookup keeps each branch testable.

<!-- MANUAL: -->
