<!-- opsx-ship: chunking
PR 1 (ci-artifact-fanout): §1, §2, §3, §4, §5A, §5, §6, §7, §8, §9, §10, §11, §12, §13

Rationale: structurally atomic refactor of .github/workflows/ci.yml plus 2
mechanical guards + 1 composite action. Splitting would force temporarily-broken
main (e.g., consumers reference the composite before it lands; mechanical guards
fail before workflow shape conforms; summary-job logic depends on consumer
always() drop). User preference for bundled coherent chunks in CI/refactor work.
-->

## 1. Pre-flight verification

- [ ] 1.1 Confirm Decision 2 assumption: build `packages/core/dist` under Node `22.18.0` and Node `24.x` locally and `diff -r` the outputs. Repeat for `packages/workout-spa-editor` (the largest non-trivial bundle). Both diffs MUST be empty. Capture the result in the PR description; if non-empty, halt and revisit Decision 2 before continuing.
- [ ] 1.2 Snapshot baseline CI wall-clock from the three most recent merged PRs touching package source (capture `build`, `lint`, `typecheck`, `test`, `test-frontend`, `e2e-frontend` durations). This is the comparison baseline for §8.2.
- [ ] 1.3 Verify `actions/download-artifact@v7` `path: .` semantics: download an artifact uploaded with `path: packages/*/dist/` and confirm it lands files at `packages/<pkg>/dist/...`, NOT under a `build-artifacts/packages/...` subdirectory. Run a tiny throwaway workflow against a fork or test branch. Reference: this verifies the v3→v4 path-handling change applied in v7 matches what consumer steps expect.
- [ ] 1.4 Verify no open GHSA advisories on `actions/upload-artifact@v7` and `actions/download-artifact@v7`: run `gh api -H "Accept: application/vnd.github+json" /repos/actions/upload-artifact/security-advisories | jq '[.[] | select(.state=="published")]'` and the equivalent for `download-artifact`. Both arrays MUST be empty (or contain only advisories for unrelated minor versions).

## 2. Add Decision 11 mechanical guards (portability + fan-out invariants)

- [ ] 2.1 Create `scripts/check-build-portable.mjs` whose docstring opens with this SCOPE comment block:

  ```js
  // SCOPE: enforces ONLY Decision 10's three trip-wires (env-var define:,
  // NODE_VERSION conditionals, native bindings). Adding new checks
  // requires a separate guard with its own design entry in
  // openspec/changes/<slug>/design.md.
  ```

  The guard MUST use the **TypeScript compiler API** (`import * as ts from 'typescript'`; `typescript` is already a workspace dep) to AST-parse `tsup.config.{ts,mts,cts}` and `vite.config.{ts,mts,cts}` files — no regex over source text. It walks every `define:` property in `defineConfig({ define: {...} })` (and bare-object equivalents) and fails if any property value is `process.env.*` (direct identifier access), `JSON.stringify(process.env.*)`, an arrow-function returning either of those, a spread of an object containing either, or a computed-property whose key uses `process.env.*`. It whitelists `process.env.NODE_ENV` only as a comparison operand (`BinaryExpression` where `process.env.NODE_ENV` is `left` or `right` and operator is `===`/`!==`/`==`/`!=`), never as a `define:` value. The guard ALSO:

  - Greps `packages/*/src/**/*.{ts,tsx,mjs,cjs}` for `process.env.NODE_VERSION` (no whitelist; this should never appear in build-time code).
  - Scans `packages/*/dist/` (when present) for `*.node`, `*.so`, or `*.dylib` files.

  Fails non-zero on any match with a message naming the offending file and the violated trip-wire.

- [ ] 2.2 Create `scripts/check-build-portable.test.mjs` using `node:test` with **nine cases**: (a) clean repo passes; (b) `define: { __X__: JSON.stringify(process.env.API_URL) }` fails; (c) `define: { __DEV__: process.env.NODE_ENV !== 'production' ? 'true' : 'false' }` PASSES (comparison operand); (d) `process.env.NODE_VERSION === '22'` in fixture `src/build-helper.ts` fails; (e) `dist/native.node` file fails; (f) computed property `define: { ['__X__']: process.env.API_URL }` fails; (g) spread `define: { ...{ __X__: process.env.X } }` fails; (h) template-literal-key with `process.env.X` value fails; (i) comment containing `}` inside a `define:` block does NOT cause a false negative (regression test for the AST approach vs. naive regex).

