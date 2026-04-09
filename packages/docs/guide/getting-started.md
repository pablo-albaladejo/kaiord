---
title: "Getting Started"
description: "Install Kaiord, convert your first workout file, and learn the basics of the library and CLI tool."
---

# Getting Started with Kaiord

Kaiord is an open-source framework for health and fitness data. It helps you:

- Convert files between formats (FIT, TCX, ZWO, GCN, KRD)
- Read and write health and fitness data in your programs
- Validate and compare files across formats

## Prerequisites

- **Node.js** 20+ (24 recommended) -- [download](https://nodejs.org/)
- **pnpm** package manager -- [install guide](https://pnpm.io/installation)

```bash
node --version  # v20.0.0 or higher
pnpm --version  # 9.15.0 or higher
```

## Installation

### Library

```bash
pnpm add @kaiord/core
```

Add format adapters as needed:

```bash
pnpm add @kaiord/fit @kaiord/tcx @kaiord/zwo @kaiord/garmin
```

### CLI

```bash
pnpm add -g @kaiord/cli
```

Or use without installing:

```bash
pnpx @kaiord/cli --help
```

## Library usage

### Convert FIT to KRD

```ts twoslash
import { fromBinary } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";
import { readFile } from "node:fs/promises";

const buffer = await readFile("workout.fit");
const krd = await fromBinary(new Uint8Array(buffer), fitReader);

console.log(krd.metadata.sport);
```

### Convert KRD to TCX

```ts twoslash
import type { KRD } from "@kaiord/core";
import { toText } from "@kaiord/core";
import { tcxWriter } from "@kaiord/tcx";
import { writeFile } from "node:fs/promises";

declare const krd: KRD;
const tcxString = await toText(krd, tcxWriter);
await writeFile("workout.tcx", tcxString);
```

### Read a Zwift workout

```ts twoslash
import { fromText } from "@kaiord/core";
import { zwiftReader } from "@kaiord/zwo";
import { readFile } from "node:fs/promises";

const zwoContent = await readFile("workout.zwo", "utf-8");
const krd = await fromText(zwoContent, zwiftReader);
```

## CLI usage

```bash
# Convert FIT to KRD
kaiord convert -i workout.fit -o workout.krd

# Convert KRD to TCX
kaiord convert -i workout.krd -o workout.tcx

# Validate round-trip integrity
kaiord validate -i workout.fit

# Inspect a file
kaiord inspect -i workout.fit
```

## Error handling

```ts twoslash
import { fromBinary } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";

declare const buffer: Uint8Array;
try {
  const krd = await fromBinary(buffer, fitReader);
  console.log("Success!");
} catch (error) {
  console.error("Conversion failed:", (error as Error).message);
}
```

## Next steps

- [Architecture Guide](/guide/architecture) -- how Kaiord is built
- [KRD Format](/formats/krd) -- the canonical format specification
- [Testing Guide](/guide/testing) -- testing practices
- [CLI Reference](/cli/commands) -- all commands and options
