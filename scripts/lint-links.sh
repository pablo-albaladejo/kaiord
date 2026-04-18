#!/usr/bin/env bash
# Run `lychee` against all project Markdown files that use
# filesystem-resolvable relative paths. Configuration lives in
# ./lychee.toml; path scoping (exclusion of node_modules, VitePress
# content, test artifacts, etc.) is applied here via `find` and
# mirrored in CI.

set -euo pipefail

mapfile -d '' MARKDOWN_FILES < <(
  find . -type f -name '*.md' \
    -not -path '*/node_modules/*' \
    -not -path '*/dist/*' \
    -not -path '*/coverage/*' \
    -not -path '*/.changeset/*' \
    -not -path '*/.claude/worktrees/*' \
    -not -path '*/generated-diagrams/*' \
    -not -path './openspec/changes/archive/README.md' \
    -not -path './packages/docs/api/*' \
    -not -path './packages/docs/guide/*' \
    -not -path './packages/docs/formats/*' \
    -not -path './packages/docs/cli/*' \
    -not -path './packages/docs/mcp/*' \
    -not -path './packages/docs/legal/*' \
    -not -path './packages/docs/index.md' \
    -not -path './packages/garmin/docs/*' \
    -not -path './packages/workout-spa-editor/playwright-report/*' \
    -not -path './packages/workout-spa-editor/docs/*' \
    -not -name 'THIRD-PARTY-LICENSES.md' \
    -print0
)

if [ "${#MARKDOWN_FILES[@]}" -eq 0 ]; then
  echo "No Markdown files to check."
  exit 0
fi

exec lychee --config lychee.toml "${MARKDOWN_FILES[@]}"
