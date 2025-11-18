# Design Document: PWX ↔ KRD Bidirectional Conversion

## Overview

This design implements bidirectional conversion between PowerAgent Workout XML (PWX) files and KRD (Kaiord Representation Definition) format. PWX is TrainingPeaks' XML-based format for structured workouts. The system follows hexagonal architecture with clear separation between domain logic, application use cases, ports (contracts), and adapters (implementations).

### Key Design Goals

1. **Round-trip safety**: PWX → KRD → PWX and KRD → PWX → KRD preserve data within tolerances
2. **Hexagonal architecture**: Domain logic isolated from external dependencies
3. **Dependency injection**: Swappable XML parser implementations via ports
4. **Schema validation**: All KRD output validated against JSON schema
5. **Type safety**: Strict TypeScript with no implicit `any`
6. **Testability**: Golden file tests and round-trip validation with fixtures

### Code Style Preferences

This implementation follows the guidelines defined in `.kiro/steering/` (same as FIT and TCX specs).

## Architecture

### Layer Structure

```
packages/core/
├── domain/
│   ├── schemas/                # Zod schemas (shared with FIT/TCX)
│   ├── types/
│   │   └── errors.ts           # Error types (add PwxParsingError)
│   └── validation/             # Reuse SchemaValidator and ToleranceChecker
├── application/
│   ├── use-cases/
│   │   ├── convert-pwx-to-krd.ts    # PWX → KRD use case
│   │   ├── convert-krd-to-pwx.ts    # KRD → PWX use case
│   │   └── validate-round-trip.ts   # Round-trip validation (reuse)
│   └── providers.ts            # DI wiring (update to include PWX)
├── ports/
│   ├── pwx-reader.ts           # PWX reading contract
│   ├── pwx-writer.ts           # PWX writing contract
│   └── logger.ts               # Logger contract (reuse)
└── adapters/
    ├── pwx/
    │   ├── fast-xml-parser.ts  # fast-xml-parser implementation
    │   ├── schemas/            # PWX-specific Zod schemas
    │   │   ├── pwx-sport.ts
    │   │   ├── pwx-duration.ts
    │   │   └── pwx-target.ts
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

## Components and Interfaces

### Domain Layer (Reused from FIT/TCX)

The domain layer schemas are shared between FIT, TCX, and PWX conversions.

### Error Types (Extended)

```typescript
// domain/types/errors.ts (add to existing)
export type PwxParsingError = {
  name: "PwxParsingError";
  message: string;
  cause?: unknown;
};

export const createPwxParsingError = (
  message: string,
  cause?: unknown
): PwxParsingError => ({
  name: "PwxParsingError",
  message,
  cause,
});
```

### Ports Layer

#### PWX Reader Contract

```typescript
// ports/pwx-reader.ts
import type { KRD } from "../domain/schemas/krd";

export type PwxReader = (xmlString: string) => Promise<KRD>;
```

#### PWX Writer Contract

```typescript
// ports/pwx-writer.ts
import type { KRD } from "../domain/schemas/krd";

export type PwxWriter = (krd: KRD) => Promise<string>;
```

### Adapters Layer

#### PWX Adapter Schemas

```typescript
// adapters/pwx/schemas/pwx-sport.ts
import { z } from "zod";

export const pwxSportSchema = z.enum(["Bike", "Run", "Swim", "Other"]);

export type PwxSport = z.infer<typeof pwxSportSchema>;

export const PWX_TO_KRD_SPORT: Record<PwxSport, string> = {
  Bike: "cycling",
  Run: "running",
  Swim: "swimming",
  Other: "generic",
};
```

```typescript
// adapters/pwx/schemas/pwx-duration.ts
import { z } from "zod";

export const pwxDurationTypeSchema = z.enum(["time", "distance", "open"]);

export type PwxDurationType = z.infer<typeof pwxDurationTypeSchema>;
```

```typescript
// adapters/pwx/schemas/pwx-target.ts
import { z } from "zod";

export const pwxTargetTypeSchema = z.enum([
  "power",
  "heartrate",
  "speed",
  "cadence",
  "none",
]);

