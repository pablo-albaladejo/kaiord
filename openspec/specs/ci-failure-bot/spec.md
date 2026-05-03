> Synced: 2026-05-03 (2026-05-03-repo-hygiene-tooling)

# CI Failure Issue Bot

## Purpose

Tracks CI red/green state on `main` as GitHub issues with deduplication and auto-close, replacing the inline `actions/github-script` block at `.github/workflows/ci.yml` that historically created one issue per red build with no dedupe and no close path. The bot prevents zombie-issue accumulation in the `ci,automated` label and keeps the open-issue list a faithful signal of unresolved CI failures.

## Requirements

### Requirement: Bot logic lives in a tested script, not inline workflow JS

The CI-failure issue automation SHALL be implemented in `scripts/ci-failure-issue.mjs` with a co-located `scripts/ci-failure-issue.test.mjs` covering every decision branch. The workflow YAML SHALL invoke the script via `node scripts/ci-failure-issue.mjs <create|close>`. Inline `actions/github-script` blocks SHALL NOT carry decision logic; they MAY only marshal environment and dispatch to the script.

The script SHALL follow the project's repo-script convention: entry-point check via `pathToFileURL(process.argv[1]) === import.meta.url`, exported pure functions for testability, structured one-line log lines for greppable workflow output. Tests SHALL mock the `gh` CLI boundary via dependency-injection (`deps.exec`) and exercise every branch enumerated in the requirements below.

#### Scenario: Workflow invokes the script

- **WHEN** the `notify-failure` job runs on a red main build
- **THEN** the job's main step SHALL be `node scripts/ci-failure-issue.mjs create '<failed-jobs-json>'`; no inline JS performs `gh` API calls

#### Scenario: Tests cover all decision branches

- **WHEN** `pnpm test:scripts` runs
- **THEN** the suite SHALL include at least 12 tests for `ci-failure-issue.mjs` covering create, comment-dedupe, close-on-fully-green, skip-on-partial-green, missing-footer, malformed-footer, race-closed, unknown-schema, absent-schema-back-compat, in-process dedupe, no-op-on-no-issue, and `--canary` flag behavior

### Requirement: Footer marker grammar with explicit schema versioning

A created issue body SHALL embed a single machine-readable HTML-comment footer in this exact form:

```
<!-- ci-failure-bot
     failed-jobs: ["<job-1>","<job-2>", ...]
     schema: 1
-->
```

`failed-jobs` SHALL be a JSON array of strings; each string is a stable job identifier emitted by the `notify-failure` aggregation step. `schema` SHALL be an optional integer; if absent, parsers SHALL treat the footer as `schema: 1` (back-compat for v1 issues filed before schema versioning).

The close-pass SHALL parse the footer with these failure modes, in order:

| Footer state                                                       | Action                                                                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Absent                                                             | Do not close. Log `skipped: missing-footer`.                                                            |
| Present, malformed JSON                                            | Do not close. Log `skipped: malformed-footer`. Bot MUST NOT throw.                                      |
| Present, `schema` field absent                                     | Treat as `schema: 1`. Proceed.                                                                          |
| Present, `schema: 1`, `failed-jobs` valid                          | Proceed.                                                                                                |
| Present, `failed-jobs` contains the synthetic `"canary-job"` token | Do not close. Log `skipped: canary-issue` (canary issues stay open until manually resolved by the DRI). |
| Present, `schema: N` where N ≠ 1 and N is unknown to this bot      | Do not close. Log `skipped: unknown-schema`.                                                            |

In v1, the footer is informational + forward-compatible (a future schema-2 bot MAY use `failed-jobs` for per-job matching). The v1 close-rule does NOT match against `failed-jobs` because the workflow_run jobs API returns display names that do not reliably map to the matrix-aware identifiers used in `notify-failure` aggregation. Per-job matching is deferred to v2; v1 uses the coarser "fully-green run" rule documented in the next requirement.

#### Scenario: Footer absent → do not close

