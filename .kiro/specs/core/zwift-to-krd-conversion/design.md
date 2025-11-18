# Design Document: Zwift ↔ KRD Bidirectional Conversion

## Overview

This design implements bidirectional conversion between Zwift workout files (.zwo format) and KRD (Kaiord Representation Definition) format. The system follows hexagonal architecture with clear separation between domain logic, application use cases, ports (contracts), and adapters (implementations).

**Zwift Workout Format**: XML-based format with elements for steady-state intervals, ramps, warmups, cooldowns, free rides, and repeated intervals.

### Key Design Goals

1. **Round-trip safety**: Zwift → KRD → Zwift and KRD → Zwift → KRD preserve data within tolerances
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
3. **Factory functions** (e.g., `createZwiftReader()`) instead of constructors
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
│   ├── schemas/                # Zod schemas (shared with FIT/TCX)
│   │   ├── krd.ts
│   │   ├── workout.ts
│   │   ├── duration.ts
│   │   ├── target.ts
│   │   ├── sport.ts
│   │   └── intensity.ts
│   ├── types/
│   │   └── errors.ts           # Error types (add ZwiftParsingError)
│   └── validation/
│       ├── schema-validator.ts # JSON schema validation (reuse)
│       └── tolerance-checker.ts # Round-trip tolerance validation (reuse)
```

├── application/
│ ├── use-cases/
│ │ ├── convert-zwift-to-krd.ts # Zwift → KRD use case
│ │ ├── convert-krd-to-zwift.ts # KRD → Zwift use case
│ │ └── validate-round-trip.ts # Round-trip validation (reuse)
│ └── providers.ts # DI wiring (update to include Zwift)
├── ports/
│ ├── zwift-reader.ts # Zwift reading contract
│ ├── zwift-writer.ts # Zwift writing contract
│ └── logger.ts # Logger contract (reuse)
└── adapters/
├── zwift/
│ ├── fast-xml-parser.ts # fast-xml-parser implementation
│ ├── xsd-validator.ts # XSD validation
│ ├── schemas/ # Zwift-specific Zod schemas
│ │ ├── zwift-sport.ts
│ │ ├── zwift-interval.ts
│ │ └── zwift-target.ts
│ ├── duration/
│ │ ├── duration.mapper.ts
│ │ └── duration.converter.ts
│ ├── target/
│ │ ├── target.mapper.ts
│ │ └── target.converter.ts
│ ├── interval/
│ │ ├── steady-state.mapper.ts
│ │ ├── ramp.mapper.ts
│ │ ├── intervals-t.mapper.ts
│ │ └── free-ride.mapper.ts
│ └── workout/
│ └── workout.mapper.ts
└── logger/
└── console-logger.ts # Console logger (reuse)

```

### Dependency Flow

```

CLI → Application (use-cases) → Ports (contracts) → Adapters (implementations)
↓
Domain (pure logic)

```

## Components and Interfaces

### Domain Layer (Reused from FIT/TCX)

The domain layer schemas are shared between FIT, TCX, and Zwift conversions:

- `krdSchema` - KRD document structure
- `workoutSchema` - Workout structure with steps and repetitions
- `durationSchema` - Duration specifications (time, distance, open)
- `targetSchema` - Target specifications (power, heart_rate, cadence, pace, open)
- `sportSchema` - Sport enumeration
- `intensitySchema` - Intensity enumeration

See FIT spec design document for complete schema definitions.
```

### Error Types (Extended)

```typescript
// domain/types/errors.ts (add to existing)
export type ZwiftParsingError = {
  name: "ZwiftParsingError";
  message: string;
  cause?: unknown;
};

export const createZwiftParsingError = (
  message: string,
  cause?: unknown
): ZwiftParsingError => ({
  name: "ZwiftParsingError",
  message,
  cause,
});

export type ZwiftValidationError = {
  name: "ZwiftValidationError";
  message: string;
  errors: Array<{ path: string; message: string }>;
};

