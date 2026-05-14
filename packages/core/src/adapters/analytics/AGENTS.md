<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# analytics

## Purpose

`createNoopAnalytics()` — the default `Analytics` implementation. Both methods (`pageView`, `event`) are empty functions. Used as a safe zero-cost default so application code can call `analytics.event(...)` unconditionally without checking whether real analytics is wired.

## Key Files

| File                     | Description                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `noop-analytics.ts`      | Defines `createNoopAnalytics(): Analytics` — returns `{ pageView: () => {}, event: () => {} }`.                      |
| `noop-analytics.test.ts` | Asserts the factory returns the expected shape and that calling the methods is a no-op (no throws, no side effects). |

## For AI Agents

### Working In This Directory

- The adapter MUST satisfy the `Analytics` port shape in `../../ports/analytics.ts`. Do not add metric helpers here — those belong in a real analytics adapter (e.g. Plausible) which would live in its own workspace package.
- Empty functions, not `undefined` properties. Callers rely on `analytics.event(...)` being safely callable.

### Testing Requirements

- Coverage target: 80%. The test is essentially a shape lock. AAA + `should ` invariants apply.

## Dependencies

### Internal

- `../../ports/analytics` — the `Analytics` port the factory returns.

### External

None.

<!-- MANUAL: -->
