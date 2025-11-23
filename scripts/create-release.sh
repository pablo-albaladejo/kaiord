#!/bin/bash
# scripts/create-release.sh
# CLI helper for creating package-scoped release tags
#
# Usage:
#   ./create-release.sh <package-name> <version> [--dry-run]
#
# Examples:
#   ./create-release.sh "@kaiord/core" "1.2.3"
#   ./create-release.sh "@kaiord/cli" "0.5.0" --dry-run
#
# Options:
#   --dry-run    Preview tag without creating or pushing it
#
# Exit Codes:
#   0 - Tag created and pushed successfully (or dry-run completed)
#   1 - Invalid arguments
#   2 - Tag parsing failed
#   3 - Package validation failed
#   4 - Tag already exists
#   5 - Git tag creation failed
#   6 - Git push failed
#
# Requirements: 12.1, 12.2, 12.3, 12.4, 12.5

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARSE_SCRIPT="$SCRIPT_DIR/parse-release-tag.sh"
VALIDATE_SCRIPT="$SCRIPT_DIR/validate-package.sh"

# Helper functions
print_error() {
  echo -e "${RED}❌ Error: $1${NC}" >&2
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if required arguments are provided
if [[ $# -lt 2 ]]; then
  print_error "Package name and version arguments required"
  echo "" >&2
  echo "Usage: $0 <package-name> <version> [--dry-run]" >&2
  echo "" >&2
  echo "Examples:" >&2
  echo "  $0 @kaiord/core 1.2.3" >&2
  echo "  $0 @kaiord/cli 0.5.0 --dry-run" >&2
  echo "" >&2
  echo "Options:" >&2
  echo "  --dry-run    Preview tag without creating or pushing it" >&2
  exit 1
fi

PACKAGE_NAME="$1"
VERSION="$2"
DRY_RUN=false

# Check if arguments are non-empty
if [[ -z "$PACKAGE_NAME" ]] || [[ -z "$VERSION" ]]; then
  print_error "Package name and version cannot be empty"
  echo "" >&2
  echo "Usage: $0 <package-name> <version> [--dry-run]" >&2
  exit 1
fi

# Check for --dry-run flag
if [[ "${3:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  print_warning "Dry-run mode enabled - no tags will be created or pushed"
fi

# Construct tag name
TAG_NAME="${PACKAGE_NAME}@${VERSION}"

print_info "Creating release for $TAG_NAME"
echo ""

# Step 1: Validate tag format
print_info "Step 1: Validating tag format..."
if ! "$PARSE_SCRIPT" "$TAG_NAME" > /dev/null 2>&1; then
  print_error "Invalid tag format: $TAG_NAME"
  echo "" >&2
  echo "Expected format: {packageName}@{version}" >&2
  echo "Examples: @kaiord/core@1.2.3, @kaiord/cli@0.5.0" >&2
  exit 2
fi
print_success "Tag format is valid"
echo ""

# Step 2: Check if tag already exists (before validation to fail fast)
print_info "Step 2: Checking if tag already exists..."
if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
  print_error "Tag already exists: $TAG_NAME"
  echo "" >&2
  echo "To view existing tag:" >&2
  echo "  git show $TAG_NAME" >&2
  echo "" >&2
  echo "To delete existing tag (use with caution):" >&2
  echo "  git tag -d $TAG_NAME" >&2
  echo "  git push origin :refs/tags/$TAG_NAME" >&2
  exit 4
fi
print_success "Tag does not exist yet"
echo ""

# Step 3: Validate package
print_info "Step 3: Validating package..."
if ! "$VALIDATE_SCRIPT" "$PACKAGE_NAME" "$VERSION" > /dev/null 2>&1; then
  print_error "Package validation failed"
  echo "" >&2
  echo "Possible issues:" >&2
  echo "  - Package name is not recognized (@kaiord/core or @kaiord/cli)" >&2
  echo "  - Package directory does not exist" >&2
  echo "  - Version in package.json does not match tag version" >&2
  echo "" >&2
  echo "Run validation script for details:" >&2
  echo "  $VALIDATE_SCRIPT $PACKAGE_NAME $VERSION" >&2
  exit 3
fi
print_success "Package validated successfully"
echo ""

# Step 4: Create tag (or preview in dry-run mode)
if [[ "$DRY_RUN" == true ]]; then
  print_warning "Dry-run mode: Would create tag $TAG_NAME"
  echo ""
  print_info "Tag details:"
  echo "  Tag name:    $TAG_NAME"
  echo "  Package:     $PACKAGE_NAME"
  echo "  Version:     $VERSION"
  echo "  Commit:      $(git rev-parse HEAD)"
  echo ""
  print_info "To create this tag for real, run without --dry-run:"
  echo "  $0 $PACKAGE_NAME $VERSION"
  print_success "Dry-run completed successfully"
  exit 0
fi

print_info "Step 4: Creating tag..."
if ! git tag "$TAG_NAME"; then
  print_error "Failed to create tag: $TAG_NAME"
  exit 5
fi
print_success "Tag created: $TAG_NAME"
echo ""

# Step 5: Push tag to remote
print_info "Step 5: Pushing tag to remote..."
if ! git push origin "$TAG_NAME"; then
  print_error "Failed to push tag to remote"
  echo "" >&2
  echo "Tag was created locally but not pushed to remote." >&2
  echo "To push manually:" >&2
  echo "  git push origin $TAG_NAME" >&2
  echo "" >&2
  echo "To delete local tag:" >&2
  echo "  git tag -d $TAG_NAME" >&2
  exit 6
fi
print_success "Tag pushed to remote: $TAG_NAME"
echo ""

# Success summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Release created successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
print_info "Release details:"
echo "  Tag:         $TAG_NAME"
echo "  Package:     $PACKAGE_NAME"
echo "  Version:     $VERSION"
echo ""
print_info "Next steps:"
echo "  1. GitHub Actions will automatically publish the package to npm"
echo "  2. A GitHub release will be created with changelog notes"
echo "  3. Monitor the release workflow at:"
echo "     https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
echo ""

exit 0
