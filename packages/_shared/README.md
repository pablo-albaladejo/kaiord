# `@kaiord/internal-shared-assets`

Non-publishable repo-internal assets and vendored-code masters shared across extension packages.

This package is `"private": true` and never published to npm. It exists to give cross-package sources a single home that is workspace-aware (so contributors discover it under `packages/`) without polluting the published `@kaiord/*` namespace.

## Layout

- `extension-icon/master.svg` — single SVG source of truth for the bridge extension icons. The accent color is parameterised via the `__ACCENT__` placeholder; the repo-root `scripts/build-extension-icons.mjs` substitutes per bridge and rasterises to PNG via `sharp`.
- `bridge-core/` — masters for the code every bridge extension vendors byte-identically (response envelope/dispatch, announce content script, popup utilities and snapshot module, popup CSS, profile-snapshot validator, chrome test mock). Synced via `pnpm bridge:sync` (`scripts/sync-bridge-core.mjs`) and locked by `scripts/check-bridge-core-parity.test.mjs`. Contract: `openspec/specs/bridge-core/spec.md`.

## When to use vs publish

- **Stay here**: files consumed by repo-root scripts only — static assets, and bridge-core masters that are _vendored by byte-copy_ into each extension (never imported across packages at runtime).
- **Promote to a published `@kaiord/*` package**: anything other packages must import at runtime.
