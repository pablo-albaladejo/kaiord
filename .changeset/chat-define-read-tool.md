---
"@kaiord/workout-spa-editor": patch
---

Chat read tools share one contract (`defineReadTool`): dates must be `YYYY-MM-DD`, `sport` is a closed enum, readers are bound to the active profile before the tool runs, every result echoes `range_used` and is held to a row and 8 KB byte budget with `truncated`/`omitted`. `query_workouts` now queries the profile index instead of filtering every profile in memory and returns each workout's `id`; `query_health` returns per-metric numbers instead of the raw KRD payload.
