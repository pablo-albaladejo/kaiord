## Why

The owner rule for agent discovery is that a document may only describe
something real. The remote MCP endpoint (`add-remote-mcp-endpoint`) made the
MCP Server Card, the API catalog and DNS-AID true. The A2A Agent Card is the
last discovery check that a real, anonymous, stateless service can make true:
it describes an agent that other agents call over A2A.

isitagentready lists `a2aAgentCard` as a requirement for its level 5
("Agent-Native"). kaiord.com is at 13/23, level 4. The three OAuth and
`auth.md` checks stay failing on purpose: Kaiord has no accounts, and a fake
authorization server would be dishonest. A2A is therefore the last honest
point (14/23). A sibling site reached level 5 with `authMd` failing, so level 5
is plausible but not proven; it is measured, not promised.

Publishing a card without an endpoint behind it would send agents to a URL
that does not exist. This change builds the endpoint first, then the card.

## What Changes

- **A2A endpoint.** `POST https://kaiord.com/a2a` serves **A2A 1.0 only**
  over the JSON-RPC binding, from the existing `kaiord-mcp` Worker on a
  second exact route.
  - It is deterministic. No language model runs behind it: the client picks
    a skill explicitly with a data part `{"skill":"<tool name>", ...arguments}`.
  - It has 8 skills, one per remote MCP tool, with the same names and the
    same argument names.
  - Each skill runs through an internal MCP dispatch, so every MCP gate
    applies unchanged: structured workouts only, path keys rejected, the
    FIT output cap.
  - A task finishes inside the reply. Nothing is retained, so `GetTask`
    and `CancelTask` answer with the A2A "task not found" error, and
    `ListTasks` is always empty. Non-blocking `SendMessage`
    (`returnImmediately`) needs stored tasks, so it is refused as
    unsupported before any tool runs.
  - The same 65,536-byte body cap, the batch rejection and the per-IP rate
    limit apply.
- **WAF.** The Cloudflare rate rule that throttles `/mcp` before any Worker
  runs is widened to `/mcp` and `/a2a`, as one combined bucket.
- **Agent Card.** `/.well-known/agent-card.json` is generated from the skill
  list, pinned by a file snapshot, and versioned by a content hash. It is
  published only after the endpoint passes its production smoke test.
- **Discovery and docs.** The API catalog gains an `/a2a` anchor, `auth.md`
  and the AI catalog name the endpoint, and the MCP tools page gains an A2A
  section.
- **Privacy.** The privacy policy discloses `/a2a` before any route exists:
  the same tools, the same terms, tasks not retained.
- **DNS (optional).** An `_a2a._agents.kaiord.com` SVCB record mirroring the
  `_mcp` record. It does not change the score.
- **Live guard.** The daily `agent-surfaces` guard gains the card, a real
  `SendMessage`, and a card-versus-live-tools comparison.

## Impact

- **Packages:**
  - `@kaiord/mcp-worker` (private): a stateless MCP dispatch, the A2A
    handler under `src/a2a/`, a second route, smoke checks.
  - `@kaiord/landing`: the agent card, the api-catalog anchor, `auth.md`,
    the AI-catalog entry.
  - `@kaiord/docs`: privacy policy and the A2A section of the tools page.
- **Unchanged:** `@kaiord/mcp` and its public API; `@kaiord/core`. The A2A
  handler is a second driving adapter over the same MCP composition.
- **Breaking changes:** none. `/mcp` keeps its behaviour.
- **Infrastructure (Pablo only):** the WAF widening, the `wrangler deploy`
  that adds the `kaiord.com/a2a` route, and the optional SVCB record.
- **Specs:**
  - `a2a-endpoint` (ADDED);
  - `remote-mcp-endpoint` (MODIFIED: the WAF bucket is shared with `/a2a`);
  - `privacy-policy` (ADDED requirement: the A2A disclosure).

## Out of scope

- Streaming (`SendStreamingMessage`, `SubscribeToTask`), push notifications
  and the extended agent card. They answer with the A2A "unsupported" error.
- A language model choosing skills from free text.
- Stored tasks, task history across requests, and resumable tasks.
- OAuth, accounts, `securitySchemes`. The endpoint is anonymous.
- A2A 0.3. A request without `A2A-Version: 1.0` gets the A2A "version not
  supported" error.
- Garmin and health tools, which stay local-only as for MCP.
