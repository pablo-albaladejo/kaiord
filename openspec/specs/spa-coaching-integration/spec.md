> Synced: 2026-04-28 (train2go-profile-link)

# SPA Coaching Integration

## Purpose

Profile-anchored coaching platform linking, persisted coaching activities, auto-sync with staleness gate, and conversion of coaching activities into editable workouts. Generic across coaching sources (Train2Go today, TrainingPeaks/others later).
## Requirements
### Requirement: LinkedCoachingAccount domain semantics

A `Profile` SHALL be able to carry zero or more `LinkedCoachingAccount` entries, each shaped as `{ source: string, externalUserId: string, externalUserName: string, linkedAt: string (ISO datetime) }`. At most one entry per `source` per profile MUST exist.

The `source` field is compared **case-sensitively** as a canonical lowercase ASCII identifier (`"train2go"`, future: `"trainingpeaks"`). All mappers MUST emit the canonical form; uniqueness is enforced on the literal string. A typo or differently-cased input does NOT match an existing entry — the caller is responsible for normalization.

`externalUserId` SHALL be stored as `string`. The platform-specific transport adapter SHALL produce that string at the JSON parse boundary (never `String(parsedNumber)` after the fact, which is lossy for integers above `Number.MAX_SAFE_INTEGER`).

Linking SHALL be performed by an explicit application-layer use case `linkAccount(profileId, account)` whose `profileId` argument is captured by the caller at user-action time (e.g., when the user clicks "Connect"). The use case MUST NOT resolve the target profile via `getActiveId()` at write time — that would race with profile switches mid-poll. Re-linking the same `source` on the same profile replaces the previous entry. Unlinking is performed by `unlinkAccount(profileId, source)`.

#### Scenario: Profile starts with no linked accounts

- **WHEN** a new Profile is created
- **THEN** `linkedAccounts` is initialized to `[]`

#### Scenario: Linking a coaching source

- **WHEN** the user links a Train2Go account to Profile P via the Linked Accounts panel
- **THEN** `linkAccount(P, { source: "train2go", externalUserId, externalUserName, linkedAt })` is invoked and P gains exactly that entry in `linkedAccounts`

#### Scenario: Linking a second source on the same profile

- **WHEN** Profile P already has a `train2go` linked account and the user links a different source (future: `trainingpeaks`)
- **THEN** both entries coexist in `linkedAccounts`

#### Scenario: Re-linking the same source replaces the prior entry

- **WHEN** Profile P already has a `train2go` entry and the user links a different Train2Go account
- **THEN** the previous `train2go` entry is replaced (uniqueness invariant — one entry per source per profile)

#### Scenario: Profile switch mid-link preserves user intent

- **WHEN** the user starts the connect flow under Profile A and switches the active profile to B before polling completes
- **THEN** `linkAccount(A, ...)` is invoked with the originally captured `targetProfileId = A`, and B's `linkedAccounts` is untouched

#### Scenario: Unlinking a coaching source

- **WHEN** the user clicks "Disconnect" on a linked account in Profile Settings for Profile P
- **THEN** `unlinkAccount(P, "train2go")` is invoked and the entry is removed from P's `linkedAccounts`

#### Scenario: linkAccount on a deleted profile fails cleanly

- **WHEN** `linkAccount(P, account)` is called and `ProfileRepository.getById(P)` returns `undefined` (P was deleted between the connect-flow click and the poll completion)
- **THEN** the use case throws `ProfileNotFoundError`; no partial state is written to any profile, and the caller is responsible for surfacing a user-facing toast

#### Scenario: unlinkAccount is idempotent

- **WHEN** `unlinkAccount(P, "train2go")` is called and EITHER `P` no longer exists OR `P` has no `train2go` entry in `linkedAccounts`
- **THEN** the use case completes silently (no error thrown, no toast). Disconnect is the user's intent to be in the unlinked state — if the state already satisfies that intent, the use case is a no-op.

#### Scenario: Disconnect after a successful link

- **WHEN** a connect poll resolved and wrote a `train2go` entry to Profile P, and the user then immediately clicks Disconnect
- **THEN** `unlinkAccount(P, "train2go")` runs and removes the entry. The disconnect handler MUST detect that the link was already written (poll not aborted) and run unlink, NOT skip it.

