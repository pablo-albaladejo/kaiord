> Synced: 2026-04-28 (train2go-profile-link)

# SPA Train2Go Extension

## Purpose

SPA-side integration with the train2go-bridge extension — runtime discovery via content script announcement and read-only import of coaching plans rendered on Train2Go pages.

## Requirements

### Requirement: Bridge capability schema extension

The `BridgeCapability` Zod enum (in `packages/workout-spa-editor/src/types/bridge-schemas.ts`) SHALL include both `read:training-plan` AND `read:training-zones`. (Both must be valid for `bridgeManifestSchema` to validate manifests advertising either capability.)

#### Scenario: New capability passes manifest validation

- **GIVEN** a bridge ping returns `capabilities: ["read:training-plan", "read:training-zones"]`
- **WHEN** the SPA validates the manifest via `bridgeManifestSchema`
- **THEN** validation SHALL succeed

### Requirement: Train2Go extension detection

The SPA SHALL detect whether the Kaiord Train2Go Bridge extension is installed by listening for `KAIORD_BRIDGE_ANNOUNCE` messages on `window` with `bridgeId: "train2go-bridge"`. Upon receiving an announcement, the SPA SHALL verify the bridge by sending a `ping` message to the announced `extensionId` via `chrome.runtime.sendMessage`. Detection SHALL follow the same two-stage timeout pattern as the Garmin bridge: first attempt with 2s timeout, retry once with 4s timeout on service worker cold start.

The extension ID SHALL be discovered at runtime from the content script announcement. No build-time environment variable is required.

The existing bridge registry (`adapters/bridge/bridge-registry.ts`) SHALL register bridges from content script announcements. Both bridges can be active simultaneously.

Detection results SHALL be cached for 30 seconds via `lastDetectionTimestamp`. If less than 30s have elapsed since the last detection and `extensionInstalled` is `true`, skip the ping. The cache is invalidated on any fetch failure with a connection error.

#### Scenario: Train2Go extension is installed and session active

- **WHEN** the SPA receives a bridge announcement with `bridgeId: "train2go-bridge"` and the verification ping returns `{ ok: true, protocolVersion: 1, data: { sessionActive: true, userId: 28035 } }`
- **THEN** the bridge registry registers the Train2Go bridge with capability `"read:training-plan"` and status `"verified"`

#### Scenario: Train2Go extension is installed but session expired

- **WHEN** the SPA receives a bridge announcement and the verification ping returns `{ ok: true, protocolVersion: 1, data: { sessionActive: false } }`
- **THEN** the bridge registry registers the bridge but the SPA shows a "Connect to Train2Go" prompt

#### Scenario: Train2Go extension is not installed

- **WHEN** no `KAIORD_BRIDGE_ANNOUNCE` with `bridgeId: "train2go-bridge"` is received within the discovery timeout
- **THEN** the Train2Go integration is silently hidden (no error shown — it is optional)

#### Scenario: Both Garmin and Train2Go bridges detected

- **WHEN** the SPA receives announcements from both bridges
- **THEN** `hasCapability("write:workouts")` returns true (Garmin) and `hasCapability("read:training-plan")` returns true (Train2Go)

#### Scenario: Detection cache hit

- **WHEN** less than 30 seconds have elapsed since last detection and `extensionInstalled` is `true`
- **THEN** the SPA skips the ping and uses cached values

### Requirement: Train2Go state management

The SPA SHALL manage Train2Go transport state in a Zustand slice (or React state) with:

- `extensionInstalled: boolean`
- `sessionActive: boolean`
- `loading: boolean`
- `lastError: string | null`
- `lastDetectionTimestamp: number | null`

The Train2Go store SHALL NOT own `userId`, `userName`, or `activities`. Those move out of transient state:

- `userId` and `userName` SHALL be sourced from the active profile's `linkedAccounts` entry where `source === "train2go"`. Use cases that need them SHALL read from the active profile via `ProfileRepository`, not from the Train2Go store. `userId` SHALL be a `string` captured at the JSON parse boundary in the transport adapter (never `String(parsedNumber)` after the fact).
- `activities` SHALL be persisted via the `CoachingRepository` (see `spa-coaching-integration`) and read via `useLiveQuery`.

If the active profile has no `train2go` linked account, fetch use cases SHALL run the connect flow before retrying.

`detectExtension` (called on app boot, heartbeat, and visibility change) MUST NOT mutate `linkedAccounts`. It SHALL only update `extensionInstalled`, `sessionActive`, `lastError`, and `lastDetectionTimestamp`. Capturing `userId`/`userName` from a `ping` response is restricted to the explicit connect flow.

Detection results SHALL continue to be cached for 30 seconds via `lastDetectionTimestamp` (existing behavior preserved).

#### Scenario: Initial state

- **WHEN** the SPA loads
- **THEN** Train2Go transport state initializes with `extensionInstalled: false, sessionActive: false, loading: false, lastError: null, lastDetectionTimestamp: null`

