# @kaiord/train2go-bridge

Chrome extension (Manifest V3) that reads training plans from
[Train2Go](https://app.train2go.com) via the user's authenticated browser
session and bridges them to the Kaiord workout editor SPA. It lets the SPA
import this-week's planned activities without sending Train2Go credentials
to a Kaiord-hosted server.

This package is `private: true` and is not published to npm. The release
workflow packages it as a Chrome Web Store artifact.

## Purpose

- Fetch the current user's training-plan endpoints on
  `https://app.train2go.com/*` directly from the service worker with
  `credentials:"include"` (SW-direct) — the site's HttpOnly session cookie
  travels automatically, with no content script on `app.train2go.com` — and
  parse activities into a normalized shape (see `parser.js`).
- Expose a small message-passing surface (`ping`, `read-week`, `read-day`,
  `read-details`, ...) that the SPA reaches via `chrome.runtime.sendMessage`
  once it has discovered the extension ID at runtime through the
  `kaiord-announce.js` content script.
- Restrict communication to Kaiord-controlled origins
  (`https://*.kaiord.com/*` and `http://localhost/*` in dev) so other
  websites cannot drive the bridge.
- Surface a dead session (redirect / login response) as `needsReauth` so the
  editor can prompt a re-login.

There is no JavaScript public API exported from this package — the only
contract is the `chrome.runtime` message shape, documented inline in
`background.js`, and the parser output shape in `parser.js`.

## Build entrypoint

This is a browser extension, not a library — it has no `main` / `exports`.
The extension is loaded directly from the package directory via
`chrome://extensions/` → "Load unpacked".

Manifest entrypoints:

- `manifest.json` — development manifest (used for "Load unpacked").
- `manifest.prod.json` — production manifest used when packaging for the
  Chrome Web Store.
- `background.js` — service worker (SW-direct cookie fetch, path allowlist,
  message router).
- `session-fetch.js` — vendored bridge-core cookie transport
  (`credentials:"include"` fetch + redirect/`needsReauth` detection).
- `parser.js` — DOM-to-domain parser for the Train2Go training-plan view.
- `kaiord-announce.js` — content script injected into Kaiord origins that
  announces the extension's presence and ID to the SPA.
- `popup.html` / `popup.js` / `popup.css` — extension toolbar popup.

To package the extension for the store, the release workflow zips this
directory after swapping `manifest.json` for `manifest.prod.json`.

## How to test

```bash
# Run the unit-test suite (vitest + jsdom + a chrome-mock helper)
pnpm --filter @kaiord/train2go-bridge test

# Watch mode while iterating
pnpm --filter @kaiord/train2go-bridge test:watch

# Coverage report
pnpm --filter @kaiord/train2go-bridge test:coverage
```

Unit tests live in `test/` and cover `background.js`, `popup.js`,
`parser.js`, `kaiord-announce.js`, and `profile-snapshot.js` against the
chrome-API mock in `test/chrome-mock.js`. Parser fixtures live under
`test/fixtures/`.

For end-to-end / integration smoke checks against a real Train2Go session,
see [TESTING.md](./TESTING.md).

## License

MIT — see [LICENSE](../../LICENSE).
