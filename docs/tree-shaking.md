# Tree-Shaking Guide

Kaiord packages are ESM-only and fully tree-shakeable. This guide helps you minimize bundle size.

## Import Patterns

### Named imports (recommended)

```typescript
// Only pulls in what you use
import { krdSchema, sportSchema } from "@kaiord/core";
import type { KRD, Sport } from "@kaiord/core";
```

### Namespace imports (avoid)

```typescript
// Pulls in everything — bundler can't tree-shake
import * as Kaiord from "@kaiord/core";
```

## Separate Type Imports

Types are erased at compile time and add zero bytes. Always use `import type`:

```typescript
import { fromBinary } from "@kaiord/core";
import type { KRD, Logger } from "@kaiord/core";
```

## Install Only What You Need

Each format adapter is a separate package. Install only the formats you convert:

```bash
# Just FIT support
pnpm add @kaiord/core @kaiord/fit

# FIT + TCX
pnpm add @kaiord/core @kaiord/fit @kaiord/tcx
```

## Bundle Size Reference

Approximate sizes (minified + gzipped):

| Import | Size |
|--------|------|
| Types only (`import type`) | 0 KB |
| Schema validation (`krdSchema`) | ~15 KB |
| Full core + one adapter | ~80 KB |
| Test utilities | Not in production bundles |

## Test Utilities

Test utilities are in a separate entry point and won't be included in production bundles:

```typescript
// Separate entry point — not in main bundle
import { loadKrdFixture, buildKRD } from "@kaiord/core/test-utils";
```

## Per-Package Recommendations

| Package | Production Import | Avoid |
|---------|------------------|-------|
| `@kaiord/core` | `fromBinary`, `toText`, schemas | `import *` |
| `@kaiord/fit` | `createFitReader`, `createFitWriter` | Pre-built `fitReader` if you need a custom logger |
| `@kaiord/tcx` | `createTcxReader`, `createTcxWriter` | Same |
| `@kaiord/zwo` | `createZwiftReader`, `createZwiftWriter` | Same |
| `@kaiord/garmin` | `createGarminReader`, `createGarminWriter` | Same |

## Verifying Tree-Shaking

Use the `analyze-bundle` skill or check with:

```bash
pnpm build
du -sh packages/*/dist/
```
