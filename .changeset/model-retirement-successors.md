---
"@kaiord/ai": minor
---

A retired model now heals to its same-tier successor instead of the provider default (`claude-3-haiku-20240307` → `claude-haiku-4-5`, `claude-opus-4-1` → `claude-opus-5`): `RETIRED_MODELS` maps each retired id to its successor, and the new `DEPRECATED_MODELS` lists models still served but announced for retirement, with successor and date. New helpers `modelForProvider`, `retiredSuccessor` and `deprecationOf` are exported from `@kaiord/ai/providers`. The Anthropic default is now `claude-sonnet-5`, and `getDefaultModel` returns the curated default with no silent fallback. `isModelNotFoundError` now requires an error body that names a model, so a 404 with an unrelated body is no longer treated as a missing model.
