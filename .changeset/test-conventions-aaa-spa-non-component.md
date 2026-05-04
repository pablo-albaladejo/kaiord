---
---

chore: AAA structure markers on SPA non-component tests (PR-4 of test-conventions-should-aaa)

Adds canonical Pascal-case `// Arrange` / `// Act` / `// Assert` line comments to every `it()` body across 158 SPA non-component test files (`packages/workout-spa-editor/src/{adapters,application,hooks,lib,store}/**/*.test.{ts,tsx}` plus a few SPA roots). 1,193 `it()` bodies marked.

Drains `scripts/check-test-aaa.mjs:AAA_ALLOWLIST_SPA_NON_COMPONENT` from 158 → 1 (single escape-hatch: `get-user-preferences.test.ts` contains the literal `it (` inside a test title, false-flagged by the count-based detector — PR-6 will tighten the heuristic to disregard string-literal hits).

No public package version bumps. Test code only.
