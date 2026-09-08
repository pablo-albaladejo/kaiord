> Completed: 2026-09-08

# Proposal: Move the eval program onto the lanes that can actually run

> Revision 2 — rewritten after consensus review returned REJECT, and after the
> project confirmed there will be no provider API key.

## Why

The first version of this proposal argued that Kaiord's eval floors were
inconsistent and should be unified behind a criteria registry. Consensus review
rejected it, and two facts established since make the original framing wrong
rather than merely incomplete.

**There will be no provider API key, now or later.** All three eval runners —
`run-evals.ts`, `run-chat-tool-evals.ts`, `run-lab-extraction-evals.ts` — obtain
their model through `loadEvalModel`, which throws without one. So the three
suites are not "manual, and nobody has remembered": they are **permanently
unrunnable**, and every floor inside them is decorative by construction. Their
units are still inconsistent as this is written — `run-evals.ts:51` and
`run-chat-tool-evals.ts:67` compare `passRate >= 90` in percent while
`run-lab-extraction-evals.ts:19` uses the fraction `0.7`, so the numerically
smaller floor is the looser one — but that inconsistency is no longer worth
fixing. Unifying the units, giving them owners, or routing them through a
registry would produce a well-governed set of numbers that can never fire.

**The value is already in the keyless lanes, and that is where it stayed.**
Fifty test cases run on every commit with no credential: 40 over the assertion
and reporter logic in `packages/ai/src/evals`, plus the 10-case deterministic
runtime lane on `MockLanguageModelV4` in `packages/ai/src/agents`. Everything
this program has actually delivered — the fence hardening (#1225), the two
unfenced channels (#1229), the discriminating lab fixture and its five-dimension
scorer (#1230) — landed there, and none of it needed a registry.

The original proposal also rested on a factual error. `design.md` described
`eval-criteria`'s shape without anyone having read the package. Verified against
upstream: `Unit` includes `"percent"` as first-class (the design claimed it is
rejected), the required identity field is `agent` rather than `owner`, `Tier` is
a plain string union with a runtime `mayGate()` whose docstring explicitly
permits declaring a T3 criterion, the predicate is `isEnforceable` not
`hasFloor`, and `hardRequirement: Threshold | null` models "declared, no floor
agreed yet" as a valid state that this proposal's own rule forbids. The
"one-line swap" that justified building a local module is not available.

## What Changes

- **The three paid suites are declared inert, in the code that holds them.**
  Each runner states at its head that it cannot execute in this project, why,
  and what would have to change. Their floors are removed rather than unified:
  a number that cannot fire is not a threshold, and leaving it dressed as one is
  the failure this whole program exists to remove.
- **The benchmark fixtures gain keyless invariants.** They are a specification
  of good output; that specification can be checked without a model. A
  `zoneCheck` declaring neither bound is rejected at load, so
  `benchmarks.json`'s `zones-ftp` — whose own prompt demands "3x15min at 88-93%
  FTP" while its check carries no bounds, making both comparisons in
  `assertions.ts:82-95` structurally unreachable — becomes a failing case rather
  than a silent one.
- **`assertions.ts:72`'s silent pass is fixed**, and `assertions.test.ts:274` —
  a green test whose title states the defect as intended behaviour — is
  inverted. This is the one change in the program that makes something which
  passes today fail tomorrow.
- **`packages/ai/src/evals/AGENTS.md` is reconciled with the code.** It
  documents a 100% schema threshold and a ≥95% sport threshold; neither exists.
  Either they are implemented as separate criteria or the lines are deleted.
  The documentation pass may not rewrite that file without settling it.
- **Absence of measurement becomes a distinct result**, as a union member
  carrying a reason and no score, so an unmeasured criterion cannot be averaged
  into a pass rate. A scorer refuses input whose shape it does not understand,
  reporting a harness fault rather than a score of zero. Both patterns are
  already shipped for lab extraction in #1230; this generalizes them.
- **The untrusted-data containment work proceeds**, with its guard, its declared
  sink inventory and its completeness check — the one group whose value does not
  depend on any suite running.
- **Explicitly NOT in this change**: the criteria registry, in any form; any
  unification of floors that cannot fire; growing the chat-tool suite, which
  feeds a runner that cannot execute; and widening `eval.yml`, which invokes
  those runners.

## Capabilities

### New Capabilities

- `ai-guardrails`: untrusted-data containment — the fence's neutralization
  obligation (shipped in #1225), the rule that every externally-authored field
  reaching a model is fenced, the declared sink inventory with its completeness
  check, and the keyless suite that proves them.

### Modified Capabilities

- `ai-evals`: reframed around what can execute. Unmeasured-as-a-state and
  malformed-as-harness-fault become requirements; benchmark fixtures gain
  keyless structural invariants; the inert suites must declare their own
  inertness; floors that cannot fire are removed.
- `ai-prompts`: the fence requirement is strengthened to forbid a payload
  terminating its own fence. Shipped in #1225; the spec catches up.

## Impact

- **Packages**: `@kaiord/ai` (public — assertions, fixtures, runners) and
  `@kaiord/workout-spa-editor` (private — fenced fields at the tool boundary).
- **Dependencies**: none added. The `eval-criteria` dependency is withdrawn.
- **Persistence**: none.
- **Public API**: none. `src/evals/**` is not a build entry and not in
  `exports`, so this is internal-only and needs no changeset.
- **CI**: new keyless cases join `pnpm test`; the containment guard joins
  `pnpm test:scripts` and `lint:parallel`. `eval.yml` is untouched — it invokes
  runners that cannot run, and `eval` is not a required check.
- **Referenced specs**: `spa-ai-chat` (the confirmation contract behind the
  fence, unchanged), `ai-agents` and `ai-observability` (unchanged),
  `test-conventions` (new suites follow the title and AAA rules).
