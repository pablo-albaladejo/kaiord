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
├── duration.ts         # Add advanced duration types
├── sub-sport.ts        # NEW: Domain sub-sport enum (snake_case)
└── equipment.ts        # NEW: Domain equipment enum (snake_case)

adapters/fit/
├── schemas/            # NEW: FIT adapter Zod schemas (camelCase)
│   ├── fit-sub-sport.ts       # FIT sub-sport enum
│   ├── fit-equipment.ts       # FIT equipment enum
│   └── fit-duration-type.ts   # FIT duration type enum
├── sub-sport.mapper.ts        # NEW: Bidirectional sub-sport mapping
├── equipment.mapper.ts        # NEW: Bidirectional equipment mapping
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

### 2. FIT Adapter Schemas

Following the Zod patterns, we define enum schemas for FIT adapter-specific types (not constant objects).

#### FIT Sub-Sport Schema

```typescript
// adapters/fit/schemas/fit-sub-sport.ts
import { z } from "zod";

export const fitSubSportEnum = z.enum([
  "generic",
  "treadmill",
  "street",
  "trail",
  "track",
  "spin",
  "indoorCycling", // camelCase for FIT SDK
  "road",
  "mountain",
  "gravel",
  "cyclocross",
  "handCycling",
  "trackCycling",
  "indoorRowing",
  "elliptical",
  "stairClimbing",
  "lapSwimming",
  "openWater",
  // ... additional sub-sports
]);

export type FitSubSport = z.infer<typeof fitSubSportEnum>;
```

#### FIT Equipment Schema

```typescript
// adapters/fit/schemas/fit-equipment.ts
import { z } from "zod";

export const fitEquipmentEnum = z.enum([
  "none",
  "swimFins", // camelCase for FIT SDK
  "swimKickboard",
  "swimPaddles",
  "swimPullBuoy",
  "swimSnorkel",
]);

export type FitEquipment = z.infer<typeof fitEquipmentEnum>;
```

#### FIT Duration Type Schema

```typescript
// adapters/fit/schemas/fit-duration-type.ts
import { z } from "zod";

export const fitDurationTypeEnum = z.enum([
  // Existing
  "time",
  "distance",
  "hrLessThan",
  "open",
  "repeatUntilStepsCmplt",
  "repeatUntilHrGreaterThan",
  // NEW: Advanced duration types
  "calories",
  "powerLessThan",
  "powerGreaterThan",
  "repeatUntilTime",
  "repeatUntilDistance",
  "repeatUntilCalories",
  "repeatUntilHrLessThan",
  "repeatUntilPowerLessThan",
  "repeatUntilPowerGreaterThan",
]);

export type FitDurationType = z.infer<typeof fitDurationTypeEnum>;
```

**Design Decisions:**

- **Zod enum schemas** instead of constant objects (following `zod-patterns.md`)
- **camelCase values** for FIT adapter schemas (matching Garmin JavaScript SDK)
- **Runtime validation** available via `.safeParse()` for external data
- **Type inference** via `z.infer<typeof schema>`
- **Access enum values** via `.enum` property (e.g., `fitSubSportEnum.enum.indoorCycling`)
- **No hardcoded strings in converters** - always use enum schema values

### 3. FIT → KRD Converters

#### Workout Message Converter

````typescript
// adapters/fit/fit-to-krd/fit-to-krd-metadata.mapper.ts
import { mapSubSportToKrd } from "../sub-sport.mapper";
import type { Workout } from "../../../domain/schemas/workout";
import type { FitWorkoutMessage } from "../types";

