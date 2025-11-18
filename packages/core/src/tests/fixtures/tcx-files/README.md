# TCX Test Fixtures

This directory contains sample TCX (Training Center XML) workout files for testing TCX ↔ KRD conversion.

## Files

### WorkoutHeartRateTargets.tcx

A running workout with heart rate zone targets:

- **Warmup**: 10 minutes in HR Zone 2 (predefined)
- **Threshold**: 20 minutes at 150-165 bpm (custom range)
- **Cooldown**: 5 minutes in HR Zone 1 (predefined)

Tests:

- Predefined heart rate zones (1-5)
- Custom heart rate ranges (bpm)
- Time-based durations
- Active and Resting intensity

### WorkoutSpeedTargets.tcx

A running workout with speed/pace targets:

- **Easy Run**: 1600m at 2.5-3.0 m/s pace
- **Fast Run**: 800m at 3.5-4.0 m/s pace
- **Recovery**: 3 minutes with no target

Tests:

- Custom speed zones (m/s)
- Distance-based durations
- Pace view type
- Open target (None)

### WorkoutRepeatBlocks.tcx

A cycling workout with repetition blocks:

- **Warmup**: 10 minutes
- **Intervals**: 5 repetitions of:
  - Work: 4 minutes in HR Zone 4
  - Rest: 2 minutes in HR Zone 2
- **Cooldown**: 5 minutes

Tests:

- Repeat blocks with multiple children
- Nested step structure
- Repetition count (2-99)
- StepId uniqueness

### WorkoutMixedDurations.tcx

A running workout with all duration types:

- **Time Based**: 5 minutes in HR Zone 2
- **Distance Based**: 1000m at 3.0-3.5 m/s pace
- **Lap Button**: User-initiated with cadence target (80-90 rpm)
- **Calorie Based**: 100 calories burned
- **HR Above**: Continue until HR exceeds 160 bpm
- **HR Below**: Continue until HR drops below 120 bpm

Tests:

- Time duration (seconds)
- Distance duration (meters)
- UserInitiated duration (lap button)
- CaloriesBurned duration
- HeartRateAbove duration
- HeartRateBelow duration
- Cadence target (range)

## Schema Compliance

All TCX files validate against the official Garmin TCX XSD schema:

- `packages/core/schema/TrainingCenterDatabasev2.xsd`
- Downloaded from: https://www8.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd

## Usage

These fixtures are used in:

- TCX reader/writer adapter tests
- TCX ↔ KRD conversion tests
- Round-trip validation tests
- XSD validation tests

## Notes

- All files use proper XML namespaces and xsi:type attributes
- StepId values are unique within each workout (1-20)
- Workout names are limited to 15 characters (RestrictedToken_t)
- Repetitions are limited to 2-99
- Heart rate zones are 1-5 for predefined zones
- Speed zones are 1-10 for predefined zones
