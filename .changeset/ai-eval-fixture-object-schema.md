---
"@kaiord/ai": patch
---

The `set_data_route` chat-tool eval fixture now serialises to a top-level `type: "object"` input schema, which Anthropic and OpenAI require, mirroring the SPA tool.
