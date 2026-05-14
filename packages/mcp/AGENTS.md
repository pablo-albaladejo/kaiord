<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# @kaiord/mcp

## Purpose

Model Context Protocol (MCP) server that exposes Kaiord fitness data conversion
capabilities to AI clients (Claude Desktop, Claude Code, Cursor, etc.).
Wraps `@kaiord/core` plus the FIT/TCX/ZWO/GCN adapters behind the official
`@modelcontextprotocol/sdk`, surfacing format conversion, KRD schema validation,
inspection, diff, structured-workout extraction, round-trip tolerance checking,
and a Garmin Connect bridge as MCP tools, resources, and prompts.

In hexagonal terms this package is an **adapter** for MCP transport: it depends
on `@kaiord/core` plus format-adapter packages, and ships an executable
(`kaiord-mcp`) that speaks stdio MCP.

## Key Files

- `package.json` — npm metadata. Exposes `kaiord-mcp` bin, `main`/`types` from
  `./dist`, ESM only (`type: "module"`). Depends on `@kaiord/core`,
  `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`,
  `@kaiord/garmin-connect`, `@modelcontextprotocol/sdk ^1.29.0`, `zod ^4.4.3`.
  Node `>=22.12.0`.
- `README.md` — public catalog of tools, resources, prompts, and supported
  formats; primary user-facing doc.
- `src/index.ts` — public API barrel. Re-exports `createServer`,
  `createStderrLogger`, `formatSchema`/`FileFormat`, `formatError`/`formatSuccess`/
  `ToolResult`, `detectFormatFromPath`, `FORMAT_REGISTRY`.
- `tsup.config.ts` — bundler config (dual build for library + bin).
- `vitest.config.ts` — test runner config.
- `tsconfig.json` — TypeScript project config.

## Subdirectories

- `src/` — all source. See `src/AGENTS.md`.
- `dist/` — bundler output. Generated; do not edit.
- `coverage/` — vitest coverage. Generated; do not edit.
- `node_modules/` — pnpm dependencies. Do not edit.

## For AI Agents

### Working In This Directory

- The package is the **MCP transport adapter** for Kaiord. It must not contain
  domain logic — conversion, validation, and extraction live in `@kaiord/core`
  and the format-adapter packages.
- Adding a new MCP tool: create `src/tools/<tool-name>.ts` exporting a
  `register<Name>Tool(server, logger)` function, then wire it inside
  `src/server/create-server.ts`. Use `formatSchema` from `src/types/tool-schemas.ts`
  for any format argument; return values via `formatSuccess`/`formatError`.
- Adding a new format: extend `FORMAT_REGISTRY` in `src/utils/format-registry.ts`
  (each entry must lazy-import its reader/writer factories so unused adapters
  stay out of the bundle); update `formatSchema` enum in
  `src/types/tool-schemas.ts`; add `BINARY_FORMATS` entry if applicable.
- Logging must always go to stderr (stdio MCP uses stdout for protocol frames).
  Use `createStderrLogger()`; never `console.log`.
- The bin entrypoint is `src/bin/kaiord-mcp.ts`; the published binary is
  `./dist/bin/kaiord-mcp.js`.

### Testing Requirements

- Test framework: vitest. `pnpm test` runs `vitest --run`; `pnpm test:coverage`
  for coverage.
- Every `it()` title starts with the literal `"should "` and the body has
  Pascal-case `// Arrange` / `// Act` / `// Assert` comment markers (mechanically
  enforced repo-wide).
- Tool integration tests use the helpers under `src/tests/helpers/` to spin up
  an in-memory MCP client/server pair and call tools end-to-end.
- Unit tests live next to their source as `*.test.ts` (e.g.
  `src/tools/kaiord-convert.test.ts`, `src/utils/file-io.test.ts`).
- Coverage target for frontend/adapter packages is 70%.

### Common Patterns

- **Tool registration**: `(server, logger?) => server.tool(name, description,
zodShape, async (args) => formatSuccess(...) | formatError(error))`. The
  Zod shape object — not a `z.object()` — is what the SDK expects.
- **Input resolution**: tools that accept either a file path or inline content
  use `validateExclusiveInput` + `resolveTextInput` (for text formats) or
  `convertToKrd` (which branches on `BINARY_FORMATS` and decodes base64 for
  binary inline content).
- **KRD canonical pivot**: every conversion tool goes `<source> → KRD → <target>`
  through `convertToKrd` / `convertFromKrd`. Never read a non-KRD format and
  write another non-KRD format directly.
- **File path security**: all filesystem reads/writes funnel through
  `validatePathSecurity` (rejects shell metacharacters and `..` traversal).
- **Garmin Connect session**: kept in a module-level singleton via
  `getGarminClient`/`resetGarminClient` because the stdio MCP server is a
  long-lived process; auth state must persist between tool calls.

## Dependencies

### Internal

- `@kaiord/core` — domain types (`KRD`, `Logger`, `ToleranceViolation`), use
  cases (`fromBinary`/`fromText`/`toBinary`/`toText`, `validateKrd`,
  `extractWorkout`, `validateRoundTrip`, `createToleranceChecker`).
- `@kaiord/fit` — `createFitReader`/`createFitWriter` (binary FIT).
- `@kaiord/tcx` — `createTcxReader`/`createTcxWriter` (TCX XML).
- `@kaiord/zwo` — `createZwiftReader`/`createZwiftWriter` (Zwift workout XML).
- `@kaiord/garmin` — `createGarminReader`/`createGarminWriter` (GCN JSON).
- `@kaiord/garmin-connect` — `createGarminConnectClient` + `createMemoryTokenStore`
  for the Garmin Connect SSO API.

### External

- `@modelcontextprotocol/sdk ^1.29.0` — `McpServer`, `StdioServerTransport`,
  `InMemoryTransport` (for tests).
- `zod ^4.4.3` — schema validation of tool input shapes.
- Node built-ins: `fs`, `fs/promises`, `path`, `url`.

<!-- MANUAL: Add any package-specific notes here that should survive regeneration. -->
