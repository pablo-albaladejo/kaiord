> Synced: 2026-10-30 (add-remote-mcp-endpoint)

# Remote MCP Endpoint

## Purpose

Serve the stateless subset of the Kaiord MCP tools over Streamable HTTP at `https://kaiord.com/mcp`, so hosted agents can convert and validate structured workouts without a local install, while keeping account, health and recorded data out of the network path.

## Requirements

### Requirement: Stateless remote MCP endpoint

Kaiord SHALL serve MCP over stateless Streamable HTTP at `https://kaiord.com/mcp`. Each `POST` SHALL be handled by a server built for that request alone. The endpoint SHALL keep no session and SHALL store no request content. Any method other than `POST` on `/mcp` SHALL return `405` with `Allow: POST`.

#### Scenario: Tool listing over HTTP

- **WHEN** an MCP client sends `tools/list` as a `POST` to `https://kaiord.com/mcp` with `Accept: application/json, text/event-stream`
- **THEN** the response SHALL be `200` with a JSON-RPC result listing the remote tools

#### Scenario: Requests share no state

- **GIVEN** two consecutive `POST` requests
- **WHEN** the second is handled
- **THEN** it SHALL be served by a server instance different from the first
- **AND** no response SHALL carry an `mcp-session-id` header

#### Scenario: Other methods are rejected

- **WHEN** a client sends `GET https://kaiord.com/mcp`
- **THEN** the response SHALL be `405` with the header `Allow: POST`

### Requirement: The remote toolset is exactly the stateless tools

The remote server SHALL register exactly these tools: `kaiord_list_formats`, `kaiord_get_format_spec`, `kaiord_convert`, `kaiord_validate`, `kaiord_inspect`, `kaiord_diff`, `kaiord_extract_workout` and `kaiord_round_trip_validate`. It SHALL NOT register any `kaiord_garmin_*` tool or any health tool. No remote tool schema SHALL advertise a file-path parameter (`input_file`, `output_file`, `file1`, `file2`), and a remote call that carries one SHALL fail with a tool error naming it, even when valid inline content is also present. A tool added to the local server SHALL NOT appear remotely unless it is added to this list. The remote server SHALL register no prompt, SHALL register only the `krd-format-spec`, `krd-schema` and `supported-formats` resources, and its instructions text SHALL name no tool outside the list.

#### Scenario: Remote listing equals the allowlist

- **WHEN** the remote server answers `tools/list`
- **THEN** the tool names SHALL equal the eight names above, with no extra and no missing name

#### Scenario: Prompts, resources and instructions match the toolset

- **WHEN** the remote server answers `initialize`, `prompts/list` and `resources/list`
- **THEN** the prompt list SHALL be empty
- **AND** the resource list SHALL contain exactly the three resources above
- **AND** the instructions text SHALL NOT contain `garmin` or `health`

#### Scenario: Account and health tools stay local

- **WHEN** a client calls `kaiord_garmin_push` or `kaiord_get_health_summary` on the remote endpoint
- **THEN** the call SHALL fail as an unknown tool and no request SHALL reach any third-party account

#### Scenario: Paths are never read remotely

- **WHEN** a remote `kaiord_convert` call includes `input_file` and no `input_content`
- **THEN** the call SHALL fail with a tool error naming `input_file`
- **AND** a spy on the file-reading helpers SHALL record no call

#### Scenario: A path next to valid content is still rejected

- **WHEN** a remote `kaiord_convert` call includes valid `input_content` and an `output_file`
- **THEN** the call SHALL fail with a tool error naming `output_file` and SHALL NOT be converted

### Requirement: Remote tools accept structured workouts only

Every remote tool that takes content SHALL decode it and SHALL accept only a document of KRD type `structured_workout` with no `sessions`, `laps`, `records` or `events`, and with no `extensions` namespace outside the remote workout allowlist (which SHALL NOT contain `health`, `course` or `course_points`). Any other document SHALL be rejected with a tool error naming the type or the offending field, and SHALL NOT be stored, logged or returned. This SHALL apply in every input format. The local server SHALL keep accepting all types.

#### Scenario: A health FIT file is rejected remotely

- **WHEN** a remote `kaiord_inspect` call sends a base64 FIT sleep record
- **THEN** the call SHALL fail with an error naming `sleep_record`
- **AND** no summary of its content SHALL be returned

#### Scenario: A recorded activity is rejected remotely

- **WHEN** a remote `kaiord_convert` call sends a FIT activity with heart-rate records
- **THEN** the call SHALL fail with an error naming `recorded_activity`

#### Scenario: A workout label does not admit recorded data

- **WHEN** a remote call sends a KRD with `type: "structured_workout"` that also carries `records` with positions and heart rate
- **THEN** the call SHALL fail with an error naming `records`

#### Scenario: A workout label does not admit health extensions

- **WHEN** a remote call sends a KRD with `type: "structured_workout"` and an `extensions.health` payload
- **THEN** the call SHALL fail with an error naming `extensions.health`

#### Scenario: The local server is unchanged

