---
"@kaiord/ai": patch
---

`@kaiord/ai/providers` exports `EVALUATED_MODELS` and `isEvaluatedModel(type, modelId)`: the models with a passing result in the committed eval results (today only `claude-sonnet-5`), so an app can label every other model "not evaluated".
