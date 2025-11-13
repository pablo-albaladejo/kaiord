# Zod Patterns: Schema-First Development

Kaiord uses **Zod as the single source of truth** for schemas and TypeScript types.

## Core Principles

1. **Schema → Type**: Define Zod schemas first, infer types after
2. **Validation at boundaries**: Validate at entry points (CLI, external adapters)
3. **Reusable domain schemas**: Shared schemas in `domain/`
4. **No internal validation**: Use cases and business logic receive already-validated types

## Naming Conventions

```typescript
// ✅ CORRECT: camelCase + "Schema" suffix for ALL Zod schemas
export const krdMetadataSchema = z.object({ ... });
export const workoutStepSchema = z.object({ ... });
export const durationSchema = z.discriminatedUnion('type', [...]);

// ✅ CORRECT: camelCase + "Schema" suffix for enums too
export const sportSchema = z.enum(["cycling", "running", "swimming", "generic"]);
export const subSportSchema = z.enum(["generic", "indoor_cycling", "lap_swimming"]);
export const intensitySchema = z.enum(["warmup", "active", "cooldown", "rest"]);

// ✅ Infer types with z.infer
export type KRDMetadata = z.infer<typeof krdMetadataSchema>;
export type WorkoutStep = z.infer<typeof workoutStepSchema>;
export type Duration = z.infer<typeof durationSchema>;
export type Sport = z.infer<typeof sportSchema>;
export type SubSport = z.infer<typeof subSportSchema>;

// ❌ INCORRECT
export type KRDMetadata = { ... };  // Don't define types manually
const KRDMetadata = z.object({ ... }); // PascalCase
const krd_metadata = z.object({ ... }); // snake_case
export const sportEnum = z.enum([...]); // Don't use "Enum" suffix, use "Schema"
```

## File Structure

```
packages/
├── core/src/
│   ├── domain/
│   │   ├── schemas/              # ✅ Zod schemas (source of truth for KRD)
│   │   │   ├── krd.ts           # krdSchema + type KRD
│   │   │   ├── workout.ts       # workoutSchema + type Workout
│   │   │   ├── duration.ts      # durationSchema + type Duration
│   │   │   ├── target.ts        # targetSchema + type Target
│   │   │   ├── target-values.ts # targetUnitSchema + type TargetUnit
│   │   │   ├── sport.ts         # sportSchema + type Sport
│   │   │   ├── sub-sport.ts     # subSportSchema + type SubSport (snake_case)
│   │   │   ├── file-type.ts     # fileTypeSchema + type FileType
│   │   │   ├── swim-stroke.ts   # swimStrokeSchema + type SwimStroke
│   │   │   └── intensity.ts     # intensitySchema + type Intensity
│   │   └── validation/          # Business validators (not Zod)
│   │       └── round-trip.ts
│   ├── adapters/
│   │   └── fit/
│   │       ├── schemas/         # ✅ FIT SDK-specific schemas (camelCase)
│   │       │   ├── fit-sport.ts        # fitSportSchema + type FitSport
│   │       │   ├── fit-sub-sport.ts    # fitSubSportSchema + type FitSubSport (camelCase)
│   │       │   ├── fit-duration.ts     # fitDurationTypeSchema + type FitDurationType
│   │       │   ├── fit-target.ts       # fitTargetTypeSchema + type FitTargetType
│   │       │   └── fit-message-keys.ts # fitMessageKeySchema + type FitMessageKey
│   │       └── garmin-fitsdk.ts # Validates external responses with Zod
│   ├── application/
│   │   └── use-cases/           # NO validation, receives inferred types
│   └── ports/                   # Contracts/interfaces
└── cli/src/
    └── commands/                # Validates CLI inputs with Zod
```

## Patrón: Schema → Type

```typescript
// domain/schemas/duration.ts
import { z } from "zod";

// 1. Define schema Zod
export const durationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("time"),
    seconds: z.number().positive(),
  }),
  z.object({
    type: z.literal("distance"),
    meters: z.number().positive(),
  }),
  z.object({
    type: z.literal("open"),
  }),
]);

// 2. Infiere tipo TypeScript
export type Duration = z.infer<typeof durationSchema>;

// 3. DON'T define separate enums, use z.literal + discriminatedUnion
```

## Pattern: Enum Schemas

For enumeration types, use `z.enum()` instead of constant objects:

