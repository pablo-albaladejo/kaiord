> Completed: 2026-10-10

# Proposal: Round-trip structured workouts through the FIT SDK encoder

## Why

A production audit found that a FIT workout exported by kaiord and imported
again loses data: `WorkoutRepeatSteps.fit` comes back without its repeat block,
and `WorkoutIndividualSteps.fit` without its distances and targets. Reading a
FIT workout was correct; writing one was not.

- The writer set durations and targets under sub-field names
  (`durationDistance`, `targetPowerZone`, `repeatSteps`,
  `customTargetPowerLow`, ...). The SDK `Encoder` writes only main profile
  fields and silently drops the rest, so `durationValue` and `targetValue`
  never reached the file.
- The SDK `Encoder` reuses a message definition when the field set is equal
  but writes values in the new message's key order, so two step messages with
  the same fields in a different order were written with values in each
  other's slots.
- Repeat-until conditions were written and read under `duration*` sub-fields,
  which the profile does not activate for those duration types; the decoder
  returns them as `repeatTime`, `repeatDistance`, `repeatCalories`,
  `repeatHr` and `repeatPower`.
- The stroke target was read from `targetSwimStroke`, which the decoder never
  produces (it returns `targetStrokeType` as a name), and a single cadence or
  pace value, written as an equal custom range, came back as a range.

The audit's CLI round-trip check passed because the core round-trip validator
compares sessions, laps and records only, never `structured_workout` steps.

## What Changes

- Before encoding, each workout step's main fields are filled from the
  sub-field the profile activates for its `durationType`/`targetType`.
- Every message is written with its fields in profile field-number order.
- Repeat-until conditions use the profile's `repeat*` sub-fields.
- The reader maps the decoded `targetStrokeType` name and reads an equal
  custom cadence or speed range as `rpm` or `mps`.
- Round-trip tests through the real encoder cover the four workout fixtures
  and every KRD duration and target.

## Impact

- `@kaiord/fit` (patch). FIT files written by the CLI, the SPA and the MCP
  server now carry their durations, targets and repeats.
- Spec: `adapter-contracts` gains the requirement below.
