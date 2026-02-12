---
"@kaiord/cli": patch
---

Extract validate command into directory structure and slim kaiord.ts

- Split validate command into `validate/index.ts`, `types.ts`, `execute-validation.ts`, `format-results.ts`
- Extract yargs configs for convert, validate, and diff commands
- Fix logFormat inconsistency: use `"structured"` instead of `"json"`
- Remove dead code (identical ternary branches) in kaiord.ts
- kaiord.ts reduced from 290 to ~110 lines
