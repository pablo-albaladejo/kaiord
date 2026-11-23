# @kaiord/garmin

[![npm version](https://img.shields.io/npm/v/@kaiord/garmin.svg)](https://www.npmjs.com/package/@kaiord/garmin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Garmin Connect API format adapter for the Kaiord SDK. Provides bidirectional conversion between Garmin Connect workout JSON format and KRD.

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

- Round-trip tested: converting GCN → KRD → GCN keeps every value of a
  running, cycling, swimming or cardio workout within the declared tolerances
  (time ±1 s, distance ±1 m, power ±1 W or ±1 % FTP, heart rate ±1 bpm,
  cadence ±1 rpm, pace ±0.01 m/s).
- Fields GCN cannot carry: a single target value, which is sent as a band and
  comes back as that range; power as a share of FTP and heart rate as a share
  of maximum, which are sent in watts and bpm; pace zones; heart-rate, power
  and repeat-until durations; step names; the sub-sport; the created date; the interval and other intensities, which come back as active; a second target on a step; the count of a repeat inside a repeat; a step that ends after a number of repetitions, read as a lap-button step; strength and multi-sport workouts, read as generic; a workout name beyond 255 characters.

## License

MIT
