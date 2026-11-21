## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: v1 close-rule — close only on a fully-green run

**Reason**: Unsatisfiable by construction. The rule vetoed the close-pass
whenever any job on the green run had `conclusion == "skipped"`, but `ci.yml`
guarantees at least one such job on every green run (`log-bot-skip` is gated
on `github.actor == 'github-actions[bot]'`; `notify-failure` requires a failed
job). The gate was therefore always true and the bot never closed an issue in
the ~3 months it was live.

**Migration**: Replaced by "v2 close-rule — per-job coverage on the green
run" below, which scopes the check to each issue's own footer jobs. No issue
data migration is needed: the schema-1 footer already carries `failed-jobs`,
which the v2 rule reads.

## ADDED Requirements

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