export const createZwiftValidationError = (
  message: string,
  errors: Array<{ path: string; message: string }>
): ZwiftValidationError => ({
  name: "ZwiftValidationError",
  message,
  errors,
});
```

### Ports Layer

#### Zwift Reader Contract

```typescript
// ports/zwift-reader.ts
import type { KRD } from "../domain/schemas/krd";

export type ZwiftReader = (xmlString: string) => Promise<KRD>;
```

#### Zwift Writer Contract

```typescript
// ports/zwift-writer.ts
import type { KRD } from "../domain/schemas/krd";

export type ZwiftWriter = (krd: KRD) => Promise<string>;
```

#### Zwift Validator Contract

```typescript
// ports/zwift-validator.ts
export type ZwiftValidationResult = {
  valid: boolean;
  errors: Array<{ path: string; message: string }>;
};

export type ZwiftValidator = (
  xmlString: string
) => Promise<ZwiftValidationResult>;
```

### Adapters Layer

#### XSD Validator Adapter

```typescript
// adapters/zwift/xsd-validator.ts
import type {
  ZwiftValidator,
  ZwiftValidationResult,
} from "../../ports/zwift-validator";
import type { Logger } from "../../ports/logger";
import { XMLValidator } from "fast-xml-parser";
import { readFileSync } from "fs";
import { join } from "path";
import { validator } from "xsd-schema-validator";

export const createXsdZwiftValidator =
  (logger: Logger): ZwiftValidator =>
  async (xmlString: string): Promise<ZwiftValidationResult> => {
    try {
      logger.debug("Validating Zwift file against XSD schema");

      // Step 1: Validate XML well-formedness using fast-xml-parser
      const xmlValidation = XMLValidator.validate(xmlString, {
        allowBooleanAttributes: true,
      });

      if (xmlValidation !== true) {
        return {
          valid: false,
          errors: [
            {
              field: "root",
              message: `XML validation failed: ${xmlValidation.err.msg}`,
            },
          ],
        };
      }

      // Step 2: Validate against XSD schema using xsd-schema-validator
      // Note: validateXML expects file path, not file content
      const xsdPath = join(__dirname, "../../../schema/zwift-workout.xsd");
      const xsdValidationResult = await validateXML(xmlString, xsdPath);

      if (!xsdValidationResult.valid) {
        return {
          valid: false,
          errors: xsdValidationResult.messages.map((msg) => ({
            field: "schema",
            message: msg,
          })),
        };
      }

      logger.info("Zwift XML validated successfully against XSD schema");
      return { valid: true, errors: [] };
    } catch (error) {
      logger.error("Zwift validation failed", { error });
      return {
        valid: false,
        errors: [
          {
            field: "root",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      };
    }
  };
```

#### Zwift Adapter Schemas

Zwift-specific schemas for mapping Zwift format to KRD:

```typescript
// adapters/zwift/schemas/zwift-sport.ts
import { z } from "zod";

export const zwiftSportSchema = z.enum(["bike", "run"]);

export type ZwiftSport = z.infer<typeof zwiftSportSchema>;

// Mapping to KRD sport
export const ZWIFT_TO_KRD_SPORT: Record<ZwiftSport, string> = {
  bike: "cycling",
  run: "running",
};
```

```typescript
// adapters/zwift/schemas/zwift-interval.ts
import { z } from "zod";

export const zwiftIntervalTypeSchema = z.enum([
  "SteadyState",
  "Warmup",
  "Ramp",
  "Cooldown",
  "IntervalsT",
  "FreeRide",
]);

export type ZwiftIntervalType = z.infer<typeof zwiftIntervalTypeSchema>;
```

```typescript
// adapters/zwift/schemas/zwift-target.ts
import { z } from "zod";

// Zwift uses FTP percentage for power (0.0 to 2.0+)
export const zwiftPowerTargetSchema = z.number().min(0).max(3);

// Zwift uses seconds per kilometer for pace
export const zwiftPaceTargetSchema = z.number().positive();

// Zwift uses RPM for cadence
export const zwiftCadenceTargetSchema = z.number().int().positive();

export type ZwiftPowerTarget = z.infer<typeof zwiftPowerTargetSchema>;
export type ZwiftPaceTarget = z.infer<typeof zwiftPaceTargetSchema>;
export type ZwiftCadenceTarget = z.infer<typeof zwiftCadenceTargetSchema>;
```

#### Fast XML Parser Adapter

```typescript
// adapters/zwift/fast-xml-parser.ts
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import type { ZwiftReader } from "../../ports/zwift-reader";
import type { ZwiftWriter } from "../../ports/zwift-writer";
import type { ZwiftValidator } from "../../ports/zwift-validator";
import type { KRD } from "../../domain/schemas/krd";
import type { Logger } from "../../ports/logger";
import {
  createZwiftParsingError,
  createZwiftValidationError,
} from "../../domain/types/errors";

export const createFastXmlZwiftReader =
  (logger: Logger, validator: ZwiftValidator): ZwiftReader =>
  async (xmlString: string): Promise<KRD> => {
    try {
      logger.debug("Validating Zwift file against XSD", {
        xmlLength: xmlString.length,
      });

      // Validate against XSD before parsing
      const validationResult = await validator(xmlString);
      if (!validationResult.valid) {
        throw createZwiftValidationError(
          "Zwift file does not conform to XSD schema",
          validationResult.errors
        );
      }

      logger.debug("Parsing Zwift file");

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseAttributeValue: true,
      });

      const zwiftData = parser.parse(xmlString);

      if (!zwiftData.workout_file) {
        throw createZwiftParsingError(
          "Invalid Zwift format: missing workout_file element"
        );
      }

      logger.info("Zwift file parsed successfully");
      return convertZwiftToKRD(zwiftData, logger);
    } catch (error) {
      logger.error("Failed to parse Zwift file", { error });
      if (
        error.name === "ZwiftValidationError" ||
        error.name === "ZwiftParsingError"
      ) {
        throw error;
      }
      throw createZwiftParsingError("Failed to parse Zwift file", error);
    }
  };
