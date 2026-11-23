## MODIFIED Requirements

### Requirement: External message API on protocol 2

The extension SHALL handle messages from the exact Kaiord App origin via `chrome.runtime.onMessageExternal` with the external actions `ping`, `request`, `open-train2go`, `profile-snapshot`, `profile-snapshot-clear` and `set-theme`, and SHALL speak protocol version 2: every envelope SHALL carry `protocolVersion: 2` and the shape `{ ok, protocolVersion, data?, error?, status?, retryable?, needsReauth? }`.

- `ping` — The Session check (spec: bridge-core): calls `/api/v2/profile/ping` and returns the bridge manifest fields (`id`, `name`, `version`, `protocolVersion`, `capabilities`) with `session`, `authenticated` and `sessionActive` only; the profile in Train2Go's answer is dropped in the service worker. The manifest fields SHALL always be present, whatever the session state.
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
- **THEN** the extension returns `{ ok: true, protocolVersion: 2, data: { id: "train2go-bridge", name: "Train2Go", version, protocolVersion: 2, capabilities, session: "signed-in", authenticated: true, sessionActive: true } }`, with no user id, name or note
