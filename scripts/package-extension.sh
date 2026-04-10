#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."
PKG_DIR="$ROOT/packages/garmin-bridge"

# ── Pre-flight checks ──

if [ ! -f "$PKG_DIR/manifest.prod.json" ]; then
  echo "ERROR: manifest.prod.json not found at $PKG_DIR/manifest.prod.json" >&2
  exit 1
fi

if [ ! -d "$PKG_DIR/icons" ] || [ -z "$(ls "$PKG_DIR/icons"/*.png 2>/dev/null)" ]; then
  echo "ERROR: icons/ directory missing or empty at $PKG_DIR/icons/" >&2
  exit 1
fi

VERSION=$(node -e "const p=JSON.parse(require('fs').readFileSync('$PKG_DIR/package.json','utf8')); if(!p.version){process.exit(1)}; console.log(p.version)" 2>/dev/null)
if [ -z "$VERSION" ]; then
  echo "ERROR: could not read version from $PKG_DIR/package.json" >&2
  exit 1
fi

MANIFEST_VERSION=$(node -e "const m=JSON.parse(require('fs').readFileSync('$PKG_DIR/manifest.prod.json','utf8')); if(!m.version){process.exit(1)}; console.log(m.version)" 2>/dev/null)
if [ -z "$MANIFEST_VERSION" ] || [ "$MANIFEST_VERSION" != "$VERSION" ]; then
  echo "ERROR: version mismatch (package.json=$VERSION, manifest.prod.json=$MANIFEST_VERSION)" >&2
  exit 1
fi

echo "Packaging Kaiord Garmin Bridge v$VERSION..."

# ── Assemble files (whitelist approach) ──

DIST_DIR="$PKG_DIR/dist"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$TMP_DIR/icons"
mkdir -p "$DIST_DIR"

cp "$PKG_DIR/manifest.prod.json" "$TMP_DIR/manifest.json"
cp "$PKG_DIR/background.js" "$TMP_DIR/"
cp "$PKG_DIR/content.js" "$TMP_DIR/"
cp "$PKG_DIR/popup.html" "$TMP_DIR/"
cp "$PKG_DIR/popup.js" "$TMP_DIR/"
cp "$PKG_DIR/icons"/*.png "$TMP_DIR/icons/"

# ── Create zip ──

ZIP_NAME="kaiord-garmin-bridge-${VERSION}.zip"
(cd "$TMP_DIR" && zip -r "$DIST_DIR/$ZIP_NAME" .)

# ── Post-build verification ──

if grep -q "localhost" "$TMP_DIR/manifest.json"; then
  echo "ERROR: packaged manifest.json contains localhost origins!" >&2
  exit 1
fi

FILE_COUNT=$(unzip -l "$DIST_DIR/$ZIP_NAME" | grep -c "\.png\|\.js\|\.html\|\.json")
echo "Zip contains $FILE_COUNT files (expected 8)"
if [ "$FILE_COUNT" -ne 8 ]; then
  echo "ERROR: unexpected file count in zip" >&2
  exit 1
fi

echo "Done! Package: $DIST_DIR/$ZIP_NAME"
