> Synced: 2026-07-09 (add-lab-extraction-agent)

# ai-observability Specification

## Purpose

Defines `@kaiord/ai/observability` — a minimal, redaction-safe telemetry port (`run_finished`/`run_failed` for agent runs, `chat_turn_finished` for chat turns, carrying ids, versions, and metrics only) with shipped console and ring-buffer sinks.

## Requirements

### Requirement: Telemetry port with a minimal event set

`@kaiord/ai/observability` SHALL export an `AiTelemetrySink` port
(`{ emit(event) }`) and an `AiTelemetryEvent` union of exactly three events:
`run_finished` (traceId, agentId, agentVersion, promptId, promptVersion,
provider, modelId, purpose, usage, latencyMs), `run_failed` (the same
identity fields plus `error: { name, retriable }`), and `chat_turn_finished`
(traceId, promptVersion, provider, modelId, steps, toolNames, status,
inputTokens, outputTokens, latencyMs). Field naming SHALL stay
mappable to OTel GenAI semantic conventions without introducing an OTel
dependency. The agent runtime SHALL emit one of the run events for every run,
defaulting to a no-op sink when none is injected; the chat engine SHALL emit
exactly one `chat_turn_finished` per turn when a sink is configured, with
`status` one of `complete`, `pending_action`, `step_limit`, `aborted`,
`timeout`, or `error`.

#### Scenario: Every run emits exactly one event

- **GIVEN** a runtime configured with a telemetry sink
- **WHEN** a generate run completes or fails
- **THEN** exactly one `run_finished` or `run_failed` event SHALL be emitted carrying the agent id/version, prompt id/version, provider, model, purpose, and latency

#### Scenario: Every chat turn emits exactly one event

- **GIVEN** a chat agent configured with a telemetry sink
- **WHEN** a turn completes, pauses for confirmation, is stopped, times out, or throws
- **THEN** exactly one `chat_turn_finished` event SHALL be emitted with the matching `status`, and a sink that throws SHALL NOT fail the turn

#### Scenario: A failed or stopped chat turn reports its finished steps

- **GIVEN** a chat turn that finished one step, then threw a provider error, was stopped, or went idle past the inactivity watchdog
- **WHEN** its `chat_turn_finished` event is emitted
- **THEN** `steps`, `toolNames`, and the token counts SHALL reflect the steps that finished; tokens of a step cut mid-stream are not reported by the provider and SHALL NOT be estimated

### Requirement: Redaction by construction

Telemetry events SHALL carry identifiers, versions, and metrics only. No
event field SHALL contain user text, document bytes, prompts, model output,
or API keys — the event types make payload capture impossible rather than
optional.

#### Scenario: Failed run leaks no content

- **GIVEN** a run that fails while processing user-provided document content
- **WHEN** the `run_failed` event is emitted
- **THEN** the event SHALL contain only the error name and retriability flag — no message content, no input echo

#### Scenario: Chat turn event leaks no conversation

- **GIVEN** a chat turn whose user message, model reply, and tool input carry identifiable text
- **WHEN** its `chat_turn_finished` event is serialized
- **THEN** none of that text SHALL appear; `toolNames` SHALL carry only the registered tool names

### Requirement: Shipped sinks

The subpath SHALL ship `createConsoleTelemetrySink` (development logging)
and `createRingBufferTelemetrySink` (bounded in-memory buffer exposing
received events for tests and evals).

#### Scenario: Ring buffer used as a test probe

- **GIVEN** a runtime configured with a ring-buffer sink
- **WHEN** the deterministic eval lane completes a scripted run
- **THEN** the suite SHALL read the emitted events from the sink to assert telemetry behavior