```typescript
// ✅ CORRECT: Enum schema with runtime validation
// domain/schemas/sport.ts
import { z } from "zod";

export const sportSchema = z.enum([
  "cycling",
  "running",
  "swimming",
  "generic",
]);
export type Sport = z.infer<typeof sportSchema>;

// Access enum values via .enum property
sportSchema.enum.cycling; // "cycling"
sportSchema.enum.running; // "running"

// Validate at runtime
const result = sportSchema.safeParse("cycling");
if (result.success) {
  console.log(result.data); // "cycling"
}

// ❌ INCORRECT: Constant object (deprecated)
export const SPORT_TYPE = {
  CYCLING: "cycling",
  RUNNING: "running",
} as const;
```

### Enum Naming Conventions

**Domain enums** (KRD format) use **snake_case** for multi-word values:

```typescript
// domain/schemas/sub-sport.ts
export const subSportSchema = z.enum([
  "generic",
  "indoor_cycling", // snake_case
  "hand_cycling",
  "lap_swimming",
  "open_water",
]);
export type SubSport = z.infer<typeof subSportSchema>;
```

**Adapter enums** (FIT SDK format) use **camelCase** to match external SDKs:

```typescript
// adapters/fit/schemas/fit-sub-sport.ts
export const fitSubSportSchema = z.enum([
  "generic",
  "indoorCycling", // camelCase
  "handCycling",
  "lapSwimming",
  "openWater",
]);
export type FitSubSport = z.infer<typeof fitSubSportSchema>;
```

### Using Enum Schemas in Mappers

```typescript
// adapters/fit/sub-sport.mapper.ts
import { subSportSchema, type SubSport } from "../../domain/schemas/sub-sport";
import { fitSubSportSchema, type FitSubSport } from "./schemas/fit-sub-sport";

// Bidirectional mapping
const FIT_TO_KRD_MAP: Record<FitSubSport, SubSport> = {
  indoorCycling: "indoor_cycling",
  handCycling: "hand_cycling",
  lapSwimming: "lap_swimming",
  // ... other mappings
};

export const mapSubSportToKrd = (fitSubSport: unknown): SubSport => {
  // Validate at adapter boundary
  const result = fitSubSportSchema.safeParse(fitSubSport);

  if (!result.success) {
    // Return safe default for invalid values
    return subSportSchema.enum.generic;
  }

  return FIT_TO_KRD_MAP[result.data] || subSportSchema.enum.generic;
};

// Use enum values for comparisons
if (durationType === fitDurationTypeSchema.enum.time) {
  // Handle time duration
}
```

### Enum Schemas with Numeric Mappings

For enums that need numeric conversions (e.g., FIT protocol):

```typescript
// domain/schemas/swim-stroke.ts
import { z } from "zod";

export const swimStrokeSchema = z.enum([
  "freestyle",
  "backstroke",
  "breaststroke",
  "butterfly",
  "drill",
  "mixed",
  "im",
]);

export type SwimStroke = z.infer<typeof swimStrokeSchema>;

// Bidirectional numeric mappings
export const SWIM_STROKE_TO_FIT = {
  freestyle: 0,
  backstroke: 1,
  breaststroke: 2,
  butterfly: 3,
  drill: 4,
  mixed: 5,
  im: 5,
} as const satisfies Record<SwimStroke, number>;

export const FIT_TO_SWIM_STROKE: Record<number, SwimStroke> = {
  0: "freestyle",
  1: "backstroke",
  2: "breaststroke",
  3: "butterfly",
  4: "drill",
  5: "mixed",
};
```

## Pattern: Discriminated Unions

For types with variants (Duration, Target, etc.):

```typescript
// ✅ CORRECT: discriminatedUnion
export const targetSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("power"),
    value: z.discriminatedUnion("unit", [
      z.object({ unit: z.literal("watts"), value: z.number() }),
      z.object({ unit: z.literal("percent_ftp"), value: z.number() }),
      z.object({ unit: z.literal("zone"), value: z.number().int().min(1).max(7) }),
      z.object({ unit: z.literal("range"), min: z.number(), max: z.number() }),
    ]),
  }),
  z.object({
    type: z.literal("heart_rate"),
    value: z.discriminatedUnion("unit", [
      z.object({ unit: z.literal("bpm"), value: z.number() }),
      z.object({ unit: z.literal("zone"), value: z.number().int().min(1).max(5) }),
      z.object({ unit: z.literal("percent_max"), value: z.number() }),
      z.object({ unit: z.literal("range"), min: z.number(), max: z.number() }),
    ]),
  }),
  z.object({ type: z.literal("open") }),
]);

export type Target = z.infer<typeof targetSchema>;

// ❌ INCORRECT: Don't use separate enums
export enum TargetType { ... }  // NO
```

