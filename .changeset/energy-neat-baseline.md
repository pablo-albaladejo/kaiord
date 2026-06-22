---
"@kaiord/core": minor
---

energy-expenditure: `resolveDayExpenditure` accepts an optional `neatFactor` (>= 1) that scales BMR for non-exercise daily activity (NEAT) in the predicted basal. This fixes the rest-day expenditure underestimate (raw BMR) — a moderately active profile now shows realistic maintenance. Scheduled-workout kcal stay additive via `expectedActivityKcal`, so they are never double-counted. Omitting `neatFactor` preserves the previous BMR-only behavior.
