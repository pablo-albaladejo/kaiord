<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/server/`

## Purpose

Composition root for the MCP server. `createServer()` builds an `McpServer`
with the package name and version, registers every tool / resource / prompt
in a deterministic order, and returns it. Transport binding (stdio,
in-memory, etc.) happens in callers (`bin/`, `tests/helpers/`).

## Key Files

- `create-server.ts` — `createServer(): McpServer`. Reads
  `package.json` for `version`, constructs `new McpServer({ name:
"kaiord-mcp", version }, { instructions })` with the SERVER_INSTRUCTIONS
  block telling LLMs to call `kaiord_get_format_spec` before editing KRD,
  then registers (in order):
  - Tools: `get_format_spec`, `list_formats`, `convert`, `validate`,
    `round_trip_validate`, `inspect`, `extract_workout`, `diff`,
    `garmin_login`, `garmin_logout`, `garmin_list`, `garmin_push`.
  - Resources: `krd-schema`, `supported-formats`, `krd-format-spec`.
  - Prompts: `convert_file`, `analyze_workout`.

## Subdirectories

(none)

## For AI Agents

### Working In This Directory

- This file is the **only** wiring location. Any new tool/resource/prompt
  must be imported and registered here for the in-memory test client and the
  stdio binary to see it.
- The server's `instructions` string is surfaced to LLMs on connect — keep
  it short and action-oriented. The current text emphasises:
  - KRD is canonical and all conversions go through it.
  - `kaiord_get_format_spec` MUST be called before creating/editing KRD.
  - Use `kaiord_list_formats` to discover formats.
  - Use Garmin tools in `login → list/push → logout` order.
- The shared `Logger` (`createStderrLogger()`) is instantiated once and
  passed into every tool that needs it.
- `package.json` is read via `fileURLToPath(import.meta.url)` so the path
  resolves correctly both in dev (`src/server/create-server.ts`) and the
  bundled output (`dist/`).

### Testing Requirements

- `tests/helpers/mcp-test-client.ts` uses `createServer()` directly to spin
  up an `InMemoryTransport` client/server pair; that test client is the main
  integration surface for the server composition.
- `it()` titles start with `"should "`; bodies use Pascal `// Arrange` /
  `// Act` / `// Assert`.

### Common Patterns

- Factory function (`createServer`) returning a fully wired `McpServer`.
- Deterministic registration order makes the listing-API output stable across
  versions, which simplifies snapshot tests in clients.

## Dependencies

### Internal

- `../adapters/stderr-logger` — `createStderrLogger`.
- `../prompts/*` — prompt registrations.
- `../resources/*` — resource registrations.
- `../tools/*` — tool registrations.

### External

- `@modelcontextprotocol/sdk/server/mcp.js` — `McpServer`.
- Node built-ins: `fs`, `path`, `url`.

<!-- MANUAL: -->
