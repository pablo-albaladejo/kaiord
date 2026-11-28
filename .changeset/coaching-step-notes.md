---
"@kaiord/core": minor
"@kaiord/ai": minor
"@kaiord/garmin": patch
"@kaiord/garmin-bridge": patch
"@kaiord/workout-spa-editor": minor
---

A Workout built from a Coaching Activity keeps the coach's cue for each stretch as that step's note. The AI parser's output carries each step's note and whether the coach or the AI wrote it (prompt 1.4.0). A Workout read from the coach's steps table keeps the table's steps and, when an AI is configured, a notes-only call adds the cue before each step's HR range; it can only add notes, and when it fails the Workout keeps its HR ranges and a notice says so. The editor labels a note the AI wrote on its own "AI" until it is edited. `@kaiord/core` exports `markAiNote`, `isAiNote`, `clearNoteOrigin` and `STEP_NOTE_MAX`; `@kaiord/ai/agents` exports the step-notes agent. The Garmin bridge admits a workout description up to 1024 characters, and the Garmin writer cuts a longer one to fit.
