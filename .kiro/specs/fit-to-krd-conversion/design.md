# Design Document: FIT ↔ KRD Bidirectional Conversion

## Overview

This design implements bidirectional conversion between Garmin FIT workout files and KRD (Kaiord Representation Definition) format. The system follows hexagonal architecture with clear separation between domain logic, application use cases, ports (contracts), and adapters (implementations).

### Key Design Goals

1. **Round-trip safety**: FIT → KRD → FIT and KRD → FIT → KRD preserve data within tolerances
2. **Hexagonal architecture**: Domain logic isolated from external dependencies
3. **Dependency injection**: Swappable FIT SDK implementations via ports
4. **Schema validation**: All KRD output validated against JSON schema
5. **Type safety**: Strict TypeScript with no implicit `any`
6. **Testability**: Golden file tests and round-trip validation with fixtures

### Code Style Preferences

This implementation follows the guidelines defined in `.kiro/steering/`:

**Code Style** (`.kiro/steering/code-style.md`):

1. **Use `type` instead of `interface`** for all type definitions
2. **Use functions instead of classes** for implementation (functional programming style)
3. **Factory functions** (e.g., `createSchemaValidator()`) instead of constructors
4. **Pure functions** where possible, avoiding mutable state
5. **Composition over inheritance**
6. **Separate type imports** using `import type` syntax
7. **Avoid barrel imports** - import directly from source files
8. **Minimal comments** - only for complex logic or non-obvious decisions, never describe what code does
9. **AAA pattern for tests** - Arrange, Act, Assert with blank lines separating sections

**Error Handling & Logging** (`.kiro/steering/error-handling.md`):

1. **Error bubbling principle** - errors are created or propagated upward, handled at outermost layer
2. **Injectable logger** - never use `console.log` directly, always inject logger via DI
3. **Default console logger** - provide console-based logger as default implementation
4. **Structured logging** - include context objects with log messages
5. **Appropriate log levels** - use debug, info, warn, error appropriately

## Architecture

### Layer Structure

```
packages/core/
├── domain/
│   ├── types/
│   │   ├── krd.ts              # KRD type definitions
│   │   ├── workout.ts          # Workout domain models
│   │   ├── duration.ts         # Duration specifications
│   │   ├── target.ts           # Target specifications
│   │   └── errors.ts           # Error types
│   └── validation/
│       ├── schema-validator.ts # JSON schema validation
│       └── tolerance-checker.ts # Round-trip tolerance validation
├── application/
│   ├── use-cases/
│   │   ├── convert-fit-to-krd.ts    # FIT → KRD use case
│   │   ├── convert-krd-to-fit.ts    # KRD → FIT use case
│   │   └── validate-round-trip.ts   # Round-trip validation
│   └── providers.ts            # DI wiring (single swap point)
├── ports/
│   ├── fit-reader.ts           # FIT reading contract
│   ├── fit-writer.ts           # FIT writing contract
│   ├── krd-validator.ts        # KRD validation contract
│   └── logger.ts               # Logger contract
└── adapters/
    ├── fit/
    │   └── garmin-fitsdk.ts    # @garmin/fitsdk implementation
    └── logger/
        └── console-logger.ts   # Console logger implementation
```

### Dependency Flow

```
CLI → Application (use-cases) → Ports (contracts) → Adapters (implementations)
                ↓
            Domain (pure logic)
```

## Components and Types

### Domain Layer

#### Zod Schema Approach

**IMPORTANT**: This project follows a **schema-first approach** using Zod as the single source of truth. All types are inferred from Zod schemas, not defined manually.

- Schemas live in `domain/schemas/` (not `domain/types/`)
- Types are inferred using `z.infer<typeof schema>`
- No manual type definitions or separate enums
- Use `z.discriminatedUnion` for variant types
- JSON Schema is auto-generated from Zod schemas

See `.kiro/steering/zod-patterns.md` for complete patterns and conventions.

#### KRD Schema Definitions

