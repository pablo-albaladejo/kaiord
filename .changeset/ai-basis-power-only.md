---
"@kaiord/ai": patch
---

Reject `basis` on a non-power target during workout-parser validation, so the retry-with-feedback loop asks the model to correct it instead of core silently stripping it
