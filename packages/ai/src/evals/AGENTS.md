<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-10-22 -->

# src/evals/

## Purpose

Evaluation and benchmarking suite for validating LLM output quality. Defines benchmark cases (25 curated workout descriptions), runs assertions (schema validation, sport correctness, step count, zone accuracy), and produces JSON reports. A second suite (`chat-tool-*`) evaluates the Data Hub chat tools (F6): does the model call `get_data_routes`/`set_data_route` correctly for the spec's two hub-conversation scenarios. **No runner here runs in CI.** This project holds no provider API key. The parser runner (`run-evals.ts`) is the live lane: it runs only on the maintainer's machine, over the local Claude Code subscription (`claude -p`, see `claude-cli/` below), and is INERT anywhere else. The chat-tool and lab-extraction runners need tool calling and document file parts, which `claude -p` cannot carry: they report every case unmeasured and exit 0. What runs on every commit is the assertion logic, the fixtures' own structural invariants and the keyless replay lane, none of which needs a credential.

## Key Files

- `benchmarks.json` — 25 curated workout descriptions across sports (cycling, running, swimming, generic), complexity (simple, intervals, repetition blocks, mixed), languages (English, Spanish, mixed), and edge cases
- `types.ts` — Type definitions: `Benchmark`, `EvalResult`, `EvalReport`, `ZoneCheck`
- `assertions.ts` — `evaluateBenchmark(benchmark, workout, durationMs)` validates schema, sport, step count, zone ranges
- `reporter.ts` — Report generation (`createReport`, `formatReport`) with category/language breakdowns; reused as-is by the chat-tool evals (both result shapes carry `id`/`pass`/`errors`/`durationMs`)
- `run-evals.ts` — the live parser runner (`eval:live`): per-case counts with `--repeat N`, cassettes with `--record`, the calibration capture with `--calibrate`; INERT in CI and without `EVAL_LIVE=1`; exits on a literal and carries no threshold
- `benchmark-invariants.ts` — keyless structural checks over `benchmarks.json`; a `zoneCheck` with no bound the comparison can use is rejected
- `target-assertions.ts` — the `targets` and `structure` dimensions
- `train2go-contrasts.test.ts` — keyless end-to-end case: a `MockLanguageModelV4` returns the zone numbers a rule-following model emits for the Train2Go "rodaje con contrastes" session, `createTextToWorkout` resolves them against the benchmark's `athleteZones`, and the result passes its benchmark; the pre-fix output (open targets) fails `targets`
- `dimension-outcomes.ts` — the `passed` / `failed` / `unmeasured` constructors, the per-dimension tally, and `dimensionRatePercent`, which returns `null` rather than a number when nothing was measured
- `chat-tool-benchmarks.json` — Data Hub hub-conversation scenarios (F6): "where do my planned sessions come from" (read) and "read sleep only from Whoop" (action)
- `chat-tool-types.ts` — Type definitions: `ChatToolBenchmark`, `ChatToolEvalResult`
- `chat-tool-fixtures.ts` — local `get_data_routes`/`set_data_route` `ChatTool` fixtures mirroring the real schemas registered in `@kaiord/workout-spa-editor` (hand-kept in sync; that package cannot be a dependency here)
- `chat-tool-assertions.ts` — `evaluateChatToolBenchmark(benchmark, chatTurnResult, durationMs)`: read scenarios check the expected tool was called and the final answer names the real source; action scenarios check the paused `pendingAction` matches the expected tool + input fields
- `run-chat-tool-evals.ts` / `run-lab-extraction-evals.ts` — report every case unmeasured (tool calling; document file parts) and exit 0; they import no live code, so they never reach the `EVAL_LIVE` opt-in

## Cassettes and replay (`cassettes/`)

