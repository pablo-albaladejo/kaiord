<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/evals/

## Purpose

Evaluation and benchmarking suite for validating LLM output quality. Defines benchmark cases (22 curated workout descriptions), runs assertions (schema validation, sport correctness, step count, zone accuracy), and produces JSON reports. Evals are manual-trigger only in CI (not part of standard test suite) because they require API keys and incur costs.

## Key Files

- `benchmarks.json` — 22 curated workout descriptions across sports (cycling, running, swimming, generic), complexity (simple, intervals, repetition blocks, mixed), languages (English, Spanish, mixed), and edge cases
- `types.ts` — Type definitions: `Benchmark`, `EvalResult`, `EvalReport`, `ZoneCheck`
- `assertions.ts` — `evaluateBenchmark(benchmark, workout, durationMs)` validates schema, sport, step count, zone ranges
- `reporter.ts` — Report generation (`createReport`, `formatReport`) with category/language breakdowns
- `run-evals.ts` — CLI entry point: loads Anthropic model, runs all benchmarks, outputs report JSON and markdown

## Assertions per Benchmark

Each benchmark is evaluated against:

1. **Schema validation** (100% threshold): Output must pass `workoutSchema` from `@kaiord/core`
2. **Sport correctness** (≥95% threshold): If `expectedSport` is set, `workout.sport` must match
3. **Step count** (per-benchmark min/max): `countSteps(workout)` must be within `[minSteps, maxSteps]` (counts nested steps in blocks)
4. **Zone accuracy** (±5% tolerance, optional): If `zoneCheck` is defined, active steps matching the target type must have values within `[minValue*0.95, maxValue*1.05]`

Overall pass rate: ≥90% to exit with code 0; <90% exits with code 1.

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

## For AI Agents

### Working In This Directory

- **Add a benchmark**: Edit `benchmarks.json`, follow the schema, run `pnpm --filter @kaiord/ai test` to validate
- **Modify assertions**: Update `assertions.ts` (e.g., change tolerance from 5% to 10%), re-run evals
- **Customize report**: Edit `reporter.ts` formatting (markdown, JSON structure)
- **Run locally**: `ANTHROPIC_API_KEY=sk-ant-... pnpm --filter @kaiord/ai eval` (outputs JSON and formatted text)

### Testing Requirements

- `assertions.test.ts`: Unit tests for `evaluateBenchmark`, zone checks, step counting
- `reporter.test.ts`: Unit tests for `createReport` grouping and `formatReport` output
- No integration tests for `run-evals.ts` (it's a CLI; manually tested)
- All assertions test mocked workouts (no LLM calls)

### Common Patterns

- **Zone check logic**: Flattens nested steps, filters by target type and intensity = "active", compares value ranges
- **Step counting**: Accounts for repetition blocks (block header does not count; inner steps do)
- **Report grouping**: Extracts category/language from benchmark ID (e.g., `"cycling-en-simple"` → category `"cycling"`, language `"en"`)
- **Error accumulation**: Multiple errors per benchmark collected in `EvalResult.errors` array

## Dependencies

### Internal

- `@kaiord/core` — `Workout`, `workoutSchema`
- `../index` — `createTextToWorkout`
- `./types` — Type definitions
- `./benchmarks.json` — Benchmark data

### External

- `ai` — `LanguageModel` (via `run-evals.ts` dynamic import)
- `@ai-sdk/anthropic` — `createAnthropic` for `run-evals.ts`

## File Line Limits

- `types.ts`: 41 lines
- `assertions.ts`: 90 lines
- `reporter.ts`: 64 lines
- `run-evals.ts`: 72 lines

Functions: `evaluateBenchmark` ~40 LOC, `checkZones` ~30 LOC, `countSteps` <10 LOC, helpers <20 LOC.

<!-- MANUAL: -->
