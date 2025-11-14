#!/bin/bash
# Determines if a package should be tested based on change detection
# Usage: ./should-test-package.sh <package_name> <package_changed>

set -e

PACKAGE="$1"
PACKAGE_CHANGED="$2"

if [ -z "$PACKAGE" ] || [ -z "$PACKAGE_CHANGED" ]; then
  echo "Error: Missing required arguments"
  echo "Usage: $0 <package_name> <package_changed>"
  exit 1
fi

# Validate boolean value
if [ "$PACKAGE_CHANGED" != "true" ] && [ "$PACKAGE_CHANGED" != "false" ]; then
  echo "Error: PACKAGE_CHANGED must be 'true' or 'false', got: $PACKAGE_CHANGED"
  exit 1
fi

# Output decision
if [ "$PACKAGE_CHANGED" = "true" ]; then
  echo "should-test=true" >> "$GITHUB_OUTPUT"
  echo "✓ Package $PACKAGE will be tested (changes detected)"
else
  echo "should-test=false" >> "$GITHUB_OUTPUT"
  echo "✗ Package $PACKAGE will be skipped (no changes detected)"
fi
