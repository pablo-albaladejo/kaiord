---
title: "How Kaiord is built"
description: "How AI agents build Kaiord, what a person does, and the git commands that check it against the public history."
figures_at: b9b38f824
---

# How Kaiord is built

The landing page says:

Every line — domain, adapters, editor, this page — written by AI agents.

This page is what that sentence rests on: how the agents work, what a person does, and the commands that check it against the public history.

## What the history supports

Git records commits, not who typed each line, so the history cannot prove "every line". What it shows is narrower. Since 2026-02-01, 1067 of the 1205 commits not made by a bot carry an AI agent co-author trailer. Before that date no commit carries one, and the repository was set up for an AI coding assistant, Kiro. The figures, the commands behind them and their limits follow.

## The owner's statement

This section is a declaration by the repository's owner, not a figure: git cannot check it. On 2026-11-23 the owner stated:

> Every commit in this repository, apart from the automation commits made by bots, was written by an AI agent. Before February 2026 the agent was Kiro, which left no co-author trailer.

What the history shows beside it:

- 197 commits before 2026-02-01 touch the Kiro setup in `.kiro/`.
- 201 commits are made by bots and are counted apart: they are automation, not the agents' work. 127 are dependency updates from Dependabot, 28 come from the release bot and 46 from GitHub Actions workflows, such as version releases and weekly SEO snapshots.

## How agents build it

- Work starts as an OpenSpec change in `openspec/changes/`: a proposal, spec deltas and a task list. When the work ships, the change is archived under `openspec/changes/archive/`.
- An agent works on its own branch and git worktree, writes the code and its tests, and opens a pull request.
- Guards hold the line. The commit hook runs lint, formatting, the test-structure checks and the `scripts/` guard suite; the push hook runs the full `pnpm lint`; CI runs lint, type checks, tests, builds, the round-trip checks and the site guards on pull requests.
- A version-worthy change carries a changeset, and a pull request that changes a published package without one fails the "Check for Changeset" job. The release workflow turns changesets into versions.
- Reviews are done by agents, against `REVIEW.md`, and by an automated reviewer configured in `.coderabbit.yaml`.
- Agents merge pull requests once the checks are green; the nightly maintenance watchers listed in `AGENTS.md` do it unattended.
- Hooks in `.claude/settings.json` stop an agent from publishing to npm by hand, tagging a release, pushing straight to `main`, starting a deploy, force-pushing, changing repository settings or secrets, or writing to a real athlete's account.

## What a person does

- Makes the decisions. An agent cannot edit a file in the repository until a person has typed a prompt in its session (`.claude/hooks/plan-approval-guard.cjs`).
- Runs, by hand, the actions agents are denied when one is needed, such as a release tag or a change to repository settings (`CLAUDE.md`, "Never auto-remediate").
- Holds the secrets. Setting or deleting a repository secret is one of the denied actions.
- Tests with real accounts. A run against a real Platform account is made by a person; a change that needs one says so in its tasks, as `openspec/changes/add-garmin-calendar-scheduling/manual-e2e.md` does.
- Works the store dashboards. The Chrome Web Store listing texts and privacy forms are entered by hand, from each extension's `store-listing.md`.

## Check it yourself

Clone the repository with its full history (`git clone https://github.com/pablo-albaladejo/kaiord.git`; a shallow clone needs `git fetch --unshallow`) and run each command from its root. Every command names commit `b9b38f824`, the tip of `main` when the figures were computed on 2026-11-22, so its answer does not change as the history grows. `pnpm lint:method-figures` reruns them all and fails if a number on this page differs from its command's answer.

On 2026-11-22 the history was rewritten to correct author metadata. Every commit hash changed; no file content did. A hash quoted before that date, in an issue or a pull request, does not resolve here: find the commit by its subject or pull-request number.

## The figures

