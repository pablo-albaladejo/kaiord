<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-11 | Updated: 2026-07-26 -->

# whoop-bridge

## Purpose

Private (unpublished) Chrome extension bridging the SPA editor to WHOOP
health data (recovery, sleep, HRV, vitals, strain, heart-rate series,
workouts, stress, Advanced Labs). Plain-JS MV3 extension using **session
piggyback**. The session bearer is captured through THREE paths, all three
of which must stay disclosed in `privacy-justification.md`, `README.md`, and
`packages/docs/legal/privacy-policy.md`:

1. `inject-main.js` — MAIN-world wrap of `fetch`/`XHR` reading the
   `Authorization` header off the WHOOP app's own requests (in flight);
2. `background.js` — `chrome.webRequest.onBeforeSendHeaders` on
   `api.prod.whoop.com`, read-only, no `webRequestBlocking` (in flight);
3. `content.js` `scanCognitoStorage()` — the Cognito access token in
   `app.whoop.com` `localStorage`, read on every page load (**at rest**).

The background then relays allowlisted `api.prod.whoop.com` reads with the
bearer. There is no OAuth flow and no stored long-lived credential.
Announces itself to the SPA via the vendored bridge-core announce script.

## Key Files

| File                                    | Description                                                                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `background.js`                         | Service worker: session state + allowlisted WHOOP API relay (`whoop-fetch`).                                               |
| `inject-main.js`                        | MAIN-world interceptor on app.whoop.com; captures the session bearer.                                                      |
| `content.js`                            | Isolated-world relay between the MAIN-world interceptor and the service worker.                                            |
| `bridge-identity.js`                    | Per-bridge identity consumed by the vendored announce core.                                                                |
| `popup.js` / `popup.html` / `popup.css` | Shared bridge shell: status block, "Feeds Kaiord" chips, "What Kaiord is missing" box when signed out, fix-first CTA pair. |
| `manifest.json` / `manifest.prod.json`  | MV3 manifests (`tabs`, `webRequest`, `scripting`, `storage`; WHOOP hosts). Prod strips localhost.                          |

## Vendored bridge-core files

`bridge-envelope.js`, `kaiord-announce.js`, `bridge-popup-utils.js`,
`bridge-popup-shell.js`, `popup.css`, and
`test/{chrome-mock,bridge-envelope.test,bridge-popup-shell.test}.js` are
byte-identical vendored
copies of `packages/_shared/bridge-core/` masters — never edit them here;
edit the master and run `pnpm bridge:sync` (guard:
`scripts/check-bridge-core-parity.test.mjs`). Identity values must match
`BRIDGE_MANIFEST` in `background.js`. The Kaiord content script MUST load
`bridge-identity.js` before `kaiord-announce.js` in BOTH manifests
(identity-before-core contract, `openspec/specs/bridge-core/spec.md`).

## For AI Agents

- Plain JavaScript by design (strict-TS exception in root `CLAUDE.md`);
  correctness lives in the vitest suite (`pnpm test` / `test:coverage`).
- External dispatch is origin-pinned and action-allowlisted via the vendored
  envelope (`EXTERNAL_ACTIONS`: ping/status/whoop-fetch).
- Versioning: covered by `scripts/sync-extension-version.mjs` (package.json →
  both manifests → `BRIDGE_MANIFEST.version`). Still absent from the CWS
  publish pipeline (`cws-publish.yml`) — unpublished.
- Covered by the privacy-surface guard
  (`scripts/check-bridge-privacy-surface.mjs`) including prod-manifest
  sections AND the `ALLOWED_PREFIXES` read allowlist, and by the icon
  pipeline + distinctness guard. Widening `ALLOWED_PREFIXES` requires a
  deliberate refresh of `scripts/fixtures/bridge-privacy-surface.json`.
- `webRequest` is a credential-access permission under
  `packages/docs/scripts/check-privacy-policy.mjs`; whoop passes only via
  the written exemption in `CREDENTIAL_PERMISSION_EXEMPTIONS` there. Adding
  another such permission means adding an exemption AND a policy disclosure.
