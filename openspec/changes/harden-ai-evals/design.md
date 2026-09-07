# Design: an eval program with no key

> Revision 2. Supersedes the criteria-registry design entirely. The consensus
> review's six conditions are addressed here and in `tasks.md`.

## The premise that decides everything else

There will be no provider API key. `load-eval-model.ts:33` throws without one,
and all three runners obtain their model through it. So:

| Lane                                                                  | Cases | Runs?        |
| --------------------------------------------------------------------- | ----- | ------------ |
| Assertion + reporter units (`src/evals/*.test.ts`)                    | 40    | every commit |
| Deterministic runtime lane (`agents/{generate-mode,runtime}.test.ts`) | 10    | every commit |
| `pnpm eval` (22 workout benchmarks)                                   | —     | **never**    |
| `pnpm eval:chat-tools` (2 cases)                                      | —     | **never**    |
| `pnpm eval:labs` (the lab fixture)                                    | —     | **never**    |

Everything this program delivered landed in the first two rows. That is not a
coincidence to note in passing; it is the design constraint.

**The rule this imposes:** a change is worth making only if it can fail without
a credential. A floor inside an unrunnable runner cannot fail, so it is not a
threshold — it is a comment with a comparison operator in it.

## Decision 1 — delete the criteria registry, and do not replace it

The original design built `packages/ai/src/evals/criteria/` and justified it
solely by import-compatibility with `eval-criteria`, so the module could later
be swapped one line at a time.

**That justification was written about a package nobody had opened.** Read since:

| Original claim                                     | Upstream                                                                                           |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| "rejects a `hardRequirement` in percent"           | `Unit` includes `"percent"` as first-class on a structured `Threshold`                             |
| local `owner` required                             | requires `agent`; there is no `owner`                                                              |
| `tier` as a discriminated union banning a T3 floor | `Tier` is a plain string union; `mayGate()` is runtime and its docstring **permits** declaring T3  |
| `hasFloor`                                         | `isEnforceable`                                                                                    |
| every floor must be declared                       | `hardRequirement: Threshold \| null` — "declared, with no floor agreed yet. That is a valid state" |
| five modules                                       | `src/domain/` holds two                                                                            |

The swap was never one line, and the two designs disagree on substance rather
than naming. But the decisive argument is simpler and does not depend on any of
that: **a registry exists to govern floors, and this project's floors cannot
fire.** Governing them well produces nothing.

**`gate.ts` goes with it.** The consensus review argued to keep it — a runner
that cannot exit on a bare number is a good invariant. It is, and under a
different premise I would keep it. Here it constrains three runners that never
execute, so it fails its own admission test. What survives instead is the
acceptance check, applied to the tree rather than to a module: no runner may
carry a floor at all.

## Decision 2 — the fixtures are a specification, so check the specification

The benchmarks cannot be run, but they can be _validated_. `zones-ftp` is the
case that shows why this is worth doing: its prompt text reads "3x15min at
88-93% FTP" and its `zoneCheck` is `{"targetType":"power"}` with no bounds. Both
comparisons in `assertions.ts:82-95` are guarded on `zc.minValue &&` and
`zc.maxValue &&`, so for the only power benchmark in the suite the check is
structurally unreachable. The author had the numbers in the sentence above and
did not transcribe them.

A keyless test that rejects a bounds-less `zoneCheck` at load turns that from a
silent hole into a red build, today, with no model involved. The same applies to
every structural claim the fixtures make about themselves.

**This is the shape the whole program should have taken:** the assertions and
fixtures are code, code can be tested, and testing it needs no credential.

## Decision 3 — inertness is declared, not implied

Deleting the floors is not enough, because the runners still exist and still
look like gates. Each states at its head what it is: a specification of good
output that cannot execute in this project, why (no key), and what would change
that. A reader who finds `run-evals.ts` should learn its status from the file,
not from a plan.

**What is kept, and on what grounds** — the three artifacts differ, and one
argument does not cover all of them:

| Artifact                                      | Why it stays                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The benchmark fixtures                        | B1/B2 make them keyless-validated: they earn their place by a test                                                                                                                                                                                                                 |
| `assertions.ts`, `*-checks.ts`, `reporter.ts` | 40 keyless cases cover them; they are live code                                                                                                                                                                                                                                    |
| The three `run-*.ts`                          | **No keyless value, and no test.** They stay because they are the executable form of the fixture-to-assertion wiring: delete them and the fixtures' contract — which fixture feeds which scorer, in what shape — becomes implicit, recoverable only by reading the tests backwards |

That third row is a real cost, honestly priced: three small orchestration files
with no coverage. It is **not** justified by "a future with a key is cheap to
re-enter" — this document says there will be no key, and using "never" to delete
the registry while using "someday" to keep the runners would be having it both
ways. If the wiring argument does not convince a reviewer, deleting the three
runners along with the `pnpm eval*` scripts and `eval.yml` is the defensible
alternative, and nothing else in this change depends on which is chosen.

## Decision 4 — absence and malformation, generalized from #1230

`Unmeasured` is a union member carrying a reason and **no `score`**, never a
boolean flag: a flag compiles and nobody reads it, so an unmeasured criterion
gets averaged into a rate by whoever forgets. Aggregates count `{measured,
passed}` separately and print both.

A scorer that receives a shape it does not understand reports a **harness
fault**, distinct from a failing score — folding "I did not understand the
input" into "the model did badly" reports a number where it should report a
broken instrument. Both patterns shipped for lab extraction in #1230
(`lab-extraction-assertions.ts`, exit code 2); this generalizes them to the
remaining scorers, where `chat-tool-assertions.ts:28,52` still has the
`?? {}` / `?? []` branches that silently substitute an empty expectation.

## Decision 5 — containment keeps its guard, and the guard must be able to fail

The containment group is the only one whose value never depended on a suite
running. Its design is unchanged from revision 1 except for its acceptance.

The original acceptance was: revert #1225's fix, observe the guard go red,
restore. That is not executable — reverting a merged commit by hand is a
one-off ritual no reviewer or CI can repeat, and against the live tree the guard
is green on its first run and every run after.

Replaced by what the test plan already specified correctly: a checked-in
negative fixture under `mkdtempSync` that fails, a field-outside-the-allowlist
case asserted as **not** caught (documenting the limit in an executable form),
a **zero-files-scanned result treated as a fault** — the hole
`check-ai-sdk-containment.mjs:56` has today, where `catch { return violations }`
returns green when it cannot read the directory — and a live-tree smoke
assertion.

The guard is a field-name allowlist and cannot see two classes it must not be
believed to cover: opaque nested payloads (`summarize-health.ts` forwards
`krd: unknown` verbatim), and externally-authored error text in action-tool
results — the class that produced the only live channel actually found, in
`sync-week.ts` with a field named `error` and no summarizer involved. The
declared sink inventory with a completeness check covers what the guard cannot:
the guard catches the fields you named, the inventory catches the sinks you
forgot.

## What this change does not do

- No LLM judge. Nothing here needs one, and a judge could not gate anyway.
- No retrieval, context or persona eval layers. They measure stages this
  product does not have.
- No language scorer. The `en|es|mixed` slice is useful for attribution and
  turning it into a layer means deciding what language a workout name should be
  in — a product question that is not settled.
- No growth of the chat-tool suite, and no widening of `eval.yml`. Both feed
  runners that cannot execute.
