<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/`

## Purpose

All TypeScript source for `@kaiord/mcp`. The MCP server is composed here:
tools, resources, and prompts are individually registered in `server/` and
exported as a single `createServer()` function. `bin/` then connects that
server to a stdio transport for the published `kaiord-mcp` binary.

## Key Files

- `index.ts` — public-API barrel. Re-exports `createServer`,
  `createStderrLogger`, `formatSchema`, `FileFormat`, `ToolResult`,
  `formatError`, `formatSuccess`, `detectFormatFromPath`, `FORMAT_REGISTRY`.

## Subdirectories

- `adapters/` — infrastructure adapters (currently only the stderr `Logger`).
- `bin/` — executable entrypoint (`kaiord-mcp`).
- `prompts/` — MCP prompt registrations (guided workflows).
- `resources/` — MCP resource registrations (URI-addressed read-only content).
- `server/` — `createServer()` composition root.
- `test-utils/` — numeric/test constants used only by `*.test.ts` files.
- `tests/` — cross-cutting test helpers (in-memory MCP client, fixtures).
- `tools/` — MCP tool registrations + their internal helpers.
- `types/` — shared Zod schemas and type aliases (`FileFormat`, `formatSchema`).
- `utils/` — pure helpers: base64, file I/O, format registry, error
  formatter, Garmin client state, etc.

## For AI Agents

### Working In This Directory

- Files must be **≤100 lines** (tests exempt); functions **<40 LOC**. Several
  larger tool helpers (`convert-to-krd.ts`, `diff-compare.ts`) already split
  binary vs text and metadata vs steps to stay under the limits.
- Use `type` aliases, not `interface`. Use `import type { ... }` for
  type-only imports.
- File names are `kebab-case.ts`. Tests are co-located: `foo.ts` →
  `foo.test.ts`.
- All MCP composition happens in `server/create-server.ts`. When adding a
  tool/resource/prompt elsewhere, wire it there.

### Testing Requirements

- `pnpm test` (vitest). Co-located `*.test.ts` next to each source file.
- `it()` titles start with `"should "`; bodies use Pascal-case
  `// Arrange` / `// Act` / `// Assert` markers.
- End-to-end MCP behavior is exercised via `tests/helpers/mcp-test-client.ts`,
  which spins up an in-memory client/server pair.

### Common Patterns

- **Barrel exports** stay minimal — only the public surface (`index.ts`).
- **Lazy imports** for format adapters (`@kaiord/fit`, `@kaiord/tcx`,
  `@kaiord/zwo`, `@kaiord/garmin`) inside `utils/format-registry.ts` keep the
  bundle small.
- **Logger plumbing**: every tool registration takes `(server, logger)` so the
  same `createStderrLogger()` instance is shared across the process.

## Dependencies

### Internal

- `@kaiord/core` — domain + use cases.
- `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`,
  `@kaiord/garmin-connect` — format adapters (lazy-loaded).

### External

- `@modelcontextprotocol/sdk` — `McpServer`, transports.
- `zod` — schema validation.

<!-- MANUAL: Add any subtree-specific notes here that should survive regeneration. -->
