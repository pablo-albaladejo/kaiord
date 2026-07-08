---
"@kaiord/ai": minor
---

feat(ai): tag input-validation errors with a stable reason and details

`AiParsingError` gains optional `reason` (`input_empty` | `input_too_long`)
and `details` (e.g. `{ maxLength, actualLength }`) fields, set by
`validateInput`, so consumers can localize or branch on the specific failure
by code instead of matching the English message. Additive and
backward-compatible: both fields are optional and the constructor's new
`options` argument defaults to none.
