# KRD Format Specification

**KRD** (Kaiord Representation Definition) is a JSON-based canonical format for workout data, inspired by the Garmin FIT protocol but designed for human readability and ease of manipulation.

## MIME Type

`application/vnd.kaiord+json`

## Design Principles

- **Round-trip safe**: Convert FIT/TCX/ZWO → KRD → FIT/TCX/ZWO without data loss
- **Schema-validated**: All KRD files must validate against `packages/core/schema/workout.json`
- **Normalized**: Consistent units and naming across all source formats
- **Extensible**: Support for custom fields via `extensions` object

## Core Structure

```json
{
  "version": "1.0",
  "type": "workout",
  "metadata": { ... },
  "sessions": [ ... ],
  "laps": [ ... ],
  "records": [ ... ]
}
```

## Top-Level Fields

### Required Fields

- **version** (string): KRD schema version (e.g., `"1.0"`)
- **type** (string): File type - `"workout"`, `"activity"`, `"course"`
- **metadata** (object): File-level metadata

### Optional Fields

- **sessions** (array): Training sessions
- **laps** (array): Lap/interval data
- **records** (array): Time-series data points
- **events** (array): Workout events (start, stop, pause, etc.)
- **extensions** (object): Format-specific extensions

## Metadata Object

```json
{
  "metadata": {
    "created": "2025-01-15T10:30:00Z",
    "manufacturer": "garmin",
    "product": "fenix7",
    "serialNumber": "1234567890",
    "sport": "running",
    "subSport": "trail"
  }
}
```

### Fields

- **created** (ISO 8601 timestamp): File creation time
- **manufacturer** (string): Device manufacturer
- **product** (string): Device model
- **serialNumber** (string, optional): Device serial number
- **sport** (string): Primary sport type
- **subSport** (string, optional): Sport subtype (e.g., "trail", "indoor_cycling", "lap_swimming")

## Workout Object

Represents a structured workout definition.

```json
{
  "workout": {
    "name": "Trail Run Workout",
    "sport": "running",
    "subSport": "trail",
    "poolLength": 25,
    "poolLengthUnit": "meters",
    "steps": [...]
  }
}
```

### Fields

- **name** (string, optional): Workout name
- **sport** (string): Primary sport type
- **subSport** (string, optional): Sport subtype for detailed categorization
- **poolLength** (number, optional): Pool length in meters (swimming workouts); bounded to [1, 655]
- **poolLengthUnit** (string, optional): Always "meters" in KRD
- **steps** (array): Array of workout steps or repetition blocks

## Workout Step Object

Represents an individual interval or segment within a workout.

```json
{
  "stepIndex": 0,
  "durationType": "time",
  "duration": {
    "type": "time",
    "seconds": 600
  },
  "targetType": "heart_rate",
  "target": {
    "type": "heart_rate",
    "value": {
      "unit": "zone",
      "value": 2
    }
  },
  "intensity": "warmup",
  "notes": "Easy warmup, focus on form",
  "equipment": "swim_fins"
}
```

### Fields

- **stepIndex** (number): Step sequence number
- **durationType** (string): Type of duration (time, distance, calories, power_less_than, etc.)
- **duration** (object): Duration specification
- **targetType** (string): Type of target (power, heart_rate, pace, cadence, open)
- **target** (object): Target specification
- **intensity** (string, optional): Intensity level (warmup, active, cooldown, rest)
- **notes** (string, optional): Coaching instructions (max 256 characters)
- **equipment** (string, optional): Required equipment (swim_fins, swim_kickboard, etc.)

## Duration Types

### Standard Durations

- **time**: Duration in seconds

  ```json
  { "type": "time", "seconds": 600 }
  ```

- **distance**: Duration in meters

  ```json
  { "type": "distance", "meters": 5000 }
  ```

- **open**: Open-ended duration (manual lap button)
  ```json
  { "type": "open" }
  ```

### Calorie-Based Durations

- **calories**: Step ends after burning specified calories

  ```json
  { "type": "calories", "calories": 200 }
  ```

- **repeat_until_calories**: Repeat until total calories reached
  ```json
  { "type": "repeat_until_calories", "calories": 500, "repeatFrom": 0 }
  ```

### Power-Based Durations

- **power_less_than**: Step ends when power drops below threshold (watts)

  ```json
  { "type": "power_less_than", "watts": 150 }
  ```

- **power_greater_than**: Step ends when power exceeds threshold (watts)

  ```json
  { "type": "power_greater_than", "watts": 300 }
  ```

- **repeat_until_power_less_than**: Repeat until power drops below threshold

  ```json
  { "type": "repeat_until_power_less_than", "watts": 150, "repeatFrom": 0 }
  ```

- **repeat_until_power_greater_than**: Repeat until power exceeds threshold
  ```json
  { "type": "repeat_until_power_greater_than", "watts": 300, "repeatFrom": 0 }
  ```