```typescript
// domain/schemas/krd.ts
import { z } from "zod";

export const krdMetadataSchema = z.object({
  created: z.string().datetime(),
  manufacturer: z.string().optional(),
  product: z.string().optional(),
  serialNumber: z.string().optional(),
  sport: z.string(),
  subSport: z.string().optional(),
});

export const krdSessionSchema = z.object({
  startTime: z.string().datetime(),
  totalElapsedTime: z.number().min(0),
  totalTimerTime: z.number().min(0).optional(),
  totalDistance: z.number().min(0).optional(),
  sport: z.string(),
  subSport: z.string().optional(),
  avgHeartRate: z.number().int().min(0).max(300).optional(),
  maxHeartRate: z.number().int().min(0).max(300).optional(),
  avgCadence: z.number().min(0).optional(),
  avgPower: z.number().min(0).optional(),
  totalCalories: z.number().int().min(0).optional(),
});

export const krdLapSchema = z.object({
  startTime: z.string().datetime(),
  totalElapsedTime: z.number().min(0),
  totalDistance: z.number().min(0).optional(),
  avgHeartRate: z.number().int().min(0).max(300).optional(),
  maxHeartRate: z.number().int().min(0).max(300).optional(),
  avgCadence: z.number().min(0).optional(),
  avgPower: z.number().min(0).optional(),
});

export const krdRecordSchema = z.object({
  timestamp: z.string().datetime(),
  position: z
    .object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
    })
    .optional(),
  altitude: z.number().optional(),
  heartRate: z.number().int().min(0).max(300).optional(),
  cadence: z.number().min(0).optional(),
  power: z.number().min(0).optional(),
  speed: z.number().min(0).optional(),
  distance: z.number().min(0).optional(),
});

export const krdEventSchema = z.object({
  timestamp: z.string().datetime(),
  eventType: z.enum([
    "start",
    "stop",
    "pause",
    "resume",
    "lap",
    "marker",
    "timer",
  ]),
  eventGroup: z.number().int().optional(),
  data: z.number().int().optional(),
});

export const krdSchema = z.object({
  version: z.string().regex(/^\d+\.\d+$/),
  type: z.enum(["workout", "activity", "course"]),
  metadata: krdMetadataSchema,
  sessions: z.array(krdSessionSchema).optional(),
  laps: z.array(krdLapSchema).optional(),
  records: z.array(krdRecordSchema).optional(),
  events: z.array(krdEventSchema).optional(),
  extensions: z.record(z.unknown()).optional(),
});

// Infer types from schemas
export type KRDMetadata = z.infer<typeof krdMetadataSchema>;
export type KRDSession = z.infer<typeof krdSessionSchema>;
export type KRDLap = z.infer<typeof krdLapSchema>;
export type KRDRecord = z.infer<typeof krdRecordSchema>;
export type KRDEvent = z.infer<typeof krdEventSchema>;
export type KRD = z.infer<typeof krdSchema>;
```

#### Legacy Type Definitions (TO BE MIGRATED)

The following shows the old manual type approach. **These will be replaced by Zod schemas**:

```typescript
// OLD APPROACH - domain/types/krd.ts (TO BE REMOVED)
export type KRD = {
  version: string;
  type: "workout" | "activity" | "course";
  metadata: KRDMetadata;
  sessions?: Array<KRDSession>;
  laps?: Array<KRDLap>;
  records?: Array<KRDRecord>;
  events?: Array<KRDEvent>;
  extensions?: {
    fit?: Record<string, unknown>;
    [key: string]: unknown;
  };
};

export type KRDMetadata = {
  created: string; // ISO 8601
  manufacturer?: string;
  product?: string;
  serialNumber?: string;
  sport: string;
  subSport?: string;
};

export type KRDSession = {
  startTime: string;
  totalElapsedTime: number;
  totalTimerTime?: number;
  totalDistance?: number;
  sport: string;
  subSport?: string;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgCadence?: number;
  avgPower?: number;
  totalCalories?: number;
};

export type KRDLap = {
  startTime: string;
  totalElapsedTime: number;
  totalDistance?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgCadence?: number;
  avgPower?: number;
};

export type KRDRecord = {
  timestamp: string;
  position?: { lat: number; lon: number };
  altitude?: number;
  heartRate?: number;
  cadence?: number;
  power?: number;
  speed?: number;
  distance?: number;
};

export type KRDEvent = {
  timestamp: string;
  eventType: "start" | "stop" | "pause" | "resume" | "lap" | "marker" | "timer";
  eventGroup?: number;
  data?: number;
};
```

#### Workout Schema Definitions

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

// Infer types from schemas
export type WorkoutStep = z.infer<typeof workoutStepSchema>;
export type RepetitionBlock = z.infer<typeof repetitionBlockSchema>;
export type Workout = z.infer<typeof workoutSchema>;
```

#### Legacy Workout Models (TO BE MIGRATED)

```typescript
// OLD APPROACH - domain/types/workout.ts (TO BE REMOVED)
export type WorkoutStep = {
  stepIndex: number;
  durationType: DurationType;
  duration: Duration;
  targetType: TargetType;
  target: Target;
};

export type RepetitionBlock = {
  repeatCount: number;
  steps: Array<WorkoutStep>;
};

export type Workout = {
  name?: string;
  sport: string;
  steps: Array<WorkoutStep | RepetitionBlock>;
};
```

#### Duration Schema Definitions

```typescript
// domain/schemas/duration.ts
import { z } from "zod";

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

