## ADDED Requirements

### Requirement: Distinct icon assets

The extension SHALL ship icon assets that are visually distinguishable from the Garmin bridge at every size declared in the manifest (16, 48, 128). The Train2Go bridge SHALL use a coral accent (`#f74464`, matching the existing popup brand color) for the colored mark of the icon while preserving the shared Kaiord silhouette.

The three PNGs SHALL be derived from the same shared SVG master at `packages/_shared/extension-icon/master.svg` used by the Garmin bridge via the repo-level `pnpm icons:build` script and SHALL NOT be hand-edited.

A mechanical guard SHALL fail the lint job if either of the following is true at any of the three sizes:

1. The Garmin and Train2Go icons of that size are pixel-identical or below a fixed inter-icon mean-color-delta threshold.
2. At 16×16, the accent color (within ±15° hue tolerance of the bridge's accent token) constitutes less than 25% of non-transparent pixel mass — i.e., the accent must be a substantive shape, not a thin stripe.

#### Scenario: Icons are present at required sizes

- **WHEN** the extension is loaded
- **THEN** files `icons/icon16.png`, `icons/icon48.png`, and `icons/icon128.png` SHALL exist with the dimensions implied by their names

#### Scenario: Train2Go and Garmin icons differ

- **WHEN** the icon-build guard compares Train2Go's `icons/icon16.png` to Garmin's `icons/icon16.png` (and similarly for 48 and 128)
- **THEN** the average per-pixel color delta SHALL exceed the configured visual-separation threshold

#### Scenario: Accent occupies sufficient pixel mass

- **WHEN** the icon-build guard inspects Train2Go's `icons/icon16.png`
- **THEN** pixels within ±15° hue of `#f74464` SHALL constitute at least 25% of the non-transparent pixel mass

### Requirement: Profile snapshot action handler

The extension SHALL handle a `profile-snapshot` external message from allowed SPA origins per the SPA Bridge Protocol's "Profile snapshot push action" requirement.

The handler SHALL persist the validated snapshot to `chrome.storage.local` under the key `profileSnapshot` together with a `receivedAt` epoch-millisecond timestamp, SHALL respond with `{ ok: true, protocolVersion: 1, data: { storedAt: <epoch ms> } }` on success, and SHALL respond with `{ ok: false, protocolVersion: 1, error: <reason>, retryable: false }` on validation, prototype-pollution, byte-budget, or storage failure.

The handler SHALL NOT make any network request, SHALL NOT touch `host_permissions` URLs, and SHALL NOT mutate the snapshot — it is stored byte-for-byte as received apart from the appended `receivedAt` field.

The handler's plain-JS structural validator SHALL construct outputs via `Object.create(null)`, SHALL inspect own keys via `Object.getOwnPropertyNames` (including recursively for every nested object), and SHALL reject any input whose own keys at any depth include `__proto__`, `constructor`, or `prototype`. The validator SHALL NOT mutate `Object.prototype`.

The handler SHALL verify `sender.origin` is defined AND matches one of the SPA origins declared in `externally_connectable.matches`, and SHALL reject with `{ ok: false, protocolVersion: 1, error: "Origin not permitted", retryable: false }` if `sender.origin` is undefined OR does not match — even though Chrome already filters at the platform level (defense-in-depth, also covers any future runtime-context where `sender.origin` might be unset).

#### Scenario: Snapshot is persisted

- **WHEN** the SPA sends `{ action: "profile-snapshot", snapshot: <valid v1 snapshot> }`
- **THEN** the extension SHALL write `{ ...snapshot, receivedAt: <Date.now()> }` to `chrome.storage.local` under `profileSnapshot` and respond `{ ok: true, protocolVersion: 1, data: { storedAt: <Date.now() at the moment chrome.storage.local.set's success callback fires> } }`

#### Scenario: Invalid snapshot is rejected

- **WHEN** the SPA sends `{ action: "profile-snapshot", snapshot: <malformed> }`
- **THEN** the extension SHALL NOT write to `chrome.storage.local` and SHALL respond with `{ ok: false, protocolVersion: 1, error: "Invalid snapshot payload", retryable: false }`

#### Scenario: Prototype-pollution payload is rejected

- **WHEN** the SPA sends `{ action: "profile-snapshot", snapshot: { __proto__: { isAdmin: true }, schemaVersion: 1, profile: { name: "Pablo" }, generatedAt: "2026-05-01T00:00:00Z" } }`
- **THEN** the extension SHALL respond `{ ok: false, protocolVersion: 1, error: "Invalid snapshot payload", retryable: false }`, SHALL NOT write to `chrome.storage.local`, and the global `Object.prototype` SHALL NOT be mutated

#### Scenario: Oversized snapshot is rejected

- **WHEN** the SPA sends a snapshot whose JSON serialization exceeds 8 KiB
- **THEN** the extension SHALL respond `{ ok: false, protocolVersion: 1, error: "Snapshot too large", retryable: false }`

#### Scenario: Storage write failure is reported

- **WHEN** `chrome.storage.local.set` rejects (e.g., quota exceeded, runtime error)
- **THEN** the extension SHALL respond with `{ ok: false, protocolVersion: 1, error: <runtime message>, retryable: false }` and SHALL NOT mutate any other storage keys

#### Scenario: Snapshot from disallowed origin is rejected

- **WHEN** a `profile-snapshot` action arrives with `sender.origin` not matching any entry in `externally_connectable.matches`
- **THEN** the handler SHALL respond with `{ ok: false, protocolVersion: 1, error: "Origin not permitted", retryable: false }` and SHALL NOT write to `chrome.storage.local`

### Requirement: Profile snapshot clear action handler

The extension SHALL handle a `profile-snapshot-clear` external message per the protocol's "Profile snapshot clear action" requirement. The handler SHALL remove the `profileSnapshot` and `lastWeeklyRollup` keys from `chrome.storage.local` and respond `{ ok: true, protocolVersion: 1, data: null }`. The handler SHALL be idempotent; clearing already-empty keys SHALL succeed with the same response.

#### Scenario: Snapshot is cleared

- **WHEN** the SPA sends `{ action: "profile-snapshot-clear" }`
- **THEN** the extension SHALL remove `profileSnapshot` (and `lastWeeklyRollup` if present) from `chrome.storage.local` and respond `{ ok: true, protocolVersion: 1, data: null }`

#### Scenario: Clear is idempotent

- **WHEN** the SPA sends `{ action: "profile-snapshot-clear" }` to a bridge whose `profileSnapshot` key is already absent
- **THEN** the extension SHALL respond `{ ok: true, protocolVersion: 1, data: null }` without raising an error

### Requirement: Popup accessibility

The popup SHALL convey connection status by both color AND a text or icon label (e.g., a check-mark glyph plus "Connected", a cross glyph plus "Not connected") so users with color-vision deficiencies can determine state. The status pill SHALL carry an `aria-label` matching the visible text. All deep links SHALL have descriptive `aria-label`s ("Open Kaiord editor", "Open Train2Go"). The refresh-icon button SHALL have `aria-label="Refresh"`.

The popup SHALL maintain a logical keyboard tab order: status pill → athlete card → primary CTA → secondary link → refresh-icon (or, on failure, retry).

Decorative glyphs (the leading ✓/✗ in the status pill, the ⟳ refresh icon, the accent-dot in the header) SHALL be marked `aria-hidden="true"` so screen readers do not double-announce alongside the `aria-label` / visible-text label of their parent element.

#### Scenario: Status uses both color and label

- **WHEN** the popup renders any connection state
- **THEN** the status pill SHALL include a non-color glyph or text label that conveys the state, AND the same text SHALL be exposed as `aria-label` on the pill

#### Scenario: Tab order is logical

- **WHEN** a keyboard-only user presses Tab from the popup root
- **THEN** focus SHALL traverse status pill → athlete-card-deep-link (if present) → primary CTA → secondary link → refresh-icon (success path) or retry (failure path), with no skipped focusable elements

## MODIFIED Requirements

### Requirement: Extension manifest

The extension SHALL target Chrome (Chromium-based browsers) only using Manifest V3.

The extension SHALL require the following permissions:

- `tabs` — query for Train2Go tabs
- `storage` — persist the active Kaiord profile snapshot in `chrome.storage.local` so the popup can render athlete data without a network call

Host permissions SHALL include `https://app.train2go.com/*`.

The `externally_connectable` field SHALL declare SPA origins: `http://localhost:5173/*`, `http://localhost:5174/*`, and `https://*.kaiord.com/*`.

The manifest SHALL declare a top-level `icons` field with sizes 16, 48, and 128. The `action.default_icon` field SHALL reference sizes 48 and 128.

A production variant (`manifest.prod.json`) SHALL exist that excludes localhost origins from `externally_connectable` and declares the same `permissions` list as the development manifest.

The extension SHALL NOT require `webRequest` or any permission beyond `tabs` and `storage`.

#### Scenario: Extension loads with required permissions

- **WHEN** the extension is installed
- **THEN** it registers exactly the `tabs` and `storage` permissions and declares `https://app.train2go.com/*` as host permission

#### Scenario: Production manifest matches dev permissions

- **WHEN** `manifest.prod.json` is read
- **THEN** its `permissions` array SHALL be `["tabs", "storage"]` (same set as `manifest.json`) and `externally_connectable.matches` SHALL contain only `https://*.kaiord.com/*`

#### Scenario: Extension declares icon sizes

- **WHEN** the extension manifest is read
- **THEN** the top-level `icons` field SHALL declare sizes 16, 48, and 128
- **AND** `action.default_icon` SHALL declare sizes 48 and 128

### Requirement: Popup UI

The extension SHALL provide a popup that presents an identity-card layout, sourced primarily from the cached `profileSnapshot` plus the existing `ping` action. The popup SHALL NOT render a "Read This Week" button and SHALL NOT issue a `read-week` call from popup code unless explicitly triggered by the on-open auto-fetch pipeline (with a 5-minute TTL cache) or by the user clicking the header refresh-icon affordance.

On open, the popup SHALL automatically:

1. Read `chrome.storage.local.get("profileSnapshot")` to render the athlete card.
2. Send `{ action: "ping" }` to the background to render the connection status pill, the user name, and (if present in the existing ping payload) the coach/trainer name as a sub-line.
3. Render a per-bridge weekly rollup whose source is a single `read-week` call for today's date with the `userId` returned by `ping`, collapsed to a one-line summary in the form "<N> sessions planned · <M> done · workload <X>". The parsed rollup SHALL be cached in `chrome.storage.local` under `lastWeeklyRollup` with a 5-minute TTL; on cache hit the popup SHALL skip the `read-week` call.

The auto-fetch pipeline phases SHALL be subject to differentiated wall-clock timeouts: snapshot read 1 s, ping 3 s, rollup (`read-week`) **8 s** (the rollup parses ~3 weeks of HTML in the SW; the 8 s budget avoids false-positive disconnects on slow upstreams). On **ping** or **snapshot** timeout the popup SHALL render the disconnected state with a "Retry" button. On **rollup-only** timeout (ping succeeded), the popup SHALL render the connected state with the rollup line replaced by "Rollup unavailable — try again". The in-flight popup-side await SHALL be aborted via `AbortController` in all timeout cases.

The popup SHALL render exactly **one primary call-to-action** ("Open editor" — full-width button in accent color, opens `OPEN_EDITOR_URL` baked into `popup.js` at build time: `https://app.kaiord.com/` for the prod build, `http://localhost:5173/` for the dev build) and **one secondary link** ("Open Train2Go ↗" — text link, opens `https://app.train2go.com/user/index`). The two SHALL NOT be visually equivalent.

The popup SHALL render a refresh-icon button (`⟳`, 16px, accent color, `aria-label="Refresh"`) in a reserved 16×16 slot at the top-right of the header on every render path. The header SHALL be a 3-column grid (`[accent-dot 8px] [title 1fr] [refresh-slot 16px]`) so the slot is always reserved. The icon SHALL use `visibility: hidden` (NOT `display: none`) on the loading and failure paths so the title row never reflows. Clicking the icon SHALL re-run `loadPopupData()` and SHALL bypass the `lastWeeklyRollup` TTL cache.

The popup SHALL render an "Updated <relative time>" line near the athlete card with `aria-live="polite"` so when stale-snapshot replacement happens, the user understands why.

The popup MUST NOT issue any network request to a path that is not already in the content-script ALLOWED list. No new outbound URLs, host permissions, or content-script paths SHALL be introduced by the popup change. All `fetch(...)` calls in `popup.js` SHALL use relative paths only (no `http(s)://` scheme); a mechanical guard enforces this.

Connection status, accessibility affordances, and keyboard focus management are governed by the "Popup accessibility" requirement of this spec; this requirement does not restate them.

#### Scenario: Popup renders connected identity card on open

- **WHEN** the user opens the popup, the Train2Go session is active, and a fresh `profileSnapshot` (age ≤ `STALE_SNAPSHOT_THRESHOLD_DAYS` exported from `@kaiord/core`, default value 7) exists in `chrome.storage.local`
- **THEN** the popup SHALL render a green status pill with the user name (and trainer name as a sub-line if present in the ping payload), the athlete card (FTP, threshold pace, LTHR, max HR, active sport — only fields present in the snapshot), the weekly rollup, the deep-link row with one primary "Open editor" CTA and one secondary "Open Train2Go" link, and a refresh-icon button in the header — without showing a "Check Session" or "Read This Week" button

#### Scenario: Popup renders disconnected state with retry

- **WHEN** the user opens the popup and the Train2Go session is not active (no Train2Go tab open or `sessionActive === false`)
- **THEN** the popup SHALL render a red status pill with `Not connected. Log in to Train2Go.`, hide the weekly rollup, hide the refresh-icon button, and render a single "Retry" button that re-runs the auto-fetch pipeline when clicked

#### Scenario: Popup ping or snapshot phase times out renders disconnected state

- **WHEN** the user opens the popup and either the snapshot read (>1 s) or the ping (>3 s) phase exceeds its timeout
- **THEN** the in-flight popup-side await SHALL be aborted, the popup SHALL render the disconnected state with a "Retry" button, and no partial data SHALL be displayed

#### Scenario: Popup rollup-only timeout preserves connected state

- **WHEN** the user opens the popup, ping succeeds, and the `read-week` rollup phase (>8 s) exceeds its timeout
- **THEN** the popup SHALL render the connected status pill, the athlete card (if a fresh snapshot exists), and the rollup line SHALL show "Rollup unavailable — try again" instead of the numeric summary; no "Retry" button SHALL be rendered (the connection itself is alive)

#### Scenario: Popup re-open during in-flight rollup tolerates duplicate fetch

- **WHEN** the user closes the popup mid-`read-week` and re-opens it within ~100 ms before the original SW-side fetch resolves
- **THEN** the new popup SHALL run a fresh auto-fetch pipeline; the SW SHALL accept both `read-week` calls (no in-memory promise coalescing); both write through to `lastWeeklyRollup`; the value persisted SHALL be whichever response arrived second; this behavior is the same as the "Concurrent popup opens during cache miss" scenario and produces no user-visible defect

#### Scenario: Popup shows snapshot placeholder when none exists

- **WHEN** the user opens the popup and `chrome.storage.local.get("profileSnapshot")` returns no value
- **THEN** the popup SHALL render the athlete-card area as a placeholder reading "No profile yet. Open Kaiord to set FTP, pace, and HR." with a deep link to the SPA, and SHALL NOT show stale or fabricated athlete fields

#### Scenario: Popup shows stale-snapshot placeholder

- **WHEN** the user opens the popup and the persisted `profileSnapshot.receivedAt` is older than `STALE_SNAPSHOT_THRESHOLD_DAYS` (exported from `@kaiord/core`, default 7)
- **THEN** the popup SHALL replace the athlete card with the same placeholder defined for the no-snapshot case

#### Scenario: Popup auto-loads weekly rollup

- **WHEN** the user opens the popup, the session is active, the auto-fetch pipeline runs to completion, and no fresh `lastWeeklyRollup` cache entry exists
- **THEN** the popup SHALL display the rollup line "<N> sessions planned · <M> done · workload <X>" where the values come from a single `read-week` call for today's date; no "Read This Week" button SHALL be rendered

#### Scenario: Popup uses cached rollup when fresh

- **WHEN** the user opens the popup and `lastWeeklyRollup` was written within the last 5 minutes
- **THEN** the popup SHALL render the cached rollup line and SHALL NOT issue a `read-week` call

#### Scenario: Concurrent popup opens during cache miss

- **WHEN** two popup instances open within a few hundred milliseconds, both observe a `lastWeeklyRollup` cache miss, and both issue `read-week` calls before either response returns
- **THEN** both `read-week` calls SHALL be permitted (no in-memory promise coalescing is required), each SHALL write through to `lastWeeklyRollup`, and the value persisted SHALL be whichever response arrived second; this duplicate-fetch behavior is acceptable noise for an infrequent, idempotent, user-initiated read

#### Scenario: Popup renders relative-time updated line

- **WHEN** the popup is in the connected state and the persisted `profileSnapshot.receivedAt` is `now - 2.4 hours`
- **THEN** the popup SHALL render the line "Updated 2 hours ago" (formatted via `Intl.RelativeTimeFormat("en", { numeric: "auto" })` snapped to the largest unit ≥ the threshold defined in `design.md` D4) inside the athlete card with `aria-live="polite"`

#### Scenario: Refresh-icon visibility during loading

- **WHEN** the popup is in its initial loading state (auto-fetch pipeline in flight, no result yet)
- **THEN** the refresh-icon button SHALL be `visibility: hidden` (its 16×16 slot in the header grid SHALL remain reserved so the title row does not reflow); the popup body SHALL render a loading skeleton in the status pill and athlete-card regions

#### Scenario: Header layout does not shift across states

- **WHEN** the popup transitions from loading → success → loading via a refresh-icon click
- **THEN** the bounding rect of the header title element SHALL be byte-identical across both states (verified via `getBoundingClientRect()` in the popup test); no layout shift SHALL occur

#### Scenario: Athlete card renders single-cell when only one field is present

- **WHEN** the popup is in the connected state and the persisted snapshot contains exactly one athlete field (e.g., only `bodyWeight`)
- **THEN** the athlete card SHALL render as a single full-width cell (NOT a 2-column grid with one empty cell)

#### Scenario: Athlete card uses thresholds-empty placeholder when zero fields are present

- **WHEN** the popup is in the connected state and the persisted snapshot contains zero athlete fields (no FTP, no thresholds, no HR, no body weight, no active sport)
- **THEN** the popup SHALL render the athlete-card area with a _distinct_ placeholder reading "Profile has no thresholds yet. Open Kaiord to set FTP, pace, and HR." (NOT the "No profile yet" copy used when no snapshot exists at all), so the user understands they have a profile but it lacks training data

#### Scenario: Refresh icon re-runs the pipeline and bypasses TTL

- **WHEN** the popup is in the connected state and the user clicks the refresh-icon button
- **THEN** the popup SHALL re-run `loadPopupData()`, ignore the `lastWeeklyRollup` TTL (forcing a fresh `read-week`), and re-render the success state on completion

#### Scenario: Retry button receives initial focus on failure

- **WHEN** the popup opens and the auto-fetch pipeline reports a failure
- **THEN** the "Retry" button SHALL be the first focusable element to receive focus

#### Scenario: Popup makes no new outbound requests

- **WHEN** the popup completes its on-open auto-fetch pipeline
- **THEN** the set of paths fetched SHALL be a subset of the content-script ALLOWED list defined in this spec's "Content script path allowlist" requirement — no path outside that list SHALL be requested by popup code, and no `fetch` call in `popup.js` SHALL use an absolute URL (no `http(s)://` literal)

### Requirement: External message API

The extension SHALL handle messages from allowed SPA origins via `chrome.runtime.onMessageExternal` with the following actions:

- `ping` — Calls `/api/v2/profile/ping` and returns the user profile JSON (including `userId`, `name`, `bpm_max`, `bpm_rest`, `weight`). The response SHALL include `protocolVersion: 1`. If the upstream payload contains a coach/trainer name field, the parser SHALL extract it into the response data as `coachName`; if absent, `coachName` SHALL be omitted.
- `read-week` — Accepts `{ action: "read-week", date: "YYYY-MM-DD", userId: number }`. Calls the weekly endpoint, parses the HTML, and returns an array of activity objects spanning 3 weeks.
- `read-day` — Accepts `{ action: "read-day", date: "YYYY-MM-DD", userId: number }`. Calls the daily endpoint, parses the HTML, and returns activity objects with full descriptions.
- `open-train2go` — Opens `https://app.train2go.com/user/index` in a new tab.
- `profile-snapshot` — Accepts `{ action: "profile-snapshot", snapshot: ProfileSnapshot }` per the SPA Bridge Protocol. Persists the snapshot to `chrome.storage.local` under `profileSnapshot` and returns `{ ok: true, protocolVersion: 1, data: { storedAt: <epoch ms> } }`. This action SHALL NOT issue any network request.
- `profile-snapshot-clear` — Accepts `{ action: "profile-snapshot-clear" }` per the SPA Bridge Protocol. Removes `profileSnapshot` and `lastWeeklyRollup` from `chrome.storage.local` and returns `{ ok: true, protocolVersion: 1, data: null }`. This action SHALL NOT issue any network request.

All responses SHALL include `protocolVersion: 1` in the response envelope, matching the Garmin bridge `sendResult`/`sendError` pattern. The response shape SHALL be `{ ok: boolean, protocolVersion: number, data?: unknown, error?: string, status?: number }`.

The `ping` response SHALL extract `userId` from the profile JSON and include it in the response data, so the SPA can use it for subsequent `read-week` and `read-day` calls.

#### Scenario: SPA pings extension

- **WHEN** the SPA sends `{ action: "ping" }` to the extension
- **THEN** the extension calls `/api/v2/profile/ping` and returns `{ ok: true, protocolVersion: 1, data: { id: "train2go-bridge", name: "Kaiord Train2Go Bridge", version: "0.1.0", protocolVersion: 1, capabilities: ["read:training-plan"], userId: 28035, userName: "Pablo", sessionActive: true } }`

The `data` field SHALL include both the bridge manifest fields (`id`, `name`, `version`, `protocolVersion`, `capabilities`) — required by the SPA's `parseManifestFromPing` function — and session-specific fields (`userId`, `userName`, `sessionActive`). When the upstream payload exposes a coach name, the field `coachName` SHALL be present.

#### Scenario: Ping detects expired session

- **WHEN** the SPA sends `{ action: "ping" }` and the Train2Go session has expired
- **THEN** the extension returns `{ ok: true, protocolVersion: 1, data: { id: "train2go-bridge", name: "Kaiord Train2Go Bridge", version: "0.1.0", protocolVersion: 1, capabilities: ["read:training-plan"], sessionActive: false } }`

The manifest fields SHALL always be present in the ping response regardless of session state, so the SPA's `parseManifestFromPing` can register the bridge even when the session is expired.

#### Scenario: SPA pushes a profile snapshot

- **WHEN** the SPA sends `{ action: "profile-snapshot", snapshot: <valid v1 snapshot> }`
- **THEN** the extension SHALL write `{ ...snapshot, receivedAt: <Date.now()> }` to `chrome.storage.local` under `profileSnapshot` and respond `{ ok: true, protocolVersion: 1, data: { storedAt: <Date.now()> } }` without issuing any network request

#### Scenario: SPA clears the profile snapshot

- **WHEN** the SPA sends `{ action: "profile-snapshot-clear" }`
- **THEN** the extension SHALL remove `profileSnapshot` and `lastWeeklyRollup` from `chrome.storage.local` and respond `{ ok: true, protocolVersion: 1, data: null }` without issuing any network request

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
- **THEN** the extension returns `{ ok: false, protocolVersion: 1, error: "Unknown action: unknown" }`
