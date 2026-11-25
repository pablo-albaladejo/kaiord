---
"@kaiord/workout-spa-editor": minor
---

A Train2Go session that comes with its steps table now shows that table in the coaching dialog, next to the coach's text and as the coach wrote it (duration, zone, power in W, heart rate in bpm, repeat blocks as "N ×" groups), whether or not its Workout is built. The session also becomes a Workout from that table, without the AI. Each step keeps its duration and zone label, power is its target, and the heart-rate range is kept in the step's note (KRD steps carry one target). A row repeated several times, with its recovery rows, becomes one repetition. When the table is missing or any cell of it cannot be read, the session converts through the AI as before, never from part of a table, and no partial table is shown. The read is the same daily read, so the extension's requests, permissions and privacy texts do not change.
