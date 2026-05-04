## Context

The PR-time CI workflow (`.github/workflows/ci.yml`) has 10+ jobs that need compiled package output (`packages/*/dist/`) before they can run their actual checks: lint (matrix ×2), typecheck, build, test (matrix 9 packages × 2 Node versions), test-cli (×2), test-frontend (×2), round-trip (×2 packages), e2e-frontend (×4 shards), e2e-prod-base. Every one of those jobs currently runs `pnpm -r build` from a clean checkout.

The `build` job at `ci.yml:483-515` already uploads `packages/*/dist/` and `packages/*/package.json` as a `build-artifacts` artifact (retention 7 days). No consumer reads it, so it is dead weight. There is also a `setup-pnpm` composite cache for TypeScript output keyed by `hashFiles('packages/*/tsconfig.json', 'packages/*/src/**/*.ts')`, but the global key invalidates the entire cache on any source-file change, so it is essentially a no-op on real PRs and is left untouched here.

The change re-wires the existing producer/consumer relationship: keep the `build` job as the single producer; make every consumer depend on it and download the artifact instead of compiling.

## Goals / Non-Goals

**Goals:**

- Run `pnpm -r build` exactly once per CI run for non-docs PRs.
- Preserve existing behavior on docs-only PRs (the `should-test == false` short-circuit still skips everything).
- Preserve existing matrix coverage (Node `22.18.0` and `24.x` for jobs that have it today).
- Fail fast: if `build` fails, downstream jobs are skipped, not run with stale or rebuilt output.
- Zero changes to package source, exports, or runtime behavior.
- Zero new external tools or dependencies.

**Non-Goals:**

- Adopting Turborepo, Nx, or any task-graph runner.
- Removing or rewriting the per-package change-detection bash in `detect-changes`.
- Cross-run caching (the artifact is scoped to a single workflow run, by design — that is what makes it correct).
- Changing the `setup-pnpm` composite action's TypeScript dist cache (left as-is).
- Replacing the matrix Node-version testing model.
- Changing the release workflow (`release.yml`), the failure-bot workflow, or any other workflow file.

## Decisions

### Decision 1: Reuse the existing `build-artifacts` artifact name and paths

**Choice**: Keep the upload step at `ci.yml:508-515` as-is. Consumers download the same artifact name (`build-artifacts`).

**Why**: It is already there and already correct (`packages/*/dist/` + `packages/*/package.json`). Renaming would create churn with no benefit.

**Alternatives considered**:

- Use `actions/cache` keyed by commit SHA — rejected. The artifact mechanism is simpler, has built-in run-scoping (no risk of cross-run collisions), and does not consume the cache quota.
- Split per-package artifacts — rejected. The download-everything model is simpler and the total artifact size is small (we ship JS + `.d.ts`, no native bindings).

### Decision 2: Single artifact serves both Node-version matrix legs

**Choice**: One artifact, produced by the `build` job on its single Node version. Both Node `22.18.0` and Node `24.x` matrix legs of consumer jobs download the same artifact.

**Why**: Our packages compile to portable JS + `.d.ts` via `tsup`/`tsc`. There are no native bindings shipped in `dist/`, no Node-version-specific code paths in build output. The `package.json` `engines` field is what enforces runtime compatibility — that is unaffected. The Node-version matrix exists to validate **runtime** behavior (test execution under different Node versions), not to validate that compilation produces different output.

**Alternatives considered**:

- Build the artifact under each Node version in the matrix — rejected. Doubles `build` job time for no observable benefit; the artifacts would be byte-identical for our build configuration.

**Verification**: a one-shot diff during rollout (Decision 7) confirms output is byte-identical across Node 22 and Node 24 builds. If the diff is non-empty for any package, this decision must be revisited before merge.

### Decision 3: Consumers gain `needs: [detect-changes, build]` AND drop `if: always()`

