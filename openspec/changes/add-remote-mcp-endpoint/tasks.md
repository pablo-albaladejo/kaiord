## 0. OpenSpec change

- [x] 0.1 Write `proposal.md`, `design.md`, this task list and the
      `remote-mcp-endpoint` and `privacy-policy` deltas.
- [x] 0.2 `openspec validate add-remote-mcp-endpoint --strict` passes.

## 1. FIT writer output cap (PR-1, `@kaiord/fit`)

- [ ] 1.1 Red: a test asserts that `createFitWriter(logger, { maxOutputBytes })`
      reaches the SDK `OutputStream` as `maxByteLength`. It fails today.
- [ ] 1.2 Add `pnpm patch @garmin/fitsdk`: `Encoder` accepts `outputStream`
      options. The default behaviour is unchanged.
- [ ] 1.3 Thread the option through `createFitWriter` and
      `createGarminFitSdkWriter`. The patch replaces the `#outputStream`
      field initializer, not only the constructor. Green.
- [ ] 1.3b The writer throws when the encoder did not honour the cap (an
      unpatched SDK), with a test. The option stays internal, not
      documented as public API.
- [ ] 1.4 Add a test that a writer created without the option encodes exactly
      as before, with byte-identical output on the existing fixtures.
- [ ] 1.5 File the upstream issue with the SDK maintainers and link it from
      the patch file.
- [ ] 1.6 Add a changeset (`@kaiord/fit` patch; the option is internal).

## 2. Shared server, remote toolset (PR-2, `@kaiord/mcp`)

- [ ] 2.1 Red: test that `createServer({ toolset: "remote", ... })`:
  - lists exactly the eight remote tool names;
  - has no remote schema with `input_file`, `output_file`, `file1` or
    `file2`;
  - lists no prompt and exactly the three remote resources;
  - has instructions that name no excluded tool.
- [ ] 2.1b Move the module-scope `package.json` read and the
      `find-spec-file.ts` path lookup into the Node bin. A test imports the
      server module with `node:fs` spied and asserts no read.
- [ ] 2.2 Add `createServer` options: `toolset`, `version`, `formatSpec`,
      `krdSchema` and `fitWriter`. The Node bin fills them from disk, and
      `createServer()` keeps today's behaviour. The `fitWriter` factory is
      used by both the format registry and `kaiord_round_trip_validate`.
      Green.
- [ ] 2.2b Remote toolset only: decode content, then accept only a
      `structured_workout` with no `sessions`/`laps`/`records`/`events` and
      only allowlisted `extensions` namespaces (pin the allowlist from what
      the workout adapters emit), with a tool error naming the type or
      field. Test a FIT sleep record, a FIT activity, a TCX activity, a
      workout-labelled KRD with `records`, and one with `extensions.health`
      remotely, and the same sleep record locally (still accepted).
- [ ] 2.2c Remote toolset only: a `tools/call` whose arguments carry
      `input_file`, `output_file`, `file1` or `file2` fails with a tool error
      naming it, also when valid inline content is present.
- [ ] 2.3 `kaiord_inspect` and `kaiord_round_trip_validate` accept
      `input_content` (base64 for FIT). Cover path/content exclusivity.
- [ ] 2.4 `kaiord_diff` accepts `content1`/`format1` and `content2`/`format2`.
      Cover path/content exclusivity per side.
- [ ] 2.5 `kaiord_convert` to FIT without `output_file` returns base64. Add a
      test that the bytes decode back to the same KRD.
- [ ] 2.6 Make the `zwiftReader` and `zwiftWriter` singletons in
      `@kaiord/zwo`'s `browser.ts` lazy, so importing the entry logs
      nothing. The validator already uses the injected logger.
- [ ] 2.7 Add changesets (`@kaiord/mcp` minor, `@kaiord/zwo` patch).

## 3. Worker (PR-3, `@kaiord/mcp-worker`, private)

- [ ] 3.1 Scaffold the private package: `wrangler.toml` (route
      `kaiord.com/mcp`, `nodejs_compat`, pinned `compatibility_date`,
      invocation logs off, no storage bindings), text-module rules for the
      spec and schema, and the CI test matrix and `detect-changes` entries.
      A config test asserts logs off and no storage bindings.
