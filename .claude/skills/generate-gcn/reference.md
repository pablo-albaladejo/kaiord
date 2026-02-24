# GCN Input Format Complete Reference

**IMPORTANT**: This is the INPUT format (what Garmin Connect API accepts to create a workout). Do NOT include server-generated fields like `workoutId`, `ownerId`, `author`, `createdDate`, `shared`, etc.

## Root-Level Schema (required fields)

```json
{
  "sportType": {"sportTypeId": 2, "sportTypeKey": "cycling"},
  "workoutName": "Workout Name (max 255 chars)",
  "workoutSegments": [{ /* one segment */ }]
}
```

**Optional root fields**: `description` (max 2000 chars), `poolLength`, `poolLengthUnit`, `avgTrainingSpeed`, `estimatedDurationInSecs`, `estimatedDistanceInMeters`.

## Segment Schema (required fields)

```json
{
  "segmentOrder": 1,
  "sportType": {"sportTypeId": 2, "sportTypeKey": "cycling"},
  "workoutSteps": [ /* 1-50 steps */ ]
}
```

**Optional segment fields**: `description`, `poolLength`, `poolLengthUnit`.

## ExecutableStepDTO Schema

**Required**: `type`, `stepOrder`, `stepType`, `endCondition`, `endConditionValue`, `targetType`
**Optional**: `stepId`, `description` (max 500), `zoneNumber`, `targetValueOne`, `targetValueTwo`, `secondaryTargetType`, `secondaryTargetValueOne`, `secondaryTargetValueTwo`, `strokeType`, `equipmentType`, `childStepId`

## RepeatGroupDTO Schema

**Required**: `type`, `stepOrder`, `stepType`, `numberOfIterations` (1-99), `endCondition`, `endConditionValue`, `workoutSteps`
**Optional**: `stepId`, `smartRepeat`, `description`, `childStepId`

---

## Complete Cycling Example

Input: "10min warmup Z2, 5x(5min at 280-320W + 3min recovery at 100-150W), 10min cooldown"

```json
{
  "sportType": {"sportTypeId": 2, "sportTypeKey": "cycling"},
  "workoutName": "5x5 Power Intervals",
  "workoutSegments": [{
    "segmentOrder": 1,
    "sportType": {"sportTypeId": 2, "sportTypeKey": "cycling"},
    "workoutSteps": [
      {
        "type": "ExecutableStepDTO",
        "stepId": 1, "stepOrder": 1,
        "stepType": {"stepTypeId": 1, "stepTypeKey": "warmup"},
        "endCondition": {"conditionTypeId": 2, "conditionTypeKey": "time", "displayable": true},
        "endConditionValue": 600,
        "targetType": {"workoutTargetTypeId": 2, "workoutTargetTypeKey": "power.zone"},
        "zoneNumber": 2
      },
      {
        "type": "RepeatGroupDTO",
        "stepId": 2, "stepOrder": 2,
        "stepType": {"stepTypeId": 6, "stepTypeKey": "repeat"},
        "numberOfIterations": 5,
        "smartRepeat": false,
        "endCondition": {"conditionTypeId": 7, "conditionTypeKey": "iterations", "displayable": false},
        "endConditionValue": 5,
        "workoutSteps": [
          {
            "type": "ExecutableStepDTO",
            "stepId": 3, "stepOrder": 1,
            "stepType": {"stepTypeId": 3, "stepTypeKey": "interval"},
            "endCondition": {"conditionTypeId": 2, "conditionTypeKey": "time", "displayable": true},
            "endConditionValue": 300,
            "targetType": {"workoutTargetTypeId": 2, "workoutTargetTypeKey": "power.zone"},
            "targetValueOne": 280,
            "targetValueTwo": 320
          },
          {
            "type": "ExecutableStepDTO",
            "stepId": 4, "stepOrder": 2,
            "stepType": {"stepTypeId": 4, "stepTypeKey": "recovery"},
            "endCondition": {"conditionTypeId": 2, "conditionTypeKey": "time", "displayable": true},
            "endConditionValue": 180,
            "targetType": {"workoutTargetTypeId": 2, "workoutTargetTypeKey": "power.zone"},
            "targetValueOne": 100,
            "targetValueTwo": 150
          }
        ]
      },
      {
        "type": "ExecutableStepDTO",
        "stepId": 5, "stepOrder": 3,
        "stepType": {"stepTypeId": 2, "stepTypeKey": "cooldown"},
        "endCondition": {"conditionTypeId": 2, "conditionTypeKey": "time", "displayable": true},
        "endConditionValue": 600,
        "targetType": {"workoutTargetTypeId": 1, "workoutTargetTypeKey": "no.target"}
      }
    ]
  }]
}
```

## Complete Running Example

Input: "10min warmup easy, 6x(400m at 4:00-4:15/km pace + 200m jog recovery), 10min cooldown"

