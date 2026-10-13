## MODIFIED Requirements

### Requirement: Fetch training plan on user action

The SPA SHALL provide a mechanism (the calendar header "Sync <Label>" button and an auto-sync trigger from `spa-coaching-integration`) to fetch the current week's training plan from Train2Go. The fetch SHALL:

1. Resolve the `userId` from the active profile's `linkedAccounts` (source `"train2go"`). If absent, route the user to the connect flow on the Connections page instead of attempting the fetch.
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
- **THEN** the SPA updates `sessionActive: false` and shows a "Reconnect to Train2Go" prompt routing to the Connections page

#### Scenario: Fetch fails due to no linked profile (defensive)

- **WHEN** Sync is invoked but the active profile has no `train2go` linked account (e.g., a defensive/programmatic call or a UI desync — under normal use the Sync button is gated by the coaching integration spec and does not appear)
- **THEN** the SPA does not send any extension message and instead surfaces a hint pointing to the Connections page

### Requirement: Session connection flow

The connect flow for Train2Go SHALL live on the **Train2Go card of the Connections page** (`/connections`, see `spa-connections-page`), not on the calendar. The profile manager SHALL NOT carry a Linked Accounts surface.

When a profile has no `train2go` linked account and the extension is present, the Train2Go card SHALL offer to link it. Clicking it SHALL invoke the application-layer use case `attemptLink(targetProfileId, signal)`. The handler SHALL:

1. Capture `targetProfileId = activeProfileId` synchronously at click time.
2. Create an `AbortController` and pass its signal to `attemptLink(targetProfileId, signal)`.
3. Send `{ action: "open-train2go" }` to open the Train2Go app.
4. Poll via `ping` every 2s (up to 5 attempts) until `sessionActive: true`. Each poll iteration SHALL check `signal.aborted` and abort cleanly if set.
5. Once `sessionActive: true`, capture `userId` (as a string from the JSON parse boundary) and `userName` from the ping response.
6. Call `linkAccount(targetProfileId, { source: "train2go", externalUserId, externalUserName, linkedAt: now })`. The use case takes `targetProfileId` as an explicit argument; it MUST NOT resolve the profile via `getActiveId()` at write time. If `getById(targetProfileId)` returns `undefined` (profile deleted between click and poll completion), the use case throws `ProfileNotFoundError`; the caller surfaces a toast "Profile no longer exists; not linked." and writes nothing.