- [ ] 2.3 Create `scripts/check-ci-fanout-invariants.mjs` whose docstring opens with: `// SCOPE: enforces ONLY ci.yml fanout invariants (consumer-needs-build, no always() in consumers, non-consumer build dependency, pull_request_target prohibition). Adding new checks requires a separate guard with its own design entry.` Use **`yaml@2.x`** (already in `pnpm.overrides` as `>=2.8.3`; verify with `pnpm why yaml` at workspace root) — NOT `js-yaml`, NOT `safeLoad`. Import as `import { parse } from 'yaml'`. The guard parses `.github/workflows/ci.yml` and fails if:

  1. Any consumer job's `if:` clause (string field on the parsed job object) contains the literal `always()`. Consumers enumerated literally: `lint`, `typecheck`, `test`, `test-cli`, `test-frontend`, `round-trip`, `e2e-frontend`, `e2e-prod-base`.
  2. Any consumer job's `needs:` (whether scalar or sequence) does NOT include `build`.
  3. Any non-consumer job declares `needs: build`. Non-consumers enumerated: `check-links`, `log-bot-skip`, `bundle-analysis`. The single whitelisted exception is `notify-failure` (per spec "Non-consumer jobs do not declare build dependency" Exception clause). The script hardcodes the literal name `notify-failure` AND the comment block: `// WHITELIST: only 'notify-failure' qualifies under the spec Exception. Adding a new job here REQUIRES amending openspec/specs/ci-build-fanout/spec.md first.`

  Note for future readers: summary jobs (`lint-summary`, `test-summary`, `round-trip-summary`, `test-frontend-summary`) are NOT in the consumer list above. They observe consumer status and legitimately retain `if: always()` (per §8.5) — that is permitted because they are not consumers. Adding any of them to the consumer enumeration would be a category error.
  4. The workflow `on:` block contains `pull_request_target` (per spec "Workflow trigger SHALL NOT switch to pull_request_target").

- [ ] 2.4 Create `scripts/check-ci-fanout-invariants.test.mjs` using `node:test` with cases: (a) current `ci.yml` (post-rollout) passes; (b) injecting `if: always() && …` into `lint`'s `if:` fails with a message naming `lint`; (c) removing `build` from `test`'s `needs:` fails; (d) adding `needs: [detect-changes, build]` to `check-links` fails; (e) `notify-failure` keeping `always()` and `build` in `needs:` PASSES (whitelist); (f) injecting `pull_request_target:` into the `on:` block fails.

- [ ] 2.5 Wire both guards into the root `lint` script: add `pnpm lint:build-portable` and `pnpm lint:ci-fanout` as sub-targets in `package.json` and append them to the root `lint` aggregator. Confirm `pnpm test:scripts` discovers and runs both new tests.
- [ ] 2.6 Add `"yaml": "^2.8.3"` to root `devDependencies` in `package.json` (run `pnpm add -Dw yaml@^2.8.3`). The `pnpm.overrides` clause pins the *version* if `yaml` appears in the resolution graph, but does not *install* it. Adding it as an explicit root devDep makes the guard self-sufficient and survives unrelated dep removals.
- [ ] 2.7 Extend `scripts/check-ci-fanout-invariants.mjs` with **invariant 5**: no consumer job's `steps:` array contains a step whose `run:` field matches `^pnpm (-r )?build($|\s)` or any equivalent multi-package compilation command. This catches the regression where a future contributor adds back the build-from-source pattern alongside the artifact download. Add a test case (g): injecting `run: pnpm -r build` into `lint`'s steps fails the guard with a message naming the consumer + the offending step.

## 3. Gate the build job on docs-only short-circuit

