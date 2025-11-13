# Test Fixtures

This directory contains test fixtures for generating realistic test data using faker and rosie factories.

## Directory Structure

```
fixtures/
├── duration/                    # Duration-related fixtures
│   ├── calorie-duration.fixtures.ts
│   ├── power-duration.fixtures.ts
│   ├── repeat-conditional-duration.fixtures.ts
│   ├── duration.fixtures.ts
│   └── fit-duration.fixtures.ts
├── workout/                     # Workout-related fixtures
│   ├── advanced-workout.fixtures.ts
│   ├── swimming-workout.fixtures.ts
│   ├── workout-step-with-equipment.fixtures.ts
│   ├── workout-step-with-notes.fixtures.ts
│   ├── workout-with-subsport.fixtures.ts
│   ├── workout.fixtures.ts
│   ├── workout-step.fixtures.ts
│   └── repetition-block.fixtures.ts
├── target/                      # Target-related fixtures
├── fit/                         # FIT-specific fixtures
├── krd/                         # KRD-specific fixtures
├── fit-files/                   # Binary FIT test files
├── krd-files/                   # JSON KRD test files
└── metadata.fixtures.ts         # Metadata fixtures
```

## New Fixtures (FIT Compliance Enhancements)

### Duration Fixtures

#### Calorie-Based Durations

- `buildCalorieDuration` - Simple calorie-based duration
- `buildRepeatUntilCaloriesDuration` - Repeat until calories threshold

#### Power-Based Durations

- `buildPowerLessThanDuration` - Power less than threshold
- `buildPowerGreaterThanDuration` - Power greater than threshold
- `buildRepeatUntilPowerLessThanDuration` - Repeat until power less than
- `buildRepeatUntilPowerGreaterThanDuration` - Repeat until power greater than

#### Repeat Conditional Durations

- `buildRepeatUntilTimeDuration` - Repeat until time threshold
- `buildRepeatUntilDistanceDuration` - Repeat until distance threshold
- `buildRepeatUntilHeartRateLessThanDuration` - Repeat until HR less than
- `buildRepeatUntilHeartRateGreaterThanDuration` - Repeat until HR greater than

### Workout Fixtures

#### Swimming Workouts

- `buildSwimmingWorkout` - Swimming workout with pool length and equipment

#### Workout Steps with New Fields

- `buildWorkoutStepWithNotes` - Workout step with coaching notes
- `buildWorkoutStepWithEquipment` - Workout step with swimming equipment

#### Workouts with SubSport

- `buildWorkoutWithSubSport` - Workout with sport-specific subSport

#### Advanced Workouts

- `buildAdvancedWorkoutStep` - Workout step with advanced duration types
- `buildAdvancedWorkout` - Complete workout with all new features

## Usage Examples

### Basic Usage

```typescript
import { buildCalorieDuration } from "./duration/calorie-duration.fixtures";

const duration = buildCalorieDuration.build();
// { type: "calories", calories: 250 }
```

### Custom Values

```typescript
import { buildSwimmingWorkout } from "./workout/swimming-workout.fixtures";

const workout = buildSwimmingWorkout.build({
  poolLength: 50,
  subSport: "lap_swimming",
});
```

### Extending Fixtures

```typescript
import { Factory } from "rosie";
import { buildWorkoutStep } from "./workout/workout-step.fixtures";

const buildCustomStep = new Factory()
  .extend(buildWorkoutStep)
  .attr("notes", () => "Custom coaching note");
```

## Testing Guidelines

- All fixtures use faker for realistic data generation
- Fixtures do NOT validate data (validation is the responsibility of tests)
- Keep fixtures simple - only generate data, no business logic
- Use `.build()` to generate a single instance
- Use `.buildList(n)` to generate multiple instances

## References

- [Faker.js Documentation](https://fakerjs.dev/)
- [Rosie Factory Documentation](https://github.com/rosiejs/rosie)
