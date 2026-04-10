## 1. Icon Generation

- [x] 1.1 Add `@resvg/resvg-js` as devDependency in root `package.json` (build tooling)
- [x] 1.2 Create `scripts/generate-extension-icons.mjs` that rasterizes `assets/favicon.svg` to 16x16, 48x48, 128x128 PNG in `packages/garmin-bridge/icons/`
- [x] 1.3 Run the script and verify generated icons are valid PNGs at correct dimensions
- [x] 1.4 Commit the generated PNGs to the repository (they rarely change, avoids build-step dependency)

## 2. Production Manifest

- [x] 2.1 Create `packages/garmin-bridge/manifest.prod.json` — same as `manifest.json` but with localhost removed from `externally_connectable`, top-level `icons` field (16/48/128), `action.default_icon` updated to `icons/` paths (48/128), and `description` updated to user-friendly wording ("workout editor" instead of "SPA")
- [x] 2.2 Update `packages/garmin-bridge/manifest.json`: add top-level `icons` field (16/48/128), update `action.default_icon` paths to `icons/`, update `description` to match prod manifest wording
- [x] 2.3 Remove old placeholder `icon48.png` and `icon128.png` from `packages/garmin-bridge/` root
- [x] 2.4 Verify both manifests are valid JSON: prod excludes localhost, dev includes localhost, both reference `icons/` paths

## 3. Packaging Script

- [x] 3.1 Create `scripts/package-extension.sh` with whitelist approach: copies only `background.js`, `content.js`, `popup.html`, `popup.js`, `icons/`, and `manifest.prod.json` (as `manifest.json`). Reads version from `package.json`. Includes pre-flight checks (manifest.prod.json exists, icons/ exists) and post-build verification (no localhost in packaged manifest). Outputs to `packages/garmin-bridge/dist/`
- [x] 3.2 Add `dist/` to `packages/garmin-bridge/.gitignore`
- [x] 3.3 Test the packaging script: run it, extract the zip, verify contents match spec (exactly 8 files), no localhost in manifest, and smoke-test by loading the extracted extension in Chrome

## 4. Privacy Policy

- [x] 4.1 Create `packages/docs/legal/privacy-policy.md` with VitePress frontmatter and full policy text covering: no data collection, extension CSRF handling, no third-party sharing, GDPR/CCPA compliance, open source link, contact info, last updated date
- [x] 4.2 Add "Legal" section to VitePress sidebar config in `packages/docs/.vitepress/config.ts`
- [x] 4.3 Verify the page renders correctly with `pnpm --filter docs dev` and confirm the URL resolves at `/docs/legal/privacy-policy`

## 5. Store Listing

- [x] 5.1 Create `packages/garmin-bridge/store-listing.md` with CWS listing text (name, short/detailed description, category, privacy URL `https://kaiord.com/docs/legal/privacy-policy`) and submission checklist
- [x] 5.2 Document how to capture screenshots of the popup in connected and disconnected states

## 6. Quality & Documentation

- [x] 6.1 Run `pnpm -r test && pnpm -r build && pnpm lint:fix` — ensure zero errors/warnings
- [x] 6.2 Add changeset via `pnpm exec changeset`
- [x] 6.3 Commit with conventional commit: `feat(garmin-bridge): prepare Chrome Web Store publishing`
