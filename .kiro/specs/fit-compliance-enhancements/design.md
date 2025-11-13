# Design Document

## Overview

This design document outlines the implementation approach for enhancing the Kaiord FIT ↔ KRD conversion system with optional Garmin FIT specification fields. The enhancements are organized into two priority levels and maintain backward compatibility while improving interoperability with advanced training platforms.

### Design Goals

1. **Backward Compatibility**: All new fields are optional; existing workflows remain unchanged
2. **Round-trip Safety**: All new fields preserve data through FIT → KRD → FIT conversions
3. **Schema-First**: Zod schemas define types; JSON Schema generated automatically
4. **Minimal Changes**: Leverage existing converter patterns and infrastructure
5. **Test Coverage**: Maintain ≥90% coverage for all converters

## Architecture

### Affected Layers

```
domain/schemas/          # Update Zod schemas for KRD types
├── workout.ts          # Add subSport, poolLength, poolLengthUnit
├── workout-step.ts     # Add notes, equipment
└── duration.ts         # Add advanced duration types

adapters/fit/
├── constants.ts        # Add new FIT constants
├── duration/
│   └── duration.converter.ts  # Add advanced duration converters
├── fit-to-krd/
│   └── fit-to-krd.converter.ts  # Map new FIT fields to KRD
└── krd-to-fit/
    └── krd-to-fit.converter.ts  # Map new KRD fields to FIT

tests/fixtures/         # Add fixtures for new field types
```

### Design Principles

- **Hexagonal Architecture**: Changes isolated to domain schemas and FIT adapter
- **Dependency Injection**: No changes to ports or application layer
- **Factory Pattern**: Reuse existing converter factory functions
- **Type Safety**: All types inferred from Zod schemas

## Components and Interfaces

### 1. Domain Schema Updates

#### Workout Schema (Priority 1)

```typescript
// domain/schemas/workout.ts
export const workoutSchema = z.object({
  name: z.string().optional(),
  sport: z.string(),
  subSport: z.string().optional(), // NEW: Priority 1
  poolLength: z.number().positive().optional(), // NEW: Priority 2 (meters)
  poolLengthUnit: z.literal("meters").optional(), // NEW: Priority 2
  steps: z.array(z.union([workoutStepSchema, repetitionBlockSchema])),
});
```

**Design Decisions:**

- `subSport`: Optional string matching FIT sub-sport enumeration
- `poolLength`: Stored in meters (normalized from FIT units)
- `poolLengthUnit`: Always "meters" in KRD (converted from FIT)

#### WorkoutStep Schema (Priority 1 & 2)

```typescript
// domain/schemas/workout-step.ts
export const workoutStepSchema = z.object({
  stepIndex: z.number().int().nonnegative(),
  durationType: z.enum([...existing, "calories", "power_less_than", ...]),
  duration: durationSchema,
  targetType: z.enum([...existing]),
  target: targetSchema,
  intensity: z.enum([...existing]).optional(),
  notes: z.string().max(256).optional(),  // NEW: Priority 1
  equipment: z.string().optional(),  // NEW: Priority 2
});
```

**Design Decisions:**

- `notes`: Max 256 characters (FIT limitation)
- `equipment`: String matching FIT equipment enumeration

#### Duration Schema (Priority 2)

