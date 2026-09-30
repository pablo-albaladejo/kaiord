---
"@kaiord/ai": patch
---

The `set_data_route` chat-tool eval fixture now carries the production tool's field descriptions, including which fields each action requires, and its priority-needs-`sourceOrder` rule, so evals grade the model against the schema it actually sees.
