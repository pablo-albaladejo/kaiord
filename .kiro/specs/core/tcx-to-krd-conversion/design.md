# Design Document: TCX ↔ KRD Bidirectional Conversion

## Overview

This design implements bidirectional conversion between Training Center XML (TCX) workout files and KRD (Kaiord Representation Definition) format. The system follows hexagonal architecture with clear separation between domain logic, application use cases, ports (contracts), and adapters (implementations).

### Key Design Goals

1. **Round-trip safety**: TCX → KRD → TCX and KRD → TCX → KRD preserve data within tolerances
2. **Hexagonal architecture**: Domain logic isolated from external dependencies
3. **Dependency injection**: Swappable XML parser implementations via ports
4. **Schema validation**: All KRD output validated against JSON schema
5. **Type safety**: Strict TypeScript with no implicit `any`
6. **Testability**: Golden file tests and round-trip validation with fixtures

### Code Style Preferences

This implementation follows the guidelines defined in `.kiro/steering/`:

**Code Style** (`.kiro/steering/code-style.md`):

1. **Use `type` instead of `interface`** for all type definitions
2. **Use functions instead of classes** for implementation (functional programming style)
3. **Factory functions** (e.g., `createTcxReader()`) instead of constructors
4. **Pure functions** where possible, avoiding mutable state
5. **Composition over inheritance**
6. **Separate type imports** using `import type` syntax
7. **Avoid barrel imports** - import directly from source files
8. **Minimal comments** - only for complex logic or non-obvious decisions
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
│   ├── schemas/                # Zod schemas (shared with FIT)
│   │   ├── krd.ts
│   │   ├── workout.ts
│   │   ├── duration.ts
│   │   ├── target.ts
│   │   ├── sport.ts
│   │   └── intensity.ts
│   ├── types/
│   │   └── errors.ts           # Error types (add TcxParsingError)
│   └── validation/
│       ├── schema-validator.ts # JSON schema validation (reuse)
│       └── tolerance-checker.ts # Round-trip tolerance validation (reuse)
├── application/
│   ├── use-cases/
│   │   ├── convert-tcx-to-krd.ts    # TCX → KRD use case
│   │   ├── convert-krd-to-tcx.ts    # KRD → TCX use case
│   │   └── validate-round-trip.ts   # Round-trip validation (reuse)
│   └── providers.ts            # DI wiring (update to include TCX)
├── ports/
│   ├── tcx-reader.ts           # TCX reading contract
│   ├── tcx-writer.ts           # TCX writing contract
│   └── logger.ts               # Logger contract (reuse)
└── adapters/
    ├── tcx/
    │   ├── fast-xml-parser.ts  # fast-xml-parser implementation
    │   ├── schemas/            # TCX-specific Zod schemas
    │   │   ├── tcx-sport.ts
    │   │   ├── tcx-duration.ts
    │   │   └── tcx-target.ts
    │   ├── duration/
    │   │   ├── duration.mapper.ts
    │   │   └── duration.converter.ts
    │   ├── target/
    │   │   ├── target.mapper.ts
    │   │   └── target.converter.ts
    │   └── workout/
    │       └── workout.mapper.ts
    └── logger/
        └── console-logger.ts   # Console logger (reuse)
```

### Dependency Flow

```
CLI → Application (use-cases) → Ports (contracts) → Adapters (implementations)
                ↓
            Domain (pure logic)
```

## Components and Interfaces

### Domain Layer (Reused from FIT)

The domain layer schemas are shared between FIT and TCX conversions:

- `krdSchema` - KRD document structure
- `workoutSchema` - Workout structure with steps and repetitions
- `durationSchema` - Duration specifications (time, distance, open)
- `targetSchema` - Target specifications (power, heart_rate, cadence, pace, open)
- `sportSchema` - Sport enumeration
- `intensitySchema` - Intensity enumeration

See FIT spec design document for complete schema definitions.

### Error Types (Extended)

```typescript
// domain/types/errors.ts (add to existing)
export type TcxParsingError = {
  name: "TcxParsingError";
  message: string;
  cause?: unknown;
};

