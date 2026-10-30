## Context

`@kaiord/mcp` registers 17 tools, 3 resources and 2 prompts on one
`McpServer`, and `bin/kaiord-mcp.ts` connects it to a stdio transport. Some
pieces assume Node and a local disk:

- `createServer` reads the version from `package.json`.
- `kaiord_get_format_spec` and the `krd-format-spec` resource read
  `docs/krd-format.md`.
- The `krd-schema` resource reads `krd.json`.
- `kaiord_inspect`, `kaiord_diff` and `kaiord_round_trip_validate` take only
  file paths.
- The version read and the spec-path lookup run at module load
  (`create-server.ts`, `find-spec-file.ts`), so merely importing the server
  touches the disk.
- `SERVER_INSTRUCTIONS` tells the agent to use the Garmin and health tools,
  and both prompts (`convert-file`, `analyze-workout`) take a `file_path`.
- `kaiord_round_trip_validate` builds its own `createFitWriter(logger)`, and
  the format registry's FIT writer takes no options: there are two FIT writer
  call sites, not one.

`@modelcontextprotocol/sdk` 1.32.1, already a dependency, ships
`WebStandardStreamableHTTPServerTransport`. It works on Fetch-API `Request`
and `Response` objects, which is what a Worker receives. The PoC used it
unchanged.

## Goals / Non-Goals

**Goals:**

- Serve the eight stateless tools at `https://kaiord.com/mcp` from the
  Cloudflare Workers Free plan.
