---
title: "Convert Garmin to FIT (Garmin Connect to FIT)"
description: "Convert a Garmin Connect workout (GCN JSON) to a Garmin FIT file — free and in-browser, or via the Kaiord CLI and TypeScript SDK. Push the result to your device."
---

# Convert Garmin to FIT

Take a **Garmin Connect** workout (GCN JSON) into a **Garmin FIT** file — the
on-device binary format — so a plan from your Garmin Connect account can be
loaded as a native FIT workout. Use the free, in-browser
[Kaiord Editor](https://kaiord.com/editor/) (no account, no upload), or the
[CLI](/cli/commands#convert) and [TypeScript SDK](/guide/quick-start).
Conversions go through Kaiord's canonical [KRD format](/formats/krd) and stay
within round-trip tolerances (time ±1 s, power ±1 W, heart rate ±1 bpm, cadence
±1 rpm).

## Three ways to convert

### 1. Editor (drag & drop)

Open [kaiord.com/editor](https://kaiord.com/editor/), drop your Garmin Connect
workout file, choose **FIT** as the export format, and download `workout.fit`.

### 2. CLI

```bash
pnpm add -g @kaiord/cli
kaiord convert -i workout.gcn -o workout.fit
```

### 3. SDK

```ts
import { fromText, toBinary } from "@kaiord/core";
import { garminReader } from "@kaiord/garmin";
import { fitWriter } from "@kaiord/fit";
import { readFile, writeFile } from "node:fs/promises";

const gcn = await readFile("workout.gcn", "utf-8");
const krd = await fromText(gcn, garminReader);
const fit = await toBinary(krd, fitWriter);
await writeFile("workout.fit", fit);
```

## What survives the conversion

| Data                 | Garmin Connect (GCN) | FIT                | Result                             |
| -------------------- | -------------------- | ------------------ | ---------------------------------- |
| Step order & names   | workout steps        | workout steps      | Preserved                          |
| Time durations       | time durations       | seconds            | Preserved (±1 s)                   |
| Distance durations   | distance durations   | meters             | Preserved                          |
| Power targets        | watts / power zone   | watts / zone       | Preserved (±1 W; zones map across) |
| Heart-rate targets   | bpm                  | bpm / zone         | Preserved (±1 bpm)                 |
| Cadence targets      | rpm                  | rpm                | Preserved (±1 rpm)                 |
| Speed / pace targets | m/s                  | m/s                | Preserved                          |
| Repeats / intervals  | repeat blocks        | repeat steps       | Preserved                          |
| Step notes           | `description`        | workout step notes | Preserved (truncated to 256 chars) |

Both formats are Garmin-native and watt-based, so this is a high-fidelity
conversion — no assumed FTP is needed.

## Gotchas

**Where do I get the `.gcn` file?** GCN is Garmin Connect's workout JSON. Fetch
it through the Garmin Connect API with
[`@kaiord/garmin-connect`](/formats/gcn#garmin-connect-api) (e.g.
`kaiord garmin list`) or the Editor's Garmin integration.

**Will it load on my Garmin?** FIT is Garmin's native workout format, so the
output is directly loadable. To send it to your device, push it with the CLI —
`kaiord garmin push -i workout.fit --input-format fit` — or use the Editor's
Garmin integration.

**Calorie-based durations.** Garmin Connect can express a step duration in
calories. KRD models calorie durations natively, so they carry through to FIT
(which also supports calorie durations); a target format without them, such as
[TCX](/convert/garmin-to-tcx), would not.

## Related

- [Convert FIT to Garmin](/convert/fit-to-garmin) — the reverse direction
- [Convert Garmin to ZWO](/convert/garmin-to-zwo) — a Zwift export
- [GCN format](/formats/gcn) · [FIT format](/formats/fit)
- [All converters](/convert/)
