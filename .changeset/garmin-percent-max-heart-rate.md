---
"@kaiord/garmin": patch
---

`percent_max` heart-rate targets are now written to Garmin Connect as bpm, resolved with the athlete's max heart rate from the new `maxHeartRate` writer option (`round(pct × maxHeartRate / 100)`) and then sent as a ±3 bpm band. Before, the percentage itself was written as bpm, so an "85 % max HR" step reached the watch as an 85 bpm target. If `maxHeartRate` is missing or not a plausible value (finite and between 100 and 300 bpm), the writer throws `MissingMaxHeartRateError` instead of guessing one, as it does for `percent_ftp` without an FTP. A target that resolves outside 1–300 bpm throws `KrdValidationError` instead of being written as 0 bpm or clamped to a zero-width 300–300 band.
