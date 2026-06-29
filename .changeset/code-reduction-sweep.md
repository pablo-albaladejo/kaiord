---
"@kaiord/core": patch
"@kaiord/fit": patch
"@kaiord/tcx": patch
"@kaiord/zwo": patch
"@kaiord/garmin": patch
"@kaiord/garmin-connect": patch
"@kaiord/cli": patch
"@kaiord/mcp": patch
"@kaiord/ai": patch
---

Internal code-reduction sweep: remove dead files, unused re-exports and types,
consolidate genuine duplication, and drop redundant constructs across packages.

No public API or runtime behavior change — every removed symbol was unused
(grep-confirmed across the monorepo) and none belonged to a package's published
`src/index.ts` surface. The `@kaiord/zwo` `zod` dependency is dropped (its only
users were the deleted schemas). All test suites stay green and coverage is at
or above baseline in every package.
