# Design

## D1 — Why per-job coverage instead of fixing the boolean gate

The obvious minimal patch is to widen the gate's exclusion list from
`auto-merge` to `{auto-merge, log-bot-skip, Notify on Failure}`. Rejected:

- It is a denylist that silently rots. Any future job with an `if:` that is
  false on green runs re-breaks the bot, in exactly the same undetectable way.
- It stays coarse: a path-filtered green run still blocks closes on issues the
  run fully covered.
- It is strictly less safe than per-job matching (see D3) — it would happily
  close a `test` issue on a docs-only run where `test` never ran.

Per-job matching is what the original `2026-05-03-repo-hygiene-tooling`
proposal specified (`close-on-match` / `skip-on-job-mismatch`); v1 substituted
the gate and the footer schema was kept forward-compatible for precisely this.

## D2 — Reconciling job IDs with display names

The bot straddles two naming schemes and the v1 comment deferred the problem
rather than solving it. Verified against the live jobs API:

| Footer identifier (job ID)            | How the jobs API reports it                     |
| ------------------------------------- | ----------------------------------------------- |
| `build`, `typecheck`, `e2e-prod-base` | same name                                       |
| `check-links`                         | `Link checker` (ci.yml overrides `name:`)       |
| `lint`                                | `lint (22.18.0)`, `lint (24.x)`, **and** `lint` |
| `test`                                | `test (<node>, <pkg>)` ×26, **and** `test`      |
| `test-cli`                            | `test-cli (22.18.0)`, `test-cli (24.x)`         |
| `e2e-frontend`                        | `e2e-frontend (1)` … `(4)`                      |

Matching rule: exact display name, or display name + ` (` … `)`. The alias
table carries the one footer-recordable `name:` override. It is deliberately a
literal table rather than a parse of `ci.yml` — three lines of data beats a
YAML dependency in a script that must never throw.

## D3 — The aggregator collision, and why "all matches must be green"

`ci.yml` defines four aggregator jobs whose `name:` shadows a real job:
`lint-summary` → `lint`, `test-summary` → `test`, `round-trip-summary` →
`round-trip`, `test-frontend-summary` → `test-frontend`. Each is `if: always()`
and each **exits 0 when `build` was skipped**:

```
if [ "$build_result" = "skipped" ]; then
  echo "Build skipped (docs-only); test correctly not run."
  exit 0
fi
```

So on a docs-only green run the API reports, under the identical name `test`,
both a `success` (the aggregator) and a `skipped` (the real matrix job, which
GitHub does not expand when the whole job is gated off). A naive
"find a job with this name and check it succeeded" implementation picks the
aggregator and **falsely closes an issue whose tests never re-ran**.

Requiring every same-named job to be `success` resolves this without needing to
know which is which. This is the one place where the v2 rule is subtle rather
than obvious, and it has a dedicated test with the real job list.

## D4 — Passing the job list by env, not argv

Display names contain spaces and parentheses (`test (22.18.0, core)`), so
argv-passing invites a quoting bug in YAML → shell → node. `GREEN_RUN_JOBS`
carries a single-line JSON array (`jq -sc`) instead. `parseRunJobs` never
throws: an unset, truncated, or non-array value yields `[]`, which the close
rule reports as `run-jobs-unavailable` and closes nothing. The failure mode of
the transport is therefore "close nothing", never "close everything".

## D5 — Label-based dedupe over quoted search

Two candidate fixes for the CWS notifier:

1. Quote the title in the search query (`"<title>" in:title`). Verified to
   work — returns the 8 duplicates — but keeps a dependency on GitHub's search
   parser, which is undocumented for this edge and has already produced one
   silent month-long outage. Search is also eventually-consistent, so a
   freshly-created issue can be invisible to the next invocation.
2. List by the kind's own label and compare titles in JS.

Chose (2). Every kind already applies its own label, the read has no quoting
surface, and `gh issue list --label <missing>` exits 0 with `[]` rather than
erroring — so an absent label degrades to "no match" instead of a crash.

The trade-off is that dedupe now **depends** on the label, which is what makes
the missing-`cws-publish-rejected` label a correctness bug rather than
cosmetic. Hence D6.

## D6 — Label self-healing, and why the fallback is unlabelled-but-filed

`gh issue create --label <missing>` fails, and this repo has already lost an
alert that way (`could not add label: 'cws-auth-broken' not found`). The
workflow's existing label-ensure step covers `cws-stuck`,
`cws-untrusted-state` and `needs-human` — none of the notifier's own three.

Fixed in two places deliberately:

- The **script** ensures its own label before creating. This is the load-bearing
  fix: it holds regardless of which workflow or step calls the script.
- The **workflow** pre-creates all three. Defence in depth, and it keeps the
  labels present for humans filtering the issue list even when no alert fires.

If label creation still fails, the script files the issue unlabelled and
reports `labeled: false`. That issue will not dedupe against the next run, so
the degraded mode trades a possible duplicate for a guaranteed alert — the
right way round, given the alternative is silence.
