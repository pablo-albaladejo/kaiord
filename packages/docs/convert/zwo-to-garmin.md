---
title: "Convert ZWO to Garmin (Zwift to Garmin Connect)"
description: "Convert a Zwift ZWO workout to Garmin Connect format and push it to your watch — free and in-browser, or via the Kaiord CLI and TypeScript SDK."
---

# Convert ZWO to Garmin

Take a **Zwift ZWO** workout into **Garmin Connect** so you can run a session you
built in Zwift on your Garmin watch or head unit. Kaiord converts ZWO to the
Garmin Connect workout format (GCN JSON) — free and in-browser in the
[Kaiord Editor](https://kaiord.com/app/) (no account, no upload), or via the
[CLI](/cli/commands#convert) and [TypeScript SDK](/guide/quick-start).
Conversions go through Kaiord's canonical [KRD format](/formats/krd) and stay
within round-trip tolerances (time ±1 s, power ±1 W or ±1 % FTP).

## Three ways to convert

### 1. Editor (drag & drop)

Open [kaiord.com/app](https://kaiord.com/app/), drop your `.zwo` file,
choose **Garmin (GCN)** as the export format, and download the result. To send
it straight to your watch, use the Editor's Garmin sync (backed by the
`garmin-bridge` extension).

### 2. CLI

```bash
pnpm add -g @kaiord/cli
kaiord convert -i workout.zwo -o workout.gcn
```

To push directly to Garmin Connect (after `kaiord garmin login`):

```bash
kaiord garmin push -i workout.zwo --input-format zwo
```

### 3. SDK

```ts
import { fromText, toText } from "@kaiord/core";
import { zwiftReader } from "@kaiord/zwo";
import { garminWriter } from "@kaiord/garmin";
import { readFile, writeFile } from "node:fs/promises";

const zwo = await readFile("workout.zwo", "utf-8");
const krd = await fromText(zwo, zwiftReader);
const gcn = await toText(krd, garminWriter);
await writeFile("workout.gcn", gcn);
```

## What survives the conversion

| Data                | ZWO (Zwift)                    | Garmin Connect (GCN) | Result                                  |
| ------------------- | ------------------------------ | -------------------- | --------------------------------------- |
| Step order & names  | blocks                         | workout steps        | Preserved                               |
| Time durations      | `Duration` seconds             | time durations       | Preserved (±1 s)                        |
| Power targets       | % FTP (`Power` fraction)       | watts                | Converted using your FTP (see below)    |
| Ramps               | `Warmup` / `Cooldown` / `Ramp` | ranged target        | Not converted correctly yet (see below) |
| Repeats / intervals | `IntervalsT`                   | repeat blocks        | Preserved                               |
| Free-ride segments  | `FreeRide`                     | open step            | Preserved as an untargeted step         |

## Gotchas

**Watts vs. % FTP.** Zwift stores power as % FTP; Garmin Connect stores watts,
so every % FTP target is converted with **your** FTP: watts = round(% × FTP).
There is no assumed default — without an FTP the conversion stops with an error
instead of writing wrong watts.

- **Editor**: set your FTP in **Athlete**; export and "Send to Garmin" use the
  FTP of the workout's sport from your profile.
- **CLI**: pass it with `--ftp`, e.g.
  `kaiord convert -i workout.zwo -o workout.gcn --ftp 250` or
  `kaiord garmin push -i workout.zwo --ftp 250`.
- **SDK**: `createGarminWriter({ ftpWatts: 250 })` instead of `garminWriter`.
- **MCP**: pass `ftp` to `kaiord_convert` or `kaiord_garmin_push`.

At an FTP of 250 W, `Power="0.85"` becomes a 213 W target.

**Ramps.** Zwift ramps (`Warmup`, `Cooldown`, `Ramp`) are not yet resolved
against your FTP: their % FTP bounds reach Garmin Connect as if they were watts
(a 50–75 % warm-up arrives as 50–75 W). Steady-state blocks and intervals are
converted correctly.

**How does it get on my watch?** A `.gcn` file is Garmin Connect's JSON, not a
device file. Push it to your account with `kaiord garmin push` (via
[`@kaiord/garmin-connect`](/formats/gcn#garmin-connect-api)) or use the Editor's
Garmin sync; Garmin Connect then syncs it to your device.

**Heart-rate and cadence.** Zwift workouts are power-based, so ZWO rarely
carries heart-rate or cadence targets to bring across. Any that exist are
mapped where Garmin Connect supports them.

## Related

- [Convert Garmin to ZWO](/convert/garmin-to-zwo) — the reverse direction
- [Convert ZWO to FIT](/convert/zwo-to-fit) — a device-file alternative
- [ZWO format](/formats/zwo) · [GCN format](/formats/gcn)
- [All converters](/convert/)
