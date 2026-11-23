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
order, as `{ outcome, usage? }`: one per attempt of a generate run (`ok`,
`invalid` for an output that did not validate, `truncated` for one cut at the
token limit, `error` for a Provider or transport failure, `stopped` for an
abort), and one per model step of a chat turn (`ok` for a finished step, and
`error` or `stopped` for a step still running when the turn threw or
stopped). `usage` SHALL be the Provider-reported usage of that request
(`promptTokens` counting every input token, `completionTokens`, and
`cacheReadTokens` / `cacheWriteTokens` when reported), and SHALL be absent
when the Provider reported none. A run's `usage` SHALL be the sum over all its
requests.

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
- **THEN** `steps`, `toolNames`, and the token counts SHALL reflect the steps that finished; tokens of a step cut mid-stream are not reported by the provider and SHALL NOT be estimated; the cut step SHALL appear in `requests` with no `usage`

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
