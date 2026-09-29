---
"@kaiord/ai": patch
---

`runTurn` now rethrows the provider's own error (an `APICallError` with its `statusCode`) when a chat turn's stream fails, instead of the SDK's generic `NoOutputGeneratedError`, and no longer lets the SDK log the failed request to the console.