```typescript
// domain/schemas/duration.ts
export const durationSchema = z.discriminatedUnion("type", [
  // Existing types
  z.object({ type: z.literal("time"), seconds: z.number().positive() }),
  z.object({ type: z.literal("distance"), meters: z.number().positive() }),
  z.object({
    type: z.literal("heart_rate_less_than"),
    bpm: z.number().positive(),
  }),
  z.object({ type: z.literal("open") }),

  // NEW: Calorie-based (Priority 2)
  z.object({
    type: z.literal("calories"),
    calories: z.number().int().positive(),
  }),

  // NEW: Power-based (Priority 2)
  z.object({
    type: z.literal("power_less_than"),
    watts: z.number().positive(),
  }),
  z.object({
    type: z.literal("power_greater_than"),
    watts: z.number().positive(),
  }),

  // NEW: Repeat conditionals (Priority 2)
  z.object({
    type: z.literal("repeat_until_time"),
    seconds: z.number().positive(),
  }),
  z.object({
    type: z.literal("repeat_until_distance"),
    meters: z.number().positive(),
  }),
  z.object({
    type: z.literal("repeat_until_calories"),
    calories: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("repeat_until_heart_rate_less_than"),
    bpm: z.number().positive(),
  }),
  z.object({
    type: z.literal("repeat_until_heart_rate_greater_than"),
    bpm: z.number().positive(),
  }),
  z.object({
    type: z.literal("repeat_until_power_less_than"),
    watts: z.number().positive(),
  }),
  z.object({
    type: z.literal("repeat_until_power_greater_than"),
    watts: z.number().positive(),
  }),
]);
```

**Design Decisions:**

- Discriminated union on `type` field for type safety
- Each duration type has specific value fields (seconds, meters, watts, calories, bpm)
- Naming: `repeat_until_heart_rate_*` (not `heart_rate_*`) for consistency

### 2. FIT Constants

```typescript
// adapters/fit/constants.ts

// NEW: Sub-sport values (matching Garmin JavaScript SDK)
export const FIT_SUB_SPORT = {
  GENERIC: "generic",
  TREADMILL: "treadmill",
  STREET: "street",
  TRAIL: "trail",
  TRACK: "track",
  SPIN: "spin",
  INDOOR_CYCLING: "indoorCycling",
  ROAD: "road",
  MOUNTAIN: "mountain",
  // ... additional sub-sports
} as const;

// NEW: Equipment values (matching Garmin JavaScript SDK)
export const FIT_EQUIPMENT = {
  NONE: "none",
  SWIM_FINS: "swimFins",
  SWIM_KICKBOARD: "swimKickboard",
  SWIM_PADDLES: "swimPaddles",
  SWIM_PULL_BUOY: "swimPullBuoy",
  SWIM_SNORKEL: "swimSnorkel",
} as const;

// NEW: Duration types (matching Garmin JavaScript SDK field names)
export const FIT_DURATION_TYPE = {
  // ... existing
  TIME: "time",
  DISTANCE: "distance",
  HR_LESS_THAN: "hrLessThan",
  OPEN: "open",
  REPEAT_UNTIL_STEPS_COMPLETE: "repeatUntilStepsCmplt",
  REPEAT_UNTIL_HR_GREATER_THAN: "repeatUntilHrGreaterThan",
  // NEW:
  CALORIES: "calories",
  POWER_LESS_THAN: "powerLessThan",
  POWER_GREATER_THAN: "powerGreaterThan",
  REPEAT_UNTIL_TIME: "repeatUntilTime",
  REPEAT_UNTIL_DISTANCE: "repeatUntilDistance",
  REPEAT_UNTIL_CALORIES: "repeatUntilCalories",
  REPEAT_UNTIL_HR_LESS_THAN: "repeatUntilHrLessThan",
  REPEAT_UNTIL_POWER_LESS_THAN: "repeatUntilPowerLessThan",
  REPEAT_UNTIL_POWER_GREATER_THAN: "repeatUntilPowerGreaterThan",
} as const;

// NEW: KRD duration type constants (for use in converters)
export const KRD_DURATION_TYPE = {
  TIME: "time",
  DISTANCE: "distance",
  HEART_RATE_LESS_THAN: "heart_rate_less_than",
  OPEN: "open",
  CALORIES: "calories",
  POWER_LESS_THAN: "power_less_than",
  POWER_GREATER_THAN: "power_greater_than",
  REPEAT_UNTIL_TIME: "repeat_until_time",
  REPEAT_UNTIL_DISTANCE: "repeat_until_distance",
  REPEAT_UNTIL_CALORIES: "repeat_until_calories",
  REPEAT_UNTIL_HEART_RATE_LESS_THAN: "repeat_until_heart_rate_less_than",
  REPEAT_UNTIL_HEART_RATE_GREATER_THAN: "repeat_until_heart_rate_greater_than",
  REPEAT_UNTIL_POWER_LESS_THAN: "repeat_until_power_less_than",
  REPEAT_UNTIL_POWER_GREATER_THAN: "repeat_until_power_greater_than",
} as const;
```