### Heart Rate Conditionals

- **heart_rate_less_than**: Step ends when HR drops below threshold (bpm)

  ```json
  { "type": "heart_rate_less_than", "bpm": 120 }
  ```

- **repeat_until_heart_rate_less_than**: Repeat until HR drops below threshold

  ```json
  { "type": "repeat_until_heart_rate_less_than", "bpm": 120, "repeatFrom": 0 }
  ```

- **repeat_until_heart_rate_greater_than**: Repeat until HR exceeds threshold
  ```json
  {
    "type": "repeat_until_heart_rate_greater_than",
    "bpm": 160,
    "repeatFrom": 0
  }
  ```

### Additional Repeat Conditionals

- **repeat_until_time**: Repeat until cumulative time reached

  ```json
  { "type": "repeat_until_time", "seconds": 1800, "repeatFrom": 0 }
  ```

- **repeat_until_distance**: Repeat until cumulative distance reached

  ```json
  { "type": "repeat_until_distance", "meters": 10000, "repeatFrom": 0 }
  ```

- **repeat_until_steps_complete**: Repeat specified number of times
  ```json
  { "type": "repeat_until_steps_complete", "repeatCount": 5, "repeatFrom": 0 }
  ```

## Target Types

### Power Targets

```json
{
  "type": "power",
  "value": {
    "unit": "watts",
    "value": 250
  }
}
```

Supported units:

- **watts**: Absolute power in watts (0-5000)
- **percent_ftp**: Percentage of Functional Threshold Power (0-1000)
- **zone**: Power zone (1-7)
- **range**: Power range with min/max values (each 0-5000, min <= max)

### Heart Rate Targets

```json
{
  "type": "heart_rate",
  "value": {
    "unit": "bpm",
    "value": 145
  }
}
```

Supported units:

- **bpm**: Beats per minute (0-300)
- **percent_max**: Percentage of maximum heart rate (0-100)
- **zone**: Heart rate zone (1-5)
- **range**: Heart rate range with min/max values (each 0-300, min <= max)

### Pace Targets

```json
{
  "type": "pace",
  "value": {
    "unit": "meters_per_second",
    "value": 3.5
  }
}
```

Supported units:

- **meters_per_second**: Speed in m/s (0-30)
- **zone**: Pace zone
- **range**: Pace range with min/max values (each 0-30, min <= max)

### Cadence Targets

```json
{
  "type": "cadence",
  "value": {
    "unit": "rpm",
    "value": 90
  }
}
```

Supported units:

- **rpm**: Revolutions per minute (cycling) or steps per minute / 2 (running), 0-300
- **zone**: Cadence zone
- **range**: Cadence range with min/max values (each 0-300, min <= max)

### Open Target

```json
{
  "type": "open"
}
```

No specific target - user controls intensity.

## Session Object

Represents a complete training session.

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

### Key Fields

- **startTime** (ISO 8601): Session start timestamp
- **totalElapsedTime** (number): Total elapsed time in seconds
- **totalTimerTime** (number): Active time in seconds (excludes pauses)
- **totalDistance** (number): Distance in meters
- **sport** (string): Sport type for this session

## Lap Object

Represents a lap or interval within a session.

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

## Record Object

Time-series data point (typically 1Hz or higher).

