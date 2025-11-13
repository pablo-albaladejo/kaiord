# New Field Support in Kaiord

This document describes the new optional fields added to Kaiord for enhanced FIT file compatibility.

## Overview

Kaiord now supports additional optional fields from the Garmin FIT specification, organized into two priority levels:

- **Priority 1**: High-value fields for workout metadata and coaching (sub-sport, notes)
- **Priority 2**: Swimming-specific fields and advanced duration types

All new fields are **optional** and maintain **backward compatibility** with existing KRD files.

---

## Priority 1: Workout Metadata & Step Notes

### Sub-Sport Field

The `subSport` field provides more detailed categorization within a sport type.

#### KRD Format

```json
{
  "version": "1.0",
  "type": "workout",
  "metadata": {
    "created": "2025-01-15T10:30:00Z",
    "sport": "running"
  },
  "workout": {
    "name": "Trail Run Workout",
    "sport": "running",
    "subSport": "trail",
    "steps": [...]
  }
}
```

#### Supported Sub-Sports

**Running**:

- `generic` - General running
- `treadmill` - Treadmill running
- `street` - Street running
- `trail` - Trail running
- `track` - Track running

**Cycling**:

- `generic` - General cycling
- `indoor_cycling` - Indoor/spin cycling
- `road` - Road cycling
- `mountain` - Mountain biking
- `gravel` - Gravel cycling
- `cyclocross` - Cyclocross
- `hand_cycling` - Hand cycling
- `track_cycling` - Track cycling

**Swimming**:

- `generic` - General swimming
- `lap_swimming` - Pool swimming
- `open_water` - Open water swimming

**Other Sports**:

- `elliptical` - Elliptical trainer
- `stair_climbing` - Stair climbing
- `indoor_rowing` - Indoor rowing

#### Round-Trip Behavior

- FIT → KRD: Maps `sub_sport` to `subSport` (camelCase)
- KRD → FIT: Maps `subSport` to `sub_sport` (snake_case)
- Exact value preservation through round-trip conversion
- Omitted when not present (not set to null)

---

### Workout Step Notes

The `notes` field allows coaches to add instructional text to workout steps.

#### KRD Format

```json
{
  "steps": [
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
      "notes": "Easy warmup, focus on form and breathing"
    },
    {
      "stepIndex": 1,
      "durationType": "distance",
      "duration": {
        "type": "distance",
        "meters": 1000
      },
      "targetType": "pace",
      "target": {
        "type": "pace",
        "value": {
          "unit": "min_per_km",
          "value": 4.5
        }
      },
      "intensity": "active",
      "notes": "Maintain steady effort, check cadence every 200m"
    }
  ]
}
```

#### Constraints

- **Maximum length**: 256 characters
- **Encoding**: UTF-8 text
- **Validation**: Automatically validated during conversion

#### Round-Trip Behavior

- FIT → KRD: Direct mapping of `notes` field
- KRD → FIT: Direct mapping of `notes` field
- Exact text preservation through round-trip conversion
- Omitted when not present (not set to null)

---

## Priority 2: Swimming Workouts

### Pool Length

Swimming workouts can now specify pool dimensions.

#### KRD Format

```json
{
  "version": "1.0",
  "type": "workout",
  "metadata": {
    "created": "2025-01-15T10:30:00Z",
    "sport": "swimming"
  },
  "workout": {
    "name": "Pool Swim Workout",
    "sport": "swimming",
    "subSport": "lap_swimming",
    "poolLength": 25,
    "poolLengthUnit": "meters",
    "steps": [...]
  }
}
```

#### Units

- **KRD**: Always stores pool length in **meters**
- **FIT**: Supports meters and yards
- **Conversion**: Automatic conversion from yards to meters (1 yard = 0.9144 meters)

#### Round-Trip Behavior

- FIT → KRD: Converts pool length to meters
- KRD → FIT: Outputs pool length in meters (unit = 0)
- Tolerance: ±0.01 meters for round-trip safety
- Omitted when not present (not set to null)

---

### Swimming Equipment

Workout steps can specify required swimming equipment.

#### KRD Format

```json
{
  "steps": [
    {
      "stepIndex": 0,
      "durationType": "distance",
      "duration": {
        "type": "distance",
        "meters": 400
      },
      "targetType": "open",
      "target": {
        "type": "open"
      },
      "intensity": "active",
      "equipment": "swim_fins",
      "notes": "Focus on kick technique"
    },
    {
      "stepIndex": 1,
      "durationType": "distance",
      "duration": {
        "type": "distance",
        "meters": 200
      },
      "targetType": "open",
      "target": {
        "type": "open"
      },
      "intensity": "active",
      "equipment": "swim_pull_buoy",
      "notes": "Upper body focus, no kicking"
    }
  ]
}
```

#### Supported Equipment

- `none` - No equipment
- `swim_fins` - Swimming fins
- `swim_kickboard` - Kickboard
- `swim_paddles` - Hand paddles
- `swim_pull_buoy` - Pull buoy
- `swim_snorkel` - Center snorkel

#### Round-Trip Behavior

- FIT → KRD: Maps equipment enum to snake_case
- KRD → FIT: Maps equipment enum to camelCase
- Exact value preservation through round-trip conversion
- Omitted when not present (not set to null)

---

## Priority 2: Advanced Duration Types

### Calorie-Based Durations

Steps can end based on calories burned.

#### Simple Calorie Duration

```json
{
  "durationType": "calories",
  "duration": {
    "type": "calories",
    "calories": 150
  }
}
```

#### Repeat Until Calories

