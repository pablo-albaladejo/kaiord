<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-09-07 -->

# @kaiord/ai

## Purpose

AI/LLM integration for Kaiord, provider-agnostic over the Vercel AI SDK. It carries the agent runtime (declarative `AgentDefinition`, generate mode with multimodal input and validate-and-retry), the multi-step tool-calling chat engine, provider/model resolution over a generated catalog, redaction-safe telemetry, the versioned prompt registry with its untrusted-data fence, and the evaluation suite.

Published on five subpaths: `.`, `./providers`, `./prompts`, `./agents`, `./observability`.

No pre-built singleton is exported because `model` (a `LanguageModel` from the Vercel AI SDK) is required and consumer-provided; Kaiord does not assume a default AI provider.

## Key Files

- `src/index.ts` — Public API exports: `createTextToWorkout`, `AiParsingError`
- `src/types.ts` — Config types: `TextToWorkoutConfig`, `TextToWorkoutOptions`
- `src/errors.ts` — `AiParsingError` class and factory
- `src/agents/` — `AgentDefinition` and the generate-mode runtime
- `src/chat/` — The multi-step tool-calling chat engine
- `src/providers/` — Model instantiation and the generated `MODEL_CATALOG`
- `src/observability/` — Telemetry port with console / ring-buffer sinks
- `src/prompts/` — Prompt registry, substitution, and `fenceUntrusted`
- `src/adapters/` — The deprecated `createTextToWorkout` wrapper, input validation, step reindexing
- `src/evals/` — Assertion logic, fixtures and their invariants
- `src/test-utils/` — Numeric constants and `MockLanguageModelV4` helpers

## Subdirectories

- **`src/agents/`** — Declarative agents; the runtime validates and retries, and emits telemetry per run
- **`src/chat/`** — Read tools auto-execute; action tools pause for user confirmation
- **`src/providers/`** — Purpose→model resolution; the catalog is generated from the installed `@ai-sdk/*` type unions, so a hand-typed model id elsewhere is guarded by `check-model-ids-fresh.mjs`
- **`src/observability/`** — Records usage telemetry; no quality signal is fed back
- **`src/prompts/`** — System prompts plus the untrusted-data fence, whose payload neutralization is the only defense against injection in synced coach text
- **`src/adapters/`** — Strategy implementations for LLM integration
- **`src/evals/`** — Assertions and fixtures. **The runners are INERT here**: they need a provider API key this project does not have. What gates every commit is the assertion logic and the fixtures' own invariants
- **`src/test-utils/`** — Shared test constants and mocks

## For AI Agents

### Working In This Directory

The package is hexagonal: depends on `@kaiord/core` only. No external LLM SDKs are imported directly; the consumer injects a `LanguageModel` from `ai` package.

Architecture:

- `createTextToWorkout(config)` returns a function `(text: string, options?: TextToWorkoutOptions) => Promise<Workout>`
- Text flows: sanitize → build system prompt → call LLM with structured output schema → validate against `workoutSchema` → reindex steps
- LLM structured output uses a permissive schema (`aiWorkoutSchema`) to stay within Anthropic's complexity limits; validated against strict `workoutSchema` post-generation

Common operations:

- **Add a new provider**: Extend `src/providers/`; regenerate the catalog with `pnpm generate:model-catalog` after bumping `@ai-sdk/*`. Do not hand-edit `src/providers/generated/model-catalog.ts`
- **Tweak the system prompt**: Edit `src/prompts/parse-workout.md` and test via `pnpm --filter @kaiord/ai test`
- **Add benchmark**: Edit `src/evals/benchmarks.json` following the `Benchmark` schema in `src/evals/types.ts`; the fixture's own invariants are asserted keylessly
- **Send a new externally-authored field to the model**: fence it with `fenceUntrusted(...)`. `check-untrusted-fields-fenced.mjs` fails on a recognized field that is not

### Testing Requirements

- All tests follow AAA pattern (Arrange / Act / Assert) with `// Assert` comment markers
- All `it()` titles start with `"should "`
- Test files: `*.test.ts` colocated with source
- Coverage: 80% (core package threshold)
- Run: `pnpm --filter @kaiord/ai test` or `pnpm --filter @kaiord/ai test:watch`
- Evals: `pnpm --filter @kaiord/ai eval` is INERT — it throws at `load-eval-model.ts` without a provider API key, which this project does not have. It has never executed. `eval:chat-tools` and `eval:labs` are the same. Nothing in the suite declares a pass threshold, because a comparison that cannot run is not a gate (`check-no-inert-floors.mjs` enforces that)

### Common Patterns

1. **Creating a text-to-workout converter**:

   ```typescript
   import { createTextToWorkout } from "@kaiord/ai";
   const textToWorkout = createTextToWorkout({
     model: provider("claude-sonnet-4-5-20250929"),
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