```json
{
  "records": [
    {
      "timestamp": "2025-01-15T10:30:00Z",
      "position": {
        "lat": 41.3851,
        "lon": 2.1734
      },
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

### Key Fields

- **timestamp** (ISO 8601): Record timestamp
- **position** (object, optional): GPS coordinates
  - **lat** (number): Latitude in degrees (-90 to 90)
  - **lon** (number): Longitude in degrees (-180 to 180)
- **altitude** (number, optional): Elevation in meters
- **heartRate** (number, optional): Heart rate in bpm
- **cadence** (number, optional): Cadence in rpm (running: spm/2)
- **power** (number, optional): Power in watts
- **speed** (number, optional): Speed in m/s
- **distance** (number, optional): Cumulative distance in meters

## Units & Conventions

### Standard Units

- **Time**: seconds (integer or float)
- **Distance**: meters
- **Speed**: meters per second (m/s)
- **Altitude**: meters
- **Temperature**: degrees Celsius
- **Heart Rate**: beats per minute (bpm)
- **Cadence**: revolutions per minute (rpm)
  - Running: steps per minute / 2
- **Power**: watts (W)
- **Timestamps**: ISO 8601 UTC format

### Naming Conventions

- **camelCase** for all field names
- **Prefixes**:
  - `total*` for cumulative values (totalDistance, totalCalories)
  - `avg*` for averages (avgHeartRate, avgPower)
  - `max*` for maximums (maxHeartRate, maxSpeed)
  - `min*` for minimums (minAltitude)

## Supported FIT Fields

Kaiord supports the following FIT message types and fields:

### File ID Message (`fileIdMesgs`)

- **manufacturer**: Device manufacturer
- **product**: Device model
- **serialNumber**: Device serial number
- **timeCreated**: File creation timestamp
- **type**: File type (workout, activity, course)

### Workout Message (`workoutMesgs`)

- **wktName**: Workout name
- **sport**: Sport type
- **subSport**: Sport subtype
- **poolLength**: Pool length (swimming)
- **poolLengthUnit**: Pool length unit

### Workout Step Message (`workoutStepMesgs`)

- **messageIndex**: Step index
- **durationType**: Duration type (time, distance, calories, etc.)
- **durationValue**: Duration value (milliseconds for time)
- **durationTime**: Duration in seconds
- **durationDistance**: Duration in meters
- **durationCalories**: Duration in calories
- **durationHr**: Heart rate threshold (bpm)
- **durationPower**: Power threshold (watts)
- **durationStep**: Repeat from step index
- **targetType**: Target type (power, heart rate, cadence, speed, open)
- **targetValue**: Target value (depends on type)
- **customTargetValueLow**: Custom target low value
- **customTargetValueHigh**: Custom target high value
- **targetHrZone**: Heart rate zone (1-5)
- **targetPowerZone**: Power zone (1-7)
- **targetCadenceZone**: Cadence zone
- **targetSpeedZone**: Speed zone
- **intensity**: Intensity level (warmup, active, cooldown, rest)
- **notes**: Coaching instructions
- **equipment**: Required equipment

### Developer Fields

Kaiord preserves FIT developer fields in the `extensions.fit.developerFields` array:

```json
{
  "extensions": {
    "fit": {
      "developerFields": [
        {
          "fieldDefinitionNumber": 0,
          "fieldName": "custom_field",
          "value": 42
        }
      ]
    }
  }
}
```

### Unknown Messages

Kaiord preserves unknown FIT message types in `extensions.fit.unknownMessages`:

```json
{
  "extensions": {
    "fit": {
      "unknownMessages": {
        "customMesgs": [
          {
            "field1": "value1",
            "field2": 123
          }
        ]
      }
    }
  }
}
```

## Extensions

Format-specific data that doesn't fit the core schema:

```json
{
  "extensions": {
    "fit": {
      "developerFields": [ ... ],
      "unknownMessages": { ... }
    },
    "tcx": {
      "extensions": { ... }
    },
    "zwift": {
      "originalDurationType": "distance",
      "originalDurationMeters": 500
    }
  }
}
```

## Validation Rules

1. All KRD files MUST validate against the JSON schema
2. Timestamps MUST be in ISO 8601 format with UTC timezone
3. Numeric values MUST be finite (no NaN or Infinity)
4. Arrays MUST be sorted by timestamp where applicable
5. Required fields MUST be present; optional fields may be omitted (not null)

## Example: Minimal Valid KRD

```json
{
  "version": "1.0",
  "type": "workout",
  "metadata": {
    "created": "2025-01-15T10:30:00Z",
    "sport": "running"
  },
  "sessions": [
    {
      "startTime": "2025-01-15T10:30:00Z",
      "totalElapsedTime": 3600,
      "totalDistance": 10000,
      "sport": "running"
    }
  ]
}
```

## Example: Complete Workout

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
          "duration": {
            "type": "time",
            "seconds": 600
          },
          "targetType": "power",
          "target": {
            "type": "power",
            "value": {
              "unit": "percent_ftp",
              "value": 60
            }
          },
          "intensity": "warmup",
          "notes": "Easy warmup"
        },
        {
          "stepIndex": 1,
          "durationType": "time",
          "duration": {
            "type": "time",
            "seconds": 300
          },
          "targetType": "power",
          "target": {
            "type": "power",
            "value": {
              "unit": "percent_ftp",
              "value": 105
            }
          },
          "intensity": "active",
          "notes": "Hard effort"
        },
        {
          "stepIndex": 2,
          "durationType": "time",
          "duration": {
            "type": "time",
            "seconds": 180
          },
          "targetType": "power",
          "target": {
            "type": "power",
            "value": {
              "unit": "percent_ftp",
              "value": 50
            }
          },
          "intensity": "rest",
          "notes": "Recovery"
        },
        {
          "stepIndex": 3,
          "durationType": "time",
          "duration": {
            "type": "time",
            "seconds": 300
          },
          "targetType": "power",
          "target": {
            "type": "power",
            "value": {
              "unit": "percent_ftp",
              "value": 50
            }
          },
          "intensity": "cooldown",
          "notes": "Easy cooldown"
        }
      ]
    }
  }
}
```

## Format-Specific Considerations

### Zwift Format Extensions

