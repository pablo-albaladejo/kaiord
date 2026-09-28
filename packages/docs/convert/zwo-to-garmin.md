---
title: "Convert ZWO to Garmin (Zwift to Garmin Connect)"
description: "Convert a Zwift ZWO workout to Garmin Connect format and push it to your watch — free and in-browser, or via the Kaiord CLI and TypeScript SDK."
---

# Convert ZWO to Garmin

::: info Scope
Converts structured workouts (steps and targets), not recorded activities.
See [Workouts vs. activities](/convert/#workouts-vs-activities).
:::

::: warning Known issue: power targets
Power targets in % FTP currently arrive in Garmin Connect as watts with the
same number (85 % FTP becomes 85 W). Every ZWO power target is in % FTP, so
this affects every Zwift workout. The fix is tracked in
[issue #1279](https://github.com/pablo-albaladejo/kaiord/issues/1279).
:::

Take a **Zwift ZWO** workout into **Garmin Connect** so you can run a session you
built in Zwift on your Garmin watch or head unit. Kaiord converts ZWO to the
Garmin Connect workout format (GCN JSON) — free and in-browser in the
[Kaiord Editor](https://kaiord.com/app/#/convert?from=zwo&to=garmin) (no account, no upload), or via the
[CLI](/cli/commands#convert) and [TypeScript SDK](/guide/quick-start).
Conversions go through Kaiord's canonical [KRD format](/formats/krd) and stay
within round-trip tolerances (time ±1 s), except for the power issue above.

## Three ways to convert

### 1. Editor (in the browser)

Open [kaiord.com/app](https://kaiord.com/app/#/convert?from=zwo&to=garmin), choose your `.zwo` file
(**GCN** is already selected as the export format), and download the result. To send
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

| Data                | ZWO (Zwift)                    | Garmin Connect (GCN) | Result                                                                                                         |
| ------------------- | ------------------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Step order & names  | blocks                         | workout steps        | Preserved                                                                                                      |
| Time durations      | `Duration` seconds             | time durations       | Preserved (±1 s)                                                                                               |
| Power targets       | % FTP (`Power` fraction)       | watts                | Known issue: the % value is written as watts ([#1279](https://github.com/pablo-albaladejo/kaiord/issues/1279)) |
| Ramps               | `Warmup` / `Cooldown` / `Ramp` | ranged target        | Preserved as a power range                                                                                     |
| Repeats / intervals | `IntervalsT`                   | repeat blocks        | Preserved                                                                                                      |
| Free-ride segments  | `FreeRide`                     | open step            | Preserved as an untargeted step                                                                                |

## Gotchas

**Watts vs. % FTP.** Zwift stores power as % FTP; Garmin Connect stores watts.
Kaiord does not yet convert one into the other for this direction: a 0.85
(85 % FTP) target is written as 85 W. Until [issue #1279](https://github.com/pablo-albaladejo/kaiord/issues/1279) is fixed,
check the power targets in Garmin Connect before riding, or convert to
[FIT](/convert/zwo-to-fit), which keeps % FTP.

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
