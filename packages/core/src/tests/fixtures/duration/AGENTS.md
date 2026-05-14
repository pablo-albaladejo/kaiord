<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# duration

## Purpose

Per-variant rosie factories for the more exotic `Duration` discriminator values (calorie-based, power-conditional, repeat-conditional). The CANONICAL all-types factory `buildDuration` lives in `../workout/duration.fixtures.ts`; these files exist so a test that only needs a `repeat_until_power_greater_than` can avoid the random discriminator path.

## Key Files

| File                                      | Description                                                                                                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `calorie-duration.fixtures.ts`            | `buildCalorieDuration` (calories 50-1000) and `buildRepeatUntilCaloriesDuration` (calories 100-2000 + `repeatFrom`).                                                                                                |
| `power-duration.fixtures.ts`              | `buildPowerLessThanDuration`, `buildPowerGreaterThanDuration` (watts 100-500), `buildRepeatUntilPowerLessThanDuration`, `buildRepeatUntilPowerGreaterThanDuration`.                                                 |
| `repeat-conditional-duration.fixtures.ts` | `buildRepeatUntilTimeDuration` (seconds 60-3600), `buildRepeatUntilDistanceDuration` (meters 500-10000), `buildRepeatUntilHeartRateLessThanDuration`, `buildRepeatUntilHeartRateGreaterThanDuration` (bpm 100-200). |

## For AI Agents

### Working In This Directory

- Each factory is narrowly typed against its specific shape (e.g. `Factory<PowerLessThanDuration>`), NOT against the full `Duration` union. That keeps `Object.assign`-based discriminator picking unnecessary — every attr is required and statically known.
- Numeric ranges intentionally differ from the canonical `buildDuration` factory (e.g., calorie max is 1000 here vs 1000 in canonical — keep them coherent if you change one).
- These factories are NOT re-exported via `@kaiord/core/test-utils` — they're internal helpers for narrow tests. The canonical `buildDuration` is the public surface.

<!-- MANUAL: -->
