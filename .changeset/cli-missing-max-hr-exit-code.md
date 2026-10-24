---
"@kaiord/cli": patch
---

`MissingMaxHeartRateError` (a `percent_max` heart-rate target written to Garmin without a max heart rate) now exits with `INVALID_ARGUMENT`, like `MissingFtpError`, instead of `UNKNOWN_ERROR`. It is matched by class and by error name.
