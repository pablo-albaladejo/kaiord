# Design Document

## Overview

This document describes the design for migrating TypeScript constant objects to Zod schemas as the single source of truth for all enumeration types in Kaiord. The migration will establish a clear separation between domain concepts (KRD format) and adapter-specific concepts (FIT SDK format), enable runtime validation at adapter boundaries, and eliminate code duplication.

## Architecture

### Current State

```
packages/core/src/adapters/fit/
├── constants.ts                    # Mixed FIT and KRD constants
├── sub-sport-fit.constants.ts      # FIT sub-sport (camelCase)
└── sub-sport-krd.constants.ts      # KRD sub-sport (snake_case)
```

**Problems:**

- Constants are plain TypeScript objects with `as const`
- No runtime validation
- Mixed domain and adapter concerns in single file
- Duplication between FIT and KRD constants
- Not following the project's Zod-first pattern

### Target State

```
packages/core/src/domain/schemas/
├── sport.ts              # sportEnum + Sport type
├── sub-sport.ts          # subSportEnum + SubSport type
├── file-type.ts          # fileTypeEnum + FileType type
├── swim-stroke.ts        # swimStrokeEnum + SwimStroke type + mappings
├── duration.ts           # ✅ Already exists
├── intensity.ts          # ✅ Already exists
├── target.ts             # ✅ Already exists
└── target-values.ts      # ✅ Already exists

packages/core/src/adapters/fit/schemas/
├── fit-sport.ts          # fitSportEnum + FitSport type
├── fit-sub-sport.ts      # fitSubSportEnum + FitSubSport type
├── fit-duration.ts       # fitDurationTypeEnum + FitDurationType type
├── fit-target.ts         # fitTargetTypeEnum + FitTargetType type
└── fit-message-keys.ts   # fitMessageKeyEnum + FitMessageKey type
```

**Benefits:**

- Clear separation: domain vs adapter
- Runtime validation at boundaries
- Single source of truth (Zod schemas)
- Type inference from schemas
- Consistent with existing patterns

## Components and Interfaces

### 1. Domain Schemas (KRD Format)

#### Sport Schema (`domain/schemas/sport.ts`)

```typescript
import { z } from "zod";

export const sportEnum = z.enum(["cycling", "running", "swimming", "generic"]);

export type Sport = z.infer<typeof sportEnum>;
```

**Usage:**

- Validates KRD sport field
- Used in workout metadata
- Maps 1:1 with FIT sport (same values)

#### Sub-Sport Schema (`domain/schemas/sub-sport.ts`)

```typescript
import { z } from "zod";

export const subSportEnum = z.enum([
  "generic",
  "treadmill",
  "street",
  "trail",
  "track",
  "spin",
  "indoor_cycling", // snake_case
  "road",
  "mountain",
  "downhill",
  "recumbent",
  "cyclocross",
  "hand_cycling", // snake_case
  "track_cycling", // snake_case
  "indoor_rowing", // snake_case
  "elliptical",
  "stair_climbing", // snake_case
  "lap_swimming", // snake_case
  "open_water", // snake_case
  "flexibility_training", // snake_case
  "strength_training", // snake_case
  "warm_up", // snake_case
  "match",
  "exercise",
  "challenge",
  "indoor_skiing", // snake_case
  "cardio_training", // snake_case
  "indoor_walking", // snake_case
  "e_bike_fitness", // snake_case
  "bmx",
  "casual_walking", // snake_case
  "speed_walking", // snake_case
  "bike_to_run_transition", // snake_case
  "run_to_bike_transition", // snake_case
  "swim_to_bike_transition", // snake_case
  "atv",
  "motocross",
  "backcountry",
  "resort",
  "rc_drone", // snake_case
  "wingsuit",
  "whitewater",
  "skate_skiing", // snake_case
  "yoga",
  "pilates",
  "indoor_running", // snake_case
  "gravel_cycling", // snake_case
  "e_bike_mountain", // snake_case
  "commuting",
  "mixed_surface", // snake_case
  "navigate",
  "track_me", // snake_case
  "map",
  "single_gas_diving", // snake_case
  "multi_gas_diving", // snake_case
  "gauge_diving", // snake_case
  "apnea_diving", // snake_case
  "apnea_hunting", // snake_case
  "virtual_activity", // snake_case
  "obstacle",
  "all",
]);

export type SubSport = z.infer<typeof subSportEnum>;
```