export type PwxTargetType = z.infer<typeof pwxTargetTypeSchema>;
```

#### Fast XML Parser Adapter

```typescript
// adapters/pwx/fast-xml-parser.ts
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import type { PwxReader } from "../../ports/pwx-reader";
import type { PwxWriter } from "../../ports/pwx-writer";
import type { KRD } from "../../domain/schemas/krd";
import type { Logger } from "../../ports/logger";
import { createPwxParsingError } from "../../domain/types/errors";

export const createFastXmlPwxReader =
  (logger: Logger): PwxReader =>
  async (xmlString: string): Promise<KRD> => {
    try {
      logger.debug("Parsing PWX file", { xmlLength: xmlString.length });

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseAttributeValue: true,
      });

      const pwxData = parser.parse(xmlString);

      if (!pwxData.workout) {
        throw createPwxParsingError(
          "Invalid PWX format: missing workout element"
        );
      }

      logger.info("PWX file parsed successfully");
      return convertPwxToKRD(pwxData, logger);
    } catch (error) {
      logger.error("Failed to parse PWX file", { error });
      throw createPwxParsingError("Failed to parse PWX file", error);
    }
  };

export const createFastXmlPwxWriter =
  (logger: Logger): PwxWriter =>
  async (krd: KRD): Promise<string> => {
    try {
      logger.debug("Encoding KRD to PWX");

      const pwxData = convertKRDToPwx(krd, logger);

      const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        format: true,
        indentBy: "  ",
      });

      const xmlString = builder.build(pwxData);
      logger.info("KRD encoded to PWX successfully");
      return xmlString;
    } catch (error) {
      logger.error("Failed to write PWX file", { error });
      throw createPwxParsingError("Failed to write PWX file", error);
    }
  };

const convertPwxToKRD = (pwxData: unknown, logger: Logger): KRD => {
  // Implementation: map PWX structure to KRD
  logger.debug("Converting PWX to KRD");
  throw new Error("Not implemented");
};

const convertKRDToPwx = (krd: KRD, logger: Logger): unknown => {
  // Implementation: map KRD structure to PWX
  logger.debug("Converting KRD to PWX");
  throw new Error("Not implemented");
};
```

### Application Layer

#### Convert PWX to KRD Use Case

```typescript
// application/use-cases/convert-pwx-to-krd.ts
import type { KRD } from "../../domain/schemas/krd";
import { createKrdValidationError } from "../../domain/types/errors";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { PwxReader } from "../../ports/pwx-reader";
import type { Logger } from "../../ports/logger";

type ConvertPwxToKrdParams = {
  pwxString: string;
};

export type ConvertPwxToKrd = ReturnType<typeof convertPwxToKrd>;

export const convertPwxToKrd =
  (pwxReader: PwxReader, validator: SchemaValidator, logger: Logger) =>
  async (params: ConvertPwxToKrdParams): Promise<KRD> => {
    logger.info("Converting PWX to KRD");

    const krd = await pwxReader(params.pwxString);

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

    logger.info("PWX to KRD conversion successful");
    return krd;
  };
```

#### Convert KRD to PWX Use Case

```typescript
// application/use-cases/convert-krd-to-pwx.ts
import type { KRD } from "../../domain/schemas/krd";
import { createKrdValidationError } from "../../domain/types/errors";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { PwxWriter } from "../../ports/pwx-writer";
import type { Logger } from "../../ports/logger";

type ConvertKrdToPwxParams = {
  krd: KRD;
};

export type ConvertKrdToPwx = ReturnType<typeof convertKrdToPwx>;

export const convertKrdToPwx =
  (pwxWriter: PwxWriter, validator: SchemaValidator, logger: Logger) =>
  async (params: ConvertKrdToPwxParams): Promise<string> => {
    logger.info("Converting KRD to PWX");

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

    const pwxString = await pwxWriter(params.krd);

    logger.info("KRD to PWX conversion successful");
    return pwxString;
  };