```json
{
  "sportType": {"sportTypeId": 1, "sportTypeKey": "running"},
  "workoutName": "6x400m Track Intervals",
  "workoutSegments": [{
    "segmentOrder": 1,
    "sportType": {"sportTypeId": 1, "sportTypeKey": "running"},
    "workoutSteps": [
      {
        "type": "ExecutableStepDTO",
        "stepId": 1, "stepOrder": 1,
        "stepType": {"stepTypeId": 1, "stepTypeKey": "warmup"},
        "endCondition": {"conditionTypeId": 2, "conditionTypeKey": "time", "displayable": true},
        "endConditionValue": 600,
        "targetType": {"workoutTargetTypeId": 1, "workoutTargetTypeKey": "no.target"}
      },
      {
        "type": "RepeatGroupDTO",
        "stepId": 2, "stepOrder": 2,
        "stepType": {"stepTypeId": 6, "stepTypeKey": "repeat"},
        "numberOfIterations": 6,
        "smartRepeat": false,
        "endCondition": {"conditionTypeId": 7, "conditionTypeKey": "iterations", "displayable": false},
        "endConditionValue": 6,
        "workoutSteps": [
          {
            "type": "ExecutableStepDTO",
            "stepId": 3, "stepOrder": 1,
            "stepType": {"stepTypeId": 3, "stepTypeKey": "interval"},
            "endCondition": {"conditionTypeId": 3, "conditionTypeKey": "distance", "displayable": true},
            "endConditionValue": 400,
            "targetType": {"workoutTargetTypeId": 6, "workoutTargetTypeKey": "pace.zone"},
            "targetValueOne": 3.92,
            "targetValueTwo": 4.17
          },
          {
            "type": "ExecutableStepDTO",
            "stepId": 4, "stepOrder": 2,
            "stepType": {"stepTypeId": 4, "stepTypeKey": "recovery"},
            "endCondition": {"conditionTypeId": 3, "conditionTypeKey": "distance", "displayable": true},
            "endConditionValue": 200,
            "targetType": {"workoutTargetTypeId": 1, "workoutTargetTypeKey": "no.target"}
          }
        ]
      },
      {
        "type": "ExecutableStepDTO",
        "stepId": 5, "stepOrder": 3,
        "stepType": {"stepTypeId": 2, "stepTypeKey": "cooldown"},
        "endCondition": {"conditionTypeId": 2, "conditionTypeKey": "time", "displayable": true},
        "endConditionValue": 600,
        "targetType": {"workoutTargetTypeId": 1, "workoutTargetTypeKey": "no.target"}
      }
    ]
  }]
}
```

## Swimming Example (Pool 25m)

For swimming, add `poolLength`/`poolLengthUnit` at root level and use `strokeType`/`equipmentType` on steps:

```json
{
  "sportType": {"sportTypeId": 4, "sportTypeKey": "swimming"},
  "workoutName": "IM Drill Session",
  "poolLength": 25,
  "poolLengthUnit": {"unitId": 1, "unitKey": "meter", "factor": 100},
  "workoutSegments": [{
    "segmentOrder": 1,
    "sportType": {"sportTypeId": 4, "sportTypeKey": "swimming"},
    "poolLength": 25,
    "poolLengthUnit": {"unitId": 1, "unitKey": "meter", "factor": 100},
    "workoutSteps": [
      {
        "type": "ExecutableStepDTO",
        "stepId": 1, "stepOrder": 1,
        "stepType": {"stepTypeId": 1, "stepTypeKey": "warmup"},
        "endCondition": {"conditionTypeId": 3, "conditionTypeKey": "distance", "displayable": true},
        "endConditionValue": 200,
        "targetType": {"workoutTargetTypeId": 1, "workoutTargetTypeKey": "no.target"},
        "strokeType": {"strokeTypeId": 6, "strokeTypeKey": "free"}
      },
      {
        "type": "ExecutableStepDTO",
        "stepId": 2, "stepOrder": 2,
        "stepType": {"stepTypeId": 3, "stepTypeKey": "interval"},
        "endCondition": {"conditionTypeId": 3, "conditionTypeKey": "distance", "displayable": true},
        "endConditionValue": 100,
        "targetType": {"workoutTargetTypeId": 1, "workoutTargetTypeKey": "no.target"},
        "strokeType": {"strokeTypeId": 4, "strokeTypeKey": "drill"},
        "equipmentType": {"equipmentTypeId": 2, "equipmentTypeKey": "kickboard"},
        "description": "Drill con tabla"
      }
    ]
  }]
}
```

**Stroke types:** free (6), backstroke (2), breaststroke (3), fly (5), drill (4), any_stroke (1), mixed (7), im (8)
**Equipment:** fins (1), kickboard (2), paddles (3), pull_buoy (4), snorkel (5)

## Pace Conversion Table

| Pace (min/km) | m/s |
|---|---|
| 3:00 | 5.56 |
| 3:30 | 4.76 |
| 4:00 | 4.17 |
| 4:30 | 3.70 |
| 5:00 | 3.33 |
| 5:30 | 3.03 |
| 6:00 | 2.78 |
| 6:30 | 2.56 |
| 7:00 | 2.38 |

Formula: m/s = 1000 / (minutes * 60 + seconds)

## Common Workout Patterns

**Sweet Spot (cycling):** 88-94% FTP, typically 2x20min
**Threshold (cycling):** 95-105% FTP, 2x10-3x10min
**VO2max (cycling):** 106-120% FTP, 5x5min or 6x3min
**Endurance (cycling):** Z2 power, 60-180min continuous
**Tempo run:** Z3-Z4 HR, 20-40min continuous
**Track intervals (running):** 400m-1600m repeats at pace target
