---
"@kaiord/core": minor
---

Add an activity-level NEAT factor API (`ActivityLevel`, `NEAT_FACTOR`, `DEFAULT_NEAT_FACTOR`, `neatFactorForActivityLevel`) and apply it to the predicted daily expenditure. `resolveDayExpenditure` now accepts an optional `basalActivityFactor` that scales the predicted basal (`bmrKcal × factor`), so a no-workout day reflects realistic maintenance instead of raw BMR. The factors are NEAT-only (sedentary 1.2 … very_active 1.6); scheduled-workout energy is still added separately via `expectedActivityKcal` and is never double-counted, and the measured-wellness path is unchanged.
