<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# @kaiord/garmin-bridge/assets AGENTS.md

Chrome Web Store marketing and promotional assets.

## Purpose

**What lives here:** High-resolution promotional images and screenshots used in the Chrome Web Store listing.

**Core responsibility:** Provide visual assets for store discovery and install flow. Assets are static and do not require code changes.

## Key Files

- `small-promo-440x280.png` — Small promotional tile (440×280 px). Used as the extension's "small promo" image in the Web Store sidebar during discovery.
- `marquee-promo-1400x560.png` — Large marquee/hero image (1400×560 px). Used as the extension's featured promotional image at the top of the store listing page.
- `screenshot-1280x800.png` — Extension screenshot (1280×800 px). Shows the extension popup UI (status pill, athlete card, sync count). Displayed in the store listing below the description.

## Chrome Web Store Requirements

All assets must comply with Chrome Web Store submission guidelines:

- **Small promo (440×280)**: Safe area centered; no crucial content in outer 10% margins
- **Marquee (1400×560)**: High-resolution hero image; features the key value proposition
- **Screenshots (1280×800)**: Clear UI representation; shows actual extension UI to set user expectations

See `store-listing.md` for copy that accompanies these images.

## For AI Agents: Working in This Directory

- **Asset dimensions are fixed**: Chrome Web Store has strict size requirements. Do not resize or change formats without verifying store guidelines.
- **No code dependency**: These are static marketing assets. Do not reference them in code.
- **Update cycle**: Update when store listing copy changes (in `store-listing.md`) or when the extension UI is redesigned (in `popup.html` / `popup.css`).

## Brand & Design

Icons in `icons/` are extension UI icons (16×48×128 px). Assets in this directory are marketing/promotional images for the store listing.

## MANUAL

Non-generated files beyond the AI agent's responsibility:

- `small-promo-440x280.png`, `marquee-promo-1400x560.png`, `screenshot-1280x800.png` — Marketing asset files (update via design/product team)
- `store-listing.md` — Store listing copy (sibling of this directory; update via product team)