### Requirement: CoachingActivityRecord shape

A `CoachingActivityRecord` SHALL have the shape:

```
{
  id: string,                     // composite: ${profileId}:${source}:${sourceId}
  profileId: string,              // owning profile
  source: string,                 // e.g., "train2go"
  sourceId: string,               // platform's id, captured as string at JSON parse boundary
  date: string,                   // YYYY-MM-DD in user's local timezone, matching the spa-calendar week-id convention (Monday-start ISO weeks)
  sport: string,                  // raw sport key
  title: string,
  duration?: string,              // free-text from platform
  workload?: number,              // raw platform metric — preserved without lossy clamping
  intensity?: 1 | 2 | 3 | 4 | 5,  // mapper-normalized 1-5 for UI
  status: "pending" | "completed" | "skipped",
  completionPercent?: number,     // 0-100, distinct from status
  description?: string,           // populated lazily on expand
  fetchedAt: string               // ISO timestamp of last fetch
}
```

`workload`, `intensity`, `status`, and `completionPercent` are independent and orthogonal — `status: "completed"` with `completionPercent: 85` is valid (a coach can mark something done even when partially completed). Each platform-specific record mapper SHALL provide and unit-test a deterministic `workload → intensity` mapping that produces a value in `{1,2,3,4,5}` (or `undefined`). The canonical Train2Go mapping is `clamp(workload, 1, 5)`; the future TrainingPeaks mapping (TSS → 1-5) SHALL be specified and tested in its own change. A platform without a workload signal MAY emit `intensity: undefined`.

The composite `id` format SHALL guarantee that re-fetching the same activity from the same coach for the same profile produces the same `id` (deterministic upsert key).

#### Scenario: Workload preserved without lossy clamping

- **WHEN** Train2Go returns `workload: 7` (above the 1-5 UI scale)
- **THEN** the persisted record has `workload: 7` and `intensity: 5` — both stored, neither overwriting the other

#### Scenario: Status and completion are orthogonal

- **WHEN** Train2Go returns an activity with `status: 1` (completed) and `completion: 85`
- **THEN** the persisted record has `status: "completed"` AND `completionPercent: 85`

#### Scenario: Lossless sourceId

- **WHEN** the platform returns a `sourceId` that exceeds `Number.MAX_SAFE_INTEGER`
- **THEN** the persisted record's `sourceId` matches the platform's value byte-identically (the mapper consumed a string from the JSON parse boundary, never a parsed number)

#### Scenario: Per-platform intensity mapping is unit-tested

- **WHEN** a new coaching adapter is added (e.g., TrainingPeaks)
- **THEN** the adapter package SHALL export a deterministic `workload → intensity` mapping function that returns a value in `{1,2,3,4,5} | undefined`, accompanied by a unit test that exercises the boundary conditions (below-min clamp, above-max clamp, mid-range, missing input)

#### Scenario: Activity without intensity renders without dots

- **WHEN** a `CoachingActivityRecord` has `intensity: undefined`
- **THEN** the `CoachingActivityCard` and `CoachingActivityDialog` render no intensity-dots indicator (instead of rendering empty/zero dots which could be confused with "lowest intensity")

### Requirement: SyncWeek orphan cleanup within window

`weekStart` SHALL be the Monday (ISO week-start) of the target week, formatted `YYYY-MM-DD` in the user's local date interpretation. The week range is `[weekStart, weekStart + 6 days]` inclusive. This matches the existing `spa-calendar` week-id convention (`YYYY-Wnn`) and ensures the orphan-cleanup window is unambiguous regardless of platform locale.

`syncWeek(profileId, weekStart)` SHALL NOT be a pure upsert. After upserting the freshly-fetched activities for `(profileId, source, weekStart..weekEnd)`, the use case SHALL delete any locally-persisted `coachingActivities` rows whose key matches `(profileId, source, dateInWeek)` but whose `id` does not appear in the fetch payload (coach-removed activities).

`CoachingRepository.delete(id)` SHALL be a no-op when the row does not exist (e.g., concurrently deleted by another `syncWeek` call). The orphan-cleanup loop tolerates absent rows without raising.

The deletion window MUST be scoped to the current week being synced — never to the whole profile. Activities in other weeks remain untouched.

