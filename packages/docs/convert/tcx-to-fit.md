---
title: "Convert TCX to FIT"
description: "Convert a TCX (Training Center XML) workout to a Garmin FIT file — free and in-browser, or via the Kaiord CLI and TypeScript SDK. Push the result to your Garmin."
---

# Convert TCX to FIT

Turn a **TCX** (Training Center XML) workout into a **Garmin FIT** file so a
plan exported from another platform can run on your Garmin device. Use the free,
in-browser [Kaiord Editor](https://kaiord.com/editor/) (no account, no upload),
or the [CLI](/cli/commands#convert) and [TypeScript SDK](/guide/quick-start).
Conversions go through Kaiord's canonical [KRD format](/formats/krd) and stay
within round-trip tolerances (time ±1 s, heart rate ±1 bpm, cadence ±1 rpm).

## Three ways to convert

### 1. Editor (drag & drop)

Open [kaiord.com/editor](https://kaiord.com/editor/), drop your `.tcx` file,
choose **FIT** as the export format, and download `workout.fit`.

### 2. CLI

```bash
pnpm add -g @kaiord/cli
kaiord convert -i workout.tcx -o workout.fit
```

### 3. SDK

```ts
import { fromText, toBinary } from "@kaiord/core";
import { tcxReader } from "@kaiord/tcx";
import { fitWriter } from "@kaiord/fit";
import { readFile, writeFile } from "node:fs/promises";

const tcx = await readFile("workout.tcx", "utf-8");
const krd = await fromText(tcx, tcxReader);
const fit = await toBinary(krd, fitWriter);
await writeFile("workout.fit", fit);
```

## What survives the conversion

| Data                | TCX                         | FIT           | Result             |
| ------------------- | --------------------------- | ------------- | ------------------ |
| Step order & names  | `<Step>` / `<Name>`         | workout steps | Preserved          |
| Time durations      | `Time_t` seconds            | seconds       | Preserved (±1 s)   |
| Distance durations  | `Distance_t` meters         | meters        | Preserved          |
| Heart-rate targets  | `HeartRate_t` (zone or bpm) | bpm / zone    | Preserved (±1 bpm) |
| Speed targets       | `Speed_t`                   | m/s           | Preserved          |
| Cadence targets     | `Cadence_t`                 | rpm           | Preserved (±1 rpm) |
| Repeats / intervals | `Repeat_t`                  | repeat steps  | Preserved          |

## Gotchas

**No power targets appear.** TCX workouts have no power target (the schema
covers heart rate, speed, and cadence only), so a TCX-sourced FIT file won't
gain power targets. If you need power, start from a
[ZWO](/convert/zwo-to-fit) or Garmin Connect workout instead.

**Getting it onto your Garmin.** Push the FIT file with the CLI —
`kaiord garmin push -i workout.fit --input-format fit` — or use the Editor's
Garmin integration. See the [garmin command](/cli/commands#garmin).

**Sport mapping.** TCX `Sport` values (`Running`, `Biking`, `Other`) map to the
corresponding FIT sports; anything unrecognized falls back to `Other`.

## Related

- [Convert FIT to TCX](/convert/fit-to-tcx) — the reverse direction
- [Convert ZWO to FIT](/convert/zwo-to-fit) — a power-based FIT source
- [TCX format](/formats/tcx) · [FIT format](/formats/fit)
- [All converters](/convert/)
