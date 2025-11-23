# Design Document

## Overview

This document outlines the design for improving @kaiord/core's public API, documentation, and publishing workflow. The package already exists and provides workout file conversion functionality, but needs comprehensive documentation, examples, and proper npm publishing configuration to be production-ready.

The focus is on:

1. **Developer Experience (DX)** - Clear API, excellent TypeScript support, helpful documentation
2. **Publishing Workflow** - Safe, automated publishing with pre-publish checks
3. **Monorepo Integration** - Seamless workspace consumption by CLI and future SPA
4. **License Compliance** - Automated license checking for all dependencies

## Architecture

@kaiord/core follows hexagonal architecture and already has a well-defined structure:

```
packages/core/
├── src/
│   ├── domain/              # Pure business logic
│   │   ├── schemas/         # Zod schemas (KRD format)
│   │   ├── types/           # Error types
│   │   └── validation/      # Validators
│   ├── application/         # Use cases
│   │   ├── use-cases/       # Business operations
│   │   └── providers.ts     # Dependency injection
│   ├── ports/               # Contracts/interfaces
│   ├── adapters/            # External implementations
│   │   ├── fit/             # FIT SDK adapter
│   │   └── logger/          # Logger implementations
│   ├── tests/               # Test utilities
│   │   ├── fixtures/        # Test data factories
│   │   ├── helpers/         # Test utilities
│   │   └── round-trip/      # Round-trip validation
│   └── index.ts             # Public API exports
├── schema/                  # Generated JSON schemas
├── scripts/                 # Build scripts
│   └── generate-schema.ts   # Zod → JSON Schema
├── dist/                    # Build output (gitignored)
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

## Components and Interfaces

### 1. Public API Surface (`src/index.ts`)

**Current State:** Already exports comprehensive API

**Improvements Needed:**

- Add JSDoc comments to all exports
- Group exports by category with comments
- Ensure all exports have proper type definitions

**Example:**

````typescript
/**
 * @kaiord/core - Public API
 * Bidirectional conversion between FIT workout files and KRD format
 */

// ============================================
// Domain Schemas
// ============================================

/**
 * KRD schema for validating workout data in Kaiord format.
 * Use with .parse() for validation or .safeParse() for error handling.
 *
 * @example
 * ```typescript
 * import { krdSchema } from '@kaiord/core';
 *
 * const result = krdSchema.safeParse(data);
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 */
export { krdSchema } from "./domain/schemas/krd";

/**
 * TypeScript type for KRD workout data, inferred from krdSchema.
 */
export type { KRD } from "./domain/schemas/krd";

// ... more exports with JSDoc
````

### 2. README Documentation

**Structure:**

```markdown
# @kaiord/core

> Core library for Kaiord workout data conversion

## Installation

\`\`\`bash
npm install @kaiord/core
\`\`\`

## Quick Start

\`\`\`typescript
import { createDefaultProviders } from '@kaiord/core';

const providers = createDefaultProviders();
const krd = await providers.convertFitToKrd({ fitBuffer });
\`\`\`

## Features

- ✅ Bidirectional FIT ↔ KRD conversion
- ✅ Schema validation with Zod
- ✅ Round-trip validation with tolerances
- ✅ Full TypeScript support
- ✅ Tree-shakeable ESM exports
- ✅ Dependency injection for custom providers

## API Documentation

### Converting FIT to KRD

[Detailed examples]

### Converting KRD to FIT

[Detailed examples]

### Custom Loggers

[Examples]

### Round-trip Validation

[Examples]

### Error Handling

[Examples for each error type]

## TypeScript Support

[Type examples]

## Architecture

[Link to architecture docs]

## Contributing

[Link to CONTRIBUTING.md]

## License

MIT
```

### 3. API Examples Document

Create `docs/api-examples.md` with comprehensive examples:

