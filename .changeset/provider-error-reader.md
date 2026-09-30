---
"@kaiord/ai": minor
---

New `readProviderError` in `@kaiord/ai/providers` reads a provider failure's structured fields (status code, body `type`/`code`/`status`/`message`) through `lastError`/`cause` wrappers, and `namesMissingModel` classifies them. `isModelNotFoundError` is built on both: a typed body is authoritative, so a 400 whose message merely echoes "not_found_error ... model" is no longer read as a missing model; the message text is consulted only for body-less errors.
