# Proposal: Turn the eval suites into gates, and give the guardrail layer something to measure

## Why

Kaiord has three eval suites and none of them can currently block a release for
a reason anyone has written down.

The suites are real and the tool layer is genuinely well built — chat-tool
scoring checks the _trajectory_ (which tool, which input fields), not just the
answer. What is missing is the contract around them:

- **Three gates, two units.** `run-evals.ts:51` and `run-chat-tool-evals.ts:67`
  compare against `90`; `run-lab-extraction-evals.ts:6` compares against `0.7`.
  Same concept, different scale, and the smaller number is the _looser_ gate.
  Anyone glancing at the three reads lab extraction as the strictest.
- **No threshold says where it came from.** `90` is defended in a published
  essay; `0.7` is defended nowhere. A floor with no stated owner launders an
  opinion into a gate.
- **Cost and latency are instrumented and ungated.** `durationMs` is on every
  result (`types.ts:24`) and printed per case (`reporter.ts:51`). Nothing reads
  it, and there is no token or cost metric at all.
- **The chat-tool suite is two cases.** At two cases a `>= 90` gate is a
  100 % gate wearing a percentage.
- **The paid lane has never run.** `.github/workflows/eval.yml` is
  `workflow_dispatch:` only — a deliberate, documented choice because the
  suites need an API key and cost money — but its run history is empty. No
  `eval-report-*.json` exists anywhere in the tree. The counterweight, the
  keyless deterministic lane, _does_ exist and does gate every commit
  (`agents/generate-mode.test.ts`, `agents/runtime.test.ts` on
  `MockLanguageModelV4`), so runtime plumbing is protected; real-model output
  quality has simply never been measured.

Separately, the untrusted-data fence just acquired a real invariant and has no
eval behind it. The fence exists so that text authored outside the app —
coaching descriptions synced from Train2Go, workout names arriving with
imported FIT/TCX/ZWO files and Garmin sync — cannot steer the assistant, which
holds six confirmation-gated action tools. Two defects were fixed in
`fix(ai): stop untrusted text from breaking out of its fence`: the wrapper did
not neutralize the delimiters inside its own payload, and `summarizeWorkouts`
never fenced `workout.name` despite the fence docstring claiming it did. Both
are now covered by unit tests, but the _contract_ — "every externally-authored
field that reaches a model is fenced" — is stated in a docstring rather than in
a spec, and nothing mechanically detects the next unfenced field.

## What Changes

- **One threshold unit across all suites.** Every gate expresses its floor as a
  fraction in `0..1`. `PASS_THRESHOLD = 0.7` and the two `passRate >= 90`
  comparisons converge on one scale, so the three numbers become comparable at
  a glance.
- **Every threshold names its origin and its owner.** A floor carries, next to
  the number, where the number comes from and who set it. A threshold that
  cannot say is not a gate.
- **Gating authority follows the scorer tier.** T1 deterministic scorers may
  block a release; T2 small-classifier scorers may block only with a pinned
  model version; T3 LLM-judge scorers may never block — they alert and queue a
  review. Kaiord is T1 throughout today, so this is a constraint on what may be
  added later rather than a change to what runs now.
- **Cost and latency become criteria with floors.** `durationMs` gains a P90
  threshold over each suite, starting as an `ideal` before it is promoted to a
  blocking floor. Token usage per case is recorded and totalled per run, so the
  cost of a suite is a number rather than a reason to avoid running it.
- **Absence of measurement becomes a domain state.** An eval result
  distinguishes _measured and failed_ from _never measured_, as a union member
  carrying no score rather than a boolean flag, so an unmeasured criterion
  cannot be averaged into a pass rate by accident.
- **A scorer refuses a shape it does not understand.** Malformed input is a
  harness fault reported red, never an absence reported green.
- **The chat-tool suite grows past the point where its threshold is
  decorative**, covering the read and action tool families rather than one
  scenario each.
- **New `ai-guardrails` capability**: the untrusted-data containment contract —
  the fence neutralizes its own delimiters, every externally-authored field
  reaching a model is fenced, and a keyless deterministic suite proves both,
  including a mechanical check that catches the next unfenced field the way
  `check-ai-sdk-containment.mjs` catches a stray SDK import.
- **Criteria are declared against a registry** rather than living as bare
  comparisons at the bottom of three CLIs: bucket, stage, tier, benchmark,
  `hardRequirement` and `ideal` per criterion.
- **Explicitly NOT in this change**: putting `eval.yml` on a schedule or a push
  trigger (it costs money per run; that is a budget decision, not a spec one),
  adding an LLM judge to any suite, and the retrieval/context/persona eval
  layers, which measure stages Kaiord does not have.

## Capabilities

### New Capabilities

- `ai-guardrails`: untrusted-data containment — the fence's neutralization
  obligation, the rule that every externally-authored field reaching a model is
  fenced, and the deterministic keyless suite plus mechanical guard that prove
  it.

### Modified Capabilities

- `ai-evals`: gains the gate contract — one threshold unit, declared benchmark
  and owner per floor, gating authority bound to the scorer tier, cost and
  latency as first-class criteria, and unmeasured-as-a-state.
- `ai-prompts`: the fence requirement is strengthened. It currently pins
  behavior as "unchanged, only ownership moves"; it must now require that the
  payload cannot terminate its own fence.

## Impact

- **Packages**: `@kaiord/ai` (public — eval harness, fence, criteria
  declarations; the fence change is already released as a patch),
  `@kaiord/workout-spa-editor` (private — fenced fields at the tool boundary).
  No new package.
- **Dependencies**: one candidate addition, `eval-criteria`
  (`github.com/pablo-albaladejo/eval-criteria`, public, MIT, zero runtime
  dependencies). **It is not on npm today** (`npm view` returns E404), so
  either it is published first or the criteria registry lands as a local module
  in `packages/ai` with the same shape. `design.md` carries that decision.
- **Persistence**: none. No Dexie schema change; evals do not touch the app
  database.
- **Hexagonal layers**: unchanged. Scorers and criteria are pure domain
  functions; the mechanical guard is a `scripts/` node test like its siblings.
- **Public API**: additive. Criteria declarations and the fence behavior are
  exported from existing subpaths; no export is removed or renamed.
- **CI**: the keyless guardrail suite joins `pnpm test`; the mechanical fence
  guard joins `pnpm test:scripts` alongside the existing eleven guards.
  `eval.yml` keeps its `workflow_dispatch` trigger.
- **Referenced specs**: `spa-ai-chat` (the confirmation contract the fence sits
  behind, consumed unchanged), `ai-agents` and `ai-observability` (the runtime
  and telemetry the suites exercise, unchanged), `test-conventions` (the new
  suites follow the title and AAA rules).
