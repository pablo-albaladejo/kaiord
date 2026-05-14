<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/resources/`

## Purpose

MCP **resources** — URI-addressed, read-only content that clients can list and
fetch. Each file exports a `register<Name>Resource(server)` function that
calls `server.resource(name, uri, metadata, handler)` and returns a single
`contents` entry with a stable `mimeType`.

## Key Files

- `krd-schema.ts` — registers resource `krd-schema` at URI
  `kaiord://schema/krd`, MIME `application/schema+json`. Reads the KRD JSON
  Schema from `packages/core/schema/krd.json` or
  `node_modules/@kaiord/core/schema/krd.json`; on miss returns a JSON error
  pointing to `https://github.com/pablo-albaladejo/kaiord`.
- `supported-formats.ts` — registers resource `supported-formats` at URI
  `kaiord://formats`, MIME `application/json`. Body is `JSON.stringify` of
  every entry in `FORMAT_REGISTRY` (`format`, `name`, `extension`,
  `description`, `binary`).
- `krd-format-spec.ts` — registers resource `krd-format-spec` at URI
  `kaiord://docs/krd-format`, MIME `text/markdown`. Loads
  `docs/krd-format.md` via `findSpecFile()` (multi-path lookup) and falls back
  to a "see docs URL" note when the file is not bundled.

## Subdirectories

(none)

## For AI Agents

### Working In This Directory

- Resource URIs are part of the **public API** — clients may bookmark them.
  Do not rename `kaiord://schema/krd`, `kaiord://formats`, or
  `kaiord://docs/krd-format` without a major-version bump.
- When you add a new resource, wire it inside `../server/create-server.ts`
  alongside the existing `registerKrdSchemaResource` /
  `registerSupportedFormatsResource` / `registerKrdFormatSpecResource` calls.
- File lookups happen **at registration time** (eager read) so resource
  fetches are cheap; this is acceptable because the server is long-lived and
  the source files do not change at runtime.
- Set an accurate `mimeType` in the metadata block; clients use it to render.

### Testing Requirements

- No co-located unit tests today; resource access is covered by the in-memory
  client harness in `../tests/helpers/`.

### Common Patterns

- Multi-path file lookup (cwd → adapter `node_modules` → bundler-relative
  `__dirname`) so the published binary works whether installed globally,
  invoked via `npx`, or run from the monorepo.

## Dependencies

### Internal

- `../utils/format-registry` — `FORMAT_REGISTRY` (for `kaiord://formats`).
- `../utils/find-spec-file` — `findSpecFile()` (for `kaiord://docs/krd-format`).

### External

- `@modelcontextprotocol/sdk/server/mcp.js` — `McpServer`.
- Node built-ins: `fs`, `path`.

<!-- MANUAL: -->
