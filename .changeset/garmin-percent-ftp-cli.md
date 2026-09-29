---
"@kaiord/cli": minor
---

**Behaviour change:** `kaiord convert` to GCN and `kaiord garmin push` now require `--ftp <watts>` when the workout has percent-of-FTP power targets. Without it the command exits with code 1 (`MissingFtpError`) and suggests `--ftp`; previously it silently wrote the percentages as watts. Workouts with only watts, watt ranges or power zones are unaffected.
