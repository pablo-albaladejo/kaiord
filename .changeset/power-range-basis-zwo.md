---
"@kaiord/zwo": minor
---

Zwift `Warmup`, `Cooldown` and `Ramp` blocks are now read as power ranges with `basis: "percent_ftp"` instead of unmarked ranges whose percentages looked like watts, and those ranges are written back as their original `PowerLow`/`PowerHigh` FTP fractions. Previously a native ramp written back to ZWO was treated as watts and rescaled against an assumed 250 W FTP.
