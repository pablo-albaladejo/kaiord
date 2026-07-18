---
title: "Convert Garmin to ZWO (Garmin Connect to Zwift)"
description: "Convert a Garmin Connect workout to a Zwift ZWO file — free and in-browser, or via the Kaiord CLI and TypeScript SDK. See exactly what survives the conversion."
---

# Convert Garmin to ZWO

Take a **Garmin Connect** workout (GCN JSON) into a **Zwift ZWO** file so a plan
from Garmin can run in Zwift. Use the free, in-browser
[Kaiord Editor](https://kaiord.com/editor/) (no account, no upload), or the
[CLI](/cli/commands#convert) and [TypeScript SDK](/guide/quick-start).
Conversions go through Kaiord's canonical [KRD format](/formats/krd) and stay
within round-trip tolerances (time ±1 s, power ±1 W or ±1 % FTP).

## Three ways to convert

### 1. Editor (drag & drop)

Open [kaiord.com/editor](https://kaiord.com/editor/), drop your Garmin Connect
workout file, choose **ZWO** as the export format, and download `workout.zwo`.

### 2. CLI

```bash
pnpm add -g @kaiord/cli
kaiord convert -i workout.gcn -o workout.zwo
```

### 3. SDK

```ts
import { fromText, toText } from "@kaiord/core";
import { garminReader } from "@kaiord/garmin";
import { zwiftWriter } from "@kaiord/zwo";
import { readFile, writeFile } from "node:fs/promises";

const gcn = await readFile("workout.gcn", "utf-8");
const krd = await fromText(gcn, garminReader);
const zwo = await toText(krd, zwiftWriter);
await writeFile("workout.zwo", zwo);
```

## What survives the conversion

| Data                | Garmin Connect (GCN)    | ZWO (Zwift)                     | Result                                                        |
| ------------------- | ----------------------- | ------------------------------- | ------------------------------------------------------------- |
| Step order & names  | workout steps           | blocks (names as `kaiord:name`) | Preserved                                                     |
| Time durations      | time durations          | `Duration` seconds              | Preserved (±1 s)                                              |
| Distance durations  | distance durations      | time-based `Duration`           | Converted to time; original kept under `extensions.zwift`     |
| Power targets       | watts                   | % FTP (`Power` fraction)        | Converted using an assumed FTP (see below)                    |
| Repeats / intervals | repeat blocks           | `IntervalsT`                    | Preserved                                                     |
| Steps without power | open / non-power target | `FreeRide`                      | Rendered as a free-ride segment                               |
| Heart-rate targets  | bpm                     | —                               | Dropped (Zwift is power-based); kept under `extensions.zwift` |

## Gotchas

**Watts vs. % FTP.** Garmin Connect stores power as watts; Zwift needs % FTP.
The conversion divides watts by an assumed FTP (recorded as `kaiord:assumedFtp`,
e.g. 250 W). If the percentages look off, rescale to your own FTP.

**Non-power steps become free rides.** ZWO is power-centric. Garmin steps that
target heart rate or have no power target become `FreeRide` segments, since
Zwift has no equivalent structured target for them.

**Where do I get the `.gcn` file?** GCN is Garmin Connect's workout JSON. Fetch
it through the Garmin Connect API with
[`@kaiord/garmin-connect`](/formats/gcn#garmin-connect-api) (e.g.
`kaiord garmin list`) or the Editor's Garmin integration.

## Related

- [Convert ZWO to Garmin](/convert/zwo-to-garmin) — the reverse direction
- [Convert FIT to ZWO](/convert/fit-to-zwo) — a device-file source
- [GCN format](/formats/gcn) · [ZWO format](/formats/zwo)
- [All converters](/convert/)
