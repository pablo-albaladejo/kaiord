## MODIFIED Requirements

### Requirement: Service-worker call surface with a path/method allowlist

All Garmin **data** calls SHALL be made from the background service worker against `https://connectapi.garmin.com` with an `Authorization: Bearer` header. No call SHALL be relayed through a page, a content script, or a Garmin tab.

Every **data** call SHALL be checked against an allowlist of (method, path-pattern) rules before any network request is made, as defence in depth: the SPA can only trigger fixed paths, and the bridge still refuses anything outside the set. The allowlist SHALL be:

- `GET` `/workout-service/workouts` (with any query string)
- `POST` `/workout-service/workout`
- `POST` `/upload-service/upload` (with an optional sub-path, e.g. `/.fit`)
- `GET` `/activitylist-service/activities/search/activities` (with any query string)
- `POST` `/workout-service/schedule/<digits>` — place a library workout on a calendar date
- `DELETE` `/workout-service/schedule/<digits>` — remove one calendar entry by its schedule id
- `GET` `/calendar-service/year/<4 digits>/month/<1–2 digits>` — read one month of the calendar (see Requirement: Calendar read filtered in the service worker)

Each schedule pattern SHALL match digits only, with no query string and no further sub-path; each entry SHALL sit on a single physical line so the privacy-surface guard reads it whole.

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

#### Scenario: Calendar schedule paths accept digits only

- **WHEN** `POST` or `DELETE` is checked against `/workout-service/schedule/1790718680`
- **THEN** both SHALL be allowed
- **AND** `GET /workout-service/schedule/1790718680`, `POST /workout-service/schedule/abc`, `POST /workout-service/schedule/1/2` and `POST /workout-service/schedule/1?x=1` SHALL be rejected

### Requirement: Origin-pinned external message API

The extension SHALL handle messages from allowed SPA origins via `chrome.runtime.onMessageExternal`. The externally reachable actions SHALL be exactly these 11: `ping`, `list`, `activities`, `push`, `push-body-composition`, `open-garmin`, `profile-snapshot`, `profile-snapshot-clear`, `schedule`, `unschedule` and `calendar-find`:

- `ping` — session check plus the bridge manifest and the `features` list
- `list` — the workout list from Garmin Connect
- `activities` — the athlete's recent activities (read-only)
- `push` — a GCN workout payload (requires `message.gcn`)
- `push-body-composition` — a FIT body-composition payload (requires `message.fit`)
- `open-garmin` — opens the Garmin Connect dashboard in a new tab
- `profile-snapshot` / `profile-snapshot-clear` — store or drop the SPA's pushed profile snapshot
- `schedule` — place a library workout on a calendar date (requires `message.workoutId`, `message.date`)
- `unschedule` — remove one calendar entry (requires `message.scheduleId`)
- `calendar-find` — the calendar entries of one workout around a date (requires `message.workoutId`, `message.date`)

Every external message SHALL be origin-pinned and action-allowlisted by the vendored bridge-core guard before the action handler runs. A sender outside the allowed SPA origins, or an action outside the set above, SHALL be answered `{ ok: false, protocolVersion: 1, error: "Origin or action not permitted", retryable: false }` without invoking the handler and without any network request. The `Unknown action: <name>` error is reachable only on the internal (popup) channel.

All responses SHALL use the shape `{ ok: boolean, protocolVersion?: number, data?: unknown, error?: string }`, and `ping` SHALL include `protocolVersion: 1` (bumped only when the message contract changes).

The `ping` response `data` envelope SHALL contain the full `BridgeManifest` fields (`id: "garmin-bridge"`, `name: "Garmin Connect"`, `version`, `protocolVersion: 1`, `capabilities`) alongside the session-status fields `authenticated` (boolean) and `gcApi` (the result envelope of the probing read), and the `features` list (see Requirement: Calendar feature flags in the ping response). The upstream Garmin response SHALL be NESTED under `gcApi` rather than spread into the envelope, so no key it carries can reach the identity level at all. That nesting — not a precedence rule — is what prevents an upstream response from spoofing the bridge identity: this handler builds its result by spreading the manifest first and then assigning the status fields, so there is no collision surface, and if one were introduced by spreading the response afterwards the later spread would win. The SPA validates `response.data` against `bridgeManifestSchema`, which strips the session-status fields so both consumers coexist.

#### Scenario: SPA pings the extension

