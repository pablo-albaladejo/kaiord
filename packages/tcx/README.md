# @kaiord/tcx

[![npm version](https://img.shields.io/npm/v/@kaiord/tcx.svg)](https://www.npmjs.com/package/@kaiord/tcx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TCX format adapter for the Kaiord SDK. Provides reading, writing, and XSD validation of Garmin Training Center XML files.

## Installation

```bash
pnpm add @kaiord/core @kaiord/tcx
```

## Usage

### With Core Providers (Recommended)

```typescript
import { createDefaultProviders } from "@kaiord/core";
import { createTcxProviders } from "@kaiord/tcx";

const providers = createDefaultProviders({
  tcx: createTcxProviders(),
});

// TCX to KRD
const krd = await providers.convertTcxToKrd!({ tcxString });

// KRD to TCX
const tcxString = await providers.convertKrdToTcx!({ krd });
```

### Standalone Adapter Access

```typescript
import {
  createFastXmlTcxReader,
  createFastXmlTcxWriter,
  createXsdTcxValidator,
} from "@kaiord/tcx";
import { createConsoleLogger } from "@kaiord/core";

const logger = createConsoleLogger();
const reader = createFastXmlTcxReader(logger);
const writer = createFastXmlTcxWriter(logger, createXsdTcxValidator(logger));
const validator = createXsdTcxValidator(logger);
```

## API

### `createTcxProviders(logger?: Logger): TcxProviders`

Creates TCX adapter instances for use with `createDefaultProviders()`.

### `createFastXmlTcxReader(logger: Logger): TcxReader`

Creates a TCX file reader using fast-xml-parser.

### `createFastXmlTcxWriter(logger: Logger, validator: TcxValidator): TcxWriter`

Creates a TCX file writer using fast-xml-parser.

### `createXsdTcxValidator(logger: Logger): TcxValidator`

Creates an XSD schema validator for TCX files.

## Supported TCX Features

- Round-trip tested: converting TCX → KRD → TCX keeps every value of a
  Running, Biking or Other workout within the declared tolerances (time ±1 s, distance ±1 m, power ±1 W or ±1 % FTP, heart rate ±1 bpm,
  cadence ±1 rpm, pace ±0.01 m/s).
- Fields TCX cannot carry: power targets other than a single watt value; a
  single heart rate, which comes back as a range from that value to itself;
  heart rate as a share of maximum; pace zones; repeat-until durations; step
  notes; the sub-sport; the recovery, interval and other intensities.

## License

MIT
