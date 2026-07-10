---
"@kaiord/ai": minor
---

feat(ai): forward an optional telemetry sink through the text-to-workout wrapper

`TextToWorkoutConfig` gains an optional `telemetry?: AiTelemetrySink` field. When
supplied, `createTextToWorkout` forwards it to the generate-mode runtime it
already delegates to, so a workout-generation run emits `run_finished`/
`run_failed` through the same observability port as the agent runtime. Additive
and behavior-preserving: the field is optional, the deprecated wrapper keeps its
signature and `AiParsingError` semantics, and omitting it is unchanged. No
breaking change.