const convertWorkoutMessage = (fitWorkout: FitWorkoutMessage): Workout => {
  return {
    name: fitWorkout.wktName,
    sport: convertSport(fitWorkout.sport),
    subSport:
      fitWorkout.subSport !== undefined
        ? mapSubSportToKrd(fitWorkout.subSport) // NEW: Use mapper with validation
        : undefined,
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
// adapters/fit/fit-to-krd/fit-to-krd-step.mapper.ts
import { mapEquipmentToKrd } from "../equipment.mapper";
import type { WorkoutStep } from "../../../domain/schemas/workout-step";
import type { FitWorkoutStepMessage } from "../types";

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
    notes: fitStep.notes, // NEW: Direct mapping (string)
    equipment:
      fitStep.equipment !== undefined
        ? mapEquipmentToKrd(fitStep.equipment) // NEW: Use mapper with validation
        : undefined,
  };
};
````

#### Duration Converter

```typescript
// adapters/fit/duration/duration.converter.ts
import { fitDurationTypeEnum } from "../schemas/fit-duration-type";
import type { Duration } from "../../../domain/schemas/duration";
import type { FitWorkoutStepMessage } from "../types";

const convertDuration = (fitStep: FitWorkoutStepMessage): Duration => {
  const durationType = fitStep.durationType;

  // Existing types
  if (durationType === fitDurationTypeEnum.enum.time) {
    return { type: "time", seconds: fitStep.durationTime };
  }

  // NEW: Calorie-based
  if (durationType === fitDurationTypeEnum.enum.calories) {
    return { type: "calories", calories: fitStep.durationCalories };
  }

  // NEW: Power-based
  if (durationType === fitDurationTypeEnum.enum.powerLessThan) {
    return { type: "power_less_than", watts: fitStep.durationPower };
  }

  if (durationType === fitDurationTypeEnum.enum.powerGreaterThan) {
    return { type: "power_greater_than", watts: fitStep.durationPower };
  }

  // NEW: Repeat conditionals
  if (durationType === fitDurationTypeEnum.enum.repeatUntilTime) {
    return { type: "repeat_until_time", seconds: fitStep.durationTime };
  }

  if (durationType === fitDurationTypeEnum.enum.repeatUntilDistance) {
    return { type: "repeat_until_distance", meters: fitStep.durationDistance };
  }

  if (durationType === fitDurationTypeEnum.enum.repeatUntilCalories) {
    return {
      type: "repeat_until_calories",
      calories: fitStep.durationCalories,
    };
  }

  if (durationType === fitDurationTypeEnum.enum.repeatUntilHrLessThan) {
    return {
      type: "repeat_until_heart_rate_less_than",
      bpm: fitStep.durationHr,
    };
  }

  if (durationType === fitDurationTypeEnum.enum.repeatUntilHrGreaterThan) {
    return {
      type: "repeat_until_heart_rate_greater_than",
      bpm: fitStep.durationHr,
    };
  }

  if (durationType === fitDurationTypeEnum.enum.repeatUntilPowerLessThan) {
    return {
      type: "repeat_until_power_less_than",
      watts: fitStep.durationPower,
    };
  }

  if (durationType === fitDurationTypeEnum.enum.repeatUntilPowerGreaterThan) {
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

- **Use enum schema values** via `.enum` property (no hardcoded strings)
- Each duration type maps to specific FIT dynamic field
- Consistent naming: `repeat_until_heart_rate_*` (not `heart_rate_*`)
- Fallback to "open" for unknown types
- Type-safe comparisons with enum values

### 4. KRD → FIT Converters

#### Workout Converter

```typescript
// adapters/fit/krd-to-fit/krd-to-fit-metadata.mapper.ts
import { mapSubSportToFit } from "../sub-sport.mapper";
import type { Workout } from "../../../domain/schemas/workout";
import type { FitWorkoutMessage } from "../types";

