---
"@kaiord/trainingpeaks": minor
---

Add a KRD → TrainingPeaks structured-workout converter.

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
