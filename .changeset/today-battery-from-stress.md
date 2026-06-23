---
"@kaiord/workout-spa-editor": patch
---

Today readiness: derive the "Battery" stat from a real, independent signal
(the day's ingested stress episodes) instead of reusing the HRV overnight
score. Battery now shows a daily-energy proxy — 100 − mean stress level,
clamped 0–100 — and falls back to the em-dash empty state when no stress
record exists for the day. Full Garmin Body Battery ingestion remains a
follow-up.
