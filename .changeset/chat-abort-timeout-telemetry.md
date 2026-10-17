---
"@kaiord/ai": minor
---

The chat engine can be stopped and is bounded by inactivity. `sendTurn` and `resume` accept `{ signal }`; aborting it resolves the turn with status `aborted`, keeping the text streamed so far as a plain assistant message (no half-finished tool call, so nothing is left pending). An idle watchdog (`turnIdleTimeoutMs`, default `DEFAULT_TURN_IDLE_TIMEOUT_MS` = 60 s) restarts on every streamed chunk and finished step, so a long turn that keeps streaming is never cut, while one that goes silent resolves with status `timeout` instead of a generic error.

Each turn now emits exactly one `chat_turn_finished` telemetry event (traceId, promptVersion, provider, modelId, steps, toolNames, status, input/output tokens, latency) to the configured `AiTelemetrySink`: ids and metrics only, never message text or tool input. `toolNames` lists only registered tools called with valid input. A turn that throws reports the metrics of the steps it finished. A stopped or timed-out turn reports its finished steps too. The tokens of the step cut mid-stream are not counted, because providers report usage only when a step finishes.

This widens two public unions: `AiTelemetryEvent` gains `chat_turn_finished`, and `ChatTurnResult.status` gains `aborted` and `timeout` alongside `step_limit`. Exhaustive `switch`es over either need a new case.
