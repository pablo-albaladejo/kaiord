---
title: "Convert FIT to ZWO"
description: "Convert a Garmin FIT workout to a Zwift ZWO file — free and in-browser, or via the Kaiord CLI and TypeScript SDK. See exactly what survives the conversion."
---

# Convert FIT to ZWO

Turn a **Garmin FIT** workout into a **Zwift ZWO** file so a structured session
from your head unit or coach can run in Zwift. The fastest way is the free,
in-browser [Kaiord Editor](https://kaiord.com/editor/) — no account and no file
upload. Developers can use the [CLI](/cli/commands#convert) or the
[TypeScript SDK](/guide/quick-start). Every conversion goes through Kaiord's
canonical [KRD format](/formats/krd), so values stay within round-trip
tolerances (time ±1 s, power ±1 W or ±1 % FTP).

## Three ways to convert

### 1. Editor (drag & drop)

Open [kaiord.com/editor](https://kaiord.com/editor/), drop your `.fit` file,
choose **ZWO** as the export format, and download `workout.zwo`. Everything runs
locally in your browser.

### 2. CLI

```bash
pnpm add -g @kaiord/cli
kaiord convert -i workout.fit -o workout.zwo
```

The format is detected from the file extensions. Add `--input-format fit` if
your file has a non-standard extension.

### 3. SDK

```ts
import { fromBinary, toText } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";
import { zwiftWriter } from "@kaiord/zwo";
import { readFile, writeFile } from "node:fs/promises";

const buffer = await readFile("workout.fit");
const krd = await fromBinary(new Uint8Array(buffer), fitReader);
const zwo = await toText(krd, zwiftWriter);
await writeFile("workout.zwo", zwo);
```

## What survives the conversion

| Data                | FIT                  | ZWO (Zwift)                           | Result                                                                     |
| ------------------- | -------------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| Step order & names  | workout steps        | `SteadyState` / `Warmup` / `Cooldown` | Preserved (names kept as `kaiord:` attributes)                             |
| Time durations      | seconds              | `Duration` seconds                    | Preserved (±1 s)                                                           |
| Distance durations  | meters               | time-based `Duration`                 | Converted to time; original meters kept in `kaiord:originalDurationMeters` |
| Power targets       | watts / % FTP / zone | `Power` (fraction of FTP)             | Normalized to % FTP (see FTP note below)                                   |
| Heart-rate targets  | bpm / zone           | —                                     | Dropped (Zwift is power-based); kept under `extensions.zwift`              |
| Cadence targets     | rpm                  | limited                               | Preserved under `extensions.zwift`                                         |
| Repeats / intervals | repeat steps         | `IntervalsT`                          | Preserved                                                                  |

The Kaiord CLI logs a warning for every lossy step (for example
`Lossy conversion: heart rate target not supported by Zwift`) so you can see
exactly what changed.

## Gotchas

**Do I need my FTP?** ZWO expresses power as a fraction of FTP. If your FIT
targets are absolute watts, the conversion maps them to % FTP using a default
FTP assumption — rescale in Zwift (or the Editor) if the exact watts matter.
Zone- and %FTP-based FIT targets map across directly.

**My heart-rate targets are gone.** Zwift workouts are power-based and ZWO has
no native heart-rate target, so HR targets are dropped from the visible workout.
Kaiord preserves them under `extensions.zwift` so a later ZWO → FIT round-trip
can restore them.

**My distance intervals became time intervals.** ZWO durations are
time-based. Distance durations are converted to time and the original distance
is preserved in `kaiord:originalDurationMeters`.

## Related

- [Convert ZWO to FIT](/convert/zwo-to-fit) — the reverse direction
- [Convert FIT to TCX](/convert/fit-to-tcx) — a sibling FIT export
- [FIT format](/formats/fit) · [ZWO format](/formats/zwo)
- [All converters](/convert/)