export const createTcxParsingError = (
  message: string,
  cause?: unknown
): TcxParsingError => ({
  name: "TcxParsingError",
  message,
  cause,
});
```

### Ports Layer

#### TCX Reader Contract

```typescript
// ports/tcx-reader.ts
import type { KRD } from "../domain/schemas/krd";

export type TcxReader = (xmlString: string) => Promise<KRD>;
```

#### TCX Writer Contract

```typescript
// ports/tcx-writer.ts
import type { KRD } from "../domain/schemas/krd";

export type TcxWriter = (krd: KRD) => Promise<string>;
```

### Adapters Layer

#### TCX Adapter Schemas

TCX-specific schemas for mapping TCX format to KRD:

```typescript
// adapters/tcx/schemas/tcx-sport.ts
import { z } from "zod";

export const tcxSportSchema = z.enum(["Running", "Biking", "Other"]);

export type TcxSport = z.infer<typeof tcxSportSchema>;

// Mapping to KRD sport
export const TCX_TO_KRD_SPORT: Record<TcxSport, string> = {
  Running: "running",
  Biking: "cycling",
  Other: "generic",
};
```

```typescript
// adapters/tcx/schemas/tcx-duration.ts
import { z } from "zod";

export const tcxDurationTypeSchema = z.enum([
  "Time",
  "Distance",
  "LapButton",
  "HeartRateAbove",
  "HeartRateBelow",
  "CaloriesBurned",
]);

export type TcxDurationType = z.infer<typeof tcxDurationTypeSchema>;
```

```typescript
// adapters/tcx/schemas/tcx-target.ts
import { z } from "zod";

export const tcxTargetTypeSchema = z.enum([
  "HeartRate",
  "Speed",
  "Cadence",
  "None",
]);

export type TcxTargetType = z.infer<typeof tcxTargetTypeSchema>;
```

#### Fast XML Parser Adapter

```typescript
// adapters/tcx/fast-xml-parser.ts
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import type { TcxReader } from "../../ports/tcx-reader";
import type { TcxWriter } from "../../ports/tcx-writer";
import type { KRD } from "../../domain/schemas/krd";
import type { Logger } from "../../ports/logger";
import { createTcxParsingError } from "../../domain/types/errors";

export const createFastXmlTcxReader =
  (logger: Logger): TcxReader =>
  async (xmlString: string): Promise<KRD> => {
    try {
      logger.debug("Parsing TCX file", { xmlLength: xmlString.length });

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseAttributeValue: true,
      });

      const tcxData = parser.parse(xmlString);

      if (!tcxData.TrainingCenterDatabase) {
        throw createTcxParsingError(
          "Invalid TCX format: missing TrainingCenterDatabase element"
        );
      }

      logger.info("TCX file parsed successfully");
      return convertTcxToKRD(tcxData, logger);
    } catch (error) {
      logger.error("Failed to parse TCX file", { error });
      throw createTcxParsingError("Failed to parse TCX file", error);
    }
  };

export const createFastXmlTcxWriter =
  (logger: Logger): TcxWriter =>
  async (krd: KRD): Promise<string> => {
    try {
      logger.debug("Encoding KRD to TCX");

      const tcxData = convertKRDToTcx(krd, logger);

      const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        format: true,
        indentBy: "  ",
      });

      const xmlString = builder.build(tcxData);
      logger.info("KRD encoded to TCX successfully");
      return xmlString;
    } catch (error) {
      logger.error("Failed to write TCX file", { error });
      throw createTcxParsingError("Failed to write TCX file", error);
    }
  };

const convertTcxToKRD = (tcxData: unknown, logger: Logger): KRD => {
  // Implementation: map TCX structure to KRD
  // Extract workout elements
  // Convert steps with durations and targets
  // Handle repetition blocks
  // Preserve extensions in extensions.tcx
  logger.debug("Converting TCX to KRD");
  throw new Error("Not implemented");
};

