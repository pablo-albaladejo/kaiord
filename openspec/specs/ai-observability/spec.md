> Synced: 2026-07-09 (add-lab-extraction-agent)

# ai-observability Specification

## Purpose

Defines `@kaiord/ai/observability` — a minimal, redaction-safe telemetry port (`run_finished`/`run_failed`, carrying ids, versions, and metrics only) with shipped console and ring-buffer sinks.

## Requirements

### Requirement: Telemetry port with a minimal event set

`@kaiord/ai/observability` SHALL export an `AiTelemetrySink` port
(`{ emit(event) }`) and an `AiTelemetryEvent` union of exactly two events:
`run_finished` (traceId, agentId, agentVersion, promptId, promptVersion,
provider, modelId, purpose, usage, latencyMs) and `run_failed` (the same
identity fields plus `error: { name, retriable }`). Field naming SHALL stay
mappable to OTel GenAI semantic conventions without introducing an OTel
dependency. The agent runtime SHALL emit one of these events for every run,
defaulting to a no-op sink when none is injected.

#### Scenario: Every run emits exactly one event

- **GIVEN** a runtime configured with a telemetry sink
- **WHEN** a generate run completes or fails
- **THEN** exactly one `run_finished` or `run_failed` event SHALL be emitted carrying the agent id/version, prompt id/version, provider, model, purpose, and latency

### Requirement: Redaction by construction

Telemetry events SHALL carry identifiers, versions, and metrics only. No
event field SHALL contain user text, document bytes, prompts, model output,
or API keys — the event types make payload capture impossible rather than
optional.

#### Scenario: Failed run leaks no content

- **GIVEN** a run that fails while processing user-provided document content
- **WHEN** the `run_failed` event is emitted
- **THEN** the event SHALL contain only the error name and retriability flag — no message content, no input echo

### Requirement: Shipped sinks

The subpath SHALL ship `createConsoleTelemetrySink` (development logging)
and `createRingBufferTelemetrySink` (bounded in-memory buffer exposing
received events for tests and evals).

#### Scenario: Ring buffer used as a test probe

- **GIVEN** a runtime configured with a ring-buffer sink
- **WHEN** the deterministic eval lane completes a scripted run
- **THEN** the suite SHALL read the emitted events from the sink to assert telemetry behavior
