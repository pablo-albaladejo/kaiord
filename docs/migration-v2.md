# Migration Guide: v1.x to v2.0

This guide covers migrating from `@kaiord/core` v1.x (monolithic) to the v2.0 modular package architecture.

## What Changed

In v1.x, `@kaiord/core` contained all format adapters (FIT, TCX, ZWO) and their dependencies. In v2.0, adapters have been extracted into separate packages:

| Package | Description | Key Dependencies |
|---------|-------------|-----------------|
| `@kaiord/core` | Domain types, schemas, ports, use cases | `zod` |
| `@kaiord/fit` | FIT format adapter | `@garmin/fitsdk` |
| `@kaiord/tcx` | TCX format adapter | `fast-xml-parser` |
| `@kaiord/zwo` | ZWO format adapter | `fast-xml-parser`, `xsd-schema-validator` |
| `@kaiord/all` | Meta-package (backward compatibility) | All of the above |

## Migration Path 1: Zero-Change (Recommended for Quick Migration)

Replace `@kaiord/core` with `@kaiord/all` for identical behavior:

```bash
# Remove old package
pnpm remove @kaiord/core

# Install meta-package
pnpm add @kaiord/all
```

Update your imports:

```typescript
// Before (v1.x)
import { createDefaultProviders } from "@kaiord/core";

// After (v2.0) - use createAllProviders from @kaiord/all
import { createAllProviders } from "@kaiord/all";

const providers = createAllProviders();
```

All domain types, schemas, and error classes are re-exported from `@kaiord/all`, so other imports remain unchanged:

```typescript
// These imports work from both @kaiord/core and @kaiord/all
import type { KRD, Workout, Duration } from "@kaiord/all";
import { krdSchema, sportSchema } from "@kaiord/all";
```

## Migration Path 2: Selective Installation (Smaller Bundles)

Install only the formats you need:

```bash
# Core + FIT only
pnpm add @kaiord/core @kaiord/fit

# Core + TCX + ZWO (no FIT SDK)
pnpm add @kaiord/core @kaiord/tcx @kaiord/zwo

# All formats
pnpm add @kaiord/core @kaiord/fit @kaiord/tcx @kaiord/zwo
```

Wire adapters explicitly:

```typescript
import { createDefaultProviders } from "@kaiord/core";
import { createFitProviders } from "@kaiord/fit";
import { createTcxProviders } from "@kaiord/tcx";

// Only FIT and TCX - ZWO omitted to save bundle size
const providers = createDefaultProviders({
  fit: createFitProviders(),
  tcx: createTcxProviders(),
});

// Use cases are only available for installed adapters
const krd = await providers.convertFitToKrd!({ fitBuffer });
const tcx = await providers.convertKrdToTcx!({ krd });

// providers.convertZwiftToKrd is undefined (ZWO not installed)
```

## Breaking Changes

### 1. `createDefaultProviders()` Signature

```typescript
// v1.x - No arguments needed, all adapters built-in
const providers = createDefaultProviders();
providers.convertFitToKrd({ fitBuffer }); // Always available

// v2.0 - Accepts optional adapters parameter
const providers = createDefaultProviders(adapters?, logger?);
// Without adapters, conversion use cases are undefined
```

### 2. Provider Properties Are Optional

In v1.x, all provider properties were always defined. In v2.0, adapter-specific properties are optional:

```typescript
// v2.0 - Must handle optional properties
const providers = createDefaultProviders({ fit: createFitProviders() });

// These are defined (FIT was provided)
providers.fitReader;     // FitReader
providers.convertFitToKrd;  // ConvertFitToKrd

// These are undefined (TCX/ZWO not provided)
providers.tcxReader;     // undefined
providers.convertTcxToKrd;  // undefined
```

### 3. Direct Adapter Imports Moved

```typescript
// v1.x - Import from core internals (not recommended but possible)
import { createGarminFitSdkReader } from "@kaiord/core/dist/adapters/fit/garmin-fitsdk";

// v2.0 - Import from adapter package
import { createGarminFitSdkReader } from "@kaiord/fit";
```

## Bundle Size Comparison

| Installation | Approximate Size |
|-------------|-----------------|
| `@kaiord/core` v1.x | ~22 MB (includes all adapters) |
| `@kaiord/core` v2.0 alone | ~2 MB (domain + schemas only) |
| `@kaiord/core` + `@kaiord/fit` | ~21 MB (FIT SDK is large) |
| `@kaiord/core` + `@kaiord/tcx` + `@kaiord/zwo` | ~5 MB (no FIT SDK) |
| `@kaiord/all` | ~22 MB (same as v1.x) |

## Examples

### Before (v1.x)

```typescript
import { createDefaultProviders } from "@kaiord/core";
import type { KRD } from "@kaiord/core";

const providers = createDefaultProviders();
const krd: KRD = await providers.convertFitToKrd({ fitBuffer });
const tcxString = await providers.convertKrdToTcx({ krd });
```

### After (v2.0 with @kaiord/all)

```typescript
import { createAllProviders } from "@kaiord/all";
import type { KRD } from "@kaiord/all";

const providers = createAllProviders();
const krd: KRD = await providers.convertFitToKrd!({ fitBuffer });
const tcxString = await providers.convertKrdToTcx!({ krd });
```

### After (v2.0 with Selective Installation)

```typescript
import { createDefaultProviders } from "@kaiord/core";
import { createFitProviders } from "@kaiord/fit";
import { createTcxProviders } from "@kaiord/tcx";
import type { KRD } from "@kaiord/core";

const providers = createDefaultProviders({
  fit: createFitProviders(),
  tcx: createTcxProviders(),
});

const krd: KRD = await providers.convertFitToKrd!({ fitBuffer });
const tcxString = await providers.convertKrdToTcx!({ krd });
```
