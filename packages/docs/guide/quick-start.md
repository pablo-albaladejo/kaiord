---
title: "Quick Start"
description: "Convert a Garmin FIT file to TCX in 4 lines of TypeScript using Kaiord. Install, convert, done in under 5 minutes."
---

# Quick Start

By the end of this guide, you'll convert a Garmin FIT file to TCX in 4 lines of TypeScript.

## Prerequisites

- Node.js 20+ (24 recommended)
- pnpm 9.15+

## 1. Install packages

```bash
pnpm add @kaiord/core @kaiord/fit @kaiord/tcx
```

## 2. Create `convert.ts`

```ts twoslash
import { fromBinary, toBinary, toText } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";
import { tcxWriter } from "@kaiord/tcx";
import { readFile, writeFile } from "node:fs/promises";

// Read a FIT file
const buffer = await readFile("workout.fit");

// Convert FIT -> KRD (canonical format) -> TCX
const krd = await fromBinary(new Uint8Array(buffer), fitReader);
const tcx = await toText(krd, tcxWriter);

// Write the result
await writeFile("workout.tcx", tcx);
```

## 3. Run it

```bash
npx tsx convert.ts
```

Your `workout.tcx` file is ready.

## What just happened?

1. `fromBinary` parsed the FIT file into **KRD**, Kaiord's canonical JSON format.
2. `toText` serialized the KRD data into TCX XML.
3. All type information was preserved through the conversion.

KRD acts as the universal intermediate format. Every conversion goes through it:

```
FIT ──> KRD ──> TCX
FIT ──> KRD ──> ZWO
TCX ──> KRD ──> FIT
```

## 4. Inspect the KRD data

```ts twoslash
import { fromBinary } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";
import { readFile } from "node:fs/promises";

const buffer = await readFile("workout.fit");
const krd = await fromBinary(new Uint8Array(buffer), fitReader);

// KRD is a typed object you can inspect
console.log(krd.metadata.sport);
console.log(krd.version);
```

## 5. Try the CLI instead

No code needed -- install the CLI and convert from your terminal:

```bash
pnpm add -g @kaiord/cli
kaiord convert -i workout.fit -o workout.tcx
```

## Next steps

- [Why Kaiord?](/guide/why-kaiord) -- understand the problem Kaiord solves
- [Formats](/formats/krd) -- learn about KRD and supported formats
- [Architecture](/guide/architecture) -- how the hexagonal architecture works
- [CLI Reference](/cli/commands) -- all CLI commands and options
