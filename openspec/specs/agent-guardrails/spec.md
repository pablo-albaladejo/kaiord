> Synced: 2026-10-20 (agent-guardrails)

# Agent Guardrails

## Purpose

Gates on what a Claude Code agent may do in this repository, enforced by hooks in
`.claude/settings.json` rather than written as advice. An agent never takes, on
its own, an action that reaches people outside the repository. It does not write
code without a human turn in the session. It does not end a turn while the tests
related to its changes are red. Each gate is a tripwire against drift, not a
security boundary, and the spec says where each one stops.

## Requirements

### Requirement: Never auto-remediate

An agent SHALL NOT run, on its own, a command in any of these classes:

- `npm-publish`: npm publishing and npm registry metadata.
- `release-tags`: release tags, GitHub releases, and deleting `main` or `changeset-release/*`.
- `prod-deploy`: a push to `main`, triggering a release, deploy or CWS workflow, and a Chrome Web Store upload or publish.
- `force-push`.
- `repo-settings`: repository settings, rules, secrets, variables and deploy keys, and `gh pr merge --admin`.
- `security-workflows`: disabling or enabling a workflow.
- `athlete-data`: writing to a real athlete's account (`kaiord garmin push`, the `kaiord_garmin_push` MCP tool).

The repository SHALL contain `.claude/hooks/never-auto-remediate.cjs`, with a co-located `*.test.mjs`. It SHALL be wired as a `PreToolUse` hook on `Bash`, with rule ID `R-NeverAutoRemediate`. It SHALL deny with `permissionDecision: "deny"`. The reason SHALL name the class and tell the agent to escalate to Pablo with the exact command.

The hook SHALL see the command through shell operators, `bash -c`, `$(...)`, environment assignments and common wrappers. A dry run (`--dry-run`) SHALL be allowed. Heredoc bodies that are not fed to a shell SHALL be treated as data.

`permissions.deny` SHALL also deny the `kaiord_garmin_push` MCP tool.

#### Scenario: A release command is denied

- **WHEN** an agent runs `cd packages/core && npm publish`, `git push origin main`, `git push --tags` or `gh secret set X`
- **THEN** the hook outputs a deny decision whose reason starts with `NEVER-AUTO-REMEDIATE [<class>]` and says to message Pablo

#### Scenario: Ordinary work is not denied

- **WHEN** an agent pushes a feature branch, runs a dry-run publish, or creates a PR whose heredoc body mentions `npm publish`
- **THEN** the hook prints nothing and exits 0

#### Scenario: Pablo runs the command himself

- **WHEN** Pablo types the command with the `!` prefix
- **THEN** it runs: commands typed with `!` skip hooks and permission rules

### Requirement: Code writes need a human approval receipt

The repository SHALL contain `.claude/hooks/record-human-approval.cjs`, wired as `UserPromptSubmit`. It SHALL write a receipt to `$TMPDIR/claude-guards/approvals/<session_id>.json`, shaped `{session_id, recorded_at, expires_at, source}` with a 12 h lifetime, only for a prompt a person typed.

A prompt that starts with `<task-notification`, `<cross-session-message` or `<teammate-message` SHALL NOT produce a receipt. The hook SHALL never block a prompt and SHALL never print to stdout.

The repository SHALL contain `.claude/hooks/plan-approval-guard.cjs`, wired as `PreToolUse` on `Edit|Write|MultiEdit|NotebookEdit`. It SHALL deny a write to any file in any worktree of this repository unless the session has a valid receipt. The deny message SHALL be `no human approval in this session: ask Pablo, or wait for his message`.

Writes to `.omc/**`, to `.claude/**` state, and to paths outside the repository SHALL be allowed without a receipt. `.claude/settings*.json` and `.claude/hooks/**` SHALL NOT count as state.

