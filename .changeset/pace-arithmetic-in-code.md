---
"@kaiord/ai": minor
"@kaiord/workout-spa-editor": patch
---

The model interprets, the code computes: no pace, duration or distance in a generated Workout is a number the model calculated.

- The workout parser (prompt 1.4.0) has the model copy the coach's numbers in the coach's units: time parts (`hours`, `minutes`, `seconds`), distance parts (`meters`, `kilometers`, `miles`), a pace `{ "unit": "pace", "per": "km", "clock": "4:30" }` (with `clockTo` for a range; also per `mi`, `100m`, `100yd`, `400m`, `500m`), a `split` over the step's distance, a `kmh` or `mph` speed, a `reference` (`threshold`, `10k`, `5k`, `half_marathon`, `marathon`), a % max heart-rate range as `min`/`max`, and a block `fill` instead of a counted `repeatCount`. Code computes seconds, metres, m/s (to 0.001), the midpoint, the whole cycles a fill holds, and the athlete's zone range for a reference.
- A pace in m/s from the model is now refused and retried, since no coach writes one.
- Evals gain a `numbers` dimension and ten pace-arithmetic benchmarks in English and Spanish. Their live record, and the re-record of the 25 cassettes the prompt change made stale, is pending the maintainer's `eval:live -- --record`.
- In the Kaiord App, sending a workout to Garmin from the assistant waits for the athlete's confirmation like every other action, and every Tool's description says truthfully whether it asks first.
