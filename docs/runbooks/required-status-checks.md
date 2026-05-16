# Required status checks for `main`

Runbook for the manual GitHub repository-settings change tracked by
[issue #623](https://github.com/pablo-albaladejo/kaiord/issues/623). This
file is the written record so the settings change can be applied unambiguously
via the GitHub web UI by an admin.

> **This document does not change repo settings.** Branch protection is
> configured only through the GitHub web UI / API. Closing #623 requires the
> admin to apply the change described below; merging this doc alone is not
> sufficient.

## Why

[PR #606](https://github.com/pablo-albaladejo/kaiord/pull/606) was merged on
2026-05-14 with `e2e-frontend (1)` and `e2e-frontend (2)` failing. Branch
protection at the time did not list `e2e-frontend` as a required check, so
GitHub allowed the merge. The new coaching-dialog AI flow tests that PR
introduced (`coaching-dialog-redesign.spec.ts`) never passed in CI and broke
`main` for two days, surfaced repeatedly by the CI-failure bot (see
[#608](https://github.com/pablo-albaladejo/kaiord/issues/608)) until the
cascade of fixes in [#614](https://github.com/pablo-albaladejo/kaiord/pull/614)
and [#605](https://github.com/pablo-albaladejo/kaiord/issues/605) unwound the
regression.

Root cause for the bypass: the `e2e-frontend` matrix is gated by
`detect-changes.outputs.frontend-changed`. When a PR does not touch frontend
paths, the jobs are skipped, and GitHub's default behavior counts a skipped
required check as a pass. Without `e2e-frontend` listed as required at all,
even a real `failure` outcome did not block the merge.

## Required checks (apply manually via repo Settings)

Navigate to:

**Settings → Branches → Branch protection rules → `main` → Edit →
"Require status checks to pass before merging" → "Status checks that are
required"**

Add the following check names (case-sensitive, exactly as they appear in the
Actions UI — driven by the matrix shard index in
`.github/workflows/ci.yml::e2e-frontend.strategy.matrix.shard = [1, 2, 3, 4]`):

- `e2e-frontend (1)`
- `e2e-frontend (2)`
- `e2e-frontend (3)`
- `e2e-frontend (4)`
- `e2e-prod-base`

Keep all existing required checks. Do not remove anything that is already
listed.

If a check name does not appear in GitHub's autocomplete, run the workflow
at least once on a PR so GitHub registers the check name, then re-open the
settings page and search again.

## Rollback

Same UI: **Settings → Branches → `main` → Edit → Status checks that are
required → remove the entry**.

If a check name was mistyped and now blocks every merge, an admin can:

1. Remove the offending entry from the required-checks list (preferred), or
2. Merge any urgent PR via `gh pr merge --admin <PR>` while the settings
   fix is in flight. Admin bypass MUST be followed by re-running the failing
   check on `main` (or a fast-follow PR) to confirm the merged code is
   actually green.

## Verification

After applying:

1. Pick an open PR (or open a throwaway one) whose `e2e-frontend (n)` shard
   is red.
2. Confirm the green "Merge pull request" button is disabled for non-admin
   reviewers and shows "Required statuses must pass before merging".
3. Confirm a PR that does **not** touch frontend paths (e.g. a docs-only
   change) is **not** blocked by `e2e-frontend (n)` skips. If it is blocked,
   the path-filter-skip-as-pass behavior has regressed and the policy needs
   to switch from "Required" to "Required when run" (see GitHub docs on
   conditional checks); revisit by re-opening
   [#623](https://github.com/pablo-albaladejo/kaiord/issues/623).

## References

- Issue [#623](https://github.com/pablo-albaladejo/kaiord/issues/623) —
  driving acceptance criteria.
- Incident PR [#606](https://github.com/pablo-albaladejo/kaiord/pull/606),
  CI-failure detection [#608](https://github.com/pablo-albaladejo/kaiord/issues/608),
  unwinding fixes [#614](https://github.com/pablo-albaladejo/kaiord/pull/614)
  and [#605](https://github.com/pablo-albaladejo/kaiord/issues/605).
- Workflow definitions: `.github/workflows/ci.yml` (`e2e-frontend`,
  `e2e-prod-base`).
- GitHub docs: [About protected branches → Require status checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging).