Keyless replay of recorded model responses through `MockLanguageModelV4` and the real runtime. It imports nothing from `evals/claude-cli/` (pinned by `replay-imports.test.ts`), so it MAY gate. No replay lane over committed cassettes is part of `pnpm test` yet: it joins in the same commit as the first real cassette (OpenSpec `adopt-claude-cli-live-evals`, task 3.5).

- `cassette-schema.ts` — the strict allowlisted cassette schema; every provenance and envelope key is allowlisted and an unknown one is rejected and named by `validate-cassette.ts`. `response.structuredOutput` is the model's answer (any JSON), validated by the runtime on replay
- `validate-cassette.ts` — `validateCassette` (schema only, for in-memory and fixture cassettes) and `validateCommittedCassette` (plus: recorder `claude-cli` only, requested `claude-sonnet-5`, served `claude-sonnet-5` or a dated snapshot `claude-sonnet-5-YYYYMMDD`)
- `canonical-hash.ts` / `request-hashes.ts` — SHA-256 over canonical JSON (keys sorted recursively; URL, Date and byte arrays serialized by content, other class instances rejected; only `$schema` stripped, from the schema); prompt, tools, fixture and request hashes. The request hash is computed from the call options the runtime actually sends. The fixture hash covers only what the model sees, never scorer expectations
- `replay-model.ts` / `case-verdict.ts` / `replay-cassette.ts` / `replay-runner.ts` — one cassette per call. A case is measured only if it consumed its cassette (exactly one model call) and a scorer returned a verdict. Every unmeasured cause except `synthetic` (stale, orphan, model mismatch, not consumed, nothing scored), zero measured cases and a failed scorer exit non-zero with a fault naming the reason and the ids
- `parser-replay-suite.ts` — the workout-parser benchmarks as a replay suite (`maxRetries: 0`: a cassette holds one call)
- `cassette-files.ts` / `manifest.ts` / `committed-directory.ts` — the committed directory `committed/` and its `manifest.json` (id + SHA-256 of the file per real cassette; empty for now). `replayCommitted` is the one entry point: missing, unlisted, duplicated, misnamed, digest-mismatched and stale cassettes, a stray file or subdirectory and an unreadable manifest all reach the exit code, and a faulted cassette is never replayed
- `fixtures/` — `recorder: "synthetic"` cassettes only; their model ids are `synthetic`, so even relabelled as real they are never measured

## Live lane (`claude-cli/`)

Local only: the maintainer's Claude Code subscription driven headless. It never
runs in CI, so nothing here may gate (`check-no-inert-floors` treats any runner,
`run-*.{ts,mts,cts,mjs,js,cjs}`, reaching this directory transitively as inert). Every unit test injects `spawn`; no
test starts the real binary.

