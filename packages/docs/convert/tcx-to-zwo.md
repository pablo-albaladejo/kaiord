---
title: "Convert TCX to ZWO (TCX to Zwift)"
description: "Convert a TCX (Training Center XML) workout to a Zwift ZWO file — free and in-browser, or via the Kaiord CLI and TypeScript SDK. See what survives the conversion."
---

# Convert TCX to ZWO

Turn a **TCX** (Training Center XML) workout into a **Zwift ZWO** file so a plan
exported from a training platform can run in Zwift. Use the free, in-browser
[Kaiord Editor](https://kaiord.com/editor/) (no account, no upload), or the
[CLI](/cli/commands#convert) and [TypeScript SDK](/guide/quick-start).
Conversions go through Kaiord's canonical [KRD format](/formats/krd) and stay
within round-trip tolerances (time ±1 s).

## Three ways to convert

### 1. Editor (drag & drop)

Open [kaiord.com/editor](https://kaiord.com/editor/), drop your `.tcx` file,
choose **ZWO** as the export format, and download `workout.zwo`.

### 2. CLI

```bash
pnpm add -g @kaiord/cli
kaiord convert -i workout.tcx -o workout.zwo
```

### 3. SDK

```ts
import { fromText, toText } from "@kaiord/core";
import { tcxReader } from "@kaiord/tcx";
import { zwiftWriter } from "@kaiord/zwo";
import { readFile, writeFile } from "node:fs/promises";

const tcx = await readFile("workout.tcx", "utf-8");
const krd = await fromText(tcx, tcxReader);
const zwo = await toText(krd, zwiftWriter);
await writeFile("workout.zwo", zwo);
```

## What survives the conversion

| Data                | TCX                         | ZWO (Zwift)           | Result                                                        |
| ------------------- | --------------------------- | --------------------- | ------------------------------------------------------------- |
| Step order & names  | `<Step>` / `<Name>`         | blocks                | Preserved (names kept as `kaiord:` attributes)                |
| Time durations      | `Time_t` seconds            | `Duration` seconds    | Preserved (±1 s)                                              |
| Distance durations  | `Distance_t` meters         | time-based `Duration` | Converted to time; original kept under `extensions.zwift`     |
| Power targets       | — (TCX has none)            | `Power` (% FTP)       | No power to carry — steps become `FreeRide` (see below)       |
| Heart-rate targets  | `HeartRate_t` (zone or bpm) | —                     | Dropped (Zwift is power-based); kept under `extensions.zwift` |
| Speed targets       | `Speed_t`                   | —                     | Dropped (no Zwift equivalent); kept under `extensions.zwift`  |
| Cadence targets     | `Cadence_t`                 | limited               | Preserved under `extensions.zwift`                            |
| Repeats / intervals | `Repeat_t`                  | `IntervalsT`          | Preserved                                                     |

## Gotchas

**My steps became free rides.** TCX workouts have no power target (the schema
covers heart rate, speed, and cadence only), and Zwift workouts are power-based.
With no power to map, the structured steps become `FreeRide` segments that keep
their duration but have no power target. For a power-based Zwift workout, start
from a source that carries power, such as [FIT](/convert/fit-to-zwo) or
[Garmin Connect](/convert/garmin-to-zwo).

**My heart-rate targets are gone.** ZWO has no native heart-rate target, so HR
targets are dropped from the visible workout. Kaiord preserves them under
`extensions.zwift` so a later ZWO → TCX round-trip can restore them.

**Distance intervals became time intervals.** ZWO durations are time-based.
Distance durations are converted to time, and the original distance is preserved
under `extensions.zwift`.

## Related

- [Convert ZWO to TCX](/convert/zwo-to-tcx) — the reverse direction
- [Convert TCX to FIT](/convert/tcx-to-fit) — a device-file export
- [TCX format](/formats/tcx) · [ZWO format](/formats/zwo)
- [All converters](/convert/)
