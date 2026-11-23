## Why

Issue #1648 (parent #1670, story 75; Implementation Decisions "Assistant": the
model interprets, the code computes). Zones were already resolved in code
(#1503): the model names a zone and code puts the athlete's m/s. Every other
number the workout parser produced was still the model's own arithmetic:

- the prompt told it to convert min/km to m/s (`mps = 1000 / (minutes * 60 +
seconds)`) and listed five worked conversions to copy;
- it added minutes and hours into seconds and kilometres into metres;
- it divided a block's total time by its cycle to get a repeat count;
- it took the midpoint of a % max heart-rate range;
- "800 m in 3:10", "12 km/h", a pace per mile or per 100 m, and "at 10K pace"
  had no form at all except a number the model worked out.

A model's arithmetic is a sample, not a calculation: a pace that is right ten
times can be wrong the eleventh, and a wrong one looks plausible and reaches
the watch. Separately, the `push_to_garmin` chat Tool ran without the
athlete's confirmation card, against the `spa-ai-chat` requirement, the
GLOSSARY ("a Tool that changes anything waits for the athlete to confirm it")
and the landing ("each one waits for your confirmation"), while the system
prompt told the model the app would ask first.

## What Changes

- **The model copies, code computes.** The parser's wire schema and prompt
  (1.4.0) take the coach's numbers in the coach's units: time parts
  (`hours`, `minutes`, `seconds`), distance parts (`meters`, `kilometers`,
  `miles`), a pace `{ unit: "pace", per, clock[, clockTo] }`, a `split` over
  the step's distance, a `kmh`/`mph` speed, a `reference` (threshold, 10k, 5k,
  half_marathon, marathon), a % max HR range as `min`/`max`, and a block
  `fill` instead of a computed `repeatCount`. Code computes seconds, metres,
  m/s (rounded to 0.001), the midpoint, the repeat count, and the zone a
  reference names (then the existing zone resolution puts the athlete's range).
- **A computed speed is refused.** A pace in m/s (or an m/s range) from the
  model fails validation and the retry loop asks for the coach's literal.
- **Evals measure the numbers.** A `numbers` dimension checks exact computed
  values; ten pace-arithmetic benchmarks (five English, five Spanish) declare
  them. Keyless tests drive each through the real runtime with a hand-written
  rule-following model output; the live record is pending (see Impact).
- **Confirmation is true.** `push_to_garmin` waits for the confirmation card
  like every action Tool; its description says so; a test ties every Tool's
  description to its `requiresConfirmation`, and every action Tool is proven
  to park at the card. `create_workout` tells the model to pass the coach's
  numbers exactly as written.

## Impact

- `@kaiord/ai`: parser wire schema, prompt 1.4.0, validate pipeline, evals
  (minor: new accepted forms; a model answer in m/s is now refused).
- `@kaiord/workout-spa-editor`: chat Tool descriptions, confirmation path.
- **The 25 committed cassettes are stale and the 10 new cases are uncovered**
  until the maintainer runs `EVAL_MODEL=claude-sonnet-5 pnpm --filter
@kaiord/ai eval:live -- --record`. Until then `committed-replay.test.ts`
  fails, by design: a prompt change without an eval does not exist. No agent
  may run the live lane, and no API key exists in CI (#1649).