```

```typescript
export const createFastXmlZwiftWriter =
  (logger: Logger, validator: ZwiftValidator): ZwiftWriter =>
  async (krd: KRD): Promise<string> => {
    try {
      logger.debug("Encoding KRD to Zwift");

      const zwiftData = convertKRDToZwift(krd, logger);

      const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        format: true,
        indentBy: "  ",
      });

      const xmlString = builder.build(zwiftData);

      logger.debug("Validating generated Zwift file against XSD");

      // Validate generated XML against XSD
      const validationResult = await validator(xmlString);
      if (!validationResult.valid) {
        throw createZwiftValidationError(
          "Generated Zwift file does not conform to XSD schema",
          validationResult.errors
        );
      }

      logger.info("KRD encoded to Zwift successfully");
      return xmlString;
    } catch (error) {
      logger.error("Failed to write Zwift file", { error });
      if (
        error.name === "ZwiftValidationError" ||
        error.name === "ZwiftParsingError"
      ) {
        throw error;
      }
      throw createZwiftParsingError("Failed to write Zwift file", error);
    }
  };

const convertZwiftToKRD = (zwiftData: unknown, logger: Logger): KRD => {
  // Implementation: map Zwift structure to KRD
  // Extract workout elements
  // Convert intervals (SteadyState, Warmup, Ramp, Cooldown, IntervalsT, FreeRide)
  // Handle text events (coaching cues)
  // Preserve extensions in extensions.zwift
  logger.debug("Converting Zwift to KRD");
  throw new Error("Not implemented");
};

const convertKRDToZwift = (krd: KRD, logger: Logger): unknown => {
  // Implementation: map KRD structure to Zwift
  // Create workout_file structure
  // Encode intervals based on target types
  // Encode repetition blocks as IntervalsT elements
  // Restore extensions from extensions.zwift
  logger.debug("Converting KRD to Zwift");
  throw new Error("Not implemented");
};
```

### Application Layer

#### Convert Zwift to KRD Use Case

```typescript
// application/use-cases/convert-zwift-to-krd.ts
import type { KRD } from "../../domain/schemas/krd";
import { createKrdValidationError } from "../../domain/types/errors";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { ZwiftReader } from "../../ports/zwift-reader";
import type { Logger } from "../../ports/logger";

