---
name: deep-review-fix
description: Execute the deep review fix plan with orchestrator convergence loops, PR management, and automated merging
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Task
---

Execute the deep review fix plan end-to-end with full automation using the orchestrator agent.

## Plan Location

`/Users/pablo/.claude-personal/plans/atomic-purring-bubble.md`

## Arguments

- `phase` (optional): 1, 2, 3, or 4. If omitted, runs all phases sequentially.
- Phase 1: CRITICAL - Security, Type Safety, Architecture
- Phase 2: HIGH - Code Quality and Consistency
- Phase 3: MEDIUM - Config, Dependencies, Hardening
- Phase 4: Tests - Coverage Gap Closure

## Execution Loop per Phase

For each phase N (1-4), execute steps 1-5 sequentially:

### Step 1: Implement

1. Read the plan from the plan location above
2. Create feature branch from main: `fix/deep-review-phase-{N}`
3. Use the **orchestrator** agent (subagent_type: orchestrator) to implement all tasks in the phase
4. The orchestrator MUST use review-execution cycles until code converges:
   - Implement changes
   - Run `pnpm -r build && pnpm -r test && pnpm lint`
   - If failures: fix and re-verify
   - Loop until green

### Step 2: Verify (loop until green + approved)

1. Run full verification: `pnpm -r build && pnpm -r test && pnpm lint`
2. Launch **arch-guardian** agent (subagent_type: arch-guardian) to validate architecture
3. Launch **code-reviewer** agent (subagent_type: code-reviewer) for multi-perspective review
4. If either finds issues:
   - Fix the issues found
   - Re-run verification
   - Re-launch reviewers
5. Loop until: build green AND arch-guardian approves AND code-reviewer approves
6. Max 5 iterations before stopping and asking user for guidance

### Step 3: Commit

1. Create changeset(s) following the plan's Changeset Strategy table:
   - Use `pnpm exec changeset` or create `.changeset/*.md` files directly
   - Use correct semver bump (patch/minor) per the plan
2. Stage all changed files (be specific, avoid staging secrets)
3. Commit with conventional commit message format: `fix(scope): description` or `feat(scope): description`
4. Do NOT push yet

### Step 4: PR + Monitor (loop until CI green + no comments)

1. Push branch: `git push -u origin fix/deep-review-phase-{N}`
2. Create PR:
   ```
   gh pr create --title "fix: deep review phase {N} - {phase title}" --body "..."
   ```
   Include in PR body:
   - Summary of changes from the plan
   - Link to the plan phase
   - Test plan / verification steps
3. Monitor CI: `gh pr checks {PR_NUMBER} --watch`
4. If CI fails:
   - Read CI logs: `gh pr checks {PR_NUMBER}`
   - Fix the issue locally
   - Commit fix and push
   - Re-monitor CI
5. Read PR comments: `gh api repos/pablo-albaladejo/kaiord/pulls/{PR_NUMBER}/comments`
6. If comments exist:
   - Address each comment with code fixes
   - Commit and push
   - Re-check CI and comments
7. Loop until: CI green AND no unresolved comments
8. Max 5 iterations before stopping and asking user

### Step 5: Merge + Rebase

1. Merge PR: `gh pr merge {PR_NUMBER} --squash`
2. Switch to main and pull: `git checkout main && git pull`
3. Monitor post-merge CI on main
4. If next phase exists:
   - Create new branch: `git checkout -b fix/deep-review-phase-{N+1}`
   - Continue to next phase

## Error Handling

- **Build failure**: Read compiler error, fix source, retry build
- **Test failure**: Read failing test output, fix test or source, retry
- **Lint failure**: Run `pnpm lint:fix` first, then fix remaining manually
- **CI failure**: `gh pr checks` to read logs, fix locally, push
- **Review rejection**: Address each piece of feedback, re-submit
- **After 5 failed iterations**: Stop and ask user for guidance

## Phase Dependencies

```
Phase 1 --> Phase 2 --> Phase 3 --> Phase 4

Key intra-phase dependencies:
- 1B (Garmin Zod) BEFORE 2A (Garmin split)
- 3C (type guards) DURING 2A (Garmin split)
- 4.0 (coverage baseline) BEFORE 4G (thresholds)
- 4A-4F (tests) BEFORE 4G (thresholds)
```

## Changeset Strategy Reference

| Phase | Semver | Package(s)           | Description                                           |
| ----- | ------ | -------------------- | ----------------------------------------------------- |
| 1     | minor  | @kaiord/core         | Remove Logger param, remove ValidationError duplicate |
| 1     | patch  | @kaiord/garmin       | Add Zod validation, remove unsafe casts               |
| 1     | patch  | @kaiord/cli          | Harden path security                                  |
| 2     | patch  | @kaiord/garmin       | Split converter files                                 |
| 2     | patch  | @kaiord/cli          | Extract validate command, split kaiord.ts             |
| 2     | patch  | @kaiord/mcp          | Remove non-null assertion                             |
| 3     | patch  | @kaiord/core         | Export isRepetitionBlock type guard                   |
| 4     | patch  | all adapter packages | Test coverage + thresholds                            |
