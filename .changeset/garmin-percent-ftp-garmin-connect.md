---
"@kaiord/garmin-connect": minor
---

`push(krd, { ftpWatts })` forwards the athlete FTP to the GCN writer so percent-of-FTP power targets reach Garmin Connect as the right watts. A workout that needs an FTP and has none rejects with `MissingFtpError` before any request is sent.