**Design Decisions:**

- FIT constants are strings matching Garmin JavaScript SDK field names (camelCase)
- KRD constants are strings for KRD format (snake_case)
- Use `as const` for type inference
- Group related constants together
- **No hardcoded strings in converters** - always use constants from `KRD_DURATION_TYPE` and `FIT_DURATION_TYPE`

### 3. FIT → KRD Converters

#### Workout Message Converter

```typescript
// adapters/fit/fit-to-krd/fit-to-krd.converter.ts

const convertWorkoutMessage = (fitWorkout: FitWorkoutMessage): Workout => {
  return {
    name: fitWorkout.wktName,
    sport: convertSport(fitWorkout.sport),
    subSport:
      fitWorkout.subSport !== undefined
        ? convertSubSport(fitWorkout.subSport)
        : undefined, // NEW
    poolLength:
      fitWorkout.poolLength !== undefined
        ? convertPoolLength(fitWorkout.poolLength, fitWorkout.poolLengthUnit)
        : undefined, // NEW
    poolLengthUnit: fitWorkout.poolLength !== undefined ? "meters" : undefined, // NEW
    steps: convertSteps(fitWorkout.steps),
  };
};

const convertPoolLength = (length: number, unit?: number): number => {
  // Convert to meters based on FIT unit
  if (unit === 0) return length; // Already meters
  if (unit === 1) return length * 0.9144; // Yards to meters
  return length; // Default to meters
};
```

#### WorkoutStep Message Converter

```typescript
const convertWorkoutStepMessage = (
  fitStep: FitWorkoutStepMessage
): WorkoutStep => {
  return {
    stepIndex: fitStep.messageIndex,
    durationType: convertDurationType(fitStep.durationType),
    duration: convertDuration(fitStep),
    targetType: convertTargetType(fitStep.targetType),
    target: convertTarget(fitStep),
    intensity:
      fitStep.intensity !== undefined
        ? convertIntensity(fitStep.intensity)
        : undefined,
    notes: fitStep.notes, // NEW: Direct mapping
    equipment:
      fitStep.equipment !== undefined
        ? convertEquipment(fitStep.equipment)
        : undefined, // NEW
  };
};
```

#### Duration Converter

```typescript
// adapters/fit/duration/duration.converter.ts

const convertDuration = (fitStep: FitWorkoutStepMessage): Duration => {
  const durationType = fitStep.durationType;

  // Existing types
  if (durationType === FIT_DURATION_TYPE.TIME) {
    return { type: "time", seconds: fitStep.durationTime };
  }

  // NEW: Calorie-based
  if (durationType === FIT_DURATION_TYPE.CALORIES) {
    return { type: "calories", calories: fitStep.durationCalories };
  }

  // NEW: Power-based
  if (durationType === FIT_DURATION_TYPE.POWER_LESS_THAN) {
    return { type: "power_less_than", watts: fitStep.durationPower };
  }

  if (durationType === FIT_DURATION_TYPE.POWER_GREATER_THAN) {
    return { type: "power_greater_than", watts: fitStep.durationPower };
  }

  // NEW: Repeat conditionals
  if (durationType === FIT_DURATION_TYPE.REPEAT_UNTIL_TIME) {
    return { type: "repeat_until_time", seconds: fitStep.durationTime };
  }

  if (durationType === FIT_DURATION_TYPE.REPEAT_UNTIL_DISTANCE) {
    return { type: "repeat_until_distance", meters: fitStep.durationDistance };
  }

  if (durationType === FIT_DURATION_TYPE.REPEAT_UNTIL_CALORIES) {
    return {
      type: "repeat_until_calories",
      calories: fitStep.durationCalories,
    };
  }

  if (durationType === FIT_DURATION_TYPE.REPEAT_UNTIL_HR_LESS_THAN) {
    return {
      type: "repeat_until_heart_rate_less_than",
      bpm: fitStep.durationHr,
    };
  }

  if (durationType === FIT_DURATION_TYPE.REPEAT_UNTIL_HR_GREATER_THAN) {
    return {
      type: "repeat_until_heart_rate_greater_than",
      bpm: fitStep.durationHr,
    };
  }

  if (durationType === FIT_DURATION_TYPE.REPEAT_UNTIL_POWER_LESS_THAN) {
    return {
      type: "repeat_until_power_less_than",
      watts: fitStep.durationPower,
    };
  }

  if (durationType === FIT_DURATION_TYPE.REPEAT_UNTIL_POWER_GREATER_THAN) {
    return {
      type: "repeat_until_power_greater_than",
      watts: fitStep.durationPower,
    };
  }

  // Fallback
  return { type: "open" };
};
```