type ConvertZwiftToKrdParams = {
  zwiftString: string;
};

export type ConvertZwiftToKrd = ReturnType<typeof convertZwiftToKrd>;

export const convertZwiftToKrd =
  (zwiftReader: ZwiftReader, validator: SchemaValidator, logger: Logger) =>
  async (params: ConvertZwiftToKrdParams): Promise<KRD> => {
    logger.info("Converting Zwift to KRD");

    const krd = await zwiftReader(params.zwiftString);

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

    logger.info("Zwift to KRD conversion successful");
    return krd;
  };
```

#### Convert KRD to Zwift Use Case

```typescript
// application/use-cases/convert-krd-to-zwift.ts
import type { KRD } from "../../domain/schemas/krd";
import { createKrdValidationError } from "../../domain/types/errors";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { ZwiftWriter } from "../../ports/zwift-writer";
import type { Logger } from "../../ports/logger";

type ConvertKrdToZwiftParams = {
  krd: KRD;
};

export type ConvertKrdToZwift = ReturnType<typeof convertKrdToZwift>;

export const convertKrdToZwift =
  (zwiftWriter: ZwiftWriter, validator: SchemaValidator, logger: Logger) =>
  async (params: ConvertKrdToZwiftParams): Promise<string> => {
    logger.info("Converting KRD to Zwift");

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

    const zwiftString = await zwiftWriter(params.krd);

    logger.info("KRD to Zwift conversion successful");
    return zwiftString;
  };
```

## Data Models

### Zwift Workout Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>John Doe</author>
  <name>FTP Intervals</name>
  <description>8x3min @ 105% FTP with 2min recovery</description>
  <sportType>bike</sportType>
  <tags>
    <tag name="FTP"/>
    <tag name="Intervals"/>
  </tags>
  <workout>
    <Warmup Duration="600" PowerLow="0.5" PowerHigh="0.75" Cadence="90"/>
    <SteadyState Duration="300" Power="1.05" Cadence="95">
      <textevent timeoffset="0" message="Push hard!" duration="5"/>
    </SteadyState>
    <IntervalsT Repeat="8" OnDuration="180" OnPower="1.05"
                OffDuration="120" OffPower="0.55" Cadence="95" CadenceResting="85"/>
    <Cooldown Duration="600" PowerLow="0.75" PowerHigh="0.5" Cadence="85"/>
    <FreeRide Duration="300" Cadence="80"/>
  </workout>
</workout_file>
```

### Zwift to KRD Mapping

