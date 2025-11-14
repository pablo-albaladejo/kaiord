#!/bin/bash

# Test script for Security Audit workflow
# This script helps test the security audit workflow locally and verify its behavior

# Don't exit on error - we want to collect all test results
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    ((TESTS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Test 1: Verify workflow file exists and is valid
test_workflow_exists() {
    print_header "Test 1: Verify Security Audit Workflow File"
    
    if [ -f ".github/workflows/security.yml" ]; then
        print_success "Workflow file exists"
    else
        print_error "Workflow file not found"
        return 1
    fi
    
    # Check if workflow has required triggers
    if grep -q "workflow_dispatch:" ".github/workflows/security.yml"; then
        print_success "Manual trigger (workflow_dispatch) configured"
    else
        print_error "Manual trigger not found"
    fi
    
    if grep -q "schedule:" ".github/workflows/security.yml"; then
        print_success "Scheduled trigger configured"
    else
        print_error "Scheduled trigger not found"
    fi
    
    if grep -q "pull_request:" ".github/workflows/security.yml"; then
        print_success "PR trigger configured"
    else
        print_error "PR trigger not found"
    fi
}

# Test 2: Verify schedule configuration
test_schedule_config() {
    print_header "Test 2: Verify Schedule Configuration"
    
    # Check for Monday 9 AM UTC schedule
    if grep -q '0 9 \* \* 1' ".github/workflows/security.yml"; then
        print_success "Weekly schedule configured (Mondays at 9 AM UTC)"
    else
        print_error "Schedule not configured correctly"
    fi
}

# Test 3: Verify permissions
test_permissions() {
    print_header "Test 3: Verify Workflow Permissions"
    
    if grep -q "contents: read" ".github/workflows/security.yml"; then
        print_success "Contents read permission configured"
    else
        print_error "Contents read permission missing"
    fi
    
    if grep -q "issues: write" ".github/workflows/security.yml"; then
        print_success "Issues write permission configured"
    else
        print_error "Issues write permission missing"
    fi
    
    if grep -q "pull-requests: write" ".github/workflows/security.yml"; then
        print_success "Pull requests write permission configured"
    else
        print_error "Pull requests write permission missing"
    fi
}

# Test 4: Run local audit
test_local_audit() {
    print_header "Test 4: Run Local Security Audit"
    
    print_info "Running pnpm audit..."
    
    # Run audit and capture output
    if pnpm audit --audit-level=moderate --json > /tmp/audit-results.json 2>&1; then
        AUDIT_EXIT_CODE=0
    else
        AUDIT_EXIT_CODE=$?
    fi
    
    if [ -f "/tmp/audit-results.json" ]; then
        print_success "Audit completed and generated results"
        
        # Try to parse results (requires jq)
        if command -v jq &> /dev/null; then
            # Count vulnerabilities by severity
            INFO=$(jq '[.advisories | to_entries[] | select(.value.severity == "info")] | length' /tmp/audit-results.json 2>/dev/null || echo "0")
            LOW=$(jq '[.advisories | to_entries[] | select(.value.severity == "low")] | length' /tmp/audit-results.json 2>/dev/null || echo "0")
            MODERATE=$(jq '[.advisories | to_entries[] | select(.value.severity == "moderate")] | length' /tmp/audit-results.json 2>/dev/null || echo "0")
            HIGH=$(jq '[.advisories | to_entries[] | select(.value.severity == "high")] | length' /tmp/audit-results.json 2>/dev/null || echo "0")
            CRITICAL=$(jq '[.advisories | to_entries[] | select(.value.severity == "critical")] | length' /tmp/audit-results.json 2>/dev/null || echo "0")
            
            TOTAL=$((INFO + LOW + MODERATE + HIGH + CRITICAL))
            
            print_info "Vulnerability Summary:"
            echo "  Critical: $CRITICAL"
            echo "  High: $HIGH"
            echo "  Moderate: $MODERATE"
            echo "  Low: $LOW"
            echo "  Info: $INFO"
            echo "  Total: $TOTAL"
            
            if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
                print_warning "High or critical vulnerabilities detected"
                print_info "Workflow would FAIL and create GitHub issue"
            elif [ "$MODERATE" -gt 0 ] || [ "$LOW" -gt 0 ]; then
                print_warning "Moderate or low vulnerabilities detected"
                print_info "Workflow would PASS with warning"
            else
                print_success "No vulnerabilities detected"
                print_info "Workflow would PASS"
            fi
        else
            print_warning "jq not installed, skipping detailed analysis"
            print_info "Install jq to see vulnerability breakdown: brew install jq (macOS) or apt-get install jq (Linux)"
        fi
    else
        print_error "Audit did not generate results file"
    fi
    
    # Cleanup
    rm -f /tmp/audit-results.json
}

# Test 5: Verify workflow steps
test_workflow_steps() {
    print_header "Test 5: Verify Workflow Steps"
    
    REQUIRED_STEPS=(
        "Checkout code"
        "Setup Node.js"
        "Setup pnpm"
        "Install dependencies"
        "Run security audit"
        "Display audit summary"
        "Comment on PR with vulnerability summary"
        "Create GitHub issue for critical vulnerabilities"
        "Fail workflow if critical vulnerabilities found"
    )
    
    for step in "${REQUIRED_STEPS[@]}"; do
        if grep -q "$step" ".github/workflows/security.yml"; then
            print_success "Step found: $step"
        else
            print_error "Step missing: $step"
        fi
    done
}

# Test 6: Verify PR path filters
test_pr_filters() {
    print_header "Test 6: Verify PR Path Filters"
    
    REQUIRED_PATHS=(
        "package.json"
        "pnpm-lock.yaml"
        "packages/*/package.json"
    )
    
    for path in "${REQUIRED_PATHS[@]}"; do
        # Escape special characters for grep
        escaped_path=$(echo "$path" | sed 's/\*/\\*/g')
        if grep -q "$escaped_path" ".github/workflows/security.yml"; then
            print_success "Path filter found: $path"
        else
            print_error "Path filter missing: $path"
        fi
    done
}

# Test 7: Check for GitHub CLI availability
test_gh_cli() {
    print_header "Test 7: Check GitHub CLI Availability"
    
    if command -v gh &> /dev/null; then
        print_success "GitHub CLI (gh) is installed"
        
        # Check if authenticated
        if gh auth status &> /dev/null; then
            print_success "GitHub CLI is authenticated"
            
            print_info "You can trigger the workflow manually with:"
            echo "  gh workflow run security.yml"
            echo ""
            print_info "You can view workflow runs with:"
            echo "  gh run list --workflow=security.yml"
        else
            print_warning "GitHub CLI is not authenticated"
            print_info "Authenticate with: gh auth login"
        fi
    else
        print_warning "GitHub CLI (gh) is not installed"
        print_info "Install from: https://cli.github.com/"
    fi
}

# Test 8: Verify issue creation logic
test_issue_creation_logic() {
    print_header "Test 8: Verify Issue Creation Logic"
    
    # Check that issue creation only happens for non-PR events
    if grep -q "github.event_name != 'pull_request'" ".github/workflows/security.yml"; then
        print_success "Issue creation skips PR events"
    else
        print_error "Issue creation logic may run on PRs"
    fi
    
    # Check that issue creation only happens for critical vulnerabilities
    if grep -q "steps.audit.outputs.has_critical == 'true'" ".github/workflows/security.yml"; then
        print_success "Issue creation only for critical vulnerabilities"
    else
        print_error "Issue creation logic not properly gated"
    fi
}

# Main execution
main() {
    print_header "Security Audit Workflow Test Suite"
    
    print_info "This script tests the Security Audit workflow configuration and behavior"
    print_info "Repository: $(git remote get-url origin 2>/dev/null || echo 'Unknown')"
    print_info "Branch: $(git branch --show-current 2>/dev/null || echo 'Unknown')"
    echo ""
    
    # Run all tests
    test_workflow_exists
    test_schedule_config
    test_permissions
    test_workflow_steps
    test_pr_filters
    test_issue_creation_logic
    test_local_audit
    test_gh_cli
    
    # Print summary
    print_header "Test Summary"
    
    TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
    
    echo -e "Total Tests: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        print_success "All tests passed!"
        echo ""
        print_info "Next steps:"
        echo "  1. Trigger the workflow manually: gh workflow run security.yml"
        echo "  2. Create a test PR with dependency changes"
        echo "  3. Verify weekly scheduled runs are working"
        echo "  4. Check that issues are created for critical vulnerabilities"
        echo ""
        exit 0
    else
        print_error "Some tests failed. Please review the output above."
        echo ""
        exit 1
    fi
}

# Run main function
main