// Infer type from schema
export type Duration = z.infer<typeof durationSchema>;

// NO separate enum - use discriminated union
```

#### Legacy Duration Types (TO BE MIGRATED)

```typescript
// OLD APPROACH - domain/types/duration.ts (TO BE REMOVED)
export enum DurationType {
  Time = "time",
  Distance = "distance",
  Open = "open",
}

export type Duration =
  | { type: DurationType.Time; seconds: number }
  | { type: DurationType.Distance; meters: number }
  | { type: DurationType.Open };
```

#### Target Schema Definitions

```typescript
// domain/schemas/target.ts
import { z } from "zod";

const powerValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal("watts"), value: z.number() }),
  z.object({ unit: z.literal("percent_ftp"), value: z.number() }),
  z.object({ unit: z.literal("zone"), value: z.number().int().min(1).max(7) }),
  z.object({ unit: z.literal("range"), min: z.number(), max: z.number() }),
]);

const heartRateValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal("bpm"), value: z.number() }),
  z.object({ unit: z.literal("zone"), value: z.number().int().min(1).max(5) }),
  z.object({ unit: z.literal("percent_max"), value: z.number() }),
  z.object({ unit: z.literal("range"), min: z.number(), max: z.number() }),
]);

const cadenceValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal("rpm"), value: z.number() }),
  z.object({ unit: z.literal("range"), min: z.number(), max: z.number() }),
]);

const paceValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal("mps"), value: z.number() }), // meters per second
  z.object({ unit: z.literal("zone"), value: z.number().int().min(1).max(5) }),
  z.object({ unit: z.literal("range"), min: z.number(), max: z.number() }),
]);

export const targetSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("power"),
    value: powerValueSchema,
  }),
  z.object({
    type: z.literal("heart_rate"),
    value: heartRateValueSchema,
  }),
  z.object({
    type: z.literal("cadence"),
    value: cadenceValueSchema,
  }),
  z.object({
    type: z.literal("pace"),
    value: paceValueSchema,
  }),
  z.object({ type: z.literal("open") }),
]);

// Infer types from schemas
export type Target = z.infer<typeof targetSchema>;
export type PowerValue = z.infer<typeof powerValueSchema>;
export type HeartRateValue = z.infer<typeof heartRateValueSchema>;
export type CadenceValue = z.infer<typeof cadenceValueSchema>;
export type PaceValue = z.infer<typeof paceValueSchema>;

// NO separate enums - use discriminated unions
```

#### Legacy Target Types (TO BE MIGRATED)

```typescript
// OLD APPROACH - domain/types/target.ts (TO BE REMOVED)
export enum TargetType {
  Power = "power",
  HeartRate = "heart_rate",
  Cadence = "cadence",
  Pace = "pace",
  Open = "open",
}

export type Target =
  | PowerTarget
  | HeartRateTarget
  | CadenceTarget
  | PaceTarget
  | { type: TargetType.Open };

export type PowerTarget = {
  type: TargetType.Power;
  value: PowerValue;
};

export type PowerValue =
  | { unit: "watts"; value: number }
  | { unit: "percent_ftp"; value: number }
  | { unit: "zone"; value: number }
  | { unit: "range"; min: number; max: number };

export type HeartRateTarget = {
  type: TargetType.HeartRate;
  value: HeartRateValue;
};

export type HeartRateValue =
  | { unit: "bpm"; value: number }
  | { unit: "zone"; value: number }
  | { unit: "percent_max"; value: number }
  | { unit: "range"; min: number; max: number };

export type CadenceTarget = {
  type: TargetType.Cadence;
  value: CadenceValue;
};

export type CadenceValue =
  | { unit: "rpm"; value: number }
  | { unit: "range"; min: number; max: number };

export type PaceTarget = {
  type: TargetType.Pace;
  value: PaceValue;
};

export type PaceValue =
  | { unit: "mps"; value: number } // meters per second
  | { unit: "zone"; value: number }
  | { unit: "range"; min: number; max: number };
```

#### Error Types

```typescript
// domain/types/errors.ts
export type FitParsingError = {
  name: "FitParsingError";
  message: string;
  cause?: unknown;
};

export const createFitParsingError = (
  message: string,
  cause?: unknown
): FitParsingError => ({
  name: "FitParsingError",
  message,
  cause,
});

export type KrdValidationError = {
  name: "KrdValidationError";
  message: string;
  errors: Array<ValidationError>;
};

export const createKrdValidationError = (
  message: string,
  errors: Array<ValidationError>
): KrdValidationError => ({
  name: "KrdValidationError",
  message,
  errors,
});

export type ToleranceExceededError = {
  name: "ToleranceExceededError";
  message: string;
  violations: Array<ToleranceViolation>;
};

