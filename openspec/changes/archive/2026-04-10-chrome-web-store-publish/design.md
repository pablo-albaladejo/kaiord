## Context

The `@kaiord/garmin-bridge` Chrome extension is feature-complete and tested, but only installable via developer mode ("Load unpacked"). To reach end users, it must be published to the Chrome Web Store. This requires:

1. Real icons (current ones are 1x1px placeholders)
2. A production manifest (no localhost origins)
3. A privacy policy URL (CWS requirement for extensions with `host_permissions`)
4. A `.zip` package for upload
5. Store listing metadata (description, screenshots, category)

The extension code itself does not change — this is purely a packaging and distribution concern.

## Goals / Non-Goals

**Goals:**

- Produce a CWS-ready `.zip` with production manifest and real icons
- Add a privacy policy page to `kaiord.com/docs`
- Document the submission process so it's repeatable
- Keep dev workflow unchanged (Load unpacked still works)

**Non-Goals:**

- Firefox Add-ons support (blocked by `externally_connectable` gap — separate change)
- CI/CD auto-publish pipeline (premature for v0.1.0 with low release cadence)
- Code changes to the extension logic (background.js, content.js, popup.js)
- TypeScript migration of extension code (separate concern)

## Decisions

### D1: Icon generation — SVG rasterization with `resvg-js`

Generate PNG icons from `assets/favicon.svg` using a Node.js script with `@resvg/resvg-js` (pure Rust WASM, no native deps, no canvas). The SVG already contains the brand colors (`#0284c7` on `#0f172a` with rounded corners), so no post-processing is needed — the script only rasterizes at the target sizes.

**Alternatives considered:**

- **ImageMagick/Inkscape CLI**: Requires system-level install, not portable across dev machines
- **sharp**: Heavy native dependency (libvips), overkill for SVG→PNG
- **Manual export from Figma**: Not reproducible, requires design tool access

**Output sizes:** 16x16, 48x48, 128x128 PNG. Written to `packages/garmin-bridge/icons/`.

**Layer:** Infrastructure (build tooling, no domain impact).

### D2: Dual manifests — dev vs. production

Both manifests are updated to reference the new icon paths in `icons/`. The development `manifest.json` retains localhost origins for local development. A new `manifest.prod.json` is added that additionally:

- Removes `http://localhost:5173/*` and `http://localhost:5174/*` from `externally_connectable`
- References the real icons in `icons/`

The packaging script copies `manifest.prod.json` as `manifest.json` into the zip.

**Alternatives considered:**

- **Single manifest, strip at build time**: More fragile, harder to review what ships
- **Environment variables in manifest**: Not supported by Chrome extension manifests

**Layer:** Infrastructure (packaging concern).

### D3: Privacy policy — VitePress page in docs

Add `/legal/privacy-policy.md` to `packages/docs/`. This keeps legal pages alongside the rest of the documentation, served from `https://kaiord.com/docs/legal/privacy-policy` (docs is deployed under the `/docs/` base path on `kaiord.com`).

Content covers: no data collection, no analytics, session-only CSRF token, no PII storage, no third-party data sharing, regulatory compliance statement (GDPR, CCPA).

**Alternatives considered:**

- **Landing page route**: Would require changes to the SPA build; docs is simpler (just a `.md` file)
- **Separate legal subdomain**: Overkill for a single page

**Layer:** Infrastructure (docs site, no code impact).

### D4: Packaging — shell script in `scripts/`

A `scripts/package-extension.sh` script that:

1. Reads version from `packages/garmin-bridge/package.json` using `node -e` for reliable JSON parsing
2. Creates a temp directory
3. Copies: `background.js`, `content.js`, `popup.html`, `popup.js`, `icons/`, `manifest.prod.json` (as `manifest.json`)
4. Produces `dist/kaiord-garmin-bridge-{version}.zip` (overwrites if exists)

**Alternatives considered:**

- **npm package script with archiver**: Adds a dependency for a simple zip
- **Makefile**: Less portable than shell script in this Node.js monorepo

**Layer:** Infrastructure (build tooling).

### D5: Store listing — category and description

- **Category**: "Productivity" (matches Garmin Connect workflow integration use case)
- **Short description**: "Connects the Kaiord workout editor to Garmin Connect via your browser session"
- **Detailed description**: Explains what the extension does, privacy stance, and link to open-source repo
- **Screenshots**: At minimum, the popup in connected and disconnected states

**Layer:** N/A (store metadata, not code).

## Risks / Trade-offs

- **[Slow CWS review]** Extensions using `webRequest` + `host_permissions` undergo manual review, which can take days to weeks. → Mitigation: Submit early; the `privacy-justification.md` already addresses all permissions thoroughly.

- **[localhost in dev manifest]** If a user accidentally packages with the dev manifest, localhost origins ship to production. → Mitigation: The packaging script explicitly uses `manifest.prod.json`; the dev manifest is never copied.

- **[Privacy policy maintenance]** Legal text may need updates as features change. → Mitigation: Keep it simple and factual ("we don't collect data"); less likely to need changes. Include a "last updated" date.

- **[Icon quality at 16x16]** The hexagon+hub design has fine details that may not render well at 16px. → Mitigation: Review rasterized output; simplify the 16x16 variant if needed (e.g., just the filled hexagon without spoke lines).

## Open Questions

- **Screenshots**: Should these be real screenshots of the popup, or annotated mockups? Real screenshots are simpler but may need updating if the UI changes.
