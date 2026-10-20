> Completed: 2026-10-17

# Proposal: coverage floors only ratchet up

## Why

Every coverage floor in the repository is an unguarded literal. The per-package
`THRESHOLD` arms in `.github/workflows/ci.yml` (80 by default, 60 for the
bridge packages), the `thresholds` blocks in fourteen packages' vitest configs,
the `codecov.yml` status targets and the default of
`.github/scripts/check-coverage.js` can each be lowered by a one-line diff that
every gate accepts. No `scripts/check-*.mjs` reads them.

`AGENTS.md` says coverage thresholds are never relaxed, and the rest of the
repository enforces its rules mechanically (`check-no-inert-floors`,
`check-allowlists-empty`, `check-guard-suites-wired`). The floors were the
exception: the rule existed only as prose.

## What Changes

- New guard `scripts/check-coverage-floors-ratchet.mjs` (rule
  `R-CoverageFloorsRatchet`) with its own `node:test` suite. It extracts every
  floor from the working tree and from the merge base with `origin/main`
  (`git show <merge-base>:<path>`), and fails when a floor is lowered or
  removed. Raising or adding a floor passes. A codecov `threshold` is a
  tolerance, so for it raising is the relaxation and fails.
- The guard fails closed when the base ref cannot be resolved, and when a
  source yields no floor on either side (a broken extraction).
- Wired into `pnpm lint` (`lint:parallel` → `lint:coverage-floors`); its suite
  runs under `pnpm test:scripts`. The CI `lint` job already checks out with
  `fetch-depth: 0`, so `origin/main` is present; no workflow change is needed
  beyond a pointer comment at the threshold step.

## Impact

- Affected specs: `spa-quality-gates` (ADDED requirement).
- Affected code: `scripts/`, root `package.json`, `CLAUDE.md`,
  `scripts/README.md`, a comment in `.github/workflows/ci.yml`. No package
  source, no public API, no changeset.
- Known gaps: the guard reads literals. It does not see a coverage step being
  disabled (`if: false`, `continue-on-error`), nor vitest threshold shapes the
  repository does not use (`perFile`, glob keys).
