# Tasks

## 1. Bands

- [x] 1.1 Pure band helpers for power, heart rate and cadence, next to the
      #1550 pace band, clamped to the schema bounds.
- [x] 1.2 The writer bands single values in Garmin order. Round-trip tests
      cover single → band → range.
- [x] 1.3 Symmetric rounding (centre and half-width), with the .5 case pinned.

## 2. percent_max

- [x] 2.1 `MissingMaxHeartRateError` and its factory in `@kaiord/core`.
- [x] 2.2 `maxHeartRate` writer option and percent_max → bpm resolution.
- [x] 2.3 Refuse a missing or implausible max HR (100..300 bpm) and a
      resolved value outside 1..300 bpm.

## 3. Callers

- [x] 3.1 garmin-connect rethrows the error unwrapped.
- [x] 3.2 The CLI maps it to `INVALID_ARGUMENT`.
- [x] 3.3 MCP classifies it as `missing-max-hr`.
- [x] 3.4 SPA: the profile's max HR goes on every Garmin payload, with an
      EN + ES refusal; `write-gcn.test.ts`.

## 4. Docs

- [x] 4.1 garmin `AGENTS.md`, MCP tools reference, follow-up #1554.
