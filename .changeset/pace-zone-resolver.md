---
"@kaiord/garmin": patch
---

Resolve pace zone references to m/s ranges for Garmin Connect

Garmin Connect does not support native pace zone numbers. Pace zone targets
are now resolved to min/max m/s values via a configurable PaceZoneTable,
passed through createGarminWriter and createWorkoutToGarmin options.
