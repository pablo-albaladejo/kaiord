<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/__regressions__/`

## Purpose

Regression tests that pin specific previously-fixed bugs. One file per issue, named after the issue id. Distinct from feature-level tests: these exist solely to prevent the original bug from coming back.

## Key Files

- `issue-385.test.tsx` — pins the fix for GitHub issue #385.
- `library-badge.test.tsx` — pins the Library-badge rendering invariant.

## For AI Agents

### Working In This Directory

1. **Name after the issue.** `issue-<id>.test.tsx` makes it grep-able from a bug report.
2. **Don't refactor into shared helpers.** Regression tests are intentionally self-contained so they remain meaningful even when surrounding code changes.

## Dependencies

### Internal

- `../components/*`, `../store/*`, `../hooks/*`.

<!-- MANUAL: -->
