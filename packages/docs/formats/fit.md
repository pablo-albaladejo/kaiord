---
title: "FIT Format"
description: "Read and write Garmin FIT workout files using @kaiord/fit. Supports workouts, activities, courses, laps, records, and events."
---

# FIT Format

The `@kaiord/fit` package provides reading and writing of Garmin FIT workout files using the official Garmin FIT SDK.

## Installation

```bash
pnpm add @kaiord/core @kaiord/fit
```

## Usage

### Pre-built adapters

```ts twoslash
import { fromBinary, toBinary } from "@kaiord/core";
import { fitReader, fitWriter } from "@kaiord/fit";
import { readFile, writeFile } from "node:fs/promises";

// FIT to KRD
const buffer = await readFile("workout.fit");
const krd = await fromBinary(new Uint8Array(buffer), fitReader);

// KRD to FIT
const fitBuffer = await toBinary(krd, fitWriter);
await writeFile("output.fit", fitBuffer);
```

### Factory with custom logger

```ts twoslash
import { createConsoleLogger } from "@kaiord/core";
import { createFitReader, createFitWriter } from "@kaiord/fit";

const logger = createConsoleLogger();
const reader = createFitReader(logger);
const writer = createFitWriter(logger);
```

## API

| Function | Description |
| --- | --- |
| `fitReader` | Pre-built FIT binary reader |
| `fitWriter` | Pre-built FIT binary writer |
| `createFitReader(logger?)` | Factory for FIT reader with optional logger |
| `createFitWriter(logger?)` | Factory for FIT writer with optional logger |

## Supported features

- Workout files (structured workout steps)
- Activity files (recorded activity data)
- Course files (GPS routes)
- Lap messages
- Record messages (time-series data)
- Event messages
- Session and activity metadata
- Developer fields (preserved in `extensions.fit`)
- Unknown messages (preserved in `extensions.fit`)

## FIT-specific notes

FIT is Garmin's binary protocol. When converting FIT to KRD:

- Duration values are converted from milliseconds to seconds
- Power targets with Garmin's +1000 offset are normalized
- Sub-sport values are mapped from camelCase to snake_case
- Developer fields and unknown messages are preserved in `extensions.fit`

Ready to convert? Follow the [Quick Start](/guide/quick-start).