**Design Decisions:**

- Each duration type maps to specific FIT dynamic field
- Consistent naming: `repeat_until_heart_rate_*` (not `heart_rate_*`)
- Fallback to "open" for unknown types

### 4. KRD → FIT Converters

#### Workout Converter

```typescript
// adapters/fit/krd-to-fit/krd-to-fit.converter.ts

const convertWorkoutToFit = (workout: Workout): FitWorkoutMessage => {
  const message: FitWorkoutMessage = {
    sport: convertSportToFit(workout.sport),
    wktName: workout.name,
    numValidSteps: countValidSteps(workout.steps),
  };

  // NEW: Optional fields
  if (workout.subSport !== undefined) {
    message.subSport = convertSubSportToFit(workout.subSport);
  }

  if (workout.poolLength !== undefined) {
    message.poolLength = workout.poolLength; // Already in meters
    message.poolLengthUnit = 0; // 0 = meters in FIT
  }

  return message;
};
```

#### WorkoutStep Converter

```typescript
const convertWorkoutStepToFit = (
  step: WorkoutStep,
  index: number
): FitWorkoutStepMessage => {
  const message: FitWorkoutStepMessage = {
    messageIndex: index,
    durationType: convertDurationTypeToFit(step.duration.type),
    targetType: convertTargetTypeToFit(step.target.type),
    ...convertDurationFields(step.duration),
    ...convertTargetFields(step.target),
  };

  // NEW: Optional fields
  if (step.notes !== undefined) {
    message.notes = step.notes;
  }

  if (step.equipment !== undefined) {
    message.equipment = convertEquipmentToFit(step.equipment);
  }

  if (step.intensity !== undefined) {
    message.intensity = convertIntensityToFit(step.intensity);
  }

  return message;
};
```

#### Duration Fields Converter

```typescript
const convertDurationFields = (
  duration: Duration
): Partial<FitWorkoutStepMessage> => {
  switch (duration.type) {
    case "time":
      return { durationTime: duration.seconds };

    case "distance":
      return { durationDistance: duration.meters };

    // NEW: Calorie-based
    case "calories":
      return { durationCalories: duration.calories };

    // NEW: Power-based
    case "power_less_than":
      return { durationPower: duration.watts };

    case "power_greater_than":
      return { durationPower: duration.watts };

    // NEW: Repeat conditionals
    case "repeat_until_time":
      return { durationTime: duration.seconds };

    case "repeat_until_distance":
      return { durationDistance: duration.meters };

    case "repeat_until_calories":
      return { durationCalories: duration.calories };

    case "repeat_until_heart_rate_less_than":
      return { durationHr: duration.bpm };

    case "repeat_until_heart_rate_greater_than":
      return { durationHr: duration.bpm };

    case "repeat_until_power_less_than":
      return { durationPower: duration.watts };

    case "repeat_until_power_greater_than":
      return { durationPower: duration.watts };

    case "open":
    default:
      return {};
  }
};
```

