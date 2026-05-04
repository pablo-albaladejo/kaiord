> Synced: 2026-05-04 (ci-artifact-fanout)

# CI Build Fanout

## Purpose

`ci-build-fanout` covers the producer-consumer relationship for compiled package output in the PR-time CI workflow, plus the invariants that keep that relationship correct end-to-end:

1. The build job is the sole producer of `packages/*/dist/`.
2. Consumer jobs download the artifact instead of rebuilding.
3. The build-job environment is secret-free (least privilege).
4. The artifact is portable across the Node-version matrix.
5. Bundle-analysis is a named non-consumer exception (it instruments `vite build` and so cannot read pre-built `dist/`).
6. Branch-protection summary jobs reflect build status correctly, distinguishing docs-only skips from build-failure skips.
7. Decision-10 portability trip-wires are mechanically enforced.
8. Artifact retention is bounded (≥14 days, ≤90 days).

Non-consumer jobs (e.g., `check-links`) and failure-aggregation jobs (e.g., `notify-failure`) are out of scope as artifact consumers but named explicitly to avoid spurious `needs: build` couplings.

## Requirements

### Requirement: Single build per CI run

The PR-time CI workflow (`.github/workflows/ci.yml`) SHALL execute `pnpm -r build` exactly once per workflow run for non-docs PRs. The `build` job SHALL be the sole producer of multi-package compiled output (`packages/*/dist/`) within the workflow.

A single, named exception is permitted: a dedicated bundle-analysis job MAY run a single-package rebuild (`pnpm --filter <package> build`) when an in-job build is required by tooling that instruments the build pipeline (e.g., the Codecov Vite bundle-analysis plugin, which hooks into `vite build` and cannot read pre-built `dist/`). The bundle-analysis job is NOT a consumer and SHALL NOT declare `build` in its `needs:` list (see "Bundle-analysis exception" requirement below).

#### Scenario: Consumers do not invoke pnpm -r build

- **WHEN** the CI workflow runs on a PR that touches package source
- **THEN** no consumer job (defined by the consumer-download requirement) SHALL contain a step that invokes `pnpm -r build`, `pnpm build`, or any other multi-package compilation command

#### Scenario: Build job runs once

- **WHEN** the CI workflow runs on a PR that touches package source
- **THEN** the `build` job SHALL appear exactly once in the workflow run summary (it is not matrixed)

### Requirement: Build job uploads compiled output as a workflow artifact

The `build` job SHALL upload `packages/*/dist/` and `packages/*/package.json` as a GitHub Actions artifact named `build-artifacts` so that downstream jobs in the same workflow run can consume the compiled output without rebuilding. The upload step SHALL be the last step in the `build` job — no step with `if: always()` MAY follow it, since that would bypass GitHub Actions' default skip-on-upstream-failure semantics for downstream consumers.

#### Scenario: Successful build uploads artifact

- **WHEN** the `build` job completes successfully
- **THEN** the workflow run SHALL contain an artifact named `build-artifacts` whose contents include `packages/*/dist/` and `packages/*/package.json`

#### Scenario: Failed build does not upload artifact

- **WHEN** the `build` job fails before reaching the upload step
- **THEN** the workflow run SHALL NOT contain a `build-artifacts` artifact for the failing run

#### Scenario: No always-step follows upload

- **WHEN** the `build` job is defined in `ci.yml`
- **THEN** no step in the `build` job AFTER `Upload build artifacts` SHALL declare `if: always()` or any expression that runs when prior steps failed

### Requirement: Build job environment carries no secret tokens

The `build` job SHALL NOT receive secret tokens (e.g., `CODECOV_TOKEN`, npm publish tokens, Garmin Connect credentials, AI provider keys) via its environment. Because the build artifact is shared across every consumer job, any secret available during build is implicitly trusted by all downstream jobs; constraining secret material to the consumer job that actually needs it preserves least-privilege.

#### Scenario: Build job has no env-level secrets

- **WHEN** the `build` job is defined in `ci.yml`
- **THEN** neither the job-level `env:` nor any step-level `env:` within the `build` job SHALL reference `secrets.*` other than `secrets.GITHUB_TOKEN` (the implicit, unavoidable token)

#### Scenario: Codecov token belongs to the consumer

