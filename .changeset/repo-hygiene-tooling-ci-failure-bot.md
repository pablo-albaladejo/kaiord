---
---

chore(ci): rework ci-failure issue bot — extract to tested script, dedupe on red, auto-close on green

PR-1 of the `repo-hygiene-tooling` change. Replaces the inline ~100-line `actions/github-script@v9` block in `.github/workflows/ci.yml` `notify-failure` with `scripts/ci-failure-issue.{mjs,helpers.mjs}` driven by the `gh` CLI (no Octokit dep) and 17 co-located node:test branches. Two new workflows: `ci-issue-bot-success.yml` (auto-closes stale `ci,automated` issues on a fully-green main run) and `ci-issue-bot-canary.yml` (`workflow_dispatch`-only synthetic-failure path for DRI inspection). Cross-workflow concurrency group `ci-issue-bot-${ref}` serializes create-pass against close-pass; pre-close staleness re-check defends the residual race. Runtime kill-switch via `vars.CI_ISSUE_BOT_ENABLED`. v1 close-rule is the coarse "no jobs skipped on green run" form; per-job matching deferred to v2 (footer schema is forward-compatible). Footer marker `<!-- ci-failure-bot failed-jobs: [...] schema: 1 -->` is informational + machine-readable.

Capability spec: `openspec/specs/ci-failure-bot` (added). No package version-bumps; the change is repo tooling.