const convertKRDToTcx = (krd: KRD, logger: Logger): unknown => {
  // Implementation: map KRD structure to TCX
  // Create TrainingCenterDatabase structure
  // Encode steps with durations and targets
  // Encode repetition blocks as Repeat elements
  // Restore extensions from extensions.tcx
  logger.debug("Converting KRD to TCX");
  throw new Error("Not implemented");
};
```

### Application Layer

#### Convert TCX to KRD Use Case

```typescript
// application/use-cases/convert-tcx-to-krd.ts
import type { KRD } from "../../domain/schemas/krd";
import { createKrdValidationError } from "../../domain/types/errors";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { TcxReader } from "../../ports/tcx-reader";
import type { Logger } from "../../ports/logger";

type ConvertTcxToKrdParams = {
  tcxString: string;
};

export type ConvertTcxToKrd = ReturnType<typeof convertTcxToKrd>;

export const convertTcxToKrd =
  (tcxReader: TcxReader, validator: SchemaValidator, logger: Logger) =>
  async (params: ConvertTcxToKrdParams): Promise<KRD> => {
    logger.info("Converting TCX to KRD");

    const krd = await tcxReader(params.tcxString);

    const errors = validator.validate(krd);
    if (errors.length > 0) {
      logger.error("KRD validation failed", {
        errorCount: errors.length,
        errors,
      });
      throw createKrdValidationError(
        `KRD validation failed: ${errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(", ")}`,
        errors
      );
    }

    logger.info("TCX to KRD conversion successful");
    return krd;
  };
```

#### Convert KRD to TCX Use Case

```typescript
// application/use-cases/convert-krd-to-tcx.ts
import type { KRD } from "../../domain/schemas/krd";
import { createKrdValidationError } from "../../domain/types/errors";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { TcxWriter } from "../../ports/tcx-writer";
import type { Logger } from "../../ports/logger";

type ConvertKrdToTcxParams = {
  krd: KRD;
};

export type ConvertKrdToTcx = ReturnType<typeof convertKrdToTcx>;

export const convertKrdToTcx =
  (tcxWriter: TcxWriter, validator: SchemaValidator, logger: Logger) =>
  async (params: ConvertKrdToTcxParams): Promise<string> => {
    logger.info("Converting KRD to TCX");

    const errors = validator.validate(params.krd);
    if (errors.length > 0) {
      logger.error("KRD validation failed", {
        errorCount: errors.length,
        errors,
      });
      throw createKrdValidationError(
        `KRD validation failed: ${errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(", ")}`,
        errors
      );
    }

    const tcxString = await tcxWriter(params.krd);

    logger.info("KRD to TCX conversion successful");
    return tcxString;
  };
```

## Data Models

### TCX Workout Structure

```xml
<TrainingCenterDatabase>
  <Workouts>
    <Workout Sport="Running">
      <Name>Sample Workout</Name>
      <Step xsi:type="Step">
        <StepId>1</StepId>
        <Name>Warmup</Name>
        <Duration xsi:type="Time">
          <Seconds>300</Seconds>
        </Duration>
        <Intensity>Active</Intensity>
        <Target xsi:type="HeartRate">
          <HeartRateZone xsi:type="PredefinedHeartRateZone">
            <Number>2</Number>
          </HeartRateZone>
        </Target>
      </Step>
      <Step xsi:type="Repeat">
        <StepId>2</StepId>
        <Repetitions>5</Repetitions>
        <Child xsi:type="Step">
          <StepId>3</StepId>
          <Duration xsi:type="Distance">
            <Meters>400</Meters>
          </Duration>
          <Target xsi:type="Speed">
            <SpeedZone xsi:type="CustomSpeedZone">
              <LowInMetersPerSecond>3.5</LowInMetersPerSecond>
              <HighInMetersPerSecond>4.0</HighInMetersPerSecond>
            </CustomSpeedZone>
          </Target>
        </Child>
      </Step>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>
