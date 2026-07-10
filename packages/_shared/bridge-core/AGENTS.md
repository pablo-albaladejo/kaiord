<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-07-10 -->

# bridge-core

## Purpose

Masters for the code every Kaiord bridge extension shares. Each master is
vendored **byte-identically** into its consumer bridges by
`scripts/sync-bridge-core.mjs` (`pnpm bridge:sync`) and locked by
`scripts/check-bridge-core-parity.test.mjs`. Bridges never import across
packages at runtime — sharing is copy-at-sync-time, keeping
`scripts/package-extension.sh`'s flat-file packaging untouched. Normative
contract: `openspec/specs/bridge-core/spec.md`.

Per-bridge identity (`id`, `name`, `capabilities`) lives ONLY in each
bridge's `bridge-identity.js` (loaded before the announce core) and in its
`BRIDGE_MANIFEST` literal in `background.js`; the parity guard asserts the
two agree and that no master contains identity values. Bridge-specific
accent colors (`--accent`, `--accent-hover`) stay in each bridge's
`popup.html` `<style>` block, not in the shared `popup.css`.

## Key Files

| File                           | Consumers        | Description                                                                                                |
| ------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------- |
| `bridge-envelope.js`           | all bridges      | Response envelope builders + `createDispatch`/`createExternalDispatch` factories + SPA-origin guard.       |
| `kaiord-announce.js`           | all bridges      | Announce content script core; reads `globalThis.KAIORD_BRIDGE_IDENTITY`.                                   |
| `bridge-popup-utils.js`        | all bridges      | Popup i18n machinery (`msg` over `KAIORD_POPUP_MESSAGES`), `$`, `withTimeout`, `relativeAgo`, `setStatus`. |
| `bridge-popup-snapshot.js`     | garmin, train2go | Athlete card + snapshot freshness (`STALE_SNAPSHOT_THRESHOLD_DAYS` vendored literal).                      |
| `popup.css`                    | garmin, train2go | Shared structural popup CSS (layout, typography, components).                                              |
| `profile-snapshot.js`          | garmin, train2go | Plain-JS snapshot validator mirroring the @kaiord/core Zod schema.                                         |
| `test/chrome-mock.js`          | all bridges      | Superset chrome API mock for vitest (neutral identity values).                                             |
| `test/bridge-envelope.test.js` | all bridges      | Vendored unit tests for the envelope module.                                                               |

## For AI Agents

### Working In This Directory

- **Edit only the masters.** Vendored copies in `packages/*-bridge/` are
  generated; hand-edits fail the parity guard. After editing, run
  `pnpm bridge:sync` then `pnpm test:scripts`.
- **No identity values in masters.** Bridge ids, display names, capability
  tokens, and integration hostnames are rejected by the master-purity check.
- **Adding a master:** extend `BRIDGE_CORE_MASTERS` in
  `scripts/sync-bridge-core.mjs` (declare the consumer set), sync, and keep
  the bridge-core spec's master list in step.
- **Load order matters:** popup masters assume classic-script global scoping
  (utils before snapshot before the site `popup.js`); the announce core
  assumes `bridge-identity.js` loaded first.

### Testing Requirements

- `pnpm test:scripts` — parity (byte, purity, identity↔manifest) + sync unit
  tests.
- Each consumer bridge's vitest suite exercises its vendored copies
  (including the vendored `test/bridge-envelope.test.js`).