**Design Decisions:**

- Return partial FIT message with only relevant fields
- Type-safe switch on discriminated union
- Dynamic field names based on duration type

## Data Models

### Type Definitions

```typescript
// Inferred from Zod schemas

export type Workout = z.infer<typeof workoutSchema>;
// {
//   name?: string;
//   sport: string;
//   subSport?: string;  // NEW
//   poolLength?: number;  // NEW (meters)
//   poolLengthUnit?: "meters";  // NEW
//   steps: Array<WorkoutStep | RepetitionBlock>;
// }

export type WorkoutStep = z.infer<typeof workoutStepSchema>;
// {
//   stepIndex: number;
//   durationType: string;
//   duration: Duration;
//   targetType: string;
//   target: Target;
//   intensity?: string;
//   notes?: string;  // NEW
//   equipment?: string;  // NEW
// }

export type Duration = z.infer<typeof durationSchema>;
// Discriminated union with 14 variants (5 existing + 9 new)
```

### Enumeration Mappings

```typescript
// Sub-sport mapping (FIT camelCase → KRD snake_case)
const SUB_SPORT_MAP: Record<string, string> = {
  generic: "generic",
  treadmill: "treadmill",
  street: "street",
  trail: "trail",
  track: "track",
  spin: "spin",
  indoorCycling: "indoor_cycling",
  road: "road",
  mountain: "mountain",
  // ... additional mappings
};

// Equipment mapping (FIT camelCase → KRD snake_case)
const EQUIPMENT_MAP: Record<string, string> = {
  none: "none",
  swimFins: "swim_fins",
  swimKickboard: "swim_kickboard",
  swimPaddles: "swim_paddles",
  swimPullBuoy: "swim_pull_buoy",
  swimSnorkel: "swim_snorkel",
};
```

## Error Handling

### Validation Errors

```typescript
// Domain error for schema validation
export class KrdValidationError extends Error {
  public override readonly name = "KrdValidationError";

  constructor(
    message: string,
    public readonly errors: Array<{ field: string; message: string }>
  ) {
    super(message);
  }
}
```

### Error Scenarios

1. **Invalid sub-sport value**: Validate against FIT enumeration
2. **Invalid equipment value**: Validate against FIT enumeration
3. **Notes too long**: Max 256 characters
4. **Negative duration values**: All duration values must be positive
5. **Invalid pool length**: Must be positive number

### Error Handling Strategy

- **Validation at boundaries**: Validate in adapters before conversion
- **Graceful degradation**: Unknown values map to "generic" or "none"
- **Clear error messages**: Include field name and expected format
- **Preserve stack traces**: Use Error.captureStackTrace

## Testing Strategy

### Unit Tests

```typescript
// Test each converter function independently
describe("convertWorkoutMessage", () => {
  it("should map subSport from FIT to KRD", () => {
    const fitWorkout = buildFitWorkout.build({ subSport: 3 }); // trail
    const krd = convertWorkoutMessage(fitWorkout);
    expect(krd.subSport).toBe("trail");
  });

  it("should omit subSport when undefined", () => {
    const fitWorkout = buildFitWorkout.build({ subSport: undefined });
    const krd = convertWorkoutMessage(fitWorkout);
    expect(krd).not.toHaveProperty("subSport");
  });
});
```

### Integration Tests

