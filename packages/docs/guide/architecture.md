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

## Next steps

- [KRD Format](/formats/krd) -- the canonical data format
- [Testing Guide](/guide/testing) -- testing practices and TDD
- [Quick Start](/guide/quick-start) -- build something in 5 minutes
