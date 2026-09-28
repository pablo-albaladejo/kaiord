---
title: "Convert ZWO to FIT"
description: "Convert a Zwift ZWO workout to a Garmin FIT file — free and in-browser, or via the Kaiord CLI and TypeScript SDK. Push the result to your Garmin head unit."
---

# Convert ZWO to FIT

::: info Scope
Converts structured workouts (steps and targets), not recorded activities.
See [Workouts vs. activities](/convert/#workouts-vs-activities).
:::

Turn a **Zwift ZWO** workout into a **Garmin FIT** file so a session built in
Zwift can run on your Garmin head unit or watch. Use the free, in-browser
[Kaiord Editor](https://kaiord.com/app/#/convert?from=zwo&to=fit) — no account, no upload — or the
[CLI](/cli/commands#convert) and [TypeScript SDK](/guide/quick-start) if you
prefer to script it. Conversions go through Kaiord's canonical
[KRD format](/formats/krd) and stay within round-trip tolerances (time ±1 s,
power ±1 W or ±1 % FTP).

## Three ways to convert

### 1. Editor (drag & drop)

Open [kaiord.com/app](https://kaiord.com/app/#/convert?from=zwo&to=fit), drop your `.zwo` file,
choose **FIT** as the export format, and download `workout.fit`. It runs
entirely in your browser.

### 2. CLI

```bash
pnpm add -g @kaiord/cli
kaiord convert -i workout.zwo -o workout.fit
```

### 3. SDK

```ts
import { fromText, toBinary } from "@kaiord/core";
import { zwiftReader } from "@kaiord/zwo";
import { fitWriter } from "@kaiord/fit";
import { readFile, writeFile } from "node:fs/promises";

const zwo = await readFile("workout.zwo", "utf-8");
const krd = await fromText(zwo, zwiftReader);
const fit = await toBinary(krd, fitWriter);
await writeFile("workout.fit", fit);
```

## What survives the conversion

| Data               | ZWO (Zwift)                    | FIT                 | Result                                 |
| ------------------ | ------------------------------ | ------------------- | -------------------------------------- |
| Step order & names | blocks                         | workout steps       | Preserved                              |
| Time durations     | `Duration` seconds             | seconds             | Preserved (±1 s)                       |
| Power targets      | % FTP (`Power` fraction)       | power target        | Preserved (±1 % FTP)                   |
| Ramps              | `Warmup` / `Cooldown` / `Ramp` | ranged power target | Preserved as a power range             |
| Free-ride segments | `FreeRide`                     | open step           | Preserved as an untargeted step        |
| Cadence targets    | limited                        | rpm                 | Preserved when present                 |
| Text events        | in-ride messages               | —                   | Not part of the FIT workout definition |

## Gotchas

**Will it load on my Garmin?** FIT is Garmin's native workout format, so the
output is directly loadable. To send it to your device, push it with the CLI —
`kaiord garmin push -i workout.fit --input-format fit` — or use the Editor's
Garmin integration. See the [garmin command](/cli/commands#garmin).

**Sport type.** ZWO uses `bike` or `run`; these map to the FIT `cycling` /
`running` sports. Zwift workouts are overwhelmingly cycling, so most files land
as indoor cycling on your device.

**In-ride text messages don't transfer.** ZWO text events are Zwift-specific
overlays and are not part of the FIT workout target model, so they are not
emitted into the FIT file.

## Related

- [Convert FIT to ZWO](/convert/fit-to-zwo) — the reverse direction
- [Convert Garmin to ZWO](/convert/garmin-to-zwo) — sibling Zwift export
- [ZWO format](/formats/zwo) · [FIT format](/formats/fit)
- [All converters](/convert/)
