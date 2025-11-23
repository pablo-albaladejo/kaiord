#!/bin/bash
# scripts/parse-release-tag.sh
# Parses and validates package-scoped release tags
#
# Usage:
#   ./parse-release-tag.sh <tag>
#
# Examples:
#   ./parse-release-tag.sh "@kaiord/core@1.2.3"
#   ./parse-release-tag.sh "@kaiord/cli@0.5.0-beta.1"
#
# Output (on success):
#   PACKAGE_NAME=<package-name>
#   VERSION=<version>
#
# Exit Codes:
#   0 - Tag is valid and successfully parsed
#   1 - Tag format is invalid
#
# Tag Format:
#   {packageName}@{version}
#   - packageName: npm package name (e.g., @kaiord/core, @kaiord/cli)
#   - version: semantic version (e.g., 1.2.3, 1.0.0-beta.1, 1.0.0+build.123)
#
# Valid Examples:
#   @kaiord/core@1.2.3
#   @kaiord/cli@0.5.0
#   @kaiord/core@2.0.0-beta.1
#   @kaiord/core@1.0.0+20130313144700
#   @kaiord/core@1.0.0-beta.1+exp.sha.5114f85
#
# Invalid Examples:
#   v1.2.3                    (generic version tag)
#   core@1.2.3                (unscoped package)
#   @kaiord/core-1.2.3        (wrong separator)
#   @kaiord/core@             (missing version)
#   @kaiord/core@1.2          (incomplete version)
#
# Requirements: 3.1, 3.2, 3.3, 9.1, 9.2, 9.4

set -euo pipefail  # Exit on error, unset variables, and pipeline failures

# Check if tag argument is provided
if [[ $# -ne 1 ]]; then
  echo "Error: Tag argument required" >&2
  echo "Usage: $0 <tag>" >&2
  echo "Example: $0 @kaiord/core@1.2.3" >&2
  exit 1
fi

TAG="$1"

# Regex pattern for package-scoped release tags
# Pattern breakdown:
#   ^                           - Start of string
#   (@[^/]+/)                   - Scope: @ followed by scope name and /
#   [^@]+                       - Package name: any characters except @
#   @                           - Separator between package and version
#   [0-9]+\.[0-9]+\.[0-9]+      - Semantic version: MAJOR.MINOR.PATCH
#   (-[a-zA-Z0-9.]+)?           - Optional pre-release: -alpha.1, -beta.2, etc.
#   (\+[a-zA-Z0-9.]+)?          - Optional build metadata: +build.123, +exp.sha.5114f85
#   $                           - End of string
TAG_PATTERN='^(@[^/]+/)[^@]+@[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$'

# Validate tag format
if [[ ! $TAG =~ $TAG_PATTERN ]]; then
  echo "Error: Invalid tag format: $TAG" >&2
  echo "" >&2
  echo "Expected format: {packageName}@{version}" >&2
  echo "  - packageName: scoped npm package (e.g., @kaiord/core)" >&2
  echo "  - version: semantic version (e.g., 1.2.3, 1.0.0-beta.1)" >&2
  echo "" >&2
  echo "Valid examples:" >&2
  echo "  @kaiord/core@1.2.3" >&2
  echo "  @kaiord/cli@0.5.0" >&2
  echo "  @kaiord/core@2.0.0-beta.1" >&2
  echo "  @kaiord/core@1.0.0+build.123" >&2
  echo "" >&2
  echo "Invalid examples:" >&2
  echo "  v1.2.3                 (generic version tag)" >&2
  echo "  core@1.2.3             (unscoped package)" >&2
  echo "  @kaiord/core-1.2.3     (wrong separator)" >&2
  echo "  @kaiord/core@          (missing version)" >&2
  echo "  @kaiord/core@1.2       (incomplete version)" >&2
  exit 1
fi

# Extract package name (everything before the last @)
PACKAGE_NAME="${TAG%@*}"

# Extract version (everything after the last @)
VERSION="${TAG##*@}"

# Output extracted values
echo "PACKAGE_NAME=$PACKAGE_NAME"
echo "VERSION=$VERSION"

exit 0
