# Tasks

## 1. CI-failure bot — v2 per-job close rule

- [x] 1.1 Add failing tests to `scripts/ci-failure-issue.test.mjs` encoding real
      job lists captured from runs `30348079209` (all-ran green) and
      `30387496718` (docs-only green): close on a run whose only skips are
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

## 3. Verification

- [x] 3.1 `pnpm test:scripts` — 598 tests, 0 failures.
- [x] 3.2 `pnpm lint` at root.
- [x] 3.3 `pnpm -r build`.
- [x] 3.4 `pnpm lint:specs`.

## 4. Follow-up (NOT in this change)

- [ ] 4.1 After merge, close the 8+ duplicate `CWS publish stalled: …` issues
      and triage any stale `ci,automated` issues the fixed close-pass does not
      pick up on its own. Deliberately deferred: cleaning up before the fix
      merges just lets the duplicates regenerate on the next publish run.

      > Deferred to: post-merge cleanup

> Tasks: 14 completed, 1 deferred
