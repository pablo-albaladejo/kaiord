# @kaiord/core

[![npm version](https://img.shields.io/npm/v/@kaiord/core.svg)](https://www.npmjs.com/package/@kaiord/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/pablo-albaladejo/kaiord/workflows/CI/badge.svg)](https://github.com/pablo-albaladejo/kaiord/actions)

Core library for the Kaiord health & fitness data framework. Contains domain types, schemas, ports, use cases, and the plugin architecture for format adapters.

> **Note**: As of v2.0, format adapters (FIT, TCX, ZWO) are in separate packages. Install only the adapters you need for optimal bundle size.

## Features

- KRD canonical format with Zod schema validation
- Hexagonal architecture with ports and adapters pattern
- Plugin architecture for format adapters
- Full TypeScript support with type inference
- Custom logger injection
- Tree-shakeable ESM bundle

## Installation

```bash
npm install @kaiord/core
```

or with pnpm:

```bash
pnpm add @kaiord/core
```

or with yarn:

```bash
yarn add @kaiord/core
```

## Quick Start

Core exposes four conversion functions. Each takes the data, an injected
reader or writer from an adapter package, and an optional logger:

| Function                           | Direction           | Adapter port                      |
| ---------------------------------- | ------------------- | --------------------------------- |
| `fromBinary(buffer, reader, log?)` | binary format → KRD | `BinaryReader` (e.g. `fitReader`) |
| `toBinary(krd, writer, log?)`      | KRD → binary format | `BinaryWriter` (e.g. `fitWriter`) |
| `fromText(text, reader, log?)`     | text format → KRD   | `TextReader` (e.g. `tcxReader`)   |
| `toText(krd, writer, log?)`        | KRD → text format   | `TextWriter` (e.g. `zwiftWriter`) |

The result of `fromBinary`/`fromText` is validated against the KRD schema, and
the input of `toBinary`/`toText` is validated before it reaches the writer.

### Single Format

```typescript
import { fromBinary, toBinary } from "@kaiord/core";
import type { KRD } from "@kaiord/core";
import { fitReader, fitWriter } from "@kaiord/fit";
import { readFile } from "node:fs/promises";

// Convert FIT to KRD
const fitBuffer = new Uint8Array(await readFile("workout.fit"));
const krd: KRD = await fromBinary(fitBuffer, fitReader);

// Convert KRD back to FIT
const output: Uint8Array = await toBinary(krd, fitWriter);
```

### Multiple Formats

```typescript
import { fromBinary, toText } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";
import { tcxWriter } from "@kaiord/tcx";
import { zwiftWriter } from "@kaiord/zwo";

declare const fitBuffer: Uint8Array;

// FIT in, KRD in the middle, TCX and ZWO out
const krd = await fromBinary(fitBuffer, fitReader);
const tcx: string = await toText(krd, tcxWriter);
const zwo: string = await toText(krd, zwiftWriter);
```

### Schema Validation

```typescript
import { krdSchema } from "@kaiord/core";

declare const data: unknown;

// Validate KRD data
const result = krdSchema.safeParse(data);

if (result.success) {
  console.log("Valid KRD:", result.data);
} else {
  console.error("Validation errors:", result.error.issues);
}
```

## API Overview

### Main Functions

#### `fromBinary(buffer, reader, logger?)` / `fromText(text, reader, logger?)`

Converts a file in an adapter format to a validated KRD.

```typescript
import { fromBinary, fromText } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";
import { tcxReader } from "@kaiord/tcx";

declare const fitBuffer: Uint8Array;
declare const tcxString: string;

const fromFit = await fromBinary(fitBuffer, fitReader);
const fromTcx = await fromText(tcxString, tcxReader);
```

**Returns:** `Promise<KRD>` - Validated KRD object

**Throws:**

- the reader's own error (for example `FitParsingError`) when the input is corrupted or invalid
- `KrdValidationError` - When the converted data fails schema validation

#### `toBinary(krd, writer, logger?)` / `toText(krd, writer, logger?)`

Converts a KRD object to an adapter format.

```typescript
import { toBinary, toText } from "@kaiord/core";
import { fitWriter } from "@kaiord/fit";
import { zwiftWriter } from "@kaiord/zwo";
import type { KRD } from "@kaiord/core";

declare const krd: KRD;

const fitBuffer: Uint8Array = await toBinary(krd, fitWriter);
const zwo: string = await toText(krd, zwiftWriter);
```

**Returns:** `Promise<Uint8Array>` (binary) or `Promise<string>` (text)

**Throws:**

- `KrdValidationError` - When the KRD data is invalid
- the writer's own error when encoding fails

#### `validateRoundTrip(reader, writer, checker, logger)`

Validates that a binary → KRD → binary round-trip preserves data within
tolerances. It compares sessions, laps, records and structured workout steps
(step count, repeat blocks, durations, targets and intensity) and returns the
violations found; an empty array means the round-trip is lossless.

```typescript
import {
  createConsoleLogger,
  createToleranceChecker,
  validateRoundTrip,
} from "@kaiord/core";
import { fitReader, fitWriter } from "@kaiord/fit";

declare const fitBuffer: Uint8Array;

const violations = await validateRoundTrip(
  fitReader,
  fitWriter,
  createToleranceChecker(),
  createConsoleLogger()
).validateBinaryRoundTrip({ originalBinary: fitBuffer });
```

`compareKRDs(krd1, krd2, checker, logger)` runs the same comparison on two
KRDs, for a round-trip through a text format. A categorical mismatch, such as a
duration that changed type, has `tolerance: 0` and carries the two values in
`expectedValue` and `actualValue`.

### Schema Exports

All domain schemas are exported for validation and type inference:

```typescript
import {
  krdSchema,
  workoutSchema,
  durationSchema,
  targetSchema,
  sportSchema,
  subSportSchema,
  intensitySchema,
} from "@kaiord/core";

declare const data: unknown;

// Validate data
const result = krdSchema.safeParse(data);

// Access enum values
const sport = sportSchema.enum.cycling;
const intensity = intensitySchema.enum.warmup;
```

### Type Exports

All TypeScript types are inferred from Zod schemas:

```typescript
import type {
  KRD,
  Workout,
  WorkoutStep,
  Duration,
  Target,
  Sport,
  SubSport,
  Intensity,
} from "@kaiord/core";
```

### Error Types

```typescript
import {
  FitParsingError,
  KrdValidationError,
  ToleranceExceededError,
} from "@kaiord/core";
```

For more examples, see [docs/api-examples.md](./docs/api-examples.md).

## TypeScript Support

@kaiord/core is written in TypeScript and provides complete type definitions.

### Type Imports

Import types separately from values for optimal tree-shaking:

```typescript
import { krdSchema } from "@kaiord/core";
import type { KRD, Workout, Duration } from "@kaiord/core";
```

### Discriminated Unions

Duration and Target types use discriminated unions for type safety:

```typescript
import type { Duration } from "@kaiord/core";

declare const duration: Duration;

// TypeScript narrows the type based on discriminator
if (duration.type === "time") {
  console.log(duration.seconds); // ✓ TypeScript knows this exists
}
```

```typescript
import type { Target } from "@kaiord/core";

declare const target: Target;

// Type narrowing works automatically
if (target.type === "power") {
  console.log(target.value.unit); // ✓ "watts" | "percent_ftp" | "zone" | "range"
}
```

### Schema Validation with Type Inference

Zod schemas provide both runtime validation and TypeScript types:

```typescript
import { krdSchema, workoutSchema } from "@kaiord/core";
import type { KRD, Workout } from "@kaiord/core";

declare const data: unknown;

// Parse with automatic type inference
const krd = krdSchema.parse(data); // Type: KRD

// Safe parse with error handling
const result = krdSchema.safeParse(data);
if (result.success) {
  const krd: KRD = result.data; // Type: KRD
} else {
  console.error(result.error.issues);
}

// Validate nested objects
const workout = workoutSchema.parse(data); // Type: Workout
```

### Enum Values

Access enum values via schema `.enum` property:

```typescript
import { sportSchema, intensitySchema } from "@kaiord/core";
import type { Workout } from "@kaiord/core";

declare const workout: Workout;

// Access enum values
const sport = sportSchema.enum.cycling; // "cycling"
const intensity = intensitySchema.enum.warmup; // "warmup"

// Use in comparisons
if (workout.sport === sportSchema.enum.running) {
  console.log("Running workout");
}
```

## Error Handling

@kaiord/core uses custom error classes for different failure scenarios.

### Error Types

#### `FitParsingError`

Thrown when FIT file parsing fails due to corrupted or invalid data.

```typescript
import { fromBinary, FitParsingError } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";

declare const fitBuffer: Uint8Array;

try {
  const krd = await fromBinary(fitBuffer, fitReader);
} catch (error) {
  if (error instanceof FitParsingError) {
    console.error("Failed to parse FIT file:", error.message);
    console.error("Original error:", error.cause);
  }
}
```

**Properties:**

- `message: string` - Error description
- `cause?: unknown` - Original error from FIT SDK

#### `KrdValidationError`

Thrown when KRD data fails schema validation.

```typescript
import { fromBinary, KrdValidationError } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";

declare const fitBuffer: Uint8Array;

try {
  const krd = await fromBinary(fitBuffer, fitReader);
} catch (error) {
  if (error instanceof KrdValidationError) {
    console.error("KRD validation failed:");
    for (const err of error.errors) {
      console.error(`  - ${err.field}: ${err.message}`);
    }
  }
}
```

**Properties:**

- `message: string` - Error description
- `errors: Array<{ field: string; message: string }>` - Validation errors

#### `ToleranceExceededError`

Carries the violations of a round-trip that exceeded the tolerances.
`validateRoundTrip` returns its violations rather than throwing, so a caller
that wants to fail throws this error itself.

```typescript
import { ToleranceExceededError } from "@kaiord/core";

declare const runConversionThatThrowsOnViolations: () => Promise<void>;

try {
  await runConversionThatThrowsOnViolations();
} catch (error) {
  if (error instanceof ToleranceExceededError) {
    console.error("Round-trip validation failed:");
    for (const violation of error.violations) {
      const expected = violation.expectedValue ?? violation.expected;
      const actual = violation.actualValue ?? violation.actual;
      console.error(
        `  - ${violation.field}: expected ${expected}, got ${actual}`
      );
    }
  }
}
```

**Properties:**

- `message: string` - Error description
- `violations: Array<{ field: string; expected: number; actual: number; deviation: number; tolerance: number }>` - Tolerance violations

### Complete Error Handling Example

```typescript
import { fromBinary, FitParsingError, KrdValidationError } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";

async function convertWorkout(fitBuffer: Uint8Array) {
  try {
    return await fromBinary(fitBuffer, fitReader);
  } catch (error) {
    if (error instanceof FitParsingError) {
      console.error("❌ FIT parsing failed:", error.message);
      if (error.cause) {
        console.error("   Cause:", error.cause);
      }
      throw new Error("Invalid FIT file");
    }

    if (error instanceof KrdValidationError) {
      console.error("❌ KRD validation failed:");
      for (const err of error.errors) {
        console.error(`   - ${err.field}: ${err.message}`);
      }
      throw new Error("Conversion produced invalid KRD");
    }

    // Unknown error - re-throw
    throw error;
  }
}
```

## Documentation

### Main Documentation

- **[Getting Started](../../docs/getting-started.md)** - Quick start guide and installation
- **[Architecture](../../docs/architecture.md)** - Hexagonal architecture, ports & adapters pattern
- **[Testing Guidelines](../../docs/testing.md)** - Testing patterns and best practices
- **[KRD Format Specification](../../docs/krd-format.md)** - Complete format documentation

### Package-Specific Documentation

- **[API Examples](./docs/api-examples.md)** - Code examples for conversion, validation and error handling
- **[Tree Shaking Guide](./docs/tree-shaking.md)** - Optimize bundle size
- **[Zwift Format Extensions](./docs/zwift-format-extensions.md)** - Zwift-specific features
- **[Zwift Kaiord Attributes](./docs/zwift-kaiord-attributes.md)** - Custom Zwift attributes

## Contributing

We welcome contributions! Please see:

- **[Contributing Guidelines](../../CONTRIBUTING.md)** - How to contribute to Kaiord
- **[Issue Tracker](https://github.com/pablo-albaladejo/kaiord/issues)** - Report bugs or request features
- **[Pull Requests](https://github.com/pablo-albaladejo/kaiord/pulls)** - Submit code changes

Before contributing:

1. Read the [Architecture documentation](../../docs/architecture.md)
2. Follow the [Testing guidelines](../../docs/testing.md)
3. Ensure all tests pass: `pnpm test`
4. Run linter: `pnpm lint`

## Scripts

```bash
pnpm build                  # Build the library
pnpm test                   # Run tests once
pnpm test:watch             # Run tests in watch mode
pnpm test:coverage          # Run tests with coverage report
pnpm generate:schema        # Generate JSON Schema from Zod schemas
pnpm clean                  # Clean build artifacts
```

## Tree-Shaking

`@kaiord/core` is fully optimized for tree-shaking. Import only what you need:

```typescript
// ✅ Good: Import specific items (smaller bundle)
import { krdSchema, sportSchema } from "@kaiord/core";
import type { KRD, Sport } from "@kaiord/core";

// Test utilities (separate export, not included in main bundle)
import { loadKrdFixture } from "@kaiord/core/test-utils";

// ❌ Avoid: Import everything (larger bundle)
import * as Kaiord from "@kaiord/core";
```

**Bundle sizes** (minified + gzipped):

- Types only: 0 KB (compile-time)
- Schema validation: ~15 KB
- Conversion functions (without adapters): small; each adapter package adds its own weight
- Test utilities: Not included in production bundles

See [docs/tree-shaking.md](./docs/tree-shaking.md) for detailed guide and best practices.

## Test Utilities

The package exports test utilities for other packages to use:

```typescript
import {
  loadFitFixture,
  loadKrdFixture,
  loadFixturePair,
  FIXTURE_NAMES,
} from "@kaiord/core/test-utils";

// Load fixtures for testing
const fitBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
const krd = loadKrdFixture("WorkoutIndividualSteps.krd");

// Load both for round-trip tests
const pair = loadFixturePair(FIXTURE_NAMES.INDIVIDUAL_STEPS);
```
