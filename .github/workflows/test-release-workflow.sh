#!/bin/bash

# Test script for release workflow validation
# This script tests the various components of the release workflow locally

set -e

echo "=========================================="
echo "Release Workflow Test Suite"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
  local test_name="$1"
  local test_command="$2"
  
  echo -e "${YELLOW}Testing:${NC} $test_name"
  
  if eval "$test_command"; then
    echo -e "${GREEN}✓ PASS${NC}: $test_name"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC}: $test_name"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  echo ""
}

# Test 1: Changeset status (should succeed even with no changesets)
run_test "Changeset status check" "pnpm exec changeset status 2>&1 || true"

# Test 2: Build all packages
run_test "Build all packages" "pnpm -r build > /dev/null 2>&1"

# Test 3: Version detection logic
run_test "Version detection logic" '
  CORE_VERSION=$(node -p "require(\"./packages/core/package.json\").version")
  CORE_NPM_VERSION=$(npm view @kaiord/core version 2>/dev/null || echo "0.0.0")
  [ "$CORE_VERSION" != "$CORE_NPM_VERSION" ]
'

# Test 4: Publish dry-run
run_test "Publish dry-run (@kaiord/core)" "pnpm --filter @kaiord/core publish --dry-run --access public --no-git-checks > /dev/null 2>&1"

# Test 5: Retry logic validation (check workflow file)
run_test "Retry logic exists in workflow" "grep -q 'retry_publish' .github/workflows/release.yml"

# Test 6: Exponential backoff validation
run_test "Exponential backoff configured" "grep -q 'delay=\$((delay \* 2))' .github/workflows/release.yml"

# Test 7: Failure notification validation
run_test "Failure notification configured" "grep -q 'Create failure issue' .github/workflows/release.yml"

# Test 8: Changesets workflow exists
run_test "Changesets workflow exists" "[ -f .github/workflows/changesets.yml ]"

# Test 9: Release workflow exists
run_test "Release workflow exists" "[ -f .github/workflows/release.yml ]"

# Test 10: Changesets config valid
run_test "Changesets config valid" "[ -f .changeset/config.json ]"

# Test 11: NPM_TOKEN placeholder check
run_test "NPM_TOKEN secret referenced" "grep -q 'NPM_TOKEN' .github/workflows/release.yml"

# Test 12: GitHub release creation logic
run_test "GitHub release creation configured" "grep -q 'createRelease' .github/workflows/changesets.yml"

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Failed:${NC} $TESTS_FAILED"
echo "Total: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
