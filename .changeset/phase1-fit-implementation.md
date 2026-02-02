---
"@kaiord/core": minor
---

feat(fit): implement Phase 1 FIT message support

- Add SESSION message (ID 18) converters for activity file support
- Add RECORD message (ID 20) converters with coordinate conversion (semicircles ↔ degrees)
- Add EVENT message (ID 21) converters with FIT ↔ KRD event type mapping
- Fix stroke_type target conversion (KRD → FIT) for swimming workouts
- Add coordinate converter utility for reusable geo coordinate transformations
- Extend KRD domain schemas with additional activity fields:
  - Session: maxCadence, maxPower, normalizedPower, trainingStressScore, etc.
  - Record: temperature, verticalOscillation, stanceTime, stepLength
  - Event: workout_step, session, activity event types
- Refactor messages.mapper.ts to detect and route workout vs activity files

This enables full activity file (SESSION, RECORD, EVENT) conversion support.
