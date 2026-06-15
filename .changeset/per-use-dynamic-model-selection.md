---
"@kaiord/workout-spa-editor": minor
---

Decouple the AI provider API key from the model and add per-use model
selection. Adding a provider at Settings · AI now collects only type, label,
and API key. A new per-profile "Models" section binds a model to each use —
a Default plus Chat and Workout-generation overrides — resolved through a
single `resolveModelForPurpose()` shared by chat, free-text generation,
coaching conversion, and batch processing. Model choices come from a catalog
generated from the installed `@ai-sdk/*` packages (with a free-text field for
ids newer than the pinned SDK), replacing the hardcoded model enum. Existing
users are unaffected: a Dexie v22 migration backfills each profile's default
binding from its current default provider.
