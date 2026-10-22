---
"@kaiord/garmin": minor
---

GCN output now resolves power ranges with `basis: "percent_ftp"` (Zwift ramps, FIT percent-FTP ranges) to watts with the same FTP as single `percent_ftp` targets, and throws `MissingFtpError` when no usable `ftpWatts` is given. Previously their percentages were written as watts (a 50–75 % FTP warm-up became 50–75 W). Zwift cooldowns and descending ramps now convert too (a 75–50 % cooldown at 250 W FTP becomes a 125–188 W range) instead of failing validation.

**Breaking for callers without an FTP:** converting a workout with a % FTP power range (a Zwift ramp, a FIT percent-FTP range) to GCN without an FTP now throws `MissingFtpError`, where it used to emit wrong watts silently. Pass `ftpWatts` (`--ftp` on the CLI).
