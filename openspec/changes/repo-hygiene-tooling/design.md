## Context

Two debt mechanics leaking into the open-issue list, surfaced by today's triage of 12 open issues:

- The CI-failure issue bot at `.github/workflows/ci.yml:824-922` creates an issue on every red main run with no dedupe and no auto-close. Three zombies (#438, #440, #442) remain open while main is green. The leak rate is "1 zombie per red main, until manually closed."
- The OpenSpec archive workflow has no guard against overscoped changes. Three archives in 48h spawned 9 deferred follow-up issues; none of those deferrals were visible at archive time. The mechanic produces silent debt that surfaces only when the open-issue list is triaged manually.

The 9-issue operational drain runs on a separate GitHub tracking issue per the architectural finding that bundling 9 unrelated fixes into a single OpenSpec change recreates the overscope antipattern. This change carries only the **tooling deltas** that prevent recurrence.

This change is phased: Phase 1 ships the bot rework (high-value, immediate stops the leak) before Phase 2 ships the archive-followups guard (medium-value, prevents the next archive from spawning silent debt). The phases are independently reviewable, independently revertable, and have no cross-phase dependency at the code level — they touch disjoint files (`scripts/ci-failure-issue.*` and `.github/workflows/ci.yml` for Phase 1; `scripts/check-archive-followups.*`, `openspec/SPEC_TEMPLATE.md`, `package.json`, and `openspec/changes/archive/**/tasks.md` for Phase 2).

## Goals / Non-Goals

**Goals:**

- Stop the CI-failure-bot leak: no more zombie issues on transient red main builds; auto-close on green when (and only when) the green run covered the originally-failed jobs.
- Add a mechanical archive-time guard so a future overscoped change is caught before it ships.
- Honor the project's `feedback_mechanical_over_ai` rule: deterministic invariants are enforced by lint rules with co-located tests, not by reviewer attention.
- Keep both phases small enough to ship and revert independently. Phase 1 is one PR; Phase 2 is one PR.

**Non-Goals:**

- Drain the 9 deferred follow-ups. That work is operational, runs on a separate tracking issue, and produces independent PRs (some with their own small OpenSpec changes).
- Promote the archived `spa-session-match` and `spa-user-preferences` deltas into `openspec/specs/`. That is `/opsx-sync` work tracked as #460.
- Replace the absolute-cap threshold with a deferral-ratio invariant. Ratio requires `tasks.md` to gain a machine-readable shape — filed as a separate follow-up at Phase 2 ship-time.
- Add a stale-issue policy for `ci,automated` issues that have been open for >30 days because the failure was real and never fixed. The auto-close-on-green rule is sufficient: when main goes green for those jobs, the issue closes; until then, it correctly stays open.

## Decisions

### D1 — Two capabilities, not one

**Decision:** introduce `ci-failure-bot` and `archive-followups-guard` as two separate capabilities.

**Rationale:**

- The two deltas have different ownership surfaces. `ci-failure-bot` is GitHub Actions / Octokit / repo-variables. `archive-followups-guard` is OpenSpec markers / lint scripts / archive backfills. A future contributor reading the specs benefits from the separation.
- The two phases ship in different PRs and are reverted independently. One capability per PR keeps the spec history coherent.
- Neither delta extends an existing capability. `ci-release` is about npm publishing; `doc-drift-prevention` is about doc-vs-code parity. Folding either delta into one of those would dilute the existing capability's purpose.

**Trade-off:** two new capability files instead of one. Acceptable — the project already carries 30 capabilities at granular scope (per `openspec/specs/` listing), so splitting by ownership matches precedent.

### D2 — Footer marker is a JSON-bearing HTML comment with explicit schema versioning

**Decision:** the bot embeds a footer in created issue bodies in this exact shape:

```
<!-- ci-failure-bot
     failed-jobs: ["lint","test"]
     schema: 1
-->
```

`failed-jobs` is a required JSON array of strings. `schema` is an optional integer; absence is treated as `schema: 1` (back-compat for v1 issues created without the field). Unknown schemas log `skipped: unknown-schema` and do NOT close.

**Rationale:**

- HTML comments are invisible in rendered issue bodies but trivially parsed by a regex that matches `<!-- ci-failure-bot ... -->`.
- JSON-in-comment is a sub-grammar that survives Markdown normalization.
- Explicit `schema` versioning locks the upgrade contract: a future schema 2 (e.g., one that records run-attempt count or `commit-range`) is parsed by future-bot and ignored by current-bot rather than silently misinterpreted.
- Missing-footer and malformed-footer paths default to NOT-close. This is the safe-by-default behavior expected of release-grade automation: the cost of a false-positive close (issue silently disappears, regression goes undetected) far exceeds the cost of a false-negative close (DRI manually closes a stale issue once).
- v1 footer is **informational + forward-compatible**, not load-bearing for the close-decision. v1's close-rule is the coarser "fully-green run" rule documented in D2b; v2 may refine to per-job matching once a stable identifier scheme exists. This keeps v1's implementation cost bounded (no need to map workflow_run jobs API display names back to matrix-aware identifiers) while preserving the data needed for v2.

**Trade-off:** one more contract to maintain. Mitigated by the 17-test coverage that exercises every parse-failure mode.

### D2b — v1 close-rule: fully-green run, not per-job match

**Decision:** v1 of the bot closes open `ci,automated` issues only when the workflow_run that triggered it executed every CI job (zero jobs with `conclusion == "skipped"`). The success workflow detects skipped jobs via `gh api repos/.../actions/runs/{run_id}/jobs --jq '[.jobs[] | select(.conclusion == "skipped")] | length'` and passes a single `anyJobsSkipped` boolean to the script.

**Rationale:**

- The workflow_run jobs API returns each job's **display name** (e.g., `"Link checker"` for the `check-links` job, `"test (workout-spa-editor, 22.x)"` for matrix variants of the `test` job), not the YAML job-id. The failure listener's `notify-failure` step aggregates from `needs.*.result` keys (the job-ids), producing a different vocabulary.
- Reconciling these vocabularies requires either (a) per-repo mapping tables that contributors must maintain when adding a job, (b) removing display-name overrides (which break branch protection — `Link checker` is a required status check name in this repo's branch protection ruleset), or (c) parsing matrix suffixes heuristically. None of these is robust enough to be a v1 invariant.
- A coarser "no skips → close" rule sidesteps the vocabulary problem. False-positive closes are still impossible: a fully-green run with zero skips is a strong signal that whatever was failing has been fixed.
- False-negatives (path-filtered greens leaving real-fix issues open) are tolerable. The next all-jobs-ran green run resolves them; in the meantime the issue is harmless.

**Trade-off:** path-filtered greens delay auto-close. Acceptable — the bot is automation, not a real-time monitor; manual close by the DRI is always available.

### D2c — Canary issues survive green runs by design

**Decision:** the canary path emits a footer with the synthetic identifier `"canary-job"` in `failed-jobs`. The close-pass treats any issue whose footer contains this token as `skipped: canary-issue`, regardless of how green the run was.

**Rationale:**

- The canary issue is created specifically for DRI inspection. Auto-closing it after the very next green run defeats its purpose.
- Using a sentinel value in the existing footer (rather than a separate field) keeps the schema small and forward-compatible.
- The `canary` label is already added on creation for visual distinction; the `"canary-job"` token is the machine-readable counterpart.

**Trade-off:** sentinel values in `failed-jobs` are slightly hacky. Mitigated by the value being clearly synthetic (`"canary-job"` is not a valid CI job-id in this repo) and tested directly.

### D3 — Cross-workflow concurrency + staleness re-check + kill-switch + canary

**Decision:** the bot's two production jobs (`notify-failure` in the CI workflow on red, `notify-success` as a `workflow_run` listener on green) share a concurrency group `ci-issue-bot-${{ github.ref }}` with `cancel-in-progress: false`. The close-pass performs a pre-close Octokit re-fetch (staleness re-check). All bot jobs (production and canary) are gated by `if: vars.CI_ISSUE_BOT_ENABLED != 'false'` (default-on, opt-out). The canary lives in a dedicated `ci-issue-bot-canary.yml` workflow triggered exclusively by `workflow_dispatch`, invoking the script with `--canary`; first post-merge canary is the first natural red-main, with the dedicated workflow as the 7-day fallback.

**Rationale:**

- Concurrency groups in GitHub Actions are honored across workflows when the group-name string is identical. Sharing the group serializes create-pass against close-pass even though they live in different workflow files. `cancel-in-progress: false` because we never want to cancel a close-pass mid-flight.
- The staleness re-check covers the residual race the concurrency group cannot solve (an external process — e.g., a maintainer manually closing the issue — between list and close). On race-detection, skip with `skipped: race-closed`.
- Repo-variable kill-switch is the GH-Actions-native disable mechanism. `vars.*` is preferred over `secrets.*` because flips are auditable in the repo's audit log; `secrets.*` flips are not.
- Canary fallback prevents the gate from being unbounded. Drain PRs run on PR branches, so main can stay green for the full drain window. Without a synthetic-failure path, "Phase 2 begins after canary" would block indefinitely.
- Canary as a **dedicated workflow file**, not a `workflow_dispatch` input on the success listener, is the cleaner shape: the success listener's trigger semantics (`workflow_run` of CI on main, conclusion=success) do not compose with a manual-input override without pretzel logic. A separate canary file is one more YAML but trivially scoped, distinguishable from production runs, and never accidentally fires.
- Canary uses the synthetic job name `canary-job` (which does not match any real CI job) precisely so the close-pass's "skipped: jobs not covered" branch keeps the canary issue open until the DRI manually closes it — exercising the create-pass for inspection without contaminating the close-pass behavior on real runs.

**Trade-off:** three workflow files instead of two (`ci.yml`, `ci-issue-bot-success.yml`, `ci-issue-bot-canary.yml`). Mitigated by the canary file being short, single-trigger, and rarely modified; extraction to `scripts/ci-failure-issue.mjs` keeps the actual logic in one tested place.

### D4 — Bot logic extracted to a tested script, not inline `actions/github-script`

**Decision:** the bot's create and close logic lives in `scripts/ci-failure-issue.mjs` with co-located `scripts/ci-failure-issue.test.mjs`. YAML invokes `node scripts/ci-failure-issue.mjs <create|close>` with environment passed via `env:` blocks. Tests mock the Octokit boundary and exercise 11 branches.

**Rationale:**

- Project convention (per `CLAUDE.md` "Repo scripts" section): every non-trivial script ships with a co-located node:test suite, run by `pnpm test:scripts` in the lint job and the husky pre-commit hook. Inline `actions/github-script` JS is functionally untestable.
- Extracting the logic also means the canary path (`--canary` flag) and the kill-switch can be exercised by tests, not only in production.
- Mirrors the precedent set by `scripts/check-archive-dates.mjs` and `scripts/check-archive-index.mjs`: small, focused script + co-located test + entry-point check via `pathToFileURL(process.argv[1]) === import.meta.url`.

**Trade-off:** YAML now shells out to Node instead of running JS inline. Acceptable — Node is already a CI prereq.

### D5 — `> Deferred to: #N` marker shape mirrors the existing `> Completed:` precedent

**Decision:** deferred items in `tasks.md` annotate as a top-level Markdown blockquote on the line immediately after the checkbox, in the form `> Deferred to: #ISSUE_NUMBER`. The hash-prefixed integer is the GitHub issue number; `#N` is the only valid form (no URLs, no descriptions).

**Rationale:**

- Same syntactic family as the existing `> Completed: YYYY-MM-DD` marker parsed by `check-archive-dates.mjs`. A single regex handles both: `^> (Completed|Deferred to): (.+)$`.
- Markdown blockquotes survive renderer normalization (GitHub UI, VS Code preview, OpenSpec validate).
- Hash-prefixed integer is the canonical GitHub-link shape. Reviewers click through; the lint script greps.

**Trade-off:** a strict shape. Acceptable — strictness is the point of a mechanical guard.

### D6 — Threshold v1 is an absolute cap of 5; sunset trigger is named

**Decision:** `check-archive-followups.mjs` fails at ≥ 5 `> Deferred to:` markers per archive folder. The threshold is replaced with a deferral-ratio invariant ("deferrals MUST NOT exceed shipped tasks") when EITHER (a) a 3rd archive trips the absolute cap OR (b) `tasks.md` gains a machine-readable shape that exposes completed-task counts.

**Rationale:**

- The semantically correct invariant is "deferrals ≤ shipped tasks." Implementing it requires counting shipped tasks, which requires `tasks.md` to grow a machine-readable shape (today it's only Markdown checkboxes — `[x]` vs `[ ]` — which is trivially countable but conflates "completed" with "in scope").
- The absolute cap of 5 is a v1 proxy: practical, calibrated to real data (the calendar-redesign archive has 5 markers post-backfill), and trips on the worst offender providing immediate signal. False-positives on a future 30-shipped-5-deferred archive are tolerable for a few months.
- Naming the sunset trigger prevents the v1 cap from ossifying. The trigger is binary and observable: either a third archive trips it (signal-vs-noise concern materializes), or the architectural prerequisite (machine-readable `tasks.md`) ships (which makes the ratio version cheap).

**Trade-off:** known false-positive risk. Acceptable — the v2 path is named and budgeted.

### D7 — Archive backfill is permitted because markers are inert annotations

**Decision:** Phase 2 backfills `> Deferred to: #N` markers into the 3 archives that spawned today's 9-issue backlog (`2026-05-01-calendar-coaching-redesign` → 5 markers, `2026-05-02-calendar-coaching-redesign-completion` → 1, `2026-05-02-fix-coaching-dialog-rules-of-hooks` → 3). The backfill is committed as part of Phase 2's PR.

**Rationale:**

- The "archived = frozen" intuition correctly applies to *historical content* — the change's completed scope, decisions, and outcomes. It does NOT apply to *retroactive cross-references* — annotations that point to issues already created and known. Adding `> Deferred to: #432` next to an already-checked task is annotating, not rewriting.
- The `> Completed: YYYY-MM-DD` invariant enforced by `check-archive-dates.mjs` remains untouched. The `archive/README.md` index is regenerated mechanically by `pnpm archive:index` regardless of markers.
- The backfill provides a real first-fail signal: post-backfill, `pnpm lint:archive-followups` fails on the calendar-redesign archive, and the threshold-tuning PR confirms the ≥5 cap is correctly calibrated.

**Trade-off:** a tasks.md history contributor might object to "edits on archived files." Mitigated by the rationale above and by limiting the backfill diff to only marker lines (no text edits, no checkbox flips).

### D8 — Two phases, two PRs, ordered for risk reduction

**Decision:** Phase 1 ships in PR-1; Phase 2 ships in PR-2. PR-2 is opened only after PR-1 has merged AND its canary inspection has succeeded.

**Rationale:**

- PR-1 stops an active leak (the bot is creating zombies today). PR-2 prevents a future leak. Risk-prioritizing PR-1 is correct.
- Phase 1's CI surface is genuinely risky: a regression suppresses real CI failures or closes issues prematurely. Sequencing the canary inspection before Phase 2 means Phase 2's PR is reviewed against a known-good Phase 1 baseline, not concurrently with bot validation.
- The two phases touch disjoint files. There is no code-level dependency forcing one to land before the other.

**Trade-off:** Phase 2 waits up to 7 days for the canary fallback to fire. Acceptable — Phase 2 is medium-priority and the wait gives Phase 1 production validation time.

### D9 — `pnpm lint:archive-followups` is a sibling script, not composite

**Decision:** Phase 2 adds `lint:archive-followups` to `package.json` as a sibling of `lint:archive` and `lint:archive-index`. The umbrella `pnpm lint` runs all three (and the rest of the lint matrix). The husky pre-commit hook chain runs `lint:archive-followups` directly.

**Rationale:**

- Existing convention in `package.json`: each archive-related lint is its own script. Composing them into one `pnpm lint:archive-all` would diverge from precedent and obscure CI failure messages (which currently identify the failing sibling script directly).
- Sibling shape matches the architectural mirror of `check-archive-dates.mjs` exactly: same shape of script, same shape of script-name in `package.json`, same shape of CI wiring.

**Trade-off:** one more `lint:*` line. Minor.

## Risks

- **R1 — Bot regression suppresses real CI failures.** Phase 1's `notify-failure` rewrite could fail to create an issue when one is needed (e.g., a logic bug in the dedupe branch incorrectly matches an unrelated issue). Mitigation: 11-test coverage exercises every parse-and-decision branch with mocked Octokit; runtime kill-switch flips the bot off in <60s without a revert PR; canary path validates the create-path against a known-failing synthetic build before Phase 2 begins.
- **R2 — Bot regression closes issues prematurely.** `notify-success` could close an issue whose original failure is still uncorrected (e.g., the green run skipped a job via path filter). Mitigation: footer marker + job-set-match logic explicitly skips on partial-coverage; missing-footer and malformed-footer paths default to NOT-close; pre-close staleness re-check catches concurrent external close.
- **R3 — Concurrency group does not span workflows as expected.** GitHub Actions concurrency-group cross-workflow semantics are documented but easy to misread. Mitigation: D3's pre-close staleness re-check is a belt-and-suspenders defense; even if the group does not serialize across workflows, the staleness re-check catches the resulting race. Tests 6 and 9 cover both the in-process dedupe (no Actions concurrency required) and the staleness path.
- **R4 — Backfilled markers cause `pnpm lint:archive-followups` to fail on first run.** Intended signal, but if the threshold-tuning PR's CI fails before the lint script ships, the dev experience is confusing. Mitigation: Phase 2's tasks file lands the script, the backfill, and the threshold tuning in the same PR; CI sees a coherent state at all times. There is no intermediate "script lands but backfill doesn't" point.
- **R5 — `vars.CI_ISSUE_BOT_ENABLED` set to `'false'` is silent.** A future maintainer flipping the variable to disable the bot leaves no obvious trail in workflow logs. Mitigation: both jobs log "ci-failure-bot disabled via vars.CI_ISSUE_BOT_ENABLED" as their first step (a no-op `echo` step that always runs, conditioned on the variable). The kill-switch is loud, not silent.
- **R6 — Threshold v1 absolute cap produces false-positives on a future big-but-healthy change.** A 30-shipped-5-deferred archive (16% deferral ratio, healthy) would trip the v1 cap. Mitigation: D6's named sunset trigger replaces the cap with the ratio invariant the moment one of two conditions hits. Until then, false-positives are tolerable and resolved by the threshold-tuning PR re-baselining.
- **R7 — Hexagonal-arch boundaries.** Confirmed: this change touches `scripts/`, `.github/workflows/`, `openspec/`, and `package.json`. Zero changes under `packages/`. No domain types, ports, or adapters move. No layer boundary is crossed.

## Migration

- **Phase 1.** No data migration. The existing inline `actions/github-script` step is replaced by a `node scripts/ci-failure-issue.mjs create` invocation in the same `notify-failure` job. The new `notify-success` job is added as a separate workflow file (`.github/workflows/ci-issue-bot-success.yml`) listening to `workflow_run` of the CI workflow. Old open issues (#438, #440, #442) carry no footer marker — the missing-footer path keeps them open until DRI closes them manually as Phase 0 preflight.

- **Phase 2.** Backfill `> Deferred to: #N` markers in 3 archived `tasks.md` files. No data migration. The new `pnpm lint:archive-followups` runs against the backfilled state; the threshold is set to ≥5 and the calendar-redesign archive trips immediately. The same PR introduces the threshold-tuning rationale and the sunset trigger; if the v1 cap is later refined, that refinement is a separate PR with its own changeset note.

## Open Questions

- **Q1.** Should the `notify-success` listener also act on `workflow_run` events from non-main branches (e.g., release branches)? **A1.** No. The footer-marker contract assumes "ci,automated" issues are filed against main. Release-branch failures should file against their own labels (e.g., `ci,automated,release`); that's a separate contract not in scope here.
- **Q2.** Should the bot annotate its created issues with the GitHub run-attempt number (so reruns of the same SHA don't appear as separate failures in the comment thread)? **A2.** Out of scope for v1. If reruns prove noisy in practice, schema 2 of the footer can record run-attempt and the comment-vs-create logic can deduplicate by attempt.
- **Q3.** Should `archive-followups-guard` also count `> Deferred to:` markers in non-archived (active) `openspec/changes/<slug>/tasks.md`? **A3.** No. The invariant is about archive-time scope discipline. An active change with 7 deferral markers is just an in-progress plan; only when it archives does the count crystallize.