#### Scenario: State updated after successful ping (outside connect flow)

- **WHEN** the Train2Go extension responds with `{ sessionActive: true, userId: 28035, name: "Pablo" }` and no connect flow is in progress
- **THEN** the store sets `extensionInstalled: true, sessionActive: true`. The `userId` and `userName` from the ping payload are NOT written to any profile, store, or persistence layer.

#### Scenario: Heartbeat detection does not auto-link

- **WHEN** a profile previously had a Train2Go account linked, the user disconnected it, and a periodic `detectExtension` fires while the Train2Go session is still active
- **THEN** detection updates `extensionInstalled`/`sessionActive` only; the active profile's `linkedAccounts` remains empty (no silent re-link)

#### Scenario: Store no longer holds activities

- **WHEN** a `read-week` or `read-day` succeeds
- **THEN** the parsed activities are upserted into `coachingActivities` via `CoachingRepository`, never stored on the Train2Go store

#### Scenario: Lossless userId capture

- **WHEN** the platform returns a numeric `userId` greater than `Number.MAX_SAFE_INTEGER` in JSON
- **THEN** the transport adapter parses it as a string at the JSON parse boundary so its value is preserved byte-identically through `linkedAccounts[].externalUserId`

### Requirement: Fetch training plan on user action

The SPA SHALL provide a mechanism (the calendar header "Sync <Label>" button and an auto-sync trigger from `spa-coaching-integration`) to fetch the current week's training plan from Train2Go. The fetch SHALL:

1. Resolve the `userId` from the active profile's `linkedAccounts` (source `"train2go"`). If absent, route the user to the connect flow in Profile Settings instead of attempting the fetch.
2. Call `read-week` with the currently viewed week's Monday date and the resolved `userId`.
3. Map each parsed activity to a `CoachingActivityRecord` with `profileId` set to the active profile's id and `fetchedAt` set to the current ISO timestamp.
4. Upsert the records via `CoachingRepository.upsertMany`.
5. Update the `coachingSyncState` row for `(source, profileId)` with `lastSyncedAt` (unconditionally on success — see `spa-coaching-integration` `SyncWeek orphan cleanup within window`).

The SPA SHALL also call `read-day` lazily when the user opens a `CoachingActivityDialog` whose description is **`undefined`** (i.e., not yet fetched). A persisted `description: ""` (genuinely empty after a `read-day` round-trip) SHALL NOT trigger another `read-day` — the lazy-load trigger is `description === undefined`, not falsiness.

The `read-day` response typically contains every activity for that day, not only the clicked one. The SPA SHALL upsert ALL activities returned by `read-day` via `CoachingRepository.upsertMany` so that sibling activities on the same day also gain their descriptions in the same transaction (preserves existing behavior in `train2go-store-actions.ts:60-72`).

#### Scenario: User fetches current week

- **WHEN** the user clicks "Sync Train2Go" and the active profile is linked to Train2Go account 28035
- **THEN** the SPA sends `{ action: "read-week", date: "2026-04-13", userId: "28035" }`, upserts the returned activities scoped to the active profile, and updates `lastSyncedAt`

#### Scenario: User expands an activity to see description

- **WHEN** the user opens a `CoachingActivityDialog` for an activity whose `description` is `undefined` (not yet fetched)
- **THEN** the SPA sends `{ action: "read-day", date: activity.date, userId: linked.externalUserId }`, upserts every activity returned (including siblings on the same day) via `CoachingRepository.upsertMany`, and the dialog re-renders with the description for the clicked activity

#### Scenario: Expand fills sibling descriptions in the same transaction

- **WHEN** the day response contains the clicked activity X and a sibling Y on the same date, both with descriptions
- **THEN** both X and Y receive their persisted `description`; subsequent clicks on Y open the dialog without firing another `read-day`

#### Scenario: Lazy-load skipped for known-empty description

- **WHEN** the user opens a `CoachingActivityDialog` for an activity whose `description` is `""` (already round-tripped through `read-day` once and confirmed empty)
- **THEN** the SPA does NOT fire another `read-day`; the dialog opens with no description block

#### Scenario: User navigates to cached adjacent week

- **WHEN** the user navigates to an adjacent week and that week's activities are already persisted with `lastSyncedAt < 10 minutes`
- **THEN** no `read-week` call is made; the persisted activities render immediately

#### Scenario: Fetch fails due to expired session

- **WHEN** the extension returns `{ ok: false, error: "Session expired" }`
- **THEN** the SPA updates `sessionActive: false` and shows a "Reconnect to Train2Go" prompt routing to Profile Settings → Linked Accounts

#### Scenario: Fetch fails due to no linked profile (defensive)

- **WHEN** Sync is invoked but the active profile has no `train2go` linked account (e.g., a defensive/programmatic call or a UI desync — under normal use the Sync button is gated by the coaching integration spec and does not appear)
- **THEN** the SPA does not send any extension message and instead surfaces a hint pointing to Profile Settings → Linked Accounts