**Choice**: Every consumer job's `needs:` includes both `detect-changes` (for the `should-test` gate) and `build` (for the artifact dependency). Additionally, each consumer's existing `if: always() && needs.detect-changes.outputs.should-test == 'true'` clause MUST be rewritten to drop `always() &&`, becoming simply `if: needs.detect-changes.outputs.should-test == 'true'`.

**Why**: GitHub Actions' default `if:` for a job with `needs:` is implicit `success()` over the union of upstream jobs — i.e., a job is skipped if any upstream failed or was skipped. The `always()` function explicitly defeats that default and forces the job to run regardless of upstream status. Today, every consumer carries `if: always() && …` (see `ci.yml:208, 397, 414, 520, 568, 613`). Adding `needs: build` to a consumer with `always()` would NOT short-circuit on build failure; the job would still run, fail to find the artifact, and produce a noisy unrelated error. This directly contradicts the "Build failure short-circuits consumers" spec requirement.

**Why was `always()` there in the first place?** Historical: `always()` was the simplest expression that ensured consumers ran even if `detect-changes` produced no should-test=true output (e.g., bot commits where `detect-changes` is skipped via `if: github.actor != 'github-actions[bot]'`). After the rewrite, the desired behavior is exactly the opposite: bot commits and docs-only PRs SHOULD skip consumers, and a failed `build` SHOULD skip consumers. Default `success()` semantics give us all three for free.

**`if:` clauses are otherwise preserved** so the `should-test == 'true'` gate continues to work; `e2e-frontend` and `e2e-prod-base` keep their `frontend-changed == 'true'` gate (they currently use `if: |` multi-line with `needs.build.result == 'success'` explicitly — that explicit success check is redundant once `always()` is dropped, but harmless).

**Verification**: spec scenario "Consumer if-clause does not contain always" + tasks step that greps `ci.yml` for `if: always() &&` in any consumer-job `if:` clause.

### Decision 4: Build job inherits the docs-only gate

**Choice**: Add `if: needs.detect-changes.outputs.should-test == 'true'` to the `build` job (it currently lacks this gate but the consumers all have it).

**Why**: Today the build job runs on docs-only PRs even though every consumer skips. Cheap fix: add the gate. After fan-out, building on docs-only PRs would still be wasteful — and the gate is required anyway so docs-only PRs do not break (no build → consumers must already be skipped, which they are).

### Decision 5 (REOPENED in iter-4): Each consumer invokes a `consume-build-artifacts` composite action

**Choice (revised)**: Create `.github/actions/consume-build-artifacts/action.yml` that wraps the three-step wipe → download → verify pattern, and have each consumer invoke the composite action via a single `uses: ./.github/actions/consume-build-artifacts` step.

**Why the reopen**: Iter-1 Decision 5 rejected the composite action with the rationale "two lines of YAML per consumer is cheaper than another layer of abstraction." That rationale held when the pattern was a single `download-artifact` step. After iter-2 (added `Verify dist exists`) and iter-3 (added `Wipe stale dist` and symlink rejection), the pattern is now ~25 lines per consumer — and there are 8 consumers. Inlining produces ~200 lines of duplicated, drift-prone YAML where every error message and every find-expression must be edited in 8 places. The composite action collapses this into one definition + 8 single-line invocations.

**What the composite action contains**:

1. `Wipe stale dist` (`rm -rf packages/*/dist`) — neutralises `setup-pnpm`'s TypeScript-cache restore.
2. `Download build artifacts` (`actions/download-artifact@v7`, name: `build-artifacts`, path: `.`).
3. `Verify dist exists and contains no symlinks` — fails fast with the actionable error message (artifact name, producing job, recovery path) defined in tasks §5A.

**Inputs**: a single `expected-packages` input (space-separated package names) so SPA-only consumers (`e2e-frontend`, `e2e-prod-base`, `test-frontend`) can narrow the verification to just `workout-spa-editor` and surface a clearer error if the SPA dist is missing.

