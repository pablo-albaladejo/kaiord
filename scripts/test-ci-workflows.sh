#!/bin/bash
# scripts/test-ci-workflows.sh
# Simulates GitHub Actions CI workflows locally to catch issues before pushing

set -e  # Exit on error

echo "🧪 Testing CI Workflows Locally"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test headers
print_test_header() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Helper function to print success
print_success() {
  echo -e "${GREEN}✅ $1${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
}

# Helper function to print failure
print_failure() {
  echo -e "${RED}❌ $1${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
}

# Helper function to print info
print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# ============================================
# Test 1: Core Build Test (Subtask 3.1)
# ============================================
print_test_header "Test 1: Core Build Test (Clean Environment)"

print_info "Simulating CI environment by removing build artifacts..."
rm -rf packages/core/dist packages/core/node_modules/.vite

print_info "Installing dependencies with frozen lockfile..."
if pnpm install --frozen-lockfile > /dev/null 2>&1; then
  print_success "Dependencies installed successfully"
else
  print_failure "Failed to install dependencies"
  exit 1
fi

print_info "Building core package..."
if pnpm --filter @kaiord/core build > /dev/null 2>&1; then
  print_success "Core package built successfully"
else
  print_failure "Core package build failed"
  exit 1
fi

print_info "Verifying core dist artifacts exist..."
if [ ! -d "packages/core/dist" ]; then
  print_failure "Core dist directory not found"
  exit 1
fi
print_success "Core dist directory exists"

print_info "Verifying TypeScript declaration files..."
if [ ! -f "packages/core/dist/index.d.ts" ]; then
  print_failure "TypeScript declaration files not found"
  exit 1
fi
print_success "TypeScript declaration files present"

print_info "Verifying JavaScript output files..."
if [ ! -f "packages/core/dist/index.js" ] && [ ! -f "packages/core/dist/index.mjs" ]; then
  print_failure "JavaScript output files not found"
  exit 1
fi
print_success "JavaScript output files present"

# ============================================
# Test 2: SPA Build Test (Subtask 3.2)
# ============================================
print_test_header "Test 2: SPA Build Test (With Core Dependency)"

print_info "Removing SPA build artifacts..."
rm -rf packages/workout-spa-editor/dist packages/workout-spa-editor/node_modules/.vite

print_info "Building SPA with core dependency..."
export VITE_BASE_PATH="/kaiord/"
if pnpm --filter @kaiord/workout-spa-editor build > /dev/null 2>&1; then
  print_success "SPA built successfully"
else
  print_failure "SPA build failed"
  exit 1
fi

print_info "Verifying SPA dist artifacts exist..."
if [ ! -d "packages/workout-spa-editor/dist" ]; then
  print_failure "SPA dist directory not found"
  exit 1
fi
print_success "SPA dist directory exists"

print_info "Verifying index.html exists..."
if [ ! -f "packages/workout-spa-editor/dist/index.html" ]; then
  print_failure "index.html not found"
  exit 1
fi
print_success "index.html present"

print_info "Verifying assets directory exists..."
if [ ! -d "packages/workout-spa-editor/dist/assets" ]; then
  print_failure "Assets directory not found"
  exit 1
fi
print_success "Assets directory present"

# ============================================
# Test 3: Dependency Order Test
# ============================================
print_test_header "Test 3: Dependency Order Validation"

print_info "Removing core dist to simulate missing dependency..."
rm -rf packages/core/dist

print_info "Attempting to build SPA without core (should fail)..."
if pnpm --filter @kaiord/workout-spa-editor build > /dev/null 2>&1; then
  print_failure "SPA should have failed without core dependency"
  exit 1
fi
print_success "SPA correctly fails without core dependency"

print_info "Rebuilding core package..."
if pnpm --filter @kaiord/core build > /dev/null 2>&1; then
  print_success "Core package rebuilt"
else
  print_failure "Failed to rebuild core package"
  exit 1
fi

