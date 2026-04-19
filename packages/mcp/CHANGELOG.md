# @kaiord/mcp

## 7.0.0

### Major Changes

- 99271a8: Drop Node.js 20 support. Minimum required runtime is now Node.js 22.12.0.

  Node.js 20 reaches end-of-life on 30 April 2026. Upstream dependencies (cspell v10, jsdom 29.0.2, @eslint/js v10) have already dropped support. Bump your Node.js toolchain to 22.x (Maintenance LTS) or 24.x (Active LTS).

### Patch Changes

- Updated dependencies [99271a8]
  - @kaiord/core@7.0.0
  - @kaiord/fit@7.0.0
  - @kaiord/tcx@7.0.0
  - @kaiord/zwo@7.0.0
  - @kaiord/garmin@7.0.0
  - @kaiord/garmin-connect@7.0.0

## 6.0.0

### Patch Changes

- Updated dependencies [89896ab]
  - @kaiord/garmin-connect@6.0.0

## 5.0.0

### Patch Changes

- Updated dependencies [22f13a0]
  - @kaiord/garmin@5.0.0
  - @kaiord/garmin-connect@5.0.0

## 4.8.1

### Patch Changes

- 2bb0ffd: Internal: lint fixes, vitest config, and type import cleanup across adapter packages
- Updated dependencies [2bb0ffd]
  - @kaiord/fit@4.8.1
  - @kaiord/tcx@4.8.1
  - @kaiord/zwo@4.8.1
  - @kaiord/garmin@4.8.1
  - @kaiord/garmin-connect@4.8.1

## 4.7.0

### Minor Changes

- 35c927e: Add Garmin Connect integration to CLI and MCP with login, logout, list, and push commands/tools

## 4.5.1

### Patch Changes

- 9dfe279: Replace non-null assertion with explicit guard in resolve-input.ts
- Updated dependencies [9dfe279]
  - @kaiord/garmin@4.5.1

## 4.4.0

### Minor Changes

- 61e2a85: feat(mcp): add kaiord_get_format_spec tool and server instructions for KRD discoverability

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
