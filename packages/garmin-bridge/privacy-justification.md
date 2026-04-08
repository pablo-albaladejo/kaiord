# Permission Justification

This document explains why each Chrome extension permission is required, for Chrome Web Store review.

## Permissions

### `storage`

**Why**: Persist the CSRF token in `chrome.storage.session` across MV3 service worker restarts. Without this, the token captured from Garmin's requests is lost when Chrome terminates the idle service worker (~30s), requiring the user to navigate Garmin Connect again.

**Data stored**: A single CSRF token string in session storage (not persisted to disk, cleared on browser close).

### `tabs`

**Why**: Query for open Garmin Connect tabs to route API requests to the content script, and open new Garmin Connect tabs via the `open-garmin` action.

**Usage**: `chrome.tabs.query({ url: "https://connect.garmin.com/*" })` and `chrome.tabs.create()`.

### `webRequest`

**Why**: Intercept outgoing requests from Garmin Connect pages to capture the `connect-csrf-token` header. This token is required for authenticated API calls. The extension only reads headers (observation), never modifies them.

**Usage**: `chrome.webRequest.onBeforeSendHeaders` with `["requestHeaders"]` on `https://connect.garmin.com/*`.

## Host Permissions

### `https://connect.garmin.com/*`

**Why**: Required for the content script to execute on Garmin Connect pages (same-origin API calls) and for `webRequest` to observe request headers on this domain.

## externally_connectable

### `http://localhost:5173/*`, `http://localhost:5174/*`

**Why**: Development origins for the Kaiord SPA (Vite dev server). Allows the SPA to communicate with the extension during development.

### `https://*.kaiord.com/*`

**Why**: Production origin for the Kaiord SPA. Allows the deployed SPA to communicate with the extension.

## Data Handling

- **No credentials stored**: The extension never reads, stores, or transmits user passwords or OAuth tokens.
- **No data persistence**: Only a CSRF token in session storage (cleared on browser close).
- **No external communication**: The extension only communicates with `connect.garmin.com` (via content script) and allowed SPA origins (via `externally_connectable`).
- **No analytics or tracking**: No telemetry of any kind.
