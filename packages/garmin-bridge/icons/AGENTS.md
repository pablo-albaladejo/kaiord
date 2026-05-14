<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# @kaiord/garmin-bridge/icons AGENTS.md

Extension icon assets referenced by manifest and extension UI.

## Purpose

**What lives here:** PNG icon files (16×16, 48×48, 128×128) used by the extension toolbar button and Chrome Web Store listing.

**Core responsibility:** Provide icon assets at declared sizes for the extension UI and store listing. Icons are static and do not require code changes.

## Key Files

- `icon16.png` — Favicon size (16×16 px). Used in browser tab and extension list.
- `icon48.png` — Toolbar button default icon (48×48 px). Displayed on extension icon click.
- `icon128.png` — Chrome Web Store store listing icon (128×128 px). Displayed in extension store search results and install button.

## Manifest References

Icons are declared in `manifest.json` and `manifest.prod.json`:

```json
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
},
"action": {
  "default_icon": {
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

## For AI Agents: Working in This Directory

- **Icon sizes are fixed**: Chrome Extension API expects exactly 16, 48, and 128 pixel PNG files. Do not resize or change formats.
- **Brand consistency**: Icons use the Kaiord brand color scheme (see `assets/` for branding guidelines).
- **No code changes needed**: This directory is read-only from an agent perspective. Update only when the brand identity changes.

## MANUAL

Non-generated files beyond the AI agent's responsibility:

- `icon16.png`, `icon48.png`, `icon128.png` — Brand asset files (update via design team)
