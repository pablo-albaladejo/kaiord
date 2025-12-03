#!/bin/bash
set -e

# Detect which packages have changed between commits
# Usage: ./scripts/detect-package-changes.sh <prev_commit> <current_commit>

PREV_COMMIT="${1:-HEAD~1}"
CURRENT_COMMIT="${2:-HEAD}"

echo "Checking changes between $PREV_COMMIT and $CURRENT_COMMIT"

# Check if core package changed
CORE_CHANGED=false
if git diff --name-only "$PREV_COMMIT" "$CURRENT_COMMIT" | grep -q "^packages/core/"; then
  CORE_CHANGED=true
  echo "✅ @kaiord/core has changes"
fi

# Check if cli package changed
CLI_CHANGED=false
if git diff --name-only "$PREV_COMMIT" "$CURRENT_COMMIT" | grep -q "^packages/cli/"; then
  CLI_CHANGED=true
  echo "✅ @kaiord/cli has changes"
fi

# Output results
echo "CORE_CHANGED=$CORE_CHANGED"
echo "CLI_CHANGED=$CLI_CHANGED"

# Exit with success if any package changed
if [ "$CORE_CHANGED" = "true" ] || [ "$CLI_CHANGED" = "true" ]; then
  echo "HAS_CHANGES=true"
  exit 0
else
  echo "HAS_CHANGES=false"
  echo "ℹ️  No package changes detected"
  exit 0
fi
