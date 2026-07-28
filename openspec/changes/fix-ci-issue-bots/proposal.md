## Why

Two GitHub automation bots have been silently broken for over a month. Both
fail open — they never error, they just quietly stop doing their job — so
neither showed up in CI status.

**1. The CI-failure bot's close-on-green pass can never fire.**

`.github/workflows/ci-issue-bot-success.yml` computes a single boolean
`anyJobsSkipped` ("did any job on the green run have `conclusion == skipped`,
excluding `auto-merge`") and `decideClose` refuses to close any issue when it
is true. But `ci.yml` contains two jobs that are skipped on every green run by
construction:

- `log-bot-skip` — `if: github.actor == 'github-actions[bot]'`. On a human or
  dependabot merge it is skipped; on a bot commit it runs and everything
  gated on `detect-changes` (`if: github.actor != 'github-actions[bot]'`) is
  skipped instead.
- `notify-failure` (display name `Notify on Failure`) — its `if:` requires at
  least one `needs.*.result == 'failure'`, which is false by definition on a
  green run.

So `anyJobsSkipped` is unconditionally true and the bot has never closed a
single issue. Measured on the three most recent green runs on `main`:

| Run           | Skipped jobs (excluding `auto-merge`) |
| ------------- | ------------------------------------- |
| `30398342171` | `log-bot-skip`, `Notify on Failure`   |
| `30387496718` | the two above + 12 path-filtered jobs |
| `30363552073` | the two above + 3 path-filtered jobs  |

The workflow's own comment acknowledges the trade-off — "leaves issues open
until the next all-jobs-ran green run" — but that run is unreachable, so the
trade-off is total. The `2026-05-03-repo-hygiene-tooling` proposal that
introduced the bot specified `close-on-match` / `skip-on-job-mismatch`
(per-job matching); the shipped v1 substituted the coarse gate and deferred
matching to "v2". This change implements v2.

A second, independent defect in the same step: the jobs API is read without
`--paginate`, and it pages at 30. A full CI run has 54 jobs, so the gate only
ever inspected the first 30.

**2. The CWS notifier's dedupe search never matches, so it duplicates every run.**

`scripts/cws-notify-issue.mjs` claims to be "Idempotent: searches by exact
title", implemented as
`gh issue list --search "<title> in:title"`. The titles contain `:`, `@` and
`/` — e.g. `CWS publish stalled: @kaiord/train2go-bridge@10.0.0` — and
GitHub's search parser reads `stalled:` as a qualifier and `@kaiord` as a user
reference, so the query matches nothing. Verified against the live repo:

| Query                                        | Results |
| -------------------------------------------- | ------- |
| the search exactly as the script builds it   | 0       |
| the same search with the title double-quoted | 8       |
| `--label cws-publish-verification-timeout`   | 8       |

The observable consequence is 8+ open issues with byte-identical titles.

Related: the script attaches the kind as a label, but
`cws-publish-rejected` **does not exist in the repo**. `gh issue create
--label` fails on a missing label, which previously caused the notifier to
lose an alert entirely (`could not add label: 'cws-auth-broken' not found`).
The workflow's "Ensure issue labels exist" step creates `cws-stuck`,
`cws-untrusted-state` and `needs-human` — none of the three labels the
notifier itself depends on.

## What Changes

### CI-failure bot — v2 per-job close rule

- Replace the global `anyJobsSkipped` veto with a per-issue check: close an
  issue iff **every job named in its footer's `failed-jobs` array both ran and
  succeeded** on the green run. Jobs not named in the footer (including the two
  structurally-skipped ones) are irrelevant.
- Reconcile the two naming schemes the bot straddles. The create pass records
  job **IDs** (`needs.<id>.result`); the jobs API reports **display names**.
  `matchRunJobs` maps a footer job to its exact-name job plus every matrix
  shard (`e2e-frontend` → `e2e-frontend (1..4)`), via an alias table for the
  one footer-recordable job that overrides its name (`check-links` →
  `Link checker`).
- Guard against a false close that the coarse gate accidentally prevented: on
  a docs-only run `build` is skipped, so the aggregator jobs (`lint-summary`
  → `name: lint`, `test-summary` → `name: test`, and the round-trip /
  test-frontend equivalents) exit 0 _without the real matrix job having run_.
  The API reports both a `success` and a `skipped` job under the same display
  name, so requiring **all** same-named jobs to be green refuses the close.
- The success workflow now hands the script the full job list via the
  `GREEN_RUN_JOBS` env var (env, not argv — display names contain spaces and
  parentheses) and reads it with `--paginate`.
- Every existing safety default is preserved: missing footer, malformed
  footer, unknown schema, canary, and race-closed all still skip. Two new
  uncertainty cases also skip: an empty footer job set and an unreadable job
  list.

### CI-failure bot — repairing the create side too

The close rule is only as good as the footer it reads, and the writer had two
defects of its own:

- `jscpd` is listed as a `notify-failure` failure trigger but was never
  appended by the aggregation step. A jscpd-only red main therefore filed an
  issue whose footer named no job — permanently unclosable under the v2 rule.
  It is now recorded (no alias needed; it has no `name:` override).
- `printf '%s\n' "${jobs[@]}" | jq -R . | jq -sc .` serialises an **empty**
  bash array as `[""]`, not `[]` — a footer naming a job that cannot exist.
  Replaced with `jq -nc '$ARGS.positional' --args`.
- New guard `scripts/check-ci-failure-bot-contract.mjs`
  (`R-CiFailureBotContract`) asserts the writer and reader stay in agreement:
  triggers ⇄ recordings, and the alias table ⇄ `ci.yml`'s `name:` overrides.
  Both defects above are drift of exactly this kind, and neither failed loudly.

### CWS notifier — label-based dedupe

- Dedupe by listing the kind's own label and comparing titles exactly,
  client-side. This removes the dependency on GitHub's search-query parsing
  entirely; there is no quoting pitfall to get wrong.
- The script self-heals its own labels (`gh label create --force`) before
  creating an issue, and falls back to filing the issue **unlabelled** if the
  label cannot be created — a labelling failure must never swallow the alert.
- `cws-publish.yml`'s label-ensure step additionally pre-creates all three
  notifier labels.
- The header comment is rewritten to describe the mechanism the code actually
  implements, including an honest statement of the residual concurrency
  window.

## Impact

- Affected specs: `ci-failure-bot`, `cws-auto-publish`
- Affected code: `scripts/ci-failure-issue-helpers.mjs`,
  `scripts/ci-failure-issue.mjs`, `scripts/cws-notify-issue.mjs`,
  new `scripts/check-ci-failure-bot-contract.mjs`,
  `.github/workflows/ci.yml`, `.github/workflows/ci-issue-bot-success.yml`,
  `.github/workflows/cws-publish.yml`
- No package source touched; no changeset required (repo tooling only).
- The existing duplicate issues are **not** cleaned up here — cleanup happens
  after this merges, otherwise the duplicates regenerate on the next run.
