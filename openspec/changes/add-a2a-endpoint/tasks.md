## 0. OpenSpec change

- [x] 0.1 Write `proposal.md`, `design.md`, this task list and the
      `a2a-endpoint`, `remote-mcp-endpoint` and `privacy-policy` deltas.
- [x] 0.2 Pin the A2A 1.0 specification (tag and permalink in `design.md`)
      and check the method names, the `Part` shape, the enums, the error
      codes and the required AgentCard fields against it and against a
      card the scanner already accepts.
- [x] 0.3 `openspec validate add-a2a-endpoint --strict` passes.
- [x] 0.4 Pablo approves the change in chat before any code.

## 1. Privacy disclosure and link path (PR `docs/a2a-privacy`)

- [ ] 1.1 The privacy policy names `https://kaiord.com/a2a`: the same tools,
      the same terms, tasks not retained. The existing lint phrases stay
      verbatim and **Last updated** is bumped.
- [ ] 1.2 Add a privacy-lint rule for the A2A sentence, with a test that
      deleting the sentence fails the lint.
- [ ] 1.3 Add `/a2a` to `WORKER_PATHS` in the site link check, with a test.
- [ ] 1.4 Merge before any `/a2a` route exists.

## 2. Worker code, route and smoke (PR `feat/a2a-endpoint`; merging deploys nothing)

- [ ] 2.1 Extract `dispatchMcp(message, deps)`: a server and transport per
      call, and a fresh internal `Request` carrying none of the caller's
      headers. `/mcp` behaviour and its tests are unchanged.
- [ ] 2.2 Add `src/a2a/` (skills, JSON-RPC dispatch and version check,
      `SendMessage`, the tool-reply mapping, task builders, the card
      builder) and route `/a2a` in the handler with the shared method
      check, rate limit and bounded body.
- [ ] 2.3 Tests for every `a2a-endpoint` scenario, including the
      `Accept: application/json`-only request reaching
      `TASK_STATE_COMPLETED`. The PR body records the mutation check:
      forwarding the caller's headers turns that test red.
- [ ] 2.4 `agent-card.test.ts`: the file snapshot, the in-process parity of
      `tools/list` with the literal skill ids and `REMOTE_TOOL_NAMES`, and
      the content-hash version changing with a skill description.
- [ ] 2.5 Add the `kaiord.com/a2a` route; the config test pins exactly the
      two exact patterns, with `workers_dev` false.
- [ ] 2.6 The smoke script picks the `/a2a` check set by path, each check
      covered with a fake fetch.
- [ ] 2.7 The mcp-worker `detect-changes` filter covers both card paths.
- [ ] 2.8 Gates under `hg-gate.sh`, one at a time: mcp-worker test
      (including workerd), lint, the `--dry-run` build under 3 MiB, and
      `pnpm test:scripts`.

## 3. WAF widening, before the deploy (Pablo)

- [ ] 3.1 Write `.omc/scripts/waf-widen-a2a.sh`: assert the current rule
      exactly, patch only `expression`, and save the before and after JSON.
- [ ] 3.2 **Pablo** runs it with a scoped Zone WAF Edit token, then revokes
      the token.
- [ ] 3.3 A burst on `/a2a` shows about 10 non-`429` replies then `429`s;
      `/mcp` still throttles, and the `/mcp` smoke still passes.

## 4. Deploy and CPU (Pablo, then agent)

- [ ] 4.1 **Pablo** deploys `kaiord-mcp` from an up-to-date `main`.
- [ ] 4.2 **Pablo** lists the zone routes: `kaiord.com/a2a` on `kaiord-mcp`
      and failing closed, `/mcp` unchanged, `kaiord.com/*` failing open.
- [ ] 4.3 `GetTask` on `/a2a` returns JSON-RPC `-32001` (the Worker, not
      Pages), the `/a2a` smoke passes, and the `/mcp` smoke passes.
- [ ] 4.4 CPU: 20 paced `/mcp` calls and 20 paced `/a2a` calls with the
      largest smoke FIT, all `200` with no Error 1102; durations recorded.

## 5. Card and public docs, only after 4 passes (PR `feat/a2a-discovery`)

- [ ] 5.1 `git mv` the snapshot to
      `packages/landing/public/.well-known/agent-card.json` and retarget the
      snapshot test; landing tests pin the interface, the skill count and
      the absence of security fields.
- [ ] 5.2 Add the `/a2a` anchor to the api-catalog, the endpoint and the
      combined rate budget to `auth.md`, and an AI-catalog entry.
- [ ] 5.3 Add an `## A2A` section to the MCP tools page and name the
      endpoint in `CLAUDE.md`'s no-backend statement.
- [ ] 5.4 Require the card in the deploy artifact (`test -f`).
- [ ] 5.5 Add the live-guard rows: the card, a `SendMessage` reaching
      `TASK_STATE_COMPLETED`, and card skills equal to live `tools/list`.
- [ ] 5.6 Live checks pass, the guard workflow is green, and the
      isitagentready scan shows `a2aAgentCard` passing; level recorded.

## 6. `_a2a` SVCB record (optional, Pablo)

- [ ] 6.1 Write `.omc/scripts/dns-a2a-svcb.sh`, mirroring the `_mcp`
      record.
- [ ] 6.2 **Pablo** runs it with a scoped DNS token, then revokes it.
- [ ] 6.3 The record resolves with `AD == true` five times a minute apart,
      and `_mcp` still does.

## 7. Close

- [ ] 7.1 Archive the change, promote `a2a-endpoint`, sync the two
      modified specs, and regenerate the archive index and specs inventory.
