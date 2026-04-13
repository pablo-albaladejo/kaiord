## ADDED Requirements

### Requirement: Bridge capability schema extension

The `BridgeCapability` Zod enum in `bridge-schemas.ts` SHALL include `"read:training-plan"` in addition to the existing capabilities.

#### Scenario: New capability is valid

- **WHEN** a bridge manifest includes `capabilities: ["read:training-plan"]`
- **THEN** the `bridgeManifestSchema` validates successfully

#### Scenario: Existing capabilities remain valid

- **WHEN** a bridge manifest includes `capabilities: ["read:workouts", "write:workouts"]`
- **THEN** the `bridgeManifestSchema` validates successfully (no regression)

### Requirement: Train2Go extension detection

The SPA SHALL detect whether the Kaiord Train2Go Bridge extension is installed by sending a `ping` message to the configured extension ID via `chrome.runtime.sendMessage`. Detection SHALL follow the same two-stage timeout pattern as the Garmin bridge: first attempt with 2s timeout, retry once with 4s timeout on service worker cold start.

The extension ID SHALL be configurable via environment variable `VITE_TRAIN2GO_EXTENSION_ID`.

The existing bridge registry (`adapters/bridge/bridge-registry.ts`) SHALL detect both Garmin and Train2Go extensions independently on boot. The `detectBridge` function SHALL be called for each configured extension ID. Both bridges can be active simultaneously.

Detection results SHALL be cached for 30 seconds via `lastDetectionTimestamp`. If less than 30s have elapsed since the last detection and `extensionInstalled` is `true`, skip the ping. The cache is invalidated on any fetch failure with a connection error.

#### Scenario: Train2Go extension is installed and session active

- **WHEN** the SPA sends a ping and receives `{ ok: true, protocolVersion: 1, data: { sessionActive: true, userId: 28035 } }`
- **THEN** the bridge registry registers the Train2Go bridge with capability `"read:training-plan"` and status `"verified"`

#### Scenario: Train2Go extension is installed but session expired

- **WHEN** the SPA sends a ping and receives `{ ok: true, protocolVersion: 1, data: { sessionActive: false } }`
- **THEN** the bridge registry registers the bridge but the SPA shows a "Connect to Train2Go" prompt

#### Scenario: Train2Go extension is not installed

- **WHEN** the SPA sends a ping and `chrome.runtime.lastError` is set or both timeout attempts are exhausted
- **THEN** the Train2Go integration is silently hidden (no error shown — it is optional)

#### Scenario: Both Garmin and Train2Go bridges detected

- **WHEN** the bridge registry detects both extensions via their respective extension IDs
- **THEN** `hasCapability("write:workouts")` returns true (Garmin) and `hasCapability("read:training-plan")` returns true (Train2Go)

#### Scenario: Detection cache hit

- **WHEN** less than 30 seconds have elapsed since last detection and `extensionInstalled` is `true`
- **THEN** the SPA skips the ping and uses cached values

### Requirement: Train2Go state management

The SPA SHALL manage Train2Go state in a Zustand slice (or React state) with:

- `extensionInstalled: boolean`
- `sessionActive: boolean`
- `userId: number | null`
- `userName: string | null`
- `loading: boolean`
- `lastError: string | null`
- `lastDetectionTimestamp: number | null`
- `activities: Train2GoActivity[]` (transient, not persisted)

Train2Go data SHALL NOT be stored in Dexie. It is transient data fetched on user request.

The SPA SHALL store the `userId` returned from the `ping` response and include it in all subsequent `read-week` and `read-day` requests. If `userId` is null (not yet detected), the SPA SHALL run detection before attempting to fetch activities.

#### Scenario: Initial state

- **WHEN** the SPA loads
- **THEN** Train2Go state initializes with `extensionInstalled: false, sessionActive: false, userId: null, activities: []`

#### Scenario: State updated after successful ping

- **WHEN** the Train2Go extension responds with `{ sessionActive: true, userId: 28035, name: "Pablo" }`
- **THEN** the state is set to `extensionInstalled: true, sessionActive: true, userId: 28035, userName: "Pablo"`

### Requirement: Fetch training plan on user action

The SPA SHALL provide a mechanism (button or action) to fetch the current week's training plan from Train2Go. The fetch SHALL:

1. Call `read-week` with the currently viewed week's Monday date and the stored `userId`
2. Store the returned activities in state
3. Optionally call `read-day` for days with activities to get full descriptions (lazy load on expand)

#### Scenario: User fetches current week

- **WHEN** the user clicks "Sync Train2Go" and the session is active
- **THEN** the SPA sends `{ action: "read-week", date: "2026-04-13", userId: 28035 }` and displays the returned activities in the calendar

#### Scenario: User expands an activity to see description

- **WHEN** the user clicks on a Train2Go activity card in the calendar and the description has not been loaded
- **THEN** the SPA sends `{ action: "read-day", date: "2026-04-13", userId: 28035 }` and shows the full description

#### Scenario: User navigates to cached adjacent week

- **WHEN** the user navigates to an adjacent week that is already in the activities cache (from the 3-week API response)
- **THEN** no additional `read-week` call is made and the cached activities are displayed immediately

#### Scenario: Fetch fails due to expired session

- **WHEN** the extension returns `{ ok: false, error: "Session expired" }`
- **THEN** the SPA updates `sessionActive: false` and shows a "Reconnect to Train2Go" prompt

### Requirement: Calendar integration

Train2Go activities SHALL appear in the existing `CalendarWeekGrid` as read-only cards alongside user-created Kaiord workouts.

Train2Go activity cards SHALL display:

- Sport icon (mapped from Train2Go sport identifier)
- Activity title
- Duration
- Workload indicator (1-5 dots or bars)
- Status badge (pending / done / not done)

Train2Go cards SHALL be visually distinguished from Kaiord workouts (different background color or border style, "T2G" label or coach icon).

Train2Go cards SHALL NOT be editable, draggable, or deletable.

Sport icons SHALL be mapped from Train2Go sport identifiers to SPA icon keys via a mapping utility. When a Train2Go sport identifier has no matching icon, the card SHALL display a generic activity icon as fallback.

#### Scenario: Unknown sport shows generic icon

- **WHEN** a Train2Go activity has sport identifier `"canicross"` which has no matching Kaiord icon
- **THEN** the card displays a generic activity icon

#### Scenario: Calendar shows both sources

- **WHEN** the calendar week has 2 Kaiord workouts and 3 Train2Go activities
- **THEN** all 5 items appear in the calendar, with Train2Go items visually distinguished

#### Scenario: Train2Go card expanded

- **WHEN** the user clicks a Train2Go activity card
- **THEN** the card expands to show the full description text (fetched via `read-day` if not already loaded)

#### Scenario: Calendar with no Train2Go data

- **WHEN** the Train2Go extension is not installed or not synced
- **THEN** the calendar shows only Kaiord workouts (no empty Train2Go placeholders)

### Requirement: Session connection flow

When the Train2Go extension is installed but the session is not active, the SPA SHALL display a "Connect to Train2Go" button. Clicking it SHALL send `{ action: "open-train2go" }` to open the Train2Go app, then poll via ping every 2s (up to 5 attempts) until `sessionActive: true`.

#### Scenario: One-click Train2Go connection

- **WHEN** the user clicks "Connect to Train2Go"
- **THEN** the extension opens a Train2Go tab and the SPA polls until the session is active

#### Scenario: Connection polling times out

- **WHEN** the SPA polls 5 times without `sessionActive: true`
- **THEN** the SPA shows guidance: "Open Train2Go, log in, and try again"