**Usage:**

- Validates KRD subSport field
- Uses snake_case for multi-word values
- Maps to FIT camelCase values via mapper

#### File Type Schema (`domain/schemas/file-type.ts`)

```typescript
import { z } from "zod";

export const fileTypeEnum = z.enum(["workout", "activity", "course"]);

export type FileType = z.infer<typeof fileTypeEnum>;
```

**Usage:**

- Validates KRD type field
- Maps 1:1 with FIT file types

#### Swim Stroke Schema (`domain/schemas/swim-stroke.ts`)

```typescript
import { z } from "zod";

export const swimStrokeEnum = z.enum([
  "freestyle",
  "backstroke",
  "breaststroke",
  "butterfly",
  "drill",
  "mixed",
  "im",
]);

export type SwimStroke = z.infer<typeof swimStrokeEnum>;

// Mapping to FIT numeric values
export const SWIM_STROKE_TO_FIT = {
  freestyle: 0,
  backstroke: 1,
  breaststroke: 2,
  butterfly: 3,
  drill: 4,
  mixed: 5,
  im: 5,
} as const satisfies Record<SwimStroke, number>;

// Mapping from FIT numeric values
export const FIT_TO_SWIM_STROKE: Record<number, SwimStroke> = {
  0: "freestyle",
  1: "backstroke",
  2: "breaststroke",
  3: "butterfly",
  4: "drill",
  5: "mixed", // Note: 5 can be either "mixed" or "im"
};
```

**Usage:**

- Validates swim stroke types
- Provides bidirectional mapping to FIT numeric values
- Note: FIT value 5 is ambiguous (mixed/im)

### 2. Adapter Schemas (FIT SDK Format)

#### FIT Sport Schema (`adapters/fit/schemas/fit-sport.ts`)

```typescript
import { z } from "zod";

// FIT SDK format (matches Garmin SDK exactly)
export const fitSportEnum = z.enum([
  "cycling",
  "running",
  "swimming",
  "generic",
]);

export type FitSport = z.infer<typeof fitSportEnum>;
```

**Usage:**

- Validates FIT sport field from Garmin SDK
- Same values as KRD (no transformation needed)

#### FIT Sub-Sport Schema (`adapters/fit/schemas/fit-sub-sport.ts`)

```typescript
import { z } from "zod";

// FIT SDK format (camelCase - matches Garmin SDK)
export const fitSubSportEnum = z.enum([
  "generic",
  "treadmill",
  "street",
  "trail",
  "track",
  "spin",
  "indoorCycling", // camelCase
  "road",
  "mountain",
  "downhill",
  "recumbent",
  "cyclocross",
  "handCycling", // camelCase
  "trackCycling", // camelCase
  "indoorRowing", // camelCase
  "elliptical",
  "stairClimbing", // camelCase
  "lapSwimming", // camelCase
  "openWater", // camelCase
  "flexibilityTraining", // camelCase
  "strengthTraining", // camelCase
  "warmUp", // camelCase
  "match",
  "exercise",
  "challenge",
  "indoorSkiing", // camelCase
  "cardioTraining", // camelCase
  "indoorWalking", // camelCase
  "eBikeFitness", // camelCase
  "bmx",
  "casualWalking", // camelCase
  "speedWalking", // camelCase
  "bikeToRunTransition", // camelCase
  "runToBikeTransition", // camelCase
  "swimToBikeTransition", // camelCase
  "atv",
  "motocross",
  "backcountry",
  "resort",
  "rcDrone", // camelCase
  "wingsuit",
  "whitewater",
  "skateSkiing", // camelCase
  "yoga",
  "pilates",
  "indoorRunning", // camelCase
  "gravelCycling", // camelCase
  "eBikeMountain", // camelCase
  "commuting",
  "mixedSurface", // camelCase
  "navigate",
  "trackMe", // camelCase
  "map",
  "singleGasDiving", // camelCase
  "multiGasDiving", // camelCase
  "gaugeDiving", // camelCase
  "apneaDiving", // camelCase
  "apneaHunting", // camelCase
  "virtualActivity", // camelCase
  "obstacle",
  "all",
]);

export type FitSubSport = z.infer<typeof fitSubSportEnum>;
```

