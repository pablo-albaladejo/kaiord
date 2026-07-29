> Synced: 2026-07-29

# Garmin Bridge

## Purpose

Chrome extension that connects Kaiord's workout editor to Garmin Connect. It mints OAuth tokens **once** from the user's existing browser sign-in and thereafter calls `connectapi.garmin.com` directly from the service worker with a Bearer header — no password, no stored Garmin credential, no CSRF relay, no Garmin tab, and no content script on Garmin origins.

## Requirements

### Requirement: Extension manifest

The extension SHALL target Chrome (Chromium-based browsers) only. Firefox is not supported due to lack of the `externally_connectable` API.

The extension SHALL use Manifest V3 and SHALL request `storage` as its ONLY `permissions` entry. It SHALL NOT request `webRequest` (nothing is intercepted) and SHALL NOT request `tabs` (nothing reads tab URLs; opening a tab needs no permission). Every additional permission is a Chrome Web Store review surface, so the set is deliberately minimal and any addition SHALL be justified in `privacy-justification.md`.

Host permissions SHALL be exactly `https://connect.garmin.com/*`, `https://connectapi.garmin.com/*` and `https://sso.garmin.com/*` — the sign-in origin the token is minted from, the API origin the reads and writes go to, and the dashboard the popup opens.

Content scripts SHALL be injected on SPA origins ONLY (`https://*.kaiord.com/*` and, in dev, `http://localhost/*`), loading `bridge-identity.js` before `kaiord-announce.js` at `document_start`. No content script SHALL be injected on any Garmin origin.

The `externally_connectable` field SHALL declare `http://localhost:5173/*`, `http://localhost:5174/*` and `https://*.kaiord.com/*`.

The manifest SHALL declare a top-level `icons` field with sizes 16, 48 and 128. The `action.default_icon` field SHALL reference sizes 48 and 128 (Chrome does not use 16px for the action icon).

A production variant (`manifest.prod.json`) SHALL exist that strips every localhost origin — from both the announce content-script matches and `externally_connectable` — and is used for Chrome Web Store packaging.

#### Scenario: Extension requests only storage

- **WHEN** the extension manifest is read
- **THEN** `permissions` SHALL be exactly `["storage"]`, containing neither `webRequest` nor `tabs`

#### Scenario: No content script runs on Garmin

- **WHEN** the manifest's `content_scripts` matches are read
- **THEN** every entry SHALL match a Kaiord SPA origin only, and none SHALL match a `garmin.com` origin

#### Scenario: Extension declares icon sizes

- **WHEN** the extension manifest is read
- **THEN** the top-level `icons` field SHALL declare sizes 16, 48 and 128
- **AND** `action.default_icon` SHALL declare sizes 48 and 128

### Requirement: OAuth token minting from the browser sign-in

The extension SHALL authenticate to Garmin with OAuth tokens minted from the user's existing `connect.garmin.com` sign-in, and SHALL NOT prompt for a password. The mint SHALL run once and follow three steps: obtain a service ticket from the SSO session without re-authenticating; sign that ticket (OAuth1, 2-legged) to obtain an OAuth1 token; exchange it (OAuth1, 3-legged) for an OAuth2 Bearer token.

Tokens SHALL be held in `chrome.storage.local` so they survive service-worker cold starts. The OAuth1 token is long-lived (about a year). The OAuth2 access token SHALL be refreshed by re-running the exchange with the OAuth1 token alone; **that refresh reads no cookie and no browser session**. Only if the refresh fails SHALL the extension re-mint from the SSO session.

It follows that **reads continue after the user signs out of connect.garmin.com**, and that a failed call is NOT evidence the user is signed out. Every surface this extension itself ships — its popup — MUST respect that: it SHALL NOT diagnose a signed-out session from a failed check.

The rule is deliberately scoped to this extension. It is a property of this bridge's auth model, and it holds for any consumer, but a bridge spec cannot legislate for surfaces it does not own — and at the time of writing the SPA's own connection card does exactly what this forbids. Widening the scope is worth doing once that is fixed, not before, because a `SHALL` the system already breaks is the defect this requirement exists to prevent.