- **GIVEN** an open `ci,automated` issue with no HTML-comment footer present
- **WHEN** any green main run completes
- **THEN** the close-pass SHALL NOT close the issue; SHALL log `skipped: missing-footer`

#### Scenario: Malformed footer JSON does not crash the bot

- **GIVEN** an open issue with footer `<!-- ci-failure-bot failed-jobs: not-json schema: 1 -->`
- **WHEN** the close-pass runs
- **THEN** the bot SHALL log `skipped: malformed-footer`; SHALL NOT throw; SHALL exit zero

#### Scenario: Unknown schema is forward-compatible

- **GIVEN** an open issue with footer `failed-jobs: ["lint"]`, `schema: 2`
- **WHEN** the current bot (which only understands schema 1) runs the close-pass
- **THEN** the bot SHALL log `skipped: unknown-schema`; SHALL NOT close; SHALL NOT throw

#### Scenario: Absent schema field is treated as schema 1

- **GIVEN** an open issue with footer `failed-jobs: ["lint"]` and no `schema:` line
- **WHEN** the close-pass runs against a fully-green run
- **THEN** the bot SHALL parse as schema 1 and SHALL close the issue

#### Scenario: Canary issue is preserved across green runs

- **GIVEN** an open `ci,automated,canary` issue with footer `failed-jobs: ["canary-job"]`, `schema: 1`
- **WHEN** any subsequent fully-green main run completes
- **THEN** the close-pass SHALL log `skipped: canary-issue` and SHALL NOT close the issue; only the DRI's manual close resolves it

### Requirement: v1 close-rule — close only on a fully-green run

The close-pass SHALL close open `ci,automated` issues only when the workflow_run that triggered it executed every CI job (zero jobs with `conclusion == "skipped"`). If any CI job was skipped on the green run — typically due to path-filter or matrix gating — the close-pass SHALL log `skipped: jobs-skipped-on-green-run` and leave all issues open.

The success listener SHALL detect the skipped-jobs condition by querying the GitHub Actions `repos/{owner}/{repo}/actions/runs/{run_id}/jobs` API for the green workflow_run and filtering `.conclusion == "skipped"`. The result is a single boolean (`anyJobsSkipped`) passed to the close-pass.

This v1 rule is intentionally coarse: a path-filtered green run will leave issues open until the next all-jobs-ran green run. The trade-off avoids the v1 implementation cost of mapping workflow_run job display names back to the matrix-aware identifiers used by the failure listener (e.g., display name `"test (workout-spa-editor, 22.x)"` vs. emitted identifier `"test"`). v2 of the bot MAY refine this with per-job matching once a stable identifier scheme is in place.

#### Scenario: Fully-green main run closes a stale issue

- **GIVEN** an open `ci,automated` issue with a well-formed footer
- **WHEN** a green main run completes with zero skipped jobs
- **THEN** the close-pass SHALL close the issue and append the comment `Auto-closed: main green at <SHA>; jobs covered: <footer-jobs>.`

#### Scenario: Partial-green run leaves issues open

- **GIVEN** one or more open `ci,automated` issues
- **WHEN** a green main run completes but at least one CI job had `conclusion == "skipped"` (e.g., path-filter or matrix gating)
- **THEN** the close-pass SHALL skip every open issue with reason `jobs-skipped-on-green-run`; SHALL NOT close any of them

### Requirement: Cross-workflow concurrency + staleness re-check

The `notify-failure` job (CI workflow, on main red) and the `notify-success` job (workflow_run listener, on CI=success on main) SHALL share the concurrency group `ci-issue-bot-${{ github.ref }}` with `cancel-in-progress: false`. This serializes the create-pass and close-pass against each other across workflows when GitHub Actions honors cross-workflow concurrency-group identity.

The close-pass SHALL perform an immediately-pre-close staleness re-check by re-fetching the issue state. If the issue was closed by another process between the `list` call and the pre-close `get`, the close-pass SHALL skip with `skipped: race-closed` and log accordingly.

