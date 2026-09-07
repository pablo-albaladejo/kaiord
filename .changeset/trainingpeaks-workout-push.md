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
absolute targets dropped for want of a threshold, and non-time durations
replaced by a named placeholder.
