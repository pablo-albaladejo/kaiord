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
