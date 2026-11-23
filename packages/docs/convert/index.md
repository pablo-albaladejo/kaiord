---
title: "Workout file converter — FIT, TCX, ZWO, Garmin"
description: "Free, in-browser converter for FIT, TCX, ZWO, and Garmin Connect workout files. No account, no upload. Plus a CLI and TypeScript SDK for developers."
---

# Workout file converter — FIT, TCX, ZWO & Garmin

::: info Scope
Converts structured workouts (steps and targets), not recorded activities.
See [Workouts vs. activities](#workouts-vs-activities).
:::

Convert workout files between **FIT**, **TCX**, **ZWO** (Zwift), and **Garmin
Connect** formats — free, in your browser, with no account and no file upload.
Choose a file in the [Kaiord Editor](https://kaiord.com/app/#/convert) and download
the result. Developers can script the same conversions with the
[CLI](/cli/commands) or the [TypeScript SDK](/guide/quick-start).

Every conversion goes through **KRD**, Kaiord's canonical format. What each
format keeps on a Round-trip, and within which tolerances, is listed in
[What survives a conversion?](#what-survives-a-conversion).

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

1. **Kaiord App** — [kaiord.com/app](https://kaiord.com/app/#/convert). Choose
   a file, pick the target format, download. The conversion runs in your
   browser and the file is never uploaded; Umami analytics records only an
   anonymous event with the format.
2. **CLI** — `kaiord convert -i workout.fit -o workout.zwo`. Formats are
   detected from the extensions. See the [CLI reference](/cli/commands#convert).
3. **SDK** — `@kaiord/core` plus the reader/writer for each format. See the
   [Quick Start](/guide/quick-start).

## Workouts vs. activities

A **workout** is the plan: an ordered list of steps, each with a duration
(time, distance, open…) and a target (power, heart rate, pace, cadence). It is
what you load on a watch or head unit before a session. An **activity** is the
recording of a session you already did: the samples, laps and totals your
device logged.

These converters move **workouts** between formats. FIT and TCX can also hold
activities, and the Kaiord app can import a recorded activity onto your
calendar, but these pages do not turn a recorded ride or run into a workout,
and a converted file carries no recorded data.

## What survives a conversion?

The formats are not identical, so a conversion keeps only what the target can
hold. Each pair page has a **"What survives the conversion"** table for its
direction.

Every format below has a Round-trip test in CI: a workout goes from the format
to KRD and back, and every value must come back within the declared tolerances
(time ±1 s, distance ±1 m, power ±1 W or ±1 % FTP, heart rate ±1 bpm, cadence
±1 rpm, pace ±0.01 m/s). A field a format cannot carry is listed by name; the
test fails on any other value that changes.

- **FIT**: Round-trip tested. Converting FIT → KRD → FIT keeps every value of a
  workout within the declared tolerances, for every duration, target,
  intensity and sport. Fields FIT cannot carry: the step numbers after a
  repeat block, which FIT renumbers; notes beyond the 254 bytes of a FIT
  string.
- **TCX**: Round-trip tested. Converting TCX → KRD → TCX keeps every value of
  a Running, Biking or Other workout within the declared tolerances. Fields
  TCX cannot carry: power targets other than a single watt value; a single
  heart rate, which comes back as a range from that value to itself; heart
  rate as a share of maximum; pace zones; repeat-until durations; step notes;
  the sub-sport; the recovery, interval and other intensities.
- **ZWO**: Round-trip tested. Converting ZWO → KRD → ZWO keeps every value of
  a bike or run workout within the declared tolerances. Fields ZWO cannot
  carry: cadence and pace targets; calorie, power-above and repeat-until
  durations; step notes; the sub-sport.
- **Garmin Connect (GCN)**: Round-trip tested. Converting GCN → KRD → GCN
  keeps every value of a running, cycling, swimming or cardio workout within
  the declared tolerances. Fields GCN cannot carry: a single target value,
  which is sent as a band and comes back as that range; power as a share of
  FTP and heart rate as a share of maximum, which are sent in watts and bpm;
  pace zones; heart-rate, power and repeat-until durations; step names; the
  sub-sport; the created date; the interval and other intensities, which come
  back as active.

These tests cover workouts: each format's writer refuses a recorded activity,
so no Round-trip is claimed for recorded activities or health data.

## Formats

- [FIT](/formats/fit) — Garmin's binary protocol
- [TCX](/formats/tcx) — Training Center XML
- [ZWO](/formats/zwo) — Zwift workout XML
- [GCN](/formats/gcn) — Garmin Connect JSON
- [KRD](/formats/krd) — Kaiord's canonical format
