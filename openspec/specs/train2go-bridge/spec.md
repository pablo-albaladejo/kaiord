> Synced: 2026-04-17

## Requirements

### Requirement: Extension manifest

The extension SHALL target Chrome (Chromium-based browsers) only using Manifest V3.

The extension SHALL require the following permission:

- `tabs` — query for Train2Go tabs

Host permissions SHALL include `https://app.train2go.com/*`.

The `externally_connectable` field SHALL declare SPA origins: `http://localhost:5173/*`, `http://localhost:5174/*`, and `https://*.kaiord.com/*`.

The manifest SHALL declare a top-level `icons` field with sizes 16, 48, and 128. The `action.default_icon` field SHALL reference sizes 48 and 128.

A production variant (`manifest.prod.json`) SHALL exist that excludes localhost origins from `externally_connectable`.

The extension SHALL NOT require `storage`, `webRequest`, or any permission beyond `tabs`.

#### Scenario: Extension loads with minimal permissions

- **WHEN** the extension is installed
- **THEN** it registers only the `tabs` permission and declares `https://app.train2go.com/*` as host permission

#### Scenario: Extension declares icon sizes

- **WHEN** the extension manifest is read
- **THEN** the top-level `icons` field SHALL declare sizes 16, 48, and 128
- **AND** `action.default_icon` SHALL declare sizes 48 and 128

### Requirement: Content script path allowlist

The content script SHALL only execute fetch requests to paths matching a predefined allowlist. The allowlist SHALL be implemented as anchored regular expressions to prevent path traversal:

- `GET` requests matching `^/api/v2/profile/ping$`
- `GET` requests matching `^/api/v2/workplan/weekly/[\d-]+(\?user=\d+(&source=\w+)?)?$`
- `GET` requests matching `^/api/v2/workplan/daily/[\d-]+(\?user=\d+(&source=\w+)?)?$`
- `GET` requests matching `^/api/v2/workplan/tooltip/activity/\d+$`

Only GET methods SHALL be allowed. Requests to paths or methods outside the allowlist SHALL be rejected with `{ ok: false, error: "Blocked: disallowed path or method" }` without making any network call.

#### Scenario: Allowed ping request passes validation

- **WHEN** a `train2go-fetch` message arrives with method `GET` and path `/api/v2/profile/ping`
- **THEN** the content script executes the fetch

#### Scenario: Allowed weekly request passes validation

- **WHEN** a `train2go-fetch` message arrives with method `GET` and path `/api/v2/workplan/weekly/2026-04-13?user=28035`
- **THEN** the content script executes the fetch

#### Scenario: Allowed daily request passes validation

- **WHEN** a `train2go-fetch` message arrives with method `GET` and path `/api/v2/workplan/daily/2026-04-13?user=28035&source=sidebar`
- **THEN** the content script executes the fetch

#### Scenario: Allowed tooltip request passes validation

- **WHEN** a `train2go-fetch` message arrives with method `GET` and path `/api/v2/workplan/tooltip/activity/17722582`
- **THEN** the content script executes the fetch

#### Scenario: Disallowed path is rejected

- **WHEN** a `train2go-fetch` message arrives with path `/api/v2/activities/17722582`
- **THEN** the content script returns `{ ok: false, error: "Blocked: disallowed path or method" }` without making a network call

#### Scenario: POST method is rejected

- **WHEN** a `train2go-fetch` message arrives with method `POST` and any path
- **THEN** the content script returns `{ ok: false, error: "Blocked: disallowed path or method" }` without making a network call

### Requirement: Content script API proxy

A content script injected into `app.train2go.com` at `document_start` SHALL handle `train2go-fetch` messages by executing `fetch()` calls to the Train2Go API. The content script SHALL capture a pristine reference to `window.fetch` at load time to prevent interference from page scripts.

The `credentials` option SHALL be set to `"include"` so the browser attaches session cookies automatically.

No special headers are required — Train2Go GET endpoints do not require XSRF tokens or `X-Requested-With` headers.

Messages are received only via `chrome.runtime.onMessage` which restricts senders to the extension's own background/popup scripts. No external origin can invoke the content script directly.

The content script SHALL use an `AbortController` with a 30-second timeout on every fetch to prevent indefinite hangs.

#### Scenario: Successful GET request via content script

- **WHEN** the background sends a `train2go-fetch` message with path `/api/v2/profile/ping`
- **THEN** the content script executes `fetch("https://app.train2go.com/api/v2/profile/ping", { credentials: "include" })` and returns the JSON response

#### Scenario: API returns error

- **WHEN** the Train2Go API returns a non-2xx status
- **THEN** the content script returns `{ ok: false, status: <code>, error: "Request failed" }`

#### Scenario: API redirects to login

- **WHEN** the Train2Go API returns a redirect (302) to the login page
- **THEN** the content script returns `{ ok: false, error: "Session expired" }`

#### Scenario: Request times out