- **WHEN** the SPA sends `{ action: "ping" }`
- **THEN** the extension returns `{ ok: true, protocolVersion: 1, data: { id: "garmin-bridge", name: "Garmin Connect", version: "<pkg version>", protocolVersion: 1, capabilities: ["write:workouts", "read:activities", "write:body"], features: ["calendar-write-v1", "calendar-find-v1"], authenticated: true, gcApi: { ok: true, status: 200 } } }`

#### Scenario: SPA pushes a workout

- **WHEN** the SPA sends `{ action: "push", gcn: { workoutName: "...", steps: [...] } }`
- **THEN** the extension posts the GCN payload to Garmin Connect and returns `{ ok: true, data: { workoutId, ... } }`

#### Scenario: SPA requests the Garmin dashboard

- **WHEN** the SPA sends `{ action: "open-garmin" }`
- **THEN** the extension opens `https://connect.garmin.com/modern/` in a new tab and returns `{ ok: true }`

#### Scenario: Unknown action is rejected

- **WHEN** an allowed SPA origin sends `{ action: "unknown" }`
- **THEN** the extension returns `{ ok: false, protocolVersion: 1, error: "Origin or action not permitted", retryable: false }`
- **AND** the action handler SHALL NOT run and no network request SHALL be made

#### Scenario: Incompatible protocol is surfaced

- **WHEN** the SPA receives a ping response without `protocolVersion` or with an unsupported version
- **THEN** the SPA shows "Update your Kaiord Garmin Bridge extension"

## ADDED Requirements

### Requirement: Calendar placement write actions

The extension SHALL expose `schedule{workoutId, date}` and `unschedule{scheduleId}`, both Bearer calls on `connectapi.garmin.com` through the allowlist above.

- `schedule` SHALL `POST /workout-service/schedule/{workoutId}` with the JSON body `{"date":"YYYY-MM-DD"}` and SHALL return only `{ workoutScheduleId }`: Garmin's numeric root `workoutScheduleId` as a digit string, or `null` when a 2xx carries no usable id. It SHALL NOT relay the rest of Garmin's response.
- `unschedule` SHALL `DELETE /workout-service/schedule/{scheduleId}` and SHALL return `null` on a 2xx (Garmin answers 204).
- Both SHALL validate their inputs before any fetch: ids SHALL be strings matching `^\d+$`, and `date` SHALL be a real calendar date in `YYYY-MM-DD`. An invalid input SHALL be refused with `retryable: false` and SHALL make no network request.
- A non-2xx answer SHALL be thrown with its HTTP `status` intact (for example 404 for an unknown workout id on `schedule`, or for an already-removed entry on `unschedule`), and a 401 that survives the re-mint SHALL carry `needsReauth`.

The POST is not idempotent — two identical calls create two calendar entries (Phase 0) — so the bridge SHALL NOT retry a `schedule` on its own. Deciding whether a failed or ambiguous `schedule` may be repeated is the SPA's job (spec `spa-garmin-extension`).

#### Scenario: Schedule returns only the schedule id

- **GIVEN** a valid token and Garmin answering 200 with `{ "workoutScheduleId": 1790718680, "workout": { … } }`
- **WHEN** the SPA sends `{ action: "schedule", workoutId: "1707805999", date: "2026-09-29" }`
- **THEN** the bridge SHALL POST `{"date":"2026-09-29"}` to `/workout-service/schedule/1707805999` and return `{ workoutScheduleId: "1790718680" }`

#### Scenario: Unschedule maps 204 to null and keeps failure statuses

- **WHEN** the SPA sends `{ action: "unschedule", scheduleId: "1790718680" }`
- **THEN** a 204 SHALL answer `{ ok: true, data: null }`
- **AND** a 404 or a 500 SHALL answer `{ ok: false }` carrying `status` 404 or 500

#### Scenario: Invalid input makes no request

- **WHEN** `schedule` receives `workoutId: "12a"` or `date: "2026-02-30"`, or `unschedule` receives `scheduleId: "../1"`
- **THEN** the bridge SHALL refuse it with `retryable: false` and make 0 fetches

### Requirement: Per-action deadline for calendar actions

