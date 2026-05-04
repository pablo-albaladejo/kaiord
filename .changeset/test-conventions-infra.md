---
---

chore: install test-convention guards (PR-1 of test-conventions-should-aaa)

Repo-tooling change. Zero production code touched. Adds three migration-window scripts (`measure-it-titles-histogram`, `bootstrap-test-conventions-allowlists`, `check-aaa-migration-no-logic-edits`) and two steady-state guards (`check-test-title-should`, `check-test-aaa`) with seeded migration-state allowlists (1,305 title + 470 AAA entries). Both guards drained to empty by PR-6 of the same change.

ESLint config edit: removes `**/*.test.{ts,tsx}` and `**/*.spec.ts` from the global ignores block, extends the test-files override block to match `*.test.tsx`, registers `@vitest/eslint-plugin`, and wires `vitest/valid-title` at `'warn'` severity (D2 staged-activation; flipped to `'error'` in PR-6).

`scripts/check-allowlists-empty.mjs` extends `OUT_OF_SCOPE` to include the two new guards during the migration window per design D17. Reverted in PR-6.

No public package version bumps.
