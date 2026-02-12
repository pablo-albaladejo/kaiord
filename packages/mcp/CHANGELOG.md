# @kaiord/mcp

## 4.3.3

### Patch Changes

- 4e11d43: test(mcp): add build artifact test to detect shebang and ESM issues

## 4.3.2

### Patch Changes

- 3d404a1: fix(mcp): remove duplicate shebang that caused SyntaxError on npx

## 4.3.1

### Patch Changes

- af548fa: fix(mcp): republish with resolved workspace dependencies

## 4.3.0

### Minor Changes

- 3cea716: feat(mcp): add MCP server package exposing Kaiord tools to AI agents
  - New `@kaiord/mcp` package with 6 tools, 3 resources, and 2 prompts for Claude Desktop/Code integration
  - Upgrade Zod from v3 to v4 across all packages (`z.uuid()`, `z.iso.datetime()`, native `z.toJSONSchema()`)
  - Remove `zod-to-json-schema` dependency in favor of native Zod v4 JSON schema generation

### Patch Changes

- Updated dependencies [3cea716]
  - @kaiord/core@4.3.0
  - @kaiord/fit@4.3.0
  - @kaiord/tcx@4.3.0
  - @kaiord/zwo@4.3.0
  - @kaiord/garmin@4.3.0
