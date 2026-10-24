# @kaiord/ai

AI/LLM integration for the Kaiord health & fitness data framework. Converts natural language workout descriptions into structured KRD workout objects using the Vercel AI SDK.

## Installation

```bash
pnpm add @kaiord/ai ai @ai-sdk/anthropic
```

## Usage

```typescript
import { createTextToWorkout } from "@kaiord/ai";
import { createAnthropic } from "@ai-sdk/anthropic";

const provider = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const textToWorkout = createTextToWorkout({
  model: provider("claude-sonnet-4-5-20250929"),
});

const workout = await textToWorkout("30 minutes easy cycling", {
  sport: "cycling",
});
```

## Eval Suite

The eval suite validates LLM output quality against a curated set of workout descriptions.

### Running Evals Locally

The suite runs only on your local Claude Code subscription, through
`eval:live`; see [Live evals (local only)](#live-evals-local-only). No provider
API key is used.

```bash
# Default model (claude-sonnet-5, the official cassette model)
pnpm --filter @kaiord/ai eval:live

# Another Anthropic model
EVAL_MODEL=claude-haiku-4-5 pnpm --filter @kaiord/ai eval:live
```

`pnpm --filter @kaiord/ai eval` without `:live` stays inert unless `EVAL_LIVE=1`
is exported in your shell. The runner prints
per-case counts and saves a JSON report (`eval-report-<timestamp>.json`) in the
package directory, `packages/ai/`.

### Benchmarks

The benchmark suite (`src/evals/benchmarks.json`) contains 22 curated workout descriptions across:

- **Sports**: cycling, running, swimming, generic
- **Complexity**: simple, intervals, repetition blocks, mixed
- **Languages**: English, Spanish, mixed
- **Zones**: FTP percentages, HR zones, pace zones with expected value ranges
- **Edge cases**: very short, very long, ambiguous descriptions

### Assertions

Each benchmark is evaluated against these criteria:

Every assertion is per-benchmark and binary — `evaluateBenchmark` folds all of
them into one `pass`. There is no rate across benchmarks, so this table has no
threshold column to fill: an earlier revision listed 100% and >= 95% here, and
neither was ever implemented.

| Assertion         | Dimension | What it checks                                                                                                                                               |
| ----------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Schema validation | `schema`  | Output must pass Zod `workoutSchema`. A failure short-circuits; no other dimension is evaluated                                                              |
| Sport correctness | `sport`   | Detected sport matches `expectedSport`, when the benchmark sets one                                                                                          |
| Step count        | `steps`   | Between `minSteps` and `maxSteps`                                                                                                                            |
| Zone accuracy     | `zone`    | Active steps of the target type within +/- 5%. A zone check with no matching step **fails**; a check declaring no usable bound is rejected by a keyless test |

Each failure carries the dimension that produced it, so a red result says which
capability broke rather than only that something did.

**The suite carries no pass threshold and never runs in CI.** It runs live
only through `eval:live` on the maintainer's local subscription, and that
runner never gates. The floor it used to declare could not fire, so it was
removed rather than kept as decoration. What runs on every commit is the
assertion logic and the fixtures' own structural invariants, neither of which
needs a credential.

### Adding New Benchmarks

1. Edit `src/evals/benchmarks.json`
2. Add an entry following this schema:

```json
{
  "id": "unique-id",
  "text": "Natural language workout description",
  "expectedSport": "cycling",
  "minSteps": 1,
  "maxSteps": 10,
  "category": "simple|intervals|repetition|zones|mixed|edge",
  "language": "en|es|mixed",
  "zoneCheck": {
    "targetType": "power",
    "minValue": 200,
    "maxValue": 280
  }
}
```

The `zoneCheck` field is optional. When present, active steps with the specified target type are validated against the min/max values with a 5% tolerance.

### Live evals (local only)

This project holds no provider API key, and no eval runs in CI. The only live
model access is the maintainer's local Claude Code subscription, driven
headless (`claude -p`) behind a `LanguageModelV4` adapter, so the real agent
runtime runs unchanged above it:

```bash
pnpm --filter @kaiord/ai eval:live                  # one pass of the parser suite
pnpm --filter @kaiord/ai eval:live -- --repeat 5    # five passes, k of n per case
pnpm --filter @kaiord/ai eval:live -- --record      # one cassette per case
pnpm --filter @kaiord/ai eval:live -- --calibrate   # one call, captured for pinning
```

`eval:live` is the only script that sets `EVAL_LIVE=1`; with `CI` set or
without that opt-in the runner stops as `INERT` before any process starts.
`pnpm eval` stays inert only while `EVAL_LIVE` is not exported in your shell:
it never sets the opt-in, but it does not clear one you exported.
Each pass starts with a calibration call, runs one call at a time, stops after
`EVAL_MAX_CALLS` calls (default 50) or above `EVAL_MAX_WEEKLY_UTILIZATION`
(default 0.85), and reports cost as API-equivalent, never as money spent. It
never gates: the report holds per-case counts, not a pass rate. The chat-tool
and lab-extraction suites need tool calling and document file parts, which
`claude -p` cannot carry, so `eval:chat-tools` and `eval:labs` report every
case unmeasured and exit 0.

`--record` with the official model (`claude-sonnet-5`) writes the committed
cassettes (`src/evals/cassettes/committed/`) and their manifest entries; the
served form is pinned to the bare `claude-sonnet-5`. `pnpm test` replays them
keylessly and fails on any fault. With any other `EVAL_MODEL` it
writes to `packages/ai/.eval-cassettes/`, which is gitignored and never listed
in the manifest.

## License

MIT