- `detect-claude-cli.ts` — both locks before any process (`CI` set; `EVAL_LIVE` not `1`), then `claude auth status --json`; only `loggedIn`, `authMethod`, `apiProvider` are read, so no email or organization is kept
- `child-env.ts` / `empty-cwd.ts` / `clean-context-args.ts` / `run-process.ts` / `spawn-claude.ts` — one process per call: an allowlisted env (`PATH`, `HOME`, `USER`, `LOGNAME`, `SHELL`, `LANG`, `TMPDIR`, plus `MAX_THINKING_TOKENS=0`), a fresh empty cwd removed in a `finally`, an argument array, the prompt on stdin, the clean-context flags with `stream-json` output, a kill after `EVAL_CALL_TIMEOUT_MS` (default 300000); a non-zero exit, an `init` reporting an API key source other than none, or any tool, MCP server, skill or plugin, aborts as a harness fault
- `stream-messages.ts` — parses `init`, `result` and `rate_limit_event`; only named fields survive
- `claude-cli-language-model.ts` / `claude-request.ts` — the `LanguageModelV4` adapter (`doGenerate` only); every response declares the parity gaps (temperature, output-token limit, hidden system overhead); tools, file parts, a schema-less call and streaming are unsupported
- `rate-limit-guard.ts` — `SEVEN_DAY_FIELD`, **NOT PINNED** (tasks.md 3.4): every decision stops the pass as a harness fault until a real `rate_limit_event` fixes its name and scale. Pinned, the fraction governs (D1b): it stops strictly above `EVAL_MAX_WEEKLY_UTILIZATION` (default 0.85), `allowed_warning` continues, and any status other than `allowed` or `allowed_warning` stops
- `live-session.ts` / `live-config.ts` / `calibration-call.ts` — one call at a time, `EVAL_MAX_CALLS` (default 50, calibration and retries included), the official model (defined once, as `OFFICIAL_CASSETTE_MODEL`), and the calibration call whose input tokens above 1000 stop the pass as a context leak
- `live-main.ts` — the runner's body, injectable and tested: a bad argument or an inert detection is `refused` (exit 1), `--record` of the official model is refused before any call while `OFFICIAL_SERVED_FORM` is unpinned, a harness fault or context leak is `fault` (exit 2); `run-evals.ts` only maps the outcome to a literal
- `managed-settings.ts` — whether a Claude Code managed-settings file or its `managed-settings.d/` drop-in directory exists, by existence only (never opened or listed); the runner prints a note for each, because managed settings apply whatever `--setting-sources` says
- `live-pass.ts` / `parser-live-cases.ts` / `live-report.ts` / `live-summary.ts` — the pass: a stopped pass, a harness fault or an unsupported call leaves a case unmeasured, never failed; per-case k of n; a strict report (`eval-report-*.json`, gitignored) with cost labelled API-equivalent and the home directory written as `~` in every reason; a pass stopped on its budget or rate limit before any case was measured says so in its own line
- `recording-model.ts` / `record-case.ts` / `served-model.ts` / `cassette-writer.ts` — the recorder: one call per case (D4) and one cassette per case (its id is the case id, so a re-record replaces the file and its manifest entry), `modelUsage` naming exactly the requested model or a dated snapshot of it, the official model to `cassettes/committed/` with its manifest digest (the manifest is read and validated before the cassette is written; any write failure is a harness fault), any other model to the gitignored `packages/ai/.eval-cassettes/`. `OFFICIAL_SERVED_FORM` (in `cassettes/validate-cassette.ts`) is **NOT PINNED** (tasks.md 3.5), so every committed write is refused until a real result shows whether `modelUsage` keys the bare or the dated id. The committed directory is in `.prettierignore`, so lint-staged cannot change the bytes its digest covers
- `calibration-capture.ts` — `eval:live -- --calibrate`: one call, its `rate_limit_event`s projected to an allowlist of shapes (keys of letters and underscores only, so an id-keyed map is dropped with its numbers; numbers, booleans and enum words matching `^[a-z][a-z_]{0,31}$`, so no uuid, handle, host name, account key or free text survives under any key, and keys naming who or where are dropped too) and its `modelUsage` keys; the maintainer reviews the printed capture before committing any of it as a fixture. Written to `.eval-cassettes/calibration-<ts>.json` and printed, for pinning the two seams above

## Assertions per Benchmark

Each benchmark is evaluated against:

1. **Schema validation**: output must pass `workoutSchema` from `@kaiord/core`. A schema failure short-circuits; no other dimension is evaluated.
2. **Sport correctness**: if `expectedSport` is set, `workout.sport` must match.
3. **Step count**: `countSteps(workout)` must be within `[minSteps, maxSteps]` (nested steps in blocks are counted).
4. **Targets** (optional): if `targetCheck` is defined, every step (repetition steps included) must carry `targetType`; with `requireRange`, as an explicit `range`, so a zone left unresolved fails. `benchmark-invariants.ts` rejects a required range whose `athleteZones` has no table of that type.
5. **Structure** (optional): if `expectedRepeatCounts` is defined, the repetition blocks' `repeatCount`s must match it in order.
6. **Zone accuracy** (±5% tolerance, optional): if `zoneCheck` is defined, active steps of the target type must fall within `[minValue*0.95, maxValue*1.05]`. A zone check with no matching active step **fails** — it is not skipped.

