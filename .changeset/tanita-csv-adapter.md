---
"@kaiord/tanita": minor
---

Add the `@kaiord/tanita` package: a pure, offline adapter that parses the
MyTANITA "export-csv" body-composition export into KRD health documents. Each
measurement row becomes one KRD carrying a `weight` measurement and/or a
`bodyComposition` snapshot under `extensions.health` (mapping `Weight (kg)`,
`BMI`, `Body Fat (%)`, `Visc Fat`, `Muscle Mass (kg)`, `Bone Mass (kg)`,
`BMR (kcal)`, and `Body Water (%)`). Missing `-` cells become `undefined`
(never `0`), and the naive local `Date` is anchored to UTC as ISO 8601.
Segmental muscle/fat, muscle quality, metabolic age, physique rating, and
heart-rate columns are intentionally deferred (no KRD home yet).