- **WHEN** a consumer job needs `CODECOV_TOKEN` for coverage upload or bundle analysis
- **THEN** the token SHALL be set on the consumer job's step (or job-level `env:`), not on the `build` job

### Requirement: Consumers download the artifact instead of rebuilding

Every consumer job in `ci.yml` (`lint`, `typecheck`, `test`, `test-cli`, `test-frontend`, `round-trip`, `e2e-frontend`, `e2e-prod-base`) SHALL declare `build` in its `needs:` list and SHALL replace any local `pnpm -r build` step with a `actions/download-artifact` step that downloads `build-artifacts` into the workspace root. Consumers SHALL verify the artifact landed correctly before running tests, so missing-artifact failures produce actionable errors.

#### Scenario: Consumer job downloads build-artifacts

- **WHEN** a consumer job listed above runs after a successful `build` job
- **THEN** the job SHALL contain a step that uses `actions/download-artifact@v7` with `name: build-artifacts` and `path: .` BEFORE any step that depends on compiled output

#### Scenario: Consumer job declares build dependency

- **WHEN** a consumer job listed above is defined in `ci.yml`
- **THEN** the job's `needs:` list SHALL include `build`

#### Scenario: Consumer verifies dist exists post-download

- **WHEN** a consumer job downloads `build-artifacts`
- **THEN** the job SHALL run a verification step (or composite action) that fails fast with an actionable error message if any expected `packages/<consumed-pkg>/dist/` directory is missing after the download

#### Scenario: Consumer verification rejects symlinks under dist

- **WHEN** a consumer job runs the post-download verification step
- **THEN** the step SHALL fail if any `packages/<pkg>/dist/` directory contains a symlink (which would indicate either a malicious build or a misconfigured upload), exiting non-zero with a message naming the offending path

#### Scenario: Consumer wipes stale dist before downloading

- **WHEN** a consumer job runs the `Setup pnpm with caching` composite (which restores `packages/*/dist` from a TypeScript cache) AND then downloads `build-artifacts`
- **THEN** the job SHALL run a `rm -rf packages/*/dist` step BETWEEN the composite and the download, so that `actions/download-artifact` writes to a clean target and no cached files survive that are absent from the run-scoped artifact

### Requirement: Build failure short-circuits consumers

