#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== GitHub MCP Server Setup ===${NC}\n"

# Check if Docker is running
echo -e "${BLUE}[1/6]${NC} Checking Docker..."
if ! docker ps &> /dev/null; then
    echo -e "${RED}✗ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}\n"

# Check if token exists in .env
echo -e "${BLUE}[2/6]${NC} Checking for GitHub token in .env..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}! .env file not found${NC}"
    echo -e "${YELLOW}Creating .env file...${NC}"
    touch .env
fi

if ! grep -q "GITHUB_PERSONAL_ACCESS_TOKEN" .env; then
    echo -e "${YELLOW}! GITHUB_PERSONAL_ACCESS_TOKEN not found in .env${NC}"
    echo -e "${YELLOW}Please enter your GitHub Personal Access Token:${NC}"
    read -s TOKEN
    echo "GITHUB_PERSONAL_ACCESS_TOKEN=$TOKEN" >> .env
    echo -e "${GREEN}✓ Token added to .env${NC}\n"
else
    echo -e "${GREEN}✓ Token found in .env${NC}\n"
fi

# Load token from .env
source .env

if [ -z "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]; then
    echo -e "${RED}✗ GITHUB_PERSONAL_ACCESS_TOKEN is empty${NC}"
    exit 1
fi

# Verify token format
echo -e "${BLUE}[3/6]${NC} Verifying token format..."
if [[ ! $GITHUB_PERSONAL_ACCESS_TOKEN =~ ^(ghp_|github_pat_) ]]; then
    echo -e "${YELLOW}⚠ Token doesn't start with 'ghp_' or 'github_pat_'${NC}"
    echo -e "${YELLOW}  Make sure it's a valid GitHub Personal Access Token${NC}\n"
else
    echo -e "${GREEN}✓ Token format looks valid${NC}\n"
fi

# Add token to ~/.zshrc if not already there
echo -e "${BLUE}[4/6]${NC} Configuring shell environment..."
if ! grep -q "GITHUB_PERSONAL_ACCESS_TOKEN" ~/.zshrc 2>/dev/null; then
    echo -e "${YELLOW}Adding token to ~/.zshrc for persistence...${NC}"
    cat >> ~/.zshrc << EOF

# GitHub Personal Access Token for Kiro MCP
export GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN"
EOF
    echo -e "${GREEN}✓ Token added to ~/.zshrc${NC}\n"
else
    echo -e "${GREEN}✓ Token already in ~/.zshrc${NC}\n"
fi

# Test GitHub API access
echo -e "${BLUE}[5/6]${NC} Testing GitHub API access..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
    https://api.github.com/user)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ GitHub API authentication successful${NC}\n"
else
    echo -e "${RED}✗ GitHub API authentication failed (HTTP $HTTP_CODE)${NC}"
    echo -e "${YELLOW}  Please check your token permissions:${NC}"
    echo -e "${YELLOW}  - Go to GitHub → Settings → Developer settings → Personal access tokens${NC}"
    echo -e "${YELLOW}  - Ensure the token has 'repo' and 'read:org' scopes${NC}"
    echo -e "${YELLOW}  - Make sure the token hasn't expired${NC}\n"
    exit 1
fi

# Verify MCP configuration
echo -e "${BLUE}[6/6]${NC} Verifying MCP configuration..."
if [ ! -f .kiro/settings/mcp.json ]; then
    echo -e "${RED}✗ .kiro/settings/mcp.json not found${NC}"
    exit 1
fi

if ! grep -q '"github"' .kiro/settings/mcp.json; then
    echo -e "${RED}✗ GitHub MCP server not configured in mcp.json${NC}"
    exit 1
fi
echo -e "${GREEN}✓ MCP configuration found${NC}\n"

# Stop any existing GitHub MCP containers
echo -e "${BLUE}Cleaning up existing containers...${NC}"
EXISTING_CONTAINERS=$(docker ps -q --filter "ancestor=ghcr.io/github/github-mcp-server")
if [ -n "$EXISTING_CONTAINERS" ]; then
    echo -e "${YELLOW}Stopping existing GitHub MCP containers...${NC}"
    docker stop $EXISTING_CONTAINERS > /dev/null 2>&1 || true
    echo -e "${GREEN}✓ Containers stopped${NC}\n"
else
    echo -e "${GREEN}✓ No existing containers to clean up${NC}\n"
fi

# Final instructions
echo -e "${GREEN}=== Setup Complete! ===${NC}\n"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. ${BLUE}Restart Kiro completely${NC} (quit and reopen)"
echo -e "  2. ${BLUE}Reconnect the GitHub MCP server${NC} from the MCP Server panel"
echo -e "  3. ${BLUE}Test the connection${NC} by asking Kiro to use GitHub tools\n"
echo -e "${YELLOW}Note:${NC} If you opened Kiro from Finder/Dock, you may need to:"
echo -e "  - Open a new terminal"
echo -e "  - Run: ${BLUE}source ~/.zshrc${NC}"
echo -e "  - Launch Kiro from that terminal: ${BLUE}open -a Kiro${NC}\n"
echo -e "${GREEN}Token is configured and ready to use!${NC}"
