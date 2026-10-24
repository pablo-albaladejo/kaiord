---
"@kaiord/garmin": patch
---

`percent_max` heart-rate targets are now written to Garmin Connect as bpm, resolved with the athlete's max heart rate from the new `maxHeartRate` writer option (`round(pct × maxHeartRate / 100)`) and then sent as a ±3 bpm band. Before, the percentage itself was written as bpm, so an "85 % max HR" step reached the watch as an 85 bpm target. Without a positive `maxHeartRate` the writer throws `MissingMaxHeartRateError` instead of guessing one, as it does for `percent_ftp` without an FTP.
