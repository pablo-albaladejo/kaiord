---
---

chore: AAA structure markers on backend tests (PR-3 of test-conventions-should-aaa)

Adds canonical Pascal-case `// Arrange` / `// Act` / `// Assert` line comments to every `it()` body across 148 backend test files (`@kaiord/ai`, `@kaiord/cli`, `@kaiord/core`, `@kaiord/fit`, `@kaiord/garmin`, `@kaiord/garmin-connect`, `@kaiord/landing`, `@kaiord/mcp`, `@kaiord/tcx`, `@kaiord/zwo`). 1,520 `it()` bodies marked.

Drains `scripts/check-test-aaa.mjs:AAA_ALLOWLIST_BACKEND` from 148 → 0.

Also fixes `scripts/check-aaa-migration-no-logic-edits.mjs` — replaced raw scanner with an AST-driven leaf-node walker so template literals with `${}` substitutions don't produce spurious mismatches.

No public package version bumps. Test code only.