```

### TCX to KRD Mapping

| TCX Element                     | KRD Field                    | Notes                                                                 |
| ------------------------------- | ---------------------------- | --------------------------------------------------------------------- |
| `Workout/@Sport`                | `metadata.sport`             | Map "Running" → "running", "Biking" → "cycling"                       |
| `Workout/Name`                  | `extensions.workout.name`    | Workout name                                                          |
| `Step/Duration/Time/Seconds`    | `duration.seconds`           | Time-based duration                                                   |
| `Step/Duration/Distance/Meters` | `duration.meters`            | Distance-based duration                                               |
| `Step/Duration/LapButton`       | `duration.type = "open"`     | Manual lap trigger                                                    |
| `Step/Target/HeartRate`         | `target.type = "heart_rate"` | HR target                                                             |
| `Step/Target/Speed`             | `target.type = "pace"`       | Speed target (convert to m/s)                                         |
| `Step/Target/Cadence`           | `target.type = "cadence"`    | Cadence target                                                        |
| `Step/Intensity`                | `intensity`                  | Map "Active" → "active", "Warmup" → "warmup", "Cooldown" → "cooldown" |
| `Repeat/Repetitions`            | `repeatCount`                | Repetition count                                                      |
| `Repeat/Child`                  | `steps`                      | Nested steps                                                          |

## Error Handling

### Error Types

1. **TcxParsingError** - XML parsing failures, invalid TCX structure
2. **KrdValidationError** - KRD schema validation failures (reused)
3. **ToleranceExceededError** - Round-trip tolerance violations (reused)

### Error Flow

```
TCX Adapter → TcxParsingError → Use Case → CLI
                                    ↓
                            KrdValidationError → CLI
```

## Testing Strategy

### Unit Tests

- TCX parser with valid/invalid XML
- Duration mappers (time, distance, lap button)
- Target mappers (heart rate, speed, cadence)
- Sport and intensity mappers
- Repetition block handling

### Integration Tests

- TCX → KRD conversion with sample files
- KRD → TCX conversion with sample files
- Extension preservation

### Round-Trip Tests

- TCX → KRD → TCX with tolerance checking
- KRD → TCX → KRD with tolerance checking
- Mixed duration types
- Mixed target types
- Repetition blocks

### Golden File Tests

- Compare converted KRD against expected JSON
- Validate TCX output against XSD schema

## Dependencies

### External Libraries

- **fast-xml-parser** (^4.3.0) - XML parsing and building
  - Lightweight and fast
  - Supports attributes and namespaces
  - TypeScript support

### Internal Dependencies

- **@kaiord/core domain schemas** - Reuse KRD, Workout, Duration, Target schemas
- **@kaiord/core validation** - Reuse SchemaValidator and ToleranceChecker
- **@kaiord/core logger** - Reuse Logger port and console adapter

## Implementation Notes

### TCX Namespace Handling

TCX files use XML namespaces and xsi:type attributes:

```xml
<TrainingCenterDatabase
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
```

The adapter must handle these namespaces correctly when parsing and building XML.

### Duration Type Mapping

TCX supports more duration types than KRD:

- **Time** → `duration.type = "time"`
- **Distance** → `duration.type = "distance"`
- **LapButton** → `duration.type = "open"`
- **HeartRateAbove/Below** → Store in extensions (not standard KRD)
- **CaloriesBurned** → Store in extensions (not standard KRD)

### Target Type Mapping

TCX target types map to KRD as follows:

- **HeartRate** → `target.type = "heart_rate"`
- **Speed** → `target.type = "pace"` (convert m/s)
- **Cadence** → `target.type = "cadence"`
- **None** → `target.type = "open"`
- **Power** (via extensions) → `target.type = "power"`

### Intensity Mapping

TCX intensity values:

- **Active** → `intensity = "active"`
- **Warmup** → `intensity = "warmup"`
- **Cooldown** → `intensity = "cooldown"`
- **Rest** → `intensity = "rest"`

## Migration Path

This spec can be implemented independently of FIT conversion:

1. Create TCX ports (TcxReader, TcxWriter)
2. Implement fast-xml-parser adapter
3. Create TCX-specific schemas and mappers
4. Implement use cases (reuse validation)
5. Add TCX support to providers.ts
6. Export TCX functions in public API

The domain layer (schemas, validation) is shared with FIT, so no duplication is needed.
