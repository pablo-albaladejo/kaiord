---
"@kaiord/workout-spa-editor": patch
---

Surface a retryable error when a coaching activity's lazy description fetch
(`read-day`) fails, instead of hanging on "Loading description…" forever. The
`expandDay` result now flows through `CoachingSource.expand` and
`expandActivity` to the activity dialog, which renders a reason-specific message
(not-linked / session-expired / transport-error) and a "Retry" button that
re-fires the fetch. The auto-fetch still fires once per activity; only the
button retries.
