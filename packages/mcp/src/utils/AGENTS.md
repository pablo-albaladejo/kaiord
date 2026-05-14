<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/utils/`

## Purpose

Pure helpers shared by tool registrations and the conversion pipeline.
Everything here is framework-free: no MCP server objects, no transports,
just data transformation, filesystem access, and the long-lived Garmin
client singleton.

## Key Files

- `base64.ts` — `decodeBase64(input): Uint8Array`. Strips whitespace,
  validates against `^[A-Za-z0-9+/]*={0,2}$`, decodes via `Buffer.from`, and
  throws on invalid alphabet or empty-decode-from-nonempty-input. Used by
  `convert-to-krd.ts` for inline binary input.
- `detect-format-from-path.ts` — `detectFormatFromPath(filePath):
FileFormat | null`. Lowercases the path extension and looks it up in
  `FORMAT_REGISTRY`.
- `error-formatter.ts` — `ToolResult` type plus `formatSuccess(text)` and
  `formatError(error)`. Both return the `{content: [{type: "text", text}]}`
  shape MCP expects; error variant sets `isError: true` and prefixes
  `"Error: "`.
- `file-io.ts` — `validatePathSecurity(path)` (rejects shell metacharacters
  `\0|;&\`$(){}!\n\r`and`..`path traversal),`readFileAsBuffer`,
`readFileAsText`, `writeOutputFile`(mkdir-recursive parent). Wraps Node
fs errors into`"File not found"`/`"Permission denied"`/`"Failed to read file"` messages.
- `find-spec-file.ts` — `findSpecFile(): string`. Searches for
  `docs/krd-format.md` in cwd, `packages/mcp/docs/krd-format.md`, and two
  `__dirname`-relative paths; falls back to a URL to
  `pablo-albaladejo/kaiord` on miss. Used by both
  `tools/kaiord-get-format-spec.ts` and
  `resources/krd-format-spec.ts`.
- `format-registry.ts` — `FormatDescriptor` type plus
  `FORMAT_REGISTRY: Record<FileFormat, FormatDescriptor>` mapping each
  format to `{name, extension, description, binary, createReader,
createWriter}`. Reader/writer factories are **lazy dynamic imports** of
  `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`. The KRD
  reader/writer just JSON-parse/stringify and run `validateKrd`. Also
  re-exports `detectFormatFromPath`.
- `garmin-client-state.ts` — module-level singleton `getGarminClient(logger)`
  returning the same `createGarminConnectClient({logger, tokenStore:
createMemoryTokenStore()})` instance across calls;
  `resetGarminClient()` nulls it (used by `kaiord_garmin_logout`).
- `resolve-input.ts` — `validateExclusiveInput(file?, content?)` throws if
  both/neither provided; `resolveTextInput(file?, content?): Promise<string>`
  returns the file content or the inline string after exclusivity check.

## Subdirectories

(none)

## For AI Agents

### Working In This Directory

- Everything here must stay **pure** — no `McpServer`, no transports, no
  global side effects beyond the explicit Garmin singleton.
- `validatePathSecurity` is the **only** allowed entrypoint for filesystem
  operations from this package. Bypassing it (raw `fs.readFile`) would
  break the path-traversal/metacharacter guard.
- The Garmin client singleton lives at module scope because the MCP server
  is a long-running stdio process — auth must survive across tool calls
  inside the same session.
- `FORMAT_REGISTRY` lazy-imports adapter packages so end-users only pay for
  the formats they actually use.
- `error-formatter`, `format-registry`, and `detect-format-from-path` are
  re-exported by `src/index.ts`; treat their public shape as stable.

### Testing Requirements

- Each helper has a co-located `*.test.ts` (`base64.test.ts`,
  `error-formatter.test.ts`, `file-io.test.ts`, `format-registry.test.ts`,
  `garmin-client-state.test.ts`, `resolve-input.test.ts`).
- `it()` titles start with `"should "`; bodies use Pascal `// Arrange` /
  `// Act` / `// Assert`.
- Coverage target: 70% (frontend/adapter packages).

### Common Patterns

- Factory functions, not classes. Pure functions where possible.
- Errors are plain `new Error("...")` so the MCP `formatError` wrapper
  produces a clear `"Error: <message>"` payload.

## Dependencies

### Internal

- `@kaiord/core` — `Logger`, `validateKrd`, reader/writer port types.
- `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin` — lazy
  dynamic imports inside `FORMAT_REGISTRY` only.
- `@kaiord/garmin-connect` — `createGarminConnectClient`,
  `createMemoryTokenStore`.
- `../types/tool-schemas` — `FileFormat`.

### External

- Node built-ins: `fs`, `fs/promises`, `path`, `url`, `Buffer`.

<!-- MANUAL: -->
