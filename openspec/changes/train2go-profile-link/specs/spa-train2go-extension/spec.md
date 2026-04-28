## MODIFIED Requirements

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
- **THEN** the store sets `extensionInstalled: true, sessionActive: true`. The `userId` and `userName` from the ping payload are NOT written to any profile, store, or persistence layer. (This MODIFIES the prior behavior, which wrote `userId`/`userName` directly into the Train2Go store on every ping.)

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

- **WHEN** the user opens a `CoachingActivityDialog` for an activity whose description is empty
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

#### Scenario: Fetch fails due to no linked profile

- **WHEN** the user clicks Sync but the active profile has no `train2go` linked account
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

## REMOVED Requirements

### Requirement: Train2Go data SHALL NOT be stored in Dexie

**Reason**: Persisted coaching activities are now required to survive reloads, support multi-week navigation, and be scoped per Kaiord profile. The "transient, not persisted" rule was incompatible with these goals.

**Migration**: Coaching activities are persisted via the new `CoachingRepository` in the `coachingActivities` Dexie table (see `spa-persistence-port` and `spa-coaching-integration`). The Train2Go store retains only transport-level state (`extensionInstalled`, `sessionActive`, `loading`, `lastError`, `lastDetectionTimestamp`). Existing users have no transient activities to migrate — they re-sync once and the activities persist from then on.
