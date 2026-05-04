> Synced: 2026-04-27

# Train2Go Bridge

## Purpose

Chrome extension that imports coaching plans from Train2Go into the workout editor by read-only DOM access on `app.train2go.com` — no credentials stored, no persistence, content-script-only communication.

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

The Train2Go bridge content script's `ALLOWED` list (`packages/train2go-bridge/content.js`) SHALL include exactly the following path/method pairs:

- `GET /profile/ping`
- `GET /api/v2/calendar/training/week/...` (existing weekly endpoint)
- `GET /api/v2/calendar/training/day/...` (existing daily endpoint)
- `GET /api/v2/calendar/training/tooltip/...` (existing tooltip endpoint)
- `GET /user/details` (NEW, for zones-sync)

Any path not in the explicit list MUST be rejected with `Blocked: disallowed path or method`. The privacy-surface golden (`scripts/fixtures/bridge-privacy-surface.json`) SHALL be updated in the same commit so the mechanical guard stays green; its `train2go-bridge.allowed_paths` array SHALL contain exactly 5 entries after this change.

#### Scenario: /user/details is reachable

- **WHEN** the bridge's content script receives a `train2go-fetch` for `GET /user/details`
- **THEN** the fetch SHALL be permitted by `isAllowed`
- **AND** the bridge content script SHALL detect the `text/html` Content-Type and call `r.text()` (not `r.json()`); the response envelope SHALL contain `data: <htmlString>` for HTML responses

#### Scenario: A path outside the ALLOWED list is rejected

- **WHEN** the content script receives a `train2go-fetch` for a path that is not in the ALLOWED list
- **THEN** the fetch SHALL be rejected with `{ ok: false, error: "Blocked: disallowed path or method" }`
- **AND** no upstream HTTP request SHALL be made

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

### Requirement: Runtime extension ID announcement on SPA origins

The extension SHALL inject a content script (`kaiord-announce.js`) at `document_start` on SPA origins (`https://*.kaiord.com/*` and, in dev, `http://localhost/*`). The script SHALL post a `KAIORD_BRIDGE_ANNOUNCE` message via `window.postMessage` to the page's own origin so the SPA can discover the extension's runtime ID without hardcoding it.

The announcement payload SHALL include: `type: "KAIORD_BRIDGE_ANNOUNCE"`, `bridgeId: "train2go-bridge"`, `extensionId: chrome.runtime.id`, `name: "Train2Go"`, `version` (from manifest), `protocolVersion: 1`, and `capabilities: ["read:training-plan"]`.

The script SHALL re-announce when it receives a `KAIORD_BRIDGE_DISCOVER` message from the page (`event.source === window`).

The production manifest (`manifest.prod.json`) SHALL only declare `https://*.kaiord.com/*` as the announce-script match; localhost origins SHALL NOT be present in the production build.

#### Scenario: SPA loads on kaiord.com

- **WHEN** the SPA loads on `https://*.kaiord.com/*` and the extension is installed
- **THEN** the announce content script posts `{ type: "KAIORD_BRIDGE_ANNOUNCE", bridgeId: "train2go-bridge", extensionId, ... }` to the page so the SPA can register the bridge

#### Scenario: SPA requests rediscovery

- **WHEN** the SPA dispatches `window.postMessage({ type: "KAIORD_BRIDGE_DISCOVER" }, window.location.origin)`
- **THEN** the announce script re-announces with the same payload

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

The Train2Go bridge's `BRIDGE_MANIFEST.capabilities` array SHALL include exactly the following capability strings:

- `read:training-plan` (existing — weekly / daily / tooltip reads)
- `read:training-zones` (NEW — `read-details` action)

The SPA SHALL gate any user-facing zones-sync UI (the `Sync zones` toggle on the Linked Account row) on the presence of `"read:training-zones"` in the manifest's `capabilities` array, so older-bridge users never see a feature their installed extension cannot fulfil.

#### Scenario: Manifest exposes both capabilities

- **GIVEN** a bridge build that ships the `read-details` action
- **WHEN** the SPA fetches the bridge's `ping` response
- **THEN** the response data SHALL include `capabilities` containing both `"read:training-plan"` and `"read:training-zones"`

#### Scenario: An older bridge without the new capability is detected

- **GIVEN** the bridge response advertises `capabilities: ["read:training-plan"]` only
- **WHEN** the SPA renders the Linked Account row for that bridge
- **THEN** the `Sync zones` toggle SHALL be hidden
- **AND** no zones-sync action SHALL be invokable