**Usage:**

- Validates FIT sub_sport field from Garmin SDK
- Uses camelCase (Garmin SDK convention)
- Maps to KRD snake_case via mapper

#### FIT Duration Type Schema (`adapters/fit/schemas/fit-duration.ts`)

```typescript
import { z } from "zod";

// FIT SDK duration types (camelCase - matches Garmin SDK)
export const fitDurationTypeEnum = z.enum([
  "time",
  "distance",
  "repeatUntilStepsCmplt",
  "repeatUntilHrGreaterThan",
  "hrLessThan",
  "hrGreaterThan",
  "open",
]);

export type FitDurationType = z.infer<typeof fitDurationTypeEnum>;
```

**Usage:**

- Validates FIT duration_type field
- Maps to KRD duration types (different naming)

#### FIT Target Type Schema (`adapters/fit/schemas/fit-target.ts`)

```typescript
import { z } from "zod";

// FIT SDK target types (camelCase - matches Garmin SDK)
export const fitTargetTypeEnum = z.enum([
  "power",
  "heartRate",
  "cadence",
  "speed",
  "swimStroke",
  "open",
]);

export type FitTargetType = z.infer<typeof fitTargetTypeEnum>;
```

**Usage:**

- Validates FIT target_type field
- Maps to KRD target types (different naming)

#### FIT Message Keys Schema (`adapters/fit/schemas/fit-message-keys.ts`)

```typescript
import { z } from "zod";

// FIT SDK message property names
export const fitMessageKeyEnum = z.enum([
  "fileIdMesgs",
  "workoutMesgs",
  "workoutStepMesgs",
]);

export type FitMessageKey = z.infer<typeof fitMessageKeyEnum>;
```

**Usage:**

- Validates FIT message property names
- Used for type-safe message access

### 3. Mapper Updates

#### Sub-Sport Mapper (`adapters/fit/sub-sport.mapper.ts`)

**Before:**

```typescript
import { FIT_SUB_SPORT } from "./sub-sport-fit.constants";
import { KRD_SUB_SPORT } from "./sub-sport-krd.constants";

const FIT_TO_KRD_SUB_SPORT_MAP: Record<string, string> = {
  [FIT_SUB_SPORT.INDOOR_CYCLING]: KRD_SUB_SPORT.INDOOR_CYCLING,
  // ... 60+ mappings
};

export const mapSubSportToKrd = (fitSubSport: string): string => {
  return FIT_TO_KRD_SUB_SPORT_MAP[fitSubSport] || KRD_SUB_SPORT.GENERIC;
};
```

**After:**

