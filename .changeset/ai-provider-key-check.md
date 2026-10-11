---
"@kaiord/ai": minor
---

Add `verifyProviderKey(credential, fetch?)`. It checks an API key against the provider's list-models endpoint, spending no tokens, and returns `valid`, `invalid` (401, or Google `API_KEY_INVALID`) or `unverified` (network failure or any other status, including 403, which a restricted OpenAI key or a Google project with the API disabled returns for a working key). It also raises the `ai` floor to `^7.0.123`. Below that version, a stream that failed before any step completed left an unhandled `NoOutputGeneratedError` rejection in browsers.
