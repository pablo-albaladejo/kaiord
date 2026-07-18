---
title: "Convert TCX to Garmin (TCX to Garmin Connect)"
description: "Convert a TCX (Training Center XML) workout to Garmin Connect format and push it to your watch — free and in-browser, or via the Kaiord CLI and TypeScript SDK."
---

# Convert TCX to Garmin

Take a **TCX** (Training Center XML) workout into the **Garmin Connect** workout
format (GCN JSON) so a plan exported from another platform can run on your Garmin
watch or head unit. Use the free, in-browser
[Kaiord Editor](https://kaiord.com/editor/) (no account, no upload), or the
[CLI](/cli/commands#convert) and [TypeScript SDK](/guide/quick-start).
Conversions go through Kaiord's canonical [KRD format](/formats/krd) and stay
within round-trip tolerances (time ±1 s, heart rate ±1 bpm, cadence ±1 rpm).

## Three ways to convert

### 1. Editor (drag & drop)

Open [kaiord.com/editor](https://kaiord.com/editor/), drop your `.tcx` file,
choose **Garmin (GCN)** as the export format, and download the result. To send
it straight to your watch, use the Editor's Garmin sync (backed by the
`garmin-bridge` extension).

### 2. CLI

```bash
pnpm add -g @kaiord/cli
kaiord convert -i workout.tcx -o workout.gcn
```

To push directly to Garmin Connect (after `kaiord garmin login`):

```bash
kaiord garmin push -i workout.tcx --input-format tcx
```

### 3. SDK

```ts
import { fromText, toText } from "@kaiord/core";
import { tcxReader } from "@kaiord/tcx";
import { garminWriter } from "@kaiord/garmin";
import { readFile, writeFile } from "node:fs/promises";

const tcx = await readFile("workout.tcx", "utf-8");
const krd = await fromText(tcx, tcxReader);
const gcn = await toText(krd, garminWriter);
await writeFile("workout.gcn", gcn);
```

## What survives the conversion

| Data                 | TCX                         | Garmin Connect (GCN) | Result                    |
| -------------------- | --------------------------- | -------------------- | ------------------------- |
| Step order & names   | `<Step>` / `<Name>`         | workout steps        | Preserved                 |
| Time durations       | `Time_t` seconds            | time durations       | Preserved (±1 s)          |
| Distance durations   | `Distance_t` meters         | distance durations   | Preserved                 |
| Heart-rate targets   | `HeartRate_t` (zone or bpm) | bpm                  | Preserved (±1 bpm)        |
| Speed / pace targets | `Speed_t`                   | m/s                  | Preserved                 |
| Cadence targets      | `Cadence_t`                 | rpm                  | Preserved (±1 rpm)        |
| Power targets        | — (TCX has none)            | watts                | Not present in the source |
| Repeats / intervals  | `Repeat_t`                  | repeat blocks        | Preserved                 |

Heart-rate-based workouts convert cleanly: TCX carries heart-rate, speed, and
cadence targets, all of which Garmin Connect supports.

## Gotchas

**No power targets.** TCX workouts have no power target (the schema covers heart
rate, speed, and cadence only), so a TCX-sourced Garmin Connect workout won't
gain power targets. If you need power, start from a
[FIT](/convert/fit-to-garmin) or [ZWO](/convert/zwo-to-garmin) workout instead.

**How does it get on my watch?** A `.gcn` file is Garmin Connect's JSON, not a
device file. Push it to your account with `kaiord garmin push` (via
[`@kaiord/garmin-connect`](/formats/gcn#garmin-connect-api)) or use the Editor's
Garmin sync; Garmin Connect then syncs it to your device.

**Sport mapping.** TCX `Sport` values (`Running`, `Biking`, `Other`) map to the
corresponding Garmin sports; anything unrecognized falls back to `Other`.

## Related

- [Convert Garmin to TCX](/convert/garmin-to-tcx) — the reverse direction
- [Convert TCX to FIT](/convert/tcx-to-fit) — a device-file export
- [TCX format](/formats/tcx) · [GCN format](/formats/gcn)
- [All converters](/convert/)