The consumer key and secret are Garmin's public reverse-engineered values, hardcoded so the bridge needs no additional host permission.

The extension SHALL NOT log token values, even truncated. Diagnostic responses SHALL report authentication as a boolean, never a token.

#### Scenario: Reads survive signing out of the website

- **GIVEN** the extension holds a valid OAuth1 token
- **WHEN** the user signs out of connect.garmin.com and Kaiord requests a read
- **THEN** the OAuth2 bearer SHALL be refreshed from the OAuth1 token and the read SHALL succeed

#### Scenario: Tokens survive a service-worker restart

- **WHEN** the MV3 service worker is terminated on idle and restarted
- **THEN** the tokens SHALL be read back from `chrome.storage.local` and calls SHALL continue to work

#### Scenario: A failed call is not reported as a signed-out session

- **GIVEN** a session check that did not succeed
- **WHEN** the extension's popup explains it
- **THEN** it SHALL NOT assert that the user is signed out, and SHALL offer both an unusable token and a Garmin outage as possibilities
- **AND** the reason is that the SURFACES cannot tell those apart: the ticket stage does raise a distinguishable "No Garmin session" error, but the session check flattens every failure into one result envelope and nothing reads that distinction back out

### Requirement: Service-worker call surface with a path/method allowlist

All Garmin **data** calls SHALL be made from the background service worker against `https://connectapi.garmin.com` with an `Authorization: Bearer` header. No call SHALL be relayed through a page, a content script, or a Garmin tab.

Every **data** call SHALL be checked against an allowlist of (method, path-pattern) rules before any network request is made, as defence in depth: the SPA can only trigger fixed paths, and the bridge still refuses anything outside the set. The allowlist SHALL be:

- `GET` `/workout-service/workouts` (with any query string)
- `POST` `/workout-service/workout`
- `POST` `/upload-service/upload` (with an optional sub-path, e.g. `/.fit`)
- `GET` `/activitylist-service/activities/search/activities` (with any query string)

A data call outside the allowlist SHALL be rejected with `{ ok: false, error: "Blocked: disallowed path or method" }` and SHALL make no network request. The allowlist SHALL be locked against drift by `scripts/check-bridge-privacy-surface.mjs`.

The token mint is OUTSIDE this allowlist and reaches three further endpoints across `https://sso.garmin.com` and `https://connectapi.garmin.com` — the SSO sign-in that issues a service ticket, and the OAuth pre-authorize and exchange endpoints. They are not caller-reachable: no SPA action and no popup control can name a path that reaches them, and they run only as part of minting or refreshing a token. The allowlist exists to bound what a _caller_ can ask for, so it does not govern them — and consequently neither does the golden that locks it, which covers the data patterns only.

#### Scenario: Allowed workout read passes the allowlist

- **WHEN** a read is issued for `/workout-service/workouts?start=0&limit=20` with method `GET`
- **THEN** the service worker performs the Bearer call against connectapi

#### Scenario: Disallowed path is rejected without a network call

- **WHEN** a call is issued for `/userprofile-service/usersettings`
- **THEN** the extension returns `{ ok: false, error: "Blocked: disallowed path or method" }` and makes no network request

#### Scenario: Disallowed method is rejected without a network call

- **WHEN** a `DELETE` is issued for `/workout-service/workout/123`
- **THEN** the extension returns `{ ok: false, error: "Blocked: disallowed path or method" }` and makes no network request

### Requirement: Runtime extension ID announcement on SPA origins

The extension SHALL inject `bridge-identity.js` followed by `kaiord-announce.js` at `document_start` on SPA origins, and the announce script SHALL post a `KAIORD_BRIDGE_ANNOUNCE` message via `window.postMessage` to the page's own origin so the SPA can discover the extension's runtime ID without hardcoding it.

The announcement payload SHALL include `type: "KAIORD_BRIDGE_ANNOUNCE"`, `bridgeId: "garmin-bridge"`, `extensionId: chrome.runtime.id`, `name: "Garmin Connect"`, `version` (from the manifest), `protocolVersion: 1`, and `capabilities: ["write:workouts", "read:activities", "write:body"]`. The identity values SHALL match `BRIDGE_MANIFEST` in `background.js`, enforced by `scripts/check-bridge-core-parity.test.mjs`.