Each calendar action SHALL run under one hard deadline `D` of 30 seconds measured from handler entry. The deadline SHALL be delivered as an abort signal injected through `fetchImpl` into every network hop the action causes: the OAuth2 refresh exchange, the three mint hops, the 401 re-mint, and both attempts of the data call. The token lifecycle — `ensureToken`, the re-mint, and a `mintInFlight` promise joined from another caller whose fetches carry no signal — SHALL be raced against the same signal, so a caller that joins someone else's mint still ends by `D`.

No write SHALL start once `D_START` (20 seconds after entry) has passed. An action that ends before its write was sent — because `D_START` passed, or because `D` fired during the token lifecycle — SHALL answer `error: "deadline-before-send"` with `retryable: true` and no `status`; it is a definite failure, because nothing reached Garmin. A write refused with 401 counts as not sent. An action aborted by `D` after its write was sent SHALL answer `error: "deadline-exceeded"` with no `status`, which the SPA classifies as ambiguous. The code travels in `error` because the vendored envelope has no `code` field.

The deadline and its signal plumbing SHALL live in the bridge-owned `background.js` and `garmin-oauth.js`; the vendored `bearer-fetch.js` SHALL NOT change.

#### Scenario: A hung mint hop ends by the deadline without a write

- **GIVEN** no stored token and a mint hop that never answers
- **WHEN** `schedule` runs
- **THEN** it SHALL answer `deadline-before-send` by `D` with 0 POSTs

#### Scenario: A joined mint is still bounded

- **GIVEN** another caller started a mint whose fetch never answers and carries no signal
- **WHEN** `schedule` joins that mint
- **THEN** it SHALL still answer by `D`

#### Scenario: A 401 followed by a hung re-mint makes at most one POST

- **WHEN** the POST answers 401 and the re-mint never answers
- **THEN** the action SHALL answer by `D` with at most 1 POST

#### Scenario: A POST that hangs after it was sent is ambiguous

- **WHEN** the POST was sent and never answers
- **THEN** the action SHALL be aborted at `D` and answer `deadline-exceeded` with no `status`

### Requirement: Calendar feature flags in the ping response

The `ping` data SHALL carry a `features` array naming the calendar contracts this bridge build supports: `calendar-write-v1` for `schedule`/`unschedule` under the deadline, and `calendar-find-v1` for `calendar-find`. `features` is separate from `capabilities`: it SHALL NOT be added to `BRIDGE_MANIFEST` or `bridge-identity.js`, whose `capabilities` stay `["write:workouts", "read:activities", "write:body"]`. The SPA SHALL treat a missing `features` as `[]`, which is how it recognises an older bridge.

#### Scenario: A current bridge advertises its calendar features

- **WHEN** the SPA pings the bridge
- **THEN** `data.features` SHALL contain `calendar-write-v1`, and SHALL contain `calendar-find-v1` once the calendar read ships

### Requirement: Calendar read filtered in the service worker

The extension SHALL expose `calendar-find{workoutId, date}`, a read-only action that fetches the calendar month containing `date` (`GET /calendar-service/year/{Y}/month/{M}`) and returns only `[{ workoutScheduleId: string | null, date: "YYYY-MM-DD" }]` for the entries of `workoutId`. Every other entry of the month SHALL be discarded inside the service worker and SHALL NOT reach the SPA. Inputs SHALL be validated as for `schedule`, and the action SHALL run under the per-action deadline.

This requirement rests on assumptions A1–A5 in `design.md`, observed only in the Garmin web app and **not yet verified** against the API the bridge calls; the live capture T0b settles them before any code. A1: items carry the library `workoutId`. A2: items carry a `YYYY-MM-DD` date. A3: some item field equals the `workoutScheduleId` (when false, `workoutScheduleId` is `null` in every entry and the SPA applies its count rules). A4: the month parameter is 0-based. A5: a write is visible to a read within `SETTLE_MS`. If A1 is false, this requirement, the `calendar-find` action, its allowlist entry and `calendar-find-v1` SHALL be removed from this change before it is archived.

#### Scenario: Only the target workout's entries are returned

- **GIVEN** a month holding entries of several workouts
- **WHEN** the SPA sends `{ action: "calendar-find", workoutId: "1707805999", date: "2026-09-29" }`
- **THEN** the bridge SHALL return exactly the `{ workoutScheduleId, date }` pairs whose workout is `1707805999`

#### Scenario: The month parameter follows the recorded base

- **GIVEN** A4 holds (0-based months)
- **WHEN** `calendar-find` is asked about a September date
- **THEN** the bridge SHALL request `month/8`
