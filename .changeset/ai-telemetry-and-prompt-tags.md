---
"@kaiord/ai": patch
---

A throwing telemetry sink no longer fails a successful generate run or emits a false `run_failed`; the failure is reported as a logger warning. A throwing logger no longer stops the retry loop or replaces the final `AiAgentError`, and a sink or logger that returns a rejected promise is contained the same way (reported, never awaited). `buildUserPrompt` neutralizes a closing `</coach_description>` / `</coach_comment>` tag inside coach text, in any case, with whitespace inside the brackets, or split by a control character (text without one is unchanged). Internal cleanups: one source for the parser prompt version, no duplicate `truncate`, and the removed `debug` log line "Workout parse requested" from the deprecated `createTextToWorkout`.