- **WHEN** the Train2Go API does not respond within 30 seconds
- **THEN** the fetch is aborted and the content script returns `{ ok: false, error: "Request timed out" }`

### Requirement: HTML parser for weekly workplan

The parser SHALL extract activity data from the weekly workplan HTML fragment. The weekly endpoint returns JSON: `{ data: { replace: { "#workplan": "<html>" } } }`.

For each activity in the HTML, the parser SHALL extract:

- `id` (number): from `data-id` attribute
- `sport` (string): from `icon-sports{name}` CSS class on the sport icon
- `title` (string): from the `title` attribute on the activity link, HTML-unescaped
- `duration` (string): from `.measured` element text content
- `workload` (number, 1-5): from `data-value` attribute on `.workload-default` container
- `status` (number): from `data-status` attribute (0=pending, 1=done, -1=not done)

The parser SHALL associate activities with their date by parsing the `workplan-table-date-{YYYY-MM-DD}` CSS class on day cells.

#### Scenario: Parse week with multiple activities

- **WHEN** the weekly HTML contains activities across multiple days
- **THEN** the parser returns an array of activity objects, each with the correct date from the parent day cell

#### Scenario: Parse empty day

- **WHEN** a day cell has CSS class `workplan-table-day-empty`
- **THEN** the parser returns no activities for that date

#### Scenario: Parse activity with workload

- **WHEN** an activity element has `data-id="17722582"`, `icon-sportscycling`, title `"15' Z5 INTERVALOS CORTOS"`, measured `"1:30 h"`, and workload `data-value="2"`
- **THEN** the parser returns `{ id: 17722582, sport: "cycling", title: "15' Z5 INTERVALOS CORTOS", duration: "1:30 h", workload: 2 }`

#### Scenario: HTML entities in title

- **WHEN** a title contains HTML entities (e.g., `&#039;` for apostrophe)
- **THEN** the parser decodes them to their character equivalents

#### Scenario: Malformed HTML graceful degradation

- **WHEN** the weekly HTML does not contain expected selectors (missing `data-id`, changed class names, or empty response)
- **THEN** the parser returns an empty array and does not throw an error

### Requirement: HTML parser for daily detail

The parser SHALL extract full activity descriptions from the daily workplan HTML fragment. The daily endpoint returns JSON: `{ data: { content: "<html>" } }`.

For each activity in the HTML, the parser SHALL extract all weekly fields plus:

- `description` (string): from `.activity-description` inner HTML, with HTML tags cleaned to plain text. `<strong>` tags SHALL be preserved as `**text**` markers. `<p>` and `<br>` tags SHALL become newlines. All other tags SHALL be stripped.
- `completion` (number, 0-100): from `.activity-completion .percent` text content

When `.activity-description` has class `activity-description-empty` and contains no text, `description` SHALL be an empty string.

#### Scenario: Parse activity with rich description

- **WHEN** the daily HTML contains an activity with description `<p><strong>Calentamiento:</strong> 20' Z1</p><p>6x(30" Z5 a 315w)</p>`
- **THEN** the parser returns description `"**Calentamiento:** 20' Z1\n6x(30\" Z5 a 315w)"`

#### Scenario: Parse activity with empty description

- **WHEN** the daily HTML contains an activity with class `activity-description-empty`
- **THEN** the parser returns description `""`

#### Scenario: Parse completion percentage

- **WHEN** the daily HTML contains `.percent.percent-red` with text `"0%"`
- **THEN** the parser returns `completion: 0`

### Requirement: Train2Go tab dependency

All API operations SHALL require an open Train2Go tab (`https://app.train2go.com/*`). If no tab is found, the operation SHALL fail with a descriptive error message.

#### Scenario: No Train2Go tab open

- **WHEN** the SPA or popup requests an API operation and no `app.train2go.com` tab exists
- **THEN** the extension returns an error: "No Train2Go tab open. Open app.train2go.com first."

### Requirement: External message API

The extension SHALL handle messages from allowed SPA origins via `chrome.runtime.onMessageExternal` with the following actions:

- `ping` — Calls `/api/v2/profile/ping` and returns the user profile JSON (including `userId`, `name`, `bpm_max`, `bpm_rest`, `weight`). The response SHALL include `protocolVersion: 1`.
- `read-week` — Accepts `{ action: "read-week", date: "YYYY-MM-DD", userId: number }`. Calls the weekly endpoint, parses the HTML, and returns an array of activity objects spanning 3 weeks.
- `read-day` — Accepts `{ action: "read-day", date: "YYYY-MM-DD", userId: number }`. Calls the daily endpoint, parses the HTML, and returns activity objects with full descriptions.
- `open-train2go` — Opens `https://app.train2go.com/user/index` in a new tab.

All responses SHALL include `protocolVersion: 1` in the response envelope, matching the Garmin bridge `sendResult`/`sendError` pattern. The response shape SHALL be `{ ok: boolean, protocolVersion: number, data?: unknown, error?: string, status?: number }`.

