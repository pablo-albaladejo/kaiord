---
"@kaiord/garmin": minor
---

Fix percent-of-FTP power targets being written to Garmin Connect as watts (85 % FTP became 85 W). `createGarminWriter({ ftpWatts })` now resolves them as `round(pct / 100 × ftpWatts)`; without an FTP the writer throws `MissingFtpError` instead of guessing. Watts, watt ranges and power zones are unchanged.
