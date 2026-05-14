<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# assets/

Chrome Web Store promotional images (not loaded by the extension at runtime).

## Files

| File                         | Dimensions  | Purpose                                             |
| ---------------------------- | ----------- | --------------------------------------------------- |
| `marquee-promo-1400x560.png` | 1400×560 px | Chrome Web Store marquee banner (feature promotion) |
| `screenshot-1280x800.png`    | 1280×800 px | Chrome Web Store store listing screenshot           |
| `small-promo-440x280.png`    | 440×280 px  | Chrome Web Store small promo tile                   |

## Usage

These images are embedded in the Chrome Web Store listing via:

- **CWS Listing Page:** https://chrome.google.com/webstore/detail/[extension-id]
- **Release Workflow:** See `openspec/specs/cws-train2go-listing/` for store listing spec

Images are **not** referenced by `manifest.json` or extension code — they are uploaded separately to the Chrome Web Store developer dashboard during release.

## For AI Agents

- Do not modify, move, or delete these files — they are curated for the store listing
- Refer to `openspec/specs/cws-train2go-listing/` for store listing copy and image guidelines
- Update only when refreshing the visual branding or store listing description

<!-- MANUAL: Track Chrome Web Store listing approval dates and compliance notes here -->
