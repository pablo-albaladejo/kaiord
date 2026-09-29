---
"@kaiord/ai": patch
"@kaiord/workout-spa-editor": patch
---

The model catalog no longer offers models the provider has retired or deprecated (`claude-3-haiku-20240307`, `claude-opus-4-1`, `claude-opus-4-0`, `claude-sonnet-4-0` and their dated ids), and the default model per provider is a curated current model (`claude-sonnet-4-5`, `gpt-5-mini`, `gemini-2.5-flash`) instead of the catalog's oldest entry. A saved choice pointing at a retired model resolves to that default, `isModelNotFoundError` detects a provider rejecting the model, and the SPA shows "This model is no longer available — pick another in Settings → AI" instead of a generic failure.
