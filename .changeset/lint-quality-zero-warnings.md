---
---

chore(test): extract magic-number warnings to test-utils — zero ESLint warnings across all packages

Multi-iteration test-quality refactor that reduces total ESLint warnings across the kaiord monorepo from 1476 to 0 (−100%) via the oh-my-claudecode self-improve loop. All edits are in test files or `test-utils/` modules — no production code, schemas, public API, or dependency changes. Round-trip tolerance values (1s/1W/1bpm/1rpm) preserved numerically. AAA structure and `should ` title prefix preserved verbatim across every test. All 9 packages now lint-clean.
