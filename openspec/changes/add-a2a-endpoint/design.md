## Context

`kaiord-mcp` is a Cloudflare Worker on the Free plan, bound to the exact
route `kaiord.com/mcp`. It builds a fresh MCP server per request over the
stateless Streamable HTTP transport, caps the body at 65,536 bytes, rejects
batches and rate-limits per IP. A WAF rate rule throttles `/mcp` before the
Worker runs. `kaiord-agent-edge` holds `kaiord.com/*`, fails open and fronts
GitHub Pages.

### Specification pin

A2A **1.0.0**, tag `v1.0.0`, commit
`173695755607e884aa9acf8ce4feed90e32727a1` (2026-03-12):

- proto: <https://github.com/a2aproject/A2A/blob/v1.0.0/specification/a2a.proto>
- prose: <https://github.com/a2aproject/A2A/blob/v1.0.0/docs/specification.md>

`https://a2a-protocol.org/latest/` moves; this change cites the tag. The
facts below were checked against the tag and against a sibling card that the
isitagentready scanner accepts. Two deviations in the sibling implementation
are **not** copied: it sends `-32004` for the push-notification methods
(the spec says `-32003`), and its error `data` is a plain object (the spec
says an `ErrorInfo` array).

## Goals / Non-Goals

**Goals:** a real A2A 1.0 JSON-RPC endpoint over the eight remote tools, with
the same gates as `/mcp`, and an agent card that cannot drift from it.

**Non-Goals:** streaming, push notifications, an extended card, a language
model, stored tasks, OAuth, A2A 0.3.

## Decisions

### D1. Same Worker, second exact route

`/a2a` is served by `kaiord-mcp` on the exact route `kaiord.com/a2a`. One
bundle, one body cap, one rate-limiter binding, one observability-off config
and one deploy; the tools cannot diverge between protocols.

- _Alternative:_ a separate `kaiord-a2a` Worker. A second 2.7 MiB bundle, a
  second deploy, and room for skew. Kept as the fallback if the CPU check
  in task 4.4 fails.
- _Rejected:_ `kaiord-agent-edge`, a fail-open hot path for every page.

### D2. Internal MCP dispatch with a fresh request

`dispatchMcp(message, deps)` builds a server and a transport per call and a
**fresh** `Request` to `https://kaiord.com/mcp` with `POST`,
`content-type: application/json` and
`accept: application/json, text/event-stream`. It carries **none** of the
caller's headers. Every MCP gate (structured workouts only, path keys
rejected, the FIT output cap) runs unchanged, and `@kaiord/mcp` does not
change. Reusing the caller's request would hand an A2A client that sends
`Accept: application/json` the SDK's `406`.

- _Rejected:_ an in-memory MCP `Client` (an `initialize` handshake per
  request inside a 10 ms CPU budget); exporting the tool handlers from
  `@kaiord/mcp` (a public API change and a gate bypass).

### D3. Skill selection

There is no model, so the client names the skill. The first `data` part of
the message must be an object `{"skill": "<tool name>", ...arguments}`,
with the arguments named as in the tool's MCP input schema. A message with
no such part, or naming an unknown skill, gets a task in
`TASK_STATE_REJECTED` whose status message lists the skill ids and the shape
of the data part. Skill ids are checked against the literal list before any
dispatch.

### D4. A2A 1.0 objects

- `SendMessage` returns `result: {"task": Task}`.
- `Task` is `{id, contextId, status, artifacts?, history?}`.
- `id` is `k1.` followed by base64url of 12 random bytes. No argument is
  embedded in it.
- `contextId` is the client's value when it matches
  `^[A-Za-z0-9_-]{1,64}$`; any other client value gives `-32602`. Absent, it
  is a random base64url value.
- `status` is `{state, message, timestamp}` with an ISO 8601 timestamp.
- The agent message is `{messageId, role: "ROLE_AGENT", parts: [{text}],
contextId, taskId}`.
- `artifacts` is `[{artifactId: "result", name: <skill>, parts: [...]}]`,
  mapping the MCP `content[]` one to one as `{text, mediaType:
"text/plain"}`.
- `history` echoes the user message using allowlisted fields only
  (`messageId`, `role`, `parts`, `contextId`).

### D5. Methods, version and errors

| Request                                                    | Reply                                                    |
| ---------------------------------------------------------- | -------------------------------------------------------- |
| `SendMessage`                                              | a task (D4, D6)                                          |
| `SendMessage` with `message.taskId` set                    | `-32001` TaskNotFound ("tasks are not retained")         |
| `GetTask`, any id                                          | `-32001` TaskNotFound                                    |
| `CancelTask`, any id                                       | `-32001` TaskNotFound                                    |
| `SendMessage` with `configuration.returnImmediately: true` | `-32004` UnsupportedOperation, before any tool runs      |
| `ListTasks`                                                | `{tasks: [], nextPageToken: "", pageSize, totalSize: 0}` |
| `SendStreamingMessage`, `SubscribeToTask`                  | `-32004` UnsupportedOperation                            |
| `GetExtendedAgentCard`                                     | `-32004` UnsupportedOperation                            |
| the four `*TaskPushNotificationConfig*` methods            | `-32003` PushNotificationNotSupported                    |
| any other method                                           | `-32601` Method not found                                |
| `A2A-Version` (header or query) other than `1.0`           | `-32009` VersionNotSupported                             |

