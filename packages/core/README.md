# @kaiord/core

Core library for Kaiord workout data conversion between FIT, TCX, ZWO, and KRD formats.

## Features

- **FIT file support**: Read and write Garmin FIT workout files
- **KRD canonical format**: JSON-based workout representation
- **Schema validation**: Zod schemas with TypeScript type inference
- **Round-trip safety**: Lossless conversions with defined tolerances
- **Hexagonal architecture**: Clean separation of concerns
- **Tree-shakeable**: Import only what you need for minimal bundle size

## Installation

```bash
npm install @kaiord/core
```

or

```bash
pnpm add @kaiord/core
```

## Quick Usage

```typescript
import { toKRD, fromKRD } from "@kaiord/core";
import type { KRD } from "@kaiord/core";

// Convert FIT to KRD
const fitBuffer = await readFile("workout.fit");
const krd: KRD = await toKRD(fitBuffer, { type: "fit" });

// Convert KRD to FIT
const outputBuffer = await fromKRD(krd, { type: "fit" });
await writeFile("output.fit", outputBuffer);

// Validate KRD against schema
import { krdSchema } from "@kaiord/core";
const result = krdSchema.safeParse(krd);
if (!result.success) {
  console.error("Validation errors:", result.error);
}
```

## Documentation

### Main Documentation

- **[Getting Started](../../docs/getting-started.md)** - Quick start guide
- **[Architecture](../../docs/architecture.md)** - Hexagonal architecture, ports & adapters pattern
- **[Testing Guidelines](../../docs/testing.md)** - Testing patterns and best practices
- **[KRD Format Specification](../../docs/krd-format.md)** - Complete format documentation

### Package-Specific Documentation

- **[Tree Shaking Guide](./docs/tree-shaking.md)** - Optimize bundle size
- **[KRD Fixtures Generation](./docs/krd-fixtures-generation.md)** - Generate test fixtures
- **[Zwift Format Extensions](./docs/zwift-format-extensions.md)** - Zwift-specific features
- **[Zwift Kaiord Attributes](./docs/zwift-kaiord-attributes.md)** - Custom Zwift attributes

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