### Requirement: Calendar integration

Train2Go activities SHALL appear in the existing `CalendarWeekGrid` as cards alongside user-created Kaiord workouts. The activities SHALL be read from the persisted `CoachingRepository` scoped to the active profile, not from transient store state.

Train2Go activity cards SHALL display:

- Sport icon (mapped from Train2Go sport identifier)
- Activity title
- Duration
- Workload indicator (1-5 dots or bars, derived from the persisted `intensity` field — the raw `workload` value is also persisted but not displayed on the card)
- Status badge (pending / done / not done)

Train2Go cards SHALL be visually distinguished from Kaiord workouts (different background color or border style, "T2G" label or coach icon).

Train2Go cards SHALL NOT be directly editable, draggable, or deletable on the calendar. They SHALL open a `CoachingActivityDialog` on click (not an in-place description toggle), where the user can read the full description and trigger "Convert to workout" — see `spa-coaching-integration`.

Sport icons SHALL be mapped from Train2Go sport identifiers to SPA icon keys via a mapping utility. When a Train2Go sport identifier has no matching icon, the card SHALL display a generic activity icon as fallback.

#### Scenario: Unknown sport shows generic icon

- **WHEN** a Train2Go activity has sport identifier `"canicross"` which has no matching Kaiord icon
- **THEN** the card displays a generic activity icon

#### Scenario: Calendar shows both sources

- **WHEN** the calendar week has 2 Kaiord workouts and 3 Train2Go activities for the active profile
- **THEN** all 5 items appear in the calendar, with Train2Go items visually distinguished

#### Scenario: Train2Go card click opens dialog

- **WHEN** the user clicks a Train2Go activity card
- **THEN** the SPA opens `CoachingActivityDialog` (no in-place description toggle)

#### Scenario: Calendar with no Train2Go data

- **WHEN** the active profile has no linked Train2Go account or has never synced
- **THEN** the calendar shows only Kaiord workouts (no empty Train2Go placeholders)

### Requirement: Session connection flow

The connect flow for Train2Go SHALL live in **Profile Settings → Linked Accounts** (a new UI surface), not on the calendar.

When a profile has no `train2go` linked account, the Linked Accounts panel SHALL show a "Connect Train2Go" button. Clicking it SHALL invoke the application-layer use case `attemptLink(targetProfileId, signal)`. The handler SHALL:

1. Capture `targetProfileId = activeProfileId` synchronously at click time.
2. Create an `AbortController` and pass its signal to `attemptLink(targetProfileId, signal)`.
3. Send `{ action: "open-train2go" }` to open the Train2Go app.
4. Poll via `ping` every 2s (up to 5 attempts) until `sessionActive: true`. Each poll iteration SHALL check `signal.aborted` and abort cleanly if set.
5. Once `sessionActive: true`, capture `userId` (as a string from the JSON parse boundary) and `userName` from the ping response.
6. Call `linkAccount(targetProfileId, { source: "train2go", externalUserId, externalUserName, linkedAt: now })`. The use case takes `targetProfileId` as an explicit argument; it MUST NOT resolve the profile via `getActiveId()` at write time. If `getById(targetProfileId)` returns `undefined` (profile deleted between click and poll completion), the use case throws `ProfileNotFoundError`; the caller surfaces a toast "Profile no longer exists; not linked." and writes nothing.

