<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# @kaiord/ai

## Purpose

AI/LLM integration adapter for Kaiord. Provides provider-agnostic interfaces for converting natural language workout descriptions into structured KRD Workout objects using the Vercel AI SDK. Exports a factory function (`createTextToWorkout`) and evaluation harnesses for validating LLM output quality.

No pre-built singleton is exported because `model` (a `LanguageModel` from the Vercel AI SDK) is required and consumer-provided; Kaiord does not assume a default AI provider.

## Key Files

- `src/index.ts` — Public API exports: `createTextToWorkout`, `AiParsingError`
- `src/types.ts` — Config types: `TextToWorkoutConfig`, `TextToWorkoutOptions`
- `src/errors.ts` — `AiParsingError` class and factory
- `src/adapters/` — Core conversion logic (text input → KRD Workout via LLM)
- `src/evals/` — Evaluation suite: benchmarks, assertions, reporting
- `src/prompts/` — Prompt templates and template variable substitution
- `src/test-utils/` — Numeric constants for test fixtures

## Subdirectories

- **`src/adapters/`** — Strategy implementations for LLM integration
- **`src/evals/`** — Benchmark suite and quality assertions
- **`src/prompts/`** — System prompt templates
- **`src/test-utils/`** — Shared test constants

## For AI Agents

### Working In This Directory

The package is hexagonal: depends on `@kaiord/core` only. No external LLM SDKs are imported directly; the consumer injects a `LanguageModel` from `ai` package.

Architecture:

- `createTextToWorkout(config)` returns a function `(text: string, options?: TextToWorkoutOptions) => Promise<Workout>`
- Text flows: sanitize → build system prompt → call LLM with structured output schema → validate against `workoutSchema` → reindex steps
- LLM structured output uses a permissive schema (`aiWorkoutSchema`) to stay within Anthropic's complexity limits; validated against strict `workoutSchema` post-generation

Common operations:

- **Add a new provider**: Update `src/evals/run-evals.ts` to load the model; the core `createTextToWorkout` is provider-agnostic
- **Tweak the system prompt**: Edit `src/prompts/parse-workout.md` and test via `pnpm --filter @kaiord/ai test`
- **Add benchmark**: Edit `src/evals/benchmarks.json` following the `Benchmark` schema in `src/evals/types.ts`

### Testing Requirements

- All tests follow AAA pattern (Arrange / Act / Assert) with `// Assert` comment markers
- All `it()` titles start with `"should "`
- Test files: `*.test.ts` colocated with source
- Coverage: 80% (core package threshold)
- Run: `pnpm --filter @kaiord/ai test` or `pnpm --filter @kaiord/ai test:watch`
- Evals: `pnpm --filter @kaiord/ai eval` (requires `ANTHROPIC_API_KEY` env var; not part of standard CI)

### Common Patterns

1. **Creating a text-to-workout converter**:

   ```typescript
   import { createTextToWorkout } from "@kaiord/ai";
   const textToWorkout = createTextToWorkout({
     model: provider("claude-sonnet-4-5-20241022"),
     maxRetries: 2,
     maxOutputTokens: 4096,
     temperature: 0,
   });
   const workout = await textToWorkout("30 min easy cycling", {
     sport: "cycling",
   });
   ```

2. **Handling parsing errors**:

   ```typescript
   import { AiParsingError } from "@kaiord/ai";
   try {
     const workout = await textToWorkout(text);
   } catch (err) {
     if (err instanceof AiParsingError) {
       console.log(`Attempts: ${err.attempts}, Last error: ${err.lastError}`);
     }
   }
   ```

3. **Prompt templating**: `loadPrompt(raw, { sport: "...", ... })` replaces `{{variable}}` in template

## Dependencies

### Internal

- `@kaiord/core` — Domain types, `Workout`, `workoutSchema`, sport enums, logger interface

### External

- `ai` (peer dependency) — `LanguageModel`, `generateText`, `Output.object` for structured output
- `zod` — Schema validation (`aiWorkoutSchema`)
- `@ai-sdk/anthropic` (dev) — For eval runner and tests

## Mechanical Guards (CI-Enforced)

- ESLint: zero warnings
- TypeScript: strict mode, no implicit `any`
- Prettier: format checks
- Vitest: all tests pass, 80% coverage
- Test conventions: title prefix `"should "`, AAA pattern

<!-- MANUAL: -->
