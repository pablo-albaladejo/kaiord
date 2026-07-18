---
"@kaiord/core": patch
"@kaiord/fit": patch
"@kaiord/tcx": patch
"@kaiord/zwo": patch
"@kaiord/garmin": patch
"@kaiord/garmin-connect": patch
"@kaiord/cli": patch
"@kaiord/mcp": patch
---

Point every package's `homepage` at its kaiord.com docs page instead of the
package's own npm page (a circular link), and broaden `keywords` with the
search terms people actually use (fit-parser, fit-converter, zwift-workout,
tcx-parser, garmin-connect-api, mcp-server, fit-to-tcx, …) so the packages
surface in npm and search-engine queries. `@kaiord/mcp` also gains the
`mcpName` field and a `server.json` so it can be published to the official
MCP registry (registry.modelcontextprotocol.io).
