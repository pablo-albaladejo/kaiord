# @kaiord/whoop-bridge

Chrome extension (Manifest V3) that bridges the Kaiord workout editor SPA to
[WHOOP](https://www.whoop.com) health data. The extension piggybacks on the
user's existing signed-in `app.whoop.com` browser session — a main-world
content script captures the session bearer the WHOOP web app already
attaches to its own `api.prod.whoop.com` requests, and the extension relays
a fixed allowlist of read-only internal-API paths back to the SPA. There is
no OAuth flow, no developer app, and no password or long-lived credential is
ever entered, stored, or transmitted.

This package is `private: true` and is not published to npm. **It is not yet
registered with the Chrome Web Store** — unlike `@kaiord/garmin-bridge` and
`@kaiord/train2go-bridge`, no extension ID or publish secret exists for it
yet, so it is not built or uploaded by `cws-publish.yml`. Load it unpacked
for development and testing (see "Build entrypoint" below).

## Purpose

- Capture the WHOOP session bearer through **three** paths, all confined to
  the user's browser and all feeding the same session store:
  1. a `world: "MAIN"` interceptor injected at `document_start` on
     `https://app.whoop.com/*` wraps `fetch` / `XMLHttpRequest` to read the
     `Authorization: bearer` header, and relays it to the background through
     an isolated content script — `inject-main.js` → `content.js`;
  2. `chrome.webRequest.onBeforeSendHeaders` on
     `https://api.prod.whoop.com/*` reads that same header directly, for
     requests issued before the main-world script finished loading — it
     reads headers only and never mutates a request — `background.js`;
  3. `scanCognitoStorage()` reads the access token WHOOP's Cognito sign-in
     library persists under
     `CognitoIdentityServiceProvider.<client-id>.accessToken` in the
     `app.whoop.com` `localStorage`, on every page load, so the bridge works
     immediately instead of waiting for a live request — `content.js`.

  Path 3 reads a credential **at rest**; the other two read one in flight.
  All three are disclosed in `privacy-justification.md` and in the published
  privacy policy.

- Hold the bearer only in `chrome.storage.session` (memory-only; survives
  service-worker restarts, cleared on browser restart) and decode the
  numeric WHOOP user id from its JWT `custom:user_id` claim. The token is
  never logged and its value is never returned to the SPA; the status
  response carries `{ connected, userId, capturedAt }` — a boolean plus the
  decoded account id and capture time — see `background.js`.
- Relay allowlisted `GET` reads to `api.prod.whoop.com` from the tab origin
  so the request carries the tab's own credentials: cycle details
  (recovery/HRV, sleep, strain, workouts), metric series (e.g. heart rate),
  the sports catalog, Advanced-Labs biomarker tests, and daily stress. Any
  other path or method is rejected before a network call is made.
- Expose a small message-passing surface, split by caller. The SPA reaches
  only `ping`, `status`, and `whoop-fetch` via `chrome.runtime.sendMessage`
  — `EXTERNAL_ACTIONS` in `background.js` — once it has discovered the
  extension ID at runtime through the vendored `kaiord-announce.js` content
  script; every other action, and every non-Kaiord origin, is rejected with
  `{ ok: false, error: "Origin or action not permitted" }`. The remaining
  actions are **internal only**, reachable from the extension's own content
  script and popup but never from a web page: `capture-token` (relay a
  captured bearer to the background) and `open-whoop` (open the WHOOP
  dashboard in a new tab).
- Declare the `read:body`, `read:sleep`, and `read:activities` capabilities.
  There is no write capability — the bridge exposes no path to write to
  WHOOP.

There is no JavaScript public API exported from this package — the only
contract is the `chrome.runtime` message shape, documented inline in
`background.js` and `content.js`.

## Build entrypoint

This is a browser extension, not a library — it has no `main` / `exports`.
The extension is loaded directly from the package directory via
`chrome://extensions/` → "Load unpacked".

Manifest entrypoints:

- `manifest.json` — development manifest (used for "Load unpacked").
- `manifest.prod.json` — production manifest, ready for Chrome Web Store
  packaging once the extension is registered (see "Chrome Web Store
  registration" in `store-listing.md`).
- `background.js` — service worker (session-bearer store, the `webRequest`
  header-capture listener, `whoop-fetch` relay, action routing).
- `inject-main.js` — `world: "MAIN"` interceptor that captures the session
  bearer from the WHOOP web app's own requests.
- `content.js` — isolated-world relay between `inject-main.js` and the
  background, the `localStorage` Cognito-token scan, and the allowlisted API
  proxy executed from the tab origin.
- `kaiord-announce.js` — content script injected into Kaiord origins that
  announces the extension's presence and ID to the SPA.
- `popup.html` / `popup.js` / `popup.css` — extension toolbar popup.

## How to test

```bash
# Run the unit-test suite (vitest + jsdom + a chrome-mock helper)
pnpm --filter @kaiord/whoop-bridge test

# Watch mode while iterating
pnpm --filter @kaiord/whoop-bridge test:watch

# Coverage report
pnpm --filter @kaiord/whoop-bridge test:coverage
```

Unit tests live in `test/` and cover `background.js`, `content.js`,
`inject-main.js`, `kaiord-announce.js`, and `popup.js` against the
chrome-API mock in `test/chrome-mock.js`.

For end-to-end / integration smoke checks against a real WHOOP session, see
[TESTING.md](./TESTING.md).

## License

MIT — see [LICENSE](../../LICENSE).
