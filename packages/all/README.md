# @kaiord/all

[![npm version](https://img.shields.io/npm/v/@kaiord/all.svg)](https://www.npmjs.com/package/@kaiord/all)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Meta-package that includes all Kaiord format adapters (FIT, TCX, ZWO) for backward compatibility. This is the simplest way to get all conversion capabilities.

## Installation

```bash
pnpm add @kaiord/all
```

This single install gives you FIT, TCX, and ZWO support.

## Usage

```typescript
import { createAllProviders } from "@kaiord/all";
import type { KRD } from "@kaiord/all";

const providers = createAllProviders();

// FIT to KRD
const krd: KRD = await providers.convertFitToKrd!({ fitBuffer });

// KRD to TCX
const tcxString = await providers.convertKrdToTcx!({ krd });

// KRD to ZWO
const zwoString = await providers.convertKrdToZwift!({ krd });
```

## What is Included

This package re-exports everything from:

- `@kaiord/core` - Domain types, schemas, validation, use cases
- `@kaiord/fit` - FIT format adapter (Garmin FIT SDK)
- `@kaiord/tcx` - TCX format adapter (fast-xml-parser)
- `@kaiord/zwo` - ZWO format adapter (fast-xml-parser, XSD validation)

## When to Use @kaiord/all vs Selective Installation

| Scenario            | Recommendation                                 |
| ------------------- | ---------------------------------------------- |
| Need all formats    | Use `@kaiord/all`                              |
| Bundle size matters | Use `@kaiord/core` + specific adapters         |
| Only need FIT       | `@kaiord/core` + `@kaiord/fit`                 |
| Only need TCX + ZWO | `@kaiord/core` + `@kaiord/tcx` + `@kaiord/zwo` |
| Migrating from v1.x | Use `@kaiord/all` for easiest migration        |

## Migrating from @kaiord/core v1.x

See the [Migration Guide](../../docs/migration-v2.md) for detailed instructions.

Quick summary:

```bash
pnpm remove @kaiord/core
pnpm add @kaiord/all
```

```typescript
// Before
import { createDefaultProviders } from "@kaiord/core";

// After
import { createAllProviders } from "@kaiord/all";
```

## License

MIT
