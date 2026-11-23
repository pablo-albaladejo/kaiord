## MODIFIED Requirements

### Requirement: Origin-pinned external message API

The extension SHALL handle messages from allowed SPA origins via `chrome.runtime.onMessageExternal`. The externally reachable actions SHALL be exactly `ping`, `list`, `activities`, `push`, `push-body-composition`, `open-garmin`, `profile-snapshot`, `profile-snapshot-clear`, `schedule`, `unschedule`, `calendar-find` and `set-theme`:

- `ping` — the Session check plus the bridge manifest; it sends Garmin no request and mints no token
- `list` — the workout list from Garmin Connect
- `activities` — the athlete's recent activities (read-only)
- `push` — a GCN workout payload (requires `message.gcn`)
- `push-body-composition` — a FIT body-composition payload (requires `message.fit`)
- `open-garmin` — opens the Garmin Connect dashboard in a new tab
- `profile-snapshot` / `profile-snapshot-clear` — store or drop the SPA's pushed profile snapshot
- `schedule` / `unschedule` / `calendar-find` — place, remove or look up a workout on the Garmin Connect calendar
- `set-theme` — store the app's theme preference for the popup (spec: bridge-core)

All responses SHALL use the shape `{ ok: boolean, protocolVersion?: number, data?: unknown, error?: string }`, and `ping` SHALL include `protocolVersion: 1` (bumped only when the message contract changes).

The `ping` response `data` envelope SHALL contain the full `BridgeManifest` fields (`id: "garmin-bridge"`, `name: "Garmin Connect"`, `version`, `protocolVersion: 1`, `capabilities`) and the calendar `features`, alongside the Session-check fields `session` (`"signed-in"` when the extension holds an OAuth1 token and an OAuth2 token that has not expired, `"not-checked"` otherwise), `authenticated` (`session === "signed-in"`) and `gcApi: { ok }` (the same boolean, for the popup and older Kaiord Apps). The check SHALL make no request: refreshing or minting access would issue a credential, so without valid access the answer is `"not-checked"` and the first real read or send finds out. The envelope SHALL carry no workout, no token and no id. The SPA validates `response.data` against `bridgeManifestSchema`, which strips the Session-check fields so both consumers coexist.

#### Scenario: SPA pings the extension

- **WHEN** the SPA sends `{ action: "ping" }`
- **THEN** the extension returns `{ ok: true, protocolVersion: 1, data: { id: "garmin-bridge", name: "Garmin Connect", version: "<pkg version>", protocolVersion: 1, capabilities: ["write:workouts", "read:activities", "write:body"], features: [...], session: "signed-in", authenticated: true, gcApi: { ok: true } } }`, having sent no request

#### Scenario: The check holds no valid access

- **GIVEN** the extension holds no OAuth2 token that has not expired
- **WHEN** the SPA sends `{ action: "ping" }`
- **THEN** the extension sends no request, stores nothing and answers `session: "not-checked"`, `authenticated: false`, `gcApi: { ok: false }`

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
