## ADDED Requirements

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

- `physiological.{weight, bpmMax}`
- `paces.{cycling.{z4Upper, z5Lower}, running.{z4Upper}, swimming.{z4Upper}}`
- `hrZones.{cycling.{z4Upper}, running.{z4Upper}}`

Any field present in the page (gender, birthday, fat, smoker, IMC, bpm_rest, user_notes, coach.email, coach.name, email, records, tests) MUST be discarded at parse time and SHALL NOT appear in the returned `ZonesPayload`. The bridge SHALL include a redaction unit test that walks the parsed object recursively (NOT a substring match against `JSON.stringify(output)` — substring matches false-pass on benign keys that contain a forbidden token like `emailReceiptsEnabled`) and asserts no key in the forbidden set appears at any depth.

#### Scenario: Redaction — sensitive fields are dropped

- **GIVEN** a fixture HTML containing `gender`, `birthday`, `fat`, `smoker`, `bpm_rest`, `user_notes`, `coach.email`, `coach.name`, `email`, `records`, and `tests` blocks
- **WHEN** `parseDetailsHtml` runs against the fixture
- **THEN** the returned `output.physiological` SHALL contain ONLY the allowlisted keys (`weight`, `bpmMax`)
- **AND** a recursive key walk over the parsed `output` SHALL NOT find any key in the forbidden set at any nesting depth

#### Scenario: T2G's 0-indexed DOM names map to 1-indexed payload keys

- **GIVEN** the upstream HTML has `<input name="z3_upper" value="174">` inside `#hrzones-{userId}` for the cycling block (T2G uses 0-indexed `z0..z4` form names for visual zones Z1..Z5; `z3_upper` is therefore the upper bound of visual Z4)
- **WHEN** `parseDetailsHtml` runs
- **THEN** the returned `output.hrZones.cycling.z4Upper` SHALL equal `174`
- **AND** the parser SHALL NOT emit any key prefixed `z0..z4` (the 1-indexed mapping is the parser's contract)

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

## MODIFIED Requirements

### Requirement: Bridge ALLOWED list

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

### Requirement: BRIDGE_MANIFEST capabilities array

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