When converting to/from Zwift format (.zwo), some data may be lost or transformed. See [Zwift Format Extensions](../packages/core/docs/zwift-format-extensions.md) for details on:

- Heart rate target limitations (Zwift doesn't support HR targets)
- Distance-to-time duration conversions
- Absolute watts to percent FTP conversions
- Conditional duration handling

### Round-Trip Tolerances

When performing round-trip conversions (FIT → KRD → FIT), the following tolerances are acceptable:

- **Time**: ±1 second
- **Power**: ±1 watt or ±1% FTP
- **Heart Rate**: ±1 bpm
- **Cadence**: ±1 rpm
- **Distance**: ±1 meter

## KRD v2.0 — Health Domain Extension

KRD v2.0 extends the canonical format to carry health-domain payloads
(sleep, weight, HRV, daily wellness, body composition, stress) alongside
the existing workout / activity / course types. The full proposal lives in
`openspec/changes/add-health-metrics-to-krd/`.

### Breaking changes (v1.x → v2.0)

External consumers that validate KRD with `@kaiord/core@<2`'s Zod schemas
may break in three places:

1. **`type` enum grew from 3 to 9 variants.** New variants:
   `sleep_record`, `weight_measurement`, `hrv_summary`, `daily_wellness`,
   `body_composition`, `stress_episode`. Exhaustive `switch` consumers
   must add the new cases or fall back to a default branch.
2. **`metadata.sport` is now conditionally optional.** A `superRefine` on
   `krdSchema` keeps `metadata.sport` required for the three legacy
   workout/activity/course types, so v1.x payloads continue to validate
   byte-equivalently for those. Health-type payloads MUST omit `sport`.
3. **`extensions` is tagged.** It was `z.record(z.string(), z.unknown())`;
   it is now `krdExtensionsSchema` — a tagged shape with
   `catchall(z.unknown())` that strictly validates the reserved
   namespaces (`structured_workout`, `fit`, `course`, `course_points`,
   `health.{sleep|weight|hrv|daily|bodyComposition|stress}`) while still
   preserving any adapter-defined / unknown namespaces.

### `extensions.health.*` namespace

Each health type's payload lives in `extensions.health.<metric>`:

```json
{
  "version": "2.0",
  "type": "sleep_record",
  "metadata": { "created": "2026-05-22T07:00:00Z" },
  "extensions": {
    "health": {
      "sleep": {
        "kind": "sleep",
        "version": "2.0",
        "startTime": "2026-05-21T23:00:00Z",
        "endTime": "2026-05-22T07:00:00Z",
        "totalDurationSeconds": 28800,
        "stages": [
          {
            "stage": "light",
            "startTime": "2026-05-21T23:00:00Z",
            "durationSeconds": 10800
          }
        ]
      }
    }
  }
}
```

Sub-schema definitions are in
`packages/core/src/domain/schemas/health/`. Each sub-schema declares a
`version` field constrained by `z.string().regex(/^2\.\d+$/)` so future
v2.x additions can ship optional fields without bumping the canonical KRD
version.

### Adapter coverage

FIT is the only bidirectional adapter for the six health types in v2.0.
TCX, ZWO, and GCN are workout-only by their format specs and throw a
typed `UnsupportedKrdTypeError` when asked to write a health-type KRD.
The complete matrix is in
[`packages/core/docs/ADAPTER-COVERAGE.md`](../packages/core/docs/ADAPTER-COVERAGE.md).

### Health follow-ups (deferred to separate changes)

- FIT mappers for the six health types (Sleep / Weight / HRV / Daily /
  BodyComposition / Stress) — implementation is gated on fixture
  availability.
- Garmin Connect HTTP endpoints for health
  (`/wellness-service/wellness/*`, `/sleep-service/sleep`,
  `/weight-service/weight`, `/hrv/*`, `/stress/*`) in
  `@kaiord/garmin-connect`.
- Garmin browser-bridge extension scraping of
  `connect.garmin.com/wellness/*`.
- Write-back of weight (or any health metric) to Garmin Connect.
- Non-Garmin health-data sources (WHOOP, Oura, Apple Health, Strava
  wellness).
- SPA Health & Training Hub (new primary navigation surface +
  `/health/*` routes) and Dexie v14 migration with six health stores
  mirroring the `extensions.health.*` shape.
- MCP tools for health-aware AI workflows.

## References

- [Garmin FIT SDK](https://github.com/garmin/fit-javascript-sdk)
- [FIT Workout Files](https://developer.garmin.com/fit/cookbook/encoding-workout-files/)
- [FIT File Types](https://developer.garmin.com/fit/file-types/workout/)
- [Zwift Format Extensions](../packages/core/docs/zwift-format-extensions.md)
- [Adapter Coverage Matrix](../packages/core/docs/ADAPTER-COVERAGE.md)
- [TCX Schema](https://www8.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd)
