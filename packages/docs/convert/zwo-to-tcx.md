---
title: "Convert ZWO to TCX (Zwift to TCX)"
description: "Convert a Zwift ZWO workout to a TCX (Training Center XML) file — free and in-browser, or via the Kaiord CLI and TypeScript SDK. See what survives the conversion."
---

# Convert ZWO to TCX

Turn a **Zwift ZWO** workout into a **TCX** (Training Center XML) file — the
format most training platforms accept for import. Use the free, in-browser
[Kaiord Editor](https://kaiord.com/editor/) (no account, no upload), or the
[CLI](/cli/commands#convert) and [TypeScript SDK](/guide/quick-start).
Conversions go through Kaiord's canonical [KRD format](/formats/krd) and stay
within round-trip tolerances (time ±1 s, cadence ±1 rpm).

## Three ways to convert

### 1. Editor (drag & drop)

Open [kaiord.com/editor](https://kaiord.com/editor/), drop your `.zwo` file,
choose **TCX** as the export format, and download `workout.tcx`.

### 2. CLI

```bash
pnpm add -g @kaiord/cli
kaiord convert -i workout.zwo -o workout.tcx
```

### 3. SDK

```ts
import { fromText, toText } from "@kaiord/core";
import { zwiftReader } from "@kaiord/zwo";
import { tcxWriter } from "@kaiord/tcx";
import { readFile, writeFile } from "node:fs/promises";

const zwo = await readFile("workout.zwo", "utf-8");
const krd = await fromText(zwo, zwiftReader);
const tcx = await toText(krd, tcxWriter);
await writeFile("workout.tcx", tcx);
```

## What survives the conversion

| Data                | ZWO (Zwift)                    | TCX                 | Result                                          |
| ------------------- | ------------------------------ | ------------------- | ----------------------------------------------- |
| Step order & names  | blocks                         | `<Step>` / `<Name>` | Preserved                                       |
| Time durations      | `Duration` seconds             | `Time_t` seconds    | Preserved (±1 s)                                |
| Power targets       | % FTP (`Power` fraction)       | —                   | **Dropped** — TCX workouts have no power target |
| Ramps               | `Warmup` / `Cooldown` / `Ramp` | untargeted steps    | Duration preserved; the power ramp is dropped   |
| Cadence targets     | limited                        | `Cadence_t`         | Preserved when present (±1 rpm)                 |
| Free-ride segments  | `FreeRide`                     | untargeted step     | Preserved as a step without a target            |
| Repeats / intervals | `IntervalsT`                   | `Repeat_t`          | Preserved                                       |

## Gotchas

**My power targets disappeared.** The TCX workout schema (Garmin Training
Center) defines heart-rate, speed, and cadence targets only — there is no power
target. Zwift workouts are power-based (% FTP), so the power targets have
nowhere to land and are dropped; the step structure and durations remain. To
keep power, convert to [FIT](/convert/zwo-to-fit) or
[Garmin Connect](/convert/zwo-to-garmin) instead.

**So why convert to TCX at all?** TCX is a widely accepted interchange format —
TrainingPeaks, Strava, and Garmin Connect all import it — so it is useful when
you want the workout's structure (steps, durations, intervals) on a platform
that reads TCX but cannot read ZWO. Just expect the power targets not to come
along.

**Cadence.** If your ZWO carries cadence targets, they map to TCX `Cadence_t`
targets. Most Zwift workouts are pure power, so this is often empty.

## Related

- [Convert TCX to ZWO](/convert/tcx-to-zwo) — the reverse direction
- [Convert ZWO to FIT](/convert/zwo-to-fit) — keep power targets
- [ZWO format](/formats/zwo) · [TCX format](/formats/tcx)
- [All converters](/convert/)
