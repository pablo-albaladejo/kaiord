---
"@kaiord/core": minor
"@kaiord/garmin": minor
---

Add LLM agent support for structured workouts

- `createWorkoutKRD(unknown)`: validates unknown input and wraps in KRD envelope
- `extractWorkout(KRD)`: extracts and validates structured workout from KRD
- `workoutToGarmin(unknown)`: direct Workout to Garmin Connect JSON conversion
- `structured-workout-full.json`: self-contained JSON Schema for LLM agents
- `mapZodErrors`: shared Zod-to-ValidationError mapping utility