When the `build` job fails, every consumer job SHALL be skipped rather than running with stale or freshly-rebuilt output, so that a single compilation error is reported once instead of fanning out across every consumer job. To make this effective, no consumer SHALL use `if: always()` (or any equivalent expression that overrides GitHub Actions' default `success()` skip-on-upstream-failure semantics).

#### Scenario: Build failure skips downstream jobs

- **WHEN** the `build` job ends with status `failure`
- **THEN** every consumer job listed in the consumer-download requirement SHALL have status `skipped` for that workflow run

#### Scenario: Consumer if-clause does not contain always

- **WHEN** a consumer job declares an `if:` clause
- **THEN** the clause SHALL NOT contain `always()`, `failure()`, or any expression that causes the job to run when `needs.build.result == 'failure'`. The clause SHALL only narrow execution further (e.g., `needs.detect-changes.outputs.should-test == 'true'`), relying on the implicit `success()` over `needs:` to short-circuit on build failure

### Requirement: Branch-protection summary jobs reflect build status

The branch-protection-required summary jobs (`lint-summary`, `test-summary`, `round-trip-summary`, `test-frontend-summary`) SHALL include `build` in their `needs:` list and SHALL fail when the `build` job failed, even when their own consumer dependency is `skipped`. Today these summary jobs whitelist `skipped` as "passed or skipped"; after fan-out, a failed build skips all consumers, so without this fix a build-broken PR could merge if branch protection only requires the summary names.

#### Scenario: Summary fails on build failure

- **WHEN** the `build` job ends with status `failure` AND the consumer that the summary tracks ends with status `skipped`
- **THEN** the summary job SHALL exit non-zero with a message naming `build` as the upstream failure

#### Scenario: Summary passes on docs-only short-circuit

- **WHEN** the `build` job ends with status `skipped` (docs-only PR) AND the consumer that the summary tracks ends with status `skipped`
- **THEN** the summary job SHALL exit zero — `skipped` is the correct outcome for docs-only PRs

#### Scenario: Summary passes on all-green run

- **WHEN** the `build` job ends with status `success` AND the consumer that the summary tracks ends with status `success`
- **THEN** the summary job SHALL exit zero

#### Scenario: Summary fails when build succeeded but consumer was skipped

- **WHEN** the `build` job ends with status `success` AND the consumer that the summary tracks ends with status `skipped`
- **THEN** the summary job SHALL exit non-zero with a message indicating the consumer was unexpectedly skipped — once `build` succeeded, the consumer SHALL have run; a `skipped` outcome here indicates a workflow misconfiguration (e.g., a stray `if:` clause narrowing further than intended)

### Requirement: Non-consumer jobs do not declare build dependency

Jobs that do not need compiled package output (e.g., `check-links`, `log-bot-skip`) SHALL NOT declare `build` in their `needs:` list. Adding spurious `needs: build` would couple unrelated checks to the build job's outcome and unnecessarily widen the fan-out blast radius.

**Exception**: the existing `notify-failure` job MAY declare `build` in `needs:` because its purpose is to observe the result of upstream jobs (including `build`) for failure-issue creation, not to consume `dist/`. The exception is **explicitly named and bounded to `notify-failure`** — future failure-aggregation jobs (e.g., a hypothetical `metrics-collector`) require a spec amendment to extend this Exception, NOT an ad-hoc edit to the mechanical guard's whitelist. This keeps the spec and the guard's literal whitelist (`scripts/check-ci-fanout-invariants.mjs`) in lockstep: the guard hardcodes `notify-failure`, the spec hardcodes `notify-failure`, and any drift requires a deliberate spec change.

#### Scenario: check-links has no build dependency

- **WHEN** the `check-links` job is defined in `ci.yml`
- **THEN** its `needs:` list SHALL NOT contain `build`

#### Scenario: notify-failure exception is whitelisted

- **WHEN** the `notify-failure` job is defined in `ci.yml`
- **THEN** its `needs:` list MAY contain `build` because the job's purpose is failure aggregation across all upstream jobs (it inspects `needs.build.result` and other `needs.*.result` values), not artifact consumption

### Requirement: Bundle-analysis exception is named and bounded

If a single-package rebuild is required for tooling that instruments the build pipeline (e.g., `@codecov/vite-plugin` bundle analysis), the rebuild SHALL run in a dedicated job (e.g., `bundle-analysis`) — never inside a consumer job. The dedicated job SHALL:

1. Run only on the minimum-supported Node version (currently `22.18.0`), to avoid duplicate uploads.
2. Build only the package whose bundle is being analysed (e.g., `pnpm --filter @kaiord/workout-spa-editor build`).
3. Carry the secret token (e.g., `CODECOV_TOKEN`) on its own step, never on the `build` job.
4. NOT declare `build` in its `needs:` list (it is not a consumer of the artifact).
5. Be gated by the same `should-test` and frontend-changed conditions as the related consumers.
6. Skip cleanly on fork PRs where the secret is unavailable (the job-level or step-level `if:` SHALL evaluate `secrets.CODECOV_TOKEN != ''` so that fork PRs do not waste CI minutes building a no-op upload).

#### Scenario: Bundle-analysis runs only on minimum Node version

- **WHEN** the bundle-analysis job is defined
- **THEN** the job SHALL run on exactly one Node version (the minimum supported, currently `22.18.0`)

#### Scenario: Bundle-analysis builds only the analysed package

- **WHEN** the bundle-analysis job runs
- **THEN** any build step within the job SHALL use `pnpm --filter <single-package> build`, NOT `pnpm -r build`

#### Scenario: Bundle-analysis is not a consumer

- **WHEN** the bundle-analysis job is defined
- **THEN** its `needs:` list SHALL NOT contain `build`

#### Scenario: Bundle-analysis skips on fork PRs

- **WHEN** the bundle-analysis job runs on a `pull_request` from a fork (where `secrets.CODECOV_TOKEN` is empty)
- **THEN** the job SHALL be skipped (or exit early at its first step) rather than executing a no-op build with no upload

### Requirement: Workflow trigger SHALL NOT switch to pull_request_target

The PR-time CI workflow SHALL be triggered by `pull_request` (or equivalent fork-safe events), NOT by `pull_request_target`. The latter exposes `secrets.*` to fork-controlled code (because it runs against the base branch's workflow but with the head ref's payload), which would defeat the bundle-analysis fork-PR skip and could leak `CODECOV_TOKEN` (or any future secret added to a consumer) to attacker-controlled `vite.config.ts`, `tsup.config.ts`, or test harness.

#### Scenario: Workflow does not use pull_request_target

- **WHEN** `.github/workflows/ci.yml` is defined
- **THEN** its `on:` block SHALL NOT contain `pull_request_target`

### Requirement: Docs-only short-circuit is preserved

The `build` job and every consumer SHALL gate execution on `needs.detect-changes.outputs.should-test == 'true'` so that PRs touching only documentation continue to skip the entire build-and-test pipeline.

#### Scenario: Docs-only PR skips build

- **WHEN** the CI workflow runs on a PR whose `detect-changes` step sets `should-test=false`
- **THEN** the `build` job SHALL be skipped

#### Scenario: Docs-only PR skips consumers

- **WHEN** the CI workflow runs on a PR whose `detect-changes` step sets `should-test=false`
- **THEN** every consumer job listed in the consumer-download requirement SHALL be skipped

### Requirement: Single artifact serves all Node-version matrix legs

The `build` job SHALL produce a single `build-artifacts` artifact (not matrixed) and every Node-version matrix leg of every consumer job SHALL download the same artifact. Build output is JS + `.d.ts` only and contains no Node-version-specific bytes; the matrix exists to validate runtime behavior under each Node version, not to validate compilation.

#### Scenario: Test job matrix legs share one artifact

- **WHEN** the `test` job runs across Node versions `22.18.0` and `24.x`
- **THEN** both matrix legs SHALL download the artifact named `build-artifacts` produced by the single `build` job in the same workflow run

#### Scenario: Build job is not matrixed

- **WHEN** the `build` job is defined in `ci.yml`
- **THEN** the `build` job SHALL NOT declare a `strategy.matrix` over Node versions

### Requirement: Artifact retention is bounded by workflow run scope

The `build-artifacts` artifact SHALL be scoped to a single workflow run. No CI job SHALL read a `build-artifacts` artifact from a different workflow run, branch, or PR. Retention SHALL be at least 14 days so that "Re-run failed jobs only" remains usable for the typical PR review cycle, and SHALL NOT exceed 90 days so that artifact storage stays bounded.

#### Scenario: Consumer reads artifact from current run

- **WHEN** a consumer job downloads `build-artifacts`
- **THEN** the download SHALL use the default `actions/download-artifact` behavior, which reads from the current workflow run only (no `run-id` or cross-run download parameters)

#### Scenario: Retention is finite and ≥ 14 days

- **WHEN** the `build` job uploads `build-artifacts`
- **THEN** the upload SHALL declare a `retention-days` value of at least 14 and at most 90

### Requirement: Decision-10 trip-wires are mechanically enforced

The "artifact is environment-agnostic" invariant (Decision 10 in design.md) SHALL be enforced by a mechanical guard, not by documentation alone. The guard SHALL fail CI if any package introduces:

1. A `tsup.config.*` or `vite.config.*` `define:` block that reads from an environment variable (other than the standard `process.env.NODE_ENV` for production/development build modes).
2. A `process.env.NODE_VERSION`-conditional code path inside a build script.
3. A native binding artifact (`*.node`, `*.so`, `*.dylib`) under any package's `dist/`.

The guard SHALL live under `scripts/check-build-portable.mjs` with a co-located `*.test.mjs`, consistent with existing mechanical guards (per `CLAUDE.md` "Mechanical guards > AI review").

#### Scenario: Guard fails on env-var define

- **WHEN** a package's `tsup.config.ts` adds `define: { __API_URL__: process.env.API_URL }`
- **THEN** `pnpm test:scripts` SHALL fail with a message naming the offending file and the violated trip-wire

#### Scenario: Guard fails on native binding in dist

- **WHEN** any `packages/*/dist/` directory contains a `*.node`, `*.so`, or `*.dylib` file after `pnpm -r build`
- **THEN** the guard SHALL fail with a message naming the file and the violated trip-wire

#### Scenario: Guard passes on the current codebase

- **WHEN** `pnpm test:scripts` runs on `main`
- **THEN** the guard SHALL pass — no current package configuration violates a trip-wire