The script SHALL re-announce when it receives a `KAIORD_BRIDGE_DISCOVER` message from the page (`event.source === window`).

The production manifest SHALL declare only `https://*.kaiord.com/*` as the announce-script match.

Capability presence alone SHALL NOT drive SPA affordances; the SPA additionally requires an enabled `IntegrationPolicy` row (see `spa-bridge-protocol`, Requirement: Policy resolution).

#### Scenario: Garmin Bridge announces its three capabilities

- **WHEN** the extension is installed and announces via its content script
- **THEN** the announcement SHALL include `capabilities: ["write:workouts", "read:activities", "write:body"]`
- **AND** the SPA SHALL register the bridge as VERIFIED via the existing ping/verify flow

#### Scenario: SPA requests rediscovery

- **WHEN** the SPA dispatches `window.postMessage({ type: "KAIORD_BRIDGE_DISCOVER" }, window.location.origin)`
- **THEN** the announce script re-announces with the same payload

### Requirement: Origin-pinned external message API

The extension SHALL handle messages from allowed SPA origins via `chrome.runtime.onMessageExternal`. The externally reachable actions SHALL be exactly `ping`, `list`, `activities`, `push`, `push-body-composition`, `open-garmin`, `profile-snapshot` and `profile-snapshot-clear`:

- `ping` — session check plus the bridge manifest
- `list` — the workout list from Garmin Connect
- `activities` — the athlete's recent activities (read-only)
- `push` — a GCN workout payload (requires `message.gcn`)
- `push-body-composition` — a FIT body-composition payload (requires `message.fit`)
- `open-garmin` — opens the Garmin Connect dashboard in a new tab
- `profile-snapshot` / `profile-snapshot-clear` — store or drop the SPA's pushed profile snapshot

All responses SHALL use the shape `{ ok: boolean, protocolVersion?: number, data?: unknown, error?: string }`, and `ping` SHALL include `protocolVersion: 1` (bumped only when the message contract changes).

The `ping` response `data` envelope SHALL contain the full `BridgeManifest` fields (`id: "garmin-bridge"`, `name: "Garmin Connect"`, `version`, `protocolVersion: 1`, `capabilities`) alongside the session-status fields `authenticated` (boolean) and `gcApi` (the result envelope of the probing read). Manifest keys SHALL take precedence on collision, so no upstream Garmin response can spoof the bridge identity. The SPA validates `response.data` against `bridgeManifestSchema`, which strips the session-status fields so both consumers coexist.

#### Scenario: SPA pings the extension

- **WHEN** the SPA sends `{ action: "ping" }`
- **THEN** the extension returns `{ ok: true, protocolVersion: 1, data: { id: "garmin-bridge", name: "Garmin Connect", version: "<pkg version>", protocolVersion: 1, capabilities: ["write:workouts", "read:activities", "write:body"], authenticated: true, gcApi: { ok: true, status: 200 } } }`

#### Scenario: SPA pushes a workout

- **WHEN** the SPA sends `{ action: "push", gcn: { workoutName: "...", steps: [...] } }`
- **THEN** the extension posts the GCN payload to Garmin Connect and returns `{ ok: true, data: { workoutId, ... } }`

#### Scenario: SPA requests the Garmin dashboard

- **WHEN** the SPA sends `{ action: "open-garmin" }`
- **THEN** the extension opens `https://connect.garmin.com/modern/` in a new tab and returns `{ ok: true }`

#### Scenario: Unknown action is rejected

- **WHEN** the SPA sends `{ action: "unknown" }`
- **THEN** the extension returns `{ ok: false, error: "Unknown action: unknown" }`

#### Scenario: Incompatible protocol is surfaced

- **WHEN** the SPA receives a ping response without `protocolVersion` or with an unsupported version
- **THEN** the SPA shows "Update your Kaiord Garmin Bridge extension"