- [ ] 3.1 Add `if: github.actor != 'github-actions[bot]' && needs.detect-changes.outputs.should-test == 'true'` to the `build` job in `.github/workflows/ci.yml` (the `needs: detect-changes` edge already exists at `ci.yml:485`). Add a YAML comment: `# Actor check is redundant with detect-changes' own gate, but kept as belt-and-braces; if detect-changes' gate ever moves, build still skips bot commits.`
- [ ] 3.2 Verify by pushing a docs-only branch (touching only a `*.md` file) and confirming both `detect-changes` and `build` show as skipped in the CI run.
- [ ] 3.3 Confirm the `Upload build artifacts` step is the LAST step in the `build` job and that no step with `if: always()` follows it (per spec "No always-step follows upload").
- [ ] 3.4 Bump `retention-days` on `Upload build artifacts` from 7 to 30 (Decision 13). Add a YAML comment `# 30 days covers the typical PR review cycle so "Re-run failed jobs only" stays usable; spec floor is 14, ceiling 90`.
- [ ] 3.5 Audit the `build` job's `env:` and per-step `env:` blocks. Confirm no `secrets.*` reference other than `secrets.GITHUB_TOKEN` (which is implicit). Specifically: ensure `CODECOV_TOKEN` is NOT referenced in the build job (it currently only appears under `test-frontend`'s build step at `ci.yml:534-538`, which is being removed in §6).

## 4. Drop `if: always()` from every consumer (CRITICAL fail-fast fix)

- [ ] 4.1 In `lint` (`ci.yml:208`), rewrite `if: always() && needs.detect-changes.outputs.should-test == 'true'` to `if: needs.detect-changes.outputs.should-test == 'true'`. Drop `always() &&`.
- [ ] 4.2 In `typecheck` (`ci.yml:397`), apply the same rewrite.
- [ ] 4.3 In `test` (`ci.yml:414`), apply the same rewrite.
- [ ] 4.4 In `test-cli` (`ci.yml:568`), apply the same rewrite.
- [ ] 4.5 In `test-frontend` (`ci.yml:520`), apply the same rewrite.
- [ ] 4.6 In `round-trip` (`ci.yml:613`), apply the same rewrite.
- [ ] 4.7 `e2e-frontend` and `e2e-prod-base` use `if: |` multi-line clauses without `always()`; verify they still do not contain `always()` after this change.
- [ ] 4.8 (Replaced — see §2.3.) The `always()`-in-consumers check is now enforced by the YAML-aware `scripts/check-ci-fanout-invariants.mjs` guard, NOT by a brittle grep. Remove this task slot from the gating set; the guard runs as part of `pnpm lint`.

## 5A. Create the `consume-build-artifacts` composite action (Decision 5 reopened)

- [ ] 5A.1 Create `.github/actions/consume-build-artifacts/action.yml` wrapping the wipe → download → verify pattern. Shape:

  ```yaml
  # The single chokepoint where a consumer job receives the run-scoped
  # build artifact. See openspec/specs/ci-build-fanout/spec.md. The
  # consumer enumeration is hardcoded in
  # scripts/check-ci-fanout-invariants.mjs; adding a new consumer
  # requires updating that whitelist alongside the consumer's YAML.
  name: "Consume build artifacts"
  description: "Wipe stale dist, download build-artifacts, verify result."
  inputs:
    expected-packages:
      description: "Space-separated list of package names whose packages/<name>/dist/ MUST exist after download. Default covers all publishable packages."
      required: false
      default: "core fit tcx zwo garmin garmin-connect cli mcp ai"
  runs:
    using: "composite"
    steps:
      - name: Wipe stale dist (artifact is source of truth)
        shell: bash
        run: rm -rf packages/*/dist

      - name: Download build artifacts
        uses: actions/download-artifact@v7
        with:
          name: build-artifacts
          path: .

      - name: Verify dist exists and contains no symlinks
        shell: bash
        # SECURITY: input is materialized into env first so a future
        # caller passing `core; rm -rf /` becomes a literal token in
        # the array, not a shell metacharacter.
        env:
          EXPECTED: ${{ inputs.expected-packages }}
        run: |
          read -ra pkgs <<< "$EXPECTED"
          missing=0
          for pkg in "${pkgs[@]}"; do
            if [ ! -d "packages/$pkg/dist" ]; then
              echo "::error::Artifact 'build-artifacts' from job 'build' did not land packages/$pkg/dist."
              echo "::error::Possible causes: (1) artifact expired (>30 days); (2) build-job upload step failed silently; (3) workflow misconfiguration."
              echo "::error::Inspect the run's Artifacts panel; if missing, push an empty commit to rebuild:"
              echo "::error::  git commit --allow-empty -m 'chore(ci): re-trigger build'"
              missing=1
            fi
          done
          [ $missing -eq 0 ] || exit 1
          # CORRECTNESS: scan INSIDE every packages/*/dist for symlinks.
          # The earlier `-path 'packages/*/dist' -type d -prune` form
          # was wrong — it pruned the dist roots and so missed symlinks
          # within them, defeating the entire check. -mindepth 0 keeps
          # the dist root itself in scope (defends against root-symlink
          # attacks: `packages/foo/dist -> /attacker-controlled`); do
          # NOT "tighten" to -mindepth 1 — that silently loses root
          # coverage.
          symlinks=$(find packages/*/dist -mindepth 0 -type l -print 2>/dev/null | head -5)
          if [ -n "$symlinks" ]; then
            echo "::error::Symlinks under packages/*/dist/ are forbidden (potential malicious build):"
            echo "$symlinks"
            exit 1
          fi
  ```

