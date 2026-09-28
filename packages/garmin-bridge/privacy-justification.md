# Permission Justification

This document explains why each Chrome extension permission is required, for Chrome Web Store review.

## Permissions

### `storage`

**Why**: Persist the Garmin OAuth token pair (and cached profile snapshot) so the bridge can call Garmin on the user's behalf across MV3 service worker restarts without re-authenticating every time.

**Data stored** (`chrome.storage.local`): the OAuth1 token (long-lived) and OAuth2 access/refresh token minted from the user's own Garmin session, plus the cached profile snapshot pushed by the Kaiord SPA. All data stays on the user's device; nothing is transmitted anywhere except to Garmin's own servers.

### `scripting`

**Why**: Re-inject the extension's own declared content scripts into Garmin Connect tabs that were already open before the extension was installed/updated, and after MV3 service worker cold starts leave stale message listeners in those tabs. Without this, the bridge silently breaks until the user manually reloads every Garmin tab.

**Usage**: `chrome.scripting.executeScript({ target: { tabId }, files: script.js })` in `background.js`, injecting only files bundled with the extension (the same `content.js` declared in the manifest), restricted to tabs matching the already-granted host permission (`https://connect.garmin.com/*`). No remote code is ever fetched or executed.

## Host Permissions

### `https://connect.garmin.com/*`

**Why**: The user signs in to Garmin Connect here; the `open-garmin` action opens this page so the user can establish the session the bridge mints a token from.

### `https://sso.garmin.com/*`

**Why**: Exchange the user's existing Garmin single-sign-on session for a short-lived service ticket (no password is entered or seen by the extension).

### `https://connectapi.garmin.com/*`

**Why**: Exchange the ticket for an OAuth token and make the actual workout/activity API calls with `Authorization: Bearer` — this is Garmin's API host.

**Calendar write and delete**: When the user places workouts on their Garmin Connect calendar from Kaiord, the extension calls two calendar endpoints on this host. `POST /workout-service/schedule/{workoutId}` places a library workout on a date, sending only that date. `DELETE /workout-service/schedule/{workoutScheduleId}` removes one calendar entry, and is only ever called with an id Garmin itself returned for an entry Kaiord placed and has since replaced (for example after the workout moved to another day). Both paths accept numeric ids only, are enforced by an allowlist in the service worker, and never delete a library workout.

## externally_connectable

### `http://localhost:5173/*`, `http://localhost:5174/*`

**Why**: Development origins for the Kaiord SPA (Vite dev server).

### `https://*.kaiord.com/*`

**Why**: Production origin for the Kaiord SPA. Allows the deployed SPA to communicate with the extension.

## Data Handling

- **No passwords**: The extension never reads, stores, or transmits the user's Garmin password. It reuses the browser's existing signed-in session to mint a token.
- **Tokens stay local**: OAuth tokens live in `chrome.storage.local` on the user's device and are sent only to Garmin (`connectapi.garmin.com`) as a Bearer credential.
- **Calendar changes only on the user's action**: The extension writes to or deletes from the Garmin calendar only when the user pushes or sends workouts from Kaiord, and deletes only entries Kaiord placed. From Garmin's answer to a placement it passes back only the new entry's id, never the rest of the response.
- **No external communication**: The extension talks only to Garmin hosts and the allowed Kaiord SPA origins (via `externally_connectable`). No third-party servers.
- **No analytics or tracking**: No telemetry of any kind leaves the device.
