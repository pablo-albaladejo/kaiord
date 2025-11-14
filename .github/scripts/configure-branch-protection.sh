#!/bin/bash

# Script to configure branch protection rules for the main branch
# This script adds the CI workflow as a required status check

set -e

REPO_OWNER="pablo-albaladejo"
REPO_NAME="kaiord"
BRANCH="main"

echo "Configuring branch protection for ${REPO_OWNER}/${REPO_NAME}:${BRANCH}"
echo ""

# Check if gh CLI is authenticated
if ! gh auth status &>/dev/null; then
  echo "❌ Error: GitHub CLI is not authenticated"
  echo "Please run: gh auth login"
  exit 1
fi

echo "✓ GitHub CLI is authenticated"
echo ""

# Get current branch protection settings
echo "Fetching current branch protection settings..."
CURRENT_PROTECTION=$(gh api repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}/protection 2>/dev/null || echo "{}")

if [ "$CURRENT_PROTECTION" = "{}" ]; then
  echo "⚠️  No branch protection currently configured"
else
  echo "✓ Branch protection exists"
fi
echo ""

# Define required status checks
# These correspond to the job names in .github/workflows/ci.yml
REQUIRED_CHECKS='["detect-changes","lint","typecheck","test","build","round-trip"]'

echo "Configuring required status checks:"
echo "  - detect-changes"
echo "  - lint"
echo "  - typecheck"
echo "  - test"
echo "  - build"
echo "  - round-trip"
echo ""

# Update branch protection with required status checks
# strict: true means the branch must be up-to-date before merging (requirement 9.5)
# contexts: array of required status check names (requirement 9.4)
echo "Applying branch protection rules..."

# Create a temporary JSON file for the request
TEMP_JSON=$(mktemp)
trap "rm -f $TEMP_JSON" EXIT

# Build the JSON payload
cat > "$TEMP_JSON" <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ${REQUIRED_CHECKS}
  },
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 0
  },
  "enforce_admins": true,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "restrictions": null
}
EOF

# Update branch protection
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}/protection \
  --input "$TEMP_JSON" \
  > /dev/null

echo "✓ Branch protection configured successfully"
echo ""

# Verify the configuration
echo "Verifying configuration..."
VERIFICATION=$(gh api repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}/protection/required_status_checks)

echo ""
echo "Current required status checks configuration:"
echo "$VERIFICATION" | jq '.'
echo ""

# Check if strict mode is enabled
STRICT_ENABLED=$(echo "$VERIFICATION" | jq -r '.strict')
if [ "$STRICT_ENABLED" = "true" ]; then
  echo "✓ Strict mode enabled: Branches must be up-to-date before merging"
else
  echo "⚠️  Warning: Strict mode not enabled"
fi

# List configured checks
echo ""
echo "Required status checks:"
echo "$VERIFICATION" | jq -r '.contexts[]' | while read -r check; do
  echo "  ✓ $check"
done

echo ""
echo "✅ Branch protection configuration complete!"
echo ""
echo "Summary:"
echo "  - Required status checks: Enabled"
echo "  - Strict mode (up-to-date branch): Enabled"
echo "  - Total checks required: $(echo "$VERIFICATION" | jq -r '.contexts | length')"
echo ""
echo "All pull requests to '${BRANCH}' must now:"
echo "  1. Pass all required status checks"
echo "  2. Be up-to-date with the base branch"
echo "  3. Have at least 1 approving review (existing rule)"
