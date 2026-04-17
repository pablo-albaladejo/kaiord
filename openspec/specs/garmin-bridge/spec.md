> Synced: 2026-04-17

## Requirements

### Requirement: Extension manifest

The extension v1 SHALL target Chrome (Chromium-based browsers) only. Firefox is not supported due to lack of `externally_connectable` API.

The extension SHALL use Manifest V3 with the following permissions:

- `storage` — persist CSRF token in `chrome.storage.session` across service worker restarts
- `tabs` — query for Garmin Connect tabs and open new tabs
- `webRequest` — intercept outgoing requests to capture CSRF tokens

Host permissions SHALL include `https://connect.garmin.com/*`.

The `externally_connectable` field SHALL declare SPA origins: `http://localhost:5173/*`, `http://localhost:5174/*`, and `https://*.kaiord.com/*`.

The manifest SHALL declare a top-level `icons` field with sizes 16, 48, and 128. The `action.default_icon` field SHALL reference sizes 48 and 128 (Chrome does not use 16px for the action icon).

A production variant (`manifest.prod.json`) SHALL exist that excludes localhost origins from `externally_connectable` and is used for Chrome Web Store packaging.

#### Scenario: Extension loads with required permissions

- **WHEN** the extension is installed
- **THEN** it registers a `webRequest.onBeforeSendHeaders` listener for `https://connect.garmin.com/*`

#### Scenario: Extension declares icon sizes

- **WHEN** the extension manifest is read
- **THEN** the top-level `icons` field SHALL declare sizes 16, 48, and 128
- **AND** `action.default_icon` SHALL declare sizes 48 and 128

### Requirement: CSRF token capture

The background service worker SHALL intercept all requests to `https://connect.garmin.com/*` via `chrome.webRequest.onBeforeSendHeaders` and extract the `connect-csrf-token` header value. The captured token SHALL be stored using `chrome.storage.session` (encrypted, memory-only, survives service worker restarts, not persisted to disk).

The extension SHALL NOT log CSRF token values (even truncated) to the console. Diagnostic responses SHALL report CSRF status as a boolean (`true`/`false`), never the token value.

#### Scenario: CSRF token captured from Garmin navigation

- **WHEN** the user navigates Garmin Connect and the browser sends a request with a `connect-csrf-token` header
- **THEN** the extension stores the token value in `chrome.storage.session`

#### Scenario: CSRF token not yet captured

- **WHEN** the extension has just been installed and no Garmin requests have been intercepted
- **THEN** the CSRF token is `null` and API calls will fail with 403

#### Scenario: CSRF token survives service worker restart

- **WHEN** the MV3 service worker is terminated due to idle timeout and then restarted
- **THEN** the CSRF token is retrieved from `chrome.storage.session` and API calls continue to work

### Requirement: Content script path/method allowlist

The content script SHALL only execute fetch requests to paths matching a predefined allowlist. The allowlist SHALL be:

- `GET` requests matching `/workout-service/workouts` (with any query params)
- `POST` requests matching `/workout-service/workout`

Requests to paths or methods outside the allowlist SHALL be rejected with `{ ok: false, error: "Blocked: disallowed path or method" }` without making any network call.

#### Scenario: Allowed GET request passes validation

- **WHEN** a `garmin-fetch` message arrives with method `GET` and path `/workout-service/workouts?start=0&limit=20`
- **THEN** the content script executes the fetch

#### Scenario: Allowed POST request passes validation

- **WHEN** a `garmin-fetch` message arrives with method `POST` and path `/workout-service/workout`
- **THEN** the content script executes the fetch

#### Scenario: Disallowed path is rejected

- **WHEN** a `garmin-fetch` message arrives with path `/userprofile-service/usersettings`
- **THEN** the content script returns `{ ok: false, error: "Blocked: disallowed path or method" }` without making a network call

#### Scenario: Disallowed method is rejected

- **WHEN** a `garmin-fetch` message arrives with method `DELETE` and path `/workout-service/workout/123`
- **THEN** the content script returns `{ ok: false, error: "Blocked: disallowed path or method" }` without making a network call

### Requirement: Content script API proxy

A content script injected into `connect.garmin.com` at `document_start` SHALL handle `garmin-fetch` messages by executing `fetch()` calls to `/gc-api/*` endpoints. The content script SHALL capture a pristine reference to `window.fetch` at load time to prevent interference from page scripts.

