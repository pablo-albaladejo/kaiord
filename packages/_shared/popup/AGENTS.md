<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# popup

## Purpose

Shared structural CSS master for both Chrome extension popups (`@kaiord/garmin-bridge` and `@kaiord/train2go-bridge`). The file contains all layout, typography, and component styles common to both bridges, with the exception of bridge-specific accent colors. The structural CSS is kept byte-identical across both bridge packages via the `pnpm popup:sync` script and is validated by a mechanical parity guard.

Bridge-specific color tokens (`--accent`, `--accent-hover`) are the only per-bridge divergence and are defined in each bridge's `popup.html` `<style>` block, not in this master file.

## Key Files

| File        | Description                                                                                                                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `popup.css` | The only CSS source. Shared structural stylesheet for both bridge popups (layout, typography, components). Copied byte-for-byte into `packages/garmin-bridge/popup.css` and `packages/train2go-bridge/popup.css` via `scripts/sync-popup-css.mjs`. Never hand-edit the synced copies. |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Edit only the master CSS.** Never hand-edit `packages/garmin-bridge/popup.css` or `packages/train2go-bridge/popup.css` directly. They are generated files and will be overwritten by `pnpm popup:sync`.
- **Structural CSS only.** This file contains layout, typography, and reusable component styles. Bridge-specific accent colors (`--accent`, `--accent-hover`) are NOT defined here; each bridge defines them in its own `popup.html` `<style>` block.
- **Keep styles bridge-agnostic.** Do not add CSS rules that reference bridge-specific selectors or colors. If you need a per-bridge override, move the color token to the bridge's `popup.html` and use CSS custom properties here.
- **Test parity after edits:** After updating the master, run `pnpm popup:sync` to copy changes to both bridges, then run `pnpm test:scripts` to verify byte-identical parity. The mechanical guard will fail if either synced copy drifts.

### Testing Requirements

- **No direct tests.** The CSS is validated by the consuming script (`scripts/sync-popup-css.mjs`) at sync time.
- **Mechanical guard:** `pnpm test:scripts` includes `scripts/check-popup-css-parity.test.mjs`, which verifies that the master CSS is byte-identical to both `packages/garmin-bridge/popup.css` and `packages/train2go-bridge/popup.css`. Fails if either synced copy drifts or is out of date. Run this after any update to the master or after a manual sync.
- **Visual verification:** After syncing, open both bridge popups in their respective browser contexts and verify that the shared layout and typography render identically (modulo the per-bridge accent color in `popup.html` `<style>` blocks).

### Common Patterns

- **CSS update workflow:**
  1. Edit `popup/popup.css` (structural CSS, no bridge-specific colors).
  2. Run `pnpm popup:sync` to copy the master to both bridges.
  3. Run `pnpm test:scripts` to verify byte-identical parity.
  4. Inspect both bridge popups in the browser to verify visual consistency.
  5. Commit the updated master and synced copies.
- **Color token updates:** If you need to adjust the accent color scheme, update the color values in each bridge's `popup.html` `<style>` block (Garmin: `#007cc3`, Train2Go: `#f74464`), not in this master CSS file.
- **Drift recovery:** If either synced copy drifts from the master, run `pnpm popup:sync` again and commit the corrected files. The mechanical guard ensures this state is detected at the lint job.

## Dependencies

### Internal

None. This directory is standalone.

### External

- The CSS file is consumed by both bridge packages at build/packaging time.
- No JavaScript or external dependencies.

### Consuming Scripts (Repo-Root)

- `scripts/sync-popup-css.mjs` — copies `popup/popup.css` byte-for-byte to both `packages/garmin-bridge/popup.css` and `packages/train2go-bridge/popup.css`. Wired to `pnpm popup:sync` in the root `package.json`.
- `scripts/check-popup-css-parity.test.mjs` — test-only mechanical guard verifying that both synced CSS files are byte-identical to the master. Wired to `pnpm test:scripts` so drift is caught at the lint job. Fails first with intentionally-divergent fixtures to ensure the test logic is sound.

<!-- MANUAL: -->
