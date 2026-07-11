<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# \_shared

## Purpose

`@kaiord/internal-shared-assets` is a **NON-PUBLISHABLE** workspace package holding static assets shared across Chrome extension packages (`@kaiord/garmin-bridge`, `@kaiord/train2go-bridge`). It contains no runtime code and is never distributed via npm. Instead, it serves as the single source of truth for assets consumed at build time by repo-root scripts. This organization keeps cross-package assets discoverable under `packages/` without polluting the published `@kaiord/*` namespace.

The two primary use cases are:

1. **Icon master SVG:** Single `master.svg` parameterized with an accent color placeholder, rendered to 3 PNG sizes per bridge via `scripts/build-extension-icons.mjs`.
2. **Bridge-core masters:** Shared bridge runtime, popup CSS, and test mocks copied byte-for-byte into consumer bridges via `scripts/sync-bridge-core.mjs` (`pnpm bridge:sync`), with mechanical parity guards (see `bridge-core/AGENTS.md`).

## Key Files

| File                        | Description                                                                                                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`              | Private workspace package (`"private": true`, `"files": []`). Declares no-op lint/test/build scripts. Intentionally not published to npm.                                           |
| `README.md`                 | User documentation explaining the package role, layout, and decision rules (stay here vs. promote to published package).                                                            |
| `extension-icon/master.svg` | Single SVG source of truth for both `garmin-bridge` and `train2go-bridge` icons. Accent color parameterized via `__ACCENT__` placeholder (Garmin: `#007cc3`, Train2Go: `#f74464`).  |
| `bridge-core/`              | Masters for the vendored bridge runtime (envelope, announce, popup utils/snapshot/CSS, profile-snapshot validator, test mocks). Byte-identical copies kept in each consumer bridge. |

## Subdirectories

| Directory         | Purpose                                                       |
| ----------------- | ------------------------------------------------------------- |
| `extension-icon/` | Master SVG icon source (see `extension-icon/AGENTS.md`)       |
| `bridge-core/`    | Vendored bridge runtime masters (see `bridge-core/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- **This is NOT a published npm package.** It is workspace-internal only. Do not edit `package.json` to add files, scripts, or dependencies as if it were publishable.
- **Assets are consumed at build time.** The extension icon SVG is rasterized by `scripts/build-extension-icons.mjs` during the build. The bridge-core masters (incl. popup CSS) are synced by `scripts/sync-bridge-core.mjs` (wired to `pnpm bridge:sync`) before extension packaging.
- **Source of truth principle:** Never hand-edit the generated PNG icons in `packages/{garmin,train2go}-bridge/icons/` or any vendored bridge-core copy in `packages/*-bridge/` (popup.css, bridge-envelope.js, …). Always edit the master files here and re-run the build/sync scripts.
- **Promotion rule:** If a subdirectory grows runtime code (e.g., a JavaScript/TypeScript module), promote it to a published `@kaiord/<name>` package and update this directory's README to reflect the split.
- When updating the icon master, remember to rebuild and verify distinctness; when updating bridge-core masters, remember to sync (`pnpm bridge:sync`) and verify parity.

### Testing Requirements

- **No source code = no tests.** The root `package.json` scripts (`lint`, `test`, `build`) are intentionally no-ops.
- **Mechanical guards on consuming scripts:**
  - `pnpm lint:icons-distinct` — runs `scripts/check-extension-icons-distinct.mjs`, which verifies that the rasterized PNG icons for each bridge are visually distinct (mean-color-delta and accent-mass thresholds). Run this after updating `master.svg` to ensure the icon palette changes are sufficient.
  - `pnpm test:scripts` — includes `scripts/check-bridge-core-parity.test.mjs`, which verifies every vendored bridge-core copy is byte-identical to its master, that masters carry no per-bridge identity values, and that each bridge's `bridge-identity.js` agrees with its `BRIDGE_MANIFEST`. Fails on any drift.
- **Consuming scripts are tested,** not the assets themselves.

### Common Patterns

- **Icon master update workflow:**
  1. Edit `extension-icon/master.svg` (e.g., adjust the hex silhouette, accent placeholder logic).
  2. Run `pnpm build` (root) to invoke `scripts/build-extension-icons.mjs`.
  3. Run `pnpm lint:icons-distinct` to verify inter-bridge distinctness.
  4. Commit the updated SVG and regenerated PNGs.
- **Bridge-core master update workflow:**
  1. Edit the master under `bridge-core/` (no per-bridge identity values).
  2. Run `pnpm bridge:sync` to copy masters to their consumer bridges.
  3. Run `pnpm test:scripts` to verify parity.
  4. Commit the updated master and vendored copies.

## Dependencies

### Internal

- No internal package dependencies. This package does not import or depend on any other workspace package.

### External

- No runtime dependencies. No devDependencies. The package exists purely as a file container.

### Consuming Scripts (Repo-Root)

- `scripts/build-extension-icons.mjs` — reads `master.svg`, substitutes accent colors, rasterizes via `sharp` to PNG (16, 48, 128px) for each bridge.
- `scripts/sync-bridge-core.mjs` — copies every `bridge-core/` master byte-for-byte to its consumer bridges (`pnpm bridge:sync`).
- `scripts/check-extension-icons-distinct.mjs` — mechanical guard ensuring rasterized icons differ across bridges and sizes (wired to `pnpm lint:icons-distinct`).
- `scripts/check-bridge-core-parity.test.mjs` — test-only mechanical guard ensuring every vendored bridge-core copy matches its master (wired to `pnpm test:scripts`).

<!-- MANUAL: -->
