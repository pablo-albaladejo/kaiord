---
"@kaiord/garmin-bridge": minor
---

Add the `schedule` and `unschedule` actions, which place a library workout on a Garmin Connect calendar date and remove a calendar entry Kaiord placed. Each runs under a 30-second deadline that also bounds the token mint, starts no write after 20 seconds, and reports `deadline-before-send` or `deadline-exceeded` so the editor can tell a write that never left from one whose outcome is unknown. `ping` now reports `features: ["calendar-write-v1"]`.
