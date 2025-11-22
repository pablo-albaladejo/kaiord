#!/bin/bash

# Setup Trusted Publishing for @kaiord/cli
# This script guides you through setting up npm Trusted Publishing (provenance)
# which is more secure than using tokens

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔒 npm Trusted Publishing Setup for @kaiord/cli${NC}\n"

# Check prerequisites
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found. Please install Node.js first.${NC}"
    exit 1
fi

# Step 1: Check npm authentication
echo -e "${BLUE}Step 1: Checking npm Authentication${NC}"
if npm whoami &> /dev/null; then
    NPM_USER=$(npm whoami)
    echo -e "${GREEN}✓ Logged in as: $NPM_USER${NC}"
else
    echo "Please log in to npm:"
    npm login
    NPM_USER=$(npm whoami)
    echo -e "${GREEN}✓ Logged in as: $NPM_USER${NC}"
fi

# Step 2: Check package status
echo -e "\n${BLUE}Step 2: Checking Package Status${NC}"

PACKAGE_VERSION=$(grep -o '"version": *"[^"]*"' packages/cli/package.json | cut -d'"' -f4)
echo -e "${GREEN}✓ Local version: $PACKAGE_VERSION${NC}"

PACKAGE_PUBLISHED=false
if npm view @kaiord/cli version &> /dev/null; then
    NPM_VERSION=$(npm view @kaiord/cli version)
    echo -e "${GREEN}✓ Package published on npm: v$NPM_VERSION${NC}"
    PACKAGE_PUBLISHED=true
else
    echo -e "${YELLOW}⚠ Package not yet published on npm${NC}"
    echo -e "${BLUE}ℹ You need to publish manually first before configuring trusted publishing${NC}"
fi

# Step 3: First publish (if needed)
if [ "$PACKAGE_PUBLISHED" = false ]; then
    echo -e "\n${BLUE}Step 3: First Publish (Required)${NC}"
    echo ""
    echo "Trusted publishing requires the package to be published at least once."
    echo "You can publish manually now or skip and do it later."
    echo ""
    read -p "Do you want to publish @kaiord/cli now? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Building package...${NC}"
        pnpm --filter @kaiord/cli build
        
        echo -e "${BLUE}Running tests...${NC}"
        pnpm --filter @kaiord/cli test
        
        echo -e "${BLUE}Publishing to npm...${NC}"
        cd packages/cli
        npm publish --access public
        cd ../..
        
        echo -e "${GREEN}✓ Package published successfully!${NC}"
        PACKAGE_PUBLISHED=true
    else
        echo -e "${YELLOW}⚠ Skipping publish${NC}"
        echo -e "${BLUE}ℹ Run this script again after publishing manually:${NC}"
        echo -e "  ${CYAN}cd packages/cli && npm publish --access public${NC}"
        exit 0
    fi
fi

# Step 4: Configure trusted publishing on npm
if [ "$PACKAGE_PUBLISHED" = true ]; then
    echo -e "\n${BLUE}Step 4: Configure Trusted Publishing on npm${NC}"
    echo ""
    echo "Now you need to configure trusted publishing on npm:"
    echo ""
    echo "1. Opening npm package settings..."
    echo ""
    
    # Open browser to package settings
    open "https://www.npmjs.com/package/@kaiord/cli/access" 2>/dev/null || \
        xdg-open "https://www.npmjs.com/package/@kaiord/cli/access" 2>/dev/null || \
        echo "Visit: https://www.npmjs.com/package/@kaiord/cli/access"
    
    echo ""
    echo "2. On the npm page, follow these steps:"
    echo ""
    echo -e "   a. Scroll to ${CYAN}\"Publishing access\"${NC} section"
    echo -e "   b. Click ${CYAN}\"Configure trusted publishers\"${NC}"
    echo -e "   c. Click ${CYAN}\"Add trusted publisher\"${NC}"
    echo ""
    echo "   d. Fill in the form:"
    echo -e "      - Provider: ${CYAN}GitHub Actions${NC}"
    echo -e "      - Repository owner: ${CYAN}pablo-albaladejo${NC}"
    echo -e "      - Repository name: ${CYAN}kaiord${NC}"
    echo -e "      - Workflow name: ${CYAN}release.yml${NC} (or leave empty)"
    echo -e "      - Environment: ${CYAN}(leave empty)${NC}"
    echo ""
    echo -e "   ${YELLOW}Note:${NC} @kaiord is an npm organization"
    echo "   Make sure you have admin access to the organization"
    echo ""
    echo -e "   e. Click ${CYAN}\"Add\"${NC}"
    echo ""
    
    read -p "Press Enter when you've completed the configuration on npm..."
    echo ""
    echo -e "${GREEN}✓ Trusted publishing should now be configured!${NC}"
