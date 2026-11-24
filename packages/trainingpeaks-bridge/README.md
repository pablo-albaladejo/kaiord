# @kaiord/trainingpeaks-bridge

Kaiord for TrainingPeaks: the Chrome extension (Manifest V3) that lets the
Kaiord App send workouts to your [TrainingPeaks](https://www.trainingpeaks.com)
calendar and read your weight. It works from your own signed-in TrainingPeaks
session, so no password is ever entered or sent to Kaiord, and the access
token it gets is sent only to TrainingPeaks.

This package is `private: true` and is not published to npm.

## Purpose

- Mint a short-lived access token from your existing TrainingPeaks session and
  read your consolidated timed metrics (weight and other health channels) from
  `tpapi.trainingpeaks.com`. It writes no metric back.
- **SW-direct, no relay**: all fetches happen in the background service worker;
  there is no content script on TrainingPeaks.
- **Dual transport, no password**: the durable credential is your own
  `Production_tpAuth` session cookie. The service worker exchanges it
  (cookie-only, `credentials:"include"`) for a ~1h Bearer via
  `GET /users/v3/token`, then calls the data endpoints with
  `Authorization: Bearer` (`credentials:"omit"`). On a 401 it re-runs the
  exchange once. The extension never reads or stores the cookie.
- Hand TrainingPeaks' answer to the Kaiord App **unread**, but for any Session secret in it, which it removes; the App's
  Connector reads it (a workout's id and day, the metrics through
  `@kaiord/trainingpeaks`). This bridge does not import it.
- Check the Session without a request (`ping` / `checkSession`): the only
  request the cookie authenticates mints a token, so the check reads only
  whether a token minted for an earlier read or send is still valid, and
  never exposes any token or the athlete id.

The only contract is the `chrome.runtime` message shape, documented inline in
`background.js`:

- `request` → `{ action: "request", method, path, body? }`, only for an entry
  of `ALLOWED` (a body only where the entry declares a schema, and only in that
  shape), answered `{ ok: true, protocolVersion: 2, data: { status,
contentType, body } }` with the body unread but for its Session secrets, which it removes; a dead Session is
  `needsReauth: true`, another failure keeps its `status`, and anything outside
  the list is `Request not allowed` with nothing sent. The App's Connector
  builds the path and reads the answer; it falls back to the protocol-1
  actions for the store version.
  The list: the metrics range read, the
  planned-workout write (`workout` body; a `402` is a date past the account's
  planning horizon) and the read of one workout by id (a `404` means
  TrainingPeaks does not have it). The token endpoint is not on it.
- `ping` / `checkSession` → the bridge manifest plus `{ session, authenticated }`:
  `session` is `signed-in` (a valid token is held) or `not-checked` (none is,
  and the first real read or send finds out).
- `read-athlete-id` → `{ athleteId }`, read when the Kaiord App is about to
  send a workout; this is where the token is minted. A dead session answers
  an error envelope with `needsReauth: true`.

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
- `background.js` — service worker (closed list with body schemas, `request`, action routing).
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
