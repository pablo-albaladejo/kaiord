#!/usr/bin/env bash

# NPM Manual Publish Recovery Script
# Use this script when GitHub Actions release workflow fails
# Requires: npm authentication (npm login or NPM_TOKEN in .npmrc)

set -e

echo "🚀 Kaiord NPM Manual Publish Recovery"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check npm authentication
echo "Checking npm authentication..."
if ! npm whoami &> /dev/null; then
  echo -e "${RED}❌ Not logged in to npm${NC}"
  echo ""
  echo "Please authenticate with npm first:"
  echo "  1. Run: npm login"
  echo "  2. Or set NPM_TOKEN in ~/.npmrc:"
  echo "     echo '//registry.npmjs.org/:_authToken=YOUR_TOKEN' >> ~/.npmrc"
  exit 1
fi

NPM_USER=$(npm whoami)
echo -e "${GREEN}✅ Authenticated as: $NPM_USER${NC}"
echo ""

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
  echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
  echo "This script will commit and push version changes."
  read -p "Continue? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Build all packages
echo "📦 Building all packages..."
pnpm -r build

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Publish packages in dependency order
PACKAGES=(
  "core:4.0.0"
  "fit:4.0.0"
  "tcx:4.0.0"
  "zwo:4.0.0"
  "garmin:1.0.0"
  "cli:4.1.0"
)

PUBLISHED=()
SKIPPED=()
FAILED=()

echo "📤 Publishing packages..."
echo ""

for PKG_VERSION in "${PACKAGES[@]}"; do
  IFS=':' read -r PKG VERSION <<< "$PKG_VERSION"
  PKG_NAME="@kaiord/$PKG"

  echo "Publishing $PKG_NAME@$VERSION..."

  # Check if version already exists on npm
  if npm view "$PKG_NAME@$VERSION" version &> /dev/null; then
    echo -e "${YELLOW}⏭️  $PKG_NAME@$VERSION already published, skipping${NC}"
    SKIPPED+=("$PKG_NAME@$VERSION")
    continue
  fi

  cd "packages/$PKG"

  if pnpm publish --access public --no-git-checks; then
    echo -e "${GREEN}✅ Published $PKG_NAME@$VERSION${NC}"
    PUBLISHED+=("$PKG_NAME@$VERSION")
  else
    echo -e "${RED}❌ Failed to publish $PKG_NAME@$VERSION${NC}"
    FAILED+=("$PKG_NAME@$VERSION")
  fi

  cd ../..
  echo ""
done

# Create and push git tags
if [ ${#PUBLISHED[@]} -gt 0 ]; then
  echo "🏷️  Creating git tags..."

  for PKG_VERSION in "${PUBLISHED[@]}"; do
    TAG="$PKG_VERSION"

    if git rev-parse "$TAG" >/dev/null 2>&1; then
      echo "Tag $TAG already exists, skipping"
    else
      git tag "$TAG"
      echo "Created tag: $TAG"
    fi
  done

  echo ""
  echo "📤 Pushing tags to remote..."
  git push origin --tags
  echo -e "${GREEN}✅ Tags pushed${NC}"
  echo ""
fi

# Clean up consumed changesets
if [ -f ".changeset/add-garmin-format-support.md" ]; then
  echo "🧹 Removing consumed changesets..."
  rm .changeset/add-garmin-format-support.md
  git add .changeset
  git commit -m "chore: consumed changesets [skip ci]"
  git push
  echo -e "${GREEN}✅ Changesets cleaned up${NC}"
  echo ""
fi

# Summary
echo "======================================"
echo "📊 Publish Summary"
echo "======================================"
echo ""

if [ ${#PUBLISHED[@]} -gt 0 ]; then
  echo -e "${GREEN}✅ Published (${#PUBLISHED[@]}):${NC}"
  for PKG in "${PUBLISHED[@]}"; do
    echo "  - $PKG"
  done
  echo ""
fi

if [ ${#SKIPPED[@]} -gt 0 ]; then
  echo -e "${YELLOW}⏭️  Skipped (${#SKIPPED[@]}):${NC}"
  for PKG in "${SKIPPED[@]}"; do
    echo "  - $PKG"
  done
  echo ""
fi

if [ ${#FAILED[@]} -gt 0 ]; then
  echo -e "${RED}❌ Failed (${#FAILED[@]}):${NC}"
  for PKG in "${FAILED[@]}"; do
    echo "  - $PKG"
  done
  echo ""
  exit 1
fi

# Verify all packages
echo "🔍 Verifying published packages..."
echo ""

ALL_GOOD=true
for PKG_VERSION in "${PACKAGES[@]}"; do
  IFS=':' read -r PKG VERSION <<< "$PKG_VERSION"
  PKG_NAME="@kaiord/$PKG"

  PUBLISHED_VERSION=$(npm view "$PKG_NAME" version 2>/dev/null || echo "not found")

  if [ "$PUBLISHED_VERSION" == "$VERSION" ]; then
    echo -e "${GREEN}✅ $PKG_NAME: $PUBLISHED_VERSION${NC}"
  else
    echo -e "${RED}❌ $PKG_NAME: expected $VERSION, got $PUBLISHED_VERSION${NC}"
    ALL_GOOD=false
  fi
done

echo ""

if [ "$ALL_GOOD" = true ]; then
  echo -e "${GREEN}✅ All packages published successfully!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Verify packages: https://www.npmjs.com/org/kaiord"
  echo "  2. Test installation: pnpm add @kaiord/core@latest"
  echo "  3. Update documentation if needed"
  exit 0
else
  echo -e "${RED}❌ Some packages are not at expected versions${NC}"
  echo "Please check npm and investigate."
  exit 1
fi
