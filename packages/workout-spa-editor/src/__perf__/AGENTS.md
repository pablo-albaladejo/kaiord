<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/__perf__/`

## Purpose

Performance baselines + benchmark tests. The `__perf__` prefix matches the `__regressions__` convention — files in this directory are runtime perf measurements, not unit tests.

## Key Files

- `profile-state-baseline.json` — captured timing baseline for the profile-state render pass.
- `profile-state-baseline.measure.test.tsx` — Vitest test that re-measures the profile-state render and asserts it stays within tolerance of the baseline.

## For AI Agents

### Working In This Directory

1. **Baselines are committed JSON.** Updating a baseline is an explicit edit — never re-record automatically.
2. **The measure test is allowed to run slow** by design; if it becomes flaky, widen the tolerance, don't disable.

### Testing Requirements

- The `.measure.test.tsx` suffix opts the test into the perf-test surface; CI runs it separately.

## Dependencies

### Internal

- `../components/*`, `../store/*`.

<!-- MANUAL: -->
