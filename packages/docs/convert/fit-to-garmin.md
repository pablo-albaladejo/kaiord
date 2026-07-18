---
title: "Convert FIT to Garmin (FIT to Garmin Connect)"
description: "Convert a Garmin FIT workout to Garmin Connect format (GCN JSON) and push it to your account — free and in-browser, or via the Kaiord CLI and TypeScript SDK."
---

# Convert FIT to Garmin

Turn a **Garmin FIT** workout into the **Garmin Connect** workout format (GCN
JSON) so a session from a FIT file can live in your Garmin Connect account and
sync to your watch or head unit. Use the free, in-browser
[Kaiord Editor](https://kaiord.com/editor/) (no account, no upload), or the
[CLI](/cli/commands#convert) and [TypeScript SDK](/guide/quick-start).
Conversions go through Kaiord's canonical [KRD format](/formats/krd) and stay
within round-trip tolerances (time ±1 s, power ±1 W, heart rate ±1 bpm, cadence
±1 rpm).

## Three ways to convert

### 1. Editor (drag & drop)

Open [kaiord.com/editor](https://kaiord.com/editor/), drop your `.fit` file,
choose **Garmin (GCN)** as the export format, and download the result. To send
it straight to your account, use the Editor's Garmin sync (backed by the
`garmin-bridge` extension).

### 2. CLI

```bash
pnpm add -g @kaiord/cli
kaiord convert -i workout.fit -o workout.gcn
```

To push directly to Garmin Connect (after `kaiord garmin login`):

```bash
kaiord garmin push -i workout.fit --input-format fit
```

### 3. SDK

```ts
import { fromBinary, toText } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";
import { garminWriter } from "@kaiord/garmin";
import { readFile, writeFile } from "node:fs/promises";

const buffer = await readFile("workout.fit");
const krd = await fromBinary(new Uint8Array(buffer), fitReader);
const gcn = await toText(krd, garminWriter);
await writeFile("workout.gcn", gcn);
```

## What survives the conversion

| Data                 | FIT           | Garmin Connect (GCN)  | Result                             |
| -------------------- | ------------- | --------------------- | ---------------------------------- |
| Step order & names   | workout steps | workout steps         | Preserved                          |
| Time durations       | seconds       | time durations        | Preserved (±1 s)                   |
| Distance durations   | meters        | distance durations    | Preserved                          |
| Power targets        | watts / zone  | watts / power zone    | Preserved (±1 W; zones map across) |
| Heart-rate targets   | bpm / zone    | bpm / heart-rate zone | Preserved (±1 bpm)                 |
| Cadence targets      | rpm           | rpm                   | Preserved (±1 rpm)                 |
| Speed / pace targets | m/s           | m/s                   | Preserved                          |
| Repeats / intervals  | repeat steps  | repeat blocks         | Preserved                          |
| Developer fields     | custom fields | —                     | Preserved under `extensions.fit`   |

FIT and Garmin Connect are both Garmin-native, watt-based formats, so this is
one of the highest-fidelity conversions Kaiord does — no assumed FTP is needed.

## Gotchas

**FIT file vs. Garmin Connect JSON.** A `.fit` file is Garmin's on-device binary
format; a `.gcn` file is Garmin Connect's workout JSON. They are not the same
thing, which is why the conversion matters — the GCN output is what the Garmin
Connect API accepts.

**How does it get on my watch?** Push the `.gcn` to your account with
`kaiord garmin push` (via [`@kaiord/garmin-connect`](/formats/gcn#garmin-connect-api))
or use the Editor's Garmin sync; Garmin Connect then syncs it to your device.

**Developer and unknown fields.** FIT developer fields and unknown messages have
no Garmin Connect equivalent, so they are kept under `extensions.fit` and
survive a later `garmin-to-fit` round-trip rather than being emitted into the
GCN workout.

## Related

- [Convert Garmin to FIT](/convert/garmin-to-fit) — the reverse direction
- [Convert FIT to TCX](/convert/fit-to-tcx) — a cross-platform FIT export
- [FIT format](/formats/fit) · [GCN format](/formats/gcn)
- [All converters](/convert/)
