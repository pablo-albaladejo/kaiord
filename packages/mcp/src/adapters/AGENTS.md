<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/adapters/`

## Purpose

Infrastructure adapters that bind `@kaiord/core` ports to concrete runtime
implementations for this MCP process. Today this is limited to a stderr
`Logger` because stdio MCP reserves stdout for protocol frames — any other
output stream would corrupt the wire format.

## Key Files

- `stderr-logger.ts` — `createStderrLogger(): Logger`. Implements the four
  `Logger` levels (`debug`/`info`/`warn`/`error`) by writing
  `[LEVEL] <message>` followed by the optional context object to
  `console.error` (stderr).
- `stderr-logger.test.ts` — verifies each level prefixes correctly and that
  `context ?? ""` is appended when absent.

## Subdirectories

(none)

## For AI Agents

### Working In This Directory

- **Do not** log to `console.log` from anywhere reachable by the running MCP
  server — it goes to stdout and breaks the protocol. Always route through
  this logger or another stderr writer.
- The logger is the only adapter for the `Logger` port from `@kaiord/core`
  in this package. If a future adapter (e.g., a file logger) is added it
  belongs here.

### Testing Requirements

- Vitest mocks `console.error` and asserts the level prefix, message, and
  context arguments.
- `it()` titles start with `"should "`; bodies use Pascal `// Arrange` /
  `// Act` / `// Assert`.

### Common Patterns

- Factory function returning a plain object — no classes.

## Dependencies

### Internal

- `@kaiord/core` — `Logger` port type.

### External

(none)

<!-- MANUAL: -->
