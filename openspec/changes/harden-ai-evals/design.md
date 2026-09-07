# Design: eval gates and the guardrail layer

## The two axes, and why both are needed

The framework this change applies cuts an LLM application twice.

**By stage** — six eval layers, each with its own unit under test, ground truth
and scorer: retrieval, language, guardrails, context, persona, tools. **By
capability** — four buckets: domain-specific, generation, instruction-following,
cost and latency. A finding needs both coordinates, because the same red number
means opposite things depending on which cut it came from: "the model is bad"
and "the instruction is bad" produce identical output and have opposite fixes.

Where Kaiord stands on the stage axis, verified against `main`:

| Layer          | Tier | State                                                                                                                                                                                                |
| -------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6 · Tools      | T1   | **working** — `chat-tool-assertions.ts` scores the trajectory: which tool was called, and for actions, the paused `pendingAction` input fields                                                       |
| 3 · Guardrails | T1   | **absent today; this change builds it**                                                                                                                                                              |
| 2 · Language   | T1   | sliced, never scored — `benchmarks.json` carries `language: en\|es\|mixed` and `reporter.ts` breaks results down by it, but nothing asserts the _reply's_ language. A fixture dimension, not a layer |
| 1 · Retrieval  | T1   | absent — no RAG in the eval path                                                                                                                                                                     |
| 4 · Context    | T2   | absent — no authored context or history under test                                                                                                                                                   |
| 5 · Persona    | T3   | absent, **and correctly so** — Kaiord parses workouts; it has no persona to hold                                                                                                                     |

Four of six absent is not a failing grade. Kaiord is a structured-output
product, so the layers that matter are the ones it has. Naming the absences is
what stops someone reading the suite as broader than it is.

**The layer numbers are identity, not sequence.** They are ordered by how
expensive the ground truth is to _obtain_. The order to _work_ in is by scorer
tier — what a layer costs to run on every change — which is why guardrails
(T1, truth is a written policy) comes before context (T2, needs an entailment
classifier).

## Decision 1 — one unit, and it is the fraction

`0..1`, not percent. Three reasons, in order of weight:

1. It is the unit two of the three suites would have to move to anyway if a
   criteria registry validates ranges, because a fraction has a natural bound
   and a percentage does not.
2. `passRate >= 90` reads as a gate on a number that happens to be a percentage
   of something; `>= 0.9` reads as a ratio, which is what it is.
3. It makes the current mix visibly wrong rather than quietly wrong: `0.7`
   beside `0.9` is obviously the looser floor, where `0.7` beside `90` is not.

The migration is mechanical and one-directional: divide the two `90`s by 100,
leave `0.7` alone.

## Decision 2 — the registry, and where it lives

The criteria table has an implementation already:
`github.com/pablo-albaladejo/eval-criteria` — public, MIT, zero runtime
dependencies, domain-only by construction. Its `defineCriterion` carries
exactly the fields this change needs (`bucket`, `stage`, `tier`, `benchmark`,
`hardRequirement`, `ideal`), its `benchmark` field is a discriminated union
that prose cannot satisfy, and its unit validation rejects a `hardRequirement`
in percent beside an `ideal` in fractions — which is Kaiord's `90` / `0.7` mix
exactly.

**It is not published to npm** (`npm view eval-criteria` returns E404, and the
repo has been untouched since 2026-08-24). So there are two paths:

- **A — publish it first, then depend on it.** Correct long-term: the package
  was deliberately born outside both consuming repos because a private package
  can never be consumed by a public one, and that direction only works one way.
  Costs a release pipeline in another repo before any Kaiord work lands.
- **B — land the criteria as a local module in `packages/ai/src/evals/criteria/`
  with the same shape**, and swap the import when the package publishes.

**Chosen: B, with A as the follow-up.** The shape is what carries the value —
a criterion that cannot name its `benchmark` fails to compile — and that
constraint is enforceable locally today. Blocking Kaiord's gates on a release
in another repo trades a working gate for a tidier import. The module is
deliberately import-compatible so the swap is a one-line change per file, and
the local version does not grow Kaiord-shaped assumptions: no I/O, no model
calls, no `@kaiord/core` import.

## Decision 3 — unmeasured is a union member, not a flag

The obvious design is `{ pass: boolean; score: number; measured: boolean }`.
It compiles, it merges, and nobody reads it — a flag is optional for the
consumer, so an unmeasured criterion is averaged into a pass rate by whoever
forgets.

Instead:

```ts
type Unmeasured = { readonly measured: false; readonly reason: string };
type CriterionResult = ScoreResult | Unmeasured;
```

`Unmeasured` **carries no `score`**. That is what makes it hold: it cannot be
averaged, summed or compared by accident, and anyone who wants a number has to
decide in code what an absence means. The compiler finds every site, tests
included.

The aggregate counts `{measured, passed}` separately and prints both, because
"37 passed" does not mean the same thing over 40 as over 276.

A corollary that is easy to miss: the _tests_ also need to distinguish
"measured and failed" from "never measured". A helper that throws when a
criterion was not measured, rather than reading `.pass` off `undefined`.

## Decision 4 — malformed is not absent

Every scorer that accepts a list of expectations has an "if there are no
expectations, pass" branch. That branch is where a suite goes quietly green: if
the harness reshapes the scorer's input — variable expansion, batching, a retry
wrapper — the guard `Array.isArray(x)` returns false, the list reads as empty,
and the branch returns pass for every case.

So the rule is two-sided:

- **absent** expectations → clean pass, as today;
- **malformed** input → red, naming the value received and the expected shape.

This is a scorer-level obligation, not a config one, because the config that
would prevent the reshape can be overridden by an env var, a per-test override
or a provider default change. The scorer is the only place the check cannot be
routed around.

## Decision 5 — what the guardrail layer measures

The unit under test is **containment**: can text authored outside the app reach
the model as anything other than inert data?

Two obligations, both T1 and both keyless:

1. **The fence cannot be terminated by its payload.** Neutralize the `<<<`
   prefix shared by both delimiters. Deleting the whole delimiter instead is
   itself exploitable: in `<<</untr` + DELIM + `usted_data>>>` the deletion
   splices the surrounding halves back into an intact delimiter. The
   replacement must carry no `<`, so nothing re-forms across a replacement
   boundary. Already implemented and tested.
2. **Every externally-authored field reaching a model is fenced.** This is the
   half that unit tests cannot hold, because the failure is an _omission_ —
   `summarizeWorkouts` passed `workout.name` through raw for as long as the
   function existed, while the fence's own docstring claimed the field was
   covered. A test proves the fields you remembered.

So (2) needs a mechanical guard, in the shape the repo already uses eleven
times over: a `scripts/check-*.mjs` with a co-located `node:test` suite, run by
`pnpm test:scripts` in the lint job and by the pre-commit hook.

**The guard's rule, and its known limit.** Every property of a value returned
from `application/chat/tools/summarize-*.ts` whose type is `string | null` and
whose name is in a declared set of externally-authored fields (`name`, `title`,
`description`, `notes`) must be assigned from a `fenceUntrusted(...)` call.
This is a syntactic check over an allowlist, so it catches the next
`summarize-*` that forgets a known field and does **not** catch a
newly-invented field name nobody added to the set. That limit is deliberate:
the alternative is a taint analysis, and an approximate guard that runs beats a
precise one that does not exist. The allowlist is the artifact to review when a
new summarizer lands.

## Decision 6 — growing the chat-tool suite

Two cases prove the harness and cannot catch a regression. At two cases a
`>= 0.9` gate fails on one failure, which is what an all-pass gate does, so the
threshold is currently decorative.

The suite grows to cover the two tool _families_ rather than one scenario each:
every read tool asserted for the tool it should call and the source it should
name, and every action tool asserted for the paused `pendingAction` and its
input fields. Twelve tools, so the floor stops being a rounding artifact.

Until it grows, the honest gate is all-pass, not `>= 0.9`.

## What this change deliberately does not do

- **No LLM judge anywhere.** Nothing Kaiord measures needs one: the output is a
  structured object checked against a schema, not prose checked against a
  source. A judge would add drift and per-call cost for no signal, and by the
  tier rule it could not gate anyway.
- **No schedule on `eval.yml`.** The paid suites cost money per run and the
  cost has never been measured. Adding the token metric in this change is the
  prerequisite for that decision; making it is not.
- **No retrieval, context or persona layers.** They measure stages this product
  does not have. Six sub-scores over a pipeline nobody has measured once is
  instrumentation theatre; two layers measured and gated beat six measured and
  ignored.
- **No language scorer yet.** The slice exists and is useful for attribution
  (a red run says "the Spanish cases broke"). Turning it into a layer means
  asserting the _reply's_ language, which for a structured-output product means
  deciding what language a workout `name` should be in — a product question
  that is not settled.