`coachingSyncState[(source, profileId)].lastSyncedAt` SHALL be updated UNCONDITIONALLY on a successful fetch (via `coachingSyncState.put`), including a zero-activity response. This prevents the staleness gate from re-firing every render on an empty week.

#### Scenario: Coach-removed activity is cleaned up

- **WHEN** week W has 3 persisted activities and `read-week` returns only 2 (coach removed one)
- **THEN** the missing activity is deleted from `coachingActivities`; the 2 returned activities are upserted

#### Scenario: Other weeks are not affected by sync

- **WHEN** week W is synced and `read-week` returns 0 activities for W
- **THEN** activities in week W-1 and W+1 remain untouched

#### Scenario: Empty fetch updates lastSyncedAt

- **WHEN** `read-week` returns 0 activities for the requested week
- **THEN** `coachingSyncState[(source, profileId)].lastSyncedAt` is updated to `now`; subsequent renders within the staleness window do not re-fire the sync

### Requirement: Auto-sync with staleness gate

The calendar SHALL trigger an automatic sync of the active profile's coaching activities for the visible week when:

1. The `CalendarPage` mounts and the active profile has at least one linked account, OR
2. The user navigates to a different week and the active profile has at least one linked account.

The auto-sync SHALL be skipped when `now - lastSyncedAt < 10 minutes` for the `(source, profileId)` pair (read from the dedicated `coachingSyncState` table via `CoachingSyncStateRepository.getBySourceAndProfile`). A row in `coachingSyncState` SHALL track `lastSyncedAt` per `(source, profileId)`. The manual "Sync" button SHALL bypass the gate.

`expandDay` (per-day description fetch) SHALL NOT update `coachingSyncState.lastSyncedAt`. Only `syncWeek` (the week-level fetch) updates the staleness gate; expanding a single activity's description must not reset the gate for the entire week, otherwise a single click would suppress the next legitimate auto-sync.

Auto-sync failures (extension not installed, Train2Go tab not open, session expired) SHALL be silent — surfaced only via the existing `lastError` state, never as toasts.

#### Scenario: Fresh data — no auto-sync

- **WHEN** the user opens the calendar and `lastSyncedAt` is 3 minutes ago
- **THEN** no fetch is triggered; persisted activities render immediately

#### Scenario: Stale data — auto-sync fires

- **WHEN** the user opens the calendar and `lastSyncedAt` is 15 minutes ago (or never)
- **THEN** the system calls `syncWeek(profileId, weekStart)` for each linked source on the active profile

#### Scenario: Manual sync bypasses gate

- **WHEN** the user clicks "Sync Train2Go" within 10 minutes of the last sync
- **THEN** the fetch happens regardless of staleness

#### Scenario: Auto-sync failure stays silent

- **WHEN** auto-sync fires and the Train2Go tab is closed
- **THEN** `lastError` is set to a transport error message but no toast is shown

#### Scenario: Profile switch invalidates staleness

- **WHEN** the user switches the active profile from A to B
- **THEN** the FIRST render after the switch reads `coachingSyncState.getBySourceAndProfile(source, B)` — the previous-profile row for A is NOT consulted, NOT cached, and does NOT influence whether auto-sync fires for B

### Requirement: Convert coaching activity to workout

The system SHALL provide a use case `convertCoachingActivity(activityId)` that:

1. Reads the `CoachingActivityRecord` by id.
2. Computes `namespacedSourceId = ${activity.profileId}:${activity.sourceId}`.
3. Calls `WorkoutRepository.getBySourceId(activity.source, namespacedSourceId)`. If a `WorkoutRecord` already exists, returns its id (idempotent — no duplicate created).
4. Otherwise, creates a new `WorkoutRecord` with `state: "raw"`, `source: activity.source`, `sourceId: namespacedSourceId`, `date`, `sport`, `title`, and `description` carried over from the activity. `id` is a fresh `nanoid()`. No `steps` are populated. Persists via `WorkoutRepository.put`.
5. Returns the workout id so the UI can navigate to `/workout/:id`.