- **WHEN** the local server's `kaiord_inspect` reads the same sleep record
- **THEN** it SHALL return the summary it returns today

### Requirement: Remote tools take and return inline content

Every remote tool SHALL accept its input as inline content, base64 for FIT. A FIT output SHALL be returned as base64 text. The FIT written by the remote endpoint SHALL decode to the same KRD as the FIT written by the local server for the same input.

#### Scenario: KRD to FIT round-trips through the endpoint

- **GIVEN** a KRD structured workout with three steps
- **WHEN** it is converted to FIT through the remote endpoint and the base64 result is decoded locally
- **THEN** the decoded KRD SHALL have the same name and three steps
- **AND** the FIT bytes SHALL equal the local server's output for the same input

#### Scenario: Round-trip validation writes FIT remotely

- **WHEN** `kaiord_round_trip_validate` is called remotely with a base64 FIT workout
- **THEN** it SHALL succeed using the capped FIT writer

#### Scenario: Inspect takes inline FIT

- **WHEN** `kaiord_inspect` is called remotely with a base64 FIT in `input_content`
- **THEN** it SHALL return the same summary the local server returns for that file

### Requirement: Request size and rate are bounded

The endpoint SHALL reject a request body larger than 65,536 bytes with `413` before parsing it, whether or not `content-length` is present or truthful. It SHALL reject a JSON-RPC batch (an array body) with `400`. The endpoint SHALL rate-limit requests per client IP and SHALL answer an over-limit request with `429`. Rate limiting SHALL include a control that runs before the Worker is invoked, so throttled traffic does not consume the account's shared daily Worker quota.

#### Scenario: Oversized body is rejected

- **WHEN** a client posts a 65,537-byte body to `/mcp`
- **THEN** the response SHALL be `413` and no tool SHALL run

#### Scenario: Missing content-length does not bypass the cap

- **WHEN** a client streams a 65,537-byte body without a `content-length` header
- **THEN** the response SHALL be `413`

#### Scenario: A body at the limit is accepted

- **WHEN** a client posts a valid `tools/list` request padded to exactly 65,536 bytes
- **THEN** the response SHALL NOT be `413`

#### Scenario: Batches are rejected

- **WHEN** a client posts a JSON array of two `tools/call` requests
- **THEN** the response SHALL be `400` and no tool SHALL run

#### Scenario: Over-limit client is throttled

- **GIVEN** a handler whose injected rate limiter reports the client IP over its limit
- **WHEN** it sends another request
- **THEN** the response SHALL be `429`

### Requirement: Remote requests are not logged

The endpoint SHALL NOT log or persist tool arguments or tool results. Error logs SHALL carry only the error class and the tool name. Persisted invocation logs SHALL be disabled.

#### Scenario: A failing call logs no content

- **WHEN** a remote tool call fails on malformed input
- **THEN** the log entry SHALL contain the tool name and the error class
- **AND** it SHALL NOT contain any part of the input content

#### Scenario: Invocation logs are off

- **WHEN** the Worker's `wrangler.toml` is checked by its config test
- **THEN** persisted invocation logs SHALL be disabled
- **AND** the Worker SHALL bind no storage (no KV, D1, R2 or Durable Object)

### Requirement: FIT writing fits a Worker isolate

The FIT writer SHALL accept an optional output cap that bounds the encoder's buffer reservation. The remote endpoint SHALL set it to 16 MiB for every FIT writer it builds. A writer created without the cap SHALL produce byte-identical output to the writer before this change.

#### Scenario: Capped writer works in production

- **GIVEN** the endpoint deployed to Cloudflare Workers
- **WHEN** a KRD workout is converted to FIT
- **THEN** the call SHALL succeed and SHALL NOT fail with `RangeError: Invalid array buffer max length`

#### Scenario: Uncapped writer is unchanged

- **WHEN** the existing FIT fixtures are encoded with a writer created without the cap
- **THEN** the bytes SHALL equal the bytes produced before this change

### Requirement: Discovery describes only a live endpoint

The MCP Server Card at `/.well-known/mcp/server-card.json`, the AI-catalog entry, the registry `remotes` entry and the DNS-AID record SHALL be published only after the post-deploy smoke test has passed against production. The Server Card SHALL name the server and its version and SHALL point its transport at `https://kaiord.com/mcp`. Rolling the endpoint back SHALL roll these documents back with it.

#### Scenario: Server Card points at the endpoint

- **WHEN** `https://kaiord.com/.well-known/mcp/server-card.json` is fetched
- **THEN** it SHALL be `200` JSON whose transport endpoint is `https://kaiord.com/mcp`
- **AND** a `tools/list` sent to that endpoint SHALL succeed

#### Scenario: The smoke script gates discovery

- **WHEN** the post-deploy smoke script runs against an endpoint that fails any of its checks
- **THEN** it SHALL exit non-zero and name the failing check

#### Scenario: Rollback removes discovery

- **WHEN** the `kaiord-mcp` route is removed
- **THEN** `/mcp` SHALL return `404`
- **AND** the change that removes the route SHALL also remove the Server Card, the AI-catalog entry and the registry `remotes` entry
