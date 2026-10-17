---
"@kaiord/fit": minor
---

FIT custom power ranges stored as percent FTP (raw values below the 1000 watts offset) are now read as power ranges with `basis: "percent_ftp"`, and such ranges are written without the +1000 watts offset, mirroring single `percent_ftp` targets. Previously a percent-FTP range was read as watts with the same numbers, and written back with the watts offset.