- [ ] 3.2 Red then green: handler tests with Fetch-API `Request`s:
  - `POST /mcp` `tools/list` returns the eight tools;
  - a KRD→FIT call round-trips;
  - `GET /mcp` returns `405` with `Allow: POST`;
  - a 65,537-byte body returns `413`, with and without `content-length`;
  - a 65,536-byte body does not;
  - a batch array returns `400` and runs no tool;
  - two requests get different server instances and no `mcp-session-id`.
- [ ] 3.3 Check whether the Rate Limiting binding exists on the Workers Free
      plan:
  - if it does, wire it at 60/60 s per IP, returning `429`;
  - if it does not, record the WAF rule for task 5.2 instead (the Free
    rule's period is believed fixed at 10 s: confirm, then use 10/10 s).

  Either way the handler takes the limiter as an injected `RateLimiter`, and
  the `429` test uses a fake. Also confirm the Free-plan WAF rate rule's
  limits: it is the primary control because it runs before the Worker and
  so protects the account-wide daily quota shared with `kaiord-agent-edge`.

- [ ] 3.4 Log only the error class and tool name. Add a test that a failing
      tool call logs no argument content.
- [ ] 3.5 Write the post-deploy smoke script with its `node:test`:
      `tools/list` names, KRD→FIT round-trip, `kaiord_round_trip_validate`
      on FIT, ZWO convert, activity rejected, `413`. It exits non-zero
      naming the failed check.
- [ ] 3.6 On a throwaway `workers.dev` deploy (Pablo's `!` command), measure
      CPU for `kaiord_round_trip_validate` and the per-request server build.
      Drop from the remote list any tool that hits Error 1102.
- [ ] 3.7 Add `wrangler deploy`, `wrangler delete` and Worker route changes
      to the `prod-deploy` class in `never-auto-remediate.cjs`, with tests.

## 4. Privacy and docs (PR-4, `@kaiord/docs`)

- [ ] 4.1 Update the privacy policy per the `privacy-policy` delta. Extend
      `lint:privacy-policy` with a rule for the endpoint disclosure.
- [ ] 4.1b Update `CLAUDE.md`'s "Kaiord runs no backend of its own" to name
      the stateless endpoint.
- [ ] 4.2 Document remote usage on the MCP docs pages:
  - the endpoint URL;
  - the eight tools;
  - the 65,536-byte limit and one call per request;
  - structured workouts only;
  - ZWO without XSD;
  - Garmin and health tools are local-only.

## 5. Deploy (manual, after PR-1 to PR-4 are merged)

- [ ] 5.1 With Pablo's go-ahead, deploy `kaiord-mcp` with
      `npx wrangler@4 deploy`.
- [ ] 5.2 Add the WAF rate-limiting rule on `/mcp` (always, not only as a
      fallback), and set the `kaiord-agent-edge` route to fail open.
- [ ] 5.3 Run the smoke script against `https://kaiord.com/mcp`. It must pass
      before section 6 starts.
- [ ] 5.4 Check that `kaiord-agent-edge` still serves `/` and the docs, so the
      route precedence holds.

## 6. Discovery (PR-5, after 5.3 passes)

- [ ] 6.1 Publish `/.well-known/mcp/server-card.json` (SEP-2127 draft shape).
      Extend the landing `well-known` test and the deploy-site `test -f`
      checks.
- [ ] 6.2 Add the AI-catalog entry for the remote server.
- [ ] 6.3 Add `remotes` to `packages/mcp/server.json`. Pablo then runs
      `mcp-publisher publish`.
- [ ] 6.4 Enable DNSSEC on the Cloudflare zone. With Pablo's approval, add the
      DS record at the Route53 registrar.
- [ ] 6.5 Create the `_mcp._agents.kaiord.com` `SVCB` record. Verify it
      returns authenticated data through DNS-over-HTTPS.
- [ ] 6.6 Rescan isitagentready.com. `mcpServerCard` and `dnsAid` must pass.