- [ ] 5A.2 Each consumer in §5/§6/§7 invokes the composite via:

  ```yaml
  - name: Consume build artifacts
    uses: ./.github/actions/consume-build-artifacts
    # For SPA-only consumers (e2e-frontend, e2e-prod-base, test-frontend),
    # narrow the expected list:
    # with:
    #   expected-packages: "workout-spa-editor"
  ```

- [ ] 5A.3 Add a `with: expected-packages: "workout-spa-editor"` parameter to `e2e-frontend`, `e2e-prod-base`, and `test-frontend` so a missing SPA dist fails the consumer with a clear error rather than passing because `core/dist` happens to exist.

- [ ] 5A.4 Verify the composite action's `Verify dist exists` step reports the same `Artifact 'build-artifacts' from job 'build' did not land …` error that the inline form would (mirror the user-facing message exactly so contributors get the same hint regardless of consumer job).

## 5. Wire the lint, typecheck, test, test-cli, round-trip jobs to consume the artifact

- [ ] 5.1 In each of `lint`, `typecheck`, `test`, `test-cli`, `round-trip`, add `build` to `needs:` (where not already present).
- [ ] 5.2 In each of `lint`, `typecheck`, `test`, `test-cli`, `round-trip`, replace the `Build packages (required for type checking)` / `Build dependencies` / `Build all packages (CLI depends on all adapters)` step with a single invocation of the composite action defined in §5A.1. The composite is the **single source of truth** for the wipe → download → verify pattern; consumers MUST NOT inline the three steps. Example for `test-cli`:

  ```yaml
  # Consume the run-scoped build artifact. The composite action wipes
  # stale dist/, downloads build-artifacts, and verifies the result
  # (no missing dirs, no symlinks). See .github/actions/consume-build-artifacts/.
  - name: Consume build artifacts
    uses: ./.github/actions/consume-build-artifacts
  ```

  For SPA-only consumers (`test-frontend`, `e2e-frontend`, `e2e-prod-base`), narrow via:

  ```yaml
  - name: Consume build artifacts
    uses: ./.github/actions/consume-build-artifacts
    with:
      expected-packages: "workout-spa-editor"
  ```

