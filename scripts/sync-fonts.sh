#!/usr/bin/env bash
# Sync canonical font files to all surface public directories.
# Run this when updating the Inter font version.
#
# After running, also update these files if the filename changed:
#   1. styles/brand-tokens.css (@font-face src)
#   2. packages/docs/.vitepress/theme/custom.css (@font-face override)
#   3. packages/workout-spa-editor/src/index.css (@font-face override)
#   4. packages/landing/index.html (preload href)
#   5. packages/workout-spa-editor/index.html (preload href)
#   6. packages/docs/.vitepress/config.ts (preload href in head)
#
# If unicode-range or font-weight range changes (new Inter version),
# also update the @font-face blocks in custom.css and index.css.
#
# Total touchpoints: 4 font copies + 6 path references = 10 edits
#   (+ 2 @font-face property updates if unicode-range changes)

set -euo pipefail

SRC="styles/fonts"
for dest in \
  packages/landing/public/fonts \
  packages/docs/.vitepress/public/fonts \
  packages/workout-spa-editor/public/fonts; do
  mkdir -p "$dest"
  cp "$SRC"/* "$dest"/
done
echo "Fonts synced to all surfaces."
