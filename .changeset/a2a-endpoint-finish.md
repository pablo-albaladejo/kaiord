---
"@kaiord/mcp-worker": patch
---

The A2A skills `kaiord_diff`, `kaiord_extract_workout` and `kaiord_inspect` no longer describe their format arguments as optional: the remote endpoint is inline-only and detects a format only from a file path, so a call without them always failed. The agent card's `kaiord_diff` example did; every card example now runs against the endpoint in a test. `pnpm smoke` takes several endpoints, and `pnpm smoke:prod` checks `/mcp` and `/a2a` after a deploy.
