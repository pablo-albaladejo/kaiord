# Autonomous Improvement System - Setup Guide

## Architecture

Everything runs **locally** on a dedicated Mac Mini with Claude Code (Max plan).
No Anthropic API key is needed in GitHub Actions.

```
MAC MINI (Claude Code Max plan)
  |
  [scripts/autonomous-loop.sh]
    1. Collect baseline metrics
    2. claude -p (headless) makes improvements
    3. Collect post-improvement metrics
    4. Compare: improved? → git push + gh pr create
  |
  v
GITHUB (no API key needed)
  |
  [ci.yml]          ← lint, typecheck, test, build, round-trip
  [metrics-gate.yml] ← quality gate (deterministic, no AI)
  [auto-merge.yml]   ← merge PRs with 'automerge' label
  [CodeRabbit]       ← free AI review (already installed)
```

## Prerequisites

### Local Machine

- macOS with Claude Code CLI installed (`claude` command)
- Claude Max plan (unlimited usage)
- `gh` CLI authenticated (`gh auth login`)
- `pnpm`, `node` >= 20, `git`
- Repository cloned: `git clone git@github.com:pablo-albaladejo/kaiord.git`

### GitHub Repository

1. **Enable auto-merge**: Settings > General > Pull Requests > Allow auto-merge
2. **Enable auto-delete branches**: Settings > General > Automatically delete head branches
3. **Branch protection on main**:
   - Required status checks: `lint`, `test`, `test-frontend`, `round-trip`, `typecheck`, `build`
   - Require branches to be up-to-date: Yes
   - Required approvals: 1
4. **Optional - BOT_PAT**: A fine-grained PAT from a bot account for autonomous PRs
   - Without it, autonomous PRs use your personal git credentials
   - With it, PRs come from a bot identity (cleaner attribution)

### Secrets (only needed for Phase 5 auto-approve)

| Secret         | Purpose                               | When Needed          |
| -------------- | ------------------------------------- | -------------------- |
| `BOT_PAT`      | Push branches from bot identity       | Phase 5 (optional)   |
| `APPROVER_PAT` | Auto-approve PRs (different identity) | Phase 5 (auto-merge) |

**No `ANTHROPIC_API_KEY` needed anywhere.**

## Usage

### Single improvement cycle

```bash
# Fix lint warnings
./scripts/autonomous-loop.sh lint --once

# Improve test coverage
./scripts/autonomous-loop.sh coverage --once

# Available scopes: lint, test, coverage, complexity, bundles, deps
```

### Full continuous cycle (all scopes)

```bash
./scripts/autonomous-loop.sh all --continuous
```

### Scheduled via launchd (Mac Mini)

```bash
# Install daily daemon (runs at 3:00 AM)
cp scripts/com.kaiord.autonomous.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.kaiord.autonomous.plist

# Check status
launchctl list | grep kaiord

# Unload
launchctl unload ~/Library/LaunchAgents/com.kaiord.autonomous.plist
```

### Monitor via tmux

```bash
tmux new-session -d -s kaiord-auto './scripts/autonomous-loop.sh all --continuous'
tmux attach -t kaiord-auto  # Watch in real-time
```

## Safety

| Guard           | Description                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------- |
| File-path guard | Agent cannot modify `.github/`, `CLAUDE.md`, `AGENTS.md`, `eslint.config.js`, root `package.json` |
| Metrics guard   | PR only created if quality score improved AND no per-metric regression                            |
| Verification    | `pnpm -r build && pnpm -r test` must pass before push                                             |
| CI gate         | All CI checks must pass before merge                                                              |
| Max turns       | Claude limited to 15 turns per cycle                                                              |
| Conflict check  | Skips if open autonomous PRs already exist                                                        |
| Human review    | Phase 3: human approves. Phase 5: auto-approve with guards                                        |

## Cost

| Item                   | Cost                     |
| ---------------------- | ------------------------ |
| Claude Code (Max plan) | Included in subscription |
| Mac Mini M4            | ~$600 one-time           |
| Electricity (~10W)     | ~$1/month                |
| GitHub Actions         | Free (public repo)       |
| CodeRabbit             | Free (open source)       |
| **Total operational**  | **~$1/month**            |

## Troubleshooting

| Issue                       | Fix                                                             |
| --------------------------- | --------------------------------------------------------------- |
| `claude: command not found` | Install Claude Code: `npm install -g @anthropic-ai/claude-code` |
| `gh: command not found`     | Install GitHub CLI: `brew install gh`                           |
| `gh auth` fails             | Run `gh auth login`                                             |
| No changes made             | Claude found nothing to improve for that scope                  |
| Metrics comparison fails    | Ensure `pnpm -r build` succeeds first                           |
| PR not auto-merged          | Check branch protection rules + approval requirement            |
