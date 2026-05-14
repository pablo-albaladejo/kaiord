<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# target

## Purpose

Per-target-type rosie factories with one builder per `unit` variant. The CANONICAL `buildTarget` factory (random target type AND random unit) lives in `../workout/target.fixtures.ts`; these files exist so tests can pin BOTH the target type and unit without rejection sampling.

## Key Files

| File                            | Description                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `power-target.fixtures.ts`      | `buildPowerWattsTarget`, `buildPowerFtpTarget` (percent_ftp 50-150), `buildPowerZoneTarget` (zone 1-7), `buildPowerRangeTarget` (min..max with `TARGET_RANGE_WIDTH_10` floor). |
| `heart-rate-target.fixtures.ts` | `buildHeartRateBpmTarget`, `buildHeartRateZoneTarget` (zone 1-5), `buildHeartRatePercentMaxTarget` (50-100), `buildHeartRateRangeTarget`.                                      |
| `cadence-target.fixtures.ts`    | `buildCadenceRpmTarget` (rpm 60-120) and `buildCadenceRangeTarget`.                                                                                                            |
| `pace-target.fixtures.ts`       | `buildPaceMpsTarget` (mps 2.0-6.0 float), `buildPaceZoneTarget` (zone 1-5), `buildPaceRangeTarget` (min..max with `TARGET_PACE_RANGE_GAP_0_5` floor).                          |
| `open-target.fixtures.ts`       | `buildOpenTarget` — trivial factory always returning `{type:"open"}`.                                                                                                          |

## For AI Agents

### Working In This Directory

- Range builders compute `min` first, then derive `max` as `min + GAP..upper` so the range is always valid (`min < max`). This is enforced by the `TARGET_RANGE_WIDTH_10` and `TARGET_PACE_RANGE_GAP_0_5` constants in `../../../test-utils/tolerance-constants.ts` — DO NOT inline magic numbers here.
- Each factory uses a LOCAL `type FooTarget = {...}` definition rather than importing from `../../../domain/schemas/target.ts`. That's intentional — these are test fixtures that should fail at compile time if the local type drifts from the schema, forcing explicit review. Don't replace with a `Target` import.
- Power zone goes 1..7 (Coggan); HR and pace zones go 1..5 (5-zone model). These match the schema constraints in `../../../domain/schemas/target-values/`.
- These factories are NOT re-exported via `@kaiord/core/test-utils` — the canonical `buildTarget` is the public surface.

<!-- MANUAL: -->
