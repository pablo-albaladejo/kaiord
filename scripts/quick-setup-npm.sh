#!/bin/bash

# Quick npm Publishing Setup
# Simple script to configure npm publishing in one command

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quick npm Publishing Setup${NC}\n"

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

# Step 2: Create token
echo -e "\n${BLUE}Step 2: Creating npm Granular Access Token${NC}"
echo "Opening npm token creation page..."
echo ""
echo "Please configure the token with:"
echo "  1. Expiration: 90 days (or your preference)"
echo "  2. Packages and scopes: Select '@kaiord/core'"
echo "  3. Permissions: Read and write"
echo "  4. Organizations: (leave empty)"
echo "  5. Click 'Generate Token'"
echo "  6. Copy the token"
echo ""

# Open browser to granular token page
open "https://www.npmjs.com/settings/$NPM_USER/tokens/granular-access-tokens/new" 2>/dev/null || \
    xdg-open "https://www.npmjs.com/settings/$NPM_USER/tokens/granular-access-tokens/new" 2>/dev/null || \
    echo "Visit: https://www.npmjs.com/settings/$NPM_USER/tokens/granular-access-tokens/new"

read -sp "Paste your npm token here: " NPM_TOKEN
echo ""

if [ -z "$NPM_TOKEN" ]; then
    echo -e "${RED}✗ No token provided${NC}"
    exit 1
fi

# Step 3: Configure GitHub secret
echo -e "\n${BLUE}Step 3: Configuring GitHub Secret${NC}"

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

# Step 4: Verify
echo -e "\n${BLUE}Step 4: Verification${NC}"

PACKAGE_VERSION=$(grep -o '"version": *"[^"]*"' packages/core/package.json | cut -d'"' -f4)
echo -e "${GREEN}✓ Package version: $PACKAGE_VERSION${NC}"

if npm view @kaiord/core version &> /dev/null; then
    NPM_VERSION=$(npm view @kaiord/core version)
    echo -e "${GREEN}✓ Published on npm: v$NPM_VERSION${NC}"
else
    echo -e "${BLUE}ℹ Not yet published (ready for first release)${NC}"
fi

# Done
echo -e "\n${GREEN}✅ Setup Complete!${NC}\n"
echo "Next steps:"
echo "  1. Create changeset: ${BLUE}pnpm exec changeset${NC}"
echo "  2. Commit and push: ${BLUE}git add .changeset/ && git commit -m 'chore: release' && git push${NC}"
echo "  3. Merge 'Version Packages' PR"
echo "  4. Watch: ${BLUE}https://github.com/pablo-albaladejo/kaiord/actions${NC}"
echo ""
echo "Documentation: ${BLUE}.github/NPM_PUBLISHING.md${NC}"

