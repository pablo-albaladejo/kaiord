---
"@kaiord/workout-spa-editor": patch
---

Chat errors are classified by HTTP status and provider error type first, with word-boundary text matching only as a fallback, so a 400 invalid request is no longer reported as "Rate limit or quota reached".
