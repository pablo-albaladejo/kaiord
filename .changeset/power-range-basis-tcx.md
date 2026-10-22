---
"@kaiord/tcx": patch
---

The TCX writer now logs a warning when it drops a power target it cannot store (anything but a single watts value, e.g. `percent_ftp` or a power range) instead of dropping it silently.