```

## Data Models

### PWX Workout Structure

```xml
<workout>
  <sportType>Bike</sportType>
  <name>Sample Workout</name>
  <segment>
    <name>Warmup</name>
    <duration>300</duration>
    <durationType>time</durationType>
    <intensity>Warmup</intensity>
    <target>
      <targetType>power</targetType>
      <targetValueLow>150</targetValueLow>
      <targetValueHigh>180</targetValueHigh>
    </target>
  </segment>
  <segment>
    <repeat>5</repeat>
    <segment>
      <duration>400</duration>
      <durationType>distance</durationType>
      <target>
        <targetType>power</targetType>
        <targetValueLow>250</targetValueLow>
        <targetValueHigh>270</targetValueHigh>
      </target>
    </segment>
  </segment>
</workout>
```

### PWX to KRD Mapping

| PWX Element                      | KRD Field                               | Notes                                                                 |
| -------------------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| `workout/sportType`              | `metadata.sport`                        | Map "Bike" → "cycling", "Run" → "running"                             |
| `workout/name`                   | `extensions.workout.name`               | Workout name                                                          |
| `segment/duration`               | `duration.seconds` or `duration.meters` | Depends on durationType                                               |
| `segment/durationType`           | `duration.type`                         | "time", "distance", or "open"                                         |
| `segment/target/targetType`      | `target.type`                           | "power", "heartrate" → "heart_rate", "speed" → "pace", "cadence"      |
| `segment/target/targetValueLow`  | `target.value.min`                      | Range minimum                                                         |
| `segment/target/targetValueHigh` | `target.value.max`                      | Range maximum                                                         |
| `segment/intensity`              | `intensity`                             | Map "Warmup" → "warmup", "Active" → "active", "Cooldown" → "cooldown" |
| `segment/repeat`                 | `repeatCount`                           | Repetition count                                                      |

## Error Handling

### Error Types

1. **PwxParsingError** - XML parsing failures, invalid PWX structure
2. **KrdValidationError** - KRD schema validation failures (reused)
3. **ToleranceExceededError** - Round-trip tolerance violations (reused)

## Testing Strategy

### Unit Tests

- PWX parser with valid/invalid XML
- Duration mappers (time, distance, open)
- Target mappers (power, heart rate, speed, cadence)
- Sport and intensity mappers
- Repetition block handling

### Integration Tests

- PWX → KRD conversion with sample files
- KRD → PWX conversion with sample files
- Extension preservation

### Round-Trip Tests

- PWX → KRD → PWX with tolerance checking
- KRD → PWX → KRD with tolerance checking
- Mixed duration types
- Mixed target types
- Repetition blocks

### Golden File Tests

- Compare converted KRD against expected JSON
- Validate PWX output against XSD schema

## Dependencies

### External Libraries

- **fast-xml-parser** (^4.3.0) - XML parsing and building

### Internal Dependencies

- **@kaiord/core domain schemas** - Reuse KRD, Workout, Duration, Target schemas
- **@kaiord/core validation** - Reuse SchemaValidator and ToleranceChecker
- **@kaiord/core logger** - Reuse Logger port and console adapter

## Implementation Notes

### PWX Namespace Handling

PWX files use simpler XML structure than TCX, with fewer namespaces:

```xml
<workout xmlns="http://www.peaksware.com/PWX/1/0">
```

### Duration Type Mapping

PWX duration types map directly to KRD:

- **time** → `duration.type = "time"`
- **distance** → `duration.type = "distance"`
- **open** → `duration.type = "open"`

### Target Type Mapping

PWX target types map to KRD as follows:

- **power** → `target.type = "power"`
- **heartrate** → `target.type = "heart_rate"`
- **speed** → `target.type = "pace"` (convert m/s)
- **cadence** → `target.type = "cadence"`
- **none** → `target.type = "open"`

### Intensity Mapping

PWX intensity values:

- **Warmup** → `intensity = "warmup"`
- **Active** → `intensity = "active"`
- **Cooldown** → `intensity = "cooldown"`
- **Rest** → `intensity = "rest"`

## Migration Path

This spec can be implemented independently of FIT and TCX conversion:

1. Create PWX ports (PwxReader, PwxWriter)
2. Implement fast-xml-parser adapter
3. Create PWX-specific schemas and mappers
4. Implement use cases (reuse validation)
5. Add PWX support to providers.ts
6. Export PWX functions in public API

The domain layer (schemas, validation) is shared with FIT and TCX, so no duplication is needed.
