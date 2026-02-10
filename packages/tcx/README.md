# @kaiord/tcx

[![npm version](https://img.shields.io/npm/v/@kaiord/tcx.svg)](https://www.npmjs.com/package/@kaiord/tcx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TCX format adapter for the Kaiord health & fitness data framework. Provides reading, writing, and XSD validation of Garmin Training Center XML files.

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

- Workout definitions with structured steps
- Heart rate, speed, and cadence targets
- Time-based and distance-based durations
- Repeat blocks (intervals)
- Multiple sport types

## License

MIT
