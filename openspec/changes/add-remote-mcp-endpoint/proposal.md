## Why

`@kaiord/mcp` is stdio-only. An agent can use it only after the user installs
it locally with `npx`. A hosted agent (claude.ai, ChatGPT connectors, a remote
agent runtime) cannot reach it at all.

The agent-readiness work (#1582, #1583) published every discovery document
that is honest without a network service. The remaining checks (MCP Server
Card, DNS-AID) describe an endpoint an agent connects to. Publishing them
without one would send agents to a URL that does not exist. A real remote
endpoint makes them true.

A PoC on real Cloudflare (2026-10-29, worker deleted afterwards) settled the
feasibility questions this proposal depends on:

- **Bundle:** 2.7 MiB (424 KiB gzip) against a 64 MiB limit. Startup 44 ms.
- **CPU (Free plan, 10 ms per request):** workouts and FIT files up to 65 KB
  passed 20/20. A 94 KB activity hit Error 1102 in 4 of 20 requests in one
  round and 0 of 20 in another. Cloudflare's burst tolerance is real but not
  documented as a guarantee.
- **Production-only failure:** every FIT write failed with
  `RangeError: Invalid array buffer max length`. `@garmin/fitsdk`'s `Encoder`
  builds its `OutputStream` with no options, so it always reserves a
  resizable `ArrayBuffer` with `maxByteLength` 500 MB. A Worker isolate has
  128 MB. `wrangler dev` does not reproduce it. Clamping the reservation to
  16 MB made the FIT written on Cloudflare byte-identical to the local one.

## What Changes

- **Remote endpoint.** `https://kaiord.com/mcp` serves MCP over stateless
  Streamable HTTP from a Cloudflare Worker on the Free plan. Every request
  builds its own server. Nothing is stored and there are no sessions.
- **Remote toolset (8 tools).** `kaiord_list_formats`,
  `kaiord_get_format_spec`, `kaiord_convert`, `kaiord_validate`,
  `kaiord_inspect`, `kaiord_diff`, `kaiord_extract_workout` and
  `kaiord_round_trip_validate`. They take inline content only; the remote
  schemas do not advertise `input_file` or `output_file`. The remote server
  also has its own instructions text, prompt list and resource list, so
  nothing it advertises points at a local-only tool or a file path.
- **Structured workouts only.** The remote tools accept only documents that
  decode to KRD type `structured_workout` with no recorded data (`sessions`,
  `laps`, `records`, `events`) and no health or course extensions. A recorded
  activity (heart rate, GPS), a course or any of the six health types is
  decoded in memory, rejected, and not stored. A workout's free-text fields
  and device metadata are still processed in transit, and the privacy policy
  says so.
- **Paths rejected.** A remote call carrying `input_file`, `output_file`,
  `file1` or `file2` fails instead of having the key silently stripped.
- **Quota.** The WAF rate rule throttles `/mcp` before any Worker runs, so
  abuse cannot drain the account-wide daily quota the edge Worker shares;
  the edge Worker's route fails open.
- **Excluded from remote.** The `kaiord_garmin_*` tools, which would hold an
  athlete's Garmin session and write to their account, and the five health
  tools. Both stay local-only. Excluding the tools is not enough on its own:
  `kaiord_convert` and `kaiord_inspect` read any FIT file, so the
  structured-workout rule above is what keeps health and activity data out.
- **Inline content everywhere.** Three tools accept only file paths today:
  - `kaiord_inspect` and `kaiord_round_trip_validate` gain `input_content`
    (base64 for FIT);
  - `kaiord_diff` gains `content1` and `content2`, each with its format.

  `kaiord_convert` to FIT without `output_file` returns base64 instead of
  failing. These are additive changes to the local server too.

- **Injected server inputs.** `createServer` takes its version and the
  format-spec and KRD-schema texts as inputs. The disk reads that run today
  at module load (`package.json`, the spec path lookup) move to the Node bin,
  so importing the server does no I/O and the same tools run in a Worker.
- **FIT SDK patch.** A `pnpm patch` of `@garmin/fitsdk` lets the `Encoder`
  pass `OutputStream` options. `@kaiord/fit`'s writer factory gains an
  optional output cap, threaded into every FIT writer the MCP server builds
  (convert and round-trip). The Worker sets it to 16 MiB. An upstream issue is
  filed with Garmin.
- **Limits.** Request bodies over 65,536 bytes are rejected with `413`
  before parsing. Base64 inflates by 4/3, so that admits a FIT file of about
  48 KB, far above any structured workout (the PoC's 3-step workout is 208
  bytes). JSON-RPC batch arrays are rejected with `400`, so one request is
  one call. Requests are rate-limited per client IP.
- **Privacy.** The privacy policy discloses the endpoint: it accepts only
  workout definitions, processes them in transit and stores nothing; the
  client IP is used transiently for rate limiting and not stored by Kaiord;
  requests travel through Cloudflare's network. `CLAUDE.md`'s "Kaiord runs no
  backend of its own" is updated the same way.
- **Deploy guard.** `wrangler deploy` and Worker route changes join the
  `prod-deploy` class of `never-auto-remediate.cjs`, so an agent cannot ship
  the endpoint without Pablo.
- **Discovery, after the endpoint is live.** Discovery is published only once
  the endpoint answers in production:
  - an MCP Server Card at `/.well-known/mcp/server-card.json`;
  - a `remotes` entry in the registry's `server.json`;
  - an AI-catalog entry;
  - a DNS-AID `SVCB` record at `_mcp._agents.kaiord.com` on a
    DNSSEC-signed zone.

## Impact

- **Packages:**
  - `@kaiord/fit`: an internal writer option (patch).
  - `@kaiord/mcp`: new `createServer` options and additive tool inputs (minor).
  - The new private package `@kaiord/mcp-worker`.
  - `@kaiord/landing`: the server card.
  - `@kaiord/docs`: privacy policy and remote MCP usage.
- **Layers:** no change to `@kaiord/core`. The FIT change lives in the FIT
  adapter. The MCP changes live in the MCP composition layer, and the Worker
  is a new driving adapter (transport) over it.
- **Breaking changes:** none. The `createServer()` call without arguments
  keeps today's behavior.
- **Infrastructure:** a second Worker (`kaiord-mcp`) on route `kaiord.com/mcp`.
  Its route is more specific than `kaiord-agent-edge`'s `kaiord.com/*`. DNSSEC
  is enabled on the Cloudflare zone, with its DS record at the Route53
  registrar.
- **Specs:**
  - `remote-mcp-endpoint` (ADDED);
  - `privacy-policy` (MODIFIED: the "no backend" statement becomes "no
    backend that stores user data", plus the endpoint disclosure).
- **Guardrails:** `.claude/hooks/never-auto-remediate.cjs` and its tests.
- **Not a new publishable package:** `@kaiord/mcp-worker` is private, so the
  changeset, release and GitHub-release lists do not change. It joins the CI
  test matrix only.

## Out of scope

- OAuth, auth.md, the A2A Agent Card and the API catalog. None of them applies
  to an anonymous, stateless conversion endpoint.
- Garmin and health tools over the network.
- Automatic deploy from CI. It needs a Cloudflare API token as a repository
  secret, a repo-settings action reserved to Pablo. That is a follow-up.
