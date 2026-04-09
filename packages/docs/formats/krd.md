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
  "metadata": {},
  "sessions": [],
  "laps": [],
  "records": []
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

| Type                          | Example                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `time`                        | `{ "type": "time", "seconds": 600 }`                                           |
| `distance`                    | `{ "type": "distance", "meters": 5000 }`                                       |
| `open`                        | `{ "type": "open" }`                                                           |
| `calories`                    | `{ "type": "calories", "calories": 200 }`                                      |
| `power_less_than`             | `{ "type": "power_less_than", "watts": 150 }`                                  |
| `power_greater_than`          | `{ "type": "power_greater_than", "watts": 300 }`                               |
| `heart_rate_less_than`        | `{ "type": "heart_rate_less_than", "bpm": 120 }`                               |
| `repeat_until_steps_complete` | `{ "type": "repeat_until_steps_complete", "repeatCount": 5, "repeatFrom": 0 }` |

Additional repeat types: `repeat_until_time`, `repeat_until_distance`, `repeat_until_calories`, `repeat_until_power_less_than`, `repeat_until_power_greater_than`, `repeat_until_heart_rate_less_than`, `repeat_until_heart_rate_greater_than`.

## Target types

| Type         | Units                                   |
| ------------ | --------------------------------------- |
| `power`      | `watts`, `percent_ftp`, `zone`, `range` |
| `heart_rate` | `bpm`, `percent_max`, `zone`, `range`   |
| `pace`       | `meters_per_second`, `zone`, `range`    |
| `cadence`    | `rpm`, `zone`, `range`                  |
| `open`       | No target                               |

## Sessions

Sessions capture training session summaries:

```json
{
  "sessions": [
    {
      "startTime": "2025-01-15T10:30:00Z",
      "totalElapsedTime": 3600,
      "totalTimerTime": 3540,
      "totalDistance": 10000,
      "sport": "running",
      "avgHeartRate": 145,
      "maxHeartRate": 178,
      "avgCadence": 85,
      "avgPower": 250,
      "totalCalories": 650
    }
  ]
}
```

Key fields: `startTime` (ISO 8601), `totalElapsedTime` (seconds), `totalTimerTime` (active time, excludes pauses), `totalDistance` (meters), `sport`.

## Laps

Laps represent intervals within a session:

```json
{
  "laps": [
    {
      "startTime": "2025-01-15T10:30:00Z",
      "totalElapsedTime": 600,
      "totalDistance": 1000,
      "avgHeartRate": 142,
      "maxHeartRate": 155,
      "avgCadence": 84,
      "avgPower": 245
    }
  ]
}
```

## Records

Time-series data points (typically 1 Hz):

```json
{
  "records": [
    {
      "timestamp": "2025-01-15T10:30:00Z",
      "position": { "lat": 41.3851, "lon": 2.1734 },
      "altitude": 12.5,
      "heartRate": 145,
      "cadence": 85,
      "power": 250,
      "speed": 2.78,
      "distance": 100
    }
  ]
}
```

Fields: `timestamp` (ISO 8601), `position` (lat/lon in degrees), `altitude` (meters), `heartRate` (bpm), `cadence` (rpm), `power` (watts), `speed` (m/s), `distance` (cumulative meters). All fields except `timestamp` are optional.

## Units and conventions

| Measurement | Unit                 |
| ----------- | -------------------- |
| Time        | seconds              |
| Distance    | meters               |
| Speed       | meters per second    |
| Altitude    | meters               |
| Heart rate  | bpm                  |
| Cadence     | rpm (running: spm/2) |
| Power       | watts                |
| Timestamps  | ISO 8601 UTC         |

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

FIT developer fields and unknown messages are preserved during round-trip conversions:

```json
{
  "extensions": {
    "fit": {
      "developerFields": [
        { "fieldDefinitionNumber": 0, "fieldName": "custom_field", "value": 42 }
      ]
    }
  }
}
```

## Validation rules

1. All KRD files MUST validate against the Zod schema
2. Timestamps MUST be in ISO 8601 format with UTC timezone
3. Numeric values MUST be finite (no NaN or Infinity)
4. Arrays MUST be sorted by timestamp where applicable
5. Required fields MUST be present; optional fields may be omitted (not null)

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

## Example: complete workout

```json
{
  "version": "1.0",
  "type": "workout",
  "metadata": {
    "created": "2025-01-15T10:30:00Z",
    "manufacturer": "garmin",
    "product": "fenix7",
    "sport": "cycling",
    "subSport": "indoor_cycling"
  },
  "extensions": {
    "workout": {
      "name": "FTP Intervals",
      "sport": "cycling",
      "steps": [
        {
          "stepIndex": 0,
          "durationType": "time",
          "duration": { "type": "time", "seconds": 600 },
          "targetType": "power",
          "target": {
            "type": "power",
            "value": { "unit": "percent_ftp", "value": 60 }
          },
          "intensity": "warmup",
          "notes": "Easy warmup"
        },
        {
          "stepIndex": 1,
          "durationType": "time",
          "duration": { "type": "time", "seconds": 300 },
          "targetType": "power",
          "target": {
            "type": "power",
            "value": { "unit": "percent_ftp", "value": 105 }
          },
          "intensity": "active",
          "notes": "Hard effort"
        },
        {
          "stepIndex": 2,
          "durationType": "time",
          "duration": { "type": "time", "seconds": 180 },
          "targetType": "power",
          "target": {
            "type": "power",
            "value": { "unit": "percent_ftp", "value": 50 }
          },
          "intensity": "rest",
          "notes": "Recovery"
        },
        {
          "stepIndex": 3,
          "durationType": "time",
          "duration": { "type": "time", "seconds": 300 },
          "targetType": "power",
          "target": {
            "type": "power",
            "value": { "unit": "percent_ftp", "value": 50 }
          },
          "intensity": "cooldown",
          "notes": "Easy cooldown"
        }
      ]
    }
  }
}
```

Ready to convert? Follow the [Quick Start](/guide/quick-start).
