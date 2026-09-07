# Tasks

Ordered so each group leaves the tree green on its own. Group A is already
merged; groups B–E are the work.

## A. Fence hardening — merged in PR #1225

- [x] A1. Neutralize the `<<<` prefix in `fenceUntrusted` before wrapping, with a
      replacement carrying no `<` so no delimiter re-forms across a boundary.
- [x] A2. Cover the breakout, the opening delimiter and the concatenation
      re-formation case in `fence.test.ts`.
- [x] A3. Fence `workout.name` in `summarizeWorkouts`, preserving `null` for
      unnamed workouts.
- [x] A4. Cover the injection-carrying imported name and the null name in
      `summarize-workouts.test.ts`.

## B. The criteria registry

- [ ] B1. Add `packages/ai/src/evals/criteria/` — `defineCriterion` with
      `bucket`, `stage`, `tier`, `metric`, `benchmark`, `hardRequirement`,
      `ideal`. Import-compatible with `eval-criteria` so the swap is one line
      per file. No I/O, no model calls, no `@kaiord/core` import.
- [ ] B2. Reject a `hardRequirement` outside `0..1`, and reject a floor whose
      unit differs from its `ideal`.
- [ ] B3. Make `benchmark` a discriminated union that prose cannot satisfy — a
      criterion that cannot name its source fails to compile.
- [ ] B4. Bind gating authority to tier: T1 may gate, T2 may gate only with a
      pinned model version, T3 never gates. Keep "may gate" and "has a floor"
      as two separate predicates.
- [ ] B5. Unit tests for B2–B4, including the rejection cases.

## C. One unit, and floors that name themselves

- [ ] C1. Convert `run-evals.ts` and `run-chat-tool-evals.ts` from
      `passRate >= 90` to a fraction.
- [ ] C2. Leave the lab-extraction floor at `0.7` and express it through the
      same declaration.
- [ ] C3. Declare all three floors as criteria, each naming its benchmark and
      its owner. The workout floor cites the published essay; the lab floor
      needs a stated source or a new measurement.
- [ ] C4. Fail the run when a declared floor has no benchmark, so the
      declaration cannot rot back into a bare comparison.

## D. Unmeasured, malformed, and what a run costs

- [ ] D1. Add `Unmeasured` as a union member carrying `reason` and **no**
      `score`. Let the compiler find every site.
- [ ] D2. Aggregate `{measured, passed}` separately and print both.
- [ ] D3. Add a test helper that throws when a criterion was not measured,
      rather than reading `.pass` off `undefined`.
- [ ] D4. Make each scorer reject a shape it does not understand as a harness
      fault, naming the value received; keep genuinely absent expectations a
      clean pass.
- [ ] D5. Compute a P90 over `durationMs` per suite and put it in the report.
- [ ] D6. Total token usage per run and put it in the report.
- [ ] D7. Declare latency and usage as criteria with `ideal` only. Do not
      promote either to a blocking floor in this change — watch them first.

## E. The guardrail layer

- [ ] E1. Add the keyless containment suite: fence breakout, opening delimiter,
      concatenation re-formation, and the length cap under a delimiter-heavy
      payload. Runs in `pnpm test`.
- [ ] E2. Add `scripts/check-untrusted-fields-fenced.mjs` — every recognized
      externally-authored field returned by a model-facing summarizer must be
      assigned from a `fenceUntrusted(...)` call.
- [ ] E3. Declare the recognized field-name set in one place, with a comment
      stating the guard is a syntactic allowlist check and does not catch a
      newly-invented field name.
- [ ] E4. Co-locate `check-untrusted-fields-fenced.test.mjs` using `node:test`,
      per the `scripts/` convention. Cover the pass case, the unfenced-field
      failure, and a field outside the set (documented as not caught).
- [ ] E5. Wire the guard into `pnpm test:scripts` alongside the existing
      mechanical guards.
- [ ] E6. Audit the remaining `summarize-*.ts` and the other model-facing tool
      results against the guard, and fence whatever it finds.

## F. Growing the chat-tool suite

- [ ] F1. Add a read case per read tool — asserting the tool called and the
      source named.
- [ ] F2. Add an action case per action tool — asserting the paused
      `pendingAction` and its input fields.
- [ ] F3. Set the suite's gate to all-pass until it is large enough for a
      fraction to discriminate, and say so next to the gate.

## G. Documentation and follow-ups

- [ ] G1. Record the eval-layer table — which layers exist, which are absent
      and why — where a reader of the eval suite will find it.
- [ ] G2. State in `packages/ai/README.md` that `eval.yml` is manual and has
      never run, so nobody reads the suites as a live gate.
- [ ] G3. Fix the invalid model id `claude-sonnet-4-5-20241022` in
      `packages/ai/README.md` and `packages/ai/AGENTS.md`; the real default is
      `claude-sonnet-4-5-20250929`.
- [ ] G4. Refresh the stale `AGENTS.md` files under `packages/ai` — all six are
      stamped 2026-05-14 and none mentions `agents/`, `chat/`, `providers/` or
      `observability/`.
- [ ] G5. Publish `eval-criteria` to npm and swap the local registry import.
- [ ] G6. Decide whether `eval.yml` earns a schedule, using the cost number D6
      produces.
