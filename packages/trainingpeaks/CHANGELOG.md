# @kaiord/trainingpeaks

## 10.2.0

### Minor Changes

- f0b5647: Add a KRD → TrainingPeaks structured-workout converter.

  `krdToTrainingPeaksWorkout` builds the body for
  `POST /fitness/v6/athletes/{athleteId}/workouts`, and
  `krdToTrainingPeaksStructure` exposes the `structure` object on its own.
  KRD's step/repetition tree maps onto TrainingPeaks' blocks, targets become
  percentages of the athlete's thresholds, and the preview polyline is derived
  rather than omitted.

  Two wire details the API documents nowhere and this converter handles: the
  request carries `structure` as a JSON-encoded **string** (an object is
  rejected, though the response returns one), and a block's `length.value` is its
  **repeat count**, not a duration.

  Conversions TrainingPeaks cannot hold announce themselves through the injected
  logger per `spec/conversion-loss-honesty` — zones collapsed to a midpoint,
  absolute targets dropped because no threshold is available, and non-time durations
  replaced by a named placeholder.

  A workout whose steps mix target metrics (power then heart rate, say) now drops
  the targets that do not match the workout's primary metric, with a
  `Lossy conversion:` warning naming both. TrainingPeaks carries one
  `primaryIntensityMetric` per workout while each band is a percentage of its own
  threshold, so sending a mismatched band made the platform read, for example,
  85% of max heart rate as 85% of FTP.

## 10.1.2

### Patch Changes

- Updated dependencies [4e1e2f7]
  - @kaiord/core@10.1.2

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
