## Why

CI currently runs `pnpm -r build` 30+ times on a single PR — once per job (lint, typecheck, build, test×9 packages, test-cli, test-frontend, round-trip×2, e2e-frontend×4 shards, e2e-prod-base), each across two Node versions. The `build` job already uploads `packages/*/dist/` as a `build-artifacts` artifact, but no consumer reads it, so the upload is dead weight today. Fanning the existing artifact out to consumers eliminates redundant rebuilds within a single CI run, capturing most of the wall-clock savings of a Turborepo migration without adding a new build tool.

## What Changes

- Refactor `.github/workflows/ci.yml` so the `build` job is the sole producer of `packages/*/dist/` per CI run; every consumer job depends on `build` and downloads the `build-artifacts` artifact instead of running `pnpm -r build`.
- Affected consumer jobs: `lint`, `typecheck`, `test` (matrix), `test-cli`, `test-frontend`, `round-trip`, `e2e-frontend`, `e2e-prod-base`. Their `pnpm -r build` step is replaced with `actions/download-artifact` followed by a `Verify dist exists` step that fails fast with an actionable error if the artifact did not land.
- **CRITICAL fail-fast fix**: drop `if: always() &&` from each consumer's `if:` clause. With `always()` present, `needs: build` does NOT short-circuit on build failure (the consumer would run anyway and produce noisy unrelated errors). Default GitHub Actions `success()` semantics give us correct skip-on-build-failure behavior once `always()` is removed.
- Bump artifact retention from 7 to 30 days so "Re-run failed jobs only" remains usable across the typical PR review cycle.
- The `build` job's existing artifact (`build-artifacts`, paths `packages/*/dist/` + `packages/*/package.json`) is reused; only `retention-days` changes.
- Preserve the docs-only short-circuit: every consumer keeps its `needs.detect-changes.outputs.should-test == 'true'` gate. The `build` job inherits the same gate so it does not run on docs-only PRs.
- Preserve the Node-version matrix: jobs running both `22.18.0` and `24.x` keep the matrix; the artifact is Node-version-agnostic for our packages (`tsup`/`tsc` outputs JS + `.d.ts`, no native bindings shipped in `dist/`), so a single artifact serves both Node versions.
- **Branch-protection summary fix**: update `lint-summary`, `test-summary`, `round-trip-summary`, `test-frontend-summary` to include `build` in `needs:` and to fail when `build` failed, instead of treating `skipped` as success. Today's whitelist would let a build-broken PR merge after fan-out.
- **Bundle-analysis carve-out**: extract the `@codecov/vite-plugin` build (currently coupled to `test-frontend`'s build step via `CODECOV_TOKEN`) into its own `bundle-analysis` job. The new job runs only on Node `22.18.0`, builds only `@kaiord/workout-spa-editor`, carries the secret on its own step, and is NOT a consumer of `build-artifacts` (it does its own in-job build because the Codecov plugin instruments `vite build`).
- **Build-job environment hardening**: no `secrets.*` in the build job's env (other than the implicit `secrets.GITHUB_TOKEN`). Secret tokens belong on the consumer jobs that need them, never on the shared producer.
- **Decision-9 mechanical guard**: add `scripts/check-build-portable.mjs` (with `*.test.mjs`) that fails CI if any package introduces env-var `define:` blocks, `process.env.NODE_VERSION`-conditional build code, or native bindings under `dist/`. Per CLAUDE.md "Mechanical guards > AI review."
- **Non-consumer jobs unchanged**: `check-links`, `log-bot-skip` do not need `dist/` and SHALL NOT depend on `build`.
- The existing `setup-pnpm` composite action's TypeScript dist cache is left untouched (out of scope).

## Capabilities

### New Capabilities

- `ci-build-fanout`: Build packages once per CI run and fan the resulting `dist/` artifact out to every job that needs compiled output, replacing redundant per-job rebuilds.

### Modified Capabilities

(none — `ci-release` and `ci-failure-bot` are unaffected; this change touches the PR-time CI workflow only.)

## Impact

- **Code**: `.github/workflows/ci.yml` (consumer wiring, summary-job rewrites, new `bundle-analysis` job) and two new repo scripts (`scripts/check-build-portable.mjs` + test). No package source, no `setup-pnpm` composite changes, no `turbo.json`.
- **CI minutes**: expected 30-60% reduction in PR wall-clock time for non-docs PRs. The exact saving depends on the slowest matrix leg; a hard gate of ≥30% improvement is set in tasks §10.2 (halt and investigate if not met).
- **Public API**: none affected. No package source, exports, or runtime behavior changes.
- **Architecture layers**: this change touches `.github/workflows/` only — no domain, application, or adapter code. Hexagonal-architecture invariants (per `openspec/specs/hexagonal-arch/spec.md`) are not relevant.
- **Branch protection**: the four summary-job names (`lint`, `test`, `round-trip`, `test-frontend`) remain the same; their internal logic gains a `build`-status check. No repo-settings change required for this PR. A follow-up issue (tasks §13.5) tracks adding `build` itself to the required-checks list as belt-and-braces.
- **Developer experience**: PR feedback latency drops; local `pnpm -r build` is unchanged. Missing-artifact failures now produce actionable errors via the new `Verify dist exists` step.
- **Risk surface**: stale-artifact bugs if a consumer reads a `dist/` produced from a different commit. Mitigated because the artifact is scoped to a single workflow run (GitHub Actions artifacts are run-scoped by default) and consumers explicitly depend on the `build` job from the same run.
- **Cross-spec interactions**: `ci-release` (release workflow) and `ci-failure-bot` are unaffected. See `design.md` "Cross-spec interactions" for the reasoning.
- **Out of scope**: Turborepo adoption, removing the per-package change-detection bash in `detect-changes`, removing or re-keying the existing TypeScript dist cache in `setup-pnpm`.
- **Hard follow-up (not "out of scope")**: adding `build` to branch-protection required checks. **Issue MUST be filed before this PR merges; assignee MUST be set within 30 days of merge** (tasks §13.5). The workflow-code fixes here (Decision 12 summary-job logic) close the immediate gap; the repo-settings change is the belt-and-braces commitment.
