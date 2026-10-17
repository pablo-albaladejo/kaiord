---
"@kaiord/ai": patch
---

When the model calls several action tools in one step, the chat agent still offers the last one for confirmation and now answers the others with `{ error: "one_action_at_a_time" }`, so every tool call has a result. Before, resuming such a turn failed with `AI_MissingToolResultsError` (and Anthropic rejects a `tool_use` without a `tool_result`).
