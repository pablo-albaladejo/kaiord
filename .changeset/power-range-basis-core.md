---
"@kaiord/core": minor
---

Add an optional `basis: "percent_ftp"` to the KRD power `range` target. Absent, the bounds are watts as before, so existing KRD stays valid and round-trips unchanged; with `basis: "percent_ftp"` the bounds are percentages of FTP (a 50–75 % FTP warm-up ramp). The round-trip comparer now flags a lost or changed `basis` and checks percent-FTP range bounds with the percent-FTP tolerance.
