#!/usr/bin/env bash
# Extract version-specific changelog section from CHANGELOG.md
#
# Usage:
#   ./extract-changelog.sh <changelog-file> <version>
#
# Examples:
#   ./extract-changelog.sh packages/core/CHANGELOG.md 1.2.3
#   ./extract-changelog.sh packages/cli/CHANGELOG.md 0.5.0
#
# Exit codes:
#   0 - Success
#   1 - Invalid arguments
#   2 - Changelog file not found
#   3 - Version not found in changelog

set -euo pipefail

# Check arguments
if [ $# -ne 2 ]; then
  echo "Error: Invalid number of arguments" >&2
  echo "Usage: $0 <changelog-file> <version>" >&2
  exit 1
fi

CHANGELOG_FILE="$1"
VERSION="$2"

# Check if changelog file exists
if [ ! -f "$CHANGELOG_FILE" ]; then
  echo "Error: Changelog file not found: $CHANGELOG_FILE" >&2
  exit 2
fi

# Extract the version section from changelog
# Changelog format:
# ## 1.2.3
# ### Patch Changes
# - Change description
#
# ## 1.2.2
# ### Patch Changes
# - Previous change

# Use awk to extract content between version headers
EXTRACTED=$(awk -v version="$VERSION" '
  BEGIN { found=0; printing=0; first_line=1 }
  /^## / {
    if (printing) {
      exit
    }
    if ($2 == version) {
      found=1
      printing=1
      next
    }
  }
  printing {
    if (first_line && NF == 0) {
      next
    }
    first_line=0
    print
  }
  END {
    if (!found) {
      exit 3
    }
  }
' "$CHANGELOG_FILE")

# Check if version was found
if [ $? -eq 3 ]; then
  echo "Error: Version $VERSION not found in $CHANGELOG_FILE" >&2
  exit 3
fi

# Output the extracted content
echo "$EXTRACTED"
exit 0
