---
"@kaiord/core": minor
---

feat(core): add stable, language-free `code` to `ValidationError`

Validation failures now carry an optional machine `code` (e.g. `min_gt_max`,
`duration_type_mismatch`, or the native Zod issue code) alongside the English
`message`, so presentation layers can localize by code instead of matching
message text. Additive and backward-compatible: `code` is optional and the
`message` wording is unchanged.
