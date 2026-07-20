---
"@kaiord/core": minor
"@kaiord/fit": minor
---

Carry visceral fat rating and basal metabolic rate through body composition.
The KRD `bodyComposition` schema gains optional `visceralFatRating` (unitless)
and `basalMetabolicRateKcal` (kcal/day) fields, and the FIT `body_composition`
converter now maps both directions (FIT `visceralFatRating`/`basalMet` ↔ KRD),
so scales reporting them no longer silently drop the values. BMR is carried as
real kcal because the @garmin/fitsdk Encoder/Decoder auto-applies the FIT
profile scale (4) for `basal_met`.