If the active profile changes during the poll, the link still completes against `targetProfileId` (the user's intent at click time wins) and a small toast surfaces "Linked Train2Go to <targetProfileName>" so the user is not surprised.

The poll SHALL be aborted (and no link written) when:

- The Linked Accounts panel/section unmounts (user navigates away from Profile Settings).
- The user clicks "Disconnect" on the same source while the poll is in flight (concurrent intent reversal).
- The user explicitly cancels the connect flow.

On abort, no toast is shown and `lastError` is not set — abort is a silent, intentional state.

The calendar SHALL NOT host a Connect button. If the active profile has no linked accounts and the user attempts a sync, the calendar SHALL surface a hint pointing to Profile Settings.

#### Scenario: One-click Train2Go connection

- **WHEN** the user clicks "Connect Train2Go" inside Profile Settings
- **THEN** the extension opens a Train2Go tab, the SPA polls until the session is active, and the active profile gains a `train2go` entry in `linkedAccounts`

#### Scenario: Connection polling times out

- **WHEN** the SPA polls 5 times without `sessionActive: true`
- **THEN** the SPA shows guidance inside the panel: "Open Train2Go, log in, and try again"

#### Scenario: Profile switch mid-poll preserves intent

- **WHEN** the user clicks "Connect Train2Go" while Profile A is active, then switches to Profile B before polling completes successfully
- **THEN** the link is written to Profile A (the captured `targetProfileId`), Profile B's `linkedAccounts` is untouched, and a toast surfaces "Linked Train2Go to <Profile A name>"

#### Scenario: Connect aborted by leaving Profile Settings

- **WHEN** the user clicks "Connect Train2Go" and then navigates away from Profile Settings (closing the section/panel) before polling succeeds
- **THEN** the `AbortSignal` fires, polling stops, no `linkAccount` is invoked, no toast is shown, and `lastError` remains unchanged

#### Scenario: Connect aborted by concurrent disconnect

- **WHEN** a connect poll is in flight for source `train2go` and the user clicks "Disconnect" on the same source
- **THEN** the poll is aborted, no `linkAccount` is written, and the disconnect proceeds (the user's most recent intent wins)

#### Scenario: Connect on deleted profile fails cleanly

- **WHEN** Profile A is the connect target, Profile A is deleted in another tab during the poll, and the poll then succeeds
- **THEN** `linkAccount(A, ...)` throws `ProfileNotFoundError`; a single toast surfaces "Profile no longer exists; not linked"; no `linkedAccounts` row exists anywhere

#### Scenario: Disconnect from profile settings

- **WHEN** the user clicks "Disconnect" on a linked account in Profile Settings
- **THEN** the entry is removed from `linkedAccounts`. Persisted `coachingActivities` rows for that profile remain on disk (they are coach-owned data, retained until explicit profile deletion).

#### Scenario: Disconnect retains historical coaching activities

- **WHEN** Profile P had a `train2go` link with N persisted activities, the user clicks Disconnect, and then re-renders the calendar
- **THEN** the N activities continue to appear (read from `coachingActivities`); only profile deletion fully purges them. A user wanting full purge must delete the profile.

### Requirement: Train2Go status in Settings panel

The Extensions tab in the Settings panel SHALL display the Train2Go bridge status alongside the Garmin bridge. The status row SHALL show a colored dot indicator (green = connected, yellow = session inactive, gray = not detected) and a hint message when not connected. A "Refresh Status" button SHALL trigger re-detection of all bridges.

#### Scenario: Train2Go not installed

- **WHEN** the user opens the Extensions tab and the Train2Go extension is not installed
- **THEN** the Train2Go row shows a gray dot with "Not detected" status

#### Scenario: Train2Go installed but no session

- **WHEN** the user opens the Extensions tab and the Train2Go extension is installed but session is not active
- **THEN** the Train2Go row shows a yellow dot with "Session inactive" status and hint "Open Train2Go and log in"

#### Scenario: Train2Go connected

- **WHEN** the user opens the Extensions tab and the Train2Go extension is installed with an active session
- **THEN** the Train2Go row shows a green dot with "Connected" status

#### Scenario: Refresh button re-detects all bridges

- **WHEN** the user clicks the "Refresh Status" button
- **THEN** the SPA re-runs detection for both Garmin and Train2Go bridges and updates the status table

### Requirement: Platform-inclusive copy in empty states

The calendar empty states SHALL use platform-inclusive copy that references multiple bridge platforms, not just Garmin. This ensures users are aware of all integration options. Connect CTAs in empty states SHALL route to **Profile Settings → Linked Accounts**, never to a calendar-local connect action.

#### Scenario: FirstVisitState mentions multiple platforms

- **WHEN** the calendar shows the first-visit onboarding state
- **THEN** the "Connect" entry path description SHALL say "Link Garmin Connect, Train2Go, or other platforms"

#### Scenario: NoBridgesState mentions multiple platforms

- **WHEN** the calendar shows the no-bridges-detected banner
- **THEN** the banner SHALL say "Install a bridge extension (e.g., Garmin Connect, Train2Go) to sync workouts."

#### Scenario: Connect CTA routes to Profile Settings

- **WHEN** the user clicks the "Connect" button on `FirstVisitState` or `NoBridgesState`
- **THEN** the SPA navigates to Profile Settings → Linked Accounts (NOT to a calendar-local connect action or modal)

### Requirement: `CoachingTransport` exposes an optional `readZones` capability

The `CoachingTransport` port SHALL gain an optional method `readZones?: (externalUserId: string, signal?: AbortSignal) => Promise<ZonesPayload | null>`. The Train2Go transport adapter SHALL implement it; other adapters (Garmin) SHALL leave it unimplemented or return `null`. Application use cases that consume zones SHALL check for the method's presence before calling and SHALL gracefully degrade when absent (`{ ok: false, reason: "unsupported" }`).

#### Scenario: Train2Go transport implements readZones

- **GIVEN** a `Train2GoCoachingTransport` instance
- **WHEN** `transport.readZones` is checked
- **THEN** it SHALL be a function

#### Scenario: Garmin transport does not implement readZones

- **GIVEN** a `GarminCoachingTransport` instance (if/when one exists)
- **WHEN** the application's `syncZones` use case is called with that transport
- **THEN** the use case SHALL short-circuit with `{ ok: false, reason: "unsupported" }`
- **AND** SHALL NOT throw

### Requirement: `readZones` goes through the existing OperationQueue

The Train2Go transport's `readZones` implementation SHALL go through the existing `OperationQueue` from the bridge adapter package (`packages/workout-spa-editor/src/adapters/bridge/operation-queue.ts`), the same module used by `useProfileSnapshotPush`. Pre-existing `readWeek` / `readDay` calls bypass this queue today (separate spec drift not in this change's scope); `readZones` SHALL be the second consumer of the queue and SHALL respect the 60-ops-per-bridge-per-hour cap from the spa-bridge-protocol spec.

#### Scenario: 60th op succeeds

- **GIVEN** a bridge that has already executed 59 ops via the OperationQueue within the past hour
- **WHEN** the SPA invokes `readZones`
- **THEN** the call SHALL succeed (60th op, still within cap)

#### Scenario: 61st op is queued behind the cap

- **GIVEN** a bridge that has already executed 60 ops via the OperationQueue within the past hour
- **WHEN** the SPA invokes `readZones` (a 61st op)
- **THEN** the call SHALL be queued by `OperationQueue.enqueue` and SHALL NOT execute until the per-hour window slides forward enough to free a slot

#### Scenario: any future queue consumer shares the same per-bridge counter

- **GIVEN** a bridge that has already executed 59 ops via the OperationQueue within the past hour (across all queue consumers — today only `useProfileSnapshotPush` and the new `readZones`)
- **WHEN** the SPA invokes `readZones`
- **THEN** the call SHALL succeed (60th op, still within cap)
- **AND** any 61st op routed through the queue (regardless of action kind) within the same hour SHALL be queued behind the cap. (Note: pre-existing `readWeek` / `readDay` calls bypass the queue today and therefore do NOT count toward this cap; bringing them onto the queue is tracked outside this change.)

### Requirement: `LinkedAccountRow` exposes the `Sync zones` toggle

The Profile Manager → Linked Accounts row for Train2Go SHALL include a checkbox or switch labelled `Sync zones from Train2Go`. The control SHALL be enabled only while the row is in the `linked` state. Toggling the control SHALL persist the new value to `profile.linkedAccounts[i].syncZones` via the existing persistence port. Toggling SHALL NOT trigger a sync by itself; the next link/sync action picks up the new value.

#### Scenario: Toggle is hidden for unlinked rows

- **GIVEN** the user has not yet linked Train2Go
- **WHEN** the user opens Profile Manager → Linked Accounts
- **THEN** the row's primary control SHALL be the existing `Connect Train2Go` button
- **AND** no `Sync zones` toggle SHALL be visible

#### Scenario: Toggling the switch persists immediately

- **GIVEN** a linked Train2Go account with `syncZones: false`
- **WHEN** the user clicks the `Sync zones` switch on
- **THEN** the persisted profile SHALL be updated with `linkedAccounts[i].syncZones: true`
- **AND** no zones-fetch network call SHALL fire as a side effect

### Requirement: Conflict dialog renders T2G strings safely

The `ZonesConflictDialog` component MUST NOT use `dangerouslySetInnerHTML`. Field labels SHALL be derived from a static SPA-side label map keyed by `FieldKey` (e.g., `{ "cycling.thresholds.ftp": "FTP" }`), NEVER from T2G strings. Numeric values SHALL be rendered as React children (text content), so React's default escaping applies. This prevents any XSS vector through T2G-controlled content even if upstream HTML changes.

#### Scenario: Dialog renders FTP without HTML escape

- **GIVEN** T2G returns `cycling.ftp = 270`
- **WHEN** the conflict dialog opens
- **THEN** the row label SHALL be `"FTP"` from the constant map (not from T2G)
- **AND** the value cell SHALL render `270` as text via React children

### Requirement: Train2Go connect callback fans out into a zones sync when toggle is on

`useConnectCallback` (in `adapters/train2go/use-train2go-actions.ts`) SHALL, after `attemptLink` resolves with `{ ok: true }`, check the just-persisted `linkedAccounts[i].syncZones` flag. If `true`, it SHALL call the application's `syncZones(profileId, transport)` use case. The connect promise SHALL still resolve to the link's outcome regardless of the zones-sync result; zones-sync errors SHALL surface as toasts/analytics, not as a thrown exception.

#### Scenario: Link succeeds with toggle on — sync fires

- **GIVEN** the user enables `Sync zones` and runs connect
- **WHEN** `attemptLink` resolves with `{ ok: true }`
- **THEN** the SPA SHALL call `syncZones(profileId, transport)` exactly once
- **AND** the connect callback SHALL resolve to the link result without rethrowing zones errors

#### Scenario: Link succeeds with toggle off — no sync

- **GIVEN** a fresh link with `syncZones: false`
- **WHEN** `attemptLink` resolves with `{ ok: true }`
- **THEN** the SPA SHALL NOT call `syncZones`

### Requirement: Train2Go sync callback fans out into a zones sync after the weekly read

`useSyncCallback` SHALL invoke the existing `weeklyRead` flow first; on its success AND when `linkedAccounts[i].syncZones` is `true`, the callback SHALL invoke `syncZones(profileId, transport)` once before resolving. A failure of the weekly read SHALL skip the zones sync (avoid stacking errors). A failure of zones-sync after a successful weekly read SHALL NOT mark the calendar sync as failed.

#### Scenario: Weekly read succeeds, zones sync fires

- **GIVEN** a linked account with `syncZones: true`
- **WHEN** the user clicks the calendar header sync button
- **THEN** the SPA SHALL execute the weekly read first
- **AND** then call `syncZones(profileId, transport)` once
- **AND** mark the calendar sync as succeeded regardless of the zones-sync outcome

#### Scenario: Weekly read fails — zones sync is skipped

- **GIVEN** a linked account with `syncZones: true`
- **WHEN** the weekly read returns an error
- **THEN** zones-sync SHALL NOT be invoked
- **AND** the user SHALL see the existing calendar-sync error UX

### Requirement: `bodyWeight` and `heartRate.max` are populated from the `/user/details` physiological block, not the ping payload

When zones-sync runs (toggle is on, link/sync trigger fired), the use case SHALL extract `bodyWeight` and `heartRate.max` from the `physiological` block of the parsed `/user/details` response. The `/profile/ping` payload's `data.user.weight` and `data.user.bpm_max` are NOT consulted by zones-sync — they remain an independent source used by the heartbeat / Profile Manager status display only. The parsed `physiological.bpmRest` field is now allowlisted by the bridge parser and flows through the SPA `ZonesPayload` Zod type, but it is NOT persisted to the profile by `syncZones` in this change — Kaiord has no consumer field for resting HR yet, and the data is allowlisted to enable a future Karvonen-derivation path without a second privacy-surface review.

#### Scenario: /user/details physiological block populates bodyWeight and heartRate.max

- **GIVEN** the parsed `/user/details` HTML returns `physiological: { weight: 83, bpmMax: 187 }`
- **AND** the user's profile has both fields empty
- **WHEN** zones-sync runs
- **THEN** the persisted profile SHALL be updated with `bodyWeight: 83` and `heartRate.max: 187`

#### Scenario: zones-sync ignores the ping payload's weight and bpm_max

- **GIVEN** the most recent `/profile/ping` payload had `data.user.weight = 90` and `data.user.bpm_max = 200`
- **AND** the parsed `/user/details` HTML returns `physiological: { weight: 83, bpmMax: 187 }`
- **WHEN** zones-sync runs
- **THEN** the persisted profile SHALL be updated with `bodyWeight: 83` and `heartRate.max: 187` (from `/user/details`)
- **AND** the ping payload values SHALL NOT be consulted by zones-sync

#### Scenario: bpmRest flows through the payload but is not persisted

- **GIVEN** the parsed `/user/details` HTML returns `physiological: { weight: 83, bpmMax: 187, bpmRest: 51 }`
- **WHEN** `syncZones` runs against an empty profile
- **THEN** the persisted profile's `bodyWeight`, `heartRate.max` SHALL be updated as before
- **AND** the profile SHALL NOT gain a `restingHeartRate` field as a result of this sync (Kaiord has no consumer in v1)

### Requirement: `ZonesPayload` carries full Z1-Z5 bands per block

The `ZonesPayload` Zod type emitted by the bridge and consumed by `syncZones` SHALL include, for each present block, the full Z1-Z5 bands shaped as `{ lower, upper }` (HR + cycling power) or `{ lower: { min, sec }, upper: { min, sec } }` (running + swimming pace). The threshold-scalar convenience fields (`z4Upper`, `z5Lower`) SHALL coexist with the band fields so existing FieldKey-level writes for `cycling.thresholds.ftp`, `cycling.thresholds.lthr`, `running.thresholds.lthr`, `running.thresholds.thresholdPaceSecPerKm`, `swimming.thresholds.cssPaceSecPer100m`, `bodyWeight`, and `heartRate.max` keep working byte-identically.

#### Scenario: Backwards compat — z4Upper consumers still work

- **GIVEN** a payload with the new full-band shape: `payload.hrZones.cycling.z4 = { lower: 161, upper: 174 }`
- **AND** the convenience field `payload.hrZones.cycling.z4Upper = 174` (parser-derived from `z4.upper`)
- **WHEN** the SPA mapper computes the cycling LTHR threshold
- **THEN** `incoming.cycling.thresholds.lthr` SHALL equal `174` (existing FieldKey write path is unchanged)

#### Scenario: Older-bridge backwards compat — payload with z4Upper only (no z1..z5 bands)

- **GIVEN** a payload from an older bridge that has not yet rolled out the full-band parser (PR 1 not yet installed in the user's browser): `payload.hrZones.cycling = { z4Upper: 174 }` — no `z1..z5` keys present
- **AND** the user has the new SPA build (PR 2 already deployed, ahead of the bridge update)
- **WHEN** `syncZones` runs against an empty profile
- **THEN** the threshold scalar `cycling.thresholds.lthr` SHALL be silently filled with `174` (the threshold-scalar write path is unchanged)
- **AND** `sportZones.cycling.heartRateZones.zones` SHALL NOT be touched (the band-level write path is skipped because `payload.hrZones.cycling.z1..z5` is absent)
- **AND** no error or warning SHALL surface to the user — the SPA tolerates the older-bridge payload shape gracefully (PR 2 is forward-compatible with the shipped bridge build per the migration plan in design.md)

### Requirement: HR fallback chain — Specific over Generic, Generic over skip

For each sport `s ∈ { cycling, running, swimming }`, the SPA-side `syncZones` use case SHALL select the HR-band source for that sport in this order:

1. `payload.hrZones.<s>` (Specific block) — used when present.
2. `payload.hrZones.generic` (Generic Karvonen-derived block) — used as fallback when the Specific block is absent.
3. _skip_ — neither block present; the sport's `heartRateZones.zones` SHALL NOT be touched by `syncZones`.

#### Scenario: Triathlete with cycling-specific only — running and swimming fall back to Generic

- **GIVEN** the parsed payload has `payload.hrZones.cycling` (Specific) AND `payload.hrZones.generic` (Generic)
- **AND** `payload.hrZones.running` and `payload.hrZones.swimming` are both absent
- **WHEN** `syncZones` runs against an empty profile
- **THEN** the cycling profile zones SHALL be written from `payload.hrZones.cycling`
- **AND** the running profile zones SHALL be written from `payload.hrZones.generic`
- **AND** the swimming profile zones SHALL be written from `payload.hrZones.generic`

#### Scenario: Generic absent, no Specific — sport's HR zones are not touched

- **GIVEN** `payload.hrZones.generic` is absent (the upstream user has no maxHR or bpm_rest configured)
- **AND** no `payload.hrZones.<sport>` Specific block is present either
- **WHEN** `syncZones` runs
- **THEN** the profile's `sportZones.<sport>.heartRateZones.zones` SHALL remain at whatever value it held before the sync
- **AND** no conflict row SHALL be emitted for that sport's HR bands

#### Scenario: All sports have Specific blocks — Generic is unused

- **GIVEN** the parsed payload has all four HR blocks present: `payload.hrZones.cycling` (Specific), `payload.hrZones.running` (Specific), `payload.hrZones.swimming` (Specific), AND `payload.hrZones.generic` (Karvonen-derived)
- **AND** the user's profile has `sportZones.{cycling,running,swimming}.heartRateZones.zones = []` (all empty)
- **WHEN** `syncZones` runs
- **THEN** the cycling profile zones SHALL be written from `payload.hrZones.cycling` (Specific wins per fallback rule 1)
- **AND** the running profile zones SHALL be written from `payload.hrZones.running`
- **AND** the swimming profile zones SHALL be written from `payload.hrZones.swimming`
- **AND** `payload.hrZones.generic` SHALL NOT be consulted for any sport (Specific wins for all three; Generic is only the fallback when Specific is absent)

### Requirement: `LinkedCoachingAccount` schema includes the snapshot field

The `linkedCoachingAccountSchema` Zod type SHALL include an optional `lastSyncedZonesSnapshot` field whose shape captures the post-mapper Kaiord-domain zones + threshold scalars from the most recent successful T2G sync. The field is optional — accounts not yet sync'd or freshly-linked accounts have it absent.

```ts
const lastSyncedZonesSnapshotSchema = z.object({
  syncedAt: z.iso.datetime(),
  cyclingHr: z.array(heartRateZoneSchema).length(5),
  runningHr: z.array(heartRateZoneSchema).length(5),
  swimmingHr: z.array(heartRateZoneSchema).length(5),
  cyclingPower: z.array(powerZoneSchema).length(5),
  runningPace: z.array(paceZoneSchema).length(5),
  swimmingPace: z.array(paceZoneSchema).length(5),
  bodyWeight: z.number().positive().optional(),
  maxHeartRate: z.number().int().positive().max(250).optional(),
  cyclingFtp: z.number().int().positive().optional(),
  cyclingLthr: z.number().int().positive().max(250).optional(),
  runningLthr: z.number().int().positive().max(250).optional(),
  runningThresholdPace: z.number().positive().optional(),
  swimmingCss: z.number().positive().optional(),
});

const linkedCoachingAccountSchema = z.object({
  source: z.enum(["train2go"]),
  externalUserId: z.string().min(1),
  externalUserName: z.string(),
  linkedAt: z.iso.datetime(),
  syncZones: z.boolean(),
  lastSyncedZonesSnapshot: lastSyncedZonesSnapshotSchema.optional(),
});
```

The Dexie schema SHALL bump to v9 with an `applyV9Upgrade` helper (mirrors the v8 pattern from the AI provider order migration) that:

1. Normalizes `method = "manual"` (introduced by the prior `train2go-zones-sync-full-bands` change in `sync-zones-band-writes.ts`) to `method = "custom"` for every sport-kind table on every existing profile. This re-aligns vocabulary with the existing `"custom"` semantic.
2. Conservatively reclassifies `method = "custom"` AND zones-clearly-not-defaults to `method = "user"` per the migration heuristic in design D-MA7. False-negatives produce conflicts on next sync (handled by the new dialog gracefully); false-positives produce conflicts forever (avoided).
3. Leaves `lastSyncedZonesSnapshot` absent on every migrated profile — next sync establishes the baseline.

#### Scenario: v9 migration preserves a freshly-created profile (no method changes)

- **GIVEN** a profile created by the current `createNewProfile(...)` factory (HR `"custom"` + all-zero, power `"coggan-7"` + Coggan defaults, running/swimming pace `"custom"` + empty)
- **WHEN** the Dexie v9 upgrade runs
- **THEN** every sport-kind config's `method` SHALL be unchanged (no `"manual"` to normalize, no clearly-edited zones to flip to `"user"`)
- **AND** no `lastSyncedZonesSnapshot` SHALL be added

#### Scenario: v9 migration normalizes `"manual"` to `"custom"` on profiles that ran the prior shipped sync

- **GIVEN** a profile that ran the shipped `train2go-zones-sync-full-bands` sync, producing `cycling.heartRateZones.method = "manual"` (created by `sync-zones-band-writes.ts` when the sport config was newly seeded)
- **WHEN** the v9 upgrade runs
- **THEN** the profile's `cycling.heartRateZones.method` SHALL equal `"custom"` (post-migration; the `"manual"` value is removed from the codebase's vocabulary)

#### Scenario: v9 migration flips `"custom"` to `"user"` for clearly-edited HR tables

- **GIVEN** a profile with `running.heartRateZones = { method: "custom", zones: [{Z1: 100-130}, {Z2: 131-145}, {Z3: 146-160}, {Z4: 161-170}, {Z5: 171-187}] }` (clearly NOT the all-zero default seed)
- **WHEN** the v9 upgrade runs
- **THEN** the profile's `running.heartRateZones.method` SHALL equal `"user"` (the migration's `hasUserData` heuristic detects the non-default content)

