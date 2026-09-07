<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-09-07 -->

# src/evals/

## Purpose

Evaluation and benchmarking suite for validating LLM output quality. Defines benchmark cases (22 curated workout descriptions), runs assertions (schema validation, sport correctness, step count, zone accuracy), and produces JSON reports. A second suite (`chat-tool-*`) evaluates the Data Hub chat tools (F6): does the model call `get_data_routes`/`set_data_route` correctly for the spec's two hub-conversation scenarios. **The runners are INERT in this project**: they obtain a model through `loadEvalModel`, which throws without a provider API key, and this project has none. They have never executed. What runs on every commit is the assertion logic and the fixtures' own structural invariants, neither of which needs a credential.

## Key Files

- `benchmarks.json` — 22 curated workout descriptions across sports (cycling, running, swimming, generic), complexity (simple, intervals, repetition blocks, mixed), languages (English, Spanish, mixed), and edge cases
- `types.ts` — Type definitions: `Benchmark`, `EvalResult`, `EvalReport`, `ZoneCheck`
- `assertions.ts` — `evaluateBenchmark(benchmark, workout, durationMs)` validates schema, sport, step count, zone ranges
- `reporter.ts` — Report generation (`createReport`, `formatReport`) with category/language breakdowns; reused as-is by the chat-tool evals (both result shapes carry `id`/`pass`/`errors`/`durationMs`)
- `run-evals.ts` — CLI entry point (inert): would run all benchmarks and output report JSON and markdown
- `load-eval-model.ts` — shared `EVAL_PROVIDER`/`EVAL_MODEL` loader used by all three eval CLIs; throws without the provider's API key, which is why the CLIs are inert here
- `benchmark-invariants.ts` — keyless structural checks over `benchmarks.json`; a `zoneCheck` with no bound the comparison can use is rejected
- `dimension-outcomes.ts` — the `passed` / `failed` / `unmeasured` constructors, the per-dimension tally, and `dimensionRatePercent`, which returns `null` rather than a number when nothing was measured
- `chat-tool-benchmarks.json` — Data Hub hub-conversation scenarios (F6): "where do my planned sessions come from" (read) and "read sleep only from Whoop" (action)
- `chat-tool-types.ts` — Type definitions: `ChatToolBenchmark`, `ChatToolEvalResult`
- `chat-tool-fixtures.ts` — local `get_data_routes`/`set_data_route` `ChatTool` fixtures mirroring the real schemas registered in `@kaiord/workout-spa-editor` (hand-kept in sync; that package cannot be a dependency here)
- `chat-tool-assertions.ts` — `evaluateChatToolBenchmark(benchmark, chatTurnResult, durationMs)`: read scenarios check the expected tool was called and the final answer names the real source; action scenarios check the paused `pendingAction` matches the expected tool + input fields
- `run-chat-tool-evals.ts` — CLI entry point (inert): would run `createChatAgent` against the hub tool fixtures for each benchmark

## Assertions per Benchmark

Each benchmark is evaluated against:

1. **Schema validation**: output must pass `workoutSchema` from `@kaiord/core`. A schema failure short-circuits; no other dimension is evaluated.
2. **Sport correctness**: if `expectedSport` is set, `workout.sport` must match.
3. **Step count**: `countSteps(workout)` must be within `[minSteps, maxSteps]` (nested steps in blocks are counted).
4. **Zone accuracy** (±5% tolerance, optional): if `zoneCheck` is defined, active steps of the target type must fall within `[minValue*0.95, maxValue*1.05]`. A zone check with no matching active step **fails** — it is not skipped.

Each dimension yields one outcome: `passed`, `failed` with a message, or
`unmeasured` with a reason. `unmeasured` is a member of the union, not a flag
beside a score, so there is no field on it a caller could average or compare —
a criterion nobody measured cannot enter a rate by looking like a zero.

Two dimensions are routinely unmeasured and say so: `sport` when the benchmark
declares no `expectedSport`, and `zone` when it declares no `zoneCheck`. A
schema failure marks the other three unmeasured rather than leaving them out,
so the short-circuit is visible in the report instead of being inferred from
an absence.

`createReport` tallies `byDimension` as `{measured, passed, unmeasured,
reasons}` — a pair, never a lone rate, because `passed` is meaningless without
the `measured` it is out of. A dimension with `measured: 0` has NO rate:
`dimensionRatePercent` returns `null`, and `formatReport` prints
"not measured". Tests read outcomes through `expectMeasured`, which throws
rather than let a case take a verdict off a criterion nobody measured.

## Eval layers

Which layers exist here, and which do not, using the six-layer stage axis:

| Layer                         | Present | Where                                                                                                                                |
| ----------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Unit / component           | yes     | `assertions.test.ts`, `reporter.test.ts`, `chat-tool-assertions.test.ts` — keyless, every commit                                     |
| 2. Fixture invariants         | yes     | `benchmark-invariants.ts`, the `chat-tool-benchmarks.json` shape tests — the fixtures are a specification, and this checks it        |
| 3. Guardrails / containment   | yes     | outside this directory: `fence.test.ts` plus the two mechanical guards (`check-untrusted-fields-fenced`, `check-model-facing-sinks`) |
| 4. End-to-end model behaviour | NO      | needs a provider key; the three runners here are its inert skeleton                                                                  |
| 5. Human / preference         | NO      | no rater pool, and nothing to rate while layer 4 cannot run                                                                          |
| 6. Production monitoring      | partial | `observability/` records usage telemetry; no quality signal is fed back                                                              |

Layers 1-3 gate every commit and need no credential. Layer 4 is the boundary:
everything above it is blocked on the same missing key, so nothing here
declares a threshold — see below.

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
- **Run locally**: not possible in this project — the runners need a provider API key it does not have
- **Add a chat-tool benchmark**: Edit `chat-tool-benchmarks.json`, follow the schema above; if the scenario needs a new fixture answer, extend `chat-tool-fixtures.ts`

### Testing Requirements

- `assertions.test.ts`: Unit tests for `evaluateBenchmark`, zone checks, step counting, and failure attribution by dimension
- `benchmark-invariants.test.ts`: keyless checks that every `zoneCheck` in the fixture declares a usable bound. A bound of `0` is rejected in both directions — as a minimum the comparison is `min < 0`, which no target triggers; as a maximum it is `max > 0`, which every target triggers
- `chat-tool-assertions.test.ts` also scores the shipped `chat-tool-benchmarks.json` itself: every expectation must be in a shape `expectationFault` understands, and each benchmark must declare the expectation its own category is scored on. Without it a fixture could go green by declaring nothing the scorer reads
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
- `./load-eval-model` — shared model loader

### External

- `ai` — `LanguageModel`, `ModelMessage` (via dynamic import in the CLIs)
- `@ai-sdk/anthropic` — `createAnthropic` for the CLIs
- `zod` — chat-tool fixture schemas

## File Line Limits

The budget is the ESLint rule, not a transcript: `max-lines` 100 and
`max-lines-per-function` 40, both with `skipBlankLines` and `skipComments`. A
file here can therefore run past 100 physical lines and still be within budget,
which is why this section states the rule instead of a per-file count — an
earlier revision listed exact numbers and they went stale the first time a file
changed.

<!-- MANUAL: -->