The `coachingActivities` row is NOT deleted on conversion — both records coexist (the activity is the source-of-truth from the coach; the workout is Kaiord's editable copy).

The namespacing of `sourceId` ensures that two profiles linking the same Train2Go account each get their own editable workout from the same source activity.

#### Scenario: First-time conversion

- **WHEN** the user clicks "Convert to workout" on a coaching activity that has not been converted before in the active profile
- **THEN** a new `WorkoutRecord` with `state: "raw"` and `sourceId: ${profileId}:${rawSourceId}` is created, persisted, and the user is navigated to its editor

#### Scenario: Idempotent re-conversion within the same profile

- **WHEN** the user clicks "Convert to workout" on an activity already converted under the same profile
- **THEN** no new `WorkoutRecord` is created; the user is navigated to the existing workout's editor

#### Scenario: Conversion is profile-scoped

- **WHEN** Profile A has converted activity 12345 to a workout, and the user switches to Profile B (which has the same Train2Go account linked) and clicks "Convert to workout" on the same source activity 12345
- **THEN** Profile B gets its own new `WorkoutRecord` (different `sourceId` namespace), separate from A's

#### Scenario: Coaching activity preserved after conversion

- **WHEN** an activity has been converted to a workout
- **THEN** the activity row remains in `coachingActivities` and continues to render on the calendar (alongside the workout)

#### Scenario: Convert write failure does not navigate

- **WHEN** the user clicks "Convert to workout" and `WorkoutRepository.put` rejects (e.g., IndexedDB quota error)
- **THEN** the use case re-throws; the dialog stays open; an error toast surfaces; the user is NOT navigated to a non-existent `/workout/:id`

#### Scenario: Profile delete preserves converted workouts

- **WHEN** the user deletes a profile that had converted activities
- **THEN** the profile's `coachingActivities` rows are cascade-deleted, but its converted `WorkoutRecord` rows remain (workouts are profile-agnostic today)

### Requirement: CoachingActivityDialog

Clicking a coaching activity card SHALL open a `CoachingActivityDialog` modal showing:

- Sport icon and label
- Title
- Date
- Duration (if present)
- Intensity (1-5 dot indicator, if present)
- Status (pending / completed / skipped) and `completionPercent` if present
- Description (full text; fetched lazily via `read-day` when `description === undefined` — a persisted `description: ""` is treated as "known empty" and does NOT re-fire, per `spa-train2go-extension` "Fetch training plan on user action")
- A "Close" action

The dialog's primary actions SHALL be driven by whether the activity is currently part of a `SessionMatch`:

- **Solo-plan state** (the activity is NOT matched to any workout): the dialog SHALL render a "Convert to workout" action AND a "Match to…" action. The "Match to…" action SHALL open a sub-picker listing `WorkoutRecord`s for the active profile that satisfy ALL of: (a) same `date` as the activity, (b) same canonical `sport` family per `autoMatchSessions`'s `same date AND same sport` rule, and (c) NOT already part of a `SessionMatch` row **for the active profile**. Workouts matched in another profile remain candidates here because `SessionMatch` uniqueness is profile-scoped (this property is currently asserted in the archived `spa-session-match` spec under the `SessionMatch aggregate` requirement, scenario "Same workout matched in two profiles" — to be promoted into the active `openspec/specs/spa-session-match/` capability by the follow-up `/opsx-sync` operation; this change relies on it as a documented invariant, not on its current physical location). Selecting one SHALL invoke `matchSession({ source: "manual", profileId, coachingActivityId, workoutId })`. After a successful match, the dialog SHALL re-render in matched state without closing.
- **Matched state** (a `SessionMatch` row exists for this activity): the dialog SHALL render a "Linked workout" section showing the matched workout's title, sport, and duration, plus a "Split" action that invokes `unmatchSession({ profileId, coachingActivityId, workoutId })`. After a successful split, the dialog SHALL re-render in solo-plan state without closing. The "Convert to workout" action SHALL be hidden while the activity is matched (the actual workout already exists, so conversion would produce a duplicate).

Interactions with the match/split actions SHALL disable their button during the in-flight write, so a user cannot trigger the same action twice while the first request is pending. The dialog SHALL replace the current in-place description toggle on `CoachingActivityCard`. The card click handler SHALL only open the dialog (no toggling).

The dialog SHALL capture the active `profileId` at open time and pass it explicitly into `matchSession`, `unmatchSession`, and any related write call. Use cases SHALL NOT resolve the active profile via `getActiveId()` at submit time. This mirrors the `linkAccount` profile-switch-safe pattern (see "Profile switch mid-link preserves user intent") so a profile switch performed while the dialog is open does not silently rebind a write to the new profile.

The Match-to picker SHALL be keyboard operable: `Tab` focuses the first list item; `ArrowDown` / `ArrowUp` move focus within the list; `Enter` selects the focused item; `Escape` closes the picker without closing the parent dialog (Escape on the parent dialog continues to close the dialog itself).

#### Scenario: Dialog opens with persisted description

- **WHEN** the user clicks a coaching card and `description` is already populated
- **THEN** the dialog opens immediately with the description visible, and no `read-day` call is made

#### Scenario: Dialog opens and lazy-loads description

- **WHEN** the user clicks a coaching card and `description` is `undefined` (never fetched), and a persisted empty string `""` is treated as "known empty" and does NOT re-fire per `spa-train2go-extension` "Fetch training plan on user action"
- **THEN** the dialog opens with a loading indicator in the description region, fires `read-day`, upserts every activity returned by `read-day` (siblings included), and re-renders with the description

#### Scenario: Convert action navigates to editor (solo plan only)

- **GIVEN** the activity is NOT matched to any workout
- **WHEN** the user clicks "Convert to workout" inside the dialog
- **THEN** the dialog closes, `convertCoachingActivity` runs, and the user is routed to `/workout/:id` for the resulting workout

#### Scenario: Match-to picker lists same-day same-sport unmatched workouts

- **GIVEN** the active profile has a coaching activity `A` (sport=cycling, date=2026-05-04) in solo-plan state
- **AND** workouts `W1` (cycling, 2026-05-04, unmatched), `W2` (running, 2026-05-04, unmatched), `W3` (cycling, 2026-05-04, already matched), and `W4` (cycling, 2026-05-05, unmatched) all exist for that profile
- **WHEN** the user clicks "Match to…" inside the dialog
- **THEN** the picker shows only `W1` (same day, same sport, unmatched); `W2` is excluded by sport, `W3` by match state, `W4` by date

#### Scenario: Selecting a workout in the picker matches it to the activity

- **GIVEN** the picker is open and lists `W1` as the single candidate
- **WHEN** the user selects `W1`
- **THEN** `matchSession({ source: "manual", profileId, coachingActivityId: A, workoutId: W1 })` is invoked; on success the dialog re-renders in matched state showing the "Linked workout" section for `W1`; the "Convert to workout" action is no longer visible

#### Scenario: Split action removes the match and restores solo-plan state

- **GIVEN** the activity is matched to workout `W` and the dialog is rendering the "Linked workout" section
- **WHEN** the user clicks "Split"
- **THEN** `unmatchSession` is invoked; on success the dialog re-renders in solo-plan state with the "Match to…" and "Convert to workout" actions visible again; the workout is no longer linked

#### Scenario: Split on a stale match is a no-op

- **GIVEN** the dialog is open in matched state in tab A; the user already split the same match in tab B (so the `sessionMatches` row no longer exists), but the live-query update has not yet propagated to tab A
- **WHEN** the user clicks "Split" in tab A
- **THEN** `unmatchSession` resolves successfully without throwing (the use case is idempotent — deleting an already-deleted match is a no-op); on the next live-query tick the dialog re-renders in solo-plan state; no error is surfaced to the user

#### Scenario: Match action button is disabled during the in-flight write

- **GIVEN** the dialog is in solo-plan state and the user clicks "Match to…", selects a workout, and the matchSession promise is pending
- **WHEN** the user clicks the same selection button again before the first call resolves
- **THEN** the button is disabled; only one matchSession call is dispatched; on resolution the dialog re-renders in matched state exactly once

#### Scenario: Convert is hidden when matched

- **GIVEN** the activity is in matched state
- **WHEN** the dialog renders
- **THEN** the "Convert to workout" action is not present in the DOM; the only writeable action is "Split"

#### Scenario: Matched workout deleted while dialog is open

- **GIVEN** the dialog is open in matched state for activity `A` linked to workout `W`
- **WHEN** workout `W` is deleted in another tab (cascade fires removing the `SessionMatch` row)
- **THEN** the dialog re-renders in solo-plan state on the next live-query tick (via `useMatchedSessions`); the "Linked workout" section disappears; the "Convert to workout" and "Match to…" actions reappear; no error is thrown; the dialog does NOT close

#### Scenario: Picker filter respects profile-scoped match state

- **GIVEN** the active profile is `P1` and the coaching activity has date=2026-05-04, sport=cycling
- **AND** every `WorkoutRecord` is profile-agnostic (per `spa-coaching-integration` "Convert coaching activity to workout"); workouts `W1` (cycling, 2026-05-04, matched in `P1`), `W2` (cycling, 2026-05-04, matched in `P2` only — unmatched in `P1`), `W3` (cycling, 2026-05-04, unmatched in any profile), `W5` (running, 2026-05-04, unmatched), and `W6` (cycling, 2026-05-05, unmatched) all exist
- **WHEN** the user clicks "Match to…"
- **THEN** the picker lists `W2` and `W3` (both not part of any `SessionMatch` row scoped to `P1`); `W1` is excluded because a `SessionMatch` row already exists for `(P1, W1)`; `W5` is excluded by sport; `W6` is excluded by date

#### Scenario: Profile switch mid-dialog preserves the original profile

- **GIVEN** the dialog opened on profile `P1` and the user has not yet clicked "Match to…"
- **WHEN** the user switches the active profile to `P2` (e.g., via a profile switcher in another tab) and then completes the match in the still-open dialog
- **THEN** `matchSession` is invoked with `profileId: P1` (captured at dialog-open time); the `P2` data is unaffected; the dialog reflects the original `P1` activity throughout

#### Scenario: Match-to picker keyboard navigation

- **GIVEN** the picker lists 3 candidate workouts and is open
- **WHEN** the user presses `Tab` to focus the picker, then `ArrowDown` twice, then `Enter`
- **THEN** the third candidate workout is selected; `matchSession` is invoked with that workout's id; the picker closes; the dialog re-renders in matched state

#### Scenario: Picker Escape closes only the picker

- **GIVEN** the picker is open inside the dialog
- **WHEN** the user presses `Escape`
- **THEN** the picker closes; the parent dialog remains open in solo-plan state; pressing `Escape` again closes the dialog

### Requirement: Calendar Sync button gated on linked account

The calendar header SHALL render a "Sync <Label>" button for each linked coaching account on the active profile. If the active profile has no linked account for a given source, no Sync button for that source SHALL appear.

When the active profile has zero linked accounts, the calendar SHALL display a contextual hint pointing to **Profile Settings → Linked Accounts** as the place to connect — never an inline Connect action.

#### Scenario: Profile with linked Train2Go shows Sync button

- **WHEN** the active profile has `linkedAccounts: [{ source: "train2go", ... }]`
- **THEN** the calendar header shows a "Sync Train2Go" button

#### Scenario: Profile with no linked accounts hides Sync buttons

- **WHEN** the active profile has `linkedAccounts: []`
- **THEN** the calendar header shows no Sync buttons but instead surfaces a hint linking to Profile Settings → Linked Accounts

#### Scenario: Profile switch updates Sync buttons

- **WHEN** the user switches from a profile with Train2Go linked to one without
- **THEN** the "Sync Train2Go" button disappears without page reload

### Requirement: CoachingSource port emits a query function, not a baked array

The `CoachingSource` port SHALL expose `query(profileId, days): CoachingActivity[]` (a hook backed by `useLiveQuery`) instead of a pre-baked `activities: CoachingActivity[]`. The platform-agnostic registry mounts above the calendar route and does not know which week is visible; baking activities at bootstrap is therefore impossible without leaking calendar state into the registry.

`useCoachingActivities(days)` SHALL call `source.query(activeProfileId, days)` for each registered source. The calendar SHALL preserve "zero platform-specific imports" — it consumes only `CoachingSource` and `CoachingActivity`.

#### Scenario: Source query reactivity

- **WHEN** a sync writes new activities for the active profile and visible week
- **THEN** the next render reflects the new activities without an explicit re-fetch (live-query reactivity)

#### Scenario: Calendar zero platform imports

- **WHEN** the calendar renders the week grid
- **THEN** the call graph from `CalendarPage` includes only `CoachingSource`-shaped types and `CoachingActivity` view-models — no `Train2GoActivity`, `Train2GoStore`, or `train2go-*` files

