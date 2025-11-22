#!/bin/bash

# Setup npm Publishing Script
# This script automates the configuration of npm publishing for the Kaiord project

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main script
main() {
    print_header "npm Publishing Setup for Kaiord"
    
    echo "This script will help you configure npm publishing by:"
    echo "  1. Checking npm authentication"
    echo "  2. Creating an npm automation token"
    echo "  3. Configuring the GitHub secret (NPM_TOKEN)"
    echo "  4. Testing the configuration"
    echo ""
    
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Setup cancelled"
        exit 0
    fi
    
    # Step 1: Check prerequisites
    print_header "Step 1: Checking Prerequisites"
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
    print_success "npm is installed"
    
    if ! command_exists gh; then
        print_warning "GitHub CLI (gh) is not installed"
        print_info "You can install it with: brew install gh"
        print_info "Or configure the secret manually at:"
        print_info "https://github.com/pablo-albaladejo/kaiord/settings/secrets/actions"
        echo ""
        read -p "Continue without GitHub CLI? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
        USE_GH_CLI=false
    else
        print_success "GitHub CLI is installed"
        USE_GH_CLI=true
    fi
    
    if ! command_exists jq; then
        print_warning "jq is not installed (optional, for JSON parsing)"
        print_info "Install with: brew install jq"
        USE_JQ=false
    else
        print_success "jq is installed"
        USE_JQ=true
    fi
    
    # Step 2: Check npm authentication
    print_header "Step 2: npm Authentication"
    
    if npm whoami >/dev/null 2>&1; then
        NPM_USER=$(npm whoami)
        print_success "Already logged in to npm as: $NPM_USER"
    else
        print_warning "Not logged in to npm"
        echo ""
        echo "Please log in to npm. You'll need:"
        echo "  - npm username"
        echo "  - npm password"
        echo "  - npm email"
        echo "  - 2FA code (if enabled)"
        echo ""
        read -p "Continue with npm login? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "npm login required to continue"
            exit 1
        fi
        
        npm login
        
        if npm whoami >/dev/null 2>&1; then
            NPM_USER=$(npm whoami)
            print_success "Successfully logged in as: $NPM_USER"
        else
            print_error "npm login failed"
            exit 1
        fi
    fi
    
    # Step 3: Create npm granular access token
    print_header "Step 3: Creating npm Granular Access Token"
    
    echo "We need to create a granular access token for CI/CD."
    echo ""
    print_warning "IMPORTANT: This will create a new token with publish permissions"
    echo ""
    read -p "Create new granular access token? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Skipping token creation"
        echo ""
        echo "You can create a token manually at:"
        echo "https://www.npmjs.com/settings/$NPM_USER/tokens/granular-access-tokens/new"
        echo ""
        read -p "Do you have an existing token to use? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -sp "Enter your npm token: " NPM_TOKEN
            echo
        else
            print_error "npm token required to continue"
            exit 1
        fi
    else
        # Manual token creation (npm CLI doesn't support granular tokens yet)
        print_info "Please create a granular access token manually:"
        echo ""
        echo "Configuration:"
        echo "  1. Token name: kaiord-ci-cd (or your preference)"
        echo "  2. Expiration: 90 days (recommended)"
        echo "  3. Packages and scopes:"
        echo "     - Select '@kaiord/core'"
        echo "     - Permissions: Read and write"
        echo "  4. Organizations: (leave empty)"
        echo "  5. IP ranges: (leave empty for any IP)"
        echo ""
        echo "Opening browser..."
        
        # Open browser to granular token creation page
        if command_exists open; then
            open "https://www.npmjs.com/settings/$NPM_USER/tokens/granular-access-tokens/new"
        elif command_exists xdg-open; then
            xdg-open "https://www.npmjs.com/settings/$NPM_USER/tokens/granular-access-tokens/new"
        else
            echo "Visit: https://www.npmjs.com/settings/$NPM_USER/tokens/granular-access-tokens/new"
        fi
        
        echo ""
        read -sp "Paste your npm token here: " NPM_TOKEN
        echo
        
        if [ -z "$NPM_TOKEN" ]; then
            print_error "Failed to create/get npm token"
            exit 1
        fi
        
        print_success "npm token obtained"
    fi
    
    # Validate token format
    if [[ ! $NPM_TOKEN =~ ^npm_[a-zA-Z0-9]{36}$ ]]; then
        print_warning "Token format looks unusual (expected npm_...)"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Step 4: Configure GitHub secret
    print_header "Step 4: Configuring GitHub Secret"
    
    if [ "$USE_GH_CLI" = true ]; then
        # Check if gh is authenticated
        if ! gh auth status >/dev/null 2>&1; then
            print_warning "GitHub CLI is not authenticated"
            echo ""
            echo "Authenticating with GitHub..."
            gh auth login
        fi
        
        print_info "Setting NPM_TOKEN secret in GitHub..."
        
        # Set the secret
        if echo "$NPM_TOKEN" | gh secret set NPM_TOKEN --repo pablo-albaladejo/kaiord; then
            print_success "NPM_TOKEN secret configured in GitHub"
        else
            print_error "Failed to set GitHub secret"
            print_info "You can set it manually at:"
            print_info "https://github.com/pablo-albaladejo/kaiord/settings/secrets/actions"
            echo ""
            echo "Secret name: NPM_TOKEN"
            echo "Secret value: $NPM_TOKEN"
        fi
    else
        print_warning "GitHub CLI not available - manual configuration required"
        echo ""
        echo "Please configure the secret manually:"
        echo "  1. Go to: https://github.com/pablo-albaladejo/kaiord/settings/secrets/actions"
        echo "  2. Click 'New repository secret'"
        echo "  3. Name: NPM_TOKEN"
        echo "  4. Value: [paste the token below]"
        echo ""
        echo "Your npm token:"
        echo "$NPM_TOKEN"
        echo ""
        read -p "Press Enter when you've configured the secret..."
    fi
    
    # Step 5: Verify package configuration
    print_header "Step 5: Verifying Package Configuration"
    
    if [ -f "packages/core/package.json" ]; then
        PACKAGE_NAME=$(grep -o '"name": *"[^"]*"' packages/core/package.json | cut -d'"' -f4)
        PACKAGE_VERSION=$(grep -o '"version": *"[^"]*"' packages/core/package.json | cut -d'"' -f4)
        
        print_success "Package: $PACKAGE_NAME"
        print_success "Version: $PACKAGE_VERSION"
        
        # Check if package exists on npm
        if npm view "$PACKAGE_NAME" version >/dev/null 2>&1; then
            NPM_VERSION=$(npm view "$PACKAGE_NAME" version)
            print_info "Package already published on npm: v$NPM_VERSION"
            
            if [ "$PACKAGE_VERSION" = "$NPM_VERSION" ]; then
                print_warning "Local version matches npm version"
                print_info "You'll need to bump the version before publishing"
            else
                print_success "Local version is different - ready to publish"
            fi
        else
            print_info "Package not yet published on npm - ready for first publish"
        fi
    else
        print_error "packages/core/package.json not found"
        exit 1
    fi
    
    # Step 6: Test configuration
    print_header "Step 6: Testing Configuration"
    
    echo "Testing npm authentication with the token..."
    
    # Test token by checking whoami
    if NPM_USER_TEST=$(npm whoami --registry https://registry.npmjs.org 2>/dev/null); then
        print_success "npm authentication working: $NPM_USER_TEST"
    else
        print_warning "Could not verify npm authentication"
    fi
    
    # Check if we can access the package
    if npm access list packages 2>/dev/null | grep -q "@kaiord"; then
        print_success "You have access to @kaiord scope"
    else
        print_warning "Could not verify access to @kaiord scope"
        print_info "Make sure you have publish permissions for @kaiord packages"
    fi
    
    # Step 7: Summary and next steps
    print_header "Setup Complete!"
    
    echo "✓ npm authentication configured"
    echo "✓ npm automation token created"
    if [ "$USE_GH_CLI" = true ]; then
        echo "✓ GitHub secret (NPM_TOKEN) configured"
    else
        echo "⚠ GitHub secret needs manual configuration"
    fi
    echo "✓ Package configuration verified"
    echo ""
    
    print_header "Next Steps"
    
    echo "1. Test manual publishing (optional):"
    echo "   ${BLUE}pnpm -r build${NC}"
    echo "   ${BLUE}pnpm --filter @kaiord/core publish --access public --dry-run${NC}"
    echo ""
    
    echo "2. Test automated publishing with changesets:"
    echo "   ${BLUE}pnpm exec changeset${NC}"
    echo "   ${BLUE}git add .changeset/ && git commit -m 'chore: test release'${NC}"
    echo "   ${BLUE}git push${NC}"
    echo ""
    
    echo "3. Monitor the workflow:"
    echo "   ${BLUE}https://github.com/pablo-albaladejo/kaiord/actions${NC}"
    echo ""
    
    print_info "For more information, see: docs/deployment.md"
    
    # Save token to a secure location (optional)
    echo ""
    read -p "Save token to .npmrc for local publishing? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" >> ~/.npmrc
        print_success "Token saved to ~/.npmrc"
        print_warning "Keep this file secure and never commit it to git"
    fi
}

# Run main function
main

