---
"@kaiord/ai": minor
---

The chat engine can be stopped and is bounded in time. `sendTurn` and `resume` accept `{ signal }`; aborting it resolves the turn with status `aborted`, keeping the text streamed so far as a plain assistant message (no half-finished tool call, so nothing is left pending). A per-turn watchdog (`turnTimeoutMs`, default `maxSteps` × `TURN_STEP_BUDGET_MS` = 120 s for the default 8 steps) resolves a stalled turn with status `timeout` instead of a generic error. Each turn now emits one `chat_turn_finished` telemetry event (traceId, promptVersion, provider, modelId, steps, toolNames, status, input/output tokens, latency) to the configured `AiTelemetrySink` — ids and metrics only, never message text or tool input.
