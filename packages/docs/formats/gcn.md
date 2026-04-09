---
title: "GCN Format (Garmin Connect)"
description: "Convert between Garmin Connect workout JSON and KRD using @kaiord/garmin. Bidirectional conversion for the Garmin Connect API."
---

# GCN Format (Garmin Connect)

The `@kaiord/garmin` package provides bidirectional conversion between Garmin Connect workout JSON format and KRD.

## Installation

```bash
pnpm add @kaiord/core @kaiord/garmin
```

## Usage

### Pre-built adapters

```ts twoslash
import { fromText, toText } from "@kaiord/core";
import { garminReader, garminWriter } from "@kaiord/garmin";
import { readFile, writeFile } from "node:fs/promises";

// GCN to KRD
const gcnContent = await readFile("workout.gcn", "utf-8");
const krd = await fromText(gcnContent, garminReader);

// KRD to GCN
const gcnString = await toText(krd, garminWriter);
await writeFile("output.gcn", gcnString);
```

### Factory with custom logger

```ts twoslash
import { createConsoleLogger } from "@kaiord/core";
import { createGarminReader, createGarminWriter } from "@kaiord/garmin";

const logger = createConsoleLogger();
const reader = createGarminReader(logger);
const writer = createGarminWriter(logger);
```

## API

| Function | Description |
| --- | --- |
| `garminReader` | Pre-built GCN text reader |
| `garminWriter` | Pre-built GCN text writer |
| `createGarminReader(logger?)` | Factory for GCN reader with optional logger |
| `createGarminWriter(logger?)` | Factory for GCN writer with optional logger |

## Supported features

- Workout definitions with structured steps
- Power, heart rate, speed, and cadence targets
- Time-based, distance-based, and calorie-based durations
- Repeat blocks (intervals)
- Multiple sport types
- Custom step names and notes

## GCN-specific notes

GCN is Garmin Connect's JSON format for workouts. When working with GCN:

- Target values use explicit `targetValueOne`/`targetValueTwo` (not `zoneNumber`)
- Pace targets use meters per second
- Heart rate targets use bpm values
- Power targets use watts

## Garmin Connect API

To push workouts to Garmin Connect, use `@kaiord/garmin-connect` which handles SSO authentication and the workout API. See the [CLI garmin command](/cli/commands#garmin) for command-line usage.

Ready to convert? Follow the [Quick Start](/guide/quick-start).
