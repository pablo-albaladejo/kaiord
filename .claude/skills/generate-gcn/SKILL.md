---
name: generate-gcn
description: Generate a Garmin Connect (.gcn) workout file from a natural language description. Use when the user describes a training session, workout, or exercise plan and wants a .gcn file.
argument-hint: [workout description]
allowed-tools: Write, Bash
---

Generate a valid Garmin Connect (.gcn) workout INPUT JSON file from a natural language workout description.

**CRITICAL**: Generate INPUT format (what Garmin Connect API accepts), NOT output format. Only include required and relevant fields. Do NOT include server-generated fields like `workoutId`, `ownerId`, `author`, `createdDate`, `updatedDate`, `shared`, `sharedWithUsers`, or any field set to `null` that is optional.

## Instructions

1. **Parse** the user's natural language workout description ($ARGUMENTS)
2. **Identify** sport type, steps, durations, targets, and repeat blocks
3. **Generate** valid GCN INPUT JSON following the schema below
4. **Write** the file to disk with `.gcn` extension

If the user doesn't specify an output filename, derive one from the workout name in kebab-case (e.g., `sweet-spot-intervals.gcn`).

## Sport Type Detection

Infer from context. Default to cycling if ambiguous.

| Sport | sportTypeId | sportTypeKey |
|-------|-------------|--------------|
| Running | 1 | "running" |
| Cycling | 2 | "cycling" |
| Swimming | 4 | "swimming" |

## Step Types (Intensity)

| Intensity | stepTypeId | stepTypeKey |
|-----------|------------|-------------|
| Warmup | 1 | "warmup" |
| Cooldown | 2 | "cooldown" |
| Interval/Work | 3 | "interval" |
| Recovery | 4 | "recovery" |
| Rest | 5 | "rest" |
| Repeat (internal) | 6 | "repeat" |

## End Conditions (Duration)

| Duration | conditionTypeId | conditionTypeKey | displayable |
|----------|----------------|------------------|-------------|
| Lap button (open) | 1 | "lap.button" | true |
| Time (seconds) | 2 | "time" | true |
| Distance (meters) | 3 | "distance" | true |
| Calories | 4 | "calories" | true |
| Iterations (repeats only) | 7 | "iterations" | false |

Convert user input: "5 min" = 300, "1km" = 1000, "400m" = 400, "20s" = 20.

## Targets

| Target | workoutTargetTypeId | workoutTargetTypeKey |
|--------|---------------------|----------------------|
| No target | 1 | "no.target" |
| Power zone | 2 | "power.zone" |
| Cadence | 3 | "cadence" |
| Heart rate zone | 4 | "heart.rate.zone" |
| Speed zone | 5 | "speed.zone" |
| Pace zone | 6 | "pace.zone" |

**Zone-based** (e.g., "Z2", "zone 3"): set `zoneNumber` only.
**Range-based** (e.g., "200-250W", "85-95rpm"): set `targetValueOne`/`targetValueTwo` only.

Power zones: 1-7. HR zones: 1-5. Pace zones: 1-5.
Pace values use **m/s** (4:00/km = 4.17 m/s, 5:00/km = 3.33 m/s, 6:00/km = 2.78 m/s).

## Sport-Specific Target Rules (MANDATORY)

**Running** → ALWAYS use `pace.zone` with `targetValueOne`/`targetValueTwo` in m/s for ALL steps. Never use `heart.rate.zone` or `no.target`. Even warmup/cooldown/recovery must have pace ranges.
**Cycling** → ALWAYS use `power.zone` for ALL steps. Use `zoneNumber` or `targetValueOne`/`targetValueTwo` in watts. Never use `heart.rate.zone`.
**Swimming** → Use `no.target` (stroke/equipment provide context).

### Zone Values

**ALWAYS read [zones.md](zones.md) first** to get the user's actual training zones. Use those exact values for pace (m/s) and power (W) targets. The zones file can be customized per user.

### Calculating Targets from Zone References

When the workout says "Z3", look up the zone min/max from zones.md and use those as `targetValueOne`/`targetValueTwo`:
- **Running Z3**: zones.md says 5:24-4:45/km → use `targetValueOne: 3.08, targetValueTwo: 3.51`
- **Cycling Z3**: zones.md says 199-229W → use `targetValueOne: 199, targetValueTwo: 229`

### "Progresivo" / Progressive Steps

Calculate a pace or power RANGE spanning from the current zone to the next:
- **Running**: E.g., "1K progresivo" after Z1 → from Z1 min to Z2 max → `targetValueOne: 2.54, targetValueTwo: 3.08`
- **Cycling**: E.g., "progresivo" after Z1 → from Z1 min to Z2 max → `targetValueOne: 111, targetValueTwo: 198`

### "Suave" / "Muy comodo" / Easy Steps

Use Z1 values from zones.md:
- **Running**: Z1 pace range
- **Cycling**: Z1 power range

### "A tope" / "Mejor ritmo posible" / Max Effort

Use Z5 values from zones.md:
- **Running**: Z5 pace range
- **Cycling**: Z5 power range

## Swimming-specific

Add `poolLength` and `poolLengthUnit` at root level. Use `strokeType` and `equipmentType` on steps. See [reference.md](reference.md).

## Generation Rules

1. **stepId**: simple incrementing integer (1, 2, 3...)
2. **stepOrder**: for top-level steps increments globally (1, 2, 3...); inside repeat blocks resets to 1
3. **RepeatGroupDTO**: `conditionTypeId: 7`, `displayable: false`, `endConditionValue` = `numberOfIterations`
4. **Only include fields that have values** - omit optional fields that would be null
5. **Integers for values**: `600` not `600.0` (unless fractional like pace 4.17 m/s)
6. **Omit** `strokeType`/`equipmentType` for non-swimming steps
7. The workout SHOULD have warmup + main work + cooldown structure

For complete schema and real examples, see [reference.md](reference.md).

## Step Template (INPUT format)

```json
{
  "type": "ExecutableStepDTO",
  "stepId": 1, "stepOrder": 1,
  "stepType": {"stepTypeId": 1, "stepTypeKey": "warmup"},
  "endCondition": {"conditionTypeId": 2, "conditionTypeKey": "time", "displayable": true},
  "endConditionValue": 600,
  "targetType": {"workoutTargetTypeId": 2, "workoutTargetTypeKey": "power.zone"},
  "zoneNumber": 2
}
```

## Repeat Block Template (INPUT format)

```json
{
  "type": "RepeatGroupDTO",
  "stepId": 4, "stepOrder": 3,
  "stepType": {"stepTypeId": 6, "stepTypeKey": "repeat"},
  "numberOfIterations": 5,
  "smartRepeat": false,
  "endCondition": {"conditionTypeId": 7, "conditionTypeKey": "iterations", "displayable": false},
  "endConditionValue": 5,
  "workoutSteps": [ /* nested steps with stepOrder resetting to 1 */ ]
}
```

## Output

After generating, show a summary table then write the .gcn file.