export const createToleranceExceededError = (
  message: string,
  violations: Array<ToleranceViolation>
): ToleranceExceededError => ({
  name: "ToleranceExceededError",
  message,
  violations,
});
```

#### Schema Validator

```typescript
// domain/validation/schema-validator.ts
import { z } from "zod";
import type { Logger } from "../../ports/logger";

export type ValidationError = {
  field: string;
  message: string;
  expected?: unknown;
  actual?: unknown;
};

export type SchemaValidator = {
  validate: (krd: unknown) => Array<ValidationError>;
};

// Zod schema for KRD with type inference
const krdSchema = z.object({
  version: z.string().regex(/^\d+\.\d+$/),
  type: z.enum(["workout", "activity", "course"]),
  metadata: z.object({
    created: z.string().datetime(),
    manufacturer: z.string().optional(),
    product: z.string().optional(),
    serialNumber: z.string().optional(),
    sport: z.string(),
    subSport: z.string().optional(),
  }),
  sessions: z
    .array(
      z.object({
        startTime: z.string().datetime(),
        totalElapsedTime: z.number().min(0),
        totalTimerTime: z.number().min(0).optional(),
        totalDistance: z.number().min(0).optional(),
        sport: z.string(),
        subSport: z.string().optional(),
        avgHeartRate: z.number().int().min(0).max(300).optional(),
        maxHeartRate: z.number().int().min(0).max(300).optional(),
        avgCadence: z.number().min(0).optional(),
        avgPower: z.number().min(0).optional(),
        totalCalories: z.number().int().min(0).optional(),
      })
    )
    .optional(),
  laps: z
    .array(
      z.object({
        startTime: z.string().datetime(),
        totalElapsedTime: z.number().min(0),
        totalDistance: z.number().min(0).optional(),
        avgHeartRate: z.number().int().min(0).max(300).optional(),
        maxHeartRate: z.number().int().min(0).max(300).optional(),
        avgCadence: z.number().min(0).optional(),
        avgPower: z.number().min(0).optional(),
      })
    )
    .optional(),
  records: z
    .array(
      z.object({
        timestamp: z.string().datetime(),
        position: z
          .object({
            lat: z.number().min(-90).max(90),
            lon: z.number().min(-180).max(180),
          })
          .optional(),
        altitude: z.number().optional(),
        heartRate: z.number().int().min(0).max(300).optional(),
        cadence: z.number().min(0).optional(),
        power: z.number().min(0).optional(),
        speed: z.number().min(0).optional(),
        distance: z.number().min(0).optional(),
      })
    )
    .optional(),
  events: z
    .array(
      z.object({
        timestamp: z.string().datetime(),
        eventType: z.enum([
          "start",
          "stop",
          "pause",
          "resume",
          "lap",
          "marker",
          "timer",
        ]),
        eventGroup: z.number().int().optional(),
        data: z.number().int().optional(),
      })
    )
    .optional(),
  extensions: z.record(z.unknown()).optional(),
});

// Export the schema for JSON Schema generation
export { krdSchema };

export const createSchemaValidator = (logger: Logger): SchemaValidator => ({
  validate: (krd: unknown): Array<ValidationError> => {
    logger.debug("Validating KRD against schema");

    const result = krdSchema.safeParse(krd);

    if (result.success) {
      logger.debug("KRD validation successful");
      return [];
    }

    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join(".") || "root",
      message: issue.message,
      expected: issue.code,
      actual: undefined,
    }));

    logger.warn("KRD validation failed", { errorCount: errors.length });
    return errors;
    },
  };
};
```

#### Tolerance Checker

```typescript
// domain/validation/tolerance-checker.ts
export type ToleranceConfig = {
  timeTolerance: number; // ±1 second
  distanceTolerance: number; // ±1 meter
  powerTolerance: number; // ±1 watt
  ftpTolerance: number; // ±1% FTP
  hrTolerance: number; // ±1 bpm
  cadenceTolerance: number; // ±1 rpm
  paceTolerance: number; // ±0.01 m/s
};

export const DEFAULT_TOLERANCES: ToleranceConfig = {
  timeTolerance: 1,
  distanceTolerance: 1,
  powerTolerance: 1,
  ftpTolerance: 1,
  hrTolerance: 1,
  cadenceTolerance: 1,
  paceTolerance: 0.01,
};

export type ToleranceViolation = {
  field: string;
  expected: number;
  actual: number;
  deviation: number;
  tolerance: number;
};

