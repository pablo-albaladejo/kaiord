#!/bin/bash
# scripts/validate-package.sh
# Validates package existence and version consistency
#
# Usage:
#   ./validate-package.sh <package-name> <version>
#
# Examples:
#   ./validate-package.sh "@kaiord/core" "1.2.3"
#   ./validate-package.sh "@kaiord/cli" "0.5.0"
#
# Output (on success):
#   PACKAGE_DIR=<package-directory>
#
# Exit Codes:
#   0 - Package is valid and version matches
#   1 - Invalid arguments
#   2 - Unknown package name
#   3 - Package directory not found
#   4 - package.json not found
#   5 - package.json is invalid JSON
#   6 - Version mismatch between tag and package.json
#
# Validation Steps:
#   1. Verify package name is known (@kaiord/core or @kaiord/cli)
#   2. Verify package directory exists
#   3. Verify package.json exists and is valid JSON
#   4. Compare tag version with package.json version
#
# Requirements: 4.4, 4.5, 9.3

set -e  # Exit on error

# Check if both arguments are provided
if [[ $# -ne 2 ]]; then
  echo "Error: Package name and version arguments required" >&2
  echo "Usage: $0 <package-name> <version>" >&2
  echo "Example: $0 @kaiord/core 1.2.3" >&2
  exit 1
fi

PACKAGE_NAME="$1"
VERSION="$2"

# Check if arguments are non-empty
if [[ -z "$PACKAGE_NAME" ]] || [[ -z "$VERSION" ]]; then
  echo "Error: Package name and version cannot be empty" >&2
  echo "Usage: $0 <package-name> <version>" >&2
  echo "Example: $0 @kaiord/core 1.2.3" >&2
  exit 1
fi

# Determine package directory based on package name
case "$PACKAGE_NAME" in
  "@kaiord/core")
    PACKAGE_DIR="packages/core"
    ;;
  "@kaiord/cli")
    PACKAGE_DIR="packages/cli"
    ;;
  *)
    echo "Error: Unknown package: $PACKAGE_NAME" >&2
    echo "" >&2
    echo "Valid packages:" >&2
    echo "  @kaiord/core" >&2
    echo "  @kaiord/cli" >&2
    exit 2
    ;;
esac

# Verify package directory exists
if [[ ! -d "$PACKAGE_DIR" ]]; then
  echo "Error: Package directory not found: $PACKAGE_DIR" >&2
  echo "" >&2
  echo "Expected directory structure:" >&2
  echo "  packages/core/    (for @kaiord/core)" >&2
  echo "  packages/cli/     (for @kaiord/cli)" >&2
  exit 3
fi

# Verify package.json exists
PACKAGE_JSON="$PACKAGE_DIR/package.json"
if [[ ! -f "$PACKAGE_JSON" ]]; then
  echo "Error: package.json not found: $PACKAGE_JSON" >&2
  exit 4
fi

# Verify package.json is valid JSON and extract version
# Using node to parse JSON safely
PACKAGE_VERSION=$(node -p "try { require('./$PACKAGE_JSON').version } catch(e) { process.exit(1) }") || {
  echo "Error: Invalid package.json: $PACKAGE_JSON" >&2
  echo "The file exists but is not valid JSON or missing 'version' field" >&2
  exit 5
}

# Compare tag version with package.json version
if [[ "$PACKAGE_VERSION" != "$VERSION" ]]; then
  echo "Error: Version mismatch!" >&2
  echo "" >&2
  echo "Tag version:         $VERSION" >&2
  echo "package.json version: $PACKAGE_VERSION" >&2
  echo "" >&2
  echo "The version in the release tag must match the version in package.json" >&2
  echo "Package: $PACKAGE_NAME" >&2
  echo "Location: $PACKAGE_JSON" >&2
  exit 6
fi

# Output package directory
echo "PACKAGE_DIR=$PACKAGE_DIR"

exit 0