```typescript
import { z } from "zod";
import { subSportEnum, type SubSport } from "../../domain/schemas/sub-sport";
import { fitSubSportEnum, type FitSubSport } from "./schemas/fit-sub-sport";

// Bidirectional mapping
const FIT_TO_KRD_SUB_SPORT_MAP: Record<FitSubSport, SubSport> = {
  indoorCycling: "indoor_cycling",
  handCycling: "hand_cycling",
  trackCycling: "track_cycling",
  lapSwimming: "lap_swimming",
  openWater: "open_water",
  flexibilityTraining: "flexibility_training",
  strengthTraining: "strength_training",
  warmUp: "warm_up",
  indoorSkiing: "indoor_skiing",
  cardioTraining: "cardio_training",
  indoorWalking: "indoor_walking",
  eBikeFitness: "e_bike_fitness",
  casualWalking: "casual_walking",
  speedWalking: "speed_walking",
  bikeToRunTransition: "bike_to_run_transition",
  runToBikeTransition: "run_to_bike_transition",
  swimToBikeTransition: "swim_to_bike_transition",
  rcDrone: "rc_drone",
  skateSkiing: "skate_skiing",
  indoorRunning: "indoor_running",
  gravelCycling: "gravel_cycling",
  eBikeMountain: "e_bike_mountain",
  mixedSurface: "mixed_surface",
  trackMe: "track_me",
  singleGasDiving: "single_gas_diving",
  multiGasDiving: "multi_gas_diving",
  gaugeDiving: "gauge_diving",
  apneaDiving: "apnea_diving",
  apneaHunting: "apnea_hunting",
  virtualActivity: "virtual_activity",
  // 1:1 mappings (same in both formats)
  generic: "generic",
  treadmill: "treadmill",
  street: "street",
  trail: "trail",
  track: "track",
  spin: "spin",
  road: "road",
  mountain: "mountain",
  downhill: "downhill",
  recumbent: "recumbent",
  cyclocross: "cyclocross",
  elliptical: "elliptical",
  match: "match",
  exercise: "exercise",
  challenge: "challenge",
  bmx: "bmx",
  atv: "atv",
  motocross: "motocross",
  backcountry: "backcountry",
  resort: "resort",
  wingsuit: "wingsuit",
  whitewater: "whitewater",
  yoga: "yoga",
  pilates: "pilates",
  commuting: "commuting",
  navigate: "navigate",
  map: "map",
  obstacle: "obstacle",
  all: "all",
};

const KRD_TO_FIT_SUB_SPORT_MAP: Record<SubSport, FitSubSport> =
  Object.fromEntries(
    Object.entries(FIT_TO_KRD_SUB_SPORT_MAP).map(([fit, krd]) => [krd, fit])
  ) as Record<SubSport, FitSubSport>;

export const mapSubSportToKrd = (fitSubSport: unknown): SubSport => {
  // Validate at boundary
  const result = fitSubSportEnum.safeParse(fitSubSport);

  if (!result.success) {
    // Invalid FIT sub-sport, return generic
    return subSportEnum.enum.generic;
  }

  return FIT_TO_KRD_SUB_SPORT_MAP[result.data] || subSportEnum.enum.generic;
};

export const mapSubSportToFit = (krdSubSport: unknown): FitSubSport => {
  // Validate at boundary
  const result = subSportEnum.safeParse(krdSubSport);

  if (!result.success) {
    // Invalid KRD sub-sport, return generic
    return fitSubSportEnum.enum.generic;
  }

  return KRD_TO_FIT_SUB_SPORT_MAP[result.data] || fitSubSportEnum.enum.generic;
};
```

**Changes:**

- Import from schema files instead of constants
- Use `z.safeParse()` for validation at boundary
- Use `enum.enum.value` for accessing enum values
- Type-safe mapping with `Record<FitSubSport, SubSport>`

#### Duration Converter (`adapters/fit/duration/duration.converter.ts`)

**Before:**

```typescript
import { FIT_DURATION_TYPE } from "../constants";

export const convertFitDuration = (data: FitDurationData): Duration => {
  const durationType = data.durationType;

  if (durationType === FIT_DURATION_TYPE.TIME) {
    return convertTimeDuration(data) || { type: durationTypeEnum.enum.open };
  }
  // ...
};
```

**After:**

```typescript
import { fitDurationTypeEnum } from "../schemas/fit-duration";
import { durationTypeEnum } from "../../../domain/schemas/duration";

export const convertFitDuration = (data: FitDurationData): Duration => {
  // Validate at boundary
  const result = fitDurationTypeEnum.safeParse(data.durationType);

  if (!result.success) {
    return { type: durationTypeEnum.enum.open };
  }

  const durationType = result.data;

  if (durationType === fitDurationTypeEnum.enum.time) {
    return convertTimeDuration(data) || { type: durationTypeEnum.enum.open };
  }

  if (durationType === fitDurationTypeEnum.enum.distance) {
    return (
      convertDistanceDuration(data) || { type: durationTypeEnum.enum.open }
    );
  }

  if (durationType === fitDurationTypeEnum.enum.hrLessThan) {
    return (
      convertHeartRateLessThan(data) || { type: durationTypeEnum.enum.open }
    );
  }

  if (durationType === fitDurationTypeEnum.enum.repeatUntilHrGreaterThan) {
    return (
      convertHeartRateGreaterThan(data) || { type: durationTypeEnum.enum.open }
    );
  }

  return { type: durationTypeEnum.enum.open };
};
```

**Changes:**

- Validate `durationType` at boundary
- Use `enum.enum.value` for comparisons
- Handle validation failures gracefully

#### Target Mappers (`adapters/fit/krd-to-fit/krd-to-fit-target-*.mapper.ts`)

**Before:**