A subagent's tool call carries the parent's `session_id` and SHALL be judged by the parent's receipt. An agent-team teammate runs as its own process with its own `session_id`; its writes SHALL be judged by the lead's receipt, found as `--parent-session-id` in the hook's process ancestry. Paths inside the git common dir (`.git/hooks`, `.git/config`) SHALL count as repository paths. The path check SHALL be case-insensitive and SHALL follow a symlinked target. The rule ID is `R-PlanApprovalReceipt`.

#### Scenario: A write before any human prompt

- **GIVEN** a session with no receipt
- **WHEN** the agent edits `packages/core/src/index.ts`
- **THEN** the edit is denied with the agreed message

#### Scenario: A background report does not approve

- **WHEN** the only prompts in the session are `<task-notification>` or `<cross-session-message>` deliveries
- **THEN** no receipt is written and repository writes stay denied

#### Scenario: Approved session and its subagents

- **GIVEN** Pablo typed a prompt less than 12 h ago
- **WHEN** the agent, or a subagent it spawned, edits a repository file
- **THEN** the edit is allowed

### Requirement: A turn does not close on red related tests

The repository SHALL contain `.claude/hooks/related-tests-stop.cjs`, wired as `Stop` and `SubagentStop`. The rule ID is `R-RelatedTestsStop`.

The hook SHALL collect the changed files of the worktree at the input `cwd`: `git diff --name-only HEAD` plus untracked, non-ignored files. When none of them is test-relevant it SHALL exit 0. Otherwise it SHALL run only the related tests:

- `vitest related --run` per package that has a vitest config, or that package's full `vitest run` when a tracked code file in it was deleted;
- the co-located `*.test.mjs` for files under `scripts/`, `packages/*/scripts/` and `.claude/hooks/`.

The tests SHALL run under `~/.claude/hostguard/hg-gate.sh` when it exists, within a 180 s budget.

A `SubagentStop` whose transcript is readable and shows no `Edit`, `Write`, `MultiEdit` or `NotebookEdit` call SHALL NOT be checked: a read-only subagent cannot fix the tests.

Red tests SHALL block the turn with `decision: "block"` and a reason that names the failing tests. A timeout, hostguard exit 75, or a runner that cannot start SHALL let the turn close with a `systemMessage` warning and reset the count, and SHALL be logged to `$TMPDIR/claude-guards/guards.log`.

The hook SHALL NOT skip because `stop_hook_active` is set. Consecutive blocks SHALL be capped at 3 per session and agent, counted in `$TMPDIR/claude-guards/<session_id>.json` outside the repository. The red Stop after the third block SHALL be let through with a loud message, and the count reset.

A green run SHALL record the tree's fingerprint, so an unchanged tree is not re-run. A red run SHALL record its fingerprint and failures, so the next block on an unchanged tree reuses them. Each slot is keyed `main` or `agent:<agent_id>`, in the format shared with the Deepgent guard.

#### Scenario: Red related test

- **GIVEN** a change to `packages/core/src/domain/type-guards.ts` that breaks its tests
- **WHEN** the agent ends its turn
- **THEN** the Stop is blocked, and the reason lists `src/domain/type-guards.test.ts > …` and the command to re-run

#### Scenario: Block cap

- **WHEN** the related tests are still red on the fourth consecutive Stop of a session
- **THEN** the turn closes with a `systemMessage` saying the work is NOT green, and the count resets to 0

#### Scenario: Not verified is not red

- **WHEN** the run exceeds 180 s or hostguard exits 75
- **THEN** the turn closes with a `NOT VERIFIED` warning naming the commands to run

### Requirement: Guard limits are documented

`CLAUDE.md` SHALL list the never-auto-remediate classes and the enforcing hooks. It SHALL also state each guard's known limits:

- a local receipt or counter file can be forged by anything that can write it;
- a Bash file write is not an Edit;
- a command assembled at run time is invisible to the parser;
- a `/loop` firing reads as a human prompt.

#### Scenario: A reader looks for what is not covered

- **WHEN** a contributor reads `CLAUDE.md`, "Never auto-remediate"
- **THEN** the limits above are listed next to the hooks that have them
