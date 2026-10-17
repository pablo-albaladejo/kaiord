---
"@kaiord/workout-spa-editor": patch
---

When an approved chat action fails, the assistant now receives an app error code (`invalid_input` or `action_failed`) instead of the exception's text, which could come from a bridge, a provider or an imported file. The cause is still logged, scrubbed and bounded.
