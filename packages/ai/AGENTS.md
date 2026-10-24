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
- **`src/evals/`** — Assertions and fixtures, the keyless cassette replay lane, and the local-only live lane over the Claude Code CLI. **No live runner runs in CI**. What gates every commit is the assertion logic and the fixtures' own invariants
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
- **A provider retires a model**: add the id to `retired` (answers 404) or `deprecated` (still answers, retirement announced) under its provider in `scripts/model-catalog-extract.mjs`, then regenerate. Retired ids leave the catalog and resolve to `getDefaultModel(type)`, which reads the curated `PREFERRED_DEFAULT_MODELS` — never the catalog's first entry, which is the oldest SDK id
- **Re-record trigger**: a change to the prompt, a benchmark's text/`expectedSport`/`athleteZones`, the output/wire schema, or a new benchmark needs a local `EVAL_MODEL=claude-sonnet-5 pnpm --filter @kaiord/ai eval:live -- --record` by the maintainer before merge (an agent never runs it); scorer-only changes (`minSteps`, `zoneCheck`) re-score keylessly
- **Tweak the system prompt**: Edit `src/prompts/parse-workout.md` and test via `pnpm --filter @kaiord/ai test`; see the re-record trigger above
- **Add benchmark**: Edit `src/evals/benchmarks.json` following the `Benchmark` schema in `src/evals/types.ts`; the fixture's own invariants are asserted keylessly; see the re-record trigger above. Retiring a benchmark removes its manifest entry and cassette too
- **Send a new externally-authored field to the model**: fence it with `fenceUntrusted(...)`. `check-untrusted-fields-fenced.mjs` fails on a recognized field that is not

### Testing Requirements

- All tests follow AAA pattern (Arrange / Act / Assert) with `// Assert` comment markers
- All `it()` titles start with `"should "`
- Test files: `*.test.ts` colocated with source
- Coverage: 80% (core package threshold)
- Run: `pnpm --filter @kaiord/ai test` or `pnpm --filter @kaiord/ai test:watch`
- Evals: no provider API key exists and no eval runs in CI. `pnpm --filter @kaiord/ai eval:live` runs the parser suite on the maintainer's local Claude Code subscription (`claude -p`, see `src/evals/AGENTS.md`); in CI, or without the `EVAL_LIVE=1` that only that script sets, it stops as `INERT` before spawning anything (`pnpm eval` is inert only while `EVAL_LIVE` is not exported in the shell). `eval:chat-tools` and `eval:labs` report every case unmeasured (tool calling and document file parts cannot go through `claude -p`) and exit 0. No live runner declares a pass threshold, because a comparison that cannot run where merges are decided is not a gate (`check-no-inert-floors.mjs` enforces that). Never run `eval:live` from an agent session: its calls spend the maintainer's subscription quota

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
