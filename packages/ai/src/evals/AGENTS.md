<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/evals/

## Purpose

Evaluation and benchmarking suite for validating LLM output quality. Defines benchmark cases (22 curated workout descriptions), runs assertions (schema validation, sport correctness, step count, zone accuracy), and produces JSON reports. A second suite (`chat-tool-*`) evaluates the Data Hub chat tools (F6): does the model call `get_data_routes`/`set_data_route` correctly for the spec's two hub-conversation scenarios. Evals are manual-trigger only in CI (not part of standard test suite) because they require API keys and incur costs.

## Key Files

- `benchmarks.json` — 22 curated workout descriptions across sports (cycling, running, swimming, generic), complexity (simple, intervals, repetition blocks, mixed), languages (English, Spanish, mixed), and edge cases
- `types.ts` — Type definitions: `Benchmark`, `EvalResult`, `EvalReport`, `ZoneCheck`
- `assertions.ts` — `evaluateBenchmark(benchmark, workout, durationMs)` validates schema, sport, step count, zone ranges
- `reporter.ts` — Report generation (`createReport`, `formatReport`) with category/language breakdowns; reused as-is by the chat-tool evals (both result shapes carry `id`/`pass`/`errors`/`durationMs`)
- `run-evals.ts` — CLI entry point: loads Anthropic model, runs all benchmarks, outputs report JSON and markdown
- `load-anthropic-model.ts` — shared `ANTHROPIC_API_KEY`/`EVAL_MODEL` loader used by both eval CLIs
- `chat-tool-benchmarks.json` — Data Hub hub-conversation scenarios (F6): "where do my planned sessions come from" (read) and "read sleep only from Whoop" (action)
- `chat-tool-types.ts` — Type definitions: `ChatToolBenchmark`, `ChatToolEvalResult`
- `chat-tool-fixtures.ts` — local `get_data_routes`/`set_data_route` `ChatTool` fixtures mirroring the real schemas registered in `@kaiord/workout-spa-editor` (hand-kept in sync; that package cannot be a dependency here)
- `chat-tool-assertions.ts` — `evaluateChatToolBenchmark(benchmark, chatTurnResult, durationMs)`: read scenarios check the expected tool was called and the final answer names the real source; action scenarios check the paused `pendingAction` matches the expected tool + input fields
- `run-chat-tool-evals.ts` — CLI entry point: loads Anthropic model, runs `createChatAgent` against the hub tool fixtures for each benchmark, outputs report JSON and markdown

## Assertions per Benchmark

Each benchmark is evaluated against:

1. **Schema validation**: output must pass `workoutSchema` from `@kaiord/core`. A schema failure short-circuits; no other dimension is evaluated.
2. **Sport correctness**: if `expectedSport` is set, `workout.sport` must match.
3. **Step count**: `countSteps(workout)` must be within `[minSteps, maxSteps]` (nested steps in blocks are counted).
4. **Zone accuracy** (±5% tolerance, optional): if `zoneCheck` is defined, active steps of the target type must fall within `[minValue*0.95, maxValue*1.05]`. A zone check with no matching active step **fails** — it is not skipped.

Each failure carries the dimension that produced it, so a red result says
which capability broke rather than only that something did.

**There are no per-dimension thresholds, and there is no overall pass rate
gate.** Earlier revisions of this file documented a 100% schema threshold and a
≥95% sport threshold; neither was ever implemented — `evaluateBenchmark` folds
every dimension into one binary `pass`. They are not implemented now either,
deliberately: this suite cannot run in this project (see the runner header), so
any threshold on it would be a number that can never fire.

## Benchmark Schema

```json
{
  "id": "unique-id",
  "text": "Natural language description",
  "expectedSport": "cycling|running|swimming|generic",
  "minSteps": 1,
  "maxSteps": 10,
  "category": "simple|intervals|repetition|zones|mixed|edge",
  "language": "en|es|mixed",
  "zoneCheck": {
    "targetType": "power|pace|heart_rate|cadence",
    "minValue": 200,
    "maxValue": 280
  }
}
```