fi

# Step 5: Verify workflow configuration
echo -e "\n${BLUE}Step 5: Verifying Workflow Configuration${NC}"

if grep -q "id-token: write" .github/workflows/release.yml 2>/dev/null; then
    echo -e "${GREEN}✓ Workflow has id-token: write permission${NC}"
else
    echo -e "${YELLOW}⚠ Workflow missing id-token: write permission${NC}"
    echo -e "${BLUE}ℹ Add this to .github/workflows/release.yml:${NC}"
    echo ""
    echo "permissions:"
    echo "  id-token: write  # Required for npm provenance"
    echo "  contents: write"
    echo ""
fi

if grep -q "\-\-provenance" .github/workflows/release.yml 2>/dev/null; then
    echo -e "${GREEN}✓ Workflow uses --provenance flag${NC}"
else
    echo -e "${YELLOW}⚠ Workflow missing --provenance flag${NC}"
    echo -e "${BLUE}ℹ Update publish command to:${NC}"
    echo "  pnpm publish --provenance"
    echo ""
fi

# Step 6: Test instructions
echo -e "\n${BLUE}Step 6: Testing Trusted Publishing${NC}"
echo ""
echo "To test that trusted publishing works:"
echo ""
echo "1. Create a new version:"
echo "   ${CYAN}pnpm exec changeset${NC}"
echo "   Select: ${CYAN}@kaiord/cli${NC}"
echo "   Version: ${CYAN}patch${NC}"
echo "   Description: ${CYAN}test trusted publishing${NC}"
echo ""
echo "2. Commit and push:"
echo "   ${CYAN}git add .changeset/ && git commit -m 'chore: test trusted publishing' && git push${NC}"
echo ""
echo "3. Merge the 'Version Packages' PR"
echo ""
echo "4. Watch the workflow:"
echo "   ${CYAN}https://github.com/pablo-albaladejo/kaiord/actions${NC}"
echo ""
echo "5. Verify provenance after publish:"
echo "   ${CYAN}npm view @kaiord/cli --json | jq '.dist.attestations'${NC}"
echo ""

# Step 7: Cleanup (optional)
echo -e "\n${BLUE}Step 7: Cleanup (Optional)${NC}"
echo ""
echo "If you previously used NPM_TOKEN, you can now remove it:"
echo ""
echo "Via GitHub CLI:"
echo "  ${CYAN}gh secret remove NPM_TOKEN --repo pablo-albaladejo/kaiord${NC}"
echo ""
echo "Or via GitHub UI:"
echo "  ${CYAN}https://github.com/pablo-albaladejo/kaiord/settings/secrets/actions${NC}"
echo ""

# Summary
echo -e "\n${GREEN}✅ Setup Complete!${NC}\n"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}What is Trusted Publishing?${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ No secrets needed - Uses OpenID Connect (OIDC)"
echo "✅ Automatic verification - npm verifies package origin"
echo "✅ Provenance attestation - Cryptographic proof"
echo "✅ No token rotation - No tokens to expire"
echo "✅ Better security - Eliminates token theft risk"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}Next Steps${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Test with a new version (see Step 6 above)"
echo "2. Verify provenance badge appears on npm"
echo "3. Remove NPM_TOKEN secret if you had one"
echo ""
echo "Documentation:"
echo "  ${CYAN}.github/NPM_TRUSTED_PUBLISHING.md${NC}"
echo ""
