<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# icons/

Extension icons for the Chrome Web Store listing and browser toolbar. Referenced by `manifest.json`.

## Files

| File          | Dimensions | Purpose                                   |
| ------------- | ---------- | ----------------------------------------- |
| `icon16.png`  | 16×16 px   | Favicon-sized icon (browser tab fallback) |
| `icon48.png`  | 48×48 px   | Popup UI icon (toolbar button)            |
| `icon128.png` | 128×128 px | Chrome Web Store icon (store listing)     |

## Manifest References

```json
{
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
}
```

## Icon Design Guidelines

- **Format:** PNG with alpha transparency
- **Color scheme:** Matches Kaiord branding (see `openspec/specs/cws-train2go-listing/`)
- **Safe area:** Center 80% of each dimension (avoid edge artifacts on smallest sizes)
- **Scalability:** Icons are rasterized, not SVG

## For AI Agents

- Do not modify or replace icons without brand approval
- Maintain all three sizes; Chrome enforces declared sizes
- Ensure icons remain visible on both light and dark toolbar backgrounds
- Refer to `openspec/specs/cws-train2go-listing/` for branding standards

<!-- MANUAL: Log icon design versions and store compliance feedback here -->
