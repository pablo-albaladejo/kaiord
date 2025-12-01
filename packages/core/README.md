# @kaiord/core

[![npm version](https://img.shields.io/npm/v/@kaiord/core.svg)](https://www.npmjs.com/package/@kaiord/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/pablo-albaladejo/kaiord/workflows/CI/badge.svg)](https://github.com/pablo-albaladejo/kaiord/actions)

Core library for Kaiord workout data conversion between FIT, TCX, ZWO, and KRD formats.

## Features

- ✅ **FIT file support**: Read and write Garmin FIT workout files
- ✅ **KRD canonical format**: JSON-based workout representation
- ✅ **Schema validation**: Zod schemas with TypeScript type inference
- ✅ **Round-trip safety**: Lossless conversions with defined tolerances
- ✅ **Hexagonal architecture**: Clean separation of concerns
- ✅ **Tree-shakeable**: Import only what you need for minimal bundle size
- ✅ **Full TypeScript support**: Complete type definitions and inference
- ✅ **Custom loggers**: Integrate with your logging infrastructure
- ✅ **Dependency injection**: Swap providers without changing code

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

### Basic FIT to KRD Conversion

```typescript
import { createDefaultProviders } from "@kaiord/core";
import type { KRD } from "@kaiord/core";
import { readFile } from "fs/promises";

// Read FIT file
const fitBuffer = await readFile("workout.fit");

// Create providers with default configuration
const providers = createDefaultProviders();

// Convert FIT to KRD
const krd: KRD = await providers.convertFitToKrd({ fitBuffer });

console.log(krd.version); // "1.0"
console.log(krd.type); // "workout"
```

### Basic KRD to FIT Conversion

```typescript
import { createDefaultProviders } from "@kaiord/core";
import { writeFile } from "fs/promises";

const providers = createDefaultProviders();

// Convert KRD to FIT
const fitBuffer = await providers.convertKrdToFit({ krd });

// Write FIT file
await writeFile("output.fit", fitBuffer);
```

### Schema Validation

```typescript
import { krdSchema } from "@kaiord/core";

// Validate KRD data
const result = krdSchema.safeParse(data);

if (result.success) {
  console.log("Valid KRD:", result.data);
} else {
  console.error("Validation errors:", result.error.errors);
}
```

## API Overview

### Main Functions

#### `createDefaultProviders(logger?: Logger)`

Creates a set of providers with default implementations for FIT conversion.

```typescript
import { createDefaultProviders } from "@kaiord/core";

const providers = createDefaultProviders();
// Returns: { convertFitToKrd, convertKrdToFit, logger }
```

#### `convertFitToKrd({ fitBuffer })`

Converts a FIT workout file to KRD format.

```typescript
const krd = await providers.convertFitToKrd({ fitBuffer });
```

**Parameters:**

- `fitBuffer: Uint8Array` - Binary FIT file data

**Returns:** `Promise<KRD>` - Validated KRD object

**Throws:**

- `FitParsingError` - When FIT file is corrupted or invalid
- `KrdValidationError` - When converted data fails schema validation

#### `convertKrdToFit({ krd })`

Converts a KRD object to FIT workout file format.

```typescript
const fitBuffer = await providers.convertKrdToFit({ krd });
```

**Parameters:**

- `krd: KRD` - Valid KRD object

**Returns:** `Promise<Uint8Array>` - Binary FIT file data

**Throws:**

- `KrdValidationError` - When KRD data is invalid
- `FitParsingError` - When FIT encoding fails

#### `validateRoundTrip({ fitBuffer })`

Validates that FIT → KRD → FIT conversion preserves data within tolerances.

```typescript
import { validateRoundTrip, createToleranceChecker } from "@kaiord/core";

const checker = createToleranceChecker();
await validateRoundTrip(
  fitReader,
  fitWriter,
  validator,
  checker,
  logger
)({
  fitBuffer,
});
```

**Throws:**

- `ToleranceExceededError` - When round-trip conversion exceeds tolerances

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

For detailed API examples, see [docs/api-examples.md](./docs/api-examples.md) (coming soon).

## TypeScript Support

@kaiord/core is written in TypeScript and provides complete type definitions.

### Type Imports

Import types separately from values for optimal tree-shaking:

```typescript
import { createDefaultProviders, krdSchema } from "@kaiord/core";
import type { KRD, Workout, Duration } from "@kaiord/core";
```

### Discriminated Unions

Duration and Target types use discriminated unions for type safety:

```typescript
import type { Duration } from "@kaiord/core";

const duration: Duration =
  | { type: "time"; seconds: number }
  | { type: "distance"; meters: number }
  | { type: "open" };

// TypeScript narrows the type based on discriminator
if (duration.type === "time") {
  console.log(duration.seconds); // ✓ TypeScript knows this exists
}
```

```typescript
import type { Target } from "@kaiord/core";

const target: Target =
  | { type: "power"; value: { unit: "watts"; value: number } }
  | { type: "heart_rate"; value: { unit: "bpm"; value: number } }
  | { type: "open" };

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

// Parse with automatic type inference
const krd = krdSchema.parse(data); // Type: KRD

// Safe parse with error handling
const result = krdSchema.safeParse(data);
if (result.success) {
  const krd: KRD = result.data; // Type: KRD
} else {
  console.error(result.error.errors);
}

// Validate nested objects
const workout = workoutSchema.parse(data); // Type: Workout
```

### Enum Values

Access enum values via schema `.enum` property:

```typescript
import { sportSchema, intensitySchema } from "@kaiord/core";

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
import { FitParsingError } from "@kaiord/core";

try {
  const krd = await providers.convertFitToKrd({ fitBuffer });
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
import { KrdValidationError } from "@kaiord/core";

try {
  const krd = await providers.convertFitToKrd({ fitBuffer });
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

Thrown when round-trip conversion exceeds defined tolerances.

```typescript
import { ToleranceExceededError } from "@kaiord/core";

try {
  await validateRoundTrip(
    fitReader,
    fitWriter,
    validator,
    checker,
    logger
  )({
    fitBuffer,
  });
} catch (error) {
  if (error instanceof ToleranceExceededError) {
    console.error("Round-trip validation failed:");
    for (const violation of error.violations) {
      console.error(
        `  - ${violation.field}: expected ${violation.expected}, got ${violation.actual}`
      );
      console.error(
        `    Deviation: ${violation.deviation}, tolerance: ${violation.tolerance}`
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
import {
  createDefaultProviders,
  FitParsingError,
  KrdValidationError,
  ToleranceExceededError,
} from "@kaiord/core";

async function convertWorkout(fitBuffer: Uint8Array) {
  try {
    const providers = createDefaultProviders();
    const krd = await providers.convertFitToKrd({ fitBuffer });
    return krd;
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

- **[API Examples](./docs/api-examples.md)** - Comprehensive code examples (coming soon)
- **[Tree Shaking Guide](./docs/tree-shaking.md)** - Optimize bundle size
- **[KRD Fixtures Generation](./docs/krd-fixtures-generation.md)** - Generate test fixtures
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
pnpm generate:krd-fixtures  # Generate KRD test fixtures from FIT files
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
- Full conversion: ~80 KB
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
const { fit, krd } = loadFixturePair(FIXTURE_NAMES.INDIVIDUAL_STEPS);
```

See [docs/krd-fixtures-generation.md](./docs/krd-fixtures-generation.md) for details on fixture generation.
