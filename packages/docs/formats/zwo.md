---
title: "ZWO Format"
description: "Read, write, and validate Zwift workout XML files using @kaiord/zwo. Supports all ZWO interval types and power targets."
---

# ZWO Format

The `@kaiord/zwo` package provides reading, writing, and validation of Zwift workout XML files.

## Installation

```bash
pnpm add @kaiord/core @kaiord/zwo
```

## Usage

### Pre-built adapters

```ts twoslash
import { fromText, toText } from "@kaiord/core";
import { zwiftReader, zwiftWriter } from "@kaiord/zwo";
import { readFile, writeFile } from "node:fs/promises";

// ZWO to KRD
const zwoContent = await readFile("workout.zwo", "utf-8");
const krd = await fromText(zwoContent, zwiftReader);

// KRD to ZWO
const zwoString = await toText(krd, zwiftWriter);
await writeFile("output.zwo", zwoString);
```

### Factory with custom logger

```ts twoslash
import { createConsoleLogger } from "@kaiord/core";
import { createZwiftReader, createZwiftWriter } from "@kaiord/zwo";

const logger = createConsoleLogger();
const reader = createZwiftReader(logger);
const writer = createZwiftWriter(logger);
```

## API

| Function | Description |
| --- | --- |
| `zwiftReader` | Pre-built ZWO text reader |
| `zwiftWriter` | Pre-built ZWO text writer |
| `createZwiftReader(logger?)` | Factory for ZWO reader with optional logger |
| `createZwiftWriter(logger?)` | Factory for ZWO writer with optional logger |
| `createZwiftValidator(logger)` | XSD validator (Node.js) or well-formedness checker (browser) |

## Supported features

- SteadyState intervals
- Warmup and Cooldown ramps
- IntervalsT (structured intervals)
- FreeRide segments
- Power targets (FTP percentage)
- Heart rate and cadence targets
- Text events

## ZWO-specific notes

When converting ZWO to KRD:

- Power targets are expressed as FTP percentage (Zwift's native unit)
- Heart rate targets have limited support in ZWO format
- Distance-based durations may be converted to time-based
- Original ZWO-specific data is preserved in `extensions.zwift`

Ready to convert? Follow the [Quick Start](/guide/quick-start).