export type ToleranceChecker = {
  checkTime: (expected: number, actual: number) => ToleranceViolation | null;
  checkDistance: (
    expected: number,
    actual: number
  ) => ToleranceViolation | null;
  checkPower: (expected: number, actual: number) => ToleranceViolation | null;
  checkHeartRate: (
    expected: number,
    actual: number
  ) => ToleranceViolation | null;
  checkCadence: (expected: number, actual: number) => ToleranceViolation | null;
  checkPace: (expected: number, actual: number) => ToleranceViolation | null;
};

const check = (
  field: string,
  expected: number,
  actual: number,
  tolerance: number
): ToleranceViolation | null => {
  const deviation = Math.abs(expected - actual);
  return deviation > tolerance
    ? { field, expected, actual, deviation, tolerance }
    : null;
};

export const createToleranceChecker = (
  config: ToleranceConfig = DEFAULT_TOLERANCES
): ToleranceChecker => ({
  checkTime: (expected, actual) =>
    check("time", expected, actual, config.timeTolerance),
  checkDistance: (expected, actual) =>
    check("distance", expected, actual, config.distanceTolerance),
  checkPower: (expected, actual) =>
    check("power", expected, actual, config.powerTolerance),
  checkHeartRate: (expected, actual) =>
    check("heartRate", expected, actual, config.hrTolerance),
  checkCadence: (expected, actual) =>
    check("cadence", expected, actual, config.cadenceTolerance),
  checkPace: (expected, actual) =>
    check("pace", expected, actual, config.paceTolerance),
});
```

### Ports Layer

#### Logger Contract

```typescript
// ports/logger.ts
export type LogLevel = "debug" | "info" | "warn" | "error";

export type Logger = {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
};
```

#### FIT Reader Contract

```typescript
// ports/fit-reader.ts
import type { KRD } from "../domain/types/krd";

export type FitReader = {
  readToKRD: (buffer: Uint8Array) => Promise<KRD>;
};
```

#### FIT Writer Contract

```typescript
// ports/fit-writer.ts
import type { KRD } from "../domain/types/krd";

export type FitWriter = {
  writeFromKRD: (krd: KRD) => Promise<Uint8Array>;
};
```

#### KRD Validator Contract

```typescript
// ports/krd-validator.ts
import type { ValidationError } from "../domain/validation/schema-validator";

export type KrdValidator = {
  validate: (krd: unknown) => Array<ValidationError>;
};
```

### Adapters Layer

#### Console Logger

```typescript
// adapters/logger/console-logger.ts
import type { Logger } from "../../ports/logger";

export const createConsoleLogger = (): Logger => ({
  debug: (message, context) => console.debug(message, context),
  info: (message, context) => console.info(message, context),
  warn: (message, context) => console.warn(message, context),
  error: (message, context) => console.error(message, context),
});
```

#### Garmin FIT SDK Adapter

```typescript
// adapters/fit/garmin-fitsdk.ts
import { Decoder, Encoder, Stream } from "@garmin/fitsdk";
import type { FitReader } from "../../ports/fit-reader";
import type { FitWriter } from "../../ports/fit-writer";
import type { KRD } from "../../domain/types/krd";
import type { Logger } from "../../ports/logger";
import { createFitParsingError } from "../../domain/types/errors";

export const createGarminFitSdkReader = (logger: Logger): FitReader => ({
  readToKRD: async (buffer: Uint8Array): Promise<KRD> => {
    try {
      logger.debug("Parsing FIT file", { bufferSize: buffer.length });

      const stream = Stream.fromByteArray(Array.from(buffer));
      const decoder = new Decoder(stream);
      const { messages, errors } = decoder.read();

      if (errors.length > 0) {
        logger.error("FIT parsing errors detected", { errors });
        throw createFitParsingError(`FIT parsing errors: ${errors.join(", ")}`);
      }

      logger.info("FIT file parsed successfully");
      return convertMessagesToKRD(messages, logger);
    } catch (error) {
      logger.error("Failed to parse FIT file", { error });
      throw createFitParsingError("Failed to parse FIT file", error);
    }
  },
});

export const createGarminFitSdkWriter = (logger: Logger): FitWriter => ({
  writeFromKRD: async (krd: KRD): Promise<Uint8Array> => {
    try {
      logger.debug("Encoding KRD to FIT");

      const encoder = new Encoder();
      const messages = convertKRDToMessages(krd, logger);

      for (const message of messages) {
        encoder.write(message);
      }

      const buffer = encoder.finish();
      logger.info("KRD encoded to FIT successfully");
      return new Uint8Array(buffer);
    } catch (error) {
      logger.error("Failed to write FIT file", { error });
      throw createFitParsingError("Failed to write FIT file", error);
    }
  },
});