`notify-success` SHALL be triggered by the GitHub Actions `workflow_run` event with `workflows: [CI]`, `branches: [main]`, conclusion `success`. The job SHALL run with the default branch's `GITHUB_TOKEN` (the documented behavior of `workflow_run`), not the head ref's, and SHALL declare `permissions: { issues: write }` only.

#### Scenario: Concurrent create-and-close serialize on shared group

- **GIVEN** a red main build is creating an issue (in `notify-failure`) and a subsequent green main build is starting `notify-success`
- **WHEN** both jobs reference concurrency group `ci-issue-bot-refs/heads/main`
- **THEN** GitHub Actions SHALL serialize them; the close-pass SHALL begin only after the create-pass completes

#### Scenario: Pre-close staleness re-check skips a race

- **GIVEN** the close-pass has listed open issues and selected issue #N
- **WHEN** an external maintainer closes issue #N before the pre-close `get` resolves
- **THEN** the bot SHALL skip with `skipped: race-closed`; SHALL NOT attempt the close API call

### Requirement: Runtime kill-switch via repository variable

Both `notify-failure` and `notify-success` jobs SHALL be gated by `if: vars.CI_ISSUE_BOT_ENABLED != 'false'`. The variable SHALL default to "absent" (which evaluates to enabled). A maintainer disabling the bot SHALL set the repository variable `CI_ISSUE_BOT_ENABLED` to the literal string `false` via the GitHub UI (Settings → Variables → Actions); flipping it MUST disable the bot within one workflow tick (≤ 60s) without requiring a revert PR.

#### Scenario: Variable set to 'false' disables both jobs

- **GIVEN** `vars.CI_ISSUE_BOT_ENABLED == 'false'`
- **WHEN** a red main build triggers the workflow
- **THEN** `notify-failure` SHALL be skipped (the job's `if:` evaluates false); no issue SHALL be created

#### Scenario: Variable absent enables both jobs

- **GIVEN** `vars.CI_ISSUE_BOT_ENABLED` is unset OR set to any string other than `false`
- **WHEN** a red main build triggers the workflow
- **THEN** `notify-failure` SHALL run

### Requirement: Canary path with synthetic-failure fallback

The bot SHALL be considered shipped only after the DRI has inspected one bot-created issue end-to-end. The canary SHALL be either (a) the first natural red-main run after merge, inspected within 24h, OR (b) a synthetic failure forced by triggering the dedicated `ci-issue-bot-canary` workflow via `workflow_dispatch` after 7 days of green main.

The dedicated canary workflow SHALL be a separate file (`.github/workflows/ci-issue-bot-canary.yml`) triggered exclusively by `workflow_dispatch`. It SHALL invoke `node scripts/ci-failure-issue.mjs create '["canary-job"]' --canary` and SHALL share the kill-switch (`if: vars.CI_ISSUE_BOT_ENABLED != 'false'`) and permissions surface (`permissions: { issues: write }`) of the production bot jobs.

The bot script's `--canary` flag SHALL prepend `[CANARY]` to the issue title AND attach the additional label `canary` (alongside the standard `ci,automated`) so the resulting issue is trivially distinguishable from real CI-failure issues during DRI triage. The synthetic job name `canary-job` SHALL NOT match any real CI job, so the canary issue SHALL remain open until the DRI closes it manually after inspection — no throwaway branch is required.

#### Scenario: Natural canary fires within 24h

- **GIVEN** the bot has been merged and a red main run occurred within 24h
- **WHEN** the bot creates an issue
- **THEN** the DRI SHALL inspect the issue body, footer marker, labels, and the corresponding workflow log within 24h

#### Scenario: Synthetic canary fires after 7 days of green main

- **GIVEN** the bot has been merged and main has been green for 7 days
- **WHEN** the DRI triggers the `ci-issue-bot-canary` workflow via `workflow_dispatch`
- **THEN** the bot SHALL create an issue titled `[CANARY] 🚨 CI Failure on main branch` with labels `ci,automated,canary` and footer `failed-jobs: ["canary-job"]`, `schema: 1`; the DRI SHALL inspect and manually close it
