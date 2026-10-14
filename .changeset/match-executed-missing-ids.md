---
"@kaiord/workout-spa-editor": patch
---

The calendar no longer crashes when a session match has no `executedWorkoutIds` (for example a row from a hand-edited backup): the executed-session auto-match treats it as an empty list, like the other readers.
