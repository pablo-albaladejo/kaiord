# @kaiord/trainingpeaks

## 10.1.0

### Minor Changes

- b95f6a7: Add the `@kaiord/trainingpeaks` package: a pure, offline adapter that maps
  between KRD health documents and the TrainingPeaks internal metrics API
  (`tpapi.trainingpeaks.com`) `consolidatedtimedmetric(s)` payloads. The read
  side turns a `consolidatedtimedmetrics` response into KRD `weight_measurement`
  documents (weight `type 9`; a naive timestamp is anchored to UTC), and the
  write side turns a KRD weight into a `consolidatedtimedmetric` payload (weight
  `type 9`, value in kilograms — TrainingPeaks' canonical storage unit; see
  `TRAININGPEAKS_WEIGHT_UNITS`). Non-weight channels (pulse, HRV, sleep, spo2,
  steps, RMR, injury) are intentionally deferred. zod schemas validate the
  payloads; unit tests use synthetic fixtures only.

### Patch Changes

- Updated dependencies [23974fe]
- Updated dependencies [e33f860]
- Updated dependencies [07a4939]
- Updated dependencies [ec4b349]
  - @kaiord/core@10.1.0