```json
{
  "durationType": "repeat_until_calories",
  "duration": {
    "type": "repeat_until_calories",
    "calories": 500
  }
}
```

**Use case**: Repeat a block of intervals until 500 total calories are burned.

---

### Power-Based Durations

Steps can end based on power output thresholds.

#### Power Less Than

```json
{
  "durationType": "power_less_than",
  "duration": {
    "type": "power_less_than",
    "watts": 200
  }
}
```

**Use case**: Continue until power drops below 200W (fatigue test).

#### Power Greater Than

```json
{
  "durationType": "power_greater_than",
  "duration": {
    "type": "power_greater_than",
    "watts": 250
  }
}
```

**Use case**: Continue until power exceeds 250W (ramp test).

#### Repeat Until Power Thresholds

```json
{
  "durationType": "repeat_until_power_less_than",
  "duration": {
    "type": "repeat_until_power_less_than",
    "watts": 180
  }
}
```

**Use case**: Repeat intervals until power drops below 180W.

```json
{
  "durationType": "repeat_until_power_greater_than",
  "duration": {
    "type": "repeat_until_power_greater_than",
    "watts": 300
  }
}
```

**Use case**: Repeat intervals until power exceeds 300W.

---

### Additional Repeat Conditionals

#### Repeat Until Time

```json
{
  "durationType": "repeat_until_time",
  "duration": {
    "type": "repeat_until_time",
    "seconds": 3600
  }
}
```

**Use case**: Repeat a block until 60 minutes of total time.

#### Repeat Until Distance

```json
{
  "durationType": "repeat_until_distance",
  "duration": {
    "type": "repeat_until_distance",
    "meters": 10000
  }
}
```

**Use case**: Repeat a block until 10km total distance.

#### Repeat Until Heart Rate Less Than

```json
{
  "durationType": "repeat_until_heart_rate_less_than",
  "duration": {
    "type": "repeat_until_heart_rate_less_than",
    "bpm": 120
  }
}
```

**Use case**: Repeat intervals until heart rate drops below 120 bpm (recovery test).

---

## Complete Example: Advanced Swimming Workout

```json
{
  "version": "1.0",
  "type": "workout",
  "metadata": {
    "created": "2025-01-15T10:30:00Z",
    "manufacturer": "garmin",
    "product": "swim2",
    "sport": "swimming"
  },
  "workout": {
    "name": "Advanced Pool Workout",
    "sport": "swimming",
    "subSport": "lap_swimming",
    "poolLength": 25,
    "poolLengthUnit": "meters",
    "steps": [
      {
        "stepIndex": 0,
        "durationType": "distance",
        "duration": {
          "type": "distance",
          "meters": 400
        },
        "targetType": "open",
        "target": {
          "type": "open"
        },
        "intensity": "warmup",
        "notes": "Easy warmup, focus on technique"
      },
      {
        "stepIndex": 1,
        "durationType": "distance",
        "duration": {
          "type": "distance",
          "meters": 200
        },
        "targetType": "open",
        "target": {
          "type": "open"
        },
        "intensity": "active",
        "equipment": "swim_fins",
        "notes": "Kick drills with fins"
      },
      {
        "stepIndex": 2,
        "durationType": "repeat_until_distance",
        "duration": {
          "type": "repeat_until_distance",
          "meters": 2000
        },
        "targetType": "open",
        "target": {
          "type": "open"
        },
        "intensity": "active",
        "notes": "Main set: repeat 100m intervals until 2000m total"
      },
      {
        "stepIndex": 3,
        "durationType": "distance",
        "duration": {
          "type": "distance",
          "meters": 200
        },
        "targetType": "open",
        "target": {
          "type": "open"
        },
        "intensity": "cooldown",
        "equipment": "swim_pull_buoy",
        "notes": "Easy cooldown with pull buoy"
      }
    ]
  }
}
```

---

## Migration Guide

### Backward Compatibility

All new fields are **optional**. Existing KRD files without these fields will continue to work without modification.

### Duration Type Naming Change

The duration type `heart_rate_greater_than` has been renamed to `repeat_until_heart_rate_greater_than` for consistency.

**Old naming (deprecated)**:

```json
{
  "durationType": "heart_rate_greater_than",
  "duration": {
    "type": "heart_rate_greater_than",
    "bpm": 160
  }
}
```

**New naming (preferred)**:

```json
{
  "durationType": "repeat_until_heart_rate_greater_than",
  "duration": {
    "type": "repeat_until_heart_rate_greater_than",
    "bpm": 160
  }
}
```

**Migration**: Both variants are currently supported. New conversions from FIT will use the new naming. Update existing KRD files to use the new naming for consistency.

---

## Round-Trip Tolerances

All new fields maintain round-trip safety with the following tolerances:

| Field Type        | Tolerance    |
| ----------------- | ------------ |
| Sub-sport         | Exact match  |
| Notes             | Exact match  |
| Pool length       | ±0.01 meters |
| Equipment         | Exact match  |
| Calorie values    | Exact match  |
| Power values      | ±1 watt      |
| Time values       | ±1 second    |
| Distance values   | ±1 meter     |
| Heart rate values | ±1 bpm       |

---

## References

- [Garmin FIT SDK](https://github.com/garmin/fit-javascript-sdk)
- [FIT Workout Files Cookbook](https://developer.garmin.com/fit/cookbook/encoding-workout-files/)
- [FIT File Types: Workout](https://developer.garmin.com/fit/file-types/workout/)
- [KRD Format Specification](.kiro/steering/krd-format.md)
