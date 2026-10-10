---
"@kaiord/fit": patch
---

FIT workouts written by kaiord keep their durations, targets and repeat blocks. The Garmin SDK encoder writes only main fields, so values the writer set under sub-field names (`durationDistance`, `targetPowerZone`, `repeatSteps`, custom target ranges) were silently dropped, and a re-imported workout lost its distances, targets and repeats. Messages are now written with their main fields filled and in profile field order (the encoder otherwise put values in the wrong slots when it reused a definition). Repeat-until conditions (time, distance, calories, heart rate, power) are written and read through the profile's `repeat*` sub-fields, a swim stroke target is read from the decoder's stroke name, and a single cadence or pace value reads back as a value rather than an equal range.
