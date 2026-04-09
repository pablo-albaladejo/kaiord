---
title: "TCX Format"
description: "Read, write, and validate Garmin Training Center XML files using @kaiord/tcx. Includes XSD schema validation."
---

# TCX Format

The `@kaiord/tcx` package provides reading, writing, and XSD validation of Garmin Training Center XML files.

## Installation

```bash
pnpm add @kaiord/core @kaiord/tcx
```

## Usage

### Pre-built adapters

```ts twoslash
import { fromText, toText } from "@kaiord/core";
import { tcxReader, tcxWriter } from "@kaiord/tcx";
import { readFile, writeFile } from "node:fs/promises";

// TCX to KRD
const tcxContent = await readFile("workout.tcx", "utf-8");
const krd = await fromText(tcxContent, tcxReader);

// KRD to TCX
const tcxString = await toText(krd, tcxWriter);
await writeFile("output.tcx", tcxString);
```

### Factory with custom logger

```ts twoslash
import { createConsoleLogger } from "@kaiord/core";
import { createTcxReader, createTcxWriter } from "@kaiord/tcx";

const logger = createConsoleLogger();
const reader = createTcxReader(logger);
const writer = createTcxWriter(logger);
```

### XSD validation

```ts twoslash
import { createConsoleLogger } from "@kaiord/core";
import { createXsdTcxValidator } from "@kaiord/tcx";

const logger = createConsoleLogger();
const validator = createXsdTcxValidator(logger);
```

## API

| Function | Description |
| --- | --- |
| `tcxReader` | Pre-built TCX text reader |
| `tcxWriter` | Pre-built TCX text writer |
| `createTcxReader(logger?)` | Factory for TCX reader with optional logger |
| `createTcxWriter(logger?)` | Factory for TCX writer with optional logger |
| `createXsdTcxValidator(logger)` | XSD schema validator for TCX files |

## Supported features

- Workout definitions with structured steps
- Heart rate, speed, and cadence targets
- Time-based and distance-based durations
- Repeat blocks (intervals)
- Multiple sport types

Ready to convert? Follow the [Quick Start](/guide/quick-start).
