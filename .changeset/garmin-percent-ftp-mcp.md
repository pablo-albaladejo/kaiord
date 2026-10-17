---
"@kaiord/mcp": minor
---

**Behaviour change:** `kaiord_convert` to GCN and `kaiord_garmin_push` now fail with the new `missing-ftp` error type when the workout has percent-of-FTP power targets and no `ftp` parameter is given (a `MissingFtpError`); previously the percentages were silently written as watts. Pass the new optional `ftp` parameter (watts) to resolve them.
