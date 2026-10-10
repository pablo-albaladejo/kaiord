---
"@kaiord/ai": patch
---

`runTurn` now rethrows the provider's own error (an `APICallError` with its `statusCode`) whenever a chat turn's stream fails: in place of the SDK's generic `NoOutputGeneratedError` when no step completed, and instead of silently returning the earlier step's partial result when a later step fails. It also no longer lets the SDK log the failed request to the console. Tool failures are unaffected; they stay tool results inside the loop.
