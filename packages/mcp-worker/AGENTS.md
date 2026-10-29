<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-29 | Updated: 2026-10-29 -->

# @kaiord/mcp-worker

## Purpose

Private Cloudflare Worker that serves `@kaiord/mcp`'s remote toolset (the
eight stateless tools, no prompts, three resources) over stateless
Streamable HTTP at `https://kaiord.com/mcp`. It is a second transport for the
same server the `kaiord-mcp` stdio bin runs; it adds no tool of its own.
OpenSpec change: `add-remote-mcp-endpoint` (design D1, D6, D8, D9).

## Key Files

- `wrangler.toml` — Worker `kaiord-mcp`, route `kaiord.com/mcp`,
  `nodejs_compat`, pinned `compatibility_date`, every log and trace off, no
  storage bindings, the `.md` text-module rule, and the `MCP_RATE_LIMITER`
  binding (60 per 60 s per IP).
- `src/worker.ts` — Worker entry; passes the optional rate-limit binding in.
- `src/load-at-startup.ts` — the entry's first import. It initializes zod
  and the format adapters at isolate startup: without it the bundle fails to
  load in workerd, and a cold adapter spends a request's 10 ms CPU budget.
- `src/handler.ts` — `POST /mcp` only (405 with `Allow: POST`, 404 elsewhere),
  rate limit (429), bounded body (413), then one JSON-RPC message.
- `src/read-bounded-body.ts` — streams the body and stops past 65,536 bytes;
  `content-length` is never trusted.
- `src/parse-message.ts` — invalid JSON is a 400 parse error, a batch is 400.
- `src/serve-mcp.ts` — a new server and stateless transport per request.
- `src/build-server.ts` — `createServer({ toolset: "remote", ... })` with the
  bundled format spec and KRD schema, the 16 MiB FIT writer cap and a quiet
  logger.
- `src/content-free-log.ts`, `src/log-failure.ts` — the only log lines: event,
  JSON-RPC method, tool name and error class, each from an allowlist.
- `scripts/smoke.mjs` — post-deploy smoke test (`pnpm smoke <url>`).

## For AI Agents

### Working In This Directory

- **Never deploy.** `wrangler deploy`, `delete`, `rollback`, `versions deploy`
  and `triggers deploy` are in the `prod-deploy` class and the
  never-auto-remediate hook denies them. Pablo runs the deploy himself.
  `pnpm build` is `wrangler deploy --dry-run --outdir dist`, which only bundles.
- **Log no content.** Never log arguments, results or bodies. A new log field
  must come from an allowlist or from server-generated labels.
- **No global patches.** The FIT size fix is `fitWriter.maxOutputBytes`, not
  an `ArrayBuffer` proxy.
- Text imports: `.md` files are text modules (wrangler `[[rules]]`, mirrored
  by a plugin in `vitest.config.ts`); the KRD schema is imported as JSON and
  re-serialised byte-identically.

### Testing Requirements

- Handler tests use Node's global `Request`/`Response` against the real
  remote server. Send `Accept: application/json, text/event-stream`.
- `src/wrangler-config.test.ts` pins logs off, no storage, the route and
  `nodejs_compat`.
- `scripts/smoke.test.mjs` runs under `pnpm test:scripts`.
- `test/workerd-startup.test.mjs` (`pnpm test:workerd`, part of `test`) boots
  the real bundle in local workerd. The Vitest suites never see the bundle,
  so a module-load crash passes them.

## Dependencies

- `@kaiord/mcp` (`createServer`), `@modelcontextprotocol/sdk`
  (`WebStandardStreamableHTTPServerTransport`).
- `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin` and `zod`,
  imported only by `src/load-at-startup.ts`.
- Dev: `wrangler@4`.