| Figure                                                              | Value | Command                                                                                                                                                                       |
| ------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Commits in the history                                              | 1800  | `git rev-list --count b9b38f824`                                                                                                                                              |
| Commits with an AI agent co-author trailer                          | 1076  | `git log b9b38f824 --format='%(trailers:key=Co-authored-by,valueonly,separator=%x2C)' \| grep -c Claude`                                                                      |
| Commits with no agent trailer                                       | 724   | `git log b9b38f824 --format='%(trailers:key=Co-authored-by,valueonly,separator=%x2C)' \| grep -c -v Claude`                                                                   |
| Commits made by a bot                                               | 201   | `git log b9b38f824 --format=%an \| grep -c '\[bot\]$'`                                                                                                                        |
| Commits made by Dependabot                                          | 127   | `git log b9b38f824 --format=%an \| grep -c '^dependabot\[bot\]$'`                                                                                                             |
| Commits made by the release bot                                     | 28    | `git log b9b38f824 --format=%an \| grep -c '^kaiord-release-bot\[bot\]$'`                                                                                                     |
| Commits made by GitHub Actions workflows                            | 46    | `git log b9b38f824 --format=%an \| grep -c '^github-actions\[bot\]$'`                                                                                                         |
| Commits made by a bot, with no agent trailer                        | 192   | `git log b9b38f824 --format='%an\|%(trailers:key=Co-authored-by,valueonly,separator=%x2C)' \| grep -v Claude \| grep -c '\[bot\]\|'`                                          |
| Commits not made by a bot, before 2026-02-01, with no agent trailer | 394   | `git log b9b38f824 --until=2026-02-01T00:00:00Z --format='%an\|%(trailers:key=Co-authored-by,valueonly,separator=%x2C)' \| grep -v Claude \| grep -c -v '\[bot\]\|'`          |
| Commits before 2026-02-01 that touch the Kiro setup in `.kiro/`     | 197   | `git log b9b38f824 --until=2026-02-01T00:00:00Z --format=%h -- .kiro \| wc -l`                                                                                                |
| Commits not made by a bot, since 2026-02-01                         | 1205  | `git log b9b38f824 --since=2026-02-01T00:00:00Z --format=%an \| grep -c -v '\[bot\]$'`                                                                                        |
| Commits not made by a bot, since 2026-02-01, with an agent trailer  | 1067  | `git log b9b38f824 --since=2026-02-01T00:00:00Z --format='%an\|%(trailers:key=Co-authored-by,valueonly,separator=%x2C)' \| grep Claude \| grep -c -v '\[bot\]\|'`             |
| Commits not made by a bot, since 2026-02-01, with no agent trailer  | 138   | `git log b9b38f824 --since=2026-02-01T00:00:00Z --format='%an\|%(trailers:key=Co-authored-by,valueonly,separator=%x2C)' \| grep -v Claude \| grep -c -v '\[bot\]\|'`          |
| Of those, merge commits                                             | 29    | `git log b9b38f824 --merges --since=2026-02-01T00:00:00Z --format='%an\|%(trailers:key=Co-authored-by,valueonly,separator=%x2C)' \| grep -v Claude \| grep -c -v '\[bot\]\|'` |
| Commits from outside contributors                                   | 3     | `git log b9b38f824 --format=%an \| grep -v -e '\[bot\]$' -e '^Pablo Albaladejo$' \| wc -l`                                                                                    |
| Commits from outside contributors with an agent trailer             | 3     | `git log b9b38f824 --format='%an\|%(trailers:key=Co-authored-by,valueonly,separator=%x2C)' \| grep -v -e '\[bot\]\|' -e '^Pablo Albaladejo\|' \| grep -c Claude`              |
| Commits whose subject ends in a pull-request number                 | 1098  | `git log b9b38f824 --format=%s \| grep -c '(#[0-9][0-9]*)$'`                                                                                                                  |
| Archived OpenSpec changes                                           | 166   | `git ls-tree -d --name-only b9b38f824 openspec/changes/archive/ \| wc -l`                                                                                                     |

## What the figures do and do not show

- A co-author trailer is evidence, not proof. It is a line of text in the commit message: a person can add or delete it by hand, and a squash merge keeps it only if the merge message does.
- 724 commits carry no agent trailer. 192 are made by bots: dependency updates, release and workflow commits. 394 come from before 2026-02-01, when the repository held the Kiro setup in `.kiro/` and no tool wrote a trailer. The other 138 come after: 29 merge commits, and commits whose message carries no trailer, among them weekly SEO snapshots and nightly maintenance sweeps. The history does not say who wrote them.
- Outside contributions exist: 3 commits, each with an agent trailer.
- A subject ending in a pull-request number means the commit landed through a pull request. Git does not record who merged it.
- A commit count is not a line count: the figures say nothing about how many lines each commit changed.
