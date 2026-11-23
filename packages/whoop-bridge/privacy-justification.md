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

**Data stored**: the session bearer, the decoded numeric WHOOP user id, and the capture timestamp. All three live only in `chrome.storage.session`. The bearer is never written to disk and is transmitted nowhere except back to WHOOP as part of an allowlisted read; the user id is returned to the Kaiord App only in answer to `read-user-id`, when it is about to import, and the capture timestamp is never returned (see "Data Handling" below). Separately, `chrome.storage.local` holds the Kaiord app's theme preference (`light`, `dark` or `system`) so the popup matches the app; it is not personal data and is sent nowhere.

## Website Access

### `app.whoop.com` `localStorage` (no separate permission — granted by the host permission below)

**Why**: Third and last session-bearer capture path. On every `app.whoop.com` page load the isolated content script (`scanCognitoStorage` in `content.js`) enumerates that origin's `localStorage` looking for the key WHOOP's own Amazon Cognito sign-in library writes — `CognitoIdentityServiceProvider.<client-id>.accessToken` — and reads the access token stored there. This is a credential **at rest**, unlike the two header-capture paths above, and it exists so the bridge is usable the moment the page loads rather than only after the WHOOP app happens to issue an authenticated request.

**Scope**: read-only, and only that one key pattern on that one origin. No other `localStorage` key is read, and the extension never writes, modifies, or removes anything in `localStorage`.

## Host Permissions

### `https://app.whoop.com/*`

**Why**: The user signs in to WHOOP here; the main-world interceptor (`inject-main.js`) and the isolated relay (`content.js`) run on this origin to capture the session bearer from the page's own requests and to execute allowlisted reads from the tab's own origin. The popup's "Open WHOOP" / "Sign in to WHOOP" action also opens this page.

### `https://api.prod.whoop.com/*`

**Why**: WHOOP's internal API host. The isolated content script fetches a fixed allowlist of read-only paths here using the captured session bearer, from the `app.whoop.com` tab's own origin.

## externally_connectable

### `http://localhost:5173/*`, `http://localhost:5174/*`

**Why**: Development origins for the Kaiord App (Vite dev server). Stripped from the production manifest.

### `https://kaiord.com/*`

**Why**: Production origin for the Kaiord App. Only this exact origin is declared; subdomains (`www` included) cannot reach the extension, and a message from any other origin gets no answer. Allows the deployed Kaiord App to communicate with the extension.

## Data Handling

- **No OAuth, no developer API key, no password**: The extension performs no OAuth flow, never asks for a WHOOP client id or secret, and never reads, stores, or transmits the user's WHOOP password. It reuses the browser's existing signed-in `app.whoop.com` session by capturing the bearer that session already holds.
- **Three capture paths, all local**: the main-world request interceptor (`inject-main.js`), the `chrome.webRequest.onBeforeSendHeaders` header reader (`background.js`), and the `localStorage` Cognito-token scan (`content.js`). The first two read a credential in flight; the third reads one at rest. All three are justified above, and all three feed the same memory-only session store.
- **Session bearer stays local and in memory**: The captured bearer lives only in `chrome.storage.session` on the user's device and is sent only to WHOOP (`api.prod.whoop.com`) as part of an allowlisted read. It is never logged, even truncated, and its value is never returned to the Kaiord App.
- **What the Kaiord App does receive**: the bridge's status response (the Session check) carries only a boolean `connected` flag, its typed outcome, and two more yes-or-no answers, whether the held sign-in names a WHOOP account (`hasAccountId`) and whether an `app.whoop.com` tab is open (`tabOpen`), so the Kaiord App shows the same notice as the popup; the numeric WHOOP user id decoded from the bearer's JWT `custom:user_id` claim is answered only to `read-user-id`, which the Kaiord App sends when it is about to import; and, for an allowlisted read, WHOOP's response as it came, unread, which the Kaiord App reads, except that the bridge first removes anything in it tied to the WHOOP sign-in: each form field and meta tag named as a token, CSRF, session or nonce value, an inline CSRF token's value, and each JSON entry named as a token, key, password, cookie or session id (WHOOP's answers carry none today). Never the token itself, and never the capture time.
- **Read-only, allowlisted**: Only a fixed list of `GET` paths of the `/core-details-bff`, `/metrics-service`, `/activities-service`, `/advanced-labs-service`, and `/health-service` internal APIs, each matched as a whole path with its query, is ever requested. The bridge exposes no path to write to WHOOP.
- **No external communication**: The extension talks only to WHOOP hosts and the allowed Kaiord App origins (via `externally_connectable`). No third-party servers.
- **No analytics or tracking**: No telemetry of any kind leaves the device.
