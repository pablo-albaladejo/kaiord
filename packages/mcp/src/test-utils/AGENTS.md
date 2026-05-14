<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/test-utils/`

## Purpose

Pure module of numeric/structural constants used **only** by `*.test.ts`
files inside this package. Keeping these out of production source avoids
magic numbers in tests while preserving the zero-runtime-import rule for
test-only modules.

## Key Files

- `constants.ts` — `FORMAT_COUNT_FIVE = 5` (expected count from
  `FORMAT_REGISTRY`); `INVALID_NUMERIC_FORMAT = 123` (invalid sentinel for
  Zod-schema rejection tests); `FILE_BYTES_1234`, `FILE_BYTES_5678`
  (small fixed byte arrays for binary I/O fixtures). All `as const`.

## Subdirectories

(none)

## For AI Agents

### Working In This Directory

- **Zero imports.** This module must remain pure — no imports from any other
  source file, no `@kaiord/*` deps, no Node built-ins. Anything depending on
  another module belongs in `../tests/helpers/`.
- Constants are exported as `as const` literals so tests can pattern-match
  on the exact value at the type level.
- Names should describe the test role, not just the value
  (e.g. `FORMAT_COUNT_FIVE`, not `FIVE`).
- This directory is in the test-conventions out-of-scope list at the repo
  root, so the title/AAA invariants do not apply _here_ — but they still
  apply to the `*.test.ts` files that import from this module.

### Testing Requirements

- N/A — this module is consumed by tests; it does not host them.

### Common Patterns

- Plain `as const` literal exports. No factories, no functions.

## Dependencies

### Internal

(none)

### External

(none)

<!-- MANUAL: -->
