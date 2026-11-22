## MODIFIED Requirements

### Requirement: Extension manifest and permissions

The extension SHALL use Manifest V3 and target Chromium-based browsers only.
Its permissions SHALL be exactly `tabs`, `webRequest`, `scripting`, and
`storage`. It SHALL NOT request the `identity` permission. Host permissions
SHALL include `https://api.prod.whoop.com/*` and `https://app.whoop.com/*`.
The `externally_connectable` field SHALL declare the SPA origins
`http://localhost:5173/*`, `http://localhost:5174/*`, and
`https://kaiord.com/*`. The manifest SHALL declare two content scripts on
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

### Requirement: Runtime announcement on SPA origins

The extension SHALL inject `kaiord-announce.js` at `document_start` on SPA
origins (`https://kaiord.com/*` and, in dev, `http://localhost/*`) and post a
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
`https://kaiord.com/*` as the announce match.

#### Scenario: WHOOP bridge announces enum-valid capabilities

- **WHEN** the extension is installed and its announce script runs on a kaiord origin
- **THEN** the announcement SHALL include `bridgeId: "whoop-bridge"` and a `capabilities` array containing `read:body` and `read:sleep`, every element of which is a member of `bridgeCapabilitySchema`

#### Scenario: SPA requests rediscovery

- **WHEN** the SPA posts `{ type: "KAIORD_BRIDGE_DISCOVER" }` to its own origin
- **THEN** the announce script re-announces with the same payload

### Requirement: Origin-pinned external message API

The extension SHALL expose exactly `ping`, `status`, `whoop-fetch`, and
`set-theme` to external (SPA) callers via `chrome.runtime.onMessageExternal` —
`ping` returns the bridge manifest plus the session status, `status` returns the
session status (`{ connected, userId, capturedAt }` — never the token),
`whoop-fetch` relays an allowed read, and `set-theme` stores the app's theme
preference for the popup (spec: bridge-core). The `capture-token` and `open-whoop` actions SHALL be
reachable only over the internal `chrome.runtime.onMessage` channel (the
extension's own content script and popup) and SHALL NOT appear in the external
action allowlist. It SHALL accept external messages only from sender origins
matching `https://kaiord.com` (exact match; no subdomain, `www` included) or, in development builds only, `http://localhost:5173|5174`, giving any
other origin no answer (spec: bridge-core). All
responses SHALL use `{ ok, protocolVersion, data?, error? }`, and manifest
identity keys SHALL take precedence over any upstream values on collision.

#### Scenario: SPA pings the WHOOP bridge

- **WHEN** an allowed SPA origin sends `{ action: "ping" }`
- **THEN** the extension returns `{ ok: true, protocolVersion: 1, data: { id: "whoop-bridge", name: "WHOOP", version: "<pkg version>", capabilities: ["read:body", "read:sleep"], ... } }`

#### Scenario: Disallowed origin is rejected

- **WHEN** a page whose origin is not an allowed SPA origin, a `kaiord.com` subdomain included, sends any external message
- **THEN** the extension gives no answer and performs no read

#### Scenario: Internal-only action is rejected from an allowed origin

- **WHEN** an allowed SPA origin sends `{ action: "open-whoop" }` or `{ action: "capture-token" }`
- **THEN** the extension returns `{ ok: false, error: "Origin or action not permitted" }` and does not run the handler

#### Scenario: Unknown action is rejected

- **WHEN** an allowed origin sends `{ action: "push" }`
- **THEN** the extension returns `{ ok: false, error: "Unknown action: push" }`
