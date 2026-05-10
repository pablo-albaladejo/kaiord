# Multisport / Brick / Triathlon Workouts

When the user describes a workout that alternates between sports (running and cycling, for example, or a full triathlon), you are generating a **multisport** GCN. Multisport rules differ from single-sport ones; read this file end-to-end before producing the JSON.

## When to use multisport

Trigger words / phrases (any language):

- `multisport`, `multi-sport`, `multi sport`
- `brick`, `triatlón`, `triathlon`, `duatlón`, `duathlon`, `aquathlon`
- `transición`, `transition`, `transiciones`
- Two or more sports alternating in the same session ("8x 400m run + 1km bike")

If the workout involves more than one sport AND the user wants the device to prompt them at sport boundaries, it is multisport.

## Root-level shape

```json
{
  "sportType": {
    "sportTypeId": 10,
    "sportTypeKey": "multi_sport",
    "displayOrder": 4
  },
  "subSportType": null,
  "workoutName": "<= 255 chars",
  "description": "<= 2000 chars",
  "isSessionTransitionEnabled": true,
  "workoutSegments": [
    /* one segment per sport leg */
  ]
}
```

Mandatory:

- `sportType.sportTypeId: 10`, `sportType.sportTypeKey: "multi_sport"`.
- `isSessionTransitionEnabled: true` to enable lap-button transitions between segments. Without this, the device flows through all segments without prompting.

Forbidden:

- Do **not** create segments with `sportTypeKey: "transition"` or `sportTypeId: 8`. There is no transition sport in Garmin's data model. Transitions are an implicit consequence of `isSessionTransitionEnabled: true` plus segments of different sports.

## Segment composition rules (CRITICAL)

Garmin's server silently rewrites multisport segments that violate these rules. Following them is the difference between "the workout you intended" and "a corrupted workout with steps in the wrong segments". The full empirical write-up is in [`packages/garmin/docs/MULTISPORT-TRANSITIONS.md`](../../../packages/garmin/docs/MULTISPORT-TRANSITIONS.md). The summary:

```text
ALLOWED in one segment:
  • warmup + repeat        (first segment, "warmup with strides")
  • warmup alone           (first segment)
  • single interval        (any position)
  • interval + cooldown    (last segment)
  • cooldown alone         (last segment)

FORBIDDEN — server splits / reorders if you ship these:
  • warmup + repeat + interval        ← biggest gotcha
  • two or more top-level intervals
  • warmup + interval (no repeat)
```

### Practical brick layout

For an 8x (run + bike) brick, use **17 segments**:

```text
Seg  1  RUNNING  warmup + repeat 4x(progressive + rest)
Seg  2  RUNNING  run rep 1 (single interval)
Seg  3  CYCLING  bike rep 1 (single interval)
Seg  4  RUNNING  run rep 2
Seg  5  CYCLING  bike rep 2
...
Seg 16  RUNNING  run rep 8
Seg 17  CYCLING  bike rep 8 + cooldown
```

If you tried to keep the warmup, repeat, and first run interval in the same segment-1, the server would split them and shift sport labels for every subsequent segment. Don't.

## Range targets — faster first

For `pace.zone`, `power.zone`, and `speed.zone` ranges, place the **faster / higher-intensity** value in `targetValueOne` and the **slower / lower-intensity** value in `targetValueTwo`:

| Target type  | `targetValueOne`    | `targetValueTwo`   |
| ------------ | ------------------- | ------------------ |
| `pace.zone`  | higher m/s (faster) | lower m/s (slower) |
| `power.zone` | higher watts        | lower watts        |
| `speed.zone` | higher m/s          | lower m/s          |

Sending values in the opposite order causes Garmin to silently reverse them on a subset of segments, producing inconsistent display. `heart.rate.zone` and `cadence` are unaffected.

Example for "Z4 pace 4:40-4:30/km":

```json
"targetType": { "workoutTargetTypeId": 6, "workoutTargetTypeKey": "pace.zone", "displayOrder": 6 },
"targetValueOne": 3.7,   // faster (4:30/km)
"targetValueTwo": 3.57   // slower (4:40/km)
```

Example for "Z3 power 260-273W":

```json
"targetType": { "workoutTargetTypeId": 2, "workoutTargetTypeKey": "power.zone", "displayOrder": 2 },
"targetValueOne": 273,
"targetValueTwo": 260
```

## Global `stepOrder`

In multisport workouts, `stepOrder` is **global across all segments AND across nested `RepeatGroupDTO` children**. This differs from single-sport workouts where `stepOrder` resets inside a repeat block.

Example for the 17-segment brick above:

```text
Seg 1: warmup       stepOrder 1
       repeat       stepOrder 2
         progressive   stepOrder 3   ← global, NOT 1
         rest          stepOrder 4   ← global, NOT 2
Seg 2: run rep 1    stepOrder 5
Seg 3: bike rep 1   stepOrder 6
...
```

`stepId` values may be simple incrementing integers; Garmin reassigns them server-side.

