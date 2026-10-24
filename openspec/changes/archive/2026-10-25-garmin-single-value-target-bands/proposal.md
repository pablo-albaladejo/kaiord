> Completed: 2026-10-25

# Proposal: Band single-value Garmin targets and resolve percent-of-max-HR targets

## Why

Garmin Connect has no single-value target. A step carries two bounds,
`targetValueOne` and `targetValueTwo`, and the GCN writer sent a single KRD value
as the same number twice. That produced a zero-width target on the watch, which
alerts whenever the athlete is off that exact value:

- a pace target showed as 4:45–4:45 (#1550);
- a power target showed as 213–213 W.

Separately, the writer wrote a `percent_max` heart-rate target as if the
percentage were bpm, so an 85 % max HR step reached the watch as 85 bpm.

## What Changes

- `@kaiord/garmin`: a single pace, power, heart-rate or cadence value is written
  as a symmetric tolerance band, clamped to the KRD schema bounds:
  - pace ±5 s/km (#1550);
  - power ±5 %, at least ±5 W;
  - heart rate ±3 bpm;
  - cadence ±3.

  Garmin ordering is unchanged. Ranges and zones are untouched.

- `@kaiord/garmin`: a new `maxHeartRate` writer option. A `percent_max` target is
  written as `round(pct × maxHeartRate / 100)` bpm and then banded. A missing or
  implausible max HR (not finite, or outside 100..300 bpm) throws
  `MissingMaxHeartRateError`. A target that resolves outside 1..300 bpm throws
  `KrdValidationError`.
- `@kaiord/core`: the typed `MissingMaxHeartRateError`.
- `@kaiord/garmin-connect`: `push` rethrows it unwrapped.
- `@kaiord/cli`: it maps to `INVALID_ARGUMENT`.
- `@kaiord/mcp`: it is classified as `missing-max-hr`.
- Workout editor: every Garmin payload uses the profile's max HR. A profile
  without one is refused with a localized (EN + ES) `missing-max-hr` message.

## Out of scope

- A max HR input for the CLI (`--max-hr`), MCP (`maxHeartRate`) and the
  garmin-connect `PushOptions` (#1554). Until it lands, those surfaces refuse
  `percent_max` workouts with the error above.
