---
"@kaiord/garmin": minor
---

GCN output now resolves power ranges with `basis: "percent_ftp"` (Zwift ramps, FIT percent-FTP ranges) to watts with the same FTP as single `percent_ftp` targets, and throws `MissingFtpError` when no usable `ftpWatts` is given. Previously their percentages were written as watts (a 50–75 % FTP warm-up became 50–75 W).
