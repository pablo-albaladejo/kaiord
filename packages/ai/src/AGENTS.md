<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/

## Purpose

Source root for `@kaiord/ai`. Houses the public API export, type definitions, error classes, and subdirectories for adapter implementations, evaluation suite, prompt templates, and test utilities.

## Key Files

- `index.ts` — Public API: `createTextToWorkout`, `AiParsingError`
- `types.ts` — Type definitions: `TextToWorkoutConfig`, `TextToWorkoutOptions`
- `errors.ts` — Error class and factory for parsing failures

## Subdirectories

- **`adapters/`** — Core LLM integration and text-to-workout conversion
- **`evals/`** — Evaluation suite and benchmark reporting
- **`prompts/`** — System prompt templates and template loader
- **`test-utils/`** — Shared numeric constants for test fixtures

## For AI Agents

### Working In This Directory

The module tree is:

- Entry point: `index.ts` (3 re-exports)
- Config/types: `types.ts`, `errors.ts`
- Implementation: `adapters/`, `evals/`, `prompts/`, `test-utils/`

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