- [ ] 5.3 Add a one-line YAML comment above the `Download build artifacts` step (already shown in §5.2's snippet) referencing the spec. Mirror the comment style on the `bundle-analysis` job (§6.2) and on `check-links` (§5.4).
- [ ] 5.4 Add a YAML comment above `check-links:` (around `ci.yml:379`) that reads: `# check-links does not need compiled output; it is intentionally NOT a build consumer (see openspec/specs/ci-build-fanout/spec.md).` Same shape for `log-bot-skip` if a future reviewer might wonder.
- [ ] 5.5 Run the full CI on the rollout PR and confirm every matrix leg of every job above downloads the artifact and passes its checks.

## 6. Wire the test-frontend job and extract the bundle-analysis carve-out (Decision 9 revised)

- [ ] 6.1 In `test-frontend`, add `build` to `needs:`, drop `always()` (see §4.5), and replace `Build dependencies` with the `Download build artifacts` + `Verify dist exists` steps. The `CODECOV_TOKEN` env var on the old build step is REMOVED here — bundle analysis moves to its own job in §6.2.
- [ ] 6.2 Create a new top-level `bundle-analysis` job in `ci.yml` (placement: after `test-frontend`, before the summary jobs) with the following shape:

  ```yaml
  # Bundle-size analysis (Codecov Vite plugin). The plugin instruments
  # vite build via a Vite plugin hook, so it cannot consume the
  # packages/*/dist artifact and is intentionally NOT a build consumer.
  # See openspec/specs/ci-build-fanout/spec.md "Bundle-analysis exception".
  bundle-analysis:
    name: bundle-analysis
    runs-on: ubuntu-latest
    needs: detect-changes
    if: |
      needs.detect-changes.outputs.should-test == 'true' &&
      needs.detect-changes.outputs.frontend-changed == 'true'
    steps:
      - uses: actions/checkout@v6
      - uses: ./.github/actions/setup-pnpm
        with:
          node-version: "22.18.0"
      - name: Build SPA with Codecov bundle plugin
        # Step-level fork-PR skip: secrets.* is not reliably evaluable
        # in job-level `if:` (GitHub Actions documents this surface as
        # context-dependent). Materialize the secret into env first,
        # then guard at step level via env. On fork PRs, env is empty
        # → step is skipped, the job exits zero with no upload.
        env:
          CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
        if: env.CODECOV_TOKEN != ''
        run: pnpm --filter @kaiord/workout-spa-editor build
  ```

  Per spec: bundle-analysis SHALL NOT declare `build` in `needs:` (it is not a consumer); it pins to one Node version; it builds only one package; it carries the secret on its own step. The **step-level** `if: env.CODECOV_TOKEN != ''` is the canonical fork-PR guard — job-level `secrets.*` evaluation is unsupported in some `if:` contexts (per GitHub Actions docs).

- [ ] 6.3 Confirm `notify-failure` does NOT need to track `bundle-analysis` (failures there should not page; bundle analysis is informational signal, not a gating check). If failure-bot tracking IS desired, add it to `notify-failure`'s `needs:` list and the failure-jobs JSON assembly. Default: do not track.

## 7. Wire the e2e-frontend and e2e-prod-base jobs

- [ ] 7.1 In `e2e-frontend` (4 shards), keep the existing `needs: [detect-changes, build]` edge; replace the `Build dependencies` step with `Download build artifacts` + `Verify dist exists` (`packages/workout-spa-editor/dist`).
- [ ] 7.2 In `e2e-prod-base`, keep the existing `needs: [detect-changes, build]` edge; replace the `Build dependencies` step with `Download build artifacts` + `Verify dist exists` (`packages/workout-spa-editor/dist`).
- [ ] 7.3 Confirm Playwright finds the SPA build output (`packages/workout-spa-editor/dist/`) under the artifact-restored layout.

## 8. Update branch-protection summary jobs (Decision 12)

- [ ] 8.1 Modify `lint-summary` (`ci.yml:735`): add `build` to `needs:` (becomes `needs: [build, lint]`); rewrite the check step with explicit four-state logic to lock the policy from spec scenarios "Summary fails on build failure", "Summary passes on docs-only short-circuit", "Summary passes on all-green run", and "Summary fails when build succeeded but consumer was skipped":

  ```yaml
  - name: Check lint status (with build awareness)
    run: |
      build_result="${{ needs.build.result }}"
      lint_result="${{ needs.lint.result }}"
      # State 1: docs-only PR — build correctly skipped → consumer correctly skipped → green.
      if [ "$build_result" = "skipped" ]; then
        echo "Build skipped (docs-only); lint correctly not run."
        exit 0
      fi
      # State 2: build failed — consumer correctly skipped → red, naming the upstream cause.
      if [ "$build_result" = "failure" ]; then
        echo "::error::Build failed; lint did not run. Fix the build error and re-run."
        exit 1
      fi
      # State 3 & 4: build succeeded — consumer MUST have run and passed.
      if [ "$lint_result" != "success" ]; then
        echo "::error::Build succeeded but lint did not. Lint result: $lint_result"
        exit 1
      fi
      echo "Lint passed."
  ```

- [ ] 8.2 Apply the same four-state pattern to `test-summary` (`ci.yml:749`), substituting `lint` → `test`.
- [ ] 8.3 Apply the same four-state pattern to `round-trip-summary` (`ci.yml:763`), substituting `lint` → `round-trip`.
- [ ] 8.4 Apply the same four-state pattern to `test-frontend-summary` (`ci.yml:777`), substituting `lint` → `test-frontend`.
- [ ] 8.5 Verify `if: always()` is preserved on the four summary jobs (it is required for them to run when their consumer is skipped — that is the whole reason they exist as separate summary jobs). The §2.3 mechanical guard whitelists summary jobs explicitly so this does not violate the consumer-`always()`-prohibition.
- [ ] 8.6 (Follow-up only — see §13.5.) Adding `build` to branch-protection required checks is a repo-settings change, not workflow code, and is tracked as a follow-up issue. The summary fixes here are sufficient for the immediate gap.

## 9. Verify fail-fast and re-run behaviour

- [ ] 9.1 On a throwaway branch, deliberately introduce a TypeScript error in `packages/core/src/` so the `build` job fails. Push and observe: every consumer job (`lint`, `typecheck`, `test`, `test-cli`, `test-frontend`, `round-trip`, `e2e-frontend`, `e2e-prod-base`) MUST end with status `skipped`, not `failure`. The four summary jobs MUST end with status `failure`. Discard the branch.
- [ ] 9.2 Document the fail-fast verification result in the rollout PR description (with a link to the throwaway run).
- [ ] 9.3 Verify "Re-run failed jobs only" works: after a successful `build` and a deliberately-failing `test`, click "Re-run failed jobs only" and confirm `test` re-runs against the same artifact (no `build` re-run; artifact still present after 1 day).
- [ ] 9.4 Verify a docs-only PR still produces all-green: `build` skipped, all consumers skipped, all four summary jobs exit 0 (per Decision 12 scenario "Summary passes on docs-only short-circuit").

## 10. Verify wall-clock improvement and reconcile thresholds

- [ ] 10.1 Capture at least **5** force-pushed runs of the rollout PR (n=3 is below the noise floor for GitHub-hosted runners; n=5 brings the 95% CI of the median to ~±20%, comparable to baseline variance). Compute the median end-to-end wall-clock across those 5 runs.
- [ ] 10.2 Compare the §10.1 median against the §1.2 baseline median (also computed from at least 5 recent merged PRs). The proposal claims a 30-60% reduction in PR wall-clock for non-docs PRs. The gate is **two clauses, BOTH must hold**:

  1. **Magnitude floor**: median improvement ≥ **20%** (relaxed from 30% to account for runner noise; the proposal's 30-60% claim remains the expected target but the floor is the ship gate).
  2. **Directional significance**: a one-sided Mann-Whitney U test (`scipy.stats.mannwhitneyu(post_fanout, baseline, alternative='less')`, or equivalent) MUST reject the null at p<0.05. The one-sided alternative is critical — a two-sided test could reject the null for a regression as easily as for an improvement. Note: at n1=n2=5 the smallest exact one-sided p-value is ~1/252 ≈ 0.004, so p<0.05 is achievable but the test has limited power; the 20% magnitudinal floor is the dominant signal, MWU is the directional sanity check.

  If median improvement is between 20% and 30%, document the gap in the rollout PR description and link to a follow-up issue exploring cross-run cache adoption (Decision 8 → Turborepo path). If median improvement is <20% OR the one-sided MWU fails to reject at p<0.05, halt and investigate before merging.
- [ ] 10.3 Capture per-job timings in a table (build job duration vs. saved time across consumers) with min/median/max columns for each of the 5 sample runs and include in the PR description for future audits.

## 11. Verify orthogonal workflows are unaffected

- [ ] 11.1 Confirm NO workflow other than `ci.yml` consumes `build-artifacts`, including via composite actions: run `grep -rE '(download-artifact|build-artifacts)' .github/workflows/ .github/actions/` and assert the only matches are: (a) `ci.yml` (the new consumer downloads + the producer upload), (b) `.github/actions/setup-pnpm/action.yml` (the existing TypeScript dist cache, which is unrelated to the run-scoped artifact). Any match in `release.yml`, `eval.yml`, `metrics-gate.yml`, `cws-publish.yml`, `deploy-site.yml`, `auto-merge.yml`, `changeset-bot.yml`, `security.yml`, `accessibility-evidence-refresh.yml`, `ci-issue-bot-canary.yml`, `ci-issue-bot-success.yml`, or `workout-spa-editor-e2e.yml` is unexpected — halt and investigate.
- [ ] 11.2 Confirm `ci-failure-bot` behavior: trigger a build failure (via §9.1's throwaway branch on `main` if safely revertable, or by simulation) and verify the failure issue lists `build` exactly once, with consumers listed as skipped (not failed). If the bot's failed-jobs JSON includes skipped jobs as failures, file a separate issue — that is a `ci-failure-bot` bug, not a fan-out regression.

## 12. Spec compliance and changeset

- [ ] 12.1 Run `pnpm exec openspec validate ci-artifact-fanout --strict` and ensure it passes.
- [ ] 12.2 Run `pnpm lint:specs` and `pnpm lint` end-to-end on the rollout branch.
- [ ] 12.3 Add an empty changeset (`pnpm exec changeset --empty`) — this is repo-tooling-only, no package version bumps. Description: "ci: build packages once per workflow run and fan dist out to consumer jobs."
- [ ] 12.4 **Archive spec hand-off**: when this change archives via `/opsx:archive`, the spec at `openspec/changes/ci-artifact-fanout/specs/ci-build-fanout/spec.md` is lifted to `openspec/specs/ci-build-fanout/spec.md`. The lifted spec MUST satisfy **all four** SPEC_TEMPLATE.md rules:

  - **(rule 1)** First non-empty line is `> Synced: YYYY-MM-DD (ci-artifact-fanout)` — the date is the archive date and the change-slug is the canonical reference.
  - **(rule 2)** Exactly one `# CI Build Fanout` H1, exactly one `## Purpose` H2 (lifted from the HTML capability-scope comment at the top of the change-delta), exactly one `## Requirements` H2.
  - **(rule 4)** The `## ADDED Requirements` change-delta header MUST be renamed to `## Requirements`. All `### Requirement: …` headers under it are preserved as-is. The HTML comment block at the top of the change-delta MUST be removed (its content is now in `## Purpose`).
  - **(rule 3)** Every `### Requirement:` has at least one `#### Scenario:` block — already satisfied by construction in this change-delta; `pnpm lint:specs` re-asserts post-archive.
  - **(rule 5)** `pnpm lint:specs` passes post-archive — this is the deterministic check that catches violations of rules 1-4.

  If `/opsx:archive` does not auto-perform the H1/Purpose/Requirements transformations, do them by hand and run `pnpm lint:specs` before merging the archive PR. The structural lint at `scripts/check-spec-format.mjs` will fail the build if any of the four rules above is violated.

## 13. Land and follow up

- [ ] 13.1 Open the rollout PR with conventional-commit subject `chore(ci): fan build artifacts to consumer jobs`. Body MUST include: (a) §1.1 byte-diff results, (b) §1.2 baseline + §10 measured wall-clock, (c) §9.1-§9.4 verification screenshots/links.
- [ ] 13.2 After merge, monitor the next 5 PR runs on `main` for unexpected skips, stale artifacts, or matrix-leg divergence. If any consumer reports `dist/` missing, roll back per design.md Migration Plan.
- [ ] 13.3 Open a follow-up issue: "Remove redundant TypeScript dist cache from setup-pnpm composite action" (Decision 8).
- [ ] 13.4 Open a follow-up issue: "Extend `Verify build outputs` step in the build job to include `workout-spa-editor`, `garmin-bridge`, `train2go-bridge`" — currently it only iterates `core fit tcx zwo garmin garmin-connect cli mcp ai`, which leaves SPA + bridge dist gaps undetected.
- [ ] 13.5 **Issue MUST be filed before this PR merges; assignee MUST be set within 30 days of merge.** Title: "Add `build` to branch-protection required-checks list". Decision 12 fixes the summary-job whitelist gap inside workflow code; adding `build` to required checks is the belt-and-braces repo-settings change tracked here. Issue references this change's PR; rollout PR description links to the issue.
- [ ] 13.6 Verify `dependabot.yml` covers `package-ecosystem: github-actions` so that future GHSA advisories on `actions/upload-artifact@v7` and `actions/download-artifact@v7` produce auto-PRs. If the ecosystem is missing, open a follow-up issue to add it (do not block this change).
- [ ] 13.7 Run `/opsx:archive` once the PR is merged.