print_info "Building SPA with core dependency..."
if pnpm --filter @kaiord/workout-spa-editor build > /dev/null 2>&1; then
  print_success "SPA builds successfully with core dependency"
else
  print_failure "SPA build failed with core dependency"
  exit 1
fi

# ============================================
# Test 4: Deployment Simulation (Subtask 3.3)
# ============================================
print_test_header "Test 4: Deployment Simulation (GitHub Pages)"

print_info "Verifying base path configuration in index.html..."
if grep -q 'src="/kaiord/' packages/workout-spa-editor/dist/index.html || \
   grep -q 'href="/kaiord/' packages/workout-spa-editor/dist/index.html; then
  print_success "Base path correctly configured in index.html"
else
  print_failure "Base path not found in index.html"
  echo "Expected: src=\"/kaiord/assets/...\" or href=\"/kaiord/assets/...\""
  echo "Found:"
  grep -E '(src|href)="' packages/workout-spa-editor/dist/index.html | head -n 3
  exit 1
fi

print_info "Verifying no hardcoded absolute paths..."
if grep -q 'src="http' packages/workout-spa-editor/dist/index.html || \
   grep -q 'href="http' packages/workout-spa-editor/dist/index.html; then
  print_failure "Found hardcoded absolute URLs in index.html"
  grep -E '(src|href)="http' packages/workout-spa-editor/dist/index.html
  exit 1
fi
print_success "No hardcoded absolute paths found"

print_info "Verifying artifact structure matches GitHub Pages requirements..."
if [ ! -f "packages/workout-spa-editor/dist/index.html" ]; then
  print_failure "index.html not at root of dist"
  exit 1
fi
print_success "index.html at root of dist"

if [ ! -d "packages/workout-spa-editor/dist/assets" ]; then
  print_failure "assets directory not found"
  exit 1
fi
print_success "assets directory present"

print_info "Checking for JavaScript bundles in assets..."
JS_COUNT=$(find packages/workout-spa-editor/dist/assets -name "*.js" | wc -l)
if [ "$JS_COUNT" -eq 0 ]; then
  print_failure "No JavaScript bundles found in assets"
  exit 1
fi
print_success "JavaScript bundles present ($JS_COUNT files)"

print_info "Checking for CSS bundles in assets..."
CSS_COUNT=$(find packages/workout-spa-editor/dist/assets -name "*.css" | wc -l)
if [ "$CSS_COUNT" -eq 0 ]; then
  print_failure "No CSS bundles found in assets"
  exit 1
fi
print_success "CSS bundles present ($CSS_COUNT files)"

print_info "Verifying sourcemaps are generated..."
SOURCEMAP_COUNT=$(find packages/workout-spa-editor/dist/assets -name "*.map" | wc -l)
if [ "$SOURCEMAP_COUNT" -eq 0 ]; then
  print_failure "No sourcemaps found"
  exit 1
fi
print_success "Sourcemaps present ($SOURCEMAP_COUNT files)"

# ============================================
# Test 5: Build Reproducibility
# ============================================
print_test_header "Test 5: Build Reproducibility"

print_info "Testing frozen lockfile enforcement..."
if pnpm install --frozen-lockfile > /dev/null 2>&1; then
  print_success "Frozen lockfile validation passed"
else
  print_failure "Frozen lockfile validation failed (lockfile may be out of sync)"
  exit 1
fi

print_info "Verifying pnpm-lock.yaml is up to date..."
if git diff --exit-code pnpm-lock.yaml > /dev/null 2>&1; then
  print_success "pnpm-lock.yaml is up to date"
else
  print_failure "pnpm-lock.yaml has uncommitted changes"
  exit 1
fi

# ============================================
# Summary
# ============================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Test Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
if [ "$TESTS_FAILED" -gt 0 ]; then
  echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}❌ Tests Failed: 0${NC}"
fi
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✅ All CI workflow tests passed!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}You can now safely push to GitHub.${NC}"
echo -e "${BLUE}The deployment workflow should succeed.${NC}"
echo ""
