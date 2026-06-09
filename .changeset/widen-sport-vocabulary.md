---
"@kaiord/core": minor
"@kaiord/fit": minor
"@kaiord/tcx": minor
"@kaiord/zwo": minor
"@kaiord/workout-spa-editor": minor
---

Widen the KRD sport vocabulary to the full Garmin FIT taxonomy

The KRD domain `sport` enum is widened from 4 values (cycling/running/swimming/
generic) to the full FIT `Sport` taxonomy (snake_case), so workouts can carry
their real sport (training, rowing, hiking, tennis, cross-country skiing, …)
instead of collapsing to `generic`. The change is additive — every prior value
stays valid.

- **core**: full FIT-anchored `sportSchema` + a new `sportCategory()` classifier
  (cycling/running/swimming/other) that drives all capability-dependent logic.
- **fit**: bidirectional camelCase↔snake_case sport mapper wired into the
  metadata/session/lap read+write paths, so multi-word sports encode without
  throwing and decode without falling back to cycling.
- **tcx/zwo**: lossy-format sport collapse now derives from `sportCategory()`
  (TCX → Running/Biking/Other; ZWO → bike/run) instead of exhaustive tables, so
  growing the vocabulary never breaks these adapters.
- **workout-spa-editor**: coaching activities map onto a real (sport, subSport)
  pair (e.g. Stretching → training/flexibility_training, Gym →
  training/strength_training, Rowing → rowing/indoor_rowing); the editor heading
  shows the humanized sport. Non-endurance sports behave like `generic` for zones.