## Pattern: Schema Composition

```typescript
// domain/schemas/workout.ts
import { z } from "zod";
import { durationSchema } from "./duration";
import { targetSchema } from "./target";

export const workoutStepSchema = z.object({
  stepIndex: z.number().int().nonnegative(),
  durationType: z.enum(["time", "distance", "open"]),
  duration: durationSchema,
  targetType: z.enum(["power", "heart_rate", "cadence", "pace", "open"]),
  target: targetSchema,
});

export const repetitionBlockSchema = z.object({
  repeatCount: z.number().int().min(2),
  steps: z.array(workoutStepSchema),
});

export const workoutSchema = z.object({
  name: z.string().optional(),
  sport: z.string(),
  steps: z.array(z.union([workoutStepSchema, repetitionBlockSchema])),
});

export type WorkoutStep = z.infer<typeof workoutStepSchema>;
export type RepetitionBlock = z.infer<typeof repetitionBlockSchema>;
export type Workout = z.infer<typeof workoutSchema>;
```

## Validation at Boundaries

### CLI (packages/cli)

```typescript
// packages/cli/src/commands/convert.ts
import { z } from "zod";

const cliArgsSchema = z.object({
  input: z.string(),
  output: z.string(),
  format: z.enum(["fit", "tcx", "pwx"]),
});

export const convertCommand = async (args: unknown) => {
  // Validate at boundary
  const validated = cliArgsSchema.parse(args);

  // Pass validated types to use case
  return await convertFileUseCase(validated);
};
```

### Adapters (External Responses)

```typescript
// adapters/fit/garmin-fitsdk.ts
import { z } from "zod";
import { krdSchema } from "../../domain/schemas/krd";

const fitMessageSchema = z.object({
  timestamp: z.number(),
  sport: z.number(),
  // ... FIT fields
});

export const createFitReader = (logger: Logger): FitReader => ({
  readToKRD: async (buffer: Uint8Array): Promise<KRD> => {
    const decoder = new Decoder(stream);
    const rawData = decoder.read(buffer);

    // Validate external response
    const fitMessages = z.array(fitMessageSchema).parse(rawData.messages);

    // Convert to KRD
    const krd = convertFitMessagesToKRD(fitMessages);

    // Validate result before returning
    return krdSchema.parse(krd);
  },
});
```

## JSON Schema Generation

Zod is the source of truth, JSON Schema is generated automatically:

```typescript
// scripts/generate-json-schema.ts
import { zodToJsonSchema } from "zod-to-json-schema";
import { krdSchema } from "../src/domain/schemas/krd";
import fs from "fs";

const jsonSchema = zodToJsonSchema(krdSchema, "krd");
fs.writeFileSync("schema/workout.json", JSON.stringify(jsonSchema, null, 2));
```

```json
// package.json
{
  "scripts": {
    "prebuild": "tsx scripts/generate-json-schema.ts",
    "build": "tsup"
  }
}
```

## Testing with Zod

```typescript
// domain/schemas/duration.test.ts
import { describe, expect, it } from "vitest";
import { durationSchema } from "./duration";

describe("durationSchema", () => {
  it("should validate time duration", () => {
    const result = durationSchema.safeParse({
      type: "time",
      seconds: 300,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("time");
      expect(result.data.seconds).toBe(300);
    }
  });

  it("should reject negative seconds", () => {
    const result = durationSchema.safeParse({
      type: "time",
      seconds: -10,
    });

    expect(result.success).toBe(false);
  });

  it("should validate open duration", () => {
    const result = durationSchema.safeParse({
      type: "open",
    });

    expect(result.success).toBe(true);
  });
});
```

## Fixtures with Zod

Fixtures must generate data that passes Zod validation:

