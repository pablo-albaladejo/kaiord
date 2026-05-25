---
"@kaiord/core": major
"@kaiord/fit": major
"@kaiord/tcx": major
"@kaiord/zwo": major
"@kaiord/garmin": major
"@kaiord/mcp": major
"@kaiord/workout-spa-editor": major
---

KRD v2.0 — adds six health metrics (sleep, weight, HRV, daily wellness, body composition, stress) as first-class KRD types with bidirectional FIT adapter support.

- **@kaiord/core**: new health sub-schemas (`sleepRecordSchema`, `weightMeasurementSchema`, `hrvSummarySchema`, `dailyWellnessSchema`, `bodyCompositionSchema`, `stressEpisodeSchema`); six new KRD `type` enum values (`sleep_record`, `weight_measurement`, `hrv_summary`, `daily_wellness`, `body_composition`, `stress_episode`); health sub-schemas enforce `version` ∈ `2.x` (root `krdSchema.version` remains `\d+\.\d+`).
- **@kaiord/fit**: bidirectional converters for the six health metrics; seven new FIT message numbers registered (`WEIGHT_SCALE`, `MONITORING`, `MONITORING_INFO`, `SLEEP_LEVEL`, `HRV_STATUS_SUMMARY`, `HRV_VALUE`, `STRESS_LEVEL`, `BODY_COMPOSITION`); round-trip tests for sleep / weight / HRV / daily / stress against real Garmin fixtures (`test-fixtures/fit/`).
- **@kaiord/tcx, @kaiord/zwo, @kaiord/garmin**: workout-only writers now throw `UnsupportedKrdTypeError` when fed a health KRD instead of silently discarding it. **Breaking** for callers that fed unsupported KRDs to these writers.
- **@kaiord/mcp**: five new tools — `kaiord_get_health_summary`, `kaiord_get_sleep_history`, `kaiord_get_weight_history`, `kaiord_get_hrv_history`, `kaiord_get_recovery_status` — stateless, file-array input, parse FIT health files via the standard pipeline.
- **@kaiord/workout-spa-editor**: Dexie v16 with six health repositories (`healthSleep`, `healthWeight`, `healthHrv`, `healthDaily`, `healthBodyComposition`, `healthStress`); Health Hub routes under `/health/*`; FIT health files now route to the health pipeline instead of being ignored.
