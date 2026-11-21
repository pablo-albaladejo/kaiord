---
"@kaiord/ai": patch
---

Refresh the model catalog for the updated `@ai-sdk/*` providers. Adds `claude-fable-5-2`, `gpt-6.1-terra`, `gemini-4-carbon`, `gemini-4-hydrogen` and `gemini-2.5-flash-lite-preview-06-17`; drops `o1`, `o3` and `aqa`, which the SDKs no longer list. The catalog generator now reads model ids from each SDK's model-definitions object, because the SDKs stopped spelling them as a literal union.
