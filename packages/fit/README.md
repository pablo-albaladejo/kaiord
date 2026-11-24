# @kaiord/fit

[![npm version](https://img.shields.io/npm/v/@kaiord/fit.svg)](https://www.npmjs.com/package/@kaiord/fit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

FIT format adapter for the Kaiord SDK. Provides reading and writing of Garmin FIT workout files using the official Garmin FIT SDK.

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
import {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "@kaiord/fit";
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

- Reads FIT workout, activity and health files into KRD, and writes FIT
  workouts.
- Round-trip tested: converting FIT → KRD → FIT keeps every value of a
  workout within the declared tolerances (time ±1 s, distance ±1 m, power ±1 W or ±1 % FTP, heart rate ±1 bpm,
  cadence ±1 rpm, pace ±0.01 m/s), for every duration, target,
  intensity and sport.
- Fields FIT cannot carry: the step numbers after a repeat block, which FIT renumbers; notes beyond the 254 bytes of a FIT string; the name of a repeat step; a custom heart-rate range given as a share of maximum, which is read as bpm.

## License

The code of `@kaiord/fit` is licensed under the MIT license.

It depends on Garmin's FIT SDK, `@garmin/fitsdk`, which Garmin licenses under its own [Flexible and Interoperable Data Transfer (FIT) Protocol License Agreement](https://github.com/garmin/fit-javascript-sdk/blob/main/LICENSE.txt), not under MIT.

Installing `@kaiord/fit` installs `@garmin/fitsdk`, and that agreement says that using the SDK means agreeing to its terms.
