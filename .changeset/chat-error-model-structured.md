---
"@kaiord/workout-spa-editor": patch
---

The chat error classifier reads provider errors through the shared `readProviderError` reader and decides "model" inside its structured step, after auth and rate and before the generic fallback. A 400 whose message only echoes "not_found_error ... model" is no longer shown as a retired model, and a bare 404 stays generic.
