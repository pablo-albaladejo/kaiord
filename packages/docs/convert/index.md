---
title: "Workout file converter — FIT, TCX, ZWO, Garmin"
description: "Free, in-browser converter for FIT, TCX, ZWO, and Garmin Connect workout files. No account, no upload. Plus a CLI and TypeScript SDK for developers."
---

# Workout file converter — FIT, TCX, ZWO & Garmin

Convert workout files between **FIT**, **TCX**, **ZWO** (Zwift), and **Garmin
Connect** formats — free, in your browser, with no account and no file upload.
Drop a file into the [Kaiord Editor](https://kaiord.com/editor/) and download
the result. Developers can script the same conversions with the
[CLI](/cli/commands) or the [TypeScript SDK](/guide/quick-start).

Every conversion goes through **KRD**, Kaiord's canonical format, so round-trips
stay within tight tolerances (time ±1 s, power ±1 W or ±1 % FTP, heart rate
±1 bpm, cadence ±1 rpm). See the [KRD format](/formats/krd) for the details.

## Pick a conversion

| From ↓ / To → | FIT                                    | TCX                                    | ZWO (Zwift)                            | Garmin                                 |
| ------------- | -------------------------------------- | -------------------------------------- | -------------------------------------- | -------------------------------------- |
| **FIT**       | —                                      | [FIT → TCX](/convert/fit-to-tcx)       | [FIT → ZWO](/convert/fit-to-zwo)       | [FIT → Garmin](/convert/fit-to-garmin) |
| **TCX**       | [TCX → FIT](/convert/tcx-to-fit)       | —                                      | [TCX → ZWO](/convert/tcx-to-zwo)       | [TCX → Garmin](/convert/tcx-to-garmin) |
| **ZWO**       | [ZWO → FIT](/convert/zwo-to-fit)       | [ZWO → TCX](/convert/zwo-to-tcx)       | —                                      | [ZWO → Garmin](/convert/zwo-to-garmin) |
| **Garmin**    | [Garmin → FIT](/convert/garmin-to-fit) | [Garmin → TCX](/convert/garmin-to-tcx) | [Garmin → ZWO](/convert/garmin-to-zwo) | —                                      |

All twelve directed pairs have a guided walkthrough. Every conversion uses the
same [`kaiord convert`](/cli/commands#convert) command and SDK calls — the
format is detected from the file extension.

## Three ways to convert

1. **Editor** — [kaiord.com/editor](https://kaiord.com/editor/). Drag & drop a
   file, pick the target format, download. Nothing leaves your browser.
2. **CLI** — `kaiord convert -i workout.fit -o workout.zwo`. Formats are
   detected from the extensions. See the [CLI reference](/cli/commands#convert).
3. **SDK** — `@kaiord/core` plus the reader/writer for each format. See the
   [Quick Start](/guide/quick-start).

## What is lossless?

KRD is designed to be round-trip safe, but the source and target formats are
not identical — each pair page has a **"What survives the conversion"** table
and the gotchas that matter for that direction. In short:

- **FIT** is the richest workout format (power, heart rate, cadence, speed, and
  distance/time durations).
- **TCX** workout targets are heart rate, speed, and cadence — **not power**.
- **ZWO** is power-based (% of FTP); heart-rate and cadence targets have no
  native equivalent.
- **Garmin Connect (GCN)** covers power, heart rate, speed, and cadence in
  watts/bpm/rpm, plus calorie durations.

Format-specific data that has no target-side equivalent is preserved under the
KRD `extensions` object so it can survive a later round-trip.

## Formats

- [FIT](/formats/fit) — Garmin's binary protocol
- [TCX](/formats/tcx) — Training Center XML
- [ZWO](/formats/zwo) — Zwift workout XML
- [GCN](/formats/gcn) — Garmin Connect JSON
- [KRD](/formats/krd) — Kaiord's canonical format