| Zwift Element                 | KRD Field                    | Notes                                           |
| ----------------------------- | ---------------------------- | ----------------------------------------------- |
| `workout_file/sportType`      | `metadata.sport`             | Map "bike" → "cycling", "run" → "running"       |
| `workout_file/name`           | `extensions.workout.name`    | Workout name                                    |
| `workout_file/author`         | `metadata.creator`           | Workout author                                  |
| `workout_file/description`    | `extensions.workout.notes`   | Workout description                             |
| `workout_file/tags/tag/@name` | `extensions.zwift.tags`      | Array of tag names                              |
| `SteadyState/@Duration`       | `duration.seconds`           | Time-based duration                             |
| `SteadyState/@Power`          | `target.value.value`         | FTP percentage (convert to percent_ftp)         |
| `Warmup/@PowerLow`            | `target.value.min`           | Range target minimum                            |
| `Warmup/@PowerHigh`           | `target.value.max`           | Range target maximum                            |
| `Ramp/@PowerLow`              | `target.value.min`           | Range target minimum                            |
| `Ramp/@PowerHigh`             | `target.value.max`           | Range target maximum                            |
| `Cooldown/@PowerLow`          | `target.value.min`           | Range target minimum                            |
| `Cooldown/@PowerHigh`         | `target.value.max`           | Range target maximum                            |
| `IntervalsT/@Repeat`          | `repeatCount`                | Repetition count                                |
| `IntervalsT/@OnDuration`      | `steps[0].duration.seconds`  | "On" interval duration                          |
| `IntervalsT/@OnPower`         | `steps[0].target.value`      | "On" interval power                             |
| `IntervalsT/@OffDuration`     | `steps[1].duration.seconds`  | "Off" interval duration                         |
| `IntervalsT/@OffPower`        | `steps[1].target.value`      | "Off" interval power                            |
| `FreeRide/@Duration`          | `duration.seconds`           | Time-based duration                             |
| `FreeRide` (no power)         | `target.type = "open"`       | Open target                                     |
| `@Cadence`                    | `target.type = "cadence"`    | Cadence target (secondary target)               |
| `@pace`                       | `target.type = "pace"`       | Pace target for running (convert sec/km to m/s) |
| `textevent/@message`          | `notes`                      | Coaching cue                                    |
| `textevent/@timeoffset`       | `extensions.zwift.textEvent` | Time offset for text event                      |
| `thresholdSecPerKm`           | `extensions.zwift.threshold` | Running pace threshold                          |
| Warmup (first interval)       | `intensity = "warmup"`       | Set intensity based on position                 |
| Cooldown (last interval)      | `intensity = "cooldown"`     | Set intensity based on position                 |
| Other intervals               | `intensity = "active"`       | Default intensity                               |

## Error Handling

### Error Types

1. **ZwiftParsingError** - XML parsing failures, invalid Zwift structure
2. **ZwiftValidationError** - XSD schema validation failures
3. **KrdValidationError** - KRD schema validation failures (reused)
4. **ToleranceExceededError** - Round-trip tolerance violations (reused)

### Error Flow

```
Zwift Adapter → ZwiftValidationError → Use Case → CLI
            → ZwiftParsingError → Use Case → CLI
                                    ↓
                            KrdValidationError → CLI
```

## Testing Strategy

### Unit Tests

- Zwift parser with valid/invalid XML
- Duration mappers (time, distance)
- Target mappers (power FTP%, pace sec/km, cadence)
- Sport mapper (bike → cycling, run → running)
- Interval type mappers (SteadyState, Warmup, Ramp, Cooldown, IntervalsT, FreeRide)
- Text event extraction

### Integration Tests

- Zwift → KRD conversion with sample files
- KRD → Zwift conversion with sample files
- Extension preservation (tags, thresholdSecPerKm)
- Text event preservation

### Round-Trip Tests

- Zwift → KRD → Zwift with tolerance checking
- KRD → Zwift → KRD with tolerance checking
- Mixed interval types
- IntervalsT (repeated intervals)
- Text events with offsets

### Golden File Tests

- Compare converted KRD against expected JSON
- Validate Zwift output against XSD schema

## Dependencies

### External Libraries

- **fast-xml-parser** (^4.3.0) - XML parsing and building
  - Lightweight and fast
  - Supports attributes
  - TypeScript support
  - Built-in XML validation

### Internal Dependencies

- **@kaiord/core domain schemas** - Reuse KRD, Workout, Duration, Target schemas
- **@kaiord/core validation** - Reuse SchemaValidator and ToleranceChecker
- **@kaiord/core logger** - Reuse Logger port and console adapter

### XSD Schema File

- **zwift-workout.xsd** - Store in `packages/core/schema/`
- Use the XSD schema provided by the user

## Implementation Notes

### Zwift Interval Type Mapping

Zwift has 6 interval types that map to KRD as follows:

1. **SteadyState** → KRD step with constant power target
   - `Power` attribute → `target.value.value` (percent_ftp)
   - `Duration` → `duration.seconds`
   - `Cadence` → secondary target or store in extensions

2. **Warmup** → KRD step with range target and intensity "warmup"
   - `PowerLow` → `target.value.min`
   - `PowerHigh` → `target.value.max`
   - `Duration` → `duration.seconds`
   - `intensity = "warmup"`

