<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `public/`

## Purpose

Static assets served verbatim by Vite at the SPA root.

## Key Files

- `favicon.svg`, `favicon.png`, `apple-touch-icon.png` — browser/OS icons.
- `manifest.webmanifest` — web app manifest (install as an app), scoped to `/app/`; its icon `src`s are relative to it.
- `app-icon-192.png`, `app-icon-512.png`, `app-icon-maskable-512.png` — manifest icons, mirrored by `pnpm brand:images`.
- `.nojekyll` — disables GitHub Pages' Jekyll processing (the SPA is deployed to Pages).
- `fonts/` — webfonts bundled with the SPA.

## For AI Agents

### Working In This Directory

1. **Verbatim serve.** Files here are not processed; reference them by absolute path from the root.
2. **Source-imported assets** (those Vite should fingerprint and tree-shake) belong in `src/assets/` instead.

<!-- MANUAL: -->
