---
"@kaiord/workout-spa-editor": patch
---

Garmin exports (single push, Send week, the chat tool and the GCN file download) now pass the athlete's max heart rate to the Garmin writer, so `% max HR` targets reach the watch as a bpm band instead of the raw percentage as bpm. When the profile has no max heart rate, the export is refused with a `missing-max-hr` reason and an EN/ES message asking to set it in Athlete, the same way a missing FTP is reported for `% FTP` power.