3. **Ramp** → KRD step with range target
   - `PowerLow` → `target.value.min`
   - `PowerHigh` → `target.value.max`
   - `Duration` → `duration.seconds`
   - `intensity = "active"`

4. **Cooldown** → KRD step with range target and intensity "cooldown"
   - `PowerLow` → `target.value.min`
   - `PowerHigh` → `target.value.max`
   - `Duration` → `duration.seconds`
   - `intensity = "cooldown"`

5. **IntervalsT** → KRD repetition block with 2 steps
   - `Repeat` → `repeatCount`
   - `OnDuration` + `OnPower` → first step (on interval)
   - `OffDuration` + `OffPower` → second step (off interval)
   - `Cadence` → on interval cadence
   - `CadenceResting` → off interval cadence

6. **FreeRide** → KRD step with open target
   - `Duration` → `duration.seconds`
   - `target.type = "open"`
   - `FlatRoad` → store in extensions

### Power Target Conversion

Zwift uses FTP percentage (0.0 to 2.0+):

- **Zwift Power = 1.0** → 100% FTP
- **Zwift Power = 0.5** → 50% FTP
- **Zwift Power = 1.05** → 105% FTP

KRD representation:

```typescript
{
  type: "power",
  value: {
    unit: "percent_ftp",
    value: 105  // Zwift 1.05 → KRD 105
  }
}
```

### Pace Target Conversion

Zwift uses seconds per kilometer for running:

- **Zwift pace = 240** → 4:00 min/km → 4.17 m/s

KRD representation:

```typescript
{
  type: "pace",
  value: {
    unit: "meters_per_second",
    value: 4.17  // Convert from sec/km
  }
}
```

Conversion formula:

```typescript
const metersPerSecond = 1000 / secondsPerKm;
```

### Text Events

Zwift text events are coaching cues displayed during intervals:

```xml
<textevent timeoffset="30" message="Increase cadence" duration="5"/>
```

Mapping to KRD:

- Store primary message in `step.notes`
- Store all text events with offsets in `extensions.zwift.textEvents`

### Duration Type

Zwift supports time and distance durations:

- **Time-based**: `Duration` attribute in seconds
- **Distance-based**: `units` attribute indicates distance (for running)

The `durationType` metadata field indicates the workout's primary duration type.

### Intensity Inference

Zwift doesn't have explicit intensity fields, so we infer from position and interval type:

- **First Warmup element** → `intensity = "warmup"`
- **Last Cooldown element** → `intensity = "cooldown"`
- **All other intervals** → `intensity = "active"`

### Tags Preservation

Zwift tags are stored in KRD extensions:

```typescript
{
  extensions: {
    zwift: {
      tags: ["FTP", "Intervals", "Hard"];
    }
  }
}
```

### Multiple Targets

Zwift intervals can have both power and cadence targets. KRD supports primary and secondary targets:

- **Primary target**: Power or pace
- **Secondary target**: Cadence (if specified)

For simplicity in v1, store cadence in extensions if power/pace is primary target.

## Migration Path

This spec can be implemented independently of FIT and TCX conversions:

1. Create Zwift ports (ZwiftReader, ZwiftWriter, ZwiftValidator)
2. Implement fast-xml-parser adapter
3. Create Zwift-specific schemas and mappers
4. Implement use cases (reuse validation)
5. Add Zwift support to providers.ts
6. Export Zwift functions in public API
7. Add .zwo file extension support to CLI

The domain layer (schemas, validation) is shared with FIT and TCX, so no duplication is needed.

## Future Enhancements

### Phase 2 (Optional)

1. **ERG mode support** - Zwift's ERG mode for smart trainers
2. **Slope simulation** - FlatRoad and gradient attributes
3. **Advanced text events** - Multiple text events per interval with precise timing
4. **Workout categories** - Zwift workout categories and difficulty ratings
5. **Custom FTP** - User-specific FTP values for power calculations

### Phase 3 (Optional)

1. **Zwift workout library integration** - Import from Zwift's workout library
2. **Workout builder** - Generate Zwift workouts from KRD templates
3. **Training plans** - Multi-workout training plan support
