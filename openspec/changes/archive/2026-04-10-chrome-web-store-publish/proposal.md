> Completed: 2026-04-10

## Why

The `@kaiord/garmin-bridge` extension is fully functional but only usable via "Load unpacked" in developer mode. Publishing to the Chrome Web Store makes it installable by any user, which is required for the SPA workout editor to offer Garmin Connect integration to end users. Additionally, the Chrome Web Store requires a privacy policy URL, which Kaiord currently lacks entirely.

## What Changes

- Generate production-ready extension icons (16x16, 48x48, 128x128 PNG) from the existing `favicon.svg` brand asset
- Create a production manifest that removes localhost origins from `externally_connectable`
- Add a privacy policy page to the docs site (`kaiord.com/docs/legal/privacy-policy`)
- Create a packaging script that produces a clean `.zip` for CWS upload
- Prepare Chrome Web Store listing assets (description, screenshots, category)
- Document the CWS submission and review process

## Capabilities

### New Capabilities

- `extension-store-publish`: Packaging, store assets, and submission process for publishing the Garmin Bridge extension to the Chrome Web Store
- `privacy-policy`: Project-wide privacy policy covering the extension, SPA, and docs site

### Modified Capabilities

- `garmin-bridge`: Production manifest variant removes localhost from `externally_connectable`; real icons replace 1x1 placeholders (48/128) and add a new 16x16 icon

## Impact

- **Packages affected**: `@kaiord/garmin-bridge`, `@kaiord/docs` (new privacy policy page)
- **Hexagonal layers**: Infrastructure only (adapter packaging, no domain/application changes)
- **APIs**: No breaking changes — the extension message API is unchanged
- **Dependencies**: No new runtime dependencies; `@resvg/resvg-js` added as root devDependency for SVG→PNG icon rasterization
- **External systems**: Chrome Web Store (new listing), `kaiord.com/docs` (new page)
- **Manual steps required**: Developer account creation ($5), CWS dashboard submission, review wait
