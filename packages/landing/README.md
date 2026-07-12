# @kaiord/landing

Marketing landing page for [kaiord.com](https://kaiord.com) — a single-page
static site built with Vite and Tailwind CSS that introduces Kaiord, links to
the docs and editor, and shows the install command for `@kaiord/core`.

This package is `private: true` and is not published to npm. It is built by
the release workflow and deployed alongside the rest of the public surface.

## Purpose

- Serve the public marketing entrypoint at `https://kaiord.com/`.
- Drive visitors to the three downstream surfaces: the editor SPA, the
  VitePress docs site (`/docs/`), and the GitHub repo.
- Stay infrastructure-light: zero backend, zero accounts, zero personal data
  collected (Umami analytics is loaded only when a website id is provided at
  build time).
- Reuse Kaiord's design tokens directly via a Tailwind v4 setup so the
  landing matches the rest of the brand.

The page is a single hand-authored `index.html` plus a small `src/` tree
(analytics setup + types + adapters). It depends on `@kaiord/core` only as a
type-level reference; no runtime conversion happens here.

## Build entrypoint

This package is a static site, not a library — it has no `main` / `exports`.
The build target is the static site emitted to `dist/` by Vite.

```bash
# Develop locally with hot reload
pnpm --filter @kaiord/landing dev

# Build the production static site to dist/
pnpm --filter @kaiord/landing build

# Preview the built site locally
pnpm --filter @kaiord/landing preview
```

Optional environment variable:

- `VITE_UMAMI_WEBSITE_ID` — when set, the build inlines the Umami tracker
  snippet between the `UMAMI_START` / `UMAMI_END` markers in `index.html`.
  When unset, the snippet is stripped at build time by the `conditionalUmami`
  Vite plugin in `vite.config.ts` and the site ships with no analytics at all.

## How to test

```bash
# Run the package's vitest suite
pnpm --filter @kaiord/landing test

# Verify the production build succeeds
pnpm --filter @kaiord/landing build
```

Tests live under `src/` and `src/adapters/` and use jsdom + vitest. They
cover analytics wiring, the install-command tabs, and the package-manager
selector behavior.

## License

MIT — see [LICENSE](../../LICENSE).
