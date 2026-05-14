<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/tests/`

## Purpose

Cross-cutting test infrastructure shared by every `*.test.ts` file in the
package. Owns the in-memory MCP client/server harness and fixture helpers so
tools can be exercised end-to-end without spawning a real stdio process.

## Subdirectories

- `helpers/` — see `helpers/AGENTS.md`.

## For AI Agents

### Working In This Directory

- Unit tests for individual files live alongside their source as
  `foo.test.ts`. This directory only contains **shared** helpers; do not
  drop one-off tests here.

### Testing Requirements

- Same repo-wide invariants: `it()` titles start with `"should "`; bodies
  use Pascal `// Arrange` / `// Act` / `// Assert` markers.

## Dependencies

### Internal

- `../server/create-server` — used by `helpers/mcp-test-client.ts`.
- `@kaiord/core/test-utils` — fixture loaders re-exported by
  `helpers/test-fixtures.ts`.

### External

- `@modelcontextprotocol/sdk` — `Client` + `InMemoryTransport`.

<!-- MANUAL: -->