```typescript
// Example 1: Basic FIT to KRD conversion
import { createDefaultProviders } from "@kaiord/core";
import { readFile } from "fs/promises";

const fitBuffer = await readFile("workout.fit");
const providers = createDefaultProviders();
const krd = await providers.convertFitToKrd({ fitBuffer });

console.log(krd.version); // "1.0"
console.log(krd.type); // "workout"

// Example 2: KRD to FIT conversion
const fitBuffer = await providers.convertKrdToFit({ krd });
await writeFile("output.fit", fitBuffer);

// Example 3: Custom logger
import { createDefaultProviders } from "@kaiord/core";
import type { Logger } from "@kaiord/core";

const customLogger: Logger = {
  debug: (msg, ctx) => console.debug(msg, ctx),
  info: (msg, ctx) => console.info(msg, ctx),
  warn: (msg, ctx) => console.warn(msg, ctx),
  error: (msg, ctx) => console.error(msg, ctx),
};

const providers = createDefaultProviders(customLogger);

// Example 4: Round-trip validation
import { validateRoundTrip, DEFAULT_TOLERANCES } from "@kaiord/core";

try {
  await validateRoundTrip(
    fitReader,
    fitWriter,
    validator,
    toleranceChecker,
    logger
  )({ fitBuffer });
  console.log("✓ Round-trip validation passed");
} catch (error) {
  if (error instanceof ToleranceExceededError) {
    console.error("Tolerance violations:", error.violations);
  }
}

// Example 5: Custom tolerances
import { createToleranceChecker, toleranceConfigSchema } from "@kaiord/core";

const customTolerances = toleranceConfigSchema.parse({
  time: { absolute: 2, percentage: 0 }, // ±2 seconds
  power: { absolute: 2, percentage: 1 }, // ±2W or ±1%
});

const checker = createToleranceChecker(customTolerances);

// Example 6: Schema validation
import { krdSchema, type KRD } from "@kaiord/core";

const result = krdSchema.safeParse(data);
if (!result.success) {
  console.error("Validation errors:", result.error.errors);
} else {
  const krd: KRD = result.data;
}

// Example 7: Error handling
import {
  FitParsingError,
  KrdValidationError,
  ToleranceExceededError,
} from "@kaiord/core";

try {
  const krd = await providers.convertFitToKrd({ fitBuffer });
} catch (error) {
  if (error instanceof FitParsingError) {
    console.error("Failed to parse FIT file:", error.message);
    console.error("Cause:", error.cause);
  } else if (error instanceof KrdValidationError) {
    console.error("KRD validation failed:");
    for (const err of error.errors) {
      console.error(`  - ${err.field}: ${err.message}`);
    }
  } else {
    throw error; // Unknown error
  }
}
```

## Data Models

### Package.json Configuration

```json
{
  "name": "@kaiord/core",
  "version": "0.1.0",
  "description": "Core library for Kaiord workout data conversion",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist", "schema", "README.md", "LICENSE"],
  "scripts": {
    "generate:schema": "tsx scripts/generate-schema.ts",
    "prebuild": "pnpm run generate:schema",
    "build": "pnpm run generate:schema && tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest --run --coverage",
    "lint": "eslint .",
    "clean": "rm -rf dist",
    "prepublishOnly": "pnpm run lint && pnpm run test && pnpm run build",
    "pack:test": "pnpm pack && echo 'Test with: npm install kaiord-core-*.tgz'",
    "check:licenses": "license-checker --onlyAllow 'MIT;Apache-2.0;BSD;ISC;0BSD;BSD-2-Clause;BSD-3-Clause'"
  },
  "keywords": [
    "workout",
    "fit",
    "garmin",
    "tcx",
    "zwo",
    "krd",
    "fitness",
    "training",
    "conversion"
  ],
  "author": "Pablo Albaladejo",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/pablo-albaladejo/kaiord.git",
    "directory": "packages/core"
  },
  "bugs": {
    "url": "https://github.com/pablo-albaladejo/kaiord/issues"
  },
  "homepage": "https://github.com/pablo-albaladejo/kaiord#readme",
  "dependencies": {
    "@garmin/fitsdk": "^21.141.0",
    "zod": "^3.22.4",
    "zod-to-json-schema": "^3.22.4"
  },
  "devDependencies": {
    "@faker-js/faker": "^8.4.0",
    "@types/node": "^20.11.0",
    "@types/rosie": "^0.0.45",
    "@vitest/coverage-v8": "^1.2.0",
    "license-checker": "^25.0.1",
    "rosie": "^2.1.1",
    "tsup": "^8.0.1",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"
  }
}
```

### TSConfig Configuration

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["src/**/*.test.ts", "src/tests/**/*"]
}
```

### TSUp Configuration

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  minify: false, // Keep readable for debugging
});
```

## Testing Strategy

### 1. Local Package Testing

**npm pack workflow:**

```bash
# 1. Build the package
pnpm run build

# 2. Create tarball
pnpm pack
# Creates: kaiord-core-0.1.0.tgz

# 3. Inspect tarball contents
tar -tzf kaiord-core-0.1.0.tgz

# 4. Create test project
mkdir test-project && cd test-project
npm init -y

# 5. Install from tarball
npm install ../kaiord-core-0.1.0.tgz

# 6. Test imports
cat > test.ts << 'EOF'
import { createDefaultProviders } from '@kaiord/core';
console.log('Import successful!');
EOF

npx tsx test.ts
```

**npm link workflow:**

```bash
# In @kaiord/core
pnpm link --global

# In consuming package (CLI)
pnpm link --global @kaiord/core

# Make changes to core
# Changes are immediately available in CLI

# Unlink when done
pnpm unlink --global @kaiord/core
```

### 2. Workspace Testing

**pnpm workspace protocol:**

```json
// packages/cli/package.json
{
  "dependencies": {
    "@kaiord/core": "workspace:^"
  }
}
```

**Benefits:**

- Automatic linking during development
- Type definitions work immediately
- No need for manual linking
- Correct dependency resolution on publish

### 3. Pre-publish Checks

**prepublishOnly script:**