```typescript
import {
  FIT_TARGET_TYPE,
  KRD_TARGET_TYPE,
  KRD_TARGET_UNIT,
} from "../constants";

export const convertPowerTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  message.targetType = FIT_TARGET_TYPE.POWER;
  if (step.target.type !== KRD_TARGET_TYPE.POWER) return;
  // ...
};
```

**After:**

```typescript
import { fitTargetTypeEnum } from "../schemas/fit-target";
import { targetTypeEnum, targetUnitEnum } from "../../../domain/schemas/target";

export const convertPowerTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  message.targetType = fitTargetTypeEnum.enum.power;
  if (step.target.type !== targetTypeEnum.enum.power) return;

  const value = step.target.value;

  if (value.unit === targetUnitEnum.enum.watts) {
    message.targetValue = value.value;
  } else if (value.unit === targetUnitEnum.enum.percent_ftp) {
    message.targetValue = value.value;
  }
  // ...
};
```

**Changes:**

- Import from schema files
- Use `enum.enum.value` for all comparisons
- Type-safe with inferred types

## Data Models

### Schema File Structure

Each schema file follows this pattern:

```typescript
import { z } from "zod";

// Define enum schema
export const {concept}Enum = z.enum([
  "value1",
  "value2",
  // ...
]);

// Infer TypeScript type
export type {Concept} = z.infer<typeof {concept}Enum>;

// Optional: mapping objects for numeric conversions
export const {CONCEPT}_TO_FIT = {
  value1: 0,
  value2: 1,
} as const satisfies Record<{Concept}, number>;
```

### Naming Conventions

| Element          | Pattern            | Example                           |
| ---------------- | ------------------ | --------------------------------- |
| Schema variable  | `{concept}Enum`    | `sportEnum`, `subSportEnum`       |
| Inferred type    | `{Concept}`        | `Sport`, `SubSport`               |
| FIT schema       | `fit{Concept}Enum` | `fitSportEnum`, `fitSubSportEnum` |
| FIT type         | `Fit{Concept}`     | `FitSport`, `FitSubSport`         |
| Mapping constant | `{CONCEPT}_TO_FIT` | `SWIM_STROKE_TO_FIT`              |

### Type Safety

All schemas provide:

- **Runtime validation** via `.parse()` or `.safeParse()`
- **Compile-time types** via `z.infer<typeof schema>`
- **Autocomplete** via `enum.enum.value`
- **Exhaustiveness checking** in switch statements

## Error Handling

### Validation Strategy

1. **At adapter boundaries**: Always validate external data
2. **Use `.safeParse()`**: Never throw on invalid data
3. **Provide defaults**: Fall back to sensible defaults (e.g., "generic")
4. **Log warnings**: Log when falling back to defaults

### Example Error Handling

```typescript
export const mapSubSportToKrd = (fitSubSport: unknown): SubSport => {
  const result = fitSubSportEnum.safeParse(fitSubSport);

  if (!result.success) {
    // Log warning (if logger available)
    logger?.warn("Invalid FIT sub-sport, using generic", {
      value: fitSubSport,
      error: result.error,
    });

    // Return safe default
    return subSportEnum.enum.generic;
  }

  return FIT_TO_KRD_SUB_SPORT_MAP[result.data] || subSportEnum.enum.generic;
};
```

### Validation Errors

Zod provides detailed error messages:

```typescript
const result = sportEnum.safeParse("invalid");

if (!result.success) {
  console.log(result.error.issues);
  // [
  //   {
  //     code: "invalid_enum_value",
  //     options: ["cycling", "running", "swimming", "generic"],
  //     path: [],
  //     message: "Invalid enum value. Expected 'cycling' | 'running' | 'swimming' | 'generic', received 'invalid'"
  //   }
  // ]
}
```

## Testing Strategy

### Schema Tests

Each schema file should have co-located tests:

```typescript
// domain/schemas/sport.test.ts
import { describe, expect, it } from "vitest";
import { sportEnum } from "./sport";

describe("sportEnum", () => {
  it("should validate correct sport values", () => {
    // Arrange & Act
    const result = sportEnum.safeParse("cycling");

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("cycling");
    }
  });

  it("should reject invalid sport values", () => {
    // Arrange & Act
    const result = sportEnum.safeParse("invalid");

    // Assert
    expect(result.success).toBe(false);
  });

  it("should provide all expected sport values", () => {
    // Arrange
    const expected = ["cycling", "running", "swimming", "generic"];

    // Act
    const values = sportEnum.options;

    // Assert
    expect(values).toStrictEqual(expected);
  });
});
```