#### Scenario: v9 migration leaves seeded `"custom"` HR tables unchanged

- **GIVEN** a profile with `cycling.heartRateZones = { method: "custom", zones: [{Z1: 0-0}, ..., {Z5: 0-0}] }` (the canonical all-zero seed from `DEFAULT_HEART_RATE_ZONES`)
- **WHEN** the v9 upgrade runs
- **THEN** the profile's `cycling.heartRateZones.method` SHALL stay `"custom"` (no clear user-customization signal; the table is treated as default-template by the post-migration classifier)

#### Scenario: v9 migration is a no-op for tables already at `method = "user"`

- **GIVEN** a profile with `running.heartRateZones = { method: "user", zones: [...customized] }` (e.g., from running the migration twice or from a future direct write)
- **WHEN** the v9 upgrade runs
- **THEN** the profile's `running.heartRateZones.method` SHALL stay `"user"` (idempotent — no second-run reclassification, no value rewrite)
- **AND** the zones content SHALL stay byte-identical

#### Scenario: v9 migration applies uniformly to the `generic` sport

- **GIVEN** a profile with `generic.heartRateZones = { method: "custom", zones: [{Z1: 100-130}, {Z2: 131-145}, {Z3: 146-160}, {Z4: 161-170}, {Z5: 171-187}] }` (clearly user-edited, NOT the all-zero seed)
- **WHEN** the v9 upgrade runs
- **THEN** the profile's `generic.heartRateZones.method` SHALL flip to `"user"` (same heuristic as the cycling/running/swimming sports — no special case for `generic`)

