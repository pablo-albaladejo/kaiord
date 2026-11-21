> Synced: 2026-11-20 (fix-ci-issue-bots)

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
- **THEN** the suite SHALL include at least 12 tests for `ci-failure-issue.mjs` covering create, comment-dedupe, close-on-covered-run, skip-on-uncovered-run, missing-footer, malformed-footer, race-closed, unknown-schema, absent-schema-back-compat, in-process dedupe, no-op-on-no-issue, and `--canary` flag behavior
- **AND** the suite SHALL cover the per-job coverage rule: display-name aliasing, matrix-shard collection, aggregator/real-job name collision, empty job set, and an unreadable job list

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

`failed-jobs` is the close-pass's operative input: the bot matches each identifier against the green run's jobs per the per-job coverage rule. Identifiers are job IDs, reconciled to workflow_run display names by the close-pass; see "Footer job identifiers reconcile to workflow_run display names".

Every job named in the `notify-failure` job's `if:` trigger condition SHALL also be recorded by its aggregation step. A trigger that is never recorded yields a footer no green run can satisfy, leaving a permanently unclosable issue. An empty failure set SHALL serialise as `[]`, never as `[""]`.

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
- **WHEN** the close-pass runs against a green run covering `lint`
- **THEN** the bot SHALL parse as schema 1 and SHALL close the issue

#### Scenario: Canary issue is preserved across green runs

- **GIVEN** an open `ci,automated,canary` issue with footer `failed-jobs: ["canary-job"]`, `schema: 1`
- **WHEN** any subsequent green main run completes
- **THEN** the close-pass SHALL log `skipped: canary-issue` and SHALL NOT close the issue; only the DRI's manual close resolves it

#### Scenario: Every notify-failure trigger is recordable

- **GIVEN** the `notify-failure` job's `if:` condition names a job as a failure trigger
- **WHEN** that job is the only one that failed
- **THEN** the aggregation step SHALL emit a footer naming it; the footer SHALL NOT be empty and SHALL NOT be `[""]`

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

### Requirement: v2 close-rule — per-job coverage on the green run

The close-pass SHALL close an open `ci,automated` issue only when **every** job
named in that issue's footer `failed-jobs` array both RAN and SUCCEEDED on the
green workflow_run. Jobs not named in the issue's footer SHALL NOT affect the
decision.

The success listener SHALL query
`repos/{owner}/{repo}/actions/runs/{run_id}/jobs` for the green run and pass
the full `{name, conclusion}` list to the close-pass. The query SHALL use
`--paginate`: the endpoint pages at 30 results and a full CI run exceeds that
(54 jobs observed), so an unpaginated read silently truncates. The list SHALL
be passed via the `GREEN_RUN_JOBS` environment variable rather than argv,
because job display names contain spaces and parentheses.

The close-pass SHALL treat each of the following as uncertainty and SHALL NOT
close:

| Coverage state                                       | Logged reason          |
| ---------------------------------------------------- | ---------------------- |
| Job list empty or unparseable                        | `run-jobs-unavailable` |
| Footer `failed-jobs` is an empty array               | `empty-job-set`        |
| A footer job has no counterpart job on the green run | `job-missing-on-run`   |
| A footer job's counterpart is not `success`          | `job-not-green-on-run` |

#### Scenario: Structurally-skipped jobs no longer block the close

- **GIVEN** an open `ci,automated` issue with footer `failed-jobs: ["lint","test"]`
- **AND** a green main run on which `log-bot-skip` and `Notify on Failure` are skipped (as they are on every green run) while all `lint` and `test` jobs succeeded
- **THEN** the close-pass SHALL close the issue and append the comment `Auto-closed: main green at <SHA>; jobs covered: <footer-jobs>.`

#### Scenario: Path-filtered green run closes an issue it fully covers

- **GIVEN** an open issue with footer `failed-jobs: ["lint"]`
- **WHEN** a green main run completes in which `bundle-analysis` and `e2e-prod-base` were skipped but every `lint` job succeeded
- **THEN** the close-pass SHALL close the issue; partial coverage of the CI surface is irrelevant when it covers this issue's jobs

#### Scenario: Aggregator success does not mask a skipped matrix job

- **GIVEN** an open issue with footer `failed-jobs: ["test"]`
- **WHEN** a docs-only green run completes in which `build` was skipped, so the `test-summary` job (display name `test`) exits 0 while the real `test` matrix job is reported `skipped` under the same display name
- **THEN** the close-pass SHALL log `skipped: job-not-green-on-run` and SHALL NOT close the issue

#### Scenario: Unreadable job list closes nothing

- **GIVEN** one or more open `ci,automated` issues with well-formed footers
- **WHEN** `GREEN_RUN_JOBS` is unset, empty, or not a JSON array
- **THEN** the close-pass SHALL log `skipped: run-jobs-unavailable` for every issue; SHALL NOT throw; SHALL exit zero

### Requirement: Footer job identifiers reconcile to workflow_run display names

The create-pass records job **IDs** (from `needs.<job-id>.result`), while the
workflow_run jobs API reports each job's **display name** (`name:`). The
close-pass SHALL reconcile the two.

A footer job identifier SHALL match a run job when the run job's name is
either the identifier's display name exactly, or that display name followed by
a parenthesised matrix suffix (`<name> (<matrix values>)`). Where `ci.yml`
overrides a footer-recordable job's `name:`, the close-pass SHALL carry an
explicit alias; today the only such job is `check-links` → `Link checker`.

When several run jobs match one footer identifier — every shard of a matrix,
or an aggregator job that shares a display name with the real job — ALL of
them SHALL be `success` for the identifier to count as covered.

#### Scenario: Matrix shards all count toward one footer job

- **GIVEN** an open issue with footer `failed-jobs: ["e2e-frontend"]`
- **WHEN** the green run reports `e2e-frontend (1)` … `e2e-frontend (4)`, all `success`
- **THEN** the footer job SHALL count as covered

#### Scenario: Renamed job resolves through the alias table

- **GIVEN** an open issue with footer `failed-jobs: ["check-links"]`
- **WHEN** the green run reports a successful job whose display name is `Link checker`
- **THEN** the footer job SHALL count as covered; the bot SHALL NOT report `job-missing-on-run`

#### Scenario: Prefix collision does not produce a false match

- **GIVEN** a footer job identifier `test`
- **WHEN** the green run contains a job named `test-cli`
- **THEN** `test-cli` SHALL NOT be treated as a counterpart of `test`
