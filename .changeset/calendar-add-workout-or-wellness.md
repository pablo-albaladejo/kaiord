---
"@kaiord/workout-spa-editor": minor
---

Calendar `+` now disambiguates adding a workout vs a wellness metric. The per-day `+` affordance renders on every day (grid and list views, no longer gated to empty training days) and opens a Workout | Wellness chooser. Workout preserves the existing `/workout/new?date=` flow; Wellness opens a manual-entry form (weight, sleep score, HRV, steps) plus a file-dated FIT import option. Manual entries persist via a new application use case that upserts one record per day per metric (reusing the existing `[profileId+date]` row id); a manual steps save merge-preserves any prior imported calories/intensity and overrides only the step count. Drag-to-reschedule is unaffected by the always-visible `+`.
