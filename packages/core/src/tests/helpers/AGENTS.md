<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# helpers

## Purpose

Shared test helpers used across the core test suite and re-exported via `@kaiord/core/test-utils` for downstream packages.

## Key Files

| File            | Description                                                                                                                                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test-utils.ts` | `createMockLogger()` — `Logger` impl that is silent unless `process.env.DEBUG_LOGS` is set, in which case each level forwards to `console.log` (or `console.error` for `.error`) with a `[LEVEL]` prefix. Lets tests pass a logger without flooding output. |

## For AI Agents

### Working In This Directory

- `createMockLogger()` deliberately reads `process.env.DEBUG_LOGS` at call time of each log method (NOT at factory time). That means `DEBUG_LOGS=1 pnpm test` enables logs for the whole run without recreating mocks. Don't move the check to factory creation.
- The mock methods accept `...args: unknown[]` to match casual call sites (the real `Logger` port is `(message, context?)`); both shapes work because tests don't typecheck the `Logger` arg variadically.

### Testing Requirements

- Coverage target: 80%. The mock itself is exercised indirectly by every test that passes `createMockLogger()` into a use case. AAA + `should ` invariants apply.

## Dependencies

### Internal

- `../../ports/logger` — the `Logger` port the mock returns.

### External

- Reads `process.env.DEBUG_LOGS` (Node global).

<!-- MANUAL: -->
