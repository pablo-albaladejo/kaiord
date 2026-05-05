# @kaiord/garmin-bridge

Chrome extension (Manifest V3) that bridges the Kaiord workout editor SPA to
[Garmin Connect](https://connect.garmin.com) via the user's authenticated
browser session. The SPA uses this extension to list workouts and push new
workouts to the user's Garmin account without ever sending Garmin credentials
to a Kaiord-hosted server.

This package is `private: true` and is not published to npm. The release
workflow packages it as a Chrome Web Store artifact.

## Purpose

- Capture the Garmin Connect CSRF token from the user's existing
  `connect.garmin.com` session and persist it in extension storage so the SPA
  can drive Garmin Connect's private API on the user's behalf.
- Expose a small message-passing surface (`ping`, `list`, `push`, ...) that
  the SPA reaches via `chrome.runtime.sendMessage` once it has discovered the
  extension ID at runtime through the `kaiord-announce.js` content script.
- Enforce a path allowlist inside the content script so only Kaiord-controlled
  origins (`https://*.kaiord.com/*` and `http://localhost/*` in dev) can talk
  to the bridge.
- Survive service-worker cold starts: the CSRF token is cached in
  `chrome.storage` and re-validated on demand.

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
- `background.js` — service worker (CSRF capture, request relay).
- `content.js` — content script injected into `connect.garmin.com`.
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

Unit tests live in `test/` and cover `background.js`, `content.js`,
`popup.js`, `kaiord-announce.js`, and `profile-snapshot.js` against the
chrome-API mock in `test/chrome-mock.js`.

For end-to-end / integration smoke checks against a real Garmin Connect
session, see [TESTING.md](./TESTING.md).

## License

MIT — see [LICENSE](../../LICENSE).
