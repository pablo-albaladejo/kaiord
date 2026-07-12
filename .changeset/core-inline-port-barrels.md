---
"@kaiord/core": patch
---

Internal code reduction, no behavior change.

Inline two single-use pass-through re-export barrels (`ports/index.ts` and
`application/index.ts`) into the package entry point. The public `@kaiord/core`
API surface is unchanged.