The `ping` response SHALL extract `userId` from the profile JSON and include it in the response data, so the SPA can use it for subsequent `read-week` and `read-day` calls.

#### Scenario: SPA pings extension

- **WHEN** the SPA sends `{ action: "ping" }` to the extension
- **THEN** the extension calls `/api/v2/profile/ping` and returns `{ ok: true, protocolVersion: 1, data: { id: "train2go-bridge", name: "Kaiord Train2Go Bridge", version: "0.1.0", protocolVersion: 1, capabilities: ["read:training-plan"], userId: 28035, userName: "Pablo", sessionActive: true } }`

The `data` field SHALL include both the bridge manifest fields (`id`, `name`, `version`, `protocolVersion`, `capabilities`) — required by the SPA's `parseManifestFromPing` function — and session-specific fields (`userId`, `userName`, `sessionActive`).

#### Scenario: Ping detects expired session

- **WHEN** the SPA sends `{ action: "ping" }` and the Train2Go session has expired
- **THEN** the extension returns `{ ok: true, protocolVersion: 1, data: { id: "train2go-bridge", name: "Kaiord Train2Go Bridge", version: "0.1.0", protocolVersion: 1, capabilities: ["read:training-plan"], sessionActive: false } }`

The manifest fields SHALL always be present in the ping response regardless of session state, so the SPA's `parseManifestFromPing` can register the bridge even when the session is expired.

#### Scenario: SPA reads week

- **WHEN** the SPA sends `{ action: "read-week", date: "2026-04-13", userId: 28035 }`
- **THEN** the extension returns `{ ok: true, protocolVersion: 1, data: { activities: [...] } }` where the activities array spans all 3 weeks returned by the API (previous, current, and next week — up to 21 days of data)

#### Scenario: SPA reads week with no activities

- **WHEN** the SPA sends `{ action: "read-week", date: "2026-05-01", userId: 28035 }` and the coach has not planned that period
- **THEN** the extension returns `{ ok: true, protocolVersion: 1, data: { activities: [] } }`

#### Scenario: SPA reads day

- **WHEN** the SPA sends `{ action: "read-day", date: "2026-04-13", userId: 28035 }`
- **THEN** the extension returns `{ ok: true, protocolVersion: 1, data: { activities: [{ id, date, sport, title, duration, workload, status, description, completion }, ...] } }`

#### Scenario: SPA reads day with multiple activities

- **WHEN** the SPA sends `{ action: "read-day", date: "2026-04-07", userId: 28035 }` and the day has 2 activities (morning gym + afternoon swim)
- **THEN** the response contains 2 activity objects with distinct ids in the activities array

#### Scenario: SPA requests Train2Go tab opening

- **WHEN** the SPA sends `{ action: "open-train2go" }` to the extension
- **THEN** the extension opens `https://app.train2go.com/user/index` in a new tab and returns `{ ok: true, protocolVersion: 1 }`

#### Scenario: SPA sends unknown action

- **WHEN** the SPA sends `{ action: "unknown" }`
- **THEN** the extension returns `{ ok: false, error: "Unknown action: unknown" }`

### Requirement: Popup UI

The extension SHALL provide a popup with:

- A "Check Session" button that calls `ping` and displays session status (connected / not connected)
- When connected: user name, trainer name
- A "Read This Week" button that calls `read-week` with today's date and displays activity count

The popup SHALL show clear status indicators (green for connected, red for disconnected).

#### Scenario: Popup shows connected state

- **WHEN** the user clicks "Check Session" and the session is active
- **THEN** the popup displays a green indicator with the user's name

#### Scenario: Popup shows disconnected state

- **WHEN** the user clicks "Check Session" and the session has expired
- **THEN** the popup displays a red indicator with "Not connected. Log in to Train2Go."

#### Scenario: Popup shows loading state

- **WHEN** the user clicks "Check Session" and the request is in flight
- **THEN** the popup displays a "Checking..." spinner and disables the button

#### Scenario: Popup reads this week

- **WHEN** the user clicks "Read This Week" and the session is active
- **THEN** the popup calls `read-week` with today's date and displays the number of activities found

#### Scenario: Popup read week fails

- **WHEN** the user clicks "Read This Week" and no Train2Go tab is open
- **THEN** the popup displays the error message from the extension

### Requirement: Bridge manifest for protocol discovery

The extension SHALL respond to `ping` with a manifest conforming to the bridge manifest Zod schema:

- `id`: `"train2go-bridge"`
- `name`: `"Kaiord Train2Go Bridge"`
- `version`: from `package.json`
- `protocolVersion`: `1`
- `capabilities`: `["read:training-plan"]`

#### Scenario: SPA discovers Train2Go bridge

- **WHEN** the SPA bridge registry detects the Train2Go extension and sends a `ping`
- **THEN** the response includes `{ id: "train2go-bridge", name: "Kaiord Train2Go Bridge", protocolVersion: 1, capabilities: ["read:training-plan"] }`