If the active profile changes during the poll, the link still completes against `targetProfileId` (the user's intent at click time wins) and a small toast surfaces "Linked Train2Go to <targetProfileName>" so the user is not surprised.

The poll SHALL be aborted (and no link written) when:

- The surface hosting the connect flow unmounts.
- The user explicitly cancels the connect flow.

<!-- The prior list also aborted the poll when the user disconnected the same
source mid-poll. On the Connections card the unlink control is offered only
once a link exists, and the poll runs only while none does, so that state is
unreachable and its scenario is removed with it. -->

On abort, no toast is shown and `lastError` is not set — abort is a silent, intentional state.

The calendar SHALL NOT host a Connect button. If the active profile has no linked accounts and the user attempts a sync, the calendar SHALL surface a hint pointing to the Connections page.

#### Scenario: One-click Train2Go connection

- **WHEN** the user links Train2Go from its card on the Connections page
- **THEN** the extension opens a Train2Go tab, the SPA polls until the session is active, and the active profile gains a `train2go` entry in `linkedAccounts`

#### Scenario: Connection polling times out

- **WHEN** the SPA polls 5 times without `sessionActive: true`
- **THEN** the SPA shows guidance inside the panel: "Open Train2Go, log in, and try again"

#### Scenario: Profile switch mid-poll preserves intent

- **WHEN** the user clicks "Connect Train2Go" while Profile A is active, then switches to Profile B before polling completes successfully
- **THEN** the link is written to Profile A (the captured `targetProfileId`), Profile B's `linkedAccounts` is untouched, and a toast surfaces "Linked Train2Go to <Profile A name>"

#### Scenario: Connect aborted by leaving the surface

- **WHEN** the user starts linking Train2Go and the surface hosting the connect flow unmounts before polling succeeds
- **THEN** the `AbortSignal` fires, polling stops, no `linkAccount` is invoked, no toast is shown, and `lastError` remains unchanged

#### Scenario: Connect on deleted profile fails cleanly

- **WHEN** Profile A is the connect target, Profile A is deleted in another tab during the poll, and the poll then succeeds
- **THEN** `linkAccount(A, ...)` throws `ProfileNotFoundError`; a single toast surfaces "Profile no longer exists; not linked"; no `linkedAccounts` row exists anywhere

#### Scenario: Unlink from the Connections card

- **WHEN** the user unlinks the Train2Go account from its card on the Connections page
- **THEN** the entry is removed from `linkedAccounts`. Persisted `coachingActivities` rows for that profile remain on disk (they are coach-owned data, retained until explicit profile deletion).

#### Scenario: Disconnect retains historical coaching activities

- **WHEN** Profile P had a `train2go` link with N persisted activities, the user clicks Disconnect, and then re-renders the calendar
- **THEN** the N activities continue to appear (read from `coachingActivities`); only profile deletion fully purges them. A user wanting full purge must delete the profile.

### Requirement: Train2Go's status is presented with every other source

Train2Go's status SHALL be presented on the Connections page
(`/connections`, see `spa-connections-page`) as one source card among
every registered source, carrying that page's status vocabulary and its stated
consequence rather than a bridge-table row of its own. The single refresh
control on that page SHALL re-check every known bridge, Train2Go included. The
`/settings/extensions` table this requirement previously described is retired
and its path resolves to the Connections page.

Where the two disagreed, the Connections page's rules govern: a bridge is
connected iff its extension is discovered AND the user has not disconnected it,
and a bridge with no session prober is reported as present rather than as
verified — Train2Go has no prober, so its card may not claim a live session.

#### Scenario: Train2Go not installed

- **WHEN** the user opens the Connections page and the Train2Go extension is not installed
- **THEN** its card SHALL report the source as not connected

#### Scenario: Train2Go is present but unverifiable

- **WHEN** the user opens the Connections page and the Train2Go extension announced itself on load
- **THEN** its card SHALL report it as detected rather than claiming a verified session

#### Scenario: One refresh re-checks Train2Go with the rest

- **WHEN** the user presses the Connections page's refresh control
- **THEN** every known bridge SHALL be re-checked, Train2Go included

### Requirement: Platform-inclusive copy in empty states

The calendar empty states SHALL use platform-inclusive copy that references multiple bridge platforms, not just Garmin. This ensures users are aware of all integration options. Connect CTAs in empty states SHALL route to the **Connections page**, never to a calendar-local connect action.

#### Scenario: FirstVisitState mentions multiple platforms

- **WHEN** the calendar shows the first-visit onboarding state
- **THEN** the "Connect" entry path description SHALL say "Link Garmin Connect, Train2Go, or other platforms"

#### Scenario: NoBridgesState mentions multiple platforms

- **WHEN** the calendar shows the no-bridges-detected banner
- **THEN** the banner SHALL say "Install a bridge extension (e.g., Garmin Connect, Train2Go) to sync workouts."

#### Scenario: Connect CTA routes to the Connections page

- **WHEN** the user clicks the "Connect" button on `FirstVisitState` or `NoBridgesState`
- **THEN** the SPA navigates to the Connections page (NOT to a calendar-local connect action or modal)

### Requirement: `LinkedAccountRow` exposes the `Sync zones` toggle

This requirement is superseded. The `LinkedAccountRow` has been removed with the profile manager's Linked Accounts tab, and the linked-account notice that replaced it on the Connections card SHALL NOT expose a `Sync zones` toggle. Zone-sync configuration MUST be performed via the Data Flows section in ProfileManager (see ADDED Requirement: Data Flows configuration for training-zones import below). The `syncZones` field SHALL be removed from `linkedCoachingAccountSchema` at the Zod schema layer; the Dexie column remains nullable in v17 as a rollback buffer and is dropped in v18 (F-4).

Profiles that previously had `syncZones: true` SHALL be migrated to an enabled `IntegrationPolicy` row (`dataType: 'training-zones'`, `bridgeId: 'train2go-bridge'`, `direction: 'import'`, `mode: 'auto'`, `enabled: true`) by the Dexie v17 upgrade. No user action is required.

#### Scenario: Zone auto-import gated on IntegrationPolicy, not syncZones

- **GIVEN** a profile was migrated from `syncZones: true` to an enabled auto-import `IntegrationPolicy` row for `(dataType: 'training-zones', bridgeId: 'train2go-bridge', direction: 'import', mode: 'auto')`
- **WHEN** the SPA mounts and the Train2Go bridge is VERIFIED
- **THEN** the zones import fires once per SPA mount, deduplicating via the natural-key upsert (C-3), with no user-visible change in behavior relative to the prior `syncZones=true` state

#### Scenario: No syncZones toggle on the linked account

- **WHEN** the user views a linked Train2Go account on its Connections card
- **THEN** the card SHALL NOT show a `Sync zones` checkbox or switch
- **AND** the linked identity and its unlink control SHALL be shown (A-7)
