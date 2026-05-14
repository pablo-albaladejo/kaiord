<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/bin/`

## Purpose

Executable entrypoint for the `kaiord-mcp` binary published by
`@kaiord/mcp`. Wires the composed `McpServer` returned by `createServer()` to
a `StdioServerTransport` so AI clients (Claude Desktop, Claude Code, etc.) can
launch the server as a stdio child process.

## Key Files

- `kaiord-mcp.ts` — `main()` instantiates `createServer()`, connects it to a
  new `StdioServerTransport`, logs `"Kaiord MCP server started"` to stderr,
  and installs a fatal-error handler that prints `"Fatal error: <e>"` and
  `process.exit(1)`. This file is the binary registered in `package.json`'s
  `bin.kaiord-mcp` field (compiles to `./dist/bin/kaiord-mcp.js`).
- `kaiord-mcp.build.test.ts` — smoke test asserting the built binary launches
  and reports the start banner.

## Subdirectories

(none)

## For AI Agents

### Working In This Directory

- Keep this file thin. All composition belongs in `../server/create-server.ts`;
  this entrypoint is purely transport plumbing.
- The startup banner is written to **stderr** intentionally. Do not log to
  stdout from anywhere in this process — stdio MCP uses stdout for protocol
  frames.
- A non-zero exit code on `main().catch` is required so launchers (Claude
  Desktop) can detect crashes.

### Testing Requirements

- `kaiord-mcp.build.test.ts` exercises the post-build artifact and therefore
  depends on `pnpm build` having run for the package.
- `it()` titles start with `"should "`; bodies use Pascal `// Arrange` /
  `// Act` / `// Assert`.

### Common Patterns

- ESM module with top-level `await` avoided; instead, an async `main()`
  function is called and any rejection is caught explicitly.

## Dependencies

### Internal

- `../server/create-server` — `createServer()`.

### External

- `@modelcontextprotocol/sdk/server/stdio.js` — `StdioServerTransport`.

<!-- MANUAL: -->
