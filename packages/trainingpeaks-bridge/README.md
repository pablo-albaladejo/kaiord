# @kaiord/trainingpeaks-bridge

Chrome extension (Manifest V3) that bridges the Kaiord editor to
[TrainingPeaks](https://www.trainingpeaks.com). It reads your own body metrics
directly from your logged-in TrainingPeaks session — no password is ever
entered or sent to a Kaiord-hosted server — and returns the raw JSON to the
Kaiord SPA for parsing.

This package is `private: true` and is not published to npm. The release
workflow packages it as a Chrome Web Store artifact.

## Purpose

- Mint a short-lived access token from your existing TrainingPeaks session and
  read your consolidated timed metrics (weight and other health channels) from
  `tpapi.trainingpeaks.com`, optionally writing a weight measurement back.
- **SW-direct, no relay**: all fetches happen in the background service worker;
  there is no content script on TrainingPeaks.
- **Dual transport, no password**: the durable credential is your own
  `Production_tpAuth` session cookie. The service worker exchanges it
  (cookie-only, `credentials:"include"`) for a ~1h Bearer via
  `GET /users/v3/token`, then calls the data endpoints with
  `Authorization: Bearer` (`credentials:"omit"`). On a 401 it re-runs the
  exchange once. The extension never reads or stores the cookie.
- Return **raw JSON only**. Parsing lives in `@kaiord/trainingpeaks` and runs
  SPA-side; this bridge does not import it.
- Report session presence as a boolean (`ping` / `checkSession`) plus the
  resolved athlete id, for the SPA connection pill — never exposing any token.

The only contract is the `chrome.runtime` message shape, documented inline in
`background.js`:

- `read-metrics` → `{ ok: true, data: <raw consolidatedtimedmetrics JSON> }`,
  or an error envelope with `needsReauth: true` when the session is dead.
- `push-weight` → posts a `type 9` weight metric (`write:body`).
- `ping` / `checkSession` → the bridge manifest plus `{ authenticated, athleteId }`.

## Least-privilege manifest

- `permissions`: `["storage"]` only — **no** `cookies`, `webRequest`,
  `declarativeNetRequest*`, `tabs`, or `scripting`.
- `host_permissions`: `["https://tpapi.trainingpeaks.com/*"]` — a single
  disclosed host. The `Production_tpAuth` cookie is a domain-wide
  `.trainingpeaks.com` cookie, so it reaches `tpapi.trainingpeaks.com`
  automatically; no `home.trainingpeaks.com` permission is needed.
- `content_scripts`: only the announce-only `bridge-identity.js` +
  `kaiord-announce.js` pair on Kaiord origins — nothing on TrainingPeaks.

## Build entrypoint

This is a browser extension, not a library — it has no `main` / `exports`.
Load it from the package directory via `chrome://extensions/` → "Load
unpacked". Manifest entrypoints:

- `manifest.json` — development manifest (used for "Load unpacked").
- `manifest.prod.json` — production manifest used when packaging for the store.
- `background.js` — service worker (path allowlist, throttle, action routing).
- `tp-auth.js` — dual-transport auth (cookie→token→Bearer).
- `session-fetch.js` / `bearer-fetch.js` — vendored identity-free transports
  (loaded via `importScripts`).
- `kaiord-announce.js` — content script injected into Kaiord origins that
  announces the extension's presence and ID to the SPA.
- `popup.html` / `popup.js` / `popup.css` — extension toolbar popup.

## How to test

```bash
# Run the unit-test suite (vitest + jsdom + a chrome-mock helper)
pnpm --filter @kaiord/trainingpeaks-bridge test

# Watch mode while iterating
pnpm --filter @kaiord/trainingpeaks-bridge test:watch

# Coverage report
pnpm --filter @kaiord/trainingpeaks-bridge test:coverage
```

For manual integration checks against a real TrainingPeaks session, see
[TESTING.md](./TESTING.md).

## License

MIT — see [LICENSE](../../LICENSE).
