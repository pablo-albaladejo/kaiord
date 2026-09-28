---
"@kaiord/cli": minor
---

Add `--ftp <watts>` to `kaiord convert` and `kaiord garmin push`. Percent-of-FTP power targets written to GCN are resolved with it; without it the command exits with code 1 and suggests `--ftp` instead of writing percentages as watts.
