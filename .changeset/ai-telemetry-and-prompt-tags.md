---
"@kaiord/ai": patch
---

A throwing telemetry sink no longer fails a successful generate run or emits a false `run_failed`. `buildUserPrompt` neutralizes a literal closing `</coach_description>` / `</coach_comment>` tag inside coach text (text without one is unchanged). Internal cleanups: one source for the parser prompt version, no duplicate `truncate`, and the removed `debug` log line "Workout parse requested" from the deprecated `createTextToWorkout`.
