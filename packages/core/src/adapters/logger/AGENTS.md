<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# logger

## Purpose

`createConsoleLogger()` — the default `Logger` implementation shipped with `@kaiord/core`. Forwards each level to its matching `console.*` method, passing through the optional `context` record as the second argument. Exported from the root barrel for convenience so casual consumers don't need to bring their own logger.

## Key Files

| File                     | Description                                                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `console-logger.ts`      | Defines `createConsoleLogger(): Logger` — returns an object literal with four methods that delegate to `console.debug/info/warn/error`. |
| `console-logger.test.ts` | Vitest suite asserting that each method calls the corresponding `console.*` with the same arguments.                                    |

## For AI Agents

### Working In This Directory

- The adapter MUST satisfy the `Logger` port shape defined in `../../ports/logger.ts`. Do not extend the public surface (no `trace`, no `fatal`) without first adding to `LogLevel`.
- Keep the implementation tiny and dependency-free — the whole point of this adapter is to have zero external deps.
- The factory pattern (`createConsoleLogger()`) is mandatory; do NOT export a pre-built singleton, because consumers may need to mock or wrap `console`.

### Testing Requirements

- Coverage target: 80%. The test stubs `console.debug/info/warn/error` and asserts the message + context tuple is forwarded verbatim. AAA + `should ` invariants apply.

## Dependencies

### Internal

- `../../ports/logger` — the `Logger` port the factory returns.

### External

None (uses the global `console` object only).

<!-- MANUAL: -->
