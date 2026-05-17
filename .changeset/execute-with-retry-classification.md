---
"@kaiord/ai": patch
---

Propagate non-retryable `APICallError` immediately from `executeWithRetry` instead of catching it as a prompt-correction retry. Auth errors (e.g. 401/403 from Anthropic) and other provider-classified non-retryable failures now surface in one call rather than three, saving tokens and latency for users with revoked or misconfigured API keys. Provider-classified retryable failures (overloaded errors, network blips) continue to retry as before, and schema validation failures still trigger the prompt-correction loop.