An absent or empty version means 0.3 (spec §3.6), so it is rejected. Every
A2A error carries `data` as an array whose first element is a
`google.rpc.ErrorInfo` (`@type`, `reason` such as `VERSION_NOT_SUPPORTED` or
`TASK_NOT_FOUND`, `domain: "a2a-protocol.org"`); the version error adds
`metadata: {"supported": "1.0"}`.

`CancelTask` returns `-32001`: spec §3.1.5 reserves `-32002` for a task
that exists but is terminal, and no task id exists here. The error message
says that tasks are not retained.

Non-blocking mode (spec §3.2.2) requires returning an in-progress task the
caller later polls with `GetTask`. Without stored tasks that is impossible,
so a request asking for it is refused before any tool runs, rather than
answered with a completed task that breaks the contract. The default
blocking mode is served normally.

### D6. Mapping the internal tool reply

`call-tool.ts` maps every reply `dispatchMcp` can produce:

- **(a)** a `200` JSON-RPC `result`: `isError: true` gives
  `TASK_STATE_FAILED` with the tool's text as the status message;
  `isError: false` gives `TASK_STATE_COMPLETED`.
- **(b)** a non-`200` or non-JSON reply (the transport's `406`/`415`, or a
  `500` from a thrown server build) gives JSON-RPC `-32603` Internal error
  with **no task**.
- **(c)** a `200` JSON-RPC `error` gives `-32602` Invalid params with no
  task. In production the SDK turns tool errors into `isError` results and
  skill ids are checked first, so this is reachable only through an
  injected server; a code comment says so.

### D7. Limits

The same streamed 65,536-byte cap answers `413` before parsing, with or
without `content-length`. A batch gets `400`. `GET` gets `405` with
`Allow: POST`. The `MCP_RATE_LIMITER` binding is shared. The WAF bucket is
**combined** across `/mcp` and `/a2a`: 10 requests per 10 s per IP, then a
10 s block, keyed on `ip.src` and `cf.colo.id`. Cloudflare keeps the
counter per data center (`cf.colo.id` is a mandatory characteristic on
this plan), so a client reaching several data centers gets one budget in
each. The guarantee is therefore per IP per data center, and the docs say
so; the Worker's own limiter remains a second layer.

### D8. The agent card

Generated, committed and pinned by a file snapshot.

- `src/a2a/skills.ts` lists the eight skills with their ids **written out
  literally**, plus name, description, `tags` (required in 1.0) and
  examples. The handler dispatches on this list.
- `buildAgentCard()` renders the card; only tests import it.
- `version` is `"1.0.0+"` plus the first 12 hex characters of the SHA-256 of
  the canonical card JSON with `version` omitted. Any skill change changes
  it; nobody bumps it by hand.
- Interface: `{url: "https://kaiord.com/a2a", protocolBinding: "JSONRPC",
protocolVersion: "1.0"}`, exactly the 1.0 `AgentInterface`. The 0.3
  `transport` field is left out: ProtoJSON parsers reject unknown fields by
  default, so it could make the card unreadable to strict 1.0 clients. The
  accepted sibling card carries it, so if the scan after publishing fails
  `a2aAgentCard` on the interface alone, adding it back is the documented
  fallback.
- `capabilities` are all false. There are no `securitySchemes` or
  `security` fields.
- `defaultInputModes: ["application/json", "text/plain"]`,
  `defaultOutputModes: ["text/plain"]`.
- The description says: A2A 1.0 only (0.3 clients get -32009);
  deterministic, no AI model; tasks finish in the reply and are not
  retained.
- The snapshot first lives at `packages/mcp-worker/test/agent-card.snapshot.json`
  so Pages cannot publish it early. After the production smoke passes it
  is moved with `git mv` to `packages/landing/public/.well-known/agent-card.json`
  and the snapshot test is retargeted. There is one file, never a copy.

- _Rejected:_ a hand-written card (the `server-card.json` version drift
  already happened once); a card served by the Worker (a fail-closed route
  spending CPU on crawler GETs).

### D9. Logging

Content-free: on failure only, the method and the allowlisted skill id.
Never arguments, results or the context id.

### D10. Deploy-first ordering

The card and the public A2A docs merge only after the deployed Worker passes
its production smoke. Written into `packages/mcp-worker/AGENTS.md`.

### D11. Exact route, failing closed

`kaiord.com/a2a` is exact and `request_limit_fail_open` is false. `/a2a/...`
falls through to agent-edge and gets the Pages 404, which is documented.

## Risks / Trade-offs

- **The scanner's exact rule is unpublished** → the card carries every 1.0
  required field; the scan after publishing checks `serviceUrl`,
  `hasSecurity` and `skillCount`, and D8 names the one fallback.
- **The card drifts from the server** → literal skill ids, an in-process
  parity test against `tools/list`, a content-hash version, one snapshot
  file, and a daily live comparison of card skills with `tools/list`.
- **CPU on the Free plan** → the same payload is measured on `/mcp` and on
  `/a2a`; a clearly worse `/a2a` reopens D1 or D2.
- **One bad deploy takes down both protocols** → smoke tests on both paths
  after every deploy, and a documented `wrangler rollback`.
- **The combined WAF bucket** → `auth.md` and the docs state the combined
  budget with the same numbers the WAF script asserts.

## Migration Plan

Privacy disclosure → Worker code (merging deploys nothing) → WAF widening
(Pablo) → deploy (Pablo) → card and docs → scan → optional SVCB record
(Pablo). Rollback: `wrangler rollback` of `kaiord-mcp`, then revert the
discovery PR; the WAF widening is harmless without a route.

## Open Questions

None. `CancelTask` returns `-32001` (D5), as the pinned spec requires for
an id that does not exist; settled in review.
