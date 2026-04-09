---
title: "Architecture"
description: "Kaiord uses hexagonal architecture with ports and adapters. Learn about layer structure, use case patterns, and schema-first development."
---

# Architecture

Kaiord uses **Hexagonal Architecture** (Ports and Adapters) to keep business logic separate from technical details.

## Layer structure

```
packages/core/src/
├── domain/           # Business rules and data types
│   ├── schemas/      # Zod schemas for KRD format
│   ├── validation/   # Business validators
│   └── types/        # Error types
├── application/      # Use cases (business operations)
├── ports/            # Contracts for external services
└── adapters/         # Logger implementation only
```

Format adapters live in their own packages:

```
packages/fit/src/     # FIT reader/writer (Garmin FIT SDK)
packages/tcx/src/     # TCX reader/writer (fast-xml-parser)
packages/zwo/src/     # ZWO reader/writer (fast-xml-parser)
packages/garmin/src/  # GCN reader/writer (Garmin Connect JSON)
```

## Dependency rules

- **domain** depends on nothing (pure business logic)
- **application** depends only on domain and ports
- **adapters** implement ports and can use external libraries
- **CLI/MCP** depend on application (not adapters directly)

You can change how files are read or written without touching business logic.

## Hexagonal architecture explained

The architecture separates code into layers:

1. **Domain Layer** -- business rules (what makes the app unique)
2. **Application Layer** -- use cases (what the app does)
3. **Ports** -- contracts for external services (what you need from outside)
4. **Adapters** -- implementations of ports (how you connect to outside)

**Benefits**: testable, flexible, clear separation, maintainable.

### Example: reading a FIT file

**Port (contract)**:

```typescript
// ports/binary-reader.ts
import type { KRD } from "../domain/schemas/krd";

export type BinaryReader = (buffer: Uint8Array) => Promise<KRD>;
```

**Adapter (implementation)**:

```typescript
// packages/fit/src/adapters/garmin-fitsdk.ts
import type { BinaryReader } from "@kaiord/core";

export const createGarminFitSdkReader =
  (logger: Logger): BinaryReader =>
  async (buffer: Uint8Array): Promise<KRD> => {
    const stream = Stream.fromByteArray(Array.from(buffer));
    const decoder = new Decoder(stream);
    const { messages } = decoder.read();
    return convertMessagesToKRD(messages);
  };
```

**Use case**:

```typescript
// application/from-format.ts
export const fromBinary = async (
  buffer: Uint8Array,
  reader: BinaryReader,
  logger?: Logger
): Promise<KRD> => {
  return reader(buffer);
};
```

## Use case pattern

Kaiord uses **strategy injection** -- readers and writers are passed as arguments to generic core functions:

```ts twoslash
import { fromBinary, toText } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";
import { tcxWriter } from "@kaiord/tcx";

declare const buffer: Uint8Array;
// The core function is format-agnostic
const krd = await fromBinary(buffer, fitReader);
const tcx = await toText(krd, tcxWriter);
```

No dependency injection framework needed. Functions are composed at entry points (CLI, MCP).

### Curried use cases

For more complex use cases, Kaiord uses currying for dependency injection. The use case receives adapters (ports) as dependencies and delegates work to them -- validation stays at adapter boundaries, not inside use cases:

```typescript
// First function receives dependencies (adapters)
// Second function receives operation parameters
export const convertFitToKrd =
  (fitReader: FitReader) =>
  async (params: { fitBuffer: Uint8Array }): Promise<KRD> => {
    // The adapter validates internally at the boundary
    return fitReader(params.fitBuffer);
  };
```

Composition happens at entry points:

```typescript
const fitReader = createFitReader(logger);
const convertFitToKrdUseCase = convertFitToKrd(fitReader);
const krd = await convertFitToKrdUseCase({ fitBuffer });
```

## Schema-first development

Kaiord uses **Zod as the single source of truth**:

1. Define Zod schemas first, infer types after
2. Validate at boundaries (CLI input, adapter output)
3. Use cases receive already-validated types

```typescript
// domain/schemas/sport.ts
export const sportSchema = z.enum([
  "cycling",
  "running",
  "swimming",
  "generic",
]);
export type Sport = z.infer<typeof sportSchema>;
```

### Schema conventions

- **Domain schemas** use `snake_case`: `indoor_cycling`, `lap_swimming`
- **Adapter schemas** use `camelCase`: `indoorCycling`, `lapSwimming`
- Access enum values via `.enum`: `sportSchema.enum.cycling`

### Enum schemas

Use `z.enum()` for enumeration types, never TypeScript `enum` or constant objects:

```typescript
export const subSportSchema = z.enum([
  "generic",
  "indoor_cycling", // snake_case in domain
  "lap_swimming",
]);
export type SubSport = z.infer<typeof subSportSchema>;

// Access values at runtime
subSportSchema.enum.indoor_cycling; // "indoor_cycling"
```

### Validation at boundaries

Validate at entry points (CLI, adapters), not in use cases:

```typescript
// Adapter validates its output before returning
export const createFitReader =
  (logger: Logger): FitReader =>
  async (buffer: Uint8Array): Promise<KRD> => {
    const rawData = decoder.read(buffer);
    const krd = convertFitMessagesToKRD(rawData.messages);
    return krdSchema.parse(krd); // Validate at boundary
  };
```

## Error handling

Errors follow Clean Architecture principles:

1. **Define** in domain layer (custom Error classes)
2. **Transform** at boundaries (adapters catch external errors, wrap in domain errors)
3. **Propagate** upward (use cases do not catch errors)
4. **Log** at entry points only (CLI, MCP)

```
Domain Layer      → Define custom Error classes
Application Layer → Propagate errors (add context if needed)
Adapters Layer    → Catch external errors, transform to domain errors
Entry Points      → Catch all errors, log, format response
```

### Domain error classes

All domain errors extend `Error` with descriptive names:

- **FitParsingError** -- FIT file parsing failures
- **KrdValidationError** -- KRD schema validation failures (includes field-level errors)
- **ToleranceExceededError** -- round-trip tolerance violations (includes per-field deviations)

### Error transformation in adapters

Adapters catch external library errors and wrap them:

```typescript
export const createFitReader =
  (logger: Logger): FitReader =>
  async (buffer: Uint8Array): Promise<KRD> => {
    try {
      const { messages } = decoder.read(buffer);
      return convertMessagesToKRD(messages);
    } catch (error) {
      throw new FitParsingError("Failed to parse FIT file", error);
    }
  };
```

## Next steps

- [KRD Format](/formats/krd) -- the canonical data format
- [Testing Guide](/guide/testing) -- testing practices and TDD
- [Quick Start](/guide/quick-start) -- build something in 5 minutes