The content script SHALL include the following headers on every request:

- `nk: NT`
- `x-requested-with: XMLHttpRequest`
- `connect-csrf-token: {captured token}` (when provided)
- `Content-Type: application/json` (for POST requests with a body)

The `credentials` option SHALL be set to `"include"` so the browser attaches session cookies automatically.

The content script SHALL use an `AbortController` with a 30-second timeout on every fetch to prevent indefinite hangs.

For responses with status 204 (No Content), the content script SHALL return `null` as the data instead of attempting to parse JSON.

#### Scenario: Successful GET request via content script

- **WHEN** the background sends a `garmin-fetch` message with path `/workout-service/workouts?start=0&limit=20` and method `GET`
- **THEN** the content script executes `fetch("/gc-api/workout-service/workouts?start=0&limit=20")` with required headers and returns `{ ok: true, status: 200, data: [...] }`

#### Scenario: Successful POST request via content script

- **WHEN** the background sends a `garmin-fetch` message with method `POST` and a JSON body
- **THEN** the content script includes `Content-Type: application/json` and the serialized body

#### Scenario: API returns error

- **WHEN** the Garmin API returns a non-2xx status
- **THEN** the content script returns `{ ok: false, status: <code>, body: <text> }`

#### Scenario: API returns 204 No Content

- **WHEN** the Garmin API returns status 204
- **THEN** the content script returns `{ ok: true, status: 204, data: null }`

#### Scenario: Request times out

- **WHEN** the Garmin API does not respond within 30 seconds
- **THEN** the fetch is aborted and the content script returns `{ ok: false, error: "Request timed out" }`

### Requirement: Garmin tab dependency

All API operations SHALL require an open Garmin Connect tab (`https://connect.garmin.com/*`). If no tab is found, the operation SHALL fail with a descriptive error message.

#### Scenario: No Garmin Connect tab open

- **WHEN** the SPA or popup requests an API operation and no `connect.garmin.com` tab exists
- **THEN** the extension returns an error: "No Garmin Connect tab open. Open connect.garmin.com first."

### Requirement: External message API

The extension SHALL handle messages from allowed SPA origins via `chrome.runtime.onMessageExternal` with the following actions:

- `ping` — Returns session check results (CSRF boolean, API reachability, protocol version)
- `list` — Returns workout list from Garmin Connect (timeout: 10s)
- `push` — Pushes a GCN workout payload to Garmin Connect (requires `message.gcn`, timeout: 15s)
- `open-garmin` — Opens `https://connect.garmin.com/modern/` in a new tab

All responses SHALL use the shape `{ ok: boolean, protocolVersion?: number, data?: unknown, error?: string }`.

The `ping` response SHALL include `protocolVersion: 1` (integer, bumped only when the message contract changes).

#### Scenario: SPA pings extension

- **WHEN** the SPA sends `{ action: "ping" }` to the extension
- **THEN** the extension returns `{ ok: true, protocolVersion: 1, data: { csrfCaptured: true, gcApi: { ok: true, status: 200 } } }`

#### Scenario: SPA lists workouts

- **WHEN** the SPA sends `{ action: "list" }` to the extension
- **THEN** the extension returns `{ ok: true, data: [{ workoutId, workoutName, sportType, ... }] }`

#### Scenario: SPA pushes a workout

- **WHEN** the SPA sends `{ action: "push", gcn: { workoutName: "...", steps: [...] } }` to the extension
- **THEN** the extension pushes the GCN payload to Garmin Connect and returns `{ ok: true, data: { workoutId, ... } }`

#### Scenario: SPA requests Garmin tab opening

- **WHEN** the SPA sends `{ action: "open-garmin" }` to the extension
- **THEN** the extension opens `https://connect.garmin.com/modern/` in a new tab and returns `{ ok: true }`

#### Scenario: SPA sends unknown action

- **WHEN** the SPA sends `{ action: "unknown" }`
- **THEN** the extension returns `{ ok: false, error: "Unknown action: unknown" }`

#### Scenario: SPA sends message with incompatible protocol

- **WHEN** the SPA receives a ping response without `protocolVersion` or with an unsupported version
- **THEN** the SPA shows "Update your Kaiord Garmin Bridge extension"
