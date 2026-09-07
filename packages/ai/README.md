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

```bash
# Set your API key
export ANTHROPIC_API_KEY=sk-ant-...

# Run with default model (claude-sonnet-4-5-20250929)
pnpm --filter @kaiord/ai eval

# Run with a specific model
EVAL_MODEL=claude-sonnet-4-5-20250929 pnpm --filter @kaiord/ai eval
```

The eval runner outputs pass/fail per benchmark and saves a JSON report to the working directory.

### Benchmarks

The benchmark suite (`src/evals/benchmarks.json`) contains 22 curated workout descriptions across:

- **Sports**: cycling, running, swimming, generic
- **Complexity**: simple, intervals, repetition blocks, mixed
- **Languages**: English, Spanish, mixed
- **Zones**: FTP percentages, HR zones, pace zones with expected value ranges
- **Edge cases**: very short, very long, ambiguous descriptions

### Assertions

Each benchmark is evaluated against these criteria:

| Assertion         | Threshold     | Description                                                                                                                                                     |
| ----------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema validation | 100%          | Output must pass Zod `workoutSchema`                                                                                                                            |
| Sport correctness | >= 95%        | Detected sport matches expected sport                                                                                                                           |
| Step count        | per-benchmark | Between `minSteps` and `maxSteps`                                                                                                                               |
| Zone accuracy     | +/- 5%        | Active steps of the target type within tolerance. A zone check with no matching step **fails**; a check declaring no usable bound is rejected by a keyless test |

**The suite is inert in this project and carries no pass threshold.** Its
runner needs a provider API key, which this project does not have, so it has
never executed. The floor it used to declare could not fire, so it was removed
rather than kept as decoration. What runs on every commit is the assertion
logic and the fixtures' own structural invariants, neither of which needs a
credential.

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

### CI Integration

Evals run via GitHub Actions as a manual `workflow_dispatch` trigger (`.github/workflows/eval.yml`). Results are uploaded as workflow artifacts. Evals are not part of the standard CI pipeline because they require LLM API keys and incur costs.

## License

MIT
