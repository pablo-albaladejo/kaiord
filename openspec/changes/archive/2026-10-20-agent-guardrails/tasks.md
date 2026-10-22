> Tasks: 6 completed, 0 deferred

# Tasks

- [x] 1. Verify the hook semantics, against the docs and empirically on Claude Code 2.1.304:
  - subagent `session_id`;
  - UserPromptSubmit for task notifications and cross-session messages;
  - `!` bypassing hooks and deny rules.
- [x] 2. Write `never-auto-remediate.cjs` and its suite:
  - each class denied, including through wrappers;
  - ordinary work, dry runs and heredoc data allowed;
  - exit 2 on unreadable input.
- [x] 3. Write `record-human-approval.cjs`, `plan-approval-guard.cjs` and their suites:
  - human vs machine prompts;
  - the receipt file and its 12 h TTL;
  - repo, linked-worktree, exempt and outside paths;
  - subagent inheritance;
  - an exported `GIT_DIR` ignored.
- [x] 4. Write `related-tests-stop.cjs` and its suite:
  - planning and failure parsing;
  - the block cap;
  - red, green, cached, untracked, timeout and hostguard exit 75, against throwaway repositories;
  - no skip on `stop_hook_active`.
- [x] 5. Wire `.claude/settings.json` (hooks plus `permissions.deny`). Record the deliberate red runs in the PR body.
- [x] 6. Document the hooks in `CLAUDE.md`, `AGENTS.md`, `scripts/README.md` and `.claude/README.md`. Add the `agent-guardrails` spec, then refresh the archive index and the specs inventory.
