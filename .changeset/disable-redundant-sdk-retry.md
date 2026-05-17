---
"@kaiord/ai": patch
---

Disable the AI SDK's internal retry layer (`maxRetries: 0` on every `generateText` call). `executeWithRetry` already owns the retry loop and the non-retryable APICallError gate, so the SDK's `retry-with-exponential-backoff` was a redundant second layer — a retryable 5xx could fan out to up to (SDK-maxRetries+1) × (executeWithRetry-maxRetries+1) = 9 HTTP calls per user click. Collapsing to one layer makes the per-click HTTP cost predictable (≤ `maxRetries + 1` attempts) and unblocks the e2e flow b mock from needing the multi-call workaround.
