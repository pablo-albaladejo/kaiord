# @kaiord/core

Core library for Kaiord workout data conversion.

## Features

- **FIT file support**: Read and write Garmin FIT workout files
- **KRD canonical format**: JSON-based workout representation
- **Schema validation**: Zod schemas with TypeScript type inference
- **Round-trip safety**: Lossless conversions with defined tolerances
- **Hexagonal architecture**: Clean separation of concerns
- **Tree-shakeable**: Import only what you need for minimal bundle size

### Supported FIT Fields

- **Workout metadata**: Sub-sport categorization, pool dimensions
- **Workout steps**: Coaching notes, swimming equipment
- **Duration types**: Time, distance, calories, power thresholds, heart rate conditionals, repeat blocks
- **Target types**: Power (watts, %FTP, zones), heart rate (bpm, zones, %max), pace, cadence, open

See [NEW_FIELDS.md](../../docs/NEW_FIELDS.md) for detailed documentation and examples.

## Project Structure

```
packages/core/
├── src/
│   ├── domain/              # Pure domain logic (no external dependencies)
│   │   ├── types/           # Type definitions (KRD, Workout, Duration, Target, etc.)
│   │   │   ├── krd.ts
│   │   │   └── krd.test.ts  # Tests co-located with implementation
│   │   └── validation/      # Schema validator, tolerance checker
│   │       ├── schema-validator.ts
│   │       └── schema-validator.test.ts
│   ├── application/         # Use cases and business logic
│   │   └── use-cases/       # Convert FIT↔KRD, validate round-trip
│   │       ├── convert-fit-to-krd.ts
│   │       └── convert-fit-to-krd.test.ts
│   ├── ports/               # Contracts/interfaces
│   │   ├── logger.ts        # Logger interface
│   │   └── logger.test.ts
│   ├── adapters/            # External implementations
│   │   ├── fit/             # Garmin FIT SDK adapter
│   │   │   ├── garmin-fitsdk.ts
│   │   │   └── garmin-fitsdk.test.ts
│   │   └── logger/          # Console logger implementation
│   │       ├── console-logger.ts
│   │       └── console-logger.test.ts
│   └── tests/               # Test fixtures and helpers
│       ├── fixtures/        # Test data factories (faker + rosie)
│       │   ├── krd.fixtures.ts
│       │   ├── metadata.fixtures.ts
│       │   └── fit-files/   # Binary FIT test files
│       └── helpers/         # Test utilities
│           └── test-utils.ts
└── schema/
    └── workout.json         # JSON Schema (generated from Zod)
```

## Architecture

This package follows **hexagonal architecture** with clear separation of concerns:

- **Domain**: Pure business logic, no external dependencies
- **Application**: Use cases that orchestrate domain logic
- **Ports**: Contracts that define how external systems interact
- **Adapters**: Implementations of ports using external libraries

## Dependencies

### Production

- `@garmin/fitsdk` - FIT file parsing and encoding
- `zod` - Schema validation with TypeScript type inference
- `zod-to-json-schema` - Generate JSON Schema from Zod schemas

### Development

- `vitest` - Testing framework
- `@faker-js/faker` - Realistic test data generation
- `rosie` - Test fixture factories
- `tsup` - TypeScript bundler
- `@vitest/coverage-v8` - Code coverage

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

See [TREE_SHAKING.md](./TREE_SHAKING.md) for detailed guide and best practices.

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

## Testing

Tests are **co-located** with source files (`file.ts` → `file.test.ts`) and follow the **AAA pattern** (Arrange, Act, Assert):

- **Faker** for realistic test data
- **Rosie** for fixture factories
- **Vitest** as the test runner
- **All fixtures** in `src/tests/fixtures/` directory
- **Test helpers** in `src/tests/helpers/` directory

Coverage targets:

- Overall: ≥ 80%
- Mappers/converters: ≥ 90%
- Domain logic: 100%

### Test Utilities

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