Each dimension yields one outcome: `passed`, `failed` with a message, or
`unmeasured` with a reason. `unmeasured` is a member of the union, not a flag
beside a score, so there is no field on it a caller could average or compare —
a criterion nobody measured cannot enter a rate by looking like a zero.

Four dimensions are routinely unmeasured and say so: `sport` when the benchmark
declares no `expectedSport`, `zone` when it declares no `zoneCheck`, `targets`
when it declares no `targetCheck`, and `structure` when it declares no
`expectedRepeatCounts`. A schema failure marks the other five unmeasured rather than leaving them out,
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
| 4. End-to-end model behaviour | local   | `eval:live` on the maintainer's subscription only; never in CI, so it reports and records but never gates                            |
| 5. Human / preference         | NO      | no rater pool                                                                                                                        |
| 6. Production monitoring      | partial | `observability/` records usage telemetry; no quality signal is fed back                                                              |

Layers 1-3 gate every commit and need no credential. Layer 4 is the boundary:
it runs only where merges are not decided, so nothing here declares a
threshold — see below.

**There are no per-dimension thresholds, and there is no overall pass rate
gate.** Earlier revisions of this file documented a 100% schema threshold and a
≥95% sport threshold; neither was ever implemented — `evaluateBenchmark` folds
every dimension into one binary `pass`. They are not implemented now either,
deliberately: the live suite cannot run in CI (see the runner header), so any
threshold on it would be a number that never fires where it matters. A floor
belongs on the keyless replay lane, derived from a measured A/A run.

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
- **Run locally**: the maintainer runs `pnpm --filter @kaiord/ai eval:live` (add `-- --repeat N`, `-- --record` or `-- --calibrate`). An agent never runs it: every call spends the maintainer's subscription quota
- **Add a chat-tool benchmark**: Edit `chat-tool-benchmarks.json`, follow the schema above; if the scenario needs a new fixture answer, extend `chat-tool-fixtures.ts`

### Testing Requirements

- `assertions.test.ts`: Unit tests for `evaluateBenchmark`, zone checks, step counting, and failure attribution by dimension
- `benchmark-invariants.test.ts`: keyless checks that every `zoneCheck` in the fixture declares a usable bound. A bound of `0` is rejected in both directions — as a minimum the comparison is `min < 0`, which no target triggers; as a maximum it is `max > 0`, which every target triggers
- `chat-tool-assertions.test.ts` also scores the shipped `chat-tool-benchmarks.json` itself: every expectation must be in a shape `expectationFault` understands, and each benchmark must declare the expectation its own category is scored on. Without it a fixture could go green by declaring nothing the scorer reads
- `reporter.test.ts`: Unit tests for `createReport` grouping and `formatReport` output
- `chat-tool-assertions.test.ts`: Unit tests for `evaluateChatToolBenchmark` against fabricated `ChatTurnResult` values (no LLM calls)
- No integration tests for the `run-*.ts` CLIs; the live lane's modules are unit-tested under `claude-cli/` with an injected `spawn`
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
- `./claude-cli/load-live-model` — the live loader (parser runner only)

### External

- `ai` — `LanguageModel`, `UnsupportedFunctionalityError`; the live adapter implements its `LanguageModelV4` member
- the Claude Code CLI (`claude`), installed and logged in on the maintainer's machine — never a package dependency
- `zod` — chat-tool fixture schemas

## File Line Limits

The budget is the ESLint rule, not a transcript: `max-lines` 100 and
`max-lines-per-function` 40, both with `skipBlankLines` and `skipComments`. A
file here can therefore run past 100 physical lines and still be within budget,
which is why this section states the rule instead of a per-file count — an
earlier revision listed exact numbers and they went stale the first time a file
changed.

<!-- MANUAL: -->
