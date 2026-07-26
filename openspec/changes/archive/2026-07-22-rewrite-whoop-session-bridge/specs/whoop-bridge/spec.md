## ADDED Requirements

### Requirement: Extension manifest and permissions

The extension SHALL use Manifest V3 and target Chromium-based browsers only.
Its permissions SHALL be exactly `tabs`, `webRequest`, `scripting`, and
`storage`. It SHALL NOT request the `identity` permission. Host permissions
SHALL include `https://api.prod.whoop.com/*` and `https://app.whoop.com/*`.
The `externally_connectable` field SHALL declare the SPA origins
`http://localhost:5173/*`, `http://localhost:5174/*`, and
`https://*.kaiord.com/*`. The manifest SHALL declare two content scripts on
`https://app.whoop.com/*` at `document_start`: a `world: "MAIN"` interceptor
and an isolated-world relay. A production variant (`manifest.prod.json`) SHALL
exclude localhost origins.

#### Scenario: Extension loads without OAuth permissions

- **WHEN** the extension is installed
- **THEN** its manifest SHALL declare permissions `tabs`, `webRequest`, `scripting`, `storage` and SHALL NOT declare `identity`
- **AND** host permissions SHALL include `https://api.prod.whoop.com/*` and `https://app.whoop.com/*`

#### Scenario: Two content scripts on the WHOOP origin

- **WHEN** the manifest is read
- **THEN** it SHALL declare a `world: "MAIN"` content script and an isolated content script, both matching `https://app.whoop.com/*` at `document_start`

### Requirement: No OAuth and no stored credentials

The extension SHALL NOT perform any OAuth flow, SHALL NOT prompt for or store a
WHOOP client id or secret, and SHALL NOT hold any refresh token. Its only
authorization material SHALL be the session bearer captured from the user's own
requests, held in memory-only session storage.

#### Scenario: No credential entry surface

- **WHEN** the user opens the extension popup
- **THEN** there SHALL be no client-id or client-secret input, and no OAuth "connect" that opens a WHOOP authorization page

### Requirement: Session bearer capture via main-world interceptor

The `world: "MAIN"` content script SHALL wrap `window.fetch` and
`XMLHttpRequest.prototype.setRequestHeader` at `document_start` to read the
`Authorization: bearer <token>` header WHOOP attaches to its
`api.prod.whoop.com` requests, and SHALL forward the token to the isolated
content script via `window.postMessage` **targeted at the page origin**
(`https://app.whoop.com`, not `"*"`). The isolated content-script listener SHALL
accept the message only when `event.source === window` and `event.origin ===
"https://app.whoop.com"`, then relay it to the background, which SHALL store it
in `chrome.storage.session` and decode the numeric user id from the JWT
`custom:user_id` claim. The background SHALL also capture the header via
`chrome.webRequest.onBeforeSendHeaders` as a secondary path. The extension SHALL
NOT log the token value; session status SHALL be reported as a boolean.

#### Scenario: Token captured from a WHOOP API call

- **WHEN** the WHOOP web app issues an authenticated request to `api.prod.whoop.com` while the interceptor is installed
- **THEN** the extension SHALL store the bearer in `chrome.storage.session` and decode and store the numeric user id

#### Scenario: Token not yet captured

- **WHEN** the extension is freshly installed and no WHOOP API request has been intercepted
- **THEN** the stored token SHALL be absent and read operations SHALL fail with a "no session token captured — open app.whoop.com and reload it" error

#### Scenario: Token survives service worker restart

- **WHEN** the MV3 service worker is terminated on idle and restarted
- **THEN** the token SHALL be retrieved from `chrome.storage.session` and read operations SHALL continue to work

#### Scenario: Token is never logged

- **WHEN** any diagnostic or status response is produced
- **THEN** it SHALL report session presence as a boolean and SHALL NOT contain the token value, even truncated

#### Scenario: Spoofed or wrong-origin token message rejected

- **WHEN** a `postMessage` carrying a token arrives whose `event.source` is not `window` or whose `event.origin` is not `https://app.whoop.com`
- **THEN** the isolated content script SHALL ignore it and SHALL NOT relay any token to the background

### Requirement: Read-only internal-API path allowlist

The content script SHALL execute only `GET` requests whose path matches a fixed
allowlist of read-only internal-API prefixes covering the WHOOP data program:

- `/core-details-bff/v0/cycles/details` — recovery, sleep, strain, workouts
- `/metrics-service/v1/metrics/user/` — heart-rate (and other named) series
- `/activities-service/v1/sports/history` — sport catalog
- `/advanced-labs-service/v1/biomarker-tests` — lab tests and values
- `/health-service/v2/stress-bff` — daily stress

Paths outside the allowlist, and any non-`GET` method, SHALL be rejected with
`{ ok: false, error: "Blocked: disallowed path or method" }` without making a
network call. The bridge SHALL expose no write path for WHOOP. Adding a new read
endpoint in a later implementation wave SHALL mean extending this allowlist and
nothing else.

#### Scenario: Allowed cycles read passes

