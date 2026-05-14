<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# extension-icon

## Purpose

Single-source-of-truth SVG icon master for both Chrome extension packages (`@kaiord/garmin-bridge` and `@kaiord/train2go-bridge`). The SVG is parameterized with an `__ACCENT__` placeholder that is substituted per bridge during the build, then rasterized to PNG at three sizes (16, 48, 128 pixels) via the `scripts/build-extension-icons.mjs` script.

Both bridges display a Kaiord hex silhouette with a per-bridge accent color:

- **Garmin Bridge:** `#007cc3` (blue)
- **Train2Go Bridge:** `#f74464` (coral)

The rasterized PNG outputs are stored in each bridge's `packages/<bridge>/icons/` directory and are visually distinct enough to be recognizable in the browser toolbar at every size.

## Key Files

| File         | Description                                                                                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `master.svg` | The only SVG icon source. Contains the `__ACCENT__` placeholder which is replaced with the bridge-specific hex color at build time. Hand-edit this file; never hand-edit the generated PNGs. |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Edit only the SVG master.** Never hand-edit the rasterized PNG files in `packages/garmin-bridge/icons/` or `packages/train2go-bridge/icons/`. The privacy-surface guard does not cover icons, but the distinctness guard (`scripts/check-extension-icons-distinct.mjs`) will fail if the icons drift below inter-bridge or accent-mass thresholds.
- **Placeholder syntax:** Search the SVG for `__ACCENT__` and ensure it is used to color the accent elements (not the silhouette itself). The script does a global replace of this string with the bridge-specific hex color before rasterization.
- **Test visually:** After updating the master, run `pnpm build` to regenerate the PNGs, then check the visual output at `packages/garmin-bridge/icons/` and `packages/train2go-bridge/icons/`. The icons should be immediately distinguishable by color.
- **Coordinate with distinctness guard:** After updating, run `pnpm lint:icons-distinct` to verify that the accent-mass and mean-color-delta thresholds are met. If the guard fails, the color choice or design is not sufficiently distinct.

### Testing Requirements

- **No direct tests.** The SVG is validated by the consuming script (`scripts/build-extension-icons.mjs`) at build time.
- **Mechanical guard:** `pnpm lint:icons-distinct` runs `scripts/check-extension-icons-distinct.mjs`, which compares the rasterized PNGs and computes accent-mass and inter-bridge color metrics. Fails if thresholds are not met. Run this after any update to the master.
- **Visual verification:** Open both bridges' icon packs in the browser toolbar or in your file browser and confirm they are visually distinct at each size (16, 48, 128).

### Common Patterns

- **Accent substitution workflow:**
  1. Edit `master.svg` to adjust the silhouette or accent regions.
  2. Ensure the accent regions reference `__ACCENT__` (typically via SVG fill or stroke attributes).
  3. Run `pnpm build` to trigger `scripts/build-extension-icons.mjs`.
  4. Run `pnpm lint:icons-distinct` to verify distinctness.
  5. Inspect the PNG outputs in both bridge `icons/` directories.
  6. Commit the updated SVG and regenerated PNGs.
- **Color accent updates:** To change the Garmin or Train2Go accent color, update the hex value in `scripts/build-extension-icons.mjs` (not in the SVG), then repeat the workflow above.

## Dependencies

### Internal

None. This directory is standalone.

### External

- The SVG is consumed by `scripts/build-extension-icons.mjs` at build time.
- Rasterization uses `sharp` (Node.js image processing library, imported in the build script).
- No direct dependencies in this directory.

### Consuming Scripts (Repo-Root)

- `scripts/build-extension-icons.mjs` — reads `master.svg`, substitutes `__ACCENT__` for each bridge's accent hex, rasterizes to PNG (16, 48, 128px) via `sharp`, and writes to `packages/<bridge>/icons/icon{16,48,128}.png`.
- `scripts/check-extension-icons-distinct.mjs` — computes visual distinctness metrics on the rasterized PNGs and fails the `pnpm lint:icons-distinct` job if thresholds are not met.

<!-- MANUAL: -->
