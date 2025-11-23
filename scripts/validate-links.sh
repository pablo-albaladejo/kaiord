#!/bin/bash

# Link Validation Script for Kaiord Documentation
# This script validates all internal and external links in documentation files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_LINKS=0
BROKEN_LINKS=0
VALID_LINKS=0

# Arrays to store results
declare -a BROKEN_INTERNAL_LINKS
declare -a BROKEN_EXTERNAL_LINKS

echo "🔍 Validating documentation links..."
echo ""

# Function to check if a file exists
check_internal_link() {
    local file_path="$1"
    local source_file="$2"
    local link="$3"
    
    # Remove anchor from path
    local path_without_anchor="${file_path%%#*}"
    
    # Resolve relative path from source file directory
    local source_dir=$(dirname "$source_file")
    local resolved_path="$source_dir/$path_without_anchor"
    
    # Normalize path (remove ./ and ../)
    resolved_path=$(cd "$source_dir" && cd "$(dirname "$path_without_anchor")" 2>/dev/null && pwd)/$(basename "$path_without_anchor") 2>/dev/null || echo "$resolved_path"
    
    if [ -f "$resolved_path" ]; then
        echo -e "${GREEN}✓${NC} $link (in $source_file)"
        ((VALID_LINKS++))
        return 0
    else
        echo -e "${RED}✗${NC} $link (in $source_file) - File not found: $resolved_path"
        BROKEN_INTERNAL_LINKS+=("$source_file: $link -> $resolved_path")
        ((BROKEN_LINKS++))
        return 1
    fi
}

# Function to check external links
check_external_link() {
    local url="$1"
    local source_file="$2"
    local link="$3"
    
    # Use curl to check if URL is accessible
    if curl -s -f -L --head --max-time 10 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $link (in $source_file)"
        ((VALID_LINKS++))
        return 0
    else
        echo -e "${RED}✗${NC} $link (in $source_file) - URL not accessible: $url"
        BROKEN_EXTERNAL_LINKS+=("$source_file: $link -> $url")
        ((BROKEN_LINKS++))
        return 1
    fi
}

# Function to extract and validate links from a markdown file
validate_file_links() {
    local file="$1"
    
    echo ""
    echo "📄 Checking $file..."
    echo ""
    
    # Extract markdown links: [text](url)
    # This regex captures both the link text and URL
    while IFS= read -r match; do
        # Extract link text and URL
        link_text=$(echo "$match" | sed -E 's/\[([^]]+)\].*/\1/')
        url=$(echo "$match" | sed -E 's/.*\(([^)]+)\)/\1/')
        
        ((TOTAL_LINKS++))
        
        # Check if it's an external link (starts with http:// or https://)
        if [[ "$url" =~ ^https?:// ]]; then
            check_external_link "$url" "$file" "$link_text" || true
        elif [[ "$url" =~ ^# ]]; then
            # Anchor link within the same document - skip validation
            echo -e "${GREEN}✓${NC} $link_text (in $file) [anchor]"
            ((VALID_LINKS++))
        else
            # Internal link to another file
            check_internal_link "$url" "$file" "$link_text" || true
        fi
    done < <(grep -oE '\[([^]]+)\]\(([^)]+)\)' "$file" || true)
}

# Main validation
echo "Validating links in documentation files..."
echo ""

# Validate main documentation files
validate_file_links "README.md"
validate_file_links "CONTRIBUTING.md"
validate_file_links "docs/README.md"
validate_file_links "docs/getting-started.md"
validate_file_links "docs/architecture.md"
validate_file_links "docs/testing.md"
validate_file_links "docs/deployment.md"
validate_file_links "docs/krd-format.md"
validate_file_links "docs/agents.md"

# Validate package README files
validate_file_links "packages/core/README.md"
validate_file_links "packages/cli/README.md"
validate_file_links "packages/workout-spa-editor/README.md"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Link Validation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total links checked: $TOTAL_LINKS"
echo -e "${GREEN}Valid links: $VALID_LINKS${NC}"
echo -e "${RED}Broken links: $BROKEN_LINKS${NC}"
echo ""

# Report broken links
if [ $BROKEN_LINKS -gt 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ Broken Links Report"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    if [ ${#BROKEN_INTERNAL_LINKS[@]} -gt 0 ]; then
        echo "🔗 Broken Internal Links:"
        echo ""
        for link in "${BROKEN_INTERNAL_LINKS[@]}"; do
            echo "  • $link"
        done
        echo ""
    fi
    
    if [ ${#BROKEN_EXTERNAL_LINKS[@]} -gt 0 ]; then
        echo "🌐 Broken External Links:"
        echo ""
        for link in "${BROKEN_EXTERNAL_LINKS[@]}"; do
            echo "  • $link"
        done
        echo ""
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${RED}❌ Link validation failed with $BROKEN_LINKS broken link(s)${NC}"
    exit 1
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${GREEN}✅ All links are valid!${NC}"
    exit 0
fi