```typescript
// tests/fixtures/workout.fixtures.ts
import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type {
  WorkoutStep,
  Duration,
  Target,
} from "../../domain/schemas/workout";
import { workoutStepSchema } from "../../domain/schemas/workout";

export const buildWorkoutStep = new Factory<WorkoutStep>()
  .attr("stepIndex", () => faker.number.int({ max: 50, min: 0 }))
  .attr("durationType", () =>
    faker.helpers.arrayElement(["time", "distance", "open"] as const)
  )
  .attr("duration", ["durationType"], (durationType): Duration => {
    if (durationType === "time") {
      return {
        type: "time",
        seconds: faker.number.int({ max: 3600, min: 30 }),
      };
    } else if (durationType === "distance") {
      return {
        type: "distance",
        meters: faker.number.int({ max: 10000, min: 100 }),
      };
    } else {
      return { type: "open" };
    }
  })
  .attr("targetType", () =>
    faker.helpers.arrayElement(["power", "heart_rate", "open"] as const)
  )
  .attr("target", ["targetType"], (targetType): Target => {
    if (targetType === "power") {
      return {
        type: "power",
        value: {
          unit: "watts",
          value: faker.number.int({ max: 400, min: 100 }),
        },
      };
    } else if (targetType === "heart_rate") {
      return {
        type: "heart_rate",
        value: { unit: "bpm", value: faker.number.int({ max: 200, min: 60 }) },
      };
    } else {
      return { type: "open" };
    }
  })
  .after((step) => {
    // Validate that fixture generates valid data
    workoutStepSchema.parse(step);
  });
```

## Best Practices

### ✅ DO

1. **Define Zod schemas first, types after**
2. **Use `z.enum()` for enumeration types** (not constant objects)
3. **Use `z.discriminatedUnion` for variants** (Duration, Target, etc.)
4. **Validate at boundaries** (CLI, external adapters)
5. **Access enum values via `.enum` property** (e.g., `sportSchema.enum.cycling`)
6. **Use `.safeParse()` for validation** (returns success/error result)
7. **Generate JSON Schema from Zod** (not manually)
8. **Separate domain and adapter schemas** (different naming conventions)

### ❌ DON'T

1. **Don't define TypeScript types manually** (use `z.infer`)
2. **Don't use constant objects for enums** (use `z.enum()`)
3. **Don't use TypeScript `enum` keyword** (use `z.enum()` + `z.infer`)
4. **Don't validate in use cases** (they receive already-validated types)
5. **Don't duplicate schemas** (import and reuse)
6. **Don't use `z.any()`** without justification
7. **Don't maintain JSON Schema manually** (generate from Zod)
8. **Don't hardcode string literals** (use enum schema values)

## Migration from Manual Types

If you already have TypeScript types or constant objects defined:

1. **Create equivalent Zod schema** in `domain/schemas/` or `adapters/*/schemas/`
2. **Replace constant objects with `z.enum()`** for enumeration types
3. **Replace `type` definitions with `z.infer<typeof schema>`**
4. **Use `z.discriminatedUnion` for variant types** (not separate enums)
5. **Update imports** to use schema files instead of constants files
6. **Update comparisons** to use `enum.enum.value` instead of `CONSTANT.VALUE`
7. **Add validation** at adapter boundaries using `.safeParse()`
8. **Remove obsolete constants files** after migration is complete
9. **Regenerate JSON Schema** from Zod

### Example Migration

**Before (constant objects):**

```typescript
// constants.ts
export const FIT_SPORT_TYPE = {
  CYCLING: "cycling",
  RUNNING: "running",
} as const;

// mapper.ts
if (sport === FIT_SPORT_TYPE.CYCLING) {
  return "cycling";
}
```

**After (Zod enum schemas):**

```typescript
// adapters/fit/schemas/fit-sport.ts
export const fitSportSchema = z.enum([
  "cycling",
  "running",
  "swimming",
  "generic",
]);
export type FitSport = z.infer<typeof fitSportSchema>;

// mapper.ts
import { fitSportSchema } from "./schemas/fit-sport";

const result = fitSportSchema.safeParse(sport);
if (!result.success) {
  return fitSportSchema.enum.generic;
}

if (result.data === fitSportSchema.enum.cycling) {
  return "cycling";
}
```

## References

- [Zod Documentation](https://zod.dev)
- [zod-to-json-schema](https://github.com/StefanTerdell/zod-to-json-schema)
- [Discriminated Unions](https://zod.dev/?id=discriminated-unions)
