---
---

chore: rewrite all it() titles with should-prefix dogma (PR-2 of test-conventions-should-aaa)

Drains `scripts/check-test-title-should.mjs:ALLOWLIST` from 1,326 entries to empty. Uses `scripts/codemod-should-prefix.mjs` (drop-s rule + be-substitution + does-not-elision over a hand-curated 100+-row verb table) for ~80% mechanical coverage; the remaining ~270 titles got contextual rewrites (camelCase function-name titles, hyphenated `re-verb`, bare-verb event nouns).

Also fixes a regex bug shared across the test-conventions guards: a naive single-regex matched `it.each([..., "value"])("title")` such that `"value"` was captured as the title (false positive). Replaced with a shared `scripts/it-title-extractor.mjs` helper that does two regex passes (one for `it.each`, one for plain `it[.alias]`).

No public package version bumps. Test code only.
