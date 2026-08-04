# @kaiord/whoop

## 10.1.0

### Minor Changes

- ec4b349: Add biomarker-tests/summary schemas for WHOOP Advanced Labs.

  **New**: `whoopBiomarkerTestSchema` / `whoopBiomarkerTestsResponseSchema`
  model the `advanced-labs-service/v1/biomarker-tests` list (bare array,
  `{records: [...]}`, or `{tests: [...]}`, all normalized to an array).
  `whoopBiomarkerSchema` / `whoopBiomarkerSummarySchema` model the
  `.../biomarker-tests/{id}/summary` detail response — a per-test catalog of
  biomarkers, most `status: "UNAVAILABLE"` since a given draw only measures a
  subset. Both schemas are lenient (every biomarker field beyond
  `biomarker_name` is `.nullish()`) and non-strict, tolerating WHOOP payload
  drift. `measuredBiomarkers` filters a parsed summary down to the biomarkers
  WHOOP actually measured (`status` present and not `"UNAVAILABLE"`).

  Building the KRD `LabReport`/`LabValue` from these shapes (canonical unit +
  flag) is left to the SPA-side importer — this package only exposes the
  parsed WHOOP data.

- 2eba692: Add stress-bff schema and a stress→stress-episode converter.

  **New**: `whoopStressResponseSchema` (BFF-tolerant model of
  `health-service/v2/stress-bff/{date}`, pulling only
  `gauge.gauge_fill_percentage`) and `extractStressPoints`, a defensive
  walker over the un-modelled `stress_graph` timeline. `stressBffToEpisode`
  maps the gauge's daily fill fraction to `averageLevel` and the timeline's
  maximum point to `peakLevel` (floored at `averageLevel`), producing a KRD
  `stress` episode spanning the full day; reuses the existing frozen
  `stressEpisodeSchema` — no core change.

- 3c625fe: Add workout→activity conversion and a sports catalog, and fix the WHOOP
  STRAIN converter's energy/heart-rate field names.

  **New**: `whoopWorkoutSchema` (`record.workouts[]`) and `workoutToActivity`
  map a WHOOP workout to a KRD `Activity`, converting kilojoules to kcal and
  resolving the numeric `sport_id` via a new `whoopSportsResponseSchema` /
  `buildSportCatalog` built from the `activities-service/v1/sports/history`
  catalog.

  **Fix**: `cycleToStrain` read a non-existent `cycle.kilojoule` field, so
  `energyKilojoules` was never populated, and never mapped WHOOP's
  `day_avg_heart_rate`/`day_max_heart_rate` at all. It now reads the real
  `day_kilojoules`, `day_avg_heart_rate`, and `day_max_heart_rate` fields
  (additive to previously emitted strain summaries).

### Patch Changes

- Updated dependencies [23974fe]
- Updated dependencies [e33f860]
- Updated dependencies [07a4939]
- Updated dependencies [ec4b349]
  - @kaiord/core@10.1.0

## 10.0.0

### Major Changes

- 5f677ae: Rewrite @kaiord/whoop from the developer OAuth API to the internal cycles/details API; recovery→hrv and sleep→sleep converters

### Minor Changes

- a2a5b12: feat(whoop): add `metricsToHeartRateSeries` converter mapping WHOOP `metrics-service` heart_rate responses to the read-only `heart-rate-series` KRD health payload (buckets epoch-ms samples into a uniform `stepSeconds` array with `null` gaps)
- 78c1866: feat(whoop): add `cycleToStrain` and `cycleToVitals` converters mapping WHOOP cycle records to the read-only `strain` and `vitals` KRD health payloads (folds recovery SpO₂/skin-temp/resting-HR + sleep respiratory rate into one vitals summary; skips in-progress cycles)

### Patch Changes

- Updated dependencies [6025135]
- Updated dependencies [e167efe]
- Updated dependencies [32c4c1c]
- Updated dependencies [95da9fa]
- Updated dependencies [372db2c]
- Updated dependencies [dfa21e6]
- Updated dependencies [9f08136]
- Updated dependencies [d777295]
- Updated dependencies [0841993]
- Updated dependencies [63c4cb6]
- Updated dependencies [a2a5b12]
- Updated dependencies [78c1866]
  - @kaiord/core@10.0.0
