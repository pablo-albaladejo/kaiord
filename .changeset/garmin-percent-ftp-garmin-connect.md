---
"@kaiord/garmin-connect": minor
---

**Behaviour change:** `push(krd)` of a workout with percent-of-FTP power targets now rejects with `MissingFtpError` before any request is sent unless an FTP is passed as `push(krd, { ftpWatts })`; previously the percentages reached Garmin Connect as watts. With `ftpWatts` they are sent as the right watts.
