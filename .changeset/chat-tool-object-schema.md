---
"@kaiord/workout-spa-editor": patch
---

Fix the in-app chat failing every request with Anthropic (`tools.11.custom.input_schema.type: Field required`): the `set_data_route` tool now sends a single top-level `type: "object"` input schema to the provider, keeping its per-action validation.
