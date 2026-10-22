---
"@kaiord/workout-spa-editor": patch
---

Percent-FTP power ranges (such as Zwift warm-up ramps) now show as "50-75% FTP" instead of watts, keep their percent-FTP basis when their bounds are edited, count as FTP-dependent for the missing-FTP warning, and are converted with the profile FTP on Garmin export and "Send to Garmin". The range fields in the target picker label their bounds with the unit they are typed in ("% FTP" or "W").

**Re-import ZWO workouts saved before this release.** Workouts imported from ZWO by an earlier version keep their ramps as basis-less ranges, which mean watts; they are not migrated. Import the original `.zwo` file again to get % FTP ramps.
