<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-09-07 -->

# src/

## Purpose

Source root for `@kaiord/ai`. Houses the public API export, type definitions, error classes, and subdirectories for adapter implementations, evaluation suite, prompt templates, and test utilities.

## Key Files

- `index.ts` — Public API: `createTextToWorkout`, `AiParsingError`
- `types.ts` — Type definitions: `TextToWorkoutConfig`, `TextToWorkoutOptions`
- `errors.ts` — Error class and factory for parsing failures

## Subdirectories

- **`agents/`** — Declarative `AgentDefinition` and the generate-mode runtime (multimodal input, validate-and-retry, telemetry per run)
- **`chat/`** — The multi-step tool-calling chat engine; read tools auto-execute, action tools pause for confirmation
- **`providers/`** — Provider model instantiation, the generated model catalog, purpose→model resolution
- **`observability/`** — The redaction-safe telemetry port and its console / ring-buffer sinks
- **`prompts/`** — The versioned prompt registry, template substitution, and the untrusted-data fence
- **`adapters/`** — The deprecated `createTextToWorkout` wrapper over the agent runtime, plus input validation and step reindexing
- **`evals/`** — Assertion logic, fixtures and their invariants. The runners are inert: they need a provider API key this project does not have
- **`test-utils/`** — Shared numeric constants and `MockLanguageModelV4` helpers

## For AI Agents

### Working In This Directory

The module tree is:

- Entry point: `index.ts` (3 re-exports)
- Config/types: `types.ts`, `errors.ts`
- Implementation: `agents/`, `chat/`, `providers/`, `observability/`, `prompts/`, `adapters/`, `evals/`, `test-utils/`

Adding new top-level exports: add to `index.ts` and update `types.ts` if needed.

### Testing Requirements

Standard vitest suite. All test files colocated with source (`.test.ts`).

### Common Patterns

- Errors: Use `createAiParsingError()` factory from `errors.ts`
- Logging: Accept optional `logger?: Logger` from `@kaiord/core`, call `logger?.info()`, `logger?.debug()`, `logger?.warn()`

## Dependencies

### Internal

- `@kaiord/core` — `Workout`, `Sport`, `Logger`, `workoutSchema`, adapters
- `./adapters` — Text-to-workout conversion
- `./errors` — Error types
- `./types` — Config/option types

### External

- `ai` (peer) — `LanguageModel`
- `zod` — Validation

<!-- MANUAL: -->
