## Why

Issue #1166, decided on 2026-11-22: the `Dependency Security Audit` becomes a
required check on `main` (parent #1670, "Safe by construction").

- Branch protection matches a required check by its exact name and waits for
  it on every pull request. `security.yml` ran on pull requests only when a
  manifest or lockfile changed, so every other pull request would wait for a
  check that never starts and could never merge.
- A job skipped because a job it `needs:` failed reports "skipped", which
  branch protection counts as passing.
- A registry outage produced no report, which read as clean.

## What Changes

- `security.yml` triggers on every pull request (no `paths`, `branches` or
  `types` filter), on every push to `main`, weekly and by hand.
- One job, named exactly `Dependency Security Audit`, with no job-level
  `if:`, `needs:`, matrix or `continue-on-error`. A step inside it decides
  the scope: a pull request that changes no manifest, lockfile, workspace
  file, patch or the audit itself passes in seconds; every other run audits
  production dependencies and fails on a high or critical finding, as
  before. An unreadable detector result fails the check.
- The audit retries a registry outage twice with backoff, then fails with an
  error naming the outage, not a finding.
- `tj-actions/changed-files`, which the scope step and `ci.yml`'s
  detect-changes use, is pinned to the full commit of v47.0.0 instead of the
  mutable `v47` tag.
- Root guard `scripts/check-security-audit-required.mjs`
  (`pnpm lint:security-audit-required`, R-SecurityAuditAlwaysReports) holds
  all of the above that a parser can see.

## Impact

- CI only; no package changes.
- Not changed here (owner decisions): the audit's severity threshold and its
  `--prod` scope; adding the check to branch protection, which is a repo
  setting the maintainer applies.