- Share the tool code between the stdio and the remote servers.
- Fix the FIT write failure at its root (the SDK's 500 MB reservation), not
  by patching the runtime.
- Publish the Server Card and DNS-AID only once they describe a live
  endpoint.

**Non-Goals:**

- Any tool that holds an athlete's account session or health data.
- Authentication, accounts or per-user state.
- Deploying from CI (see the proposal's Out of scope).

## Decisions

### D1. The Worker is a new private package, `@kaiord/mcp-worker`

- **Layer:** driving adapter (transport).
- **Alternative rejected:** a second entry point inside `@kaiord/mcp`. That
  would put Worker types, `wrangler.toml` and a browser-condition bundle into
  a package published to npm for stdio users.
- **Reuse:** the private package imports `createServer` from `@kaiord/mcp`,
  as the stdio bin does.
- **Repo lists:** it is private, so only the CI test matrix and
  `detect-changes` list it. The publish lists stay unchanged.

### D2. `createServer` takes a toolset and injected inputs

- **Layer:** MCP composition.
- **Signature:** `createServer(options?)` with these fields:
  - `toolset: "local" | "remote"`, default `"local"`;
  - `version: string`;
  - `formatSpec: string`;
  - `krdSchema: string`;
  - `fitWriter?: { maxOutputBytes: number }`.
- **Local path:** the Node bin fills the inputs from disk exactly as today, so
  `createServer()` with no arguments behaves as now.
- **Remote path:** the Worker imports the two texts as bundled text modules.
- **No I/O at import:** the module-scope `readFileSync` of `package.json` and
  the module-scope `fileURLToPath` in `find-spec-file.ts` move into the Node
  bin, which passes the results in. The Worker runs with the `nodejs_compat`
  flag and a pinned `compatibility_date`, because tool modules still import
  `node:fs` and `node:path` statically for the local path inputs; on the
  remote toolset those code paths are unreachable.
- **Whole surface, not only tools:** the `"remote"` toolset also selects
  - a remote instructions text that names only the eight tools;
  - the resources `krd-format-spec`, `krd-schema` and `supported-formats`,
    served from the injected texts;
  - no prompts, because both current prompts are built around a file path.

  Tests pin `tools/list`, `resources/list` and `prompts/list` for the remote
  toolset, and assert the instructions text names no excluded tool.

- **Advertised schemas:** the `"remote"` toolset registers only the eight
  tools, with schemas that omit `input_file`, `output_file`, `file1` and
  `file2`. So `tools/list` never advertises a parameter the endpoint cannot
  honour.
- **Paths are rejected, not stripped:** the SDK's object schema would strip
  an unknown `input_file` silently, so a call sending a path alongside valid
  `input_content` would succeed and an `output_file` would be ignored. The
  Worker therefore inspects `tools/call` arguments before dispatch and
  answers any call that carries `input_file`, `output_file`, `file1` or
  `file2` with a tool error naming the parameter. No disk read is ever
  attempted.

### D3. Inline content for every remote tool

- **Additive:** these changes apply to the local server too.
- **New inline inputs:**
  - `kaiord_inspect` and `kaiord_round_trip_validate` take `input_content`,
    base64 for FIT;
  - `kaiord_diff` takes `content1`/`format1` and `content2`/`format2`.
- **Exclusivity:** a path and inline content stay mutually exclusive, with
  the existing `validateExclusiveInput` error.
- **FIT output:** `kaiord_convert` with `output_format: "fit"` and no
  `output_file` returns the FIT bytes as base64 text, stating the encoding. It
  no longer fails.

### D4. Fix the FIT SDK reservation with a declared patch

- **Layer:** FIT adapter only.
- **The patch:** `pnpm patch @garmin/fitsdk` changes `Encoder`'s constructor
  to accept `outputStream` options and hand them to `new OutputStream(...)`.
  Without the option, behaviour is identical.
- **Field initializer:** `#outputStream = new OutputStream()` is a class
  field initializer, which runs before the constructor body. The patch
  replaces the initializer with an assignment in the constructor from the new
  option; patching only the constructor would leave the 500 MB reservation.
- **Writer option:** `createFitWriter(logger, { maxOutputBytes })` and
  `createGarminFitSdkWriter` pass the cap through. The Worker passes 16 MiB.
  The CLI, the SPA and the stdio server pass nothing and keep the SDK default.
- **Both call sites:** the MCP server receives a FIT writer factory through
  `createServer`'s `fitWriter` option and uses it in the format registry and
  in `kaiord_round_trip_validate`. Neither builds its own uncapped writer.
- **Why not the alternatives:**
  - A global `ArrayBuffer` Proxy, which the PoC used to confirm the cause,
    is rejected: it changes a global for every library in the isolate.
  - Lowering the SDK default for everyone is rejected: it would cap the
    CLI's large activity files for no reason.
- **Published consumers:** the patch applies inside this monorepo only.
  `@kaiord/fit` installed from npm runs against an unpatched SDK, which
  ignores the option silently. So `maxOutputBytes` is not documented as public
  API: it is marked internal, and the writer checks that the encoder honoured
  it (its stream's `maxByteLength` equals the cap) and throws if not, instead
  of failing later with a 500 MB reservation.
- **Upstream:** an issue is filed with the SDK maintainers, so the patch can
  be dropped once the option exists upstream.

### D5. ZWO validates well-formedness only in the Worker

`@kaiord/zwo` resolves to its `browser` entry under the Worker's bundle
conditions. That entry checks well-formedness only, because XSD validation
shells out to a JVM. The remote `kaiord_validate` and `kaiord_convert`
descriptions state that ZWO input is not validated against the XSD remotely.

The browser validator already uses the injected logger. The stray
"Browser environment detected" line comes from the module-level
`zwiftReader` and `zwiftWriter` singletons in `browser.ts`, built at import
with a console logger. They become lazy, so importing the entry logs nothing
and the Worker's logger is the only one used.

### D6. Transport, limits and abuse controls

- **Layer:** Worker adapter.
- **Transport:**
  - `POST /mcp` builds a new `McpServer` and a stateless transport
    (`sessionIdGenerator: undefined`, JSON responses) for each request;
  - any other method on `/mcp` gets `405`.
- **Body limit:**
  - the Worker reads the body itself, streamed and stopped at 65,536 bytes,
    before any JSON parse; an over-limit body gets `413`;
  - the cap covers a request without `content-length` or with a false one,
    so the header alone is never trusted;
  - the transport's own `maxRequestBodySize` is not enough here: it is not
    applied once the caller passes `parsedBody`, and the Worker must parse
    first to reject batches. It is still set to 65,536 as a second bound.
- **One call per request:** the transport accepts JSON-RPC batch arrays of up
  to 100 messages. A batch would turn one rate-limited request into 100 tool
  calls, so an array body gets `400` and the parsed object goes to
  `handleRequest(req, { parsedBody })`.
- **Rate limit:** per client IP, using the Workers Rate Limiting binding:
  - 60 requests per 60 s;
  - an over-limit request gets `429`.
- **Rate-limit caveat:** the binding counts per Cloudflare location and is
  eventually consistent, so it slows abuse rather than enforcing an exact
  ceiling.
- **Two layers:** a Cloudflare WAF rate-limiting rule on `/mcp` is always
  created, because it runs before the Worker (see the daily quota below). The
  Free plan includes one rule, and as far as we know its counting period is
  fixed at 10 s, so it is 10 requests per 10 s. The binding is the second,
  finer layer, wired only if task 3.3 finds it on the Free plan; its
  documentation does not say.
- **Ports:** the limiter and the body reader sit behind two small types,
  `RateLimiter` (`limit(key) → Promise<{ success: boolean }>`, the binding's
  own shape) and the handler's injected dependencies. Tests pass fakes, so the
  `429` scenario runs without Cloudflare.
- **Daily quota is account-wide:** the Free plan's 100,000 requests a day
  are shared by every Worker on the account, `kaiord-agent-edge` included,
  and a request the binding rejects has still invoked the Worker. So the
  binding alone cannot protect the edge Worker. Two measures:
  - the Cloudflare WAF rate-limiting rule on `/mcp` runs before any Worker
    is invoked, so throttled traffic consumes no Worker quota. It is the
    primary control; the binding is a second, finer one;
  - the `kaiord-agent-edge` route is set to fail open, so if the quota is
    exhausted the site is still served from GitHub Pages, without the Link
    headers and Markdown negotiation, while `/mcp` fails closed with Error 1027.

  Task 3.3 confirms the WAF rule's limits on Free; task 5.2 creates it.

### D7. Structured workouts only

- **Rule:** every remote tool that takes content decodes it first and accepts
  only a document of KRD type `structured_workout` with no `sessions`, `laps`, `records` or `events`, and with no `extensions` namespace outside an allowlist of workout namespaces (`structured_workout` plus any the workout adapters emit, pinned by a test; never `health`, `course` or `course_points`). Anything else gets a tool error naming the type or the
  offending field. That covers `recorded_activity` (heart rate, GPS),
  `course`, the six health types, and a document labelled
  `structured_workout` that still carries records or health extensions.
- **Decoding comes first:** the type is only known after decoding, so a
  rejected file is decoded in memory before it is refused. It is not stored,
  logged or returned.
- **Why:** dropping the health tools does not keep health data out.
  `kaiord_convert` and `kaiord_inspect` read any FIT file, and the FIT reader
  maps sleep, HRV, weight and stress messages. The rule keeps recorded and
  health data out of what the endpoint processes and returns.
- **What a workout can still carry:** a workout has free-text `name` and
  `notes`, heart-rate targets, and metadata such as a device serial number.
  A caller can put personal content there. The endpoint does not try to
  detect it; the privacy policy says so instead of claiming no personal data
  is processed.
- **Cost:** it also removes the CPU risk the PoC found. Activity files were
  the only inputs near the 10 ms budget; structured workouts are a few hundred
  bytes.
- **Local server:** unchanged. The rule applies to the remote toolset only.

### D8. No content is logged

- **Persisted invocation logs off:** in `wrangler.toml`, so request metadata
  is not stored in the Workers dashboard.
- **Error logs:** the Worker logs only the error class and the tool name,
  never arguments or results.
- **Privacy delta:** this is what the privacy-policy change discloses.

### D9. Route, deploy and the production-only check

- **Route:** the Worker `kaiord-mcp` gets route `kaiord.com/mcp`. Cloudflare
  matches the most specific route, so it wins over `kaiord-agent-edge` on
  `kaiord.com/*`.
- **Deploy:** `npx wrangler@4 deploy` from the package. In this change it is
  manual and needs Pablo's go-ahead each time, because it is a production
  deploy.
- **Enforced, not advised:** `never-auto-remediate.cjs` matches no `wrangler`
  command today. `wrangler deploy`, `wrangler delete` and route changes join
  its `prod-deploy` class, with tests, so the go-ahead cannot be skipped by
  accident. Workers on `workers.dev` for a PoC stay allowed only through
  Pablo's typed `!` command.
- **Smoke test:** `wrangler dev` did not reproduce the FIT failure, so a
  post-deploy smoke script runs against production. It checks:
  - `tools/list` returns exactly the eight names;
  - a KRD→FIT conversion decodes back with the same step count;
  - `kaiord_round_trip_validate` on a FIT workout succeeds (the second FIT
    writer call site);
  - a recorded-activity input is rejected;
  - a ZWO conversion succeeds;
  - an oversized body returns `413`.

  It runs after every deploy and gates the discovery step.

### D10. Discovery is published last

Each document is published only after the smoke test passes in production:

- **Server Card:** `/.well-known/mcp/server-card.json` in
  `packages/landing/public`, shaped by the SEP-2127 draft, with:
  - `serverInfo` (name, version);
  - the transport (`streamable-http`, `https://kaiord.com/mcp`);
  - `capabilities`.
- **AI catalog:** a second MCP entry pointing at the Server Card.
- **Registry:** `server.json` adds
  `remotes: [{ "type": "streamable-http", "url": "https://kaiord.com/mcp" }]`.
  Republishing to the registry is Pablo's `mcp-publisher publish`.
- **DNS-AID:**
  - record `_mcp._agents.kaiord.com. SVCB 1 kaiord.com. alpn="h2" port=443`;
  - DNSSEC enabled on the Cloudflare zone;
  - its DS record added at the Route53 registrar.

  The registrar step changes the domain, so Pablo approves it.

## Risks / Trade-offs

- **Cloudflare tolerance:** the PoC measured conversions, not
  `kaiord_round_trip_validate` (decode, encode, decode: about three times the
  work) and not the per-request server build with schema conversion. With
  inputs limited to structured workouts both are small, but task 3.6 measures
  them on Cloudflare before deploy, and a tool that exceeds the budget is
  dropped from the remote list rather than shipped.
- **Patch drift:** pnpm keys a patch by the exact package version, so every
  `@garmin/fitsdk` bump needs the patch re-keyed, not only the ones that
  conflict. A bump without it fails `pnpm install` loudly. A unit test asserts
  the option reaches the `OutputStream`. The upstream issue is the way out.
- **Second runtime:** the remote server is a second runtime for the same
  tools. A test asserts the remote `tools/list` equals the eight names, so a
  tool added later cannot reach the network by default.
- **Anonymous endpoint:** it can be used by anyone. Rate limit, body cap and
  daily quota bound the cost at zero on the Free plan; abuse degrades
  service, it does not bill.

## Migration Plan

No public API breaks. `createServer()` without arguments keeps today's
behaviour, and the new options and tool inputs are additive.

Rollback is deleting the `kaiord-mcp` route. Requests to `/mcp` then fall
through to the agent-edge Worker and GitHub Pages, which return 404. The
discovery documents must be reverted in the same rollback.

## Post-implementation notes

- **WAF threshold.** The Free plan allows one rate-limiting rule, with a fixed
  10 s period. The rule is 10 requests per 10 s per IP on `/mcp`. One
  stateless call per request keeps a normal agent session under it. Clients
  behind a shared NAT wait 10 s after a block. The Worker's own 60/60 s
  binding is a second layer behind the WAF rule.
- **Task 6.3 reworded.** `10.4.0` was registered before the remote existed,
  and the registry rejects a version it already has. So `remotes` ships with
  the next `@kaiord/mcp` release through the automated `registry` job in
  `release.yml`, not through a manual `mcp-publisher publish`.
- **Task 6.3 evidence.** Release 10.5.0 published the entry: the registry
  serves `remotes[0].url = https://kaiord.com/mcp` with `isLatest: true`.
- **Agent-edge fail-open.** The Workers routes API reports
  `request_limit_fail_open: true` on `kaiord.com/*` (checked 2026-10-30).
  The `/mcp` route stays fail-closed.
- **Upstream channel.** `garmin/fit-javascript-sdk` has issues disabled and
  closes outside PRs. The Garmin developer forum is the only channel. The
  patch file is left as is: editing it changes the lockfile's patch hash,
  and its comment already says to drop it once upstream has the option.
