---
"@kaiord/ai": patch
---

Workout-parser validation now rejects `basis` anywhere but a power `range`: on a heart-rate or pace target, or on a single power value such as `{ "unit": "watts", "value": 85, "basis": "percent_ftp" }`. Before, core silently stripped it, so an 85% FTP step could have been stored as 85 W. The retry-with-feedback loop now asks the model to correct the step and names it.
