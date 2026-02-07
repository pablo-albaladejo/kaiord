# @kaiord/fit

[![npm version](https://img.shields.io/npm/v/@kaiord/fit.svg)](https://www.npmjs.com/package/@kaiord/fit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

FIT format adapter for Kaiord workout data conversion. Provides reading and writing of Garmin FIT workout files using the official Garmin FIT SDK.

## Installation

```bash
pnpm add @kaiord/core @kaiord/fit
```

## Usage

### With Core Providers (Recommended)

```typescript
import { createDefaultProviders } from "@kaiord/core";
import { createFitProviders } from "@kaiord/fit";

const providers = createDefaultProviders({
  fit: createFitProviders(),
});

// FIT to KRD
const krd = await providers.convertFitToKrd!({ fitBuffer });

// KRD to FIT
const fitBuffer = await providers.convertKrdToFit!({ krd });
```

### Standalone Adapter Access

```typescript
import { createGarminFitSdkReader, createGarminFitSdkWriter } from "@kaiord/fit";
import { createConsoleLogger } from "@kaiord/core";

const logger = createConsoleLogger();
const reader = createGarminFitSdkReader(logger);
const writer = createGarminFitSdkWriter(logger);
```

## API

### `createFitProviders(logger?: Logger): FitProviders`

Creates FIT adapter instances for use with `createDefaultProviders()`.

### `createGarminFitSdkReader(logger: Logger): FitReader`

Creates a FIT file reader using the Garmin FIT SDK.

### `createGarminFitSdkWriter(logger: Logger): FitWriter`

Creates a FIT file writer using the Garmin FIT SDK.

## Supported FIT Features

- Workout files (structured workout steps)
- Activity files (recorded activity data)
- Course files (GPS routes)
- Lap messages
- Record messages (time-series data)
- Event messages
- Session/activity metadata

## License

MIT