const convertMessagesToKRD = (
  messages: Record<string, unknown>,
  logger: Logger
): KRD => {
  // Implementation: map FIT messages to KRD structure
  // Extract workout messages, steps, repetitions, targets, durations
  // Handle all target types: power, HR, cadence, pace
  // Handle all duration types: time, distance
  // Preserve extensions in extensions.fit
  logger.debug("Converting FIT messages to KRD");
  throw new Error("Not implemented");
};

const convertKRDToMessages = (krd: KRD, logger: Logger): Array<unknown> => {
  // Implementation: map KRD structure to FIT messages
  // Create workout messages with steps, repetitions
  // Encode all target types: power, HR, cadence, pace
  // Encode all duration types: time, distance
  // Restore extensions from extensions.fit
  logger.debug("Converting KRD to FIT messages");
  throw new Error("Not implemented");
};
```

### Application Layer

#### Convert FIT to KRD Use Case

```typescript
// application/use-cases/convert-fit-to-krd.ts
import type { FitReader } from "../../ports/fit-reader";
import type { KrdValidator } from "../../ports/krd-validator";
import type { KRD } from "../../domain/types/krd";
import type { Logger } from "../../ports/logger";
import { createKrdValidationError } from "../../domain/types/errors";

export type ConvertFitToKrd = {
  execute: (fitBuffer: Uint8Array) => Promise<KRD>;
};

export const createConvertFitToKrd = (
  fitReader: FitReader,
  validator: KrdValidator,
  logger: Logger
): ConvertFitToKrd => ({
  execute: async (fitBuffer: Uint8Array): Promise<KRD> => {
    logger.info("Converting FIT to KRD");

    // Read FIT file
    const krd = await fitReader.readToKRD(fitBuffer);

    // Validate against schema
    const errors = validator.validate(krd);
    if (errors.length > 0) {
      throw createKrdValidationError(
        `KRD validation failed: ${errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(", ")}`,
        errors
      );
    }

    logger.info("FIT to KRD conversion successful");
    return krd;
  },
});
```

#### Convert KRD to FIT Use Case

```typescript
// application/use-cases/convert-krd-to-fit.ts
import type { FitWriter } from "../../ports/fit-writer";
import type { KrdValidator } from "../../ports/krd-validator";
import type { KRD } from "../../domain/types/krd";
import type { Logger } from "../../ports/logger";
import { createKrdValidationError } from "../../domain/types/errors";

export type ConvertKrdToFit = {
  execute: (krd: KRD) => Promise<Uint8Array>;
};

export const createConvertKrdToFit = (
  fitWriter: FitWriter,
  validator: KrdValidator,
  logger: Logger
): ConvertKrdToFit => ({
  execute: async (krd: KRD): Promise<Uint8Array> => {
    logger.info("Converting KRD to FIT");

    // Validate KRD before conversion
    const errors = validator.validate(krd);
    if (errors.length > 0) {
      throw createKrdValidationError(
        `KRD validation failed: ${errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(", ")}`,
        errors
      );
    }

    // Write to FIT
    const fitBuffer = await fitWriter.writeFromKRD(krd);

    logger.info("KRD to FIT conversion successful");
    return fitBuffer;
  },
});
```

#### Round-Trip Validation Use Case

```typescript
// application/use-cases/validate-round-trip.ts
import type { FitReader } from "../../ports/fit-reader";
import type { FitWriter } from "../../ports/fit-writer";
import type {
  ToleranceChecker,
  ToleranceViolation,
} from "../../domain/validation/tolerance-checker";
import type { KRD } from "../../domain/types/krd";
import type { Logger } from "../../ports/logger";

export type ValidateRoundTrip = {
  validateFitToKrdToFit: (
    originalFit: Uint8Array
  ) => Promise<Array<ToleranceViolation>>;
  validateKrdToFitToKrd: (
    originalKrd: KRD
  ) => Promise<Array<ToleranceViolation>>;
};

