# @kaiord/garmin-bridge

Chrome extension (Manifest V3) that bridges the Kaiord workout editor SPA to
[Garmin Connect](https://connect.garmin.com). The extension mints an OAuth
token from the user's existing Garmin browser session — no password is ever
entered or sent to a Kaiord-hosted server — and calls Garmin's API
(`connectapi.garmin.com`) directly with `Authorization: Bearer`.

This package is `private: true` and is not published to npm. The release
workflow packages it as a Chrome Web Store artifact.

## Purpose

- Mint a Garmin OAuth token from the user's signed-in `sso.garmin.com` session
  (service ticket → OAuth1 → OAuth2 Bearer) and persist it in
  `chrome.storage.local` so the SPA can drive Garmin's API on the user's
  behalf. The Bearer is refreshed with the long-lived OAuth1; if that fails the
  bridge re-mints from the session. See `garmin-oauth.js`.
- Expose a small message-passing surface (`ping`, `list`, `push`,
  `activities`, ...) that the SPA reaches via `chrome.runtime.sendMessage` once
  it has discovered the extension ID at runtime through the
  `kaiord-announce.js` content script.
- Enforce a path allowlist in `background.js` so the bridge only ever calls a
  fixed set of Garmin endpoints.
- Survive service-worker cold starts: the OAuth token lives in
  `chrome.storage.local` and is reused (or refreshed) on demand.

There is no JavaScript public API exported from this package — the only
contract is the `chrome.runtime` message shape, documented inline in
`background.js`.

## Build entrypoint

This is a browser extension, not a library — it has no `main` / `exports`.
The extension is loaded directly from the package directory via
`chrome://extensions/` → "Load unpacked".

Manifest entrypoints:

- `manifest.json` — development manifest (used for "Load unpacked").
- `manifest.prod.json` — production manifest used when packaging for the
  Chrome Web Store.
- `background.js` — service worker (Bearer calls to connectapi, action routing).
- `garmin-oauth.js` — OAuth token minting + refresh (loaded via `importScripts`).
- `kaiord-announce.js` — content script injected into Kaiord origins that
  announces the extension's presence and ID to the SPA.
- `popup.html` / `popup.js` / `popup.css` — extension toolbar popup.

To package the extension for the store, the release workflow zips this
directory after swapping `manifest.json` for `manifest.prod.json`.

## How to test

```bash
# Run the unit-test suite (vitest + jsdom + a chrome-mock helper)
pnpm --filter @kaiord/garmin-bridge test

# Watch mode while iterating
pnpm --filter @kaiord/garmin-bridge test:watch

# Coverage report
pnpm --filter @kaiord/garmin-bridge test:coverage
```

Unit tests live in `test/` and cover `background.js`, `garmin-oauth.js`,
`popup.js`, `kaiord-announce.js`, and `profile-snapshot.js` against the
chrome-API mock in `test/chrome-mock.js`. (Run
`pnpm --filter @kaiord/core build` first so the `@kaiord/core/test-utils`
subpath resolves.)

For end-to-end / integration smoke checks against a real Garmin Connect
session, see [TESTING.md](./TESTING.md).

## License

MIT — see [LICENSE](../../LICENSE).
