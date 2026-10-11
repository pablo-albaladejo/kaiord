> Completed: 2026-10-11

# Proposal: Apply the FIT workoutHr and workoutPower offsets to workout ranges and conditions

## Why

The FIT profile types `workoutHr` and `workoutPower` overload one integer:
0-100 is a percentage of max heart rate and 0-1000 a percentage of FTP, while
an absolute value is stored with a +100 bpm or +1000 W offset
(`Profile.types.workoutHr = {100: "bpmOffset"}`,
`Profile.types.workoutPower = {1000: "wattsOffset"}`). The custom heart-rate
and power target ranges, the `hrLessThan`/`power*` duration conditions and the
`repeatHr`/`repeatPower` repeat conditions all use these types. KRD ranges and
conditions are absolute bpm and watts.

- The writer emitted custom power ranges, custom heart-rate ranges, and the
  HR and power duration and repeat conditions without the offset. A Garmin
  device read a 200-250 W range as 200-250 % FTP and a 130 bpm condition as
  130 %.
- The reader removed the +1000 from power ranges but kept the raw value for
  heart-rate ranges and for every HR and power condition, so the Garmin
  fixtures' `hrLessThan` 225 was read as 225 bpm instead of 125 bpm.
- A repeat-until step stores its condition in `targetValue`. The reader also
  read that value as the step's target, so the `repeatHr` of
  `WorkoutRepeatGreaterThanStep.fit` became a `percent_max` target.

The KRD-level round-trip could not catch the writer: the reader and the writer
were wrong in the same way for power ranges and conditions, so the values came
back unchanged.

## What Changes

- The writer adds the `workoutHr`/`workoutPower` offset to the custom HR and
  power range bounds and to the HR and power duration and repeat conditions.
- The reader removes the offset from the same fields when the value is above
  it.
- The reader gives a repeat-until step an open target, because its
  `targetValue` carries the repeat condition.
- Tests read the raw values the SDK decoder returns, for the Garmin fixture and
  for every affected KRD range and condition.
- The KRD fixtures under `test-fixtures/krd/` carry the decoded values
  (125 bpm, 300-310 W) instead of the raw ones.

## Impact

- `@kaiord/fit` (patch). FIT workouts with absolute HR or power ranges and
  conditions are read and written as absolute values.
- Not covered: KRD has no percentage variant for ranges or conditions, so a
  FIT percentage range or condition (raw value at or below the offset) is
  still read as its raw number. This is unchanged.
- Spec: `adapter-contracts` gains the requirement below.
