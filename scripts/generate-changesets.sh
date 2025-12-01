#!/bin/bash
set -e

# Auto-generate changesets for changed packages
# Usage: ./scripts/generate-changesets.sh <core_changed> <cli_changed> <commit_sha>

CORE_CHANGED="${1:-false}"
CLI_CHANGED="${2:-false}"
COMMIT_SHA="${3:-unknown}"

# Remove any existing auto-generated changesets
rm -f .changeset/auto-*.md

# Create changeset for core if changed
if [ "$CORE_CHANGED" = "true" ]; then
  TIMESTAMP=$(date +%s)
  cat > ".changeset/auto-core-${TIMESTAMP}.md" << EOF
---
"@kaiord/core": patch
---

Automated release from commit ${COMMIT_SHA}
EOF
  echo "✅ Created changeset for @kaiord/core"
fi

# Create changeset for cli if changed
if [ "$CLI_CHANGED" = "true" ]; then
  TIMESTAMP=$(date +%s)
  cat > ".changeset/auto-cli-${TIMESTAMP}.md" << EOF
---
"@kaiord/cli": patch
---

Automated release from commit ${COMMIT_SHA}
EOF
  echo "✅ Created changeset for @kaiord/cli"
fi

echo "✅ Changesets generated successfully"
