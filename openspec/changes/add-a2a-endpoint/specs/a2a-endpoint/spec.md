## ADDED Requirements

### Requirement: Stateless A2A 1.0 JSON-RPC endpoint

`POST https://kaiord.com/a2a` SHALL serve A2A 1.0 (tag `v1.0.0`) over the JSON-RPC binding from the `kaiord-mcp` Worker. Every request SHALL build its own MCP server and transport, and nothing SHALL be stored between requests. Each skill SHALL run through an internal MCP dispatch that builds a fresh request carrying none of the caller's headers, so every remote MCP gate applies unchanged.

#### Scenario: A skill completes over A2A

- **WHEN** a client sends `SendMessage` with `A2A-Version: 1.0` and a data part `{"skill":"kaiord_list_formats"}`
- **THEN** the result SHALL be `{"task": ...}` with `status.state` `TASK_STATE_COMPLETED`
- **AND** `artifacts[0].parts[0].text` SHALL be non-empty

#### Scenario: The caller's Accept header does not reach the MCP transport

- **WHEN** a client sends that `SendMessage` with `Accept: application/json` only
- **THEN** the task SHALL reach `TASK_STATE_COMPLETED`, not an error

#### Scenario: MCP gates apply over A2A

- **WHEN** a client sends `kaiord_inspect` with a recorded-activity FIT file, or with an `input_file` argument
- **THEN** the task SHALL be `TASK_STATE_FAILED` and no file SHALL be read or stored

#### Scenario: Requests share no state

- **WHEN** two requests are handled
- **THEN** two MCP servers SHALL have been built

### Requirement: Skills are selected by an explicit data part

The skill SHALL be named by the first `data` part of the message, an object `{"skill": "<tool name>", ...arguments}` whose other keys are the tool's MCP arguments. The skills SHALL be exactly the eight remote MCP tools. A message without such a part, or naming an unknown skill, SHALL produce a task in `TASK_STATE_REJECTED` whose status message lists the skill ids and the data-part shape, and no tool SHALL run.

#### Scenario: Text-only message is rejected with guidance

- **WHEN** a client sends a message whose only part is text
- **THEN** the task SHALL be `TASK_STATE_REJECTED`
- **AND** its status message SHALL list the eight skill ids

#### Scenario: Unknown skill is rejected before dispatch

- **WHEN** a client names `kaiord_garmin_push`
- **THEN** the task SHALL be `TASK_STATE_REJECTED` and no MCP dispatch SHALL occur

### Requirement: A2A objects follow the 1.0 shapes

A task SHALL be `{id, contextId, status, artifacts?, history?}`. Its `id` SHALL be `k1.` followed by base64url of 12 random bytes and SHALL embed no argument. `contextId` SHALL be the client's value when it matches `^[A-Za-z0-9_-]{1,64}$`, a random base64url value when absent, and any other client value SHALL give `-32602`. `status` SHALL be `{state, message, timestamp}`, with the agent message carrying `messageId`, `role: "ROLE_AGENT"`, `parts`, `contextId` and `taskId`. Artifacts SHALL carry `artifactId` and map the MCP `content[]` one to one as text parts with `mediaType: "text/plain"`. `history` SHALL echo only `messageId`, `role`, `parts` and `contextId` of the user message.

#### Scenario: Client context id is echoed

- **WHEN** a client sends `contextId: "ctx-1"`
- **THEN** the task's `contextId` SHALL be `ctx-1`

#### Scenario: Malformed context id is rejected

- **WHEN** a client sends a `contextId` of 65 characters
- **THEN** the reply SHALL be JSON-RPC error `-32602` with no task

#### Scenario: Absent context id is generated

- **WHEN** a client omits `contextId`
- **THEN** the task SHALL carry a non-empty base64url `contextId`

### Requirement: Methods and errors reflect that tasks are not retained

`SendMessage` with `message.taskId` set and `GetTask` for any id SHALL return `-32001`. `CancelTask` SHALL return `-32002`. `ListTasks` SHALL return `{tasks: [], nextPageToken: "", pageSize, totalSize: 0}`. `SendStreamingMessage`, `SubscribeToTask` and `GetExtendedAgentCard` SHALL return `-32004`. The four push-notification configuration methods SHALL return `-32003`. Any other method SHALL return `-32601`. Every A2A error SHALL carry `data` as an array whose first element is a `google.rpc.ErrorInfo` with domain `a2a-protocol.org`.

#### Scenario: Task lookup is not found

- **WHEN** a client sends `GetTask` with any id
- **THEN** the reply SHALL be error `-32001`

#### Scenario: Continuing a task is not found

- **WHEN** a client sends `SendMessage` with `message.taskId` set
- **THEN** the reply SHALL be error `-32001` and no tool SHALL run

#### Scenario: Cancel is not possible

- **WHEN** a client sends `CancelTask`
- **THEN** the reply SHALL be error `-32002`

#### Scenario: Task listing is empty

- **WHEN** a client sends `ListTasks`
- **THEN** the result SHALL have an empty `tasks` array and `totalSize` 0

#### Scenario: Unsupported capabilities are refused

- **WHEN** a client sends `SendStreamingMessage` or `CreateTaskPushNotificationConfig`
- **THEN** the replies SHALL be errors `-32004` and `-32003` respectively

#### Scenario: Unknown method

- **WHEN** a client sends method `Foo`
- **THEN** the reply SHALL be error `-32601`

