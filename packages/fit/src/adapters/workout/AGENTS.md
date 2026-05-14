<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# workout

## Purpose

Structured workout mapping. Converts FIT workout files (workout message + step messages) to KRD structured workout and vice versa. Handles step assembly, repetition expansion/detection, and step properties (name, intensity, equipment).

## Key Files

| File                    | Description                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `workout.mapper.ts`     | Maps FIT workout message and steps array to KRD Workout. Calls repetition builder.         |
| `step.mapper.ts`        | Maps individual FIT step fields (name, intensity, equipment, notes) to KRD step fields.    |
| `repetition.builder.ts` | Expands KRD repetition steps into flat FIT arrays and detects repetitions from FIT arrays. |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **FIT workflow:** Workout message (name, sport, subSport, numValidSteps) + array of step messages (wktStepName, durationType, durationValue, targetType, intensity, repeatSteps, repeatHr, equipment, notes).
- **KRD workout:** Workout object with name, sport, steps array (Step[] or Step with repetition).
- **Step representation:** KRD steps may have `repetition` property (repeat count); FIT flattens these into multiple step messages.
- **Repetition expansion:** `repetition.builder.ts` detects KRD step repetitions and expands them into flat FIT array.
- **Repetition detection:** Inverse: `repetition.builder.ts` detects repeated step patterns in FIT array and collapses back to KRD repetition format.

### Testing Requirements

- Unit tests for step mapping.
- Integration tests for repetition expansion/detection.
- Round-trip tests verify repetition preservation.
- Tests validate step count and step index calculations.

### Common Patterns

- **Repetition markers:** In KRD, a step has `repetition?: { count: number; recoverySteps?: Step[] }`. In FIT, this expands to `count × (main step + recovery steps)` with correct message indices.
- **Step properties:** FIT step message includes wktStepName (name), intensity (string: "active", "rest"), equipment (string), notes (string, max 256 chars).

## Dependencies

### Internal

- `@kaiord/core` - Workout, Step, Logger.
- `../shared/` - Type guards.
- `../duration/` - Duration conversion.
- `../target/` - Target conversion.

### External

None.

<!-- MANUAL: -->
