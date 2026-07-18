---
title: "Convert Garmin to TCX (Garmin Connect to TCX)"
description: "Convert a Garmin Connect workout (GCN JSON) to a TCX (Training Center XML) file — free and in-browser, or via the Kaiord CLI and TypeScript SDK."
---

# Convert Garmin to TCX

Take a **Garmin Connect** workout (GCN JSON) into a **TCX** (Training Center XML)
file so a plan from Garmin can import into another training platform. Use the
free, in-browser [Kaiord Editor](https://kaiord.com/editor/) (no account, no
upload), or the [CLI](/cli/commands#convert) and
[TypeScript SDK](/guide/quick-start). Conversions go through Kaiord's canonical
[KRD format](/formats/krd) and stay within round-trip tolerances (time ±1 s,
heart rate ±1 bpm, cadence ±1 rpm).

## Three ways to convert

### 1. Editor (drag & drop)

Open [kaiord.com/editor](https://kaiord.com/editor/), drop your Garmin Connect
workout file, choose **TCX** as the export format, and download `workout.tcx`.

### 2. CLI

```bash
pnpm add -g @kaiord/cli
kaiord convert -i workout.gcn -o workout.tcx
```

### 3. SDK

```ts
import { fromText, toText } from "@kaiord/core";
import { garminReader } from "@kaiord/garmin";
import { tcxWriter } from "@kaiord/tcx";
import { readFile, writeFile } from "node:fs/promises";

const gcn = await readFile("workout.gcn", "utf-8");
const krd = await fromText(gcn, garminReader);
const tcx = await toText(krd, tcxWriter);
await writeFile("workout.tcx", tcx);
```

## What survives the conversion

| Data                 | Garmin Connect (GCN) | TCX                 | Result                                          |
| -------------------- | -------------------- | ------------------- | ----------------------------------------------- |
| Step order & names   | workout steps        | `<Step>` / `<Name>` | Preserved                                       |
| Time durations       | time durations       | `Time_t` seconds    | Preserved (±1 s)                                |
| Distance durations   | distance durations   | `Distance_t` meters | Preserved                                       |
| Heart-rate targets   | bpm                  | `HeartRate_t`       | Preserved (±1 bpm)                              |
| Speed / pace targets | m/s                  | `Speed_t`           | Preserved                                       |
| Cadence targets      | rpm                  | `Cadence_t`         | Preserved (±1 rpm)                              |
| Power targets        | watts                | —                   | **Dropped** — TCX workouts have no power target |
| Repeats / intervals  | repeat blocks        | `Repeat_t`          | Preserved                                       |

## Gotchas

**My power targets disappeared.** The TCX workout schema covers heart rate,
speed, and cadence — there is no power target. Garmin Connect stores power in
watts, so any power targets are dropped in the TCX output. To keep power, convert
to [FIT](/convert/garmin-to-fit) instead, which keeps watt targets.

**Where do I get the `.gcn` file?** GCN is Garmin Connect's workout JSON. Fetch
it through the Garmin Connect API with
[`@kaiord/garmin-connect`](/formats/gcn#garmin-connect-api) (e.g.
`kaiord garmin list`) or the Editor's Garmin integration.

**Calorie-based durations.** Garmin Connect can express a step duration in
calories, but TCX supports only time- and distance-based durations. A
calorie-duration step therefore has no direct TCX equivalent — prefer
[FIT](/convert/garmin-to-fit) if your workout relies on calorie goals.

## Related

- [Convert TCX to Garmin](/convert/tcx-to-garmin) — the reverse direction
- [Convert Garmin to ZWO](/convert/garmin-to-zwo) — a Zwift export
- [GCN format](/formats/gcn) · [TCX format](/formats/tcx)
- [All converters](/convert/)
