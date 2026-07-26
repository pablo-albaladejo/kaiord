# Permission Justification

This document explains why each Chrome extension permission is required, for
Chrome Web Store review.

## Permissions

### `storage`

**Why**: Holds the short-lived access token minted from the user's own
TrainingPeaks session (in `chrome.storage.local`, so it survives service-worker
restarts) plus lightweight local state. No password and no session cookie value
is ever stored.

## Host Permissions

### `https://tpapi.trainingpeaks.com/*`

**Why**: The extension's background service worker performs two kinds of request
against the TrainingPeaks internal API:

1. `GET https://tpapi.trainingpeaks.com/users/v3/token` — a cookie-only request
   (`credentials: "include"`, no `Authorization` header) that exchanges the
   user's existing `Production_tpAuth` session cookie for a short-lived access
   token. The `Production_tpAuth` cookie is a domain-wide `.trainingpeaks.com`
   cookie, so it is attached to this `tpapi.trainingpeaks.com` request
   automatically by the browser — no `home.trainingpeaks.com` permission is
   required.
2. Data calls to `https://tpapi.trainingpeaks.com/metrics/v3/...` using
   `Authorization: Bearer <token>` (`credentials: "omit"`) to read the user's
   consolidated timed metrics and, on user action, write a weight measurement.

The extension never reads, stores, or transmits the cookie or the user's
password.

## externally_connectable

### `http://localhost:5173/*`, `http://localhost:5174/*`

**Why**: Development origins for the Kaiord SPA (Vite dev server). Stripped from
the production manifest.

### `https://*.kaiord.com/*`

**Why**: Production origin for the Kaiord editor. Allows the deployed SPA to
request metric reads/writes via Chrome's one-way inbound
`externally_connectable` channel.

## Data Handling

- **No passwords**: The extension never reads, stores, or transmits the user's
  TrainingPeaks password. It reuses the browser's existing signed-in session.
- **No cookie access**: The extension does NOT declare the `cookies` permission
  and cannot read the `Production_tpAuth` session cookie; the cookie travels
  automatically with the token-exchange fetch and is never exposed to extension
  code. Session presence is reported to the editor only as a boolean.
- **Raw JSON only**: Metric JSON is handed to the Kaiord editor for parsing; the
  extension does not interpret or persist body-composition data.
- **No external communication**: The extension talks only to
  `tpapi.trainingpeaks.com` and the allowed Kaiord SPA origins. No third-party
  servers, no analytics, no telemetry.
