---
title: "Convert FIT to TCX"
description: "Convert a Garmin FIT workout to a TCX (Training Center XML) file — free and in-browser, or via the Kaiord CLI and TypeScript SDK. See what survives the conversion."
---

# Convert FIT to TCX

Turn a **Garmin FIT** workout into a **TCX** (Training Center XML) file — the
format most training platforms accept for import. Use the free, in-browser
[Kaiord Editor](https://kaiord.com/editor/) (no account, no upload), or the
[CLI](/cli/commands#convert) and [TypeScript SDK](/guide/quick-start).
Conversions go through Kaiord's canonical [KRD format](/formats/krd) and stay
within round-trip tolerances (time ±1 s, heart rate ±1 bpm, cadence ±1 rpm).

## Three ways to convert

### 1. Editor (drag & drop)

Open [kaiord.com/editor](https://kaiord.com/editor/), drop your `.fit` file,
choose **TCX** as the export format, and download `workout.tcx`.

### 2. CLI

```bash
pnpm add -g @kaiord/cli
kaiord convert -i workout.fit -o workout.tcx
```

### 3. SDK

```ts
import { fromBinary, toText } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";
import { tcxWriter } from "@kaiord/tcx";
import { readFile, writeFile } from "node:fs/promises";

const buffer = await readFile("workout.fit");
const krd = await fromBinary(new Uint8Array(buffer), fitReader);
const tcx = await toText(krd, tcxWriter);
await writeFile("workout.tcx", tcx);
```

## What survives the conversion

| Data                | FIT           | TCX                         | Result                                          |
| ------------------- | ------------- | --------------------------- | ----------------------------------------------- |
| Step order & names  | workout steps | `<Step>` / `<Name>`         | Preserved                                       |
| Time durations      | seconds       | `Time_t` seconds            | Preserved (±1 s)                                |
| Distance durations  | meters        | `Distance_t` meters         | Preserved                                       |
| Heart-rate targets  | bpm / zone    | `HeartRate_t` (zone or bpm) | Preserved (±1 bpm)                              |
| Speed targets       | m/s           | `Speed_t`                   | Preserved                                       |
| Cadence targets     | rpm           | `Cadence_t`                 | Preserved (±1 rpm)                              |
| Power targets       | watts / % FTP | —                           | **Dropped** — TCX workouts have no power target |
| Repeats / intervals | repeat steps  | `Repeat_t`                  | Preserved                                       |
| Developer fields    | custom fields | —                           | Preserved under `extensions.fit`                |

## Gotchas

**My power targets disappeared.** The TCX workout schema (Garmin Training
Center) only defines heart-rate, speed, and cadence targets — there is no power
target. If your FIT workout is power-based, convert it to
[ZWO](/convert/fit-to-zwo) or Garmin Connect instead, which keep power.

**Workouts vs. activities.** This page is about structured _workouts_ (the
target plan). TCX can also hold recorded _activity_ data; Kaiord reads and
writes both, but the field mapping above is for the workout definition.

**Which apps accept TCX?** TrainingPeaks, Strava, and Garmin Connect all import
TCX, which makes it a good interchange format when a platform can't read FIT
directly.

## Related

- [Convert TCX to FIT](/convert/tcx-to-fit) — the reverse direction
- [Convert FIT to ZWO](/convert/fit-to-zwo) — keep power targets
- [FIT format](/formats/fit) · [TCX format](/formats/tcx)
- [All converters](/convert/)
