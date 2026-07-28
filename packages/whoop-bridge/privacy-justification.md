# Permission Justification

This document explains why each Chrome extension permission is required, for Chrome Web Store review.

## Permissions

### `tabs`

**Why**: Find an open `app.whoop.com` tab to relay allowlisted reads through (`chrome.tabs.query`), and open a new WHOOP tab via the popup's "Sign in to WHOOP" / "Open WHOOP" action.

### `webRequest`

**Why**: Secondary session-bearer capture path. `chrome.webRequest.onBeforeSendHeaders` reads the `Authorization` header WHOOP's own web app attaches to its `api.prod.whoop.com` requests, in case the main-world interceptor missed the live request (e.g. a request issued before the content script finished injecting). No request is modified or blocked — the listener only reads headers.

### `scripting`

**Why**: Re-inject the extension's own declared content scripts into `app.whoop.com` tabs that were already open before the extension was installed or reloaded. Without this, the bridge silently breaks in those tabs until the user manually reloads them.

**Usage**: `chrome.scripting.executeScript({ target: { tabId }, files: script.js })` in `background.js`, injecting only files bundled with the extension, restricted to tabs matching the already-granted host permission (`https://app.whoop.com/*`). No remote code is ever fetched or executed.

### `storage`

**Why**: Hold the captured session bearer in `chrome.storage.session` — memory-only storage that survives service-worker restarts but is cleared when the browser closes. No password, developer API key, or long-lived token is ever stored.

**Data stored**: the session bearer, the decoded numeric WHOOP user id, and the capture timestamp. All three live only in `chrome.storage.session` and are never written to disk or transmitted anywhere except back to WHOOP as part of an allowlisted read.

## Host Permissions

### `https://app.whoop.com/*`

**Why**: The user signs in to WHOOP here; the main-world interceptor (`inject-main.js`) and the isolated relay (`content.js`) run on this origin to capture the session bearer from the page's own requests and to execute allowlisted reads from the tab's own origin. The popup's "Open WHOOP" / "Sign in to WHOOP" action also opens this page.

### `https://api.prod.whoop.com/*`

**Why**: WHOOP's internal API host. The isolated content script fetches a fixed allowlist of read-only paths here using the captured session bearer, from the `app.whoop.com` tab's own origin.

## externally_connectable

### `http://localhost:5173/*`, `http://localhost:5174/*`

**Why**: Development origins for the Kaiord SPA (Vite dev server). Stripped from the production manifest.

### `https://*.kaiord.com/*`

**Why**: Production origin for the Kaiord SPA. Allows the deployed SPA to communicate with the extension.

## Data Handling

- **No OAuth, no developer API key, no password**: The extension performs no OAuth flow, never asks for a WHOOP client id or secret, and never reads, stores, or transmits the user's WHOOP password. It reuses the browser's existing signed-in `app.whoop.com` session by capturing the bearer that session already attaches to its own requests.
- **Session bearer stays local and in memory**: The captured bearer lives only in `chrome.storage.session` on the user's device and is sent only to WHOOP (`api.prod.whoop.com`) as part of an allowlisted read. It is never logged, even truncated; session presence is reported to callers only as a boolean.
- **Read-only, allowlisted**: Only a fixed set of `GET` paths under the `/core-details-bff`, `/metrics-service`, `/activities-service`, `/advanced-labs-service`, and `/health-service` internal-API prefixes are ever requested. The bridge exposes no path to write to WHOOP.
- **No external communication**: The extension talks only to WHOOP hosts and the allowed Kaiord SPA origins (via `externally_connectable`). No third-party servers.
- **No analytics or tracking**: No telemetry of any kind leaves the device.