- **WHEN** a `whoop-fetch` message arrives with a `GET` path under `/core-details-bff/v0/cycles/details`
- **THEN** the content script executes the fetch

#### Scenario: Disallowed path is rejected

- **WHEN** a `whoop-fetch` message arrives with path `/membership-service/v1/affiliate`
- **THEN** the content script returns `{ ok: false, error: "Blocked: disallowed path or method" }` without making a network call

#### Scenario: Non-GET method is rejected

- **WHEN** a `whoop-fetch` message arrives with a `POST` method
- **THEN** the content script returns `{ ok: false, error: "Blocked: disallowed path or method" }` without making a network call

### Requirement: Content-script API proxy in the tab origin

The isolated content script SHALL execute allowed reads by fetching
`https://api.prod.whoop.com${path}` from the `app.whoop.com` tab origin with
the captured bearer as `Authorization: bearer <token>`, `Accept:
application/json`, and `credentials: "include"`. It SHALL apply an
`AbortController` with a 30-second timeout and SHALL parse a JSON body,
returning `{ ok, status, data }`.

#### Scenario: Successful read via content script

- **WHEN** the background relays an allowed `whoop-fetch` for a cycles path and the API returns 200
- **THEN** the content script returns `{ ok: true, status: 200, data: <parsed JSON> }`

#### Scenario: API returns an error status

- **WHEN** the WHOOP API returns a non-2xx status
- **THEN** the content script returns `{ ok: false, status: <code> }` (or `{ ok, status, data }` carrying the error body), without throwing

#### Scenario: Request times out

- **WHEN** the WHOOP API does not respond within 30 seconds
- **THEN** the fetch is aborted and the content script returns `{ ok: false, error: "Timed out" }`

### Requirement: WHOOP tab dependency

All read operations SHALL require an open `app.whoop.com` tab. If no such tab
is found, the operation SHALL fail with a descriptive error.

#### Scenario: No WHOOP tab open

- **WHEN** the SPA or popup requests a read and no `app.whoop.com` tab exists
- **THEN** the extension returns an error: "No app.whoop.com tab open."

### Requirement: Runtime announcement on SPA origins

The extension SHALL inject `kaiord-announce.js` at `document_start` on SPA
origins (`https://*.kaiord.com/*` and, in dev, `http://localhost/*`) and post a
`KAIORD_BRIDGE_ANNOUNCE` message to the page origin with `bridgeId:
"whoop-bridge"`, `extensionId: chrome.runtime.id`, `name: "WHOOP"`, `version`,
`protocolVersion: 1`, and a `capabilities` array whose tokens are drawn ONLY
from the SPA's frozen `bridgeCapabilitySchema` enum — a single out-of-enum token
would fail the SPA's manifest verification and reject the bridge. Recovery/HRV,
vitals, strain, and stress are body metrics gated by `read:body`; sleep by
`read:sleep`; workouts (imported as activities) by `read:activities`. The
declared list SHALL grow per wave using only those existing tokens: Wave 1
declares `read:body` and `read:sleep`; the workouts wave adds `read:activities`.
No new capability token is introduced. It SHALL re-announce on
`KAIORD_BRIDGE_DISCOVER`. The production manifest SHALL declare only
`https://*.kaiord.com/*` as the announce match.

#### Scenario: WHOOP bridge announces enum-valid capabilities

- **WHEN** the extension is installed and its announce script runs on a kaiord origin
- **THEN** the announcement SHALL include `bridgeId: "whoop-bridge"` and a `capabilities` array containing `read:body` and `read:sleep`, every element of which is a member of `bridgeCapabilitySchema`

#### Scenario: SPA requests rediscovery

- **WHEN** the SPA posts `{ type: "KAIORD_BRIDGE_DISCOVER" }` to its own origin
- **THEN** the announce script re-announces with the same payload

### Requirement: Origin-pinned external message API

The extension SHALL handle SPA messages via `chrome.runtime.onMessageExternal`
for the actions `ping` (returns the bridge manifest plus a boolean session
status), `status` (returns the session status), and `whoop-fetch` (relays an
allowed read). It SHALL accept external messages only from sender origins
matching `https://*.kaiord.com` or `http://localhost:5173|5174`, rejecting
others with `{ ok: false, error: "Origin or action not permitted" }`. All
responses SHALL use `{ ok, protocolVersion, data?, error? }`, and manifest
identity keys SHALL take precedence over any upstream values on collision.

#### Scenario: SPA pings the WHOOP bridge

- **WHEN** an allowed SPA origin sends `{ action: "ping" }`
- **THEN** the extension returns `{ ok: true, protocolVersion: 1, data: { id: "whoop-bridge", name: "WHOOP", version: "<pkg version>", capabilities: ["read:body", "read:sleep"], ... } }`

#### Scenario: Disallowed origin is rejected

- **WHEN** a page whose origin is not an allowed SPA origin sends any external message
- **THEN** the extension returns `{ ok: false, error: "Origin or action not permitted" }` and performs no read

#### Scenario: Unknown action is rejected

- **WHEN** an allowed origin sends `{ action: "push" }`
- **THEN** the extension returns `{ ok: false, error: "Unknown action: push" }`
