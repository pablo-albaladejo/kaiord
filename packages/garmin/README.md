# @kaiord/garmin

[![npm version](https://img.shields.io/npm/v/@kaiord/garmin.svg)](https://www.npmjs.com/package/@kaiord/garmin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Garmin Connect API format adapter for the Kaiord health & fitness data framework. Provides bidirectional conversion between Garmin Connect workout JSON format and KRD.

## Installation

```bash
pnpm add @kaiord/core @kaiord/garmin
```

## Usage

### With Core Providers (Recommended)

```typescript
import { createDefaultProviders } from "@kaiord/core";
import { createGarminProviders } from "@kaiord/garmin";

const providers = createDefaultProviders({
  garmin: createGarminProviders(),
});

// Garmin to KRD
const krd = await providers.convertGarminToKrd!({ garminString });

// KRD to Garmin
const garminString = await providers.convertKrdToGarmin!({ krd });
```

### Standalone Adapter Access

```typescript
import {
  createGarminConnectReader,
  createGarminConnectWriter,
} from "@kaiord/garmin";
import { createConsoleLogger } from "@kaiord/core";

const logger = createConsoleLogger();
const reader = createGarminConnectReader(logger);
const writer = createGarminConnectWriter(logger);
```

## API

### `createGarminProviders(logger?: Logger): GarminProviders`

Creates Garmin adapter instances for use with `createDefaultProviders()`.

### `createGarminConnectReader(logger: Logger): GarminReader`

Creates a Garmin Connect JSON reader.

### `createGarminConnectWriter(logger: Logger): GarminWriter`

Creates a Garmin Connect JSON writer.

## Supported Garmin Features

- Workout definitions with structured steps
- Power, heart rate, speed, and cadence targets
- Time-based, distance-based, and calorie-based durations
- Repeat blocks (intervals)
- Multiple sport types
- Custom step names and notes

## License

MIT
