<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-11 | Updated: 2026-07-11 -->

# whoop-bridge

## Purpose

Private (unpublished) Chrome extension bridging the SPA editor to WHOOP
recovery/sleep data. Plain-JS MV3 extension: background service worker owns
the OAuth lifecycle (`whoop-oauth.js`) and relays allowlisted reads; the
popup handles BYOK credentials. Announces itself to the SPA via the vendored
bridge-core announce script. NOTE: the OAuth model is scheduled for
replacement by a session-piggyback rewrite; the vendored bridge-core surface
(identity, announce, envelope, popup utils) carries over.

## Key Files

| File                                    | Description                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| `background.js`                         | Service worker: OAuth lifecycle + allowlisted WHOOP API relay.                             |
| `whoop-oauth.js`                        | OAuth client (token exchange/refresh) injected with chrome primitives.                     |
| `bridge-identity.js`                    | Per-bridge identity consumed by the vendored announce core.                                |
| `popup.js` / `popup.html` / `popup.css` | BYOK credentials + connect/disconnect UI.                                                  |
| `manifest.json`                         | MV3 manifest (`storage`, `identity`; host: WHOOP API). No prod manifest yet — unpublished. |

### Vendored bridge-core files

`bridge-envelope.js`, `kaiord-announce.js`, `bridge-popup-utils.js`, and
`test/{chrome-mock,bridge-envelope.test}.js` are byte-identical vendored
copies of `packages/_shared/bridge-core/` masters — never edit them here;
edit the master and run `pnpm bridge:sync` (guard:
`scripts/check-bridge-core-parity.test.mjs`). Identity values must match
`BRIDGE_MANIFEST` in `background.js`.

## For AI Agents

- Plain JavaScript by design (strict-TS exception in root `CLAUDE.md`);
  correctness lives in the vitest suite (`pnpm test` / `test:coverage`).
- External dispatch is origin-pinned and action-allowlisted via the vendored
  envelope (`EXTERNAL_ACTIONS`: ping/status/connect/whoop-fetch);
  `set-credentials`/`disconnect` stay popup-only.
- Unpublished: absent from the CWS publish pipeline and
  `sync-extension-version.mjs`; covered by the privacy-surface guard with
  optional prod-manifest/content sections.
