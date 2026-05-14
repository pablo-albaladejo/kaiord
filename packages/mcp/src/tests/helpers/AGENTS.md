<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/tests/helpers/`

## Purpose

Shared test fixtures and the in-memory MCP client harness used across the
package's integration tests. Lets a test file connect a real `Client` to a
real `McpServer` over an in-process transport so tool calls exercise the
entire registration → handler → response path without subprocess overhead.

## Key Files

- `mcp-test-client.ts` — `createTestClient(): Promise<Client>` builds a
  `McpServer` via `createServer()`, pairs it with the local end of an
  `InMemoryTransport.createLinkedPair()`, connects an MCP `Client` to the
  remote end, and returns the connected client. Also exports the
  `McpToolResult` type that mirrors the MCP tool-response shape (an array of
  `{ type, text }` plus optional `isError`).
- `test-fixtures.ts` — re-exports `buildKRD`, `FIXTURE_NAMES`,
  `getFixturePath`, `loadFitFixture`, `loadKrdFixture`, `loadKrdFixtureRaw`,
  `loadTcxFixture`, `loadZwoFixture` from `@kaiord/core/test-utils`, plus a
  local `createMinimalKrd(overrides?)` factory returning a `KRD` with
  `version: "1.0"`, `type: "structured_workout"`, `sport: "cycling"`, and
  `created: "2025-01-15T10:00:00Z"`.

## Subdirectories

(none)

## For AI Agents

### Working In This Directory

- Tests should call `createTestClient()` in `// Arrange` and `await
client.callTool({ name, arguments })` in `// Act`. Always close the client
  in a teardown if your test holds it long enough to matter.
- Prefer `createMinimalKrd({ ... })` over hand-rolling a KRD literal — the
  defaults match the canonical KRD shape and stay valid against `validateKrd`.
- Real-file fixtures (FIT bytes, TCX/ZWO/KRD text) live in
  `@kaiord/core/test-utils`; load them through the re-exported helpers
  here rather than reading from disk directly.

### Testing Requirements

- This module hosts no tests of its own; it is consumed by tests elsewhere
  in the package.
- Files that import these helpers still follow the `"should "` title and
  Arrange/Act/Assert body conventions.

### Common Patterns

- In-memory transport rather than stdio: avoids subprocess flakiness and
  keeps the assertion path synchronous from the test runner's perspective.

## Dependencies

### Internal

- `../../server/create-server` — `createServer`.
- `@kaiord/core` — `KRD` type.
- `@kaiord/core/test-utils` — fixture loaders.

### External

- `@modelcontextprotocol/sdk/client/index.js` — `Client`.
- `@modelcontextprotocol/sdk/inMemory.js` — `InMemoryTransport`.

<!-- MANUAL: -->
