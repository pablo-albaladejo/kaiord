> Synced: 2026-07-09 (add-lab-extraction-agent)

# ai-agents Specification

## Purpose

Defines `@kaiord/ai/agents` — the declarative `AgentDefinition` and the generate-mode runtime (multimodal document input, validate-and-retry-with-feedback, token-usage reporting, cancellation, and per-run telemetry) that executes agents, plus behavior-preserving deprecated wrappers for the original entry points.

## Requirements

### Requirement: Declarative agent definitions

`@kaiord/ai/agents` SHALL export an `AgentDefinition` type declaring an agent
as data — id, version, `purpose` (model resolution key), `systemPrompt`
(a prompt-registry reference with optional variables), `mode: "generate"`,
a structured-output `outputSchema`, an optional strict `validate` function,
and tuning fields (`maxRetries`, `maxOutputTokens`, `temperature`) — plus a
`runGenerateAgent(definition, input, config)` runtime that executes it. New
generate-style capabilities SHALL require only a new definition, not new
plumbing.

#### Scenario: Lab extractor is one definition

- **WHEN** the lab-extractor capability is added to the platform
- **THEN** it SHALL consist of a registered system prompt, an output schema, and one exported `AgentDefinition` executed by `runGenerateAgent` — with no bespoke pipeline code

#### Scenario: Workout parser runs on the same runtime

- **WHEN** `createTextToWorkout` executes after this change
- **THEN** it SHALL delegate to `runGenerateAgent` with the shipped `workout-parser` definition

### Requirement: Generate mode with validation retry

The generate-mode runtime SHALL call the language model with structured
output, validate the raw output (permissive schema, then the definition's
strict `validate` when present), and on validation failure retry with the
failure appended as feedback, up to the definition's retry budget.
Non-retryable transport errors (HTTP 4xx except 408/429) SHALL propagate
immediately; retry exhaustion SHALL surface a typed error carrying the
attempt count.

#### Scenario: Invalid output retried with feedback

- **GIVEN** a model whose first response fails strict validation and whose second response passes
- **WHEN** `runGenerateAgent` executes with a retry budget of at least 1
- **THEN** the second model call SHALL include the first failure as feedback and the run SHALL succeed with the validated output

#### Scenario: Exhaustion surfaces a typed error

- **GIVEN** a model that always returns schema-invalid output
- **WHEN** the retry budget is exhausted
- **THEN** the runtime SHALL throw a typed error reporting the number of attempts, and a `run_failed` telemetry event SHALL be emitted

### Requirement: Multimodal document input

`runGenerateAgent` SHALL accept an input of optional text and optional file
attachments (`{ data: Uint8Array, mediaType, filename? }`) and SHALL forward
attachments to the model as AI SDK file content parts preserving bytes and
media type. Provider capability is not pre-flighted: a provider rejection
SHALL surface through the standard error path.

#### Scenario: PDF bytes reach the model

- **GIVEN** an input containing a PDF attachment and no text
- **WHEN** `runGenerateAgent` executes
- **THEN** the model call SHALL contain a file content part with the original bytes and `application/pdf` media type

### Requirement: Token usage surfaced from generate runs

Generate-mode results SHALL include the provider-reported token usage
(input and output tokens) whenever the SDK reports it, so callers and
telemetry can account for runs that are invisible today.

#### Scenario: Usage returned to the caller

- **GIVEN** a model response reporting token usage
- **WHEN** a generate run completes
- **THEN** the result SHALL carry the usage figures and the `run_finished` telemetry event SHALL carry the same figures

### Requirement: Cancellation support

`runGenerateAgent` SHALL accept an `AbortSignal` in its config and SHALL
propagate it to the underlying model calls so in-flight runs can be
cancelled by the caller.

#### Scenario: Abort cancels the run

- **GIVEN** a run started with an `AbortSignal`
- **WHEN** the signal aborts while the model call is in flight
- **THEN** the run SHALL reject with an abort error and no further retries SHALL occur

### Requirement: Deprecated wrappers preserve behavior

`createTextToWorkout` SHALL keep its public signature, its input-validation
behavior, and its `AiParsingError` semantics unchanged while delegating to
the runtime, and SHALL be marked deprecated in favor of `runGenerateAgent`.
Its removal is deferred to the program's single scheduled major.

#### Scenario: Existing suites pass unmodified

- **WHEN** the pre-existing `createTextToWorkout` unit tests and prompt snapshots run after the rewire
- **THEN** they SHALL pass without modification

### Requirement: Module identity across the agents subpath

The `./agents` and `./observability` entries SHALL share module instances
with the other subpaths (tsup `splitting: true`), so a prompt registered via
`./prompts` resolves inside the runtime and a sink created via
`./observability` receives runtime events.

#### Scenario: Registry singleton spans subpaths

- **GIVEN** a prompt registered through the `./prompts` entry
- **WHEN** an agent referencing that prompt id runs through the `./agents` entry
- **THEN** the prompt SHALL resolve from the same registry instance