## Worked example — alternating brick

Below is a known-good 2-rep brick (warmup + 4×100m progressive + 2× (run 400m Z4 + bike 1km Z3) + cooldown). Empirically verified to round-trip correctly through Garmin Connect.

```json
{
  "sportType": {
    "sportTypeId": 10,
    "sportTypeKey": "multi_sport",
    "displayOrder": 4
  },
  "subSportType": null,
  "workoutName": "Brick 2x 400m Run Z4 + 1km Bike Z3",
  "description": "Multisport brick. Warmup + 4x100m progresivos. 2x(400m run Z4 + 1km bike Z3 100-105% FTP). Cooldown 10' easy bike.",
  "isSessionTransitionEnabled": true,
  "workoutSegments": [
    {
      "segmentOrder": 1,
      "sportType": {
        "sportTypeId": 1,
        "sportTypeKey": "running",
        "displayOrder": 1
      },
      "estimatedDurationInSecs": 954,
      "estimatedDistanceInMeters": 2020.0,
      "estimatedDistanceUnit": { "unitKey": "kilometer" },
      "estimateType": "TIME_ESTIMATED",
      "avgTrainingSpeed": 2.12,
      "workoutSteps": [
        {
          "type": "ExecutableStepDTO",
          "stepId": 1,
          "stepOrder": 1,
          "stepType": {
            "stepTypeId": 1,
            "stepTypeKey": "warmup",
            "displayOrder": 1
          },
          "endCondition": {
            "conditionTypeId": 2,
            "conditionTypeKey": "time",
            "displayOrder": 2,
            "displayable": true
          },
          "endConditionValue": 600,
          "targetType": {
            "workoutTargetTypeId": 6,
            "workoutTargetTypeKey": "pace.zone",
            "displayOrder": 6
          },
          "targetValueOne": 2.86,
          "targetValueTwo": 2.54,
          "description": "10' calentamiento Z1"
        },
        {
          "type": "RepeatGroupDTO",
          "stepId": 2,
          "stepOrder": 2,
          "stepType": {
            "stepTypeId": 6,
            "stepTypeKey": "repeat",
            "displayOrder": 6
          },
          "numberOfIterations": 4,
          "smartRepeat": false,
          "endCondition": {
            "conditionTypeId": 7,
            "conditionTypeKey": "iterations",
            "displayOrder": 7,
            "displayable": false
          },
          "endConditionValue": 4,
          "workoutSteps": [
            {
              "type": "ExecutableStepDTO",
              "stepId": 3,
              "stepOrder": 3,
              "stepType": {
                "stepTypeId": 3,
                "stepTypeKey": "interval",
                "displayOrder": 3
              },
              "endCondition": {
                "conditionTypeId": 3,
                "conditionTypeKey": "distance",
                "displayOrder": 3,
                "displayable": true
              },
              "endConditionValue": 100,
              "targetType": {
                "workoutTargetTypeId": 6,
                "workoutTargetTypeKey": "pace.zone",
                "displayOrder": 6
              },
              "targetValueOne": 4.0,
              "targetValueTwo": 3.08,
              "description": "100m progresivo"
            },
            {
              "type": "ExecutableStepDTO",
              "stepId": 4,
              "stepOrder": 4,
              "stepType": {
                "stepTypeId": 5,
                "stepTypeKey": "rest",
                "displayOrder": 5
              },
              "endCondition": {
                "conditionTypeId": 2,
                "conditionTypeKey": "time",
                "displayOrder": 2,
                "displayable": true
              },
              "endConditionValue": 60,
              "targetType": {
                "workoutTargetTypeId": 6,
                "workoutTargetTypeKey": "pace.zone",
                "displayOrder": 6
              },
              "targetValueOne": 2.86,
              "targetValueTwo": 2.54,
              "description": "1' parado"
            }
          ]
        }
      ]
    },
    {
      "segmentOrder": 2,
      "sportType": {
        "sportTypeId": 1,
        "sportTypeKey": "running",
        "displayOrder": 1
      },
      "estimatedDurationInSecs": 111,
      "estimatedDistanceInMeters": 400.0,
      "estimatedDistanceUnit": { "unitKey": "kilometer" },
      "estimateType": "TIME_ESTIMATED",
      "avgTrainingSpeed": 3.6,
      "workoutSteps": [
        {
          "type": "ExecutableStepDTO",
          "stepId": 5,
          "stepOrder": 5,
          "stepType": {
            "stepTypeId": 3,
            "stepTypeKey": "interval",
            "displayOrder": 3
          },
          "endCondition": {
            "conditionTypeId": 3,
            "conditionTypeKey": "distance",
            "displayOrder": 3,
            "displayable": true
          },
          "endConditionValue": 400,
          "targetType": {
            "workoutTargetTypeId": 6,
            "workoutTargetTypeKey": "pace.zone",
            "displayOrder": 6
          },
          "targetValueOne": 3.7,
          "targetValueTwo": 3.57,
          "description": "Run 400m Z4 (4:40-4:30/km) - rep 1"
        }
      ]
    },
    {
      "segmentOrder": 3,
      "sportType": {
        "sportTypeId": 2,
        "sportTypeKey": "cycling",
        "displayOrder": 2
      },
      "estimatedDurationInSecs": 100,
      "estimatedDistanceInMeters": 1000.0,
      "estimatedDistanceUnit": { "unitKey": "kilometer" },
      "estimateType": "DISTANCE_ESTIMATED",
      "avgTrainingSpeed": 10.0,
      "workoutSteps": [
        {
          "type": "ExecutableStepDTO",
          "stepId": 6,
          "stepOrder": 6,
          "stepType": {
            "stepTypeId": 3,
            "stepTypeKey": "interval",
            "displayOrder": 3
          },
          "endCondition": {
            "conditionTypeId": 2,
            "conditionTypeKey": "time",
            "displayOrder": 2,
            "displayable": true
          },
          "endConditionValue": 100,
          "targetType": {
            "workoutTargetTypeId": 2,
            "workoutTargetTypeKey": "power.zone",
            "displayOrder": 2
          },
          "targetValueOne": 273,
          "targetValueTwo": 260,
          "description": "Bike 1km @ 100-105% FTP (~1:40) - rep 1"
        }
      ]
    },
    {
      "segmentOrder": 4,
      "sportType": {
        "sportTypeId": 1,
        "sportTypeKey": "running",
        "displayOrder": 1
      },
      "estimatedDurationInSecs": 111,
      "estimatedDistanceInMeters": 400.0,
      "estimatedDistanceUnit": { "unitKey": "kilometer" },
      "estimateType": "TIME_ESTIMATED",
      "avgTrainingSpeed": 3.6,
      "workoutSteps": [
        {
          "type": "ExecutableStepDTO",
          "stepId": 7,
          "stepOrder": 7,
          "stepType": {
            "stepTypeId": 3,
            "stepTypeKey": "interval",
            "displayOrder": 3
          },
          "endCondition": {
            "conditionTypeId": 3,
            "conditionTypeKey": "distance",
            "displayOrder": 3,
            "displayable": true
          },
          "endConditionValue": 400,
          "targetType": {
            "workoutTargetTypeId": 6,
            "workoutTargetTypeKey": "pace.zone",
            "displayOrder": 6
          },
          "targetValueOne": 3.7,
          "targetValueTwo": 3.57,
          "description": "Run 400m Z4 (4:40-4:30/km) - rep 2"
        }
      ]
    },
    {
      "segmentOrder": 5,
      "sportType": {
        "sportTypeId": 2,
        "sportTypeKey": "cycling",
        "displayOrder": 2
      },
      "estimatedDurationInSecs": 700,
      "estimatedDistanceInMeters": 2800.0,
      "estimatedDistanceUnit": { "unitKey": "kilometer" },
      "estimateType": "DISTANCE_ESTIMATED",
      "avgTrainingSpeed": 4.0,
      "workoutSteps": [
        {
          "type": "ExecutableStepDTO",
          "stepId": 8,
          "stepOrder": 8,
          "stepType": {
            "stepTypeId": 3,
            "stepTypeKey": "interval",
            "displayOrder": 3
          },
          "endCondition": {
            "conditionTypeId": 2,
            "conditionTypeKey": "time",
            "displayOrder": 2,
            "displayable": true
          },
          "endConditionValue": 100,
          "targetType": {
            "workoutTargetTypeId": 2,
            "workoutTargetTypeKey": "power.zone",
            "displayOrder": 2
          },
          "targetValueOne": 273,
          "targetValueTwo": 260,
          "description": "Bike 1km @ 100-105% FTP (~1:40) - rep 2"
        },
        {
          "type": "ExecutableStepDTO",
          "stepId": 9,
          "stepOrder": 9,
          "stepType": {
            "stepTypeId": 2,
            "stepTypeKey": "cooldown",
            "displayOrder": 2
          },
          "endCondition": {
            "conditionTypeId": 2,
            "conditionTypeKey": "time",
            "displayOrder": 2,
            "displayable": true
          },
          "endConditionValue": 600,
          "targetType": {
            "workoutTargetTypeId": 2,
            "workoutTargetTypeKey": "power.zone",
            "displayOrder": 2
          },
          "targetValueOne": 143,
          "targetValueTwo": 111,
          "description": "10' bici suave Z1"
        }
      ]
    }
  ]
}
```

## Why these rules exist

Every rule above was discovered empirically by spiking against Garmin Connect's authenticated API. The full transcript with workout IDs, before/after server responses, and the corruption modes that motivated each rule lives in [`packages/garmin/docs/MULTISPORT-TRANSITIONS.md`](../../../packages/garmin/docs/MULTISPORT-TRANSITIONS.md). When you encounter a multisport edge case this skill doesn't cover, that doc is the source of truth.
