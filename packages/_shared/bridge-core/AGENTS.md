<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-07-26 -->

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
two agree and that no master contains identity values. The one per-bridge
visual value — the header monogram glyph (`G`, `T2`, `Wh`, `Ta`, `TP`) — is
markup in each bridge's `popup.html`, not a token in the shared `popup.css`.

All five bridges share ONE 340px dark popup shell (`popup.css` +
`bridge-popup-shell.js`); the header monogram is the only per-bridge variable,
and no provider brand hue appears in any bridge package. The shell's `--kd-*`
palette is copied from the `.dark` block of `styles/brand-tokens.css` and
pinned by `scripts/check-bridge-popup-tokens-parity.test.mjs`. The popups are
dark-only; there is no light-theme block for them.

## Key Files

| File                               | Consumers        | Description                                                                                                                     |
| ---------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `bridge-envelope.js`               | all bridges      | Response envelope builders + `createDispatch`/`createExternalDispatch` factories + SPA-origin guard.                            |
| `kaiord-announce.js`               | all bridges      | Announce content script core; reads `globalThis.KAIORD_BRIDGE_IDENTITY`.                                                        |
| `bridge-popup-utils.js`            | all bridges      | Popup i18n machinery (`msg` over `KAIORD_POPUP_MESSAGES`), `$`, `withTimeout`, `relativeAgo`, `formatSinceDate`, `renderRetry`. |
| `bridge-popup-shell.js`            | all bridges      | Shell renderers: `renderStatusBlock`, `renderChips`, `renderConsequence`, `renderSkeleton`, `renderCtas`.                       |
| `bridge-popup-health.js`           | all bridges      | Outage boundary (`bridgeHealth` in `chrome.storage.local`): when a bridge was first observed broken, cleared on success.        |
| `bridge-popup-snapshot.js`         | garmin, train2go | Athlete card + snapshot freshness (`STALE_SNAPSHOT_THRESHOLD_DAYS` vendored literal).                                           |
| `popup.css`                        | all bridges      | The unified 340px dark popup shell (`--kd-*` brand palette, layout, components).                                                |
| `profile-snapshot.js`              | garmin, train2go | Plain-JS snapshot validator mirroring the @kaiord/core Zod schema.                                                              |
| `test/chrome-mock.js`              | all bridges      | Superset chrome API mock for vitest (neutral identity values).                                                                  |
| `test/bridge-envelope.test.js`     | all bridges      | Vendored unit tests for the envelope module.                                                                                    |
| `test/bridge-popup-shell.test.js`  | all bridges      | Vendored unit tests for the shell renderers (jsdom env, CJS `require`).                                                         |
| `test/bridge-popup-health.test.js` | all bridges      | Vendored unit tests for the health record (callback-form storage stub, CJS `require`).                                          |

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
  (utils before shell before health before snapshot before the site
  `popup.js`); the announce core assumes `bridge-identity.js` loaded first. The
  shell renderers take `$`/`msg` as arguments so each is also unit-testable
  through a CJS `require`.
- **The health record is popup-owned.** `recordProbe` is called from each
  `popup.js` after its session probe, never from `background.js`: nothing
  polls, and a new popup→background action would widen a surface the
  privacy-surface guard enumerates. Only a CONCLUSIVE probe is folded in — a
  worker timeout says nothing about the upstream session and must not open an
  outage.
- **Popup strings live per bridge.** Every string a shell renderer displays
  arrives as a message key from that bridge's `KAIORD_POPUP_MESSAGES` table,
  which must stay key-for-key identical to its `_locales/en/messages.json`
  (`scripts/check-bridge-popup-message-parity.test.mjs`).

### Testing Requirements

- `pnpm test:scripts` — parity (byte, purity, identity↔manifest) + sync unit
  tests.
- Each consumer bridge's vitest suite exercises its vendored copies
  (including the vendored `test/bridge-envelope.test.js` and
  `test/bridge-popup-shell.test.js`), so a drifted copy fails where it is
  actually used, not only in the parity guard.