export const createValidateRoundTrip = (
  fitReader: FitReader,
  fitWriter: FitWriter,
  toleranceChecker: ToleranceChecker,
  logger: Logger
): ValidateRoundTrip => ({
  validateFitToKrdToFit: async (
    originalFit: Uint8Array
  ): Promise<Array<ToleranceViolation>> => {
    logger.info("Validating FIT → KRD → FIT round-trip");

    // FIT → KRD
    const krd = await fitReader.readToKRD(originalFit);

    // KRD → FIT
    const convertedFit = await fitWriter.writeFromKRD(krd);

    // FIT → KRD (second pass)
    const krd2 = await fitReader.readToKRD(convertedFit);

    // Compare KRD documents
    const violations = compareKRDs(krd, krd2, toleranceChecker, logger);

    if (violations.length === 0) {
      logger.info("FIT → KRD → FIT round-trip validation passed");
    } else {
      logger.warn("FIT → KRD → FIT round-trip validation failed", {
        violationCount: violations.length,
      });
    }

    return violations;
  },

  validateKrdToFitToKrd: async (
    originalKrd: KRD
  ): Promise<Array<ToleranceViolation>> => {
    logger.info("Validating KRD → FIT → KRD round-trip");

    // KRD → FIT
    const fit = await fitWriter.writeFromKRD(originalKrd);

    // FIT → KRD
    const convertedKrd = await fitReader.readToKRD(fit);

    // KRD → FIT (second pass)
    const fit2 = await fitWriter.writeFromKRD(convertedKrd);

    // FIT → KRD (third pass)
    const krd2 = await fitReader.readToKRD(fit2);

    // Compare KRD documents
    const violations = compareKRDs(originalKrd, krd2, toleranceChecker, logger);

    if (violations.length === 0) {
      logger.info("KRD → FIT → KRD round-trip validation passed");
    } else {
      logger.warn("KRD → FIT → KRD round-trip validation failed", {
        violationCount: violations.length,
      });
    }

    return violations;
  },
});

