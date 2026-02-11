---
"@kaiord/core": minor
"@kaiord/fit": minor
"@kaiord/tcx": minor
"@kaiord/zwo": minor
"@kaiord/garmin": minor
"@kaiord/cli": minor
"@kaiord/mcp": minor
---

feat(mcp): add MCP server package exposing Kaiord tools to AI agents

- New `@kaiord/mcp` package with 6 tools, 3 resources, and 2 prompts for Claude Desktop/Code integration
- Upgrade Zod from v3 to v4 across all packages (`z.uuid()`, `z.iso.datetime()`, native `z.toJSONSchema()`)
- Remove `zod-to-json-schema` dependency in favor of native Zod v4 JSON schema generation
