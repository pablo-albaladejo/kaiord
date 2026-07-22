---
"@kaiord/fit": minor
---

Add an encodable Garmin body-composition upload path. `encodeBodyCompositionFit`
turns a KRD carrying weight and/or body composition into real FIT file bytes by
emitting a `weight_scale` (mesgNum 30) message: the `@garmin/fitsdk` v21.208.0
Profile has no `body_composition` (mesgNum 41), so a real `Encoder` throws on it.
The `weight_scale` message carries weight plus the composition fields
(percentFat, percentHydration, visceralFatRating, boneMass, muscleMass, basalMet,
bmi) at real values — proven by a real-SDK byte round-trip. The FIT-encode entry
now exposes a shared `encodeFitMessages` used by both the workout writer and this
upload path.
