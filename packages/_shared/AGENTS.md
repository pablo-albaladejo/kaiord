<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-11-09 -->

# \_shared

## Purpose

`@kaiord/internal-shared-assets` is a private workspace package (`"private": true`, `"files": []`) that is never published to npm. It holds the single source of truth for what the five bridge extensions share: `garmin-bridge`, `train2go-bridge`, `whoop-bridge`, `tanita-bridge` and `trainingpeaks-bridge`. Nothing imports from it at runtime. Repo-root scripts read it and copy or render its files into each bridge.

## Key Files

| File                        | Description                                                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`              | Private package. Its `lint`/`test`/`build` scripts are no-ops: the masters are linted by the root `pnpm lint:bridges` and tested inside each consumer bridge's vitest suite. |
| `README.md`                 | The package role and the rule for when a sub-tree should become a published package.                                                                                         |
| `extension-icon/master.svg` | The one icon source for all five bridges. `__ACCENT__` is replaced per bridge by `scripts/build-extension-icons.mjs` (`pnpm icons:build`).                                   |
| `bridge-core/`              | Masters of the runtime JS, popup CSS and vitest tests every bridge vendors byte-for-byte. The consumer set of each master is declared in `scripts/sync-bridge-core.mjs`.     |

## Subdirectories

| Directory         | Purpose                                                                |
| ----------------- | ---------------------------------------------------------------------- |
| `extension-icon/` | Icon master (see `extension-icon/AGENTS.md`)                           |
| `bridge-core/`    | Vendored bridge runtime and test masters (see `bridge-core/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- **Edit masters here, never the copies.** The vendored files in `packages/*-bridge/` (`bridge-envelope.js`, `popup.css`, `test/chrome-mock.js`, …) and the PNGs in `packages/*-bridge/icons/` are generated.
- **After a bridge-core edit:** run `pnpm bridge:sync`, then `pnpm test:scripts` (parity) and the consumer bridges' suites (`pnpm -F @kaiord/<bridge> test`).
- **After an icon edit:** run `pnpm icons:build` (it is not part of `pnpm build`), then `pnpm lint:icons-distinct`, and commit the SVG together with the regenerated PNGs.
- **Do not add dependencies or publishable fields to `package.json`.** If a sub-tree must be imported by other packages at runtime, promote it to a published `@kaiord/*` package instead.

### Testing Requirements

- `pnpm lint:bridges` lints `bridge-core/**/*.js` together with the bridges.
- The test masters under `bridge-core/test/` run in every consumer bridge, against that bridge's own vendored copy.
- `pnpm test:scripts` includes the guards over this directory:
  - `scripts/check-bridge-core-parity.test.mjs`: every copy is byte-identical to its master, no master carries a per-bridge identity value, and each bridge's `bridge-identity.js` agrees with its `BRIDGE_MANIFEST`.
  - `scripts/sync-bridge-core.test.mjs`: the sync script and its masters table.
  - `scripts/check-bridge-popup-tokens-parity.test.mjs`: the `--kd-*` palettes in `popup.css` match `styles/brand-tokens.css`.
  - `scripts/check-bridge-stale-threshold-parity.test.mjs`: the vendored stale-snapshot threshold matches core.
  - `scripts/build-extension-icons.test.mjs` and `scripts/check-extension-icons-distinct.test.mjs`: the icon renderer and the distinctness guard.

## Dependencies

### Internal

- None. Nothing here imports another workspace package.

### Consuming Scripts (Repo-Root)

- `scripts/sync-bridge-core.mjs` (`pnpm bridge:sync`): copies each `bridge-core/` master to its consumer bridges.
- `scripts/build-extension-icons.mjs` (`pnpm icons:build`): renders `master.svg` to 16/48/128 px PNGs per bridge with `sharp`.
- `scripts/check-extension-icons-distinct.mjs` (`pnpm lint:icons-distinct`): checks that the rendered icons differ enough between bridges.
- `scripts/package-extension.sh`: zips a bridge's top-level files, which include the vendored runtime copies but never `test/`.

<!-- MANUAL: -->