```typescript
// Test FIT → KRD → FIT round-trip
describe("Round-trip conversion with new fields", () => {
  it("should preserve subSport through round-trip", () => {
    const originalFit = buildFitWorkout.build({
      subSport: 3, // trail
      wktName: "Trail Run",
    });

    const krd = fitToKrd(originalFit);
    const convertedFit = krdToFit(krd);

    expect(convertedFit.subSport).toBe(originalFit.subSport);
  });

  it("should preserve notes through round-trip", () => {
    const originalFit = buildFitWorkoutStep.build({
      notes: "Focus on form and breathing",
    });

    const krd = fitToKrd(originalFit);
    const convertedFit = krdToFit(krd);

    expect(convertedFit.notes).toBe(originalFit.notes);
  });

  it("should preserve pool length through round-trip", () => {
    const originalFit = buildFitWorkout.build({
      poolLength: 25,
      poolLengthUnit: 0, // meters
    });

    const krd = fitToKrd(originalFit);
    const convertedFit = krdToFit(krd);

    expect(convertedFit.poolLength).toBeCloseTo(originalFit.poolLength, 2);
  });
});
```

### Golden Tests

```typescript
// Test with real FIT files containing new fields
describe("Golden tests with new fields", () => {
  it("should match snapshot for workout with subSport", () => {
    const fitBuffer = readFixture("WorkoutWithSubSport.fit");
    const krd = fitToKrd(fitBuffer);
    expect(krd).toMatchSnapshot();
  });

  it("should match snapshot for swimming workout", () => {
    const fitBuffer = readFixture("SwimmingWorkout.fit");
    const krd = fitToKrd(fitBuffer);
    expect(krd).toMatchSnapshot();
  });
});
```

### Test Fixtures

```typescript
// tests/fixtures/workout.fixtures.ts

export const buildWorkoutWithSubSport = new Factory<Workout>()
  .extend(buildWorkout)
  .attr("subSport", () =>
    faker.helpers.arrayElement([
      "trail",
      "road",
      "track",
      "treadmill",
      "mountain",
    ])
  );

export const buildWorkoutStepWithNotes = new Factory<WorkoutStep>()
  .extend(buildWorkoutStep)
  .attr("notes", () => faker.lorem.sentence({ max: 256, min: 10 }));

export const buildSwimmingWorkout = new Factory<Workout>()
  .extend(buildWorkout)
  .attr("sport", () => "swimming")
  .attr("poolLength", () => faker.helpers.arrayElement([25, 50]))
  .attr("poolLengthUnit", () => "meters" as const);

export const buildWorkoutStepWithEquipment = new Factory<WorkoutStep>()
  .extend(buildWorkoutStep)
  .attr("equipment", () =>
    faker.helpers.arrayElement([
      "swim_fins",
      "swim_kickboard",
      "swim_paddles",
      "swim_pull_buoy",
    ])
  );

// Duration fixtures
export const buildCalorieDuration = new Factory<Duration>()
  .attr("type", () => "calories" as const)
  .attr("calories", () => faker.number.int({ max: 1000, min: 50 }));

export const buildPowerDuration = new Factory<Duration>()
  .attr("type", () =>
    faker.helpers.arrayElement([
      "power_less_than",
      "power_greater_than",
    ] as const)
  )
  .attr("watts", () => faker.number.int({ max: 500, min: 100 }));
```

### Coverage Targets

- **Converters**: ≥90% coverage
- **Schema validation**: 100% coverage
- **Round-trip tests**: All new fields tested
- **Edge cases**: Empty values, boundary conditions, invalid inputs

## Migration Strategy

### Compatibility Notes

1. **All new fields are optional**: New fields can be omitted
2. **Naming fix**: `heart_rate_greater_than` renamed to `repeat_until_heart_rate_greater_than` (pre-release, no backward compatibility needed)
3. **Graceful handling**: Missing fields omitted (not null)
4. **Schema versioning**: KRD version remains "1.0"

### Migration Path

```typescript
// Old KRD files work without modification
const oldKrd: KRD = {
  version: "1.0",
  type: "workout",
  metadata: { ... },
  workout: {
    name: "My Workout",
    sport: "cycling",
    steps: [ ... ]
  }
};

// New KRD files can include optional fields
const newKrd: KRD = {
  version: "1.0",
  type: "workout",
  metadata: { ... },
  workout: {
    name: "My Workout",
    sport: "cycling",
    subSport: "road",  // NEW
    steps: [
      {
        ...step,
        notes: "Focus on cadence"  // NEW
      }
    ]
  }
};
```

