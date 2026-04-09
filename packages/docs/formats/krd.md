---
title: "KRD Format"
description: "KRD (Kaiord Representation Definition) is a JSON-based canonical format for workout data. Round-trip safe, schema-validated, and extensible."
---

# KRD Format Specification

**KRD** (Kaiord Representation Definition) is a JSON-based canonical format for workout data, inspired by the Garmin FIT protocol but designed for human readability.

**MIME type**: `application/vnd.kaiord+json`

## Design principles

- **Round-trip safe** -- convert FIT/TCX/ZWO to KRD and back without data loss
- **Schema-validated** -- all KRD files validate against Zod schemas
- **Normalized** -- consistent units and naming across all source formats
- **Extensible** -- custom fields via `extensions` object

## Core structure

```json
{
  "version": "1.0",
  "type": "workout",
  "metadata": { },
  "sessions": [ ],
  "laps": [ ],
  "records": [ ]
}
```

### Required fields

- **version** (string): KRD schema version, e.g. `"1.0"`
- **type** (string): `"workout"`, `"activity"`, or `"course"`
- **metadata** (object): file-level metadata

### Optional fields

- **sessions** (array): training sessions
- **laps** (array): lap/interval data
- **records** (array): time-series data points
- **events** (array): workout events (start, stop, pause)
- **extensions** (object): format-specific extensions

## Metadata

```json
{
  "metadata": {
    "created": "2025-01-15T10:30:00Z",
    "manufacturer": "garmin",
    "product": "fenix7",
    "sport": "running",
    "subSport": "trail"
  }
}
```

## Workout steps

Workouts are stored in `extensions.workout.steps`:

```json
{
  "stepIndex": 0,
  "durationType": "time",
  "duration": { "type": "time", "seconds": 600 },
  "targetType": "heart_rate",
  "target": {
    "type": "heart_rate",
    "value": { "unit": "zone", "value": 2 }
  },
  "intensity": "warmup",
  "notes": "Easy warmup"
}
```

## Duration types

| Type | Example |
| --- | --- |
| `time` | `{ "type": "time", "seconds": 600 }` |
| `distance` | `{ "type": "distance", "meters": 5000 }` |
| `open` | `{ "type": "open" }` |
| `calories` | `{ "type": "calories", "calories": 200 }` |
| `power_less_than` | `{ "type": "power_less_than", "watts": 150 }` |
| `power_greater_than` | `{ "type": "power_greater_than", "watts": 300 }` |
| `heart_rate_less_than` | `{ "type": "heart_rate_less_than", "bpm": 120 }` |
| `repeat_until_steps_complete` | `{ "type": "repeat_until_steps_complete", "repeatCount": 5, "repeatFrom": 0 }` |

Additional repeat types: `repeat_until_time`, `repeat_until_distance`, `repeat_until_calories`, `repeat_until_power_less_than`, `repeat_until_power_greater_than`, `repeat_until_heart_rate_less_than`, `repeat_until_heart_rate_greater_than`.

## Target types

| Type | Units |
| --- | --- |
| `power` | `watts`, `percent_ftp`, `zone`, `range` |
| `heart_rate` | `bpm`, `percent_max`, `zone`, `range` |
| `pace` | `meters_per_second`, `zone`, `range` |
| `cadence` | `rpm`, `zone`, `range` |
| `open` | No target |

## Sessions, laps, and records

**Sessions** capture training session summaries (start time, elapsed time, distance, sport, averages).

**Laps** represent intervals within sessions (per-lap averages and maximums).

**Records** are time-series data points (timestamp, position, altitude, heart rate, cadence, power, speed, distance).

## Units and conventions

| Measurement | Unit |
| --- | --- |
| Time | seconds |
| Distance | meters |
| Speed | meters per second |
| Altitude | meters |
| Heart rate | bpm |
| Cadence | rpm (running: spm/2) |
| Power | watts |
| Timestamps | ISO 8601 UTC |

Field naming uses **camelCase** with prefixes: `total*`, `avg*`, `max*`, `min*`.

## Extensions

Format-specific data lives in `extensions`:

```json
{
  "extensions": {
    "fit": { "developerFields": [], "unknownMessages": {} },
    "tcx": { "extensions": {} },
    "zwift": { "originalDurationType": "distance" }
  }
}
```

## Round-trip tolerances

- Time: +/- 1 second
- Power: +/- 1 watt or +/- 1% FTP
- Heart rate: +/- 1 bpm
- Cadence: +/- 1 rpm
- Distance: +/- 1 meter

## Example: minimal valid KRD

```json
{
  "version": "1.0",
  "type": "workout",
  "metadata": {
    "created": "2025-01-15T10:30:00Z",
    "sport": "running"
  }
}
```

Ready to convert? Follow the [Quick Start](/guide/quick-start).
