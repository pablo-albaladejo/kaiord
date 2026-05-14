<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/

## Purpose

Core implementation of the text-to-workout conversion pipeline. Orchestrates LLM calls, handles validation, retry logic, step reindexing, and input sanitization. No framework or provider dependencies; uses the injected `LanguageModel` from Vercel AI SDK.

## Key Files

- `text-to-workout.ts` — Main factory: `createTextToWorkout(config)` returns async converter function
- `execute-with-retry.ts` — LLM invocation with retry on validation failure (up to `maxRetries` attempts)
- `ai-workout-schema.ts` — Zod schema for LLM structured output (permissive, to stay within Anthropic limits)
- `validate-input.ts` — Input sanitization and bounds checking (max 2000 chars, strips control chars)
- `reindex-steps.ts` — Corrects `stepIndex` sequentially; handles nested steps in repetition blocks

## Data Flow

```
User text
  ↓
validateInput (sanitize, check bounds)
  ↓
buildSystemPrompt (inject sport hint if provided)
  ↓
executeWithRetry (call LLM with structured output schema)
  ↓
workoutSchema.parse (strict validation)
  ↓
reindexSteps (fix step indices)
  ↓
Workout (KRD)
```

## For AI Agents

### Working In This Directory

Each file is a single responsibility:

1. **`text-to-workout.ts`**: Factory only. Orchestrates the pipeline, applies optional name override.
2. **`execute-with-retry.ts`**: Stateless LLM caller. Retries on validation failure. Catches last error, includes in prompt for next attempt.
3. **`ai-workout-schema.ts`**: Zod schema only. Defines what the LLM outputs before strict validation.
4. **`validate-input.ts`**: Sanitizes and bounds-checks. Throws `AiParsingError` on empty or oversized input.
5. **`reindex-steps.ts`**: Pure function. Flattens repetition block indices; top-level steps get sequential 0-based indices.

### Testing Requirements

- Unit tests for each adapter function
- Integration test: `text-to-workout.test.ts` mocks `LanguageModel` and validates full pipeline
- Sanitization edge cases: empty, whitespace-only, oversized, control chars, UTF-8
- Retry logic: simulate validation failure, verify error feedback in next prompt
- Reindex: test nested repetition blocks, flat steps, mixed

### Common Patterns

- **Retry with context**: `execute-with-retry` appends last error to prompt on retry; use for LLM self-correction
- **Schema permissiveness**: `aiWorkoutSchema` allows optional fields to avoid deeply nested unions; strict `workoutSchema` validates post-LLM
- **Logging**: Each step logs via injected logger (debug for low-level, info for flow, warn for failures)
- **Error handling**: Parsing errors wrap as `AiParsingError` with attempt count and last error message

## Dependencies

### Internal

- `@kaiord/core` — `Workout`, `workoutSchema`, `Sport`, `sportSchema`, `Logger`, `isRepetitionBlock`
- `../types` — `TextToWorkoutConfig`, `TextToWorkoutOptions`
- `../errors` — `AiParsingError`, `createAiParsingError`
- `../prompts/load-prompt` — Template variable substitution
- `../prompts/parse-workout.md` — System prompt template

### External

- `ai` — `generateText`, `Output.object` for structured output
- `zod` — Schema validation

## File Line Limits & Function Sizes

- `text-to-workout.ts`: 62 lines (under 100)
- `execute-with-retry.ts`: 65 lines (under 100)
- `ai-workout-schema.ts`: 54 lines (under 100)
- `validate-input.ts`: 37 lines (under 100)
- `reindex-steps.ts`: 29 lines (under 100)

Functions: all <40 LOC (except `executeWithRetry` which approaches 40 due to error handling).

<!-- MANUAL: -->