### Naming Consistency Fix

Since the project hasn't been published yet, we can fix the naming inconsistency directly:

**Change**: `heart_rate_greater_than` → `repeat_until_heart_rate_greater_than`

```typescript
// Update existing duration type to use consistent naming
export const durationSchema = z.discriminatedUnion("type", [
  // OLD (remove):
  // z.object({ type: z.literal("heart_rate_greater_than"), bpm: z.number().positive() }),

  // NEW (consistent naming):
  z.object({
    type: z.literal("repeat_until_heart_rate_greater_than"),
    bpm: z.number().positive(),
  }),
]);
```

**Impact**:

- Update all existing tests and fixtures
- Update any example KRD files in documentation
- No backward compatibility needed (pre-release)

## Implementation Phases

### Phase 1: Priority 1 Fields (Estimated: 2-3 hours)

1. Update domain schemas (subSport, notes)
2. Add FIT constants
3. Implement FIT → KRD converters
4. Implement KRD → FIT converters
5. Add unit tests
6. Add round-trip tests

**Deliverable**: subSport and notes fields fully functional

### Phase 2: Priority 2 - Swimming Fields (Estimated: 2 hours)

1. Update domain schemas (poolLength, poolLengthUnit, equipment)
2. Add FIT constants for equipment
3. Implement converters with unit conversion
4. Add unit tests
5. Add round-trip tests with tolerance

**Deliverable**: Swimming-specific fields functional

### Phase 3: Priority 2 - Advanced Durations (Estimated: 4-6 hours)

1. Update duration schema with 9 new types
2. Add FIT constants for duration types
3. Implement duration converters (FIT ↔ KRD)
4. Add comprehensive unit tests
5. Add round-trip tests for each duration type
6. Add golden tests with real FIT files

**Deliverable**: All advanced duration types functional

### Phase 4: Documentation & Migration (Estimated: 1-2 hours)

1. Update JSON Schema generation
2. Update API documentation
3. Add migration guide
4. Update CHANGELOG
5. Add deprecation warnings for old naming

**Deliverable**: Complete documentation and migration path

## Performance Considerations

### Memory

- **No impact**: New fields are optional and only allocated when present
- **Schema validation**: Minimal overhead (Zod is optimized)

### CPU

- **Converter overhead**: Negligible (simple field mapping)
- **Duration type checking**: O(1) with discriminated unions

### File Size

- **KRD files**: Slightly larger when new fields present (~5-10% for typical workouts)
- **FIT files**: No change (binary format, optional fields omitted when absent)

## Security Considerations

1. **Input validation**: All fields validated against schemas
2. **String length limits**: Notes limited to 256 characters
3. **Numeric bounds**: All numeric values validated as positive
4. **Enumeration validation**: Sub-sport and equipment validated against FIT spec
5. **No injection risks**: Pure data transformation, no code execution

## Monitoring & Observability

### Logging

```typescript
logger.debug("Converting workout with new fields", {
  hasSubSport: workout.subSport !== undefined,
  hasPoolLength: workout.poolLength !== undefined,
  hasNotes: workout.steps.some((s) => s.notes !== undefined),
  advancedDurationTypes: workout.steps
    .map((s) => s.duration.type)
    .filter((t) => isAdvancedDurationType(t)),
});
```

### Metrics

- Count of workouts using new fields
- Distribution of sub-sport values
- Distribution of equipment types
- Usage of advanced duration types

## Success Criteria

1. ✅ All 10 requirements implemented
2. ✅ Test coverage ≥90% for converters
3. ✅ All round-trip tests passing
4. ✅ No breaking changes to existing API
5. ✅ Documentation complete
6. ✅ Migration guide provided
7. ✅ Performance impact < 5%
