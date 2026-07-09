---
"@kaiord/ai": minor
---

Add the agent runtime (Wave 2 kickoff). New `@kaiord/ai/agents` subpath ships a
declarative `AgentDefinition` and a generate-mode runtime with multimodal
document input, a validate-and-retry-with-feedback loop, token-usage reporting,
and cancellation. New `@kaiord/ai/observability` subpath ships a minimal,
redaction-safe telemetry port (`run_finished`/`run_failed`) with console and
ring-buffer sinks. A new shipped `lab-extractor` agent extracts structured lab
values from a report document, and a deterministic keyless eval lane on
`MockLanguageModelV4` exercises the real runtime in CI. `createTextToWorkout`
becomes a behavior-preserving deprecated wrapper over the runtime. All additive;
no breaking changes.
