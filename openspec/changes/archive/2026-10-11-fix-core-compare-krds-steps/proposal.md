> Completed: 2026-10-11

# Proposal: Compare structured workout steps in round-trip validation

## Why

`compareKRDs` compared only sessions, laps and records. A structured workout has
none of them, so `validateRoundTrip`, `kaiord validate` and the
`kaiord_round_trip_validate` MCP tool reported no violation for any workout,
even when a writer dropped or rewrote every step.

## What Changes

- `compareKRDs` also compares `extensions.structured_workout.steps`: the exact
  step count, step vs repeat block, repeat counts and nested steps, and per
  step the duration, target and intensity, within the round-trip tolerances.
- A categorical mismatch (type, unit, intensity, node kind) is a violation with
  `tolerance` 0 and the values in the new optional `expectedValue` and
  `actualValue` fields. `toleranceViolationSchema` accepts a tolerance of 0.
- `ToleranceChecker` gains an optional `checkPercentFtp`.
- `compareKRDs` is exported from `@kaiord/core`.
- The CLI and MCP violation formatters print the categorical values.
- The FIT, TCX, ZWO and GCN adapters gain a round-trip suite that compares every
  fixture's steps with `compareKRDs`.

## Impact

- `@kaiord/core` (minor), `@kaiord/cli` and `@kaiord/mcp` (patch).
- A consumer validating violations with an older copy of
  `toleranceViolationSchema` rejects the new tolerance-0 rows.
- Every native fixture round-trip passes the comparison. Lossy conversions it
  surfaces between formats are reported in the pull request.
- Spec: `adapter-contracts` gains the requirement below.
