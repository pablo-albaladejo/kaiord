---
"@kaiord/whoop": minor
---

Add workout→activity conversion and a sports catalog, and fix the WHOOP
STRAIN converter's energy/heart-rate field names.

**New**: `whoopWorkoutSchema` (`record.workouts[]`) and `workoutToActivity`
map a WHOOP workout to a KRD `Activity`, converting kilojoules to kcal and
resolving the numeric `sport_id` via a new `whoopSportsResponseSchema` /
`buildSportCatalog` built from the `activities-service/v1/sports/history`
catalog.

**Fix**: `cycleToStrain` read a non-existent `cycle.kilojoule` field, so
`energyKilojoules` was never populated, and never mapped WHOOP's
`day_avg_heart_rate`/`day_max_heart_rate` at all. It now reads the real
`day_kilojoules`, `day_avg_heart_rate`, and `day_max_heart_rate` fields
(additive to previously emitted strain summaries).