### Mapper Tests

Update existing mapper tests to verify validation:

```typescript
// adapters/fit/sub-sport.mapper.test.ts
import { describe, expect, it } from "vitest";
import { mapSubSportToKrd, mapSubSportToFit } from "./sub-sport.mapper";

describe("mapSubSportToKrd", () => {
  it("should map valid FIT sub-sport to KRD", () => {
    // Arrange & Act
    const result = mapSubSportToKrd("indoorCycling");

    // Assert
    expect(result).toBe("indoor_cycling");
  });

  it("should return generic for invalid FIT sub-sport", () => {
    // Arrange & Act
    const result = mapSubSportToKrd("invalid");

    // Assert
    expect(result).toBe("generic");
  });

  it("should handle unknown types gracefully", () => {
    // Arrange & Act
    const result = mapSubSportToKrd(null);

    // Assert
    expect(result).toBe("generic");
  });
});
```

### Round-Trip Tests

Ensure schemas don't break round-trip conversions:

```typescript
it("should preserve sub-sport through round-trip", () => {
  // Arrange
  const krd = buildKrd.build({
    workout: buildWorkout.build({
      subSport: "indoor_cycling",
    }),
  });

  // Act
  const fitMessages = convertKRDToMessages(krd, mockLogger);
  const roundTrippedKrd = convertMessagesToKRD(fitMessages, mockLogger);

  // Assert
  expect(roundTrippedKrd.workout?.subSport).toBe("indoor_cycling");
});
```

## Migration Plan

### Phase 1: Create Domain Schemas

1. Create `domain/schemas/sport.ts`
2. Create `domain/schemas/sub-sport.ts`
3. Create `domain/schemas/file-type.ts`
4. Create `domain/schemas/swim-stroke.ts`
5. Add tests for each schema

### Phase 2: Create Adapter Schemas

1. Create `adapters/fit/schemas/` directory
2. Create `adapters/fit/schemas/fit-sport.ts`
3. Create `adapters/fit/schemas/fit-sub-sport.ts`
4. Create `adapters/fit/schemas/fit-duration.ts`
5. Create `adapters/fit/schemas/fit-target.ts`
6. Create `adapters/fit/schemas/fit-message-keys.ts`
7. Add tests for each schema

### Phase 3: Update Mappers

1. Update `sub-sport.mapper.ts`
2. Update `duration/duration.converter.ts`
3. Update `krd-to-fit/krd-to-fit-target-*.mapper.ts`
4. Update `krd-to-fit/krd-to-fit-step.mapper.ts`
5. Update `krd-to-fit/krd-to-fit-workout.mapper.ts`
6. Update `workout/workout.mapper.ts`
7. Update all mapper tests

### Phase 4: Remove Constants Files

1. Remove `constants.ts`
2. Remove `sub-sport-fit.constants.ts`
3. Remove `sub-sport-krd.constants.ts`
4. Update `sub-sport.ts` exports
5. Verify no imports remain

### Phase 5: Verification

1. Run all tests
2. Verify round-trip tests pass
3. Check test coverage
4. Update documentation

## Dependencies

- **Zod**: Already installed and used in the project
- **Existing schemas**: Build on patterns from `duration.ts`, `target.ts`, etc.
- **No breaking changes**: Public API remains unchanged

## Performance Considerations

- **Validation overhead**: Minimal (Zod is optimized)
- **Bundle size**: Slightly larger (Zod schemas vs plain objects)
- **Runtime safety**: Worth the trade-off for validation

## Backward Compatibility

- **Public API**: No changes to exported functions
- **KRD format**: No changes to JSON structure
- **FIT format**: No changes to binary output
- **Existing tests**: Should pass without modification
- **Type signatures**: Remain compatible (inferred types match existing)

## Future Enhancements

1. **JSON Schema generation**: Use `zod-to-json-schema` to generate JSON Schema from Zod
2. **OpenAPI integration**: Generate OpenAPI specs from Zod schemas
3. **Form validation**: Reuse schemas for CLI input validation
4. **Documentation**: Auto-generate docs from schemas
