---
"@kaiord/core": minor
"@kaiord/cli": patch
"@kaiord/mcp": patch
---

`compareKRDs` (now exported) and `validateRoundTrip` compare structured workout steps: the step count, step vs repeat block, repeat counts, duration type and value, target type, unit and value, and intensity. Before, a workout round-trip compared only sessions, laps and records, so it passed even when a writer dropped or rewrote every step. Tolerances follow the round-trip guidelines (time ±1 s, power ±1 W, %FTP ±1, heart rate ±1 bpm, cadence ±1 rpm); counts, zones and categories must match exactly.

Categorical mismatches are reported as violations with `tolerance: 0` and the real values in the new optional `expectedValue`/`actualValue` fields; `toleranceViolationSchema` now accepts a tolerance of 0, so a consumer validating violations with an older copy of the schema rejects these rows. The `kaiord validate` CLI and the `kaiord_round_trip_validate` MCP tool print those values instead of the numeric sentinel. `ToleranceChecker` gains an optional `checkPercentFtp`.
