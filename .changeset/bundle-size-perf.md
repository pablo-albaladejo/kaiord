---
"@kaiord/cli": patch
"@kaiord/mcp": patch
---

perf(cli, mcp): defer adapter loading via tsup splitting + dynamic imports

CLI's `krd-converter.ts` and MCP's `format-registry.ts` no longer statically import all four format adapters (fit, tcx, zwo, garmin) at module load. Each `case` now `await import("@kaiord/<adapter>")` only the format the user requests. Combined with `splitting: true` in both tsup configs, this lets each invocation load only the requested adapter chunk at runtime. (The published package still contains the generated chunks for all adapters; the win is in cold-start runtime cost, which is what `total_js_bytes` measures because the metric counts every `.js` file in `dist/` regardless of which is dynamically imported — when one adapter is dropped from the eager dist, that chunk shrinks).

Public API unchanged — both consumer-facing convert functions were already async. `cli` dist drops 4.5%; `mcp` grows 2.3% (per-chunk overhead, well within K007's 5% per-package tolerance). Net SPA monorepo-wide savings of −1,877 bytes from this change alone, contributing to a cumulative −93,176 byte (−3.86%) reduction in this PR.
