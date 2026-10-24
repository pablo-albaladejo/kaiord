---
"@kaiord/garmin-connect": patch
---

`push` now rethrows `MissingMaxHeartRateError` unwrapped, as it already does for `MissingFtpError`. A `percent_max` heart-rate target pushed without a max heart rate is reported as a caller input error instead of a retryable `ServiceApiError` ("retry later"). The error name is checked as well, so a second copy of `@kaiord/core` is still recognised.