#### Scenario: Snapshot persistence is atomic with the zone writes

- **GIVEN** a sync that produces silent-fills for cycling HR + cycling power tables
- **WHEN** `syncZones` writes the persisted profile in a Dexie transaction
- **THEN** the linked-account record's `lastSyncedZonesSnapshot` SHALL be updated in the SAME transaction as the zone-array writes
- **AND** if any error occurs mid-write, BOTH the zone arrays AND the snapshot SHALL roll back to their pre-call values (no intermediate state where snapshot updates while zones don't, or vice versa)

#### Scenario: Unlinking a coaching account removes its snapshot atomically

- **GIVEN** a profile with `linkedAccounts[0]` populated with `{ source: "train2go", lastSyncedZonesSnapshot: {...full snapshot...} }`
- **WHEN** the user invokes `unlinkCoachingAccount` for that source
- **THEN** the entire `linkedAccounts[0]` entry SHALL be removed from the array (existing behavior)
- **AND** the corresponding `lastSyncedZonesSnapshot` SHALL be removed atomically with the account (no orphan snapshot data persists)
- **AND** if the user re-links the same external account later (same `externalUserId`), the new linked-account record SHALL start with `lastSyncedZonesSnapshot` absent (next sync establishes a fresh baseline; no stale snapshot is preserved across re-links)
