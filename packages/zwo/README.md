# @kaiord/zwo

[![npm version](https://img.shields.io/npm/v/@kaiord/zwo.svg)](https://www.npmjs.com/package/@kaiord/zwo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

ZWO format adapter for the Kaiord health & fitness data framework. Provides reading, writing, and validation of Zwift workout XML files.

## Installation

```bash
pnpm add @kaiord/core @kaiord/zwo
```

## Usage

### With Core Providers (Recommended)

```typescript
import { createDefaultProviders } from "@kaiord/core";
import { createZwoProviders } from "@kaiord/zwo";

const providers = createDefaultProviders({
  zwo: createZwoProviders(),
});

// ZWO to KRD
const krd = await providers.convertZwiftToKrd!({ zwiftString });

// KRD to ZWO
const zwoString = await providers.convertKrdToZwift!({ krd });
```

### Standalone Adapter Access

```typescript
import {
  createFastXmlZwiftReader,
  createFastXmlZwiftWriter,
  createZwiftValidator,
} from "@kaiord/zwo";
import { createConsoleLogger } from "@kaiord/core";

const logger = createConsoleLogger();
const validator = createZwiftValidator(logger);
const reader = createFastXmlZwiftReader(logger, validator);
const writer = createFastXmlZwiftWriter(logger, validator);
```

## API

### `createZwoProviders(logger?: Logger): ZwoProviders`

Creates ZWO adapter instances for use with `createDefaultProviders()`.

### `createFastXmlZwiftReader(logger: Logger, validator: ZwiftValidator): ZwiftReader`

Creates a ZWO file reader using fast-xml-parser.

### `createFastXmlZwiftWriter(logger: Logger, validator: ZwiftValidator): ZwiftWriter`

Creates a ZWO file writer using fast-xml-parser.

### `createZwiftValidator(logger: Logger): ZwiftValidator`

Creates a validator that uses XSD validation in Node.js and well-formedness checking in browsers.

### `createXsdZwiftValidator(logger: Logger): ZwiftValidator`

Creates a strict XSD schema validator (Node.js only).

## Supported ZWO Features

- SteadyState intervals
- Warmup and Cooldown ramps
- IntervalsT (structured intervals)
- FreeRide segments
- Power targets (FTP percentage)
- Heart rate and cadence targets
- Text events

## License

MIT
