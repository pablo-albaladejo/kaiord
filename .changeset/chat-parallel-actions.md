---
"@kaiord/ai": patch
---

When the model calls several action tools in one step, the chat agent still offers the last one for confirmation and now answers the others with `{ error: "one_action_at_a_time" }`, so every tool call has a result. Before, resuming such a turn failed with `AI_MissingToolResultsError` (and Anthropic rejects a `tool_use` without a `tool_result`).

A copy of the pending call (same tool, same input) is answered `{ error: "duplicate_of_pending" }` instead, so the model does not ask for it again. The deferred message says that the user's answer to the pending action does not cover it, and `pendingAction.deferredCount` reports how many actions were deferred.
