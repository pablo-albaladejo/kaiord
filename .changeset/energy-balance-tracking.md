---
"@kaiord/core": minor
---

Add energy-balance calculators powering the new energy-balance tracking feature: BMR
(Mifflin-St Jeor / Katch-McArdle), daily expenditure resolution (measured vs
predicted), goal daily-delta with safety caps, periodized daily target, P/C/F macro
targets, expected-activity-kcal estimation (curated MET table + tiered estimator),
exponential-moving-average smoothing, energy-balance rollup aggregation, and adaptive
TDEE (self-correcting maintenance from the weight trend vs logged intake). All pure,
fully unit-tested functions exported from the package root.
