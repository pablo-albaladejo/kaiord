---
"@kaiord/core": minor
---

feat(core): implement FIT LAP message support (Phase 2.1)

- Added bidirectional FIT LAP message conversion (FIT ↔ KRD)
- Extended KRD lap schema with new fields: totalTimerTime, maxCadence, maxPower, normalizedPower, avgSpeed, maxSpeed, totalAscent, totalDescent, totalCalories, trigger, sport, subSport, workoutStepIndex, numLengths, swimStroke
- Added lap trigger mapping (manual, time, distance, position, session_end, fitness_equipment)
- Integrated lap extraction in activity.mapper.ts
- Added round-trip tests with tolerances (±1s time, ±1W power, ±1bpm HR)