const convertWorkoutToFit = (workout: Workout): FitWorkoutMessage => {
  const message: FitWorkoutMessage = {
    sport: convertSportToFit(workout.sport),
    wktName: workout.name,
    numValidSteps: countValidSteps(workout.steps),
  };

  // NEW: Optional fields
  if (workout.subSport !== undefined) {
    message.subSport = mapSubSportToFit(workout.subSport); // Use mapper
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
// adapters/fit/krd-to-fit/krd-to-fit-step.mapper.ts
import { mapEquipmentToFit } from "../equipment.mapper";
import type { WorkoutStep } from "../../../domain/schemas/workout-step";
import type { FitWorkoutStepMessage } from "../types";

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
    message.notes = step.notes; // Direct mapping (string)
  }

  if (step.equipment !== undefined) {
    message.equipment = mapEquipmentToFit(step.equipment); // Use mapper
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

Bidirectional mappings between FIT adapter schemas (camelCase) and domain schemas (snake_case).

```typescript
// adapters/fit/sub-sport.mapper.ts
import { subSportEnum, type SubSport } from "../../domain/schemas/sub-sport";
import { fitSubSportEnum, type FitSubSport } from "./schemas/fit-sub-sport";

// FIT → KRD mapping
const FIT_TO_KRD_SUB_SPORT: Record<FitSubSport, SubSport> = {
  generic: "generic",
  treadmill: "treadmill",
  street: "street",
  trail: "trail",
  track: "track",
  spin: "spin",
  indoorCycling: "indoor_cycling", // camelCase → snake_case
  road: "road",
  mountain: "mountain",
  gravel: "gravel",
  cyclocross: "cyclocross",
  handCycling: "hand_cycling",
  trackCycling: "track_cycling",
  indoorRowing: "indoor_rowing",
  elliptical: "elliptical",
  stairClimbing: "stair_climbing",
  lapSwimming: "lap_swimming",
  openWater: "open_water",
};

export const mapSubSportToKrd = (fitSubSport: unknown): SubSport => {
  const result = fitSubSportEnum.safeParse(fitSubSport);
  if (!result.success) {
    return subSportEnum.enum.generic; // Safe default
  }
  return FIT_TO_KRD_SUB_SPORT[result.data] || subSportEnum.enum.generic;
};

export const mapSubSportToFit = (krdSubSport: SubSport): FitSubSport => {
  // Reverse mapping
  const entry = Object.entries(FIT_TO_KRD_SUB_SPORT).find(
    ([_, krd]) => krd === krdSubSport
  );
  return entry ? (entry[0] as FitSubSport) : fitSubSportEnum.enum.generic;
};
```

```typescript
// adapters/fit/equipment.mapper.ts
import { equipmentEnum, type Equipment } from "../../domain/schemas/equipment";
import { fitEquipmentEnum, type FitEquipment } from "./schemas/fit-equipment";

// FIT → KRD mapping
const FIT_TO_KRD_EQUIPMENT: Record<FitEquipment, Equipment> = {
  none: "none",
  swimFins: "swim_fins",
  swimKickboard: "swim_kickboard",
  swimPaddles: "swim_paddles",
  swimPullBuoy: "swim_pull_buoy",
  swimSnorkel: "swim_snorkel",
};

export const mapEquipmentToKrd = (fitEquipment: unknown): Equipment => {
  const result = fitEquipmentEnum.safeParse(fitEquipment);
  if (!result.success) {
    return equipmentEnum.enum.none; // Safe default
  }
  return FIT_TO_KRD_EQUIPMENT[result.data] || equipmentEnum.enum.none;
};

export const mapEquipmentToFit = (krdEquipment: Equipment): FitEquipment => {
  // Reverse mapping
  const entry = Object.entries(FIT_TO_KRD_EQUIPMENT).find(
    ([_, krd]) => krd === krdEquipment
  );
  return entry ? (entry[0] as FitEquipment) : fitEquipmentEnum.enum.none;
};
```

**Design Decisions:**

- **Validation at adapter boundary** using `.safeParse()`
- **Safe defaults** for invalid values (generic, none)
- **Bidirectional mappers** for FIT ↔ KRD conversions
- **Type-safe mappings** using Record types
- **Access enum values** via `.enum` property for comparisons

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

**Requirement**: Maintain backward compatibility with existing `heart_rate_greater_than` duration type while introducing consistent naming.

**Strategy**: Support both old and new naming during a transition period:

```typescript
// Support both old and new naming for backward compatibility
export const durationSchema = z.discriminatedUnion("type", [
  // DEPRECATED: Old naming (maintained for backward compatibility)
  z.object({
    type: z.literal("heart_rate_greater_than"),
    bpm: z.number().positive(),
  }),

  // NEW: Consistent naming (preferred)
  z.object({
    type: z.literal("repeat_until_heart_rate_greater_than"),
    bpm: z.number().positive(),
  }),

  // ... other duration types
]);
```

**Converter Behavior**:

- **FIT → KRD**: Always use new naming (`repeat_until_heart_rate_greater_than`)
- **KRD → FIT**: Accept both old and new naming, convert to FIT format
- **Validation**: Both variants pass schema validation

**Migration Path**:

```typescript
// Old KRD files continue to work
const oldKrd = {
  duration: {
    type: "heart_rate_greater_than", // DEPRECATED but supported
    bpm: 160,
  },
};

// New KRD files use consistent naming
const newKrd = {
  duration: {
    type: "repeat_until_heart_rate_greater_than", // PREFERRED
    bpm: 160,
  },
};

// Converter normalizes to new naming
const normalized = normalizeDuration(oldKrd.duration);
// Result: { type: "repeat_until_heart_rate_greater_than", bpm: 160 }
```

**Documentation Requirements**:

1. Mark `heart_rate_greater_than` as DEPRECATED in schema documentation
2. Add migration guide showing how to update existing KRD files
3. Include deprecation warnings in converter logs when old naming is detected
4. Plan for removal in future major version (e.g., v2.0.0)

**Impact**:

- Existing KRD files with old naming continue to work
- New conversions from FIT always use new naming
- Gradual migration path for users
- Clear deprecation timeline

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

## Deprecation Strategy

### Deprecated Duration Type

**Type**: `heart_rate_greater_than` (deprecated in favor of `repeat_until_heart_rate_greater_than`)

**Deprecation Timeline**:

1. **Current version (1.x)**: Both variants supported, old naming deprecated
2. **Next major version (2.0)**: Remove support for old naming

**Implementation**:

```typescript
// Helper function to normalize deprecated duration types
const normalizeDurationType = (type: string): string => {
  if (type === "heart_rate_greater_than") {
    logger.warn("Duration type 'heart_rate_greater_than' is deprecated", {
      deprecatedType: "heart_rate_greater_than",
      preferredType: "repeat_until_heart_rate_greater_than",
      migrationGuide: "https://kaiord.dev/migration/duration-naming",
    });
    return "repeat_until_heart_rate_greater_than";
  }
  return type;
};

// Use in converters
const convertDuration = (fitStep: FitWorkoutStepMessage): Duration => {
  // ... conversion logic
  const normalizedType = normalizeDurationType(duration.type);
  return { ...duration, type: normalizedType };
};
```

**User Communication**:

- Add deprecation notice to CHANGELOG
- Update documentation with migration examples
- Log warnings when deprecated types are encountered
- Provide automated migration tool (optional)

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
  deprecatedTypesUsed: workout.steps.filter(
    (s) => s.duration.type === "heart_rate_greater_than"
  ).length,
});
```

### Metrics

- Count of workouts using new fields
- Distribution of sub-sport values
- Distribution of equipment types
- Usage of advanced duration types
- **Deprecation tracking**: Count of deprecated duration types encountered

## Success Criteria

1. ✅ All 10 requirements implemented
2. ✅ Test coverage ≥90% for converters
3. ✅ All round-trip tests passing
4. ✅ No breaking changes to existing API
5. ✅ Documentation complete
6. ✅ Migration guide provided
7. ✅ Performance impact < 5%
