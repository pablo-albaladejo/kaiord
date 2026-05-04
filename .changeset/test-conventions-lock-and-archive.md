---
---

chore: lock test-conventions invariants and archive change (PR-6 of test-conventions-should-aaa)

Final PR. Drains the last 1 SPA non-component allowlist entry (false positive from `it (` in title literal — fixed by introducing `countItCalls(source)` in `scripts/it-title-extractor.mjs` which strips string-literal AND comment contents before counting via separate `IT_CALL_DETECT_PLAIN_RE` and `IT_CALL_DETECT_EACH_RE` detectors; the legacy `IT_CALL_RE` export is kept as a permissive grep helper for backwards compat but no longer drives counting). Flips `vitest/valid-title` from `'warn'` to `'error'`. Reverts `OUT_OF_SCOPE` extension in `scripts/check-allowlists-empty.mjs`. Fixes 92 nested-quote title violations the codemod's regex missed.

Adds the `Test conventions` subsection to `AGENTS.md` and `CLAUDE.md` documenting the title rule, AAA rule, IDE/pre-commit/CI enforcement layers, and out-of-scope paths.

Promotes `openspec/specs/test-conventions/spec.md` from change-folder delta to canonical-shape capability spec (`> Synced:` marker, `# Title`, `## Purpose`, `## Requirements`).

Archives `openspec/changes/test-conventions-should-aaa/` to `openspec/changes/archive/2026-05-04-test-conventions-should-aaa/` with `> Completed: 2026-05-04` marker. Refreshed `archive/README.md`.

Deletes migration-window-only scripts: `check-aaa-migration-no-logic-edits.{mjs,test.mjs}`, `bootstrap-test-conventions-allowlists.{mjs,test.mjs}`, `codemod-should-prefix.{mjs,test.mjs}`. Steady-state guards (`check-test-title-should`, `check-test-aaa`, `it-title-extractor`, `measure-it-titles-histogram`) survive.

Final state: all four allowlists are `new Set()` (empty); test-conventions enforced at IDE (ESLint error), pre-commit (mechanical guards), and CI (full-tree).

No public package version bumps. Test code only.
