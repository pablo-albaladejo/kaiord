# Tasks

> Revision 2. **No engineering task is admitted unless it can fail without a
> provider API key** — that is why the registry, the floor unification and the
> suite growth are gone rather than re-scoped. Documentation tasks (groups C, D2-D4
> and G) are admitted on a different ground: they remove statements that are
> false. Eight of the open items are of that kind and no test will ever catch
> them; saying so is cheaper than a preamble that claims a universal the list
> below it does not meet.

Gate: none. The blocking dependency of revision 1 (#1225) merged as `55b5701d`;
verify with `git merge-base --is-ancestor 55b5701d origin/main`, not the
pre-merge branch SHA the earlier draft pinned.

**Status: complete.** Groups A, B, C, D, F and G1 shipped in #1225, #1227,
#1229, #1230 and #1232. The last seven items — E1-E3, C4, D1b, G2, G3 — landed
together, because E1-E3 were one refactor rather than three tasks: the
`Unmeasured` union had to exist before an aggregate could honestly report
`{measured, passed}`, and E2 could not be satisfied while `measured` was
definitionally `total`.

Every item is verified against the tree, not against its own description. G2 is
the one worth naming: its six files already carried an `Updated: 2026-09-07`
stamp, and the package-root `AGENTS.md` under that stamp still listed three of
eight directories. A refreshed date over unrefreshed content is the same defect
this change exists to remove, one level up.

## A. Shipped

- [x] A1. `fenceUntrusted` neutralizes the fence prefix before wrapping, with a
      replacement carrying no `<` so no delimiter re-forms (#1225).
- [x] A2. Breakout, opening-delimiter and concatenation-re-formation cases in
      `fence.test.ts` (#1225).
- [x] A3. `summarizeWorkouts` fences `workout.name`, preserving `null` (#1225).
- [x] A4. Train2Go's upstream exception text no longer reaches the model through
      the `sync_coaching` tool result; `garminPushId` is validated at the source
      before it is persisted or returned (#1229).
- [x] A5. The lab fixture discriminates (GOT/GPT adjacent, an uncatalogued
      parameter), scoring covers five dimensions, the scorer is pure with
      keyless tests, and malformed output is a harness fault (#1230).

## B. Make the workout suite's specification checkable

- [x] B1. Reject a `zoneCheck` whose bounds the comparison cannot use, as a
      keyless test over `benchmarks.json`. **Land this alone and record the
      red**: the tree already contains such a case, so the test fails on the
      fixture as it stands, naming `zones-ftp`. That is the acceptance — not a
      mutation a reviewer performs by hand, which is the shape this revision
      rejected in W4.
- [x] B2. Give `zones-ftp` the bounds its own prompt states — `minValue: 88`,
      `maxValue: 93` — turning B1 green. Land after B1, not with it.
- [x] B3. Fix `assertions.ts:72`: no matching active steps must not be a silent
      pass. Return a named failure, or `Unmeasured` where that is the honest
      answer.
- [x] B3b. Fix the twin defect in the same function: `assertions.ts:82-95`
      guards on `zc.minValue &&` / `zc.maxValue &&` — **truthiness, not
      presence** — so a bound of `0` is declared yet unusable. Change both to
      `!== undefined`, and have B1 require bounds to be finite numbers. Leaving
      it is the same defect class this change exists to remove, inside the
      function being fixed.
- [x] B4. Invert `assertions.test.ts:274`
      (`"should skip zone check when no active steps match targetType"`), whose
      title states the defect as intended behaviour. **A currently-green test
      goes red — this is the change that satisfies the admission test.**

## C. Reconcile the documented gates with the real ones

**C1 is a fork, not a task.** `packages/ai/src/evals/AGENTS.md:28-31` documents a
100% schema threshold and a ≥95% sport threshold that do not exist —
`assertions.ts` folds every dimension into one binary `pass`. The two branches
are different sizes with different admission status, so choose before starting
or an executor takes the cheap one by default:

- [x] **C1a — delete the two lines.** Documentation-only; cannot fail
      mechanically. Correct if per-dimension gating was never wanted.
- [x] **C1b — implement them.** Per-dimension results out of `evaluateBenchmark`
      so a schema failure is distinguishable from a step-count miss. Passes the
      admission test: it is keyless and testable. Larger, and it changes what
      the suite would report if it could run.

> Not a task, a review instruction: no documentation pass may rewrite that file
> until C1 is settled. A fresher file restating a gate the code never
> implemented is worse than a stale one.

- [x] C3. Fix the invalid model id `claude-sonnet-4-5-20241022` in
      `packages/ai/README.md` (3 sites) and `packages/ai/AGENTS.md` (1). It does
      not exist; the real default is `claude-sonnet-4-5-20250929`.
- [x] C4. Guard the fix so it does not rot. The repo already freshness-guards
      the generated model catalog; a hand-fixed id in prose has no such guard
      and will drift again. Assert that every model id appearing in
      `packages/ai/{README,AGENTS}.md` and in `.github/workflows/eval.yml`
      exists in `MODEL_CATALOG`, or is explicitly listed as intentionally
      historical.

## D. Declare the inert suites inert

- [x] D1. Remove the floors from `run-evals.ts`, `run-chat-tool-evals.ts` and
      `run-lab-extraction-evals.ts`. A comparison that cannot execute is not a
      threshold.
- [x] D1b. Enforce it with `scripts/check-no-inert-floors.mjs`, not a grep: a
      runner whose model comes from a credential-requiring loader must not let
      any score decide its exit code. The obvious grep
      (`process\.exit\(.*(>=|<)`) is defeated by
      `const ok = rate >= 0.9; process.exit(ok ? 0 : 1);` — verified, zero
      matches — and, being directory-wide, would also forbid a future **keyless**
      runner that legitimately gates. Scope the check to inert runners and to
      the exit path, with a co-located `node:test` covering the variable-bound
      evasion and the keyless-runner exemption.
- [x] D2. Each runner states at its head that it cannot run in this project, why
      (no provider key; `load-eval-model.ts:33`), and what would change that.
- [x] D3. Fix `packages/ai/README.md:67`, which documents a ≥90% gate as live.
      Its CI section (`:95`) is already honest — it says the evals are a manual
      `workflow_dispatch` and not part of the pipeline because they need keys —
      so do not rewrite that; the missing half is that they can no longer run at
      all.
- [x] D4. Carry the declaration to the two surfaces a user touches first: the
      `eval`, `eval:chat-tools` and `eval:labs` scripts in
      `packages/ai/package.json:41-43`, which still advertise the runners, and
      `.github/workflows/eval.yml`, whose dispatch can now only throw at
      `load-eval-model.ts:33`.

## E. Absence and malformation, generalized

- [x] E1. `Unmeasured` as a union member with a `reason` and no `score`. Let the
      compiler find every site.
- [x] E2. Aggregates report `{measured, passed}` as a pair.
- [x] E3. A test helper that throws when a criterion was not measured, rather
      than reading `.pass` off `undefined`.
- [x] E4. Replace `chat-tool-assertions.ts:28,52`'s `?? {}` / `?? []` with a
      harness fault, so a reshaped input fails loudly instead of taking the
      "no expectations" branch. Genuinely absent expectations stay a clean pass.
- [x] E5. Name every rate E2 introduces for its scale, and keep rounding on the
      display side only. This is the one idea worth salvaging from the deleted
      `gate.ts`: "a result may not be reduced to a bare number someone then
      compares" is dead around three inert runners, but E1-E4 build genuinely
      runnable scoring code and the invariant is live there. The suites it came
      from carried two scales and a rate rounded before the comparison read it.

## F. Containment

- [x] F1. Keyless containment suite: fence breakout, opening delimiter,
      concatenation re-formation, and the cap under a delimiter-heavy payload.
- [x] F2. `scripts/check-untrusted-fields-fenced.mjs` — every recognized
      externally-authored field returned by a model-facing summarizer must be
      assigned from a `fenceUntrusted(...)` call.
- [x] F3. Its co-located `node:test` must contain: a negative fixture that
      **fails**, a field-outside-the-allowlist case asserted as **not caught**,
      **zero-files-scanned treated as a fault**, and a live-tree smoke
      assertion. No revert-a-merged-commit ritual.
- [x] F4. Declare the recognized field-name set in one place, stating that the
      guard is a syntactic allowlist and does not see opaque nested payloads or
      error text in action-tool results.
- [x] F5. Declared sink inventory over every value-returning `execute:` in
      `application/chat/tools/`, each with the reason it needs no fence, plus a
      completeness check. A bare-passthrough `execute` defaults to UNBOUNDED,
      never "pending".
- [x] F5b. Each entry must name **where each returned string was produced**, not
      only why it needs no fence. Provenance is what catches the class that was
      actually found: `sync-week.ts:81,85` fills `error` from an upstream
      exception, in `application/coaching/` — outside the inventory's declared
      scope — and reaches the model three files later through
      `use-chat-action-ops.ts` and `action-tools.ts:16`. An inventory reading
      only the `execute:` body sees an internal-looking object and clears it.
- [x] F6. Add `error`, `message` and `reason` to the recognized field set —
      externally-originated error strings are the class that produced the only
      live channel found.
- [x] F7. `summarize-coaching.ts:21,23` declares `title: string` /
      `description: string`, and `fenceUntrusted` returns `""` for both `null`
      and `""`, so an absent description is indistinguishable from an empty one
      — contradicting `ai-guardrails`' own "Absence survives fencing" scenario,
      and disagreeing with #1225's null-preserving `summarizeWorkouts`.
- [x] F8. Fix `check-ai-sdk-containment.mjs:56`'s `catch { return violations }`,
      which reports green when it cannot read the directory.
- [x] F9. Wire the new guard into `lint:parallel`. `test:scripts` needs no
      wiring — it is a fixed glob and collects the test automatically.

## G. Close-out

- [x] G1. Settle whether imported workout names are externally authored.
      `proposal.md` claimed they arrive from FIT/TCX/ZWO imports and Garmin
      sync; the provenance trace concluded user-authored. Correct whichever
      document is wrong — an overstated claim in a security spec is a defect.
- [x] G2. Refresh the six `AGENTS.md` files under `packages/ai`, all stamped
      2026-05-14, none of which mentions `agents/`, `chat/`, `providers/` or
      `observability/`. Separate chore PR.
- [x] G3. Record the eval-layer table — which layers exist, which are absent and
      why — after C1 settles what the layer actually gates.

## Dropped, with reasons

- **The criteria registry.** Its sole justification was a one-line swap to
  `eval-criteria`, which does not exist: upstream diverges on `percent` as a
  legal unit, `agent` vs `owner`, `Tier` as a plain union with a runtime
  `mayGate`, `isEnforceable` vs `hasFloor`, and `hardRequirement: null` as a
  valid state. And a registry governs floors; this project's floors cannot fire.
- **`gate.ts`.** Good invariant, wrong project: it constrains runners that never
  execute. The acceptance grep in D1 keeps what it was protecting.
- **Unifying the three floors.** They are being removed, not aligned.
- **Growing the chat-tool suite**, and **widening `eval.yml`**. Both feed
  runners that cannot run.
- **Latency and cost criteria.** `durationMs` measures wall clock around a
  retry loop, and nothing that reports it can execute.
