<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/converters

## Purpose

GCN ↔ KRD conversion logic. Converts between Garmin Connect JSON format and Kaiord Record Document representation, handling structured workouts with steps, targets, and repeat blocks.

## Key Files

| File                                    | Description                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `garmin-to-krd.converter.ts`            | Parses GCN JSON, validates schema, extracts sport/steps/metadata → KRD. Handles repeat flattening, target extraction, pool info. |
| `garmin-to-krd.converter.test.ts`       | Unit tests for GCN → KRD conversion. Tests all step types, targets, multisport.                                                  |
| `krd-to-garmin.converter.ts`            | Maps KRD workout → GCN input format. Extracts sport, steps, targets, pool info, transition flag.                                 |
| `krd-to-garmin.converter.test.ts`       | Unit tests for KRD → GCN conversion. Tests all step types, repetition mapping, target mapping.                                   |
| `garmin-workout-step.converter.ts`      | Maps individual KRD step → GCN workout step. Handles duration, target, condition, note extraction.                               |
| `garmin-workout-step.converter.test.ts` | Unit tests for step mapping. Tests duration types, target extraction, condition mapping.                                         |
| `garmin-repetition.converter.ts`        | Maps KRD repetition block → GCN repeat structure with nested child steps. Expands repeats with counter.                          |
| `garmin-repetition.converter.test.ts`   | Unit tests for repetition mapping. Tests nested repeats, child step ID tracking.                                                 |
| `executable-step.converter.ts`          | Flattens a raw executable step (from GCN) → KRD step with duration and target fields.                                            |
| `executable-step.converter.test.ts`     | Unit tests for executable step flattening. Tests duration parsing, target field mapping.                                         |
| `flatten-segments.converter.ts`         | Flattens multisport GCN segments (from API response) into sequential KRD steps.                                                  |
| `flatten-segments.converter.test.ts`    | Unit tests for segment flattening. Tests multisport expansion, step order continuity.                                            |
| `garmin-pool-info.mapper.ts`            | Adds pool-related fields to GCN output (swimming only).                                                                          |
| `pool-length.mapper.ts`                 | Maps KRD pool length → GCN pool unit ID/value pair.                                                                              |

## For AI Agents

### Working In This Directory

**Converter Responsibilities:**

- Parse or generate JSON structures.
- Validate against Zod schemas.
- Map enum values via mappers (sport, target, condition, equipment, stroke, intensity).
- Compose smaller converters (e.g., `krd-to-garmin` uses `garmin-workout-step` and `garmin-repetition`).
- Throw descriptive errors on validation failure.
- All converters tested; 80%+ coverage required.

**Counter Pattern (Step Order Tracking):**

- Converter functions accept or create `counter: { value: number }` object.
- Incremented as steps are processed to maintain global order.
- Critical for multisport: ensures stepOrder is sequential across all workoutSegments.
- Example: `mapRepetitionBlock(step, counter, targetOpts)` increments counter for each child step.

**Extension Handling:**

- GCN transition flag: `krd.extensions.gcn.isSessionTransitionEnabled` ↔ GCN `isSessionTransitionEnabled`.
- Pool info (swimming): stored in `krd.extensions.structured_workout` as part of the parsed workout.
- Round-trip fidelity: preserve all extension data on conversion back.

**Error Handling:**

- Use `createGarminParsingError()` from core for all parsing/validation failures.
- Include field path in error message: `"workoutSegments[0].workoutSteps[1]: missing sportType"`.
- Never swallow errors; throw after logging if needed.

### Testing Requirements

**Coverage:** 80%+ for converters.

**Test Conventions:**

- Every `it()` title starts with `"should "`.
- Every `it()` body has `// Arrange`, `// Act`, `// Assert` sections (blank lines between).

**Example Test Structure:**

```typescript
it("should convert KRD step with power target to GCN step", () => {
  // Arrange
  const step = { type: "active", duration_type: "time", duration_value_seconds: 600, target_type: "power", ... };
  const counter = { value: 1 };

  // Act
  const gcnStep = mapWorkoutStep(step, counter, {});

  // Assert
  expect(gcnStep.stepOrder).toBe(1);
  expect(gcnStep.trainingPedalingCadenceRange).toEqual({ ...power target... });
});
```

**Round-Trip Testing:**

- Full workflows tested in `round-trip/round-trip.test.ts` using real fixtures.
- Converters unit-tested in isolation with mock KRD/GCN payloads.
- Round-trip fixtures: `test-fixtures/gcn/*.gcn` (input + output pairs).

### Common Patterns

**Enum Mapping via Mappers:**

- Converters call mapper functions (pure, ≤40 LOC) rather than inline logic.
- Mappers are composed and tested via converter tests.
- Examples: `mapKrdSportToGarmin()`, `mapKrdTargetToGarmin()`.

**Duration Handling:**

- KRD durations: `{ duration_type, duration_value_seconds | duration_value_meters | duration_value_calories }`.
- GCN durations: `{ endCondition: { conditionTypeId, value } }` where conditionTypeId determines interpretation.
- Converter maps KRD duration → GCN end condition.

**Target Mapping:**

- KRD targets: `{ target_type, target_value_x, target_value_y?, ... }`.
- GCN targets: structured objects with `trainingPowerZone`, `trainingHeartRateZone`, `trainingSpeedZone`, `trainingCadenceZone`.
- Mapper computes which target type is active based on KRD fields.

**Repeat Expansion:**

- KRD repetition block: `{ type: "repetition", repetitions, steps [] }`.
- GCN repeat structure: `{ repetitionType: "active", repetitions, childStepId }`.
- Converter expands each repetition into individual steps with unique stepOrder values.

## Dependencies

### Internal

- `@kaiord/core`: Domain types, KRD, Workout, Step schemas; error factories; logger.
- Mappers in `../mappers/`: sport, target, condition, equipment, stroke, intensity, pool-length.

### External

- `zod@^4.4.3`: Schema parsing and validation.

<!-- MANUAL: -->
