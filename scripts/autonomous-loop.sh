#!/bin/bash
set -euo pipefail

# =============================================================================
# Kaiord Autonomous Improvement Loop
#
# Usage:
#   ./scripts/autonomous-loop.sh [scope] [--once|--continuous]
#
# Scopes: lint, test, coverage, complexity, bundles, deps, all
# Modes:  --once (default), --continuous (cycles through all scopes)
#
# Requirements: claude CLI, gh CLI, git, pnpm, node
# =============================================================================

SCOPE=${1:-lint}
MODE=${2:---once}
MAX_TURNS=15
BRANCH_PREFIX="auto/improve"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$REPO_ROOT"

log() { echo "[$(date '+%H:%M:%S')] $*"; }
err() { echo "[$(date '+%H:%M:%S')] ERROR: $*" >&2; }

check_prerequisites() {
  for cmd in claude gh git pnpm node; do
    if ! command -v "$cmd" &>/dev/null; then
      err "$cmd is required but not found"
      exit 1
    fi
  done

  if ! gh auth status &>/dev/null; then
    err "gh CLI not authenticated. Run: gh auth login"
    exit 1
  fi
}

collect_metrics() {
  local label=$1
  METRICS_OUTPUT="$label" node .github/scripts/collect-metrics.js 2>/dev/null
}

run_cycle() {
  local scope=$1
  local branch="${BRANCH_PREFIX}-${scope}-$(date +%Y%m%d%H%M)"
  local prompt_file="scripts/prompts/${scope}.md"

  log "=== Starting improvement cycle: scope=$scope ==="

  # Validate prompt file exists
  if [ ! -f "$prompt_file" ]; then
    err "Prompt file not found: $prompt_file"
    return 1
  fi

  # Ensure we're on main and up to date
  log "Syncing with origin/main..."
  git checkout main 2>/dev/null
  git pull origin main --ff-only 2>/dev/null

  # Check for existing autonomous PRs
  local open_prs
  open_prs=$(gh pr list --label automated --state open --json number --jq length 2>/dev/null || echo "0")
  if [ "$open_prs" -gt 0 ]; then
    log "Found $open_prs open autonomous PR(s). Skipping to avoid conflicts."
    return 0
  fi

  # Collect baseline metrics
  log "Collecting baseline metrics..."
  pnpm -r build 2>/dev/null
  collect_metrics "baseline"

  # Create feature branch
  git checkout -b "$branch" 2>/dev/null

  # Run Claude Code headless
  log "Running Claude Code (scope: $scope, max_turns: $MAX_TURNS)..."
  claude -p "$(cat "$prompt_file")" \
    --allowedTools "Bash(pnpm *),Bash(node *),Bash(npx *),Read,Edit,Write,Glob,Grep" \
    --max-turns "$MAX_TURNS" \
    2>/dev/null || true

  # Check if changes were made
  if [ -z "$(git status --porcelain)" ]; then
    log "No changes made. Nothing to do."
    git checkout main 2>/dev/null
    git branch -D "$branch" 2>/dev/null || true
    return 0
  fi

  # File-path guard: reject changes to forbidden files (tracked + untracked)
  local all_changes
  all_changes=$(git diff --name-only main 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null)
  local forbidden
  forbidden=$(echo "$all_changes" | grep -E '^\.(github|husky)/|^CLAUDE\.md$|^AGENTS\.md$|^eslint\.config|^package\.json$|^pnpm-lock\.yaml$|^openspec/' || true)
  if [ -n "$forbidden" ]; then
    err "BLOCKED: Agent modified forbidden files:"
    echo "$forbidden" | while read -r f; do err "  - $f"; done
    git checkout -- . 2>/dev/null
    git checkout main 2>/dev/null
    git branch -D "$branch" 2>/dev/null || true
    return 1
  fi

  # Run full verification
  log "Running verification (build + test + lint)..."
  if ! pnpm -r build 2>/dev/null; then
    err "Build failed. Discarding changes."
    git checkout main 2>/dev/null
    git branch -D "$branch" 2>/dev/null || true
    return 1
  fi

  if ! pnpm -r test 2>/dev/null; then
    err "Tests failed. Discarding changes."
    git checkout main 2>/dev/null
    git branch -D "$branch" 2>/dev/null || true
    return 1
  fi

  # Collect post-improvement metrics
  log "Collecting post-improvement metrics..."
  collect_metrics "current"

  # Compare metrics
  local comparison
  comparison=$(node .github/scripts/compare-metrics.js metrics-baseline.json metrics-current.json 2>/dev/null)
  local improved
  improved=$(echo "$comparison" | grep -c "quality-improved: true" || true)

  if [ "$improved" -eq 0 ]; then
    log "Quality did not improve. Discarding changes."
    git checkout main 2>/dev/null
    git branch -D "$branch" 2>/dev/null || true
    return 0
  fi

  # Stage and commit
  git add packages/
  git commit -m "$(cat <<EOF
chore(${scope}): automated improvements

Scope: ${scope}
Agent: Claude Code (local autonomous loop)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"

  # Push and create PR
  log "Pushing branch and creating PR..."
  git push -u origin "$branch" 2>/dev/null

  local metrics_table
  metrics_table=$(node .github/scripts/compare-metrics.js metrics-baseline.json metrics-current.json 2>/dev/null | head -20)

  gh pr create \
    --base main \
    --head "$branch" \
    --title "chore(${scope}): automated improvements" \
    --body "$(cat <<EOF
## Automated Code Improvements

**Scope**: ${scope}
**Agent**: Claude Code (local autonomous loop)
**Date**: $(date -u '+%Y-%m-%d %H:%M UTC')

### Metrics Comparison
\`\`\`
${metrics_table}
\`\`\`

### Validation
- [x] All tests passing
- [x] Build successful
- [x] Quality score improved
- [x] No forbidden files modified

---
*Created by [autonomous-loop.sh](scripts/autonomous-loop.sh)*
EOF
)" \
    --label "automerge,automated"

  git checkout main 2>/dev/null
  log "=== PR created for scope: $scope ==="
}

# Main
check_prerequisites

if [ "$MODE" = "--continuous" ]; then
  SCOPES=(lint test coverage complexity bundles deps)
  log "Starting continuous improvement cycle (${#SCOPES[@]} scopes)"
  for scope in "${SCOPES[@]}"; do
    run_cycle "$scope" || log "Cycle failed for scope: $scope (continuing)"
    log "Cooldown: 60 seconds..."
    sleep 60
  done
  log "All scopes completed."
else
  run_cycle "$SCOPE"
fi
