# Tasks

## 1. CI-failure bot — v2 per-job close rule

- [x] 1.1 Add failing tests to `scripts/ci-failure-issue.test.mjs` using job-list
      fixtures modelled on runs `30348079209` (all-ran green) and
      `30387496718` (docs-only green) — real display names and conclusions,
      sampled down to a readable subset: close on a run whose only skips are
      `log-bot-skip` + `Notify on Failure`; refuse when the footer's own job did
      not re-run; refuse on missing job, empty job set, and unreadable job list.
- [x] 1.2 Add `matchRunJobs` (exact name + matrix-suffix + `check-links` →
      `Link checker` alias) and `evaluateJobCoverage` to
      `scripts/ci-failure-issue-helpers.mjs`.
- [x] 1.3 Change `runClose` to take `{ runJobs, ctx }`, drop the
      `anyJobsSkipped` veto, and insert the coverage check after the footer
      safety defaults and before the pre-close staleness re-check.
- [x] 1.4 Add `parseRunJobs` to `scripts/ci-failure-issue.mjs` (never throws;
      degrades to `[]`) and read the job list from `GREEN_RUN_JOBS`.
- [x] 1.5 Rewrite the `ci-issue-bot-success.yml` collection step to emit the
      full job list with `--paginate` (the endpoint pages at 30; runs have 54).

## 2. CWS notifier — label-based dedupe

- [x] 2.1 Add failing tests to `scripts/cws-notify-issue.test.mjs` using a `gh`
      stub that models the verified live behaviour (search drops titles
      containing `:`/`@`; label listing does not; `issue create --label` fails
      on a missing label).
- [x] 2.2 Rewrite `findOpenIssue` to list by the kind's label and match titles
      exactly client-side; drop `--search`.
- [x] 2.3 Add `ensureLabel` (idempotent `--force`) and fall back to an
      unlabelled create when the label cannot be ensured.
- [x] 2.4 Pre-create the three notifier labels in `cws-publish.yml`.
- [x] 2.5 Rewrite the header comment to describe the implemented mechanism and
      the residual concurrency window.

## 3. Review round — create/close contract and degraded paths

- [x] 3.1 Add `jscpd` to the assemble step: it triggers `notify-failure` but was
      never recorded, so a jscpd-only red main produced a footer no green run
      could satisfy — a permanently unclosable issue.
- [x] 3.2 Serialise the failed-jobs array with `jq -nc '$ARGS.positional'
--args`; the previous `printf | jq -R` emitted `[""]` for an empty set.
- [x] 3.3 Add `scripts/check-ci-failure-bot-contract.mjs` +
      `.test.mjs` (R-CiFailureBotContract) asserting triggers ⇄ recordings,
      alias table ⇄ `ci.yml` `name:` overrides, and absence of the `[""]`
      idiom. Verified it reports both real defects against the pre-fix ci.yml.
- [x] 3.4 Add `## MODIFIED Requirements` to the ci-failure-bot delta so the
      surviving v1 prose in "Bot logic…" and "Footer marker grammar" is
      replaced at archive time instead of contradicting the shipped code.
- [x] 3.5 Bound the CWS degraded path: scan open issues by title before
      creating, and adopt the orphan via `--add-label` once label writes
      recover. Two- and three-invocation regression tests.
- [x] 3.6 `set -o pipefail` in the job-collection step so a mid-pagination `gh`
      failure fails the step instead of yielding a silently truncated list;
      correct design.md D4, which claimed truncation yields `[]`.
- [x] 3.7 Move `Ensure issue labels exist` above the `cws-auth-broken` notify
      step and give it `if: always()`, so the run that trips the auth check has
      the label it needs.
- [x] 3.8 Null-prototype the alias table (footer content is editable by anyone
      who can edit a `ci`+`automated` issue); correct the `GREEN_ALL_RAN`
      fixture comment to describe the subset it actually is; fix design.md's
      shard count (×28, verified against the API).

## 4. Verification

- [x] 4.1 `pnpm test:scripts`.
- [x] 4.2 `pnpm lint` at root.
- [x] 4.3 `pnpm -r build`.
- [x] 4.4 `pnpm lint:specs`.

## 5. Follow-up (NOT in this change)

- [ ] 5.1 After merge, close the 8+ duplicate `CWS publish stalled: …` issues
      and triage any stale `ci,automated` issues the fixed close-pass does not
      pick up on its own. Deliberately deferred: cleaning up before the fix
      merges just lets the duplicates regenerate on the next publish run.

      > Deferred to: post-merge cleanup

> Tasks: 22 completed, 1 deferred