const compareKRDs = (
  krd1: KRD,
  krd2: KRD,
  toleranceChecker: ToleranceChecker,
  logger: Logger
): Array<ToleranceViolation> => {
  logger.debug("Comparing KRD documents");
  const violations: Array<ToleranceViolation> = [];

  // Compare workout steps, durations, targets
  // Check all numeric values against tolerances
  // Report any deviations exceeding tolerances

  return violations;
};
```

#### Dependency Injection Provider

```typescript
// application/providers.ts
import {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "../adapters/fit/garmin-fitsdk";
import { createConsoleLogger } from "../adapters/logger/console-logger";
import { createSchemaValidator } from "../domain/validation/schema-validator";
import {
  createToleranceChecker,
  DEFAULT_TOLERANCES,
} from "../domain/validation/tolerance-checker";
import { createConvertFitToKrd } from "./use-cases/convert-fit-to-krd";
import { createConvertKrdToFit } from "./use-cases/convert-krd-to-fit";
import { createValidateRoundTrip } from "./use-cases/validate-round-trip";
import type { Logger } from "../ports/logger";

export type Providers = {
  fitReader: FitReader;
  fitWriter: FitWriter;
  schemaValidator: SchemaValidator;
  toleranceChecker: ToleranceChecker;
  convertFitToKrd: ConvertFitToKrd;
  convertKrdToFit: ConvertKrdToFit;
  validateRoundTrip: ValidateRoundTrip;
  logger: Logger;
};

/**
 * Default provider configuration
 * This is the SINGLE SWAP POINT for changing implementations
 */
export const createDefaultProviders = (logger?: Logger): Providers => {
  // Logger (injectable, defaults to console)
  const log = logger || createConsoleLogger();

  // Adapters
  const fitReader = createGarminFitSdkReader(log);
  const fitWriter = createGarminFitSdkWriter(log);

  // Validators
  const schemaValidator = createSchemaValidator(log);
  const toleranceChecker = createToleranceChecker(DEFAULT_TOLERANCES);

  // Use cases
  const convertFitToKrd = createConvertFitToKrd(
    fitReader,
    schemaValidator,
    log
  );
  const convertKrdToFit = createConvertKrdToFit(
    fitWriter,
    schemaValidator,
    log
  );
  const validateRoundTrip = createValidateRoundTrip(
    fitReader,
    fitWriter,
    toleranceChecker,
    log
  );

  return {
    fitReader,
    fitWriter,
    schemaValidator,
    toleranceChecker,
    convertFitToKrd,
    convertKrdToFit,
    validateRoundTrip,
    logger: log,
  };
};
```

## Data Models

### FIT Message Mapping

The adapter layer maps between FIT SDK messages and KRD structures:

#### Workout Messages

- `workout` message → KRD metadata
- `workout_step` messages → KRD workout steps
- `workout_step` with `repeat` → KRD repetition blocks

#### Duration Mapping

| FIT Duration Type | KRD Duration                           |
| ----------------- | -------------------------------------- |
| `time`            | `{ type: 'time', seconds: number }`    |
| `distance`        | `{ type: 'distance', meters: number }` |
| `open`            | `{ type: 'open' }`                     |

#### Target Mapping

| FIT Target Type    | KRD Target                                                         |
| ------------------ | ------------------------------------------------------------------ |
| `power` (watts)    | `{ type: 'power', value: { unit: 'watts', value: number } }`       |
| `power` (%FTP)     | `{ type: 'power', value: { unit: 'percent_ftp', value: number } }` |
| `power_zone`       | `{ type: 'power', value: { unit: 'zone', value: number } }`        |
| `heart_rate` (bpm) | `{ type: 'heart_rate', value: { unit: 'bpm', value: number } }`    |
| `hr_zone`          | `{ type: 'heart_rate', value: { unit: 'zone', value: number } }`   |
| `cadence` (rpm)    | `{ type: 'cadence', value: { unit: 'rpm', value: number } }`       |
| `speed` (m/s)      | `{ type: 'pace', value: { unit: 'mps', value: number } }`          |

### Unit Conversions

All conversions maintain KRD standard units:

- Time: seconds (no conversion needed)
- Distance: meters (no conversion needed)
- Power: watts (no conversion needed)
- Heart Rate: bpm (no conversion needed)
- Cadence: rpm (running cadence in spm/2)
- Pace: m/s (no conversion needed)

## Testing Strategy

### Test Structure

```
packages/core/
└── tests/
    ├── fixtures/
    │   ├── WorkoutCustomTargetValues.fit
    │   ├── WorkoutIndividualSteps.fit
    │   ├── WorkoutRepeatGreaterThanStep.fit
    │   └── WorkoutRepeatSteps.fit
    ├── unit/
    │   ├── domain/
    │   │   ├── schema-validator.test.ts
    │   │   └── tolerance-checker.test.ts
    │   └── adapters/
    │       └── garmin-fitsdk.test.ts
    ├── integration/
    │   ├── fit-to-krd.test.ts
    │   └── krd-to-fit.test.ts
    └── round-trip/
        ├── fit-krd-fit.test.ts
        └── krd-fit-krd.test.ts
```

### Unit Tests

- **Schema Validator**: Test validation against workout.json schema
- **Tolerance Checker**: Test all tolerance checks with edge cases
- **Adapters**: Test FIT message parsing and encoding

### Integration Tests

- **FIT → KRD**: Test conversion with all fixture files
- **KRD → FIT**: Test conversion with generated KRD documents
- **Golden Files**: Compare KRD output against snapshots

### Round-Trip Tests

- **FIT → KRD → FIT**: Validate with all 4 fixture files
- **KRD → FIT → KRD**: Validate with generated KRD documents
- **Tolerance Validation**: Verify all values within tolerances

### Test Coverage Requirements

- Overall coverage: ≥ 80%
- Mappers/converters: ≥ 90%
- Domain logic: 100%

## Implementation Notes

### TypeScript Configuration

- Strict mode enabled
- No implicit `any`
- Explicit return types on public APIs
- Path aliases for clean imports
- Use `type` over `interface` for type definitions
- Use functions over classes for implementation

### Dependencies

- `@garmin/fitsdk`: FIT file parsing and encoding
- `zod`: Schema validation with TypeScript type inference
- `zod-to-json-schema`: Generate JSON Schema from Zod schemas
- `vitest`: Testing framework

### Performance Considerations

- Stream-based FIT parsing for large files
- Lazy validation (only when needed)
- Efficient buffer handling (Uint8Array)
- Minimal object allocations in hot paths

### JSON Schema Generation

The JSON Schema file (`packages/core/schema/workout.json`) is automatically generated from the Zod schema to ensure consistency:

```typescript
// scripts/generate-schema.ts
import { zodToJsonSchema } from "zod-to-json-schema";
import { krdSchema } from "../domain/validation/schema-validator";
import { writeFileSync } from "fs";
import { join } from "path";

const jsonSchema = zodToJsonSchema(krdSchema, {
  name: "KRD Workout Schema",
  $refStrategy: "none",
});

const schemaPath = join(__dirname, "../schema/workout.json");
writeFileSync(schemaPath, JSON.stringify(jsonSchema, null, 2));

console.log("✓ Generated workout.json from Zod schema");
```

**Build Integration:**

```json
// package.json
{
  "scripts": {
    "generate:schema": "tsx scripts/generate-schema.ts",
    "prebuild": "pnpm generate:schema",
    "build": "tsup"
  }
}
```

This ensures:

- **Single source of truth**: Zod schema in TypeScript
- **Automatic generation**: JSON Schema generated before every build
- **Consistency**: No manual sync needed between Zod and JSON Schema
- **Portability**: JSON Schema available for external tools and documentation

### Extensibility

- Port-based architecture allows swapping FIT SDK
- Extensions object preserves unknown data
- Tolerance configuration allows customization
- Schema versioning supports evolution
- Logger injection allows custom logging implementations
- Zod schema is source of truth, JSON Schema auto-generated

## Summary

This design provides a complete, functional-style implementation of bidirectional FIT ↔ KRD conversion following hexagonal architecture principles. All code uses `type` instead of `interface`, factory functions instead of classes, and dependency injection for all external dependencies including logging. Errors bubble up to the application boundary where they are handled appropriately.