```json
{
  "scripts": {
    "prepublishOnly": "pnpm run lint && pnpm run test && pnpm run build"
  }
}
```

**What it does:**

1. Runs ESLint to catch code quality issues
2. Runs all tests to ensure functionality
3. Builds the package to generate dist/
4. Exits with error if any step fails
5. Prevents publishing broken packages

### 4. License Checking

**license-checker tool:**

```bash
# Install
pnpm add -D license-checker

# Check licenses
pnpm run check:licenses

# Output shows all dependencies and their licenses
# Fails if any dependency has incompatible license
```

**Allowed licenses:**

- MIT
- Apache-2.0
- BSD (all variants)
- ISC
- 0BSD

**Blocked licenses:**

- GPL (any version)
- AGPL (any version)
- LGPL (any version)
- Commercial/proprietary licenses

## Publishing Workflow

### 1. Pre-publish Checklist

```bash
# 1. Ensure all tests pass
pnpm run test

# 2. Check license compatibility
pnpm run check:licenses

# 3. Build the package
pnpm run build

# 4. Test locally with pack
pnpm run pack:test

# 5. Dry-run publish
npm publish --dry-run

# 6. Review what would be published
# Check that only dist/, schema/, README, LICENSE are included
```

### 2. Version Management

```bash
# Patch version (0.1.0 → 0.1.1)
npm version patch

# Minor version (0.1.0 → 0.2.0)
npm version minor

# Major version (0.1.0 → 1.0.0)
npm version major

# npm version automatically:
# - Runs prepublishOnly (tests + build)
# - Updates package.json version
# - Creates git commit
# - Creates git tag
```

### 3. Publishing

```bash
# Publish to npm
npm publish

# Publish with tag (for beta/alpha)
npm publish --tag beta

# Verify published package
npm view @kaiord/core
```

### 4. Post-publish Verification

```bash
# Install published package in test project
mkdir test-published && cd test-published
npm init -y
npm install @kaiord/core

# Test imports
cat > test.ts << 'EOF'
import { createDefaultProviders, type KRD } from '@kaiord/core';
const providers = createDefaultProviders();
console.log('✓ Package works!');
EOF

npx tsx test.ts
```

## Documentation Structure

```
packages/core/
├── README.md                    # Main documentation
├── LICENSE                      # MIT license
├── CONTRIBUTING.md              # Contribution guidelines
└── docs/
    ├── api-examples.md          # Comprehensive API examples
    ├── architecture.md          # Architecture overview
    ├── error-handling.md        # Error handling guide
    ├── typescript-guide.md      # TypeScript usage guide
    └── publishing.md            # Publishing workflow
```

## Implementation Notes

### JSDoc Best Practices

````typescript
/**
 * Converts a FIT workout file to KRD format.
 *
 * @param fitBuffer - Binary FIT file data as Uint8Array
 * @returns Promise resolving to validated KRD object
 * @throws {FitParsingError} When FIT file is corrupted or invalid
 * @throws {KrdValidationError} When converted data fails KRD schema validation
 *
 * @example
 * ```typescript
 * import { createDefaultProviders } from '@kaiord/core';
 * import { readFile } from 'fs/promises';
 *
 * const fitBuffer = await readFile('workout.fit');
 * const providers = createDefaultProviders();
 * const krd = await providers.convertFitToKrd({ fitBuffer });
 * ```
 */
````

### Tree-shaking Support

Ensure all exports are ESM-compatible:

```typescript
// ✅ Good - Named exports (tree-shakeable)
export { convertFitToKrd } from "./application/use-cases/convert-fit-to-krd";
export type { ConvertFitToKrd } from "./application/use-cases/convert-fit-to-krd";

// ❌ Bad - Default exports (not tree-shakeable)
export default { convertFitToKrd, convertKrdToFit };
```

### Source Maps

Enable source maps for debugging:

```typescript
// tsup.config.ts
export default defineConfig({
  sourcemap: true, // Generate .map files
});
```

Users can debug into the library code with proper source mapping.

## Design Decisions

### Why not bundle dependencies?

**Rationale:**

- Allows consumers to deduplicate dependencies
- Respects license boundaries
- Reduces package size
- Enables security updates without republishing

### Why ESM only?

**Rationale:**

- Modern standard (Node 20+)
- Better tree-shaking
- Simpler configuration
- Future-proof

### Why Zod for schemas?

**Rationale:**

- Runtime validation + TypeScript types
- JSON Schema generation
- Excellent error messages
- Wide adoption

### Why not minify?

**Rationale:**

- Easier debugging for consumers
- Source maps work better
- Consumers can minify if needed
- Negligible size difference for library

## Future Enhancements

- **API Documentation Site**: Generate docs with TypeDoc
- **Changelog Automation**: Use conventional commits + standard-version
- **Bundle Size Monitoring**: Track bundle size in CI
- **Performance Benchmarks**: Track conversion performance over time
- **Additional Formats**: TCX and ZWO support
