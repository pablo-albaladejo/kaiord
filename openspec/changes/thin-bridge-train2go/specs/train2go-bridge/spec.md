## ADDED Requirements

### Requirement: Internal channel answers the popup only

The Train2Go bridge SHALL register its `chrome.runtime.onMessage` listener through the shared `createInternalDispatch` with the internal actions `ping`, `read-profile` and `read-week` only (`read-profile`: the popup's read of the profile ping, for the athlete's name and the coach's name and notes; #1643). A message from a content script, from another extension, or from an extension page opened in a tab SHALL get no answer. The `request` action SHALL NOT be reachable on the internal channel: it is reachable only through the exact-origin external gate.

#### Scenario: A content script cannot reach the generic request

- **GIVEN** a message `{ action: "request", method: "GET", path: "/user/details" }` from the announce content script on `https://kaiord.com` (`sender.tab` set)
- **WHEN** the internal listener receives it
- **THEN** it SHALL give no answer and no request SHALL be sent to Train2Go

#### Scenario: The popup cannot use the generic request

- **GIVEN** the same message from the popup (`sender.origin` is `chrome-extension://<own id>`)
- **WHEN** the internal listener receives it
- **THEN** it SHALL answer `{ ok: false, retryable: false }` and send no request

### Requirement: External message API on protocol 2

The extension SHALL handle messages from the exact Kaiord App origin via `chrome.runtime.onMessageExternal` with the external actions `ping`, `request`, `open-train2go`, `profile-snapshot`, `profile-snapshot-clear` and `set-theme`, and SHALL speak protocol version 2: every envelope SHALL carry `protocolVersion: 2` and the shape `{ ok, protocolVersion, data?, error?, status?, retryable?, needsReauth? }`.

- `ping` — The Session check (spec: bridge-core, #1643): calls `/api/v2/profile/ping` and returns the bridge manifest fields (`id`, `name`, `version`, `protocolVersion`, `capabilities`) with `session`, `authenticated` and `sessionActive` only; the profile in Train2Go's answer is dropped in the service worker. The manifest fields SHALL always be present, whatever the session state.
- `request` — Accepts exactly `{ action: "request", method, path }`. The extension SHALL check `method` and `path` against its closed list `ALLOWED` (method + anchored path pattern) before any request. On a match it SHALL fetch `https://app.train2go.com{path}` with `credentials: "include"` and answer `{ ok: true, data: { status, contentType, body } }` with the body as text, unread. A path or method outside the list, a non-string path, or any other key (headers, a body) SHALL be refused with `{ ok: false, error: "Request not allowed", retryable: false }` and no request sent. A dead session SHALL answer `{ ok: false, needsReauth: true }`; another non-2xx SHALL answer `{ ok: false, status }`.
- `open-train2go` — Opens `https://app.train2go.com/user/index` in a new tab.

The extension SHALL NOT read or parse Train2Go's answers for the Kaiord App: `read-week`, `read-day` and `read-details` SHALL NOT be external actions.

#### Scenario: The App requests a listed path

- **WHEN** the App sends `{ action: "request", method: "GET", path: "/api/v2/workplan/weekly/2026-11-23?user=28035" }`
- **THEN** the extension returns `{ ok: true, protocolVersion: 2, data: { status: 200, contentType: "application/json", body: "<Train2Go's text>" } }`

#### Scenario: The App requests a path outside the closed list

- **WHEN** the App sends `{ action: "request", method: "GET", path: "/api/v2/comments/1" }`
- **THEN** the extension returns `{ ok: false, protocolVersion: 2, error: "Request not allowed", retryable: false }` and sends no request

#### Scenario: A request with headers is refused

- **WHEN** the App sends a listed path with a `headers` key
- **THEN** the extension refuses it and sends no request

#### Scenario: A legacy read action is no longer served

- **WHEN** the App sends `{ action: "read-week", date: "2026-11-23", userId: 28035 }`
- **THEN** the extension answers `{ ok: false, protocolVersion: 2 }` and sends no request

#### Scenario: SPA pings extension

- **WHEN** the SPA sends `{ action: "ping" }` to the extension and the session is live
- **THEN** the extension returns `{ ok: true, protocolVersion: 2, data: { id: "train2go-bridge", name: "Kaiord Train2Go Bridge", version, protocolVersion: 2, capabilities, session: "signed-in", authenticated: true, sessionActive: true } }`, with no user id, name or note

### Requirement: Popup weekly reader

The extension's `parser.js` SHALL keep only what its popup needs from the weekly workplan fragment (`{ data: { replace: { "#workplan": "<html>" } } }`): for each activity, `id` (from `data-id`), `date` (from the parent cell's `workplan-table-date-{YYYY-MM-DD}` class), `status` (from `data-status`) and `workload` (from `.workload-default` `data-value`). Sport, title and duration are read by the App's Connector, not by the extension. The parser SHALL return an empty array and SHALL NOT throw on malformed or empty HTML.

#### Scenario: Popup counts a week

- **WHEN** the popup's internal `read-week` reads a week with one done activity of workload 3
- **THEN** the extension returns `{ activities: [{ id, date, status: 1, workload: 3 }] }`

#### Scenario: Malformed HTML graceful degradation

- **WHEN** the weekly HTML does not contain expected selectors
- **THEN** the parser returns an empty array and does not throw

## MODIFIED Requirements

### Requirement: Bridge manifest for protocol discovery

The Train2Go bridge's `BRIDGE_MANIFEST` SHALL declare `protocolVersion: 2` and `capabilities` `"read:training-plan"`, `"read:training-zones"` and `"read:body"`. These tokens remain the bridge's declaration of what the App can read through it: `read:body` declares the athlete's weight, which the App reads from the `/user/details` page. The announce identity in `bridge-identity.js` SHALL carry the same capabilities and the same protocol version.

Policy authority for zones import is `IntegrationPolicy`; the SPA SHALL NOT gate the `Sync zones` toggle on capability presence.

#### Scenario: Manifest exposes the plan, zones and body capabilities

- **WHEN** the SPA fetches the bridge's `ping` response
- **THEN** the response data SHALL include `protocolVersion: 2` and `capabilities` containing `"read:training-plan"`, `"read:training-zones"` and `"read:body"`
- **AND** the page announcement SHALL carry the same capabilities and `protocolVersion: 2`

#### Scenario: Older bridge without read:training-zones — behavior unchanged

- **GIVEN** the bridge response advertises `capabilities: ["read:training-plan"]` only (older extension not yet updated)
- **WHEN** the SPA renders the profile's Data Flows section
- **THEN** the `training-zones` import row for `train2go-bridge`, if present, renders as disabled with a "Bridge not installed / capability unavailable" hint
- **AND** the `IntegrationPolicy` row is NOT deleted (C-8)

#### Scenario: Older bridge without read:body offers no weight route

- **GIVEN** the bridge advertises `["read:training-plan", "read:training-zones"]` (released before the weight route)
- **WHEN** the Connections section derives Train2Go's routes
- **THEN** no `weight` route SHALL be offered for `train2go-bridge`

## REMOVED Requirements

### Requirement: External message API

**Reason**: The App no longer asks the extension to read and parse (ADR 0004); protocol 2 replaces `read-week` / `read-day` with `request`.
**Migration**: "External message API on protocol 2"; the App still speaks the old actions to a protocol-1 extension (`spa-train2go-extension` "Train2Go Connector accepts the previous protocol").

### Requirement: HTML parser for weekly workplan

**Reason**: The weekly fields the App uses are read by the App's Connector.
**Migration**: "Popup weekly reader" for the extension; `spa-train2go-extension` "Train2Go Connector reads Train2Go's raw answers" for the App.

### Requirement: HTML parser for daily detail

**Reason**: The extension no longer reads the daily fragment for the App (ADR 0004).
**Migration**: The same parsing is the App's Connector, `spa-train2go-extension` "Train2Go Connector reads Train2Go's raw answers".

### Requirement: Bridge handles a `read-details` action

**Reason**: Replaced by `request` on `/user/details`; the App reads the page.
**Migration**: The App falls back to `read-details` only for an extension on protocol 1 (`spa-train2go-extension` "Train2Go Connector accepts the previous protocol").

### Requirement: parseDetailsHtml emits an explicit field allowlist

**Reason**: The profile page is read by the App's Connector.
**Migration**: The allowlist and its recursive redaction test move unchanged to `spa-train2go-extension` "Train2Go Connector keeps only zones and weight from the profile page".

### Requirement: Content script handles JSON and HTML responses

**Reason**: There is no content-script relay, and the extension no longer decodes answers for the App: `request` hands the body over as text with its `contentType`.
**Migration**: `read-train2go-answers.ts` in the App decodes JSON or HTML by the answer's content type.

### Requirement: HTML parser for day comments

**Reason**: The day's comments are read by the App's Connector.
**Migration**: `spa-train2go-extension` "Train2Go Connector reads Train2Go's raw answers".
