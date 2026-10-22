> Completed: 2026-10-20

# Proposal: agent guardrails enforced by hooks

## Why

The agent rules in `CLAUDE.md` and `AGENTS.md` were prose. Prose gates lose: an
agent under pressure to make a red check go green will publish, push to `main`
or loosen a setting, and nothing stops it. Three gates were approved on
2026-10-20. Each one is enforced by a hook, not by an instruction.

- A short list of actions an agent never takes on its own. It diagnoses,
  escalates, and Pablo runs the command with `!`.
- No code writes without a human turn in the session.
- No turn ends with red tests related to what it changed.

The design avoids three failure modes found in earlier gates:

- skipping the whole check on the second Stop (`stop_hook_active`);
- trusting a state file that the model can write inside the repository;
- treating a timeout as a pass, silently.

## What Changes

- `.claude/hooks/never-auto-remediate.cjs` is a PreToolUse hook on Bash. It
  covers seven classes derived from what Kaiord actually ships:
  - npm, through `release.yml` and changesets;
  - release tags and GitHub releases;
  - kaiord.com, through `deploy-site.yml` on push to `main`;
  - the Chrome Web Store, through `cws-api.mjs`;
  - force-push;
  - repository settings, rules and secrets;
  - a real athlete's Garmin Connect account.

  `permissions.deny` repeats the commonest prefixes and denies the
  `kaiord_garmin_push` MCP tool.

- `.claude/hooks/record-human-approval.cjs` (UserPromptSubmit) and
  `.claude/hooks/plan-approval-guard.cjs` (PreToolUse on
  Edit|Write|MultiEdit|NotebookEdit) implement the human-approval receipt:
  - Location: `$TMPDIR/claude-guards/approvals/<session_id>.json`.
  - Lifetime: 12 h.
  - Shared with the Deepgent guard.
- `.claude/hooks/related-tests-stop.cjs` (Stop and SubagentStop):
  - Runs `vitest related` or the co-located node suites under hostguard, within
    a 180 s budget.
  - Blocks when they are red.
  - On a timeout or exit 75, warns and lets the turn close.
  - Caps blocks at 3 per session, in a counter kept outside the repo.
- `.claude/hooks/guard-common.cjs` holds the shared state paths and the git
  environment hygiene.
- Documentation: `CLAUDE.md` ("Never auto-remediate"), `AGENTS.md`,
  `scripts/README.md` and `.claude/README.md`.

## Hook semantics this relies on

These were measured on Claude Code 2.1.304, not assumed:

- PreToolUse inside a subagent, foreground or background, carries the parent's
  `session_id`, plus `agent_id` and `agent_type`.
- UserPromptSubmit fires for `<task-notification>` and for
  `<cross-session-message>` deliveries.
- Commands typed with `!` run without PreToolUse hooks or permission rules, and
  without firing UserPromptSubmit.

## Impact

- Affected specs: `agent-guardrails`, a new capability.
- Affected code: `.claude/settings.json` and `.claude/hooks/`. No package
  source, no public API, no changeset.
- Known gaps, which these guards do not cover:
  - Receipt and counter files can be forged by anything that can write
    `$TMPDIR`.
  - A file written by Bash is not an Edit.
  - Commands built at run time are invisible to the parser.
  - A `/loop` firing reads as a human prompt.
  - `gh run rerun` of a deploy run cannot be told apart from a CI rerun.
  - Weakening a security workflow by editing it is prose-only.
