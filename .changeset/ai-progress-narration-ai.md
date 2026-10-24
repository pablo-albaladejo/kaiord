---
"@kaiord/ai": minor
---

Report a `reasoning` phase while a thinking model reasons before it writes, so a streamed run no longer looks stalled. A retry now carries why the previous attempt failed (`retryReason`: `truncated`, `invalid` or `provider`), an output cut off at the token limit is caught as truncated instead of reaching validation and its retry gets double the output budget (up to 16384 tokens), since a thinking model spends its reasoning from the same budget; and each `generating` update carries the partial output. Streamed runs put their per-phase timings (`timings`) on the telemetry event, and the console sink prints them.
