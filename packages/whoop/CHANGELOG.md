# @kaiord/whoop

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
