#!/bin/bash

# Quick npm Publishing Setup for CLI
# Simple script to configure npm publishing for @kaiord/cli package

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quick npm Publishing Setup for @kaiord/cli${NC}\n"

# Check prerequisites
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found. Please install Node.js first.${NC}"
    exit 1
fi

if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠ GitHub CLI not found${NC}"
    echo -e "Install with: ${BLUE}brew install gh${NC}"
    exit 1
fi

# Step 1: npm login
echo -e "${BLUE}Step 1: npm Authentication${NC}"
if npm whoami &> /dev/null; then
    NPM_USER=$(npm whoami)
    echo -e "${GREEN}✓ Logged in as: $NPM_USER${NC}"
else
    echo "Please log in to npm:"
    npm login
    NPM_USER=$(npm whoami)
    echo -e "${GREEN}✓ Logged in as: $NPM_USER${NC}"
fi

# Step 2: Verify organization access
echo -e "\n${BLUE}Step 2: Verifying @kaiord organization access${NC}"
if npm org ls kaiord 2>&1 | grep -q "$NPM_USER"; then
    ORG_ROLE=$(npm org ls kaiord 2>&1 | grep "$NPM_USER" | awk '{print $3}')
    echo -e "${GREEN}✓ You are a member of @kaiord organization (role: $ORG_ROLE)${NC}"
else
    echo -e "${RED}✗ You are not a member of @kaiord organization${NC}"
    echo "Please request access from the organization owner"
    exit 1
fi

# Also check package access
if npm access list packages 2>&1 | grep -q "@kaiord"; then
    echo -e "${GREEN}✓ You have access to @kaiord packages:${NC}"
    npm access list packages 2>&1 | grep "@kaiord"
fi

# Step 3: Check if token exists
echo -e "\n${BLUE}Step 3: Checking npm Token${NC}"
echo "Opening npm token management page..."
echo ""
echo "If you need to create/update the token:"
echo "  1. Expiration: 90 days (or your preference)"
echo "  2. Packages and scopes: Select '@kaiord/cli' (or all @kaiord packages)"
echo "  3. Permissions: Read and write"
echo "  4. Organizations: Select 'kaiord' organization"
echo "  5. Click 'Generate Token'"
echo "  6. Copy the token"
echo ""

# Open browser to granular token page
open "https://www.npmjs.com/settings/$NPM_USER/tokens/granular-access-tokens/new" 2>/dev/null || \
    xdg-open "https://www.npmjs.com/settings/$NPM_USER/tokens/granular-access-tokens/new" 2>/dev/null || \
    echo "Visit: https://www.npmjs.com/settings/$NPM_USER/tokens/granular-access-tokens/new"

read -p "Do you need to create/update the token? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -sp "Paste your npm token here: " NPM_TOKEN
    echo ""

    if [ -z "$NPM_TOKEN" ]; then
        echo -e "${RED}✗ No token provided${NC}"
        exit 1
    fi

    # Configure GitHub secret
    echo -e "\n${BLUE}Step 4: Configuring GitHub Secret${NC}"

    # Check gh auth
    if ! gh auth status &> /dev/null; then
        echo "Authenticating with GitHub..."
        gh auth login
    fi

    # Set secret
    if echo "$NPM_TOKEN" | gh secret set NPM_TOKEN --repo pablo-albaladejo/kaiord; then
        echo -e "${GREEN}✓ NPM_TOKEN configured in GitHub${NC}"
    else
        echo -e "${RED}✗ Failed to set secret${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Using existing token${NC}"
fi

# Step 5: Verify package status
echo -e "\n${BLUE}Step 5: Package Status${NC}"

PACKAGE_VERSION=$(grep -o '"version": *"[^"]*"' packages/cli/package.json | cut -d'"' -f4)
echo -e "${GREEN}✓ Local version: $PACKAGE_VERSION${NC}"

if npm view @kaiord/cli version &> /dev/null; then
    NPM_VERSION=$(npm view @kaiord/cli version)
    echo -e "${GREEN}✓ Published on npm: v$NPM_VERSION${NC}"
    
    if [ "$PACKAGE_VERSION" = "$NPM_VERSION" ]; then
        echo -e "${YELLOW}⚠ Local version matches npm version${NC}"
        echo -e "${BLUE}ℹ You'll need to bump the version before publishing${NC}"
    else
        echo -e "${GREEN}✓ Local version is different - ready to publish${NC}"
    fi
else
    echo -e "${BLUE}ℹ Not yet published (ready for first release)${NC}"
fi

# Step 6: Pre-publish checks
echo -e "\n${BLUE}Step 6: Pre-publish Checks${NC}"

# Check if build exists
if [ -d "packages/cli/dist" ]; then
    echo -e "${GREEN}✓ Build directory exists${NC}"
else
    echo -e "${YELLOW}⚠ Build directory not found${NC}"
    echo -e "${BLUE}ℹ Run: pnpm --filter @kaiord/cli build${NC}"
fi

# Check if tests pass
echo -e "\n${BLUE}Running tests...${NC}"
if pnpm --filter @kaiord/cli test --run 2>&1 | tail -5; then
    echo -e "${GREEN}✓ Tests passed${NC}"
else
    echo -e "${RED}✗ Tests failed${NC}"
    echo -e "${YELLOW}⚠ Fix tests before publishing${NC}"
fi

# Done
echo -e "\n${GREEN}✅ Setup Complete!${NC}\n"
echo "Next steps to publish @kaiord/cli:"
echo ""
echo "  1. Build the package:"
echo "     ${BLUE}pnpm --filter @kaiord/cli build${NC}"
echo ""
echo "  2. Test locally (optional):"
echo "     ${BLUE}pnpm --filter @kaiord/cli publish --dry-run${NC}"
echo ""
echo "  3. Create changeset:"
echo "     ${BLUE}pnpm exec changeset${NC}"
echo "     Select: ${BLUE}@kaiord/cli${NC}"
echo "     Version: ${BLUE}patch/minor/major${NC}"
echo ""
echo "  4. Commit and push:"
echo "     ${BLUE}git add .changeset/ && git commit -m 'chore: release cli' && git push${NC}"
echo ""
echo "  5. Merge 'Version Packages' PR"
echo ""
echo "  6. Watch CI/CD:"
echo "     ${BLUE}https://github.com/pablo-albaladejo/kaiord/actions${NC}"
echo ""
echo "Manual publish (if needed):"
echo "  ${BLUE}cd packages/cli && npm publish --access public${NC}"
echo ""
