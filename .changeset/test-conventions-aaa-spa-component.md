---
---

chore: AAA structure markers on SPA component tests (PR-5 of test-conventions-should-aaa)

Adds canonical Pascal-case `// Arrange` / `// Act` / `// Assert` line comments to every `it()` body across 167 SPA component test files (`packages/workout-spa-editor/src/components/**/*.test.{ts,tsx}` plus `pages/**/*.test.tsx`). 2,191 `it()` bodies marked.

Drains `scripts/check-test-aaa.mjs:AAA_ALLOWLIST_SPA_COMPONENT` from 167 → 0.

No public package version bumps. Test code only.