### Requirement: Only A2A 1.0 is accepted

The endpoint SHALL accept a request only when `A2A-Version` (header or query parameter) is exactly `1.0`. An absent or empty value means 0.3. Any other value SHALL return `-32009` with an `ErrorInfo` whose reason is `VERSION_NOT_SUPPORTED` and whose metadata names `1.0` as supported.

#### Scenario: Missing version is rejected

- **WHEN** a client sends `SendMessage` without `A2A-Version`
- **THEN** the reply SHALL be error `-32009` and no tool SHALL run

#### Scenario: Query parameter is accepted

- **WHEN** a client posts to `/a2a?A2A-Version=1.0` without the header
- **THEN** the request SHALL be processed

### Requirement: Tool replies map to task states or errors

A `200` internal reply with an `isError: true` result SHALL give `TASK_STATE_FAILED` with the tool's text as the status message, and `isError: false` SHALL give `TASK_STATE_COMPLETED`. A non-`200` or non-JSON internal reply SHALL give JSON-RPC `-32603` with no task. A `200` internal reply carrying a JSON-RPC error SHALL give `-32602` with no task.

#### Scenario: Tool error becomes a failed task

- **WHEN** `kaiord_validate` returns `isError: true`
- **THEN** the task SHALL be `TASK_STATE_FAILED` with the tool's text as its status message

#### Scenario: Transport failure is an internal error

- **GIVEN** an injected server build that throws
- **WHEN** a client sends a valid `SendMessage`
- **THEN** the reply SHALL be error `-32603` with no `result`

#### Scenario: Internal JSON-RPC error is invalid params

- **GIVEN** an injected server whose `tools/call` returns a JSON-RPC error
- **WHEN** a client sends a valid `SendMessage`
- **THEN** the reply SHALL be error `-32602` with no `result`

### Requirement: A2A requests are bounded like MCP requests

`/a2a` SHALL reject a body over 65,536 bytes with `413` before parsing, with or without `content-length`, SHALL reject a batch with `400`, SHALL answer `GET` with `405` and `Allow: POST`, and SHALL share the per-IP rate limiter and the edge rate bucket with `/mcp`.

#### Scenario: Oversized A2A body is rejected

- **WHEN** a client streams a 65,537-byte body to `/a2a` without `content-length`
- **THEN** the response SHALL be `413`

#### Scenario: A body at the limit is accepted

- **WHEN** a client posts a valid request padded to exactly 65,536 bytes
- **THEN** the response SHALL NOT be `413`

#### Scenario: A2A batch is rejected

- **WHEN** a client posts a JSON array of two `SendMessage` requests
- **THEN** the response SHALL be `400`

#### Scenario: GET is not allowed

- **WHEN** a client sends `GET /a2a`
- **THEN** the response SHALL be `405` with `Allow: POST`

### Requirement: The agent card is generated and cannot drift

`/.well-known/agent-card.json` SHALL be rendered from the literal skill list and pinned by a single committed snapshot file. Its skill ids SHALL equal the in-process `tools/list` names and the remote tool allowlist. Its `version` SHALL be `1.0.0+` followed by 12 hex characters of the SHA-256 of the card with `version` omitted. It SHALL carry every A2A 1.0 required field (`name`, `description`, `version`, `supportedInterfaces`, `capabilities`, `defaultInputModes`, `defaultOutputModes`, `skills` with `id`, `name`, `description`, `tags`), an interface `{url: "https://kaiord.com/a2a", protocolBinding: "JSONRPC", protocolVersion: "1.0", transport: "JSONRPC"}`, all capabilities false, and no `securitySchemes` or `security`.

#### Scenario: Card skills equal the live tools

- **WHEN** the card's skill ids are compared with `tools/list` from the internal dispatch
- **THEN** the sorted lists SHALL be equal

#### Scenario: Version follows content

- **WHEN** a skill description changes
- **THEN** the rendered card's `version` SHALL change

#### Scenario: Card declares no security

- **WHEN** the published card is parsed
- **THEN** it SHALL have no `securitySchemes` and no `security` field

### Requirement: A2A logging carries no content

On failure the endpoint SHALL log only the JSON-RPC method and the allowlisted skill id. It SHALL NOT log arguments, results or the context id.

#### Scenario: Failing skill logs no content

- **WHEN** a skill call fails on malformed input
- **THEN** the log entry SHALL contain the method and skill id
- **AND** it SHALL NOT contain any part of the input or the context id

### Requirement: Discovery follows a live A2A endpoint

The agent card, the api-catalog `/a2a` anchor, the `auth.md` and AI-catalog entries and the public A2A docs SHALL be published only after the deployed Worker passes its `/a2a` production smoke. The route SHALL be the exact pattern `kaiord.com/a2a` with `request_limit_fail_open` false; a path under `/a2a/` SHALL fall through to the site.

#### Scenario: Card is unpublished until the smoke passes

- **WHEN** the Worker change merges
- **THEN** the card snapshot SHALL live outside `packages/landing/public`

#### Scenario: Route is exact

- **WHEN** the Worker's config test reads `wrangler.toml`
- **THEN** the routes SHALL be exactly `kaiord.com/mcp` and `kaiord.com/a2a` and `workers_dev` SHALL be false

#### Scenario: The smoke script gates discovery

- **WHEN** the `/a2a` smoke runs against an endpoint that fails any check
- **THEN** it SHALL exit non-zero and name the failing check