## Chat-Tool Benchmark Schema

```json
{
  "id": "unique-id",
  "userText": "Natural language user message",
  "category": "read|action",
  "expectedTool": "get_data_routes|set_data_route",
  "expectedAnswerIncludes": ["train2go"],
  "expectedActionInput": {
    "action": "set_source_policy",
    "dataType": "sleep",
    "mode": "priority"
  }
}
```

`expectedAnswerIncludes` applies to `category: "read"` (checked against the completed turn's final text); `expectedActionInput` applies to `category: "action"` (checked as a partial match against the paused `pendingAction.input`).

## For AI Agents

### Working In This Directory

- **Add a benchmark**: Edit `benchmarks.json`, follow the schema, run `pnpm --filter @kaiord/ai test` to validate
- **Modify assertions**: Update `assertions.ts` (e.g., change tolerance from 5% to 10%), re-run evals
- **Customize report**: Edit `reporter.ts` formatting (markdown, JSON structure)
- **Run locally**: `ANTHROPIC_API_KEY=sk-ant-... pnpm --filter @kaiord/ai eval` (outputs JSON and formatted text)
- **Add a chat-tool benchmark**: Edit `chat-tool-benchmarks.json`, follow the schema above; if the scenario needs a new fixture answer, extend `chat-tool-fixtures.ts`
- **Run chat-tool evals locally**: `ANTHROPIC_API_KEY=sk-ant-... pnpm --filter @kaiord/ai eval:chat-tools`

### Testing Requirements

- `assertions.test.ts`: Unit tests for `evaluateBenchmark`, zone checks, step counting
- `reporter.test.ts`: Unit tests for `createReport` grouping and `formatReport` output
- `chat-tool-assertions.test.ts`: Unit tests for `evaluateChatToolBenchmark` against fabricated `ChatTurnResult` values (no LLM calls)
- No integration tests for `run-evals.ts` / `run-chat-tool-evals.ts` (CLIs; manually tested)
- All assertions test mocked workouts / chat turns (no LLM calls)

### Common Patterns

- **Zone check logic**: Flattens nested steps, filters by target type and intensity = "active", compares value ranges
- **Step counting**: Accounts for repetition blocks (block header does not count; inner steps do)
- **Report grouping**: Extracts category/language from benchmark ID (e.g., `"cycling-en-simple"` → category `"cycling"`, language `"en"`)
- **Error accumulation**: Multiple errors per benchmark collected in `EvalResult.errors` array

## Dependencies

### Internal

- `@kaiord/core` — `Workout`, `workoutSchema`, `managedDataTypes` (chat-tool fixtures)
- `../index` — `createTextToWorkout`, `createChatAgent`, `ChatTool`, `ChatTurnResult`
- `./types` / `./chat-tool-types` — Type definitions
- `./benchmarks.json` / `./chat-tool-benchmarks.json` — Benchmark data
- `./load-anthropic-model` — shared model loader

### External

- `ai` — `LanguageModel`, `ModelMessage` (via dynamic import in the CLIs)
- `@ai-sdk/anthropic` — `createAnthropic` for the CLIs
- `zod` — chat-tool fixture schemas

## File Line Limits

- `types.ts`: 41 lines
- `assertions.ts`: 90 lines
- `reporter.ts`: 64 lines
- `run-evals.ts`: 72 lines
- `chat-tool-types.ts`, `chat-tool-fixtures.ts`, `chat-tool-assertions.ts`, `run-chat-tool-evals.ts`: same budget as their workout-eval counterparts

Functions: `evaluateBenchmark` ~40 LOC, `checkZones` ~30 LOC, `countSteps` <10 LOC, helpers <20 LOC.

<!-- MANUAL: -->
