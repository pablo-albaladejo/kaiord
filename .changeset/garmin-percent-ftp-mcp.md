---
"@kaiord/mcp": minor
---

Add an optional `ftp` parameter to `kaiord_convert` and `kaiord_garmin_push` to resolve percent-of-FTP power targets for GCN; without it such a conversion fails with the new `missing-ftp` error type.