### Requirement: Bridge handles a `read-details` action

The Train2Go bridge background script SHALL accept a new external action `read-details` with payload `{ externalUserId: string }`. The handler SHALL invoke the bridge's existing `train2goFetch` against `/user/details` (server-rendered HTML, no separate JSON endpoint), parse the inline data via the new `parseDetailsHtml` parser, and return a structured `ZonesPayload` envelope on success or a `BridgeError` on failure (no Train2Go tab, allowlist mismatch, network error, redirect-to-login). The action SHALL respect the same origin allowlist and rate-limiting as the existing `read-week` / `read-day` actions.

#### Scenario: Successful zones fetch returns a structured payload

- **GIVEN** an authenticated Train2Go session and an open Train2Go tab
- **WHEN** the SPA sends `{ action: "read-details", externalUserId: "99999" }`
- **THEN** the bridge SHALL respond with `{ ok: true, protocolVersion: 1, data: ZonesPayload }`
- **AND** the payload SHALL contain raw-shape fields per the parser allowlist when those fields are present in the upstream HTML: `paces.cycling.z4Upper`, `paces.cycling.z5Lower`, `paces.running.z4Upper`, `paces.swimming.z4Upper`, `hrZones.cycling.z4Upper`, `hrZones.running.z4Upper`, `physiological.weight`, `physiological.bpmMax`. Mapping to Kaiord-domain semantic names (`cycling.thresholds.ftp`, `running.thresholds.lthr`, etc.) happens in the SPA-side `syncZones` use case, NOT in the bridge.

#### Scenario: No Train2Go tab open

- **GIVEN** no tab matching `app.train2go.com/*` exists in the user's browser
- **WHEN** the SPA sends `{ action: "read-details", externalUserId: "99999" }`
- **THEN** the bridge SHALL respond with `{ ok: false, error: "No Train2Go tab open" }`
- **AND** the SPA's profile SHALL NOT be mutated

#### Scenario: Disallowed origin

- **GIVEN** the SPA tab is loaded from an origin not in the bridge's `externally_connectable.matches`
- **WHEN** that origin sends a `read-details` message
- **THEN** the bridge SHALL respond with `{ ok: false, error: "Origin not permitted", retryable: false }`

### Requirement: parseDetailsHtml emits an explicit field allowlist

The `parseDetailsHtml` parser SHALL emit ONLY the fields in the following allowlist:

- `physiological.{weight, bpmMax, bpmRest}`
- `paces.cycling.{z1..z5: { lower, upper }}` (each bound is a non-negative integer in watts) **AND** `paces.cycling.{z4Upper, z5Lower}` derived convenience fields (each equal to the matching band's `upper` / `lower`)
- `paces.{running, swimming}.{z1..z5: { lower: { min, sec }, upper: { min, sec } }}` (min:sec/km or min:sec/100m) **AND** `paces.{running, swimming}.{z4Upper}` derived convenience field (the `{min, sec}` of the band's `upper`)
- `hrZones.generic.{z1..z5: { lower, upper }}` (always emitted when the upstream Generic block is present)
- `hrZones.{cycling, running, swimming}.{z1..z5: { lower, upper }}` per-sport Specific blocks (each block is emitted ONLY when present in the upstream HTML) **AND** `hrZones.{cycling, running, swimming}.{z4Upper}` derived convenience field (the band's `upper`). NOTE: `hrZones.swimming` is NEW in this change — the shipped parser only emitted cycling and running per-sport HR blocks; swimming is added here because the same `heart-rate-zone-swimming` wrapper exists in T2G's HTML and the per-sport extraction generalises uniformly.

Any field present in the page that falls outside the allowlist MUST be discarded at parse time and SHALL NOT appear in the returned `ZonesPayload`. The bridge SHALL include a redaction unit test that walks the parsed object recursively (NOT a substring match against `JSON.stringify(output)` — substring matches false-pass on benign keys that contain a forbidden token like `emailReceiptsEnabled`) and asserts no key in the forbidden set appears at any depth.

The post-change FORBIDDEN SET is the EXACT enumeration below — any change to this set requires a separate privacy-surface review:

```text
FORBIDDEN_KEYS = {
  "gender",
  "birthday",
  "fat",
  "smoker",
  "imc",
  "user_notes",
  "email",
  "records",
  "tests"
}

FORBIDDEN_NESTED_PATHS = {
  "coach.email",
  "coach.name"
}
```

**Comparison semantics (load-bearing for the spec↔test invariant):**

- `FORBIDDEN_KEYS` is a **Set** — the spec↔test invariant compares set-equality (order-insensitive, duplicate-tolerant in source, unique in semantics).
- Keys are **case-sensitive lowercase** (matches the DOM `name=` attribute); the test loader MUST NOT lowercase or normalize before comparing.
- Whitespace in the spec's code block is ignored by the parser (the test loader strips lines and re-tokenizes).
- `FORBIDDEN_NESTED_PATHS` is also a Set; each entry is a dotted path interpreted as "a subobject keyed by the first segment containing a key matching the second segment". The recursive walk MUST handle this two-level check (NOT a substring match against the dotted form).

**Mismatched-case behaviour (consequence):** if a future spec author adds an uppercase or mixed-case key (e.g., `"IMC"` instead of `"imc"`) to either set, the spec↔test invariant SHALL fail noisily — the parser test hardcodes the lowercase DOM-name form and the script comparison is exact-case. Adding both cases (`"imc"` AND `"IMC"`) is FORBIDDEN; there is exactly one canonical case (lowercase, matching the DOM `name=` attribute on T2G's HTML form). The lint failure is the intended forcing function: a spec author trying to relax the case-sensitivity rule MUST first update the parser test (and have that change reviewed).

Note for migration reviewers: this set previously included `bpm_rest`. It is removed in this change because the camelCased emit key `bpmRest` is now allowlisted under `physiological.bpmRest` (see D-FB8). The DOM-level snake_case `bpm_rest` is still NOT a valid emit key (see "bpm_rest is allowlisted and emitted (camelCase only)" scenario); only the camelCased form `bpmRest` is permitted.

Additionally, `imc` is now EXPLICITLY enumerated in `FORBIDDEN_KEYS` for the first time. It was previously listed only in the prose enumeration in the shipped canonical spec (which is human-readable but not machine-comparable); the explicit code-block makes it grep-able for the redaction test. The semantics are unchanged — `imc` was always forbidden and never emitted by the parser — but the test fixture (`packages/train2go-bridge/test/fixtures/details-active.html`) MUST contain a real `<input name="imc">` element for the assertion to be non-vacuous (see task 1.1).

#### Scenario: Redaction — sensitive fields are dropped

- **GIVEN** a fixture HTML containing every key in `FORBIDDEN_KEYS` and every nested path in `FORBIDDEN_NESTED_PATHS` (gender, birthday, fat, smoker, imc, user_notes, email, records, tests, coach.email, coach.name)
- **WHEN** `parseDetailsHtml` runs against the fixture
- **THEN** the returned `output.physiological` SHALL contain ONLY the allowlisted keys (`weight`, `bpmMax`, `bpmRest`)
- **AND** a recursive key walk over the parsed `output` SHALL NOT find any key in `FORBIDDEN_KEYS` at any nesting depth
- **AND** the recursive walk SHALL NOT find any of the `FORBIDDEN_NESTED_PATHS` (a subobject named `coach` with key `email` or `name` MUST NOT appear)

#### Scenario: T2G's 0-indexed DOM names map to 1-indexed payload keys

- **GIVEN** the upstream HTML has `<input name="z3_upper" value="174">` inside `#hrzones-{userId}` for the cycling block (T2G uses 0-indexed `z0..z4` form names for visual zones Z1..Z5; `z3_upper` is therefore the upper bound of visual Z4)
- **WHEN** `parseDetailsHtml` runs
- **THEN** the returned `output.hrZones.cycling.z4.upper` SHALL equal `174`
- **AND** the convenience field `output.hrZones.cycling.z4Upper` SHALL also equal `174`
- **AND** the parser SHALL NOT emit any key prefixed `z0..z4` (the 1-indexed mapping is the parser's contract)

#### Scenario: Generic HR block extraction (full Z1-Z5 bands)

- **GIVEN** the upstream HTML has `<div class="heart-rate-zone heart-rate-zone-generic">` with five `<input name="zN_lower">` / `<input name="zN_upper">` pairs (N=0..4)
- **AND** the values are `Z1: 107-133`, `Z2: 134-147`, `Z3: 148-160`, `Z4: 161-174`, `Z5: 175-187`
- **WHEN** `parseDetailsHtml` runs
- **THEN** `output.hrZones.generic` SHALL equal `{ z1: { lower: 107, upper: 133 }, z2: { lower: 134, upper: 147 }, z3: { lower: 148, upper: 160 }, z4: { lower: 161, upper: 174 }, z5: { lower: 175, upper: 187 } }`

#### Scenario: Per-sport HR Specific block emitted only when present

- **GIVEN** the upstream HTML has `<div class="heart-rate-zone heart-rate-zone-cycling">` (Specific cycling) but NO `heart-rate-zone-running` or `heart-rate-zone-swimming` blocks
- **WHEN** `parseDetailsHtml` runs
- **THEN** `output.hrZones.cycling` SHALL be a full Z1-Z5 band object
- **AND** `output.hrZones.running` SHALL be absent (the key MUST NOT appear in the parsed object)
- **AND** `output.hrZones.swimming` SHALL be absent

#### Scenario: Swimming HR Specific block — newly emitted when present

- **GIVEN** the upstream HTML has `<div class="heart-rate-zone heart-rate-zone-swimming">` with five `<input name="zN_lower">` / `<input name="zN_upper">` pairs (N=0..4)
- **AND** the shipped parser previously dropped this block (only cycling and running per-sport HR were emitted)
- **WHEN** `parseDetailsHtml` runs against the new build
- **THEN** `output.hrZones.swimming` SHALL be a full Z1-Z5 band object with five `{ lower, upper }` pairs
- **AND** the convenience field `output.hrZones.swimming.z4Upper` SHALL equal the band's Z4 upper bound

#### Scenario: Cycling pace block emits watts as integer bounds

- **GIVEN** the cycling pace form has `<input name="measurement[z3_upper][0]" value="268">` and `<input name="measurement[z4_lower][0]" value="269">` (watts; single integer per bound, NOT min:sec)
- **WHEN** `parseDetailsHtml` runs
- **THEN** `output.paces.cycling.z4.upper` SHALL equal `268`
- **AND** `output.paces.cycling.z5.lower` SHALL equal `269`

#### Scenario: Running pace block emits min:sec pairs per band

- **GIVEN** the running pace form has `<input name="measurement[z3_upper][0]" value="04">` and `<input name="measurement[z3_upper][1]" value="10">` (min:sec/km)
- **WHEN** `parseDetailsHtml` runs
- **THEN** `output.paces.running.z4.upper` SHALL equal `{ min: 4, sec: 10 }`
- **AND** the convenience field `output.paces.running.z4Upper` SHALL also equal `{ min: 4, sec: 10 }`

#### Scenario: bpm_rest is allowlisted and emitted (camelCase only)

- **GIVEN** the upstream HTML has `<input name="bpm_rest" type="number" value="51">` inside the `#physio-{userId}` block
- **WHEN** `parseDetailsHtml` runs
- **THEN** `output.physiological.bpmRest` SHALL equal `51` (camelCase key)
- **AND** the parsed `output` MUST NOT contain a key named `bpm_rest` (snake_case) at any nesting depth — the DOM snake_case name is camelCased on emit
- **AND** a recursive key walk SHALL assert this absence (the same recursive walk used by the redaction test)

### Requirement: Content script handles JSON and HTML responses

The bridge content script's `handleFetch` SHALL inspect the upstream `Content-Type` response header and dispatch the body parsing accordingly: `application/json` (and `application/*+json`) responses SHALL be parsed via `r.json()`; `text/html` responses SHALL be read via `r.text()`. The resulting envelope SHALL be `{ ok: true, status, data }` where `data` is the parsed object for JSON responses and a raw string for HTML responses. This dual-mode behavior is required because `/user/details` is server-rendered HTML while existing endpoints (`/profile/ping`, weekly, daily, tooltip) return JSON.

#### Scenario: JSON response is decoded as an object

- **GIVEN** the upstream returns `Content-Type: application/json` with body `{"foo":1}`
- **WHEN** the bridge content script's `handleFetch` processes the response
- **THEN** the envelope SHALL be `{ ok: true, status: 200, data: { foo: 1 } }`

#### Scenario: HTML response is decoded as a raw string

- **GIVEN** the upstream returns `Content-Type: text/html; charset=utf-8` with body `<html>...</html>`
- **WHEN** the bridge content script's `handleFetch` processes the response
- **THEN** the envelope SHALL be `{ ok: true, status: 200, data: "<html>...</html>" }`
