---
"@kaiord/garmin-bridge": minor
---

Add the `schedule` and `unschedule` actions, which place a library workout on a Garmin Connect calendar date and remove a calendar entry Kaiord placed. Each runs under a 25-second deadline that also bounds the wait for a token, starts no write after 15 seconds, and reports `deadline-before-send` or `deadline-exceeded` so the editor can tell a write that never left from one whose outcome is unknown. Add the read-only `calendar-find` action, which reads one month of the Garmin calendar and returns only the entries of one workout, as `{ workoutScheduleId, date }`; nothing else in the calendar leaves the extension. `ping` now reports `features: ["calendar-write-v1", "calendar-find-v1"]`.
