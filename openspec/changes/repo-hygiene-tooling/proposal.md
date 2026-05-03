## Why

Two distinct backlog-debt mechanics are leaking simultaneously:

1. **CI failure bot creates zombies.** `.github/workflows/ci.yml:824` opens a fresh issue on every red main run, with no dedupe and no auto-close. The repo currently carries 3 such issues (#438, #440, #442) for failures that have since been fixed by subsequent merges — main has been green since 2026-05-02 16:32. Without a fix, the next 3 red builds add 3 more zombies. The bot's failure mode is silent issue debt that contaminates the open-issue list and dilutes the `priority-high` label.

2. **Archive operations spawn unmarked follow-up debt.** Three OpenSpec changes archived in the last 48h (`2026-05-01-calendar-coaching-redesign`, `2026-05-02-calendar-coaching-redesign-completion`, `2026-05-02-fix-coaching-dialog-rules-of-hooks`) collectively spawned 9 deferred follow-up issues (#431–#435, #450, #451, #454, #460), with no machine-readable signal at archive time that the change was overscoped. Today's 9-issue backlog is the visible symptom; the underlying mechanic — "archive ships with N tasks deferred to issues" — has no guard. Per the project's `feedback_mechanical_over_ai` rule, this kind of deterministic invariant must be enforced by a lint rule, not by reviewer attention.

The 9 deferred follow-ups themselves are operationally drained via a separate **GitHub tracking issue** (out of OpenSpec scope per the architectural finding that 9 unrelated fixes are not a coherent capability delta). This change introduces only the **tooling deltas** that prevent the mechanics from recurring.

## What Changes

### Phase 1 (PR-1) — CI failure issue bot rework

- Extract bot logic from inline `actions/github-script` YAML into `scripts/ci-failure-issue.mjs` with co-located `*.test.mjs` covering 11 branches (create, dedupe-comment, close-on-match, skip-on-job-mismatch, missing-footer, malformed-footer, race-closed, unknown-schema, absent-schema-back-compat, in-process dedupe, no-op-on-no-issue).
- New `notify-success` workflow listener (`workflow_run` event) closes open `ci,automated` issues when main goes green AND the green run covered every job in the issue's footer marker. Missing or malformed footers default to NOT-close.
- Both `notify-failure` and `notify-success` jobs share concurrency group `ci-issue-bot-${{ github.ref }}` (`cancel-in-progress: false`) so the create-pass and close-pass serialize across workflows. Pre-close staleness re-check via Octokit re-fetch defends against the residual TOCTOU race.
- Runtime kill-switch via repo variable: both jobs gated by `if: vars.CI_ISSUE_BOT_ENABLED != 'false'`. DRI flips the variable in <60s without a revert PR.
- Footer marker (`<!-- ci-failure-bot failed-jobs: [...] schema: 1 -->`) is the contract that distinguishes "this issue's failure was fully covered by the green run" from "the green run skipped a job — leave it open."
- Canary path: first natural red-main after merge OR a dedicated `ci-issue-bot-canary.yml` workflow triggered via `workflow_dispatch` that runs the bot with `--canary` after 7 days of green main. The canary issue stays open (synthetic `canary-job` name never matches a real green run) until DRI manually closes it.

### Phase 2 (PR-2) — Archive-followups marker + lint guard

- Define a canonical `> Deferred to: #N` marker in `openspec/SPEC_TEMPLATE.md`. Same Markdown blockquote family as the existing `> Completed: YYYY-MM-DD` marker — a single grep handles both.
- New `scripts/check-archive-followups.mjs` (mirrors `scripts/check-archive-dates.mjs` exactly: same `pathToFileURL` entry-point check, same exported function shape, same violation-collection-then-exit pattern). Co-located `*.test.mjs` covers zero / 4 / 5 deferrals → silent / log / fail.
- Sibling `pnpm lint:archive-followups` script in `package.json`, mirroring the existing `lint:archive` / `lint:archive-index` one-script-per-check convention. Wired into husky `pre-commit` and the umbrella `pnpm lint`.
- Threshold v1: fail at ≥ 5 deferrals per archive. Encodes the invariant "deferrals MUST NOT exceed shipped tasks" as an absolute cap (the deferral-ratio version requires `tasks.md` to grow a machine-readable shape; that shape is the architectural prerequisite, filed as a follow-up at PR-2 ship-time). Sunset trigger: replace cap with ratio when (a) a 3rd archive trips the cap OR (b) machine-readable shape ships.
- Backfill the 3 historical archives that spawned today's 9-issue backlog (5 / 1 / 3 markers respectively). After backfill, the v1 cap trips on `2026-05-01-calendar-coaching-redesign`, providing the first real fail signal. Backfill is permitted because markers are inert annotations — they reference existing issues, do not modify behavior, and do not touch the `> Completed:` invariant.

### Out of scope

- The 9-issue drain (operational Phase 2 of the plan) is tracked on a separate GitHub tracking issue, not bundled here. Drain PRs are independent; some will carry their own small OpenSpec changes if they alter spec'd behavior, most won't.
- Closing the 3 zombie issues (#438/#440/#442) is a one-time `gh issue close` action documented as Phase 0 preflight in tasks.md; no code or spec impact.

## Capabilities

### New Capabilities

- `ci-failure-bot`: scoped to the GitHub-issue automation that observes red and green main runs. Owns the footer-marker contract, the cross-workflow concurrency-and-staleness-reentry semantics, the kill-switch surface, and the canary obligation.
- `archive-followups-guard`: scoped to the OpenSpec archive-time invariant that a change MUST NOT defer more tasks than it ships. Owns the canonical `> Deferred to: #N` marker grammar and the lint rule that enforces the threshold.

### Modified Capabilities

None. Both deltas land as new capabilities. The existing `ci-release` capability is untouched (this change does not modify the release pipeline). The existing `doc-drift-prevention` capability is untouched (the new `archive-followups-guard` capability is about overscope detection at archive time, not doc/code drift).

## Impact

- **Affected packages**: none of `packages/**`. Both deltas live at the repo root: `.github/workflows/ci.yml` (modified), `.github/workflows/ci-issue-bot-success.yml` and `.github/workflows/ci-issue-bot-canary.yml` (new), `scripts/ci-failure-issue.{mjs,test.mjs}` and `scripts/check-archive-followups.{mjs,test.mjs}` (new), `openspec/SPEC_TEMPLATE.md` (modified for marker grammar), `package.json` (one new `lint:archive-followups` sibling, appended to the umbrella `lint` chain).
- **Affected layers (hexagonal)**: none. This change is repo-tooling and governance, not application code. No domain types, ports, or adapters move. Pre-flight confirmed against the per-issue file-scope table in `design.md` D1.
- **Public API**: no breaking changes. Both deltas are internal to the repo's CI/governance surface.
- **Persistence migration**: none.
- **Dependencies**: no new runtime or dev dependencies. `scripts/ci-failure-issue.mjs` uses the GitHub-Actions-provided Octokit; tests mock the boundary. `scripts/check-archive-followups.mjs` is a pure-Node script in the same shape as existing `scripts/check-archive-*.mjs`.
- **Quality gates**: zero new ESLint/TypeScript warnings; both new scripts ship with co-located node:test suites wired into `pnpm test:scripts`. The new lint trips on first run after backfill — that is intended signal, not a CI break (the backfill PR adjusts to keep main green during landing).
- **Risk surface**: the bot rewrite touches a workflow that runs on main; a regression could either (a) suppress real CI failures or (b) close issues prematurely. Mitigation is the kill-switch + 11-test coverage + canary path documented in `design.md` D3.
