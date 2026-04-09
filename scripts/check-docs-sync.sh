#!/usr/bin/env bash
# check-docs-sync.sh — Remind to update docs when source changes.
# Used as a Claude Code pre-commit hook (advisory, non-blocking).

set -euo pipefail

staged=$(git diff --cached --name-only)

has_src=false
has_docs=false

while IFS= read -r file; do
  case "$file" in
    packages/*/src/*) has_src=true ;;
    packages/docs/*)  has_docs=true ;;
  esac
done <<< "$staged"

if $has_src && ! $has_docs; then
  echo "⚠️  Source files changed without docs updates."
  echo "   Check if packages/docs/ needs updating."
fi