**Why this isn't `setup-pnpm-with-artifacts`**: keeping the composite single-purpose (artifact consumption only) preserves `setup-pnpm`'s independent role and avoids the scope-creep risk of a "kitchen-sink composite." Future consumers that want pnpm setup but NOT artifact consumption (e.g., `bundle-analysis`) keep using `setup-pnpm` alone.

**Alternatives considered**:

- Inline the 3-step pattern in every consumer — rejected (the iter-1 position). The 8× duplication is a real maintenance liability.
- Split into two composites (one for wipe, one for download+verify) — rejected as gratuitous.
- Defer the composite to a follow-up PR — rejected because it materially affects the diff size and contributor experience of THIS PR. Better to land it together.

### Decision 6: `e2e-frontend` already declares `needs: [detect-changes, build]`

**Choice**: For `e2e-frontend` and `e2e-prod-base`, only add the `download-artifact` step and remove `pnpm -r build`. The `needs` edge already exists.

**Why**: Per `ci.yml:663` and `ci.yml:700`, e2e jobs already gate on `needs.build.result == 'success'`. They just rebuild instead of consuming. Surgical change.

### Decision 7: Rollout via a single PR with manual verification

**Choice**: Land everything in one PR. Verify by:

1. Opening the PR and confirming each consumer job downloads the artifact and runs to green.
2. Confirming wall-clock CI time on the PR is materially lower than recent baseline PRs.
3. Confirming a deliberately-broken-build commit (pushed to a throwaway branch) skips all consumer jobs (fail-fast verification).

**Why**: The change is mechanical and same-shape across consumers; a feature flag would add complexity without buying derisk. A staged rollout (one consumer at a time) would mean N PRs of trivial diffs, each blocked on the previous merging.

### Decision 8: Do not touch the existing TypeScript dist cache in `setup-pnpm`

**Choice**: Leave `actions/cache` for `packages/*/dist` + `.tsbuildinfo` in `setup-pnpm/action.yml` as-is.

**Why**: It is global-key-invalidated and effectively a no-op on real PRs, but it is also harmless. After fan-out, the cache becomes redundant for any job that uses `setup-pnpm` _and_ downloads the artifact (the artifact lands in the same path). Removing it is a separate cleanup that risks breaking jobs we have not audited (release workflow, eval workflow, etc.). Out of scope for this change.

### Decision 9 (revised — the bundle-analysis carve-out): Bundle analysis runs in a dedicated job, not inside `test-frontend`

**Choice**: Move the SPA bundle-analysis behavior (driven by `@codecov/vite-plugin`, currently coupled to the `Build dependencies` step in `test-frontend` at `ci.yml:534-538` via `CODECOV_TOKEN`) into its own dedicated job named `bundle-analysis`. The new job:

1. Gates on `frontend-changed == 'true'` and `should-test == 'true'`.
2. Pins to a single Node version (`22.18.0`, the minimum supported, to match Codecov's "upload from one Node only" rule).
3. Runs `pnpm --filter @kaiord/workout-spa-editor build` (single-package, NOT multi-package).
4. Carries `CODECOV_TOKEN` on its own step.
5. Does NOT declare `build` in `needs:` — it is not an artifact consumer; it is an orthogonal in-job build for tooling that hooks `vite build`.

**Why**: The Codecov Vite plugin is a Vite plugin — it instruments the build via Vite plugin hooks. Reading a pre-built `dist/` does not give the plugin the build pipeline it needs to instrument. So either (a) the SPA build runs twice in `test-frontend` (once for the artifact, once for analysis) or (b) bundle analysis is hoisted to its own job, where it is honest about being its own build. Option (b) keeps `test-frontend` clean (one job, one purpose, downloads the artifact like any other consumer) and isolates the secret.

**Why this re-numbering**: in iteration 1 of design.md, this decision did not exist; iteration 1 deferred §5.4 to a tasks-time decision. Iteration 2 promotes the decision into the design and locks the spec around it. The original Decision 9 (artifact-is-environment-agnostic) is renumbered to Decision 10.

**Alternatives considered**:

- Keep the bundle-analysis build inside `test-frontend`, gated to `matrix.node-version == '22.18.0'` only — rejected. Couples a secret-bearing step to a matrixed test job, complicates the spec ("consumers don't rebuild" gains a multi-clause carve-out), and violates Factor V's separation of concerns.
- Drop bundle analysis entirely — rejected. It is an active feedback loop on bundle size; removing it is out of scope for this change.

### Decision 10: Artifact is environment-agnostic and carries no config

**Choice**: The `build-artifacts` artifact SHALL contain only compiled package output (`packages/*/dist/`) and `packages/*/package.json`. It SHALL NOT contain environment-specific values, secrets, runtime config, or Node-version-conditional bytes. This is a 12-factor App Factor V invariant: the artifact is the Build product; config is injected at the Run stage (i.e., by the consumer job's environment).

**Why**: This is the load-bearing assumption behind Decision 2 (one artifact serves both Node-version matrix legs) and behind the spec's "single artifact for all matrix legs" requirement. If any package were to introduce a Node-version-conditional build step (e.g., a `tsup` config that emits different bytes under different Node versions), or to bake an environment value into `dist/` at build time, the artifact would lose its portability and Decision 2 would no longer hold.

**Trip-wires that re-open this decision**:

1. A package adds a `process.env.NODE_VERSION`-conditional code path to its build script.
2. A package adds a build-time injection of a config value (e.g., a `define:` block in a Vite/tsup config that reads from CI env vars).
3. A package ships native bindings or platform-specific binaries in `dist/`.
4. The pre-flight diff in tasks §1.1 is non-empty for any package.

**Action if a trip-wire fires**: revisit Decision 2 — either gate the consumer matrix on the `build` job's single Node version (drop matrixed Node testing) or matrix the `build` job per Node version and produce per-version artifacts. Both are local changes; neither requires re-thinking the fan-out itself.

**Alternatives considered**:

- Embed a `release.json` manifest (commit SHA, build time, per-package versions, Node version) into the artifact root for consumer-side sanity checks. **Deferred** — captures Factor V's "every release has a unique ID" more explicitly, but the GitHub Actions run ID already provides that identity, and consumers downloading from the same workflow run cannot see a foreign artifact. Worth re-opening if a debugging incident demonstrates value.

### Decision 11: Decision-10 trip-wires AND fan-out invariants are bound to mechanical guards

**Choice**: Add two single-purpose mechanical guards with co-located tests, run via `pnpm test:scripts`:

1. **`scripts/check-build-portable.mjs`** — fails CI if any of Decision 10's trip-wires appear: env-var-as-value `define:` blocks (the `JSON.stringify(process.env.X)` and unwrapped `'__X__': process.env.X` patterns), `process.env.NODE_VERSION` references in build-time code, or native bindings (`*.node`/`*.so`/`*.dylib`) under any package's `dist/`. The whitelist for `process.env.NODE_ENV` only covers comparison operands (`process.env.NODE_ENV ===` etc.), never values.
2. **`scripts/check-ci-fanout-invariants.mjs`** — uses `js-yaml` to parse `.github/workflows/ci.yml` and fail if (a) any consumer job's `if:` clause contains `always()` (replacing the brittle grep originally proposed in tasks §4.8); (b) any consumer's `needs:` does not include `build`; (c) any non-consumer (other than the explicit `notify-failure` failure-aggregation whitelist) declares `needs: build`.

Each guard has a docstring opening with `// SCOPE: <single-purpose description>. Adding new checks requires a separate guard with its own design entry in openspec/changes/<slug>/design.md.` This is a deliberate scope-creep guardrail.

**Why**: Per CLAUDE.md "Mechanical guards > AI review" — invariants that gate a load-bearing decision SHALL be enforced deterministically, not by reviewer attention. Decision 10's trip-wires (portability) and Decision 3's `always()`-removal (fail-fast correctness) are both exactly that kind of invariant. A prose-only commitment to "revisit Decision 2 if a trip-wire fires" relies on someone noticing the trip-wire fired, which is exactly the failure mode the policy exists to prevent.

**Scope (intentionally narrow)**:

- `check-build-portable.mjs` performs greppable static checks only — the guard does NOT execute builds or compute byte-diffs. The pre-flight Node-version diff in tasks §1.1 stays as the empirical check; the mechanical guard is the structural backstop.
- `check-ci-fanout-invariants.mjs` parses ONLY `.github/workflows/ci.yml`, ONLY for the three invariants enumerated above. It does NOT lint generic GitHub Actions style.

**Cost**: ~30 lines of script + ~50 lines of test for each guard (~160 lines total). Single-purpose, low-maintenance.

**Why two guards instead of one**: Conceptually distinct invariants (portability vs. CI workflow shape). Splitting them prevents the single-purpose-creep that one combined guard would invite, and it keeps the failure messages crisp ("portability trip-wire fired" vs. "fanout invariant violated").

**N-guard refactor trigger**: This change ships two guards (`check-build-portable`, `check-ci-fanout-invariants`). The single-purpose discipline likely produces more guards over time (each new invariant is its own ~30-line script + test). To prevent the `scripts/` directory from sprawling: **if more than 4 mechanical guards exist that are bound to this capability** (or to closely related CI workflow capabilities), consolidate them into a guard runner with a plugin model — a single `scripts/check-ci-invariants.mjs` that loads `scripts/ci-invariants/*.mjs` plugins, where each plugin is one ~30-line check. The plugin shape becomes the new SCOPE-comment discipline. Until that threshold is hit, individual scripts remain the right shape.

### Decision 12: Branch-protection summary jobs include `build` in `needs:` and treat `skipped`-due-to-build-failure as failure

**Choice**: Modify the four branch-protection-required summary jobs (`lint-summary`, `test-summary`, `round-trip-summary`, `test-frontend-summary` — `ci.yml:735-789`) to:

1. Add `build` to `needs:`.
2. Replace the current "passed or skipped" whitelist with a tri-state check:
   - `needs.build.result == 'skipped'` → exit 0 (docs-only PR, intentional skip).
   - `needs.build.result == 'failure'` → exit 1 with a message naming `build` as the upstream cause.
   - `needs.build.result == 'success'` → require `needs.<consumer>.result == 'success'` (skip is no longer acceptable; build succeeded so the consumer should have run and passed).

**Why**: Today's summary jobs whitelist `skipped` because docs-only PRs legitimately skip consumers. After fan-out, `skipped` has a second cause: build failure. Without distinguishing the two, branch protection would let a build-broken PR merge if the only required checks are the four summary names. This is a real branch-protection bypass.

**Alternatives considered**:

- Add `build` itself to the branch-protection required-checks list (repo settings change, not workflow code). **Rejected as the sole fix** — it would catch build failures, but the summary jobs would still falsely report consumer success on `skipped`, leaving a confusing UI state. Doing both (require `build` in branch protection AND fix the summaries) is fine; the repo-settings change is recommended in tasks §10 as a follow-up but not blocking.
- Have one mega-summary job that depends on `build` and all consumers. **Rejected** — would require renaming required checks, which is a coordinated repo-settings + workflow change.

### Decision 13: Bump artifact `retention-days` from 7 to 30

**Choice**: Increase the `retention-days` on `Upload build artifacts` from 7 to 30.

**Why**: Today the value is 7 because no consumer reads the artifact. After fan-out, "Re-run failed jobs only" depends on the artifact still existing. A 7-day window is too short for the typical PR review cycle (PRs commonly sit ≥1 week awaiting review or follow-up changes). 30 days covers the long tail without an order-of-magnitude storage cost increase. The spec sets a floor of 14 and a ceiling of 90; this design picks 30 as a reasonable point in that range.

**Alternatives considered**:

- Keep at 7 and document the re-run-after-7-days failure mode — rejected. Predictable DX regression for no benefit.
- Bump to 90 (GitHub default) — rejected. Storage growth is unbounded and most PRs do not need 90-day artifact retention.

## Risks / Trade-offs

- **[Risk]** A consumer downloads the artifact AND a stale `dist/` from the `setup-pnpm` composite's TypeScript cache co-exists, causing partial version skew. `actions/download-artifact@v7` overwrites files at the destination path BUT does NOT delete files that exist at the destination but are absent from the artifact. So a stale cached `packages/foo/dist/old-file.js` would survive a download that no longer produces it. → **Mitigation**: every consumer's pattern (tasks §5.2) is now THREE steps: (1) `Wipe stale dist` (`rm -rf packages/*/dist`), (2) `Download build artifacts`, (3) `Verify dist exists and contains no symlinks`. The wipe step is the load-bearing fix; the spec scenario "Consumer wipes stale dist before downloading" makes it a hard requirement. Decision 8 (leave the existing TypeScript cache untouched) is preserved because the wipe step neutralises the cache's effect on consumers without removing the cache itself (the cache may still help non-consumer jobs that don't download the artifact).

- **[Risk]** Build job succeeds but artifact upload fails, leaving consumers without input. → **Mitigation**: `actions/upload-artifact@v7` sets the job to failed if the upload fails, which propagates via `needs:` to skip consumers. No explicit handling needed.

- **[Risk]** Node-version matrix legs assume artifact compatibility (Decision 2) and someone later adds a Node-version-specific build flag. → **Mitigation**: The Decision 2 rationale is documented in this design and in a comment in `ci.yml`. If that assumption breaks, the fix is to gate the matrix on the `build` job's Node version or produce per-version artifacts; both are local changes.

- **[Risk]** A consumer accidentally drops `pnpm install --frozen-lockfile` and breaks because `node_modules` is missing. → **Mitigation**: `setup-pnpm` composite always runs `pnpm install --frozen-lockfile`; the consumer pattern keeps `setup-pnpm` as the first step. The `download-artifact` step only ever lands `packages/*/dist/` and `packages/*/package.json`, never `node_modules`.

- **[Trade-off]** Single-run scoping means every PR pays for one full build. Cross-run caching (Turborepo + remote cache, or `actions/cache` keyed by lockfile + source) would skip the build entirely for unchanged packages. We accept this trade-off because:
  1. The full build is cheap (~30-90s per package, parallelisable).
  2. Cross-run caching has correctness sharp edges (input/output declaration, env-var hashing).
  3. The biggest win (eliminating in-run rebuilds) is captured by this change.

- **[Trade-off — Factor X dev/CI parity gap]** Local dev runs `pnpm -r build` before every test command, so build and test costs are co-located per developer iteration. After this change, CI builds once and fans out, while local dev is unchanged. This widens the dev/CI parity surface: a build-stage bug that only manifests when the build step runs _adjacent to_ a particular test step will be caught locally but not in CI (because CI no longer rebuilds before each test). Today no such coupling exists — the build step is pure (`tsup`/`tsc` with deterministic inputs) and produces byte-identical output regardless of which test runs after it. The pre-flight Node-version diff in tasks §1.1 is the load-bearing verification that this remains true. If any of the Decision 9 trip-wires fire later, the parity gap becomes a real risk and the fan-out must re-matrix accordingly. We accept the present-day gap because the trip-wires are explicit and the savings are significant.

  Cross-run caching can be layered on later via `turbo.json` without touching the fan-out wiring.

- **[Trade-off]** Adding `needs: build` to consumers serializes the workflow: nothing runs until `build` finishes. Today, all jobs start in parallel. → Net effect is still a wall-clock reduction because the saved `pnpm -r build` per-job time (~30-90s) exceeds the build job's wall-clock contribution.

- **[Risk]** Fork PRs (third-party contributors) have read-only `secrets.*` and reduced `permissions:`. → **Mitigation**: the change does not introduce any new secret-bearing step in the build path. Artifacts work normally under `pull_request` from forks because `actions/{upload,download}-artifact` operate within the workflow run and do not require write permissions on the repository. Bundle analysis (Decision 9) carries `CODECOV_TOKEN`, which is not available on fork PRs — that step is a no-op for fork PRs (existing behavior, unchanged).

- **[Risk]** A compromised dependency injects code into `dist/` during `build`; consumers no longer rebuild and so cannot independently catch tampering. → **Mitigation**: this is a property of any artifact-fan-out pattern (and of any cached build). Today every consumer builds from the same lockfile, so a compromised dep produces the same `dist/` in every job — consumers do not catch it either. Net effect is unchanged. The supply-chain guarantees come from `pnpm install --frozen-lockfile`, dependency pinning, and downstream signature verification, none of which this change touches.

- **[Risk]** GHSA advisories on pinned action versions (`actions/upload-artifact@v7`, `actions/download-artifact@v7`). → **Mitigation**: tasks §9.4 verifies no open advisories at merge time; the existing `dependabot.yml` (or equivalent) keeps action versions current.

## Migration Plan

This change has no public API impact and no migration concerns for package consumers. The CI-internal migration is:

1. Add `if: needs.detect-changes.outputs.should-test == 'true'` to the `build` job.
2. For each consumer (`lint`, `typecheck`, `test`, `test-cli`, `test-frontend`, `round-trip`, `e2e-frontend`, `e2e-prod-base`):
   - Add `build` to `needs:`.
   - Replace the `Build dependencies` / `Build all packages` / `Build packages (required for type checking)` step with a `Download build artifacts` step.
3. Open PR; verify all jobs green; merge.

**Rollback**: Revert the PR. The `build` job continues to upload its artifact (no consumer reads it), exactly the pre-change state.

## Cross-spec interactions

- **`ci-release` (release workflow)**: unaffected. `release.yml` runs on `push` to `main`, not on `pull_request`, and produces its own `pnpm -r build` step independent of `build-artifacts`. Tasks §10.4 verifies this assumption.
- **`ci-failure-bot` (failure-issue automation)**: unaffected in shape but signal improves. Today, a build failure produces ~10 identical consumer failures, all listed in the failure issue. After fan-out, `notify-failure` (which already declares `needs: [..., build, ...]` at `ci.yml:805` and explicitly checks `needs.build.result == 'failure'`) will see exactly one failure (`build`) and several skips. The bot's "fully-green close" rule remains correct because a failed `build` keeps the workflow run in a non-green state.

  Second-order effect on issue body content: pre-fan-out, the failure-issue body's `failed-jobs` JSON footer enumerated 10 jobs (`["build","lint","test","..."]`); post-fan-out it enumerates a single job (`["build"]`). This changes dedupe behavior — consecutive build breaks now dedupe more aggressively (all share the same `failed-jobs` fingerprint). That is a desirable improvement, not a regression: today the bot may open separate issues for the same root cause when the `failed-jobs` order varies; tomorrow it opens one. The `ci-failure-bot` spec does NOT need to change; its dedupe logic is content-agnostic.

- **`hexagonal-arch` (project-wide architecture spec)**: not relevant. This change touches `.github/workflows/ci.yml` only — no application code, no domain layers.

## Open Questions

- Should the `Verify build outputs` step in the `build` job (`ci.yml:497-506`) become a hard gate (it already runs after the build, before the upload)? It is currently informational only when build itself succeeds. Tasks §10.5 tracks extending this verification to include `workout-spa-editor` and the bridge packages, since their `dist/` is consumed by `e2e-frontend` and (when fan-out lands) `test-frontend`. Tightening to a hard gate is a separate cleanup.
