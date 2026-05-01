# `@kaiord/internal-shared-assets`

Non-publishable repo-internal assets shared across extension packages.

This package is `"private": true` and never published to npm. It exists to give cross-package assets a single home that is workspace-aware (so contributors discover it under `packages/`) without polluting the published `@kaiord/*` namespace.

## Layout

- `extension-icon/master.svg` — single SVG source of truth for both `@kaiord/garmin-bridge` and `@kaiord/train2go-bridge` icons. The accent color is parameterised via the `__ACCENT__` placeholder; the repo-root `scripts/build-extension-icons.mjs` substitutes per bridge and rasterises to PNG via `sharp`.
- `popup/popup.css` _(future, PR5)_ — shared structural CSS for both bridge popups. Kept byte-identical via `pnpm popup:sync` and `scripts/check-popup-css-parity.test.mjs`.

## When to use vs publish

- **Stay here**: static asset files, no runtime code, consumed only by repo-root scripts.
- **Promote to a published `@kaiord/*` package**: anything with executable code that other packages import at runtime.
