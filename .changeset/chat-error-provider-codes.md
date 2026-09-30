---
"@kaiord/workout-spa-editor": patch
---

Chat error classification also recognises provider codes such as `insufficient_quota`, `quota_exceeded` and `overloaded_error` (including Anthropic's mid-stream error chunks), treats HTTP 503 as "try again shortly", and reads the message of non-`Error` error objects.
