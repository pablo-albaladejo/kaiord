## MODIFIED Requirements

### Requirement: Telemetry port with a minimal event set

`@kaiord/ai/observability` SHALL export an `AiTelemetrySink` port
(`{ emit(event) }`) and an `AiTelemetryEvent` union of exactly three events:
`run_finished` (traceId, agentId, agentVersion, promptId, promptVersion,
provider, modelId, purpose, usage, latencyMs, requests), `run_failed` (the
same identity fields plus `error: { name, retriable }` and `requests`), and
`chat_turn_finished` (traceId, promptVersion, provider, modelId, steps,
toolNames, status, inputTokens, outputTokens, latencyMs, requests). Field
naming SHALL stay mappable to OTel GenAI semantic conventions without
introducing an OTel dependency. The agent runtime SHALL emit one of the run
events for every run, defaulting to a no-op sink when none is injected; the
chat engine SHALL emit exactly one `chat_turn_finished` per turn when a sink
is configured, with `status` one of `complete`, `pending_action`,
`step_limit`, `aborted`, `timeout`, or `error`.

`requests` SHALL list every request the run or turn sent to the Provider, in
order, as `{ outcome, usage?, estimated? }`: one per attempt of a generate
run (`ok`, `invalid` for an output that did not validate, `truncated` for one
cut at the token limit, `error` for a Provider or transport failure, the chat
inactivity watchdog included, `stopped` for a stop the athlete asked for),
and one per model step of a chat turn (`ok` for a finished step, `error` for
a step still running when the turn threw or timed out, `stopped` for one the
athlete stopped). `usage` SHALL be the Provider-reported usage of that
request (`promptTokens` counting every input token, `completionTokens`, and
`cacheReadTokens` / `cacheWriteTokens` when reported). The installed AI SDK
reports usage only with a request's final chunk, so a request cut before it
(a Stop, the watchdog, a stream dropped after output began) SHALL carry
`estimated: true` and a `usage` estimated at 3 characters a token from the
text of the request (system prompt and messages; documents left out) and of
the output streamed before the cut. `usage` SHALL be absent only when the
Provider answered with an error before any output. A run's `usage` SHALL be
the sum over all its requests.

#### Scenario: Every run emits exactly one event

- **GIVEN** a runtime configured with a telemetry sink
- **WHEN** a generate run completes or fails
- **THEN** exactly one `run_finished` or `run_failed` event SHALL be emitted carrying the agent id/version, prompt id/version, provider, model, purpose, latency and requests

#### Scenario: Every chat turn emits exactly one event

- **GIVEN** a chat agent configured with a telemetry sink
- **WHEN** a turn completes, pauses for confirmation, is stopped, times out, or throws
- **THEN** exactly one `chat_turn_finished` event SHALL be emitted with the matching `status`, and a sink that throws SHALL NOT fail the turn

#### Scenario: A failed or stopped chat turn reports its finished steps

- **GIVEN** a chat turn that finished one step, then threw a provider error, was stopped, or went idle past the inactivity watchdog
- **WHEN** its `chat_turn_finished` event is emitted
- **THEN** `steps`, `toolNames`, and the token counts SHALL reflect the steps that finished, and the cut step SHALL appear in `requests` as `error` (thrown after output began, or timed out) or `stopped` with `estimated: true` and an estimated `usage`, or as `error` with no `usage` when the Provider answered with an error before any output

#### Scenario: A request cut mid-stream is estimated, never zero

- **GIVEN** a chat step or a streamed generate attempt that streamed output and was then cut by the watchdog, a dropped connection or a Stop
- **WHEN** the event is emitted
- **THEN** the request SHALL be `error` for the watchdog or the dropped connection and `stopped` for the Stop, with `estimated: true` and `usage` of `ceil(request characters / 3)` input and `ceil(streamed characters / 3)` output tokens

#### Scenario: A validation retry is reported with its usage

- **GIVEN** a generate run whose first attempt returns an output that does not validate and whose second passes
- **WHEN** its `run_finished` event is emitted
- **THEN** `requests` SHALL be `[{ outcome: "invalid", usage }, { outcome: "ok", usage }]` with each attempt's reported usage, and `usage` SHALL be their sum

#### Scenario: A failed run reports every billed attempt

- **GIVEN** a generate run whose every attempt returns an output that does not validate
- **WHEN** its `run_failed` event is emitted
- **THEN** `requests` SHALL list each attempt with the usage the Provider reported for it

#### Scenario: A Provider failure with no usage is unmeasured

- **GIVEN** a generate attempt that fails with a Provider error before any usage is reported
- **WHEN** the run's event is emitted
- **THEN** that attempt SHALL appear as `{ outcome: "error" }` with no `usage`
