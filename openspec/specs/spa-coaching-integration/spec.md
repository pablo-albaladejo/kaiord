> Synced: 2026-06-13 (train2go-links-and-day-comments)

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
3. Calls `WorkoutRepository.getBySourceId(activity.source, namespacedSourceId)`. If a `WorkoutRecord` already exists:
   - If no `SessionMatch` exists for the pair, the use case SHALL silently create one (auto-heal path; same behavior as the v10 migration but applied per-call). Source = `"auto-coaching"`.
   - Returns the existing workout's id (idempotent — no duplicate workout created).
4. Otherwise, creates a new `WorkoutRecord` with `state: "raw"`, `source: activity.source`, `sourceId: namespacedSourceId`, `date`, `sport`, `title`, `description` carried into `raw.description`. `id` is a fresh `nanoid()`. No `steps` are populated. Persists via `WorkoutRepository.put`.
5. Persists a `SessionMatch` row with `source: "auto-coaching"`, `profileId: activity.profileId`, `coachingActivityId: activity.id`, `workoutId`, `date: activity.date` (auto-match invariant — every Convert from a coaching activity creates the match).
6. Returns the workout id so the UI can navigate to `/workout/:id`.

The `coachingActivities` row is NOT deleted on conversion — both records coexist (the activity is the source-of-truth from the coach; the workout is Kaiord's editable copy).

The namespacing of `sourceId` ensures that two profiles linking the same Train2Go account each get their own editable workout from the same source activity.

The auto-match invariant means the calendar bucketer SHALL route the activity into `matchedByDay` after conversion (instead of `soloPlansByDay`), eliminating the visual duplication that occurred under the legacy non-auto-match flow.

#### Scenario: First-time conversion creates workout AND match

- **WHEN** the user clicks "Convert to workout" on a coaching activity that has not been converted before in the active profile
- **THEN** a new `WorkoutRecord` with `state: "raw"` and `sourceId: ${profileId}:${rawSourceId}` is created; a new `SessionMatch` linking the activity to the workout is created with `source="auto-coaching"`; both writes complete before the use case returns; the user is navigated to `/workout/:id`

#### Scenario: Idempotent re-conversion within the same profile

- **WHEN** the user clicks "Convert to workout" on an activity already converted under the same profile
- **THEN** no new `WorkoutRecord` is created; if the existing pair lacks a `SessionMatch`, one is silently created; the user is navigated to the existing workout's editor

#### Scenario: Conversion is profile-scoped

- **WHEN** Profile A has converted activity 12345 to a workout, and the user switches to Profile B (which has the same Train2Go account linked) and clicks "Convert to workout" on the same source activity 12345
- **THEN** Profile B gets its own new `WorkoutRecord` (different `sourceId` namespace) AND its own `SessionMatch` linking activity 12345 (in Profile B) to the new workout; A's match is untouched

#### Scenario: Coaching activity preserved after conversion

- **WHEN** an activity has been converted to a workout
- **THEN** the activity row remains in `coachingActivities`; the new SessionMatch causes the calendar bucketer to render ONE matched card (not two solo cards) for the training session

#### Scenario: Convert write failure does not navigate

- **WHEN** the user clicks "Convert to workout" and `WorkoutRepository.put` rejects (e.g., IndexedDB quota error)
- **THEN** the use case re-throws; no `SessionMatch` is created (write order: workout first, then match); the dialog stays open; an error toast surfaces; the user is NOT navigated to a non-existent `/workout/:id`

#### Scenario: Convert match-write failure rolls back workout

- **WHEN** `WorkoutRepository.put` succeeds but `SessionMatchRepository.put` rejects
- **THEN** the use case SHALL delete the just-persisted `WorkoutRecord` (or roll back the transaction if Dexie supports it); error is re-thrown; no orphaned workout exists

#### Scenario: Profile delete preserves converted workouts

- **WHEN** the user deletes a profile that had converted activities
- **THEN** the profile's `coachingActivities` and `sessionMatches` rows are cascade-deleted, but its converted `WorkoutRecord` rows remain (workouts are profile-agnostic today)

### Requirement: AI-driven creation from coaching activity (synchronous)

The system SHALL provide a use case `convertCoachingActivityWithAi(activityId, providerConfig, abortSignal)` that runs the AI pipeline synchronously and writes both the resulting workout AND its `SessionMatch` atomically. The use case:

1. Reads the `CoachingActivityRecord` by id (rejects with `not-found` if missing).
2. Reads the activity's `description`. If empty/undefined, builds the prompt as `"${activity.title} (${activity.sport})"`. Otherwise uses the description verbatim.
3. Computes `namespacedSourceId = ${activity.profileId}:${activity.sourceId}`.
4. Calls `WorkoutRepository.getBySourceId(activity.source, namespacedSourceId)`. If a `WorkoutRecord` already exists, returns `{ ok: true, workoutId, created: false }` AND ensures a matching `SessionMatch` row exists (creates one silently if missing — handles legacy data per the Dexie v10 retro-fix invariant).
5. Otherwise, calls `generateWorkoutKrd({ text, provider, sport })` with the abort signal piped through. The model produces a KRD object.
6. On model success, persists a new `WorkoutRecord` with `state: "structured"`, the produced `krd`, `aiMeta` (provider, model, prompt version, timestamp), `raw.description: activity.description ?? ""`, `source`, `sourceId: namespacedSourceId`, `date`, `sport`, `title`, fresh `nanoid()` id. Writes a `SessionMatch` row with `source: "auto-coaching"`, `profileId: activity.profileId`, `coachingActivityId: activity.id`, `workoutId`, `date: activity.date`. Both writes complete before returning. Returns `{ ok: true, workoutId, created: true }`.
7. On model failure (rejection, abort, invalid KRD shape, timeout), the use case writes NOTHING — no `WorkoutRepository.put`, no `SessionMatchRepository.put`. Returns `{ ok: false, reason, error }` where `reason ∈ { "ai-error" | "ai-cancelled" | "ai-timeout" | "ai-invalid-krd" | "transport-error" }`.

The use case emits analytics: `coaching.convert_with_ai.invoked` on entry, then exactly one of `coaching.convert_with_ai.success` (with `created` flag) or `coaching.convert_with_ai.failure` (with `reason` enum) on exit.

#### Scenario: Successful AI conversion creates workout and match atomically

- **GIVEN** an activity `A` with `description="Calentamiento Z1 + 5x(15\" Z5)"` and no existing workout
- **WHEN** the user clicks `[AI process]` and `generateWorkoutKrd` returns a valid KRD
- **THEN** a new `WorkoutRecord` with `state="structured"` and the produced KRD is persisted; a new `SessionMatch` row with `source="auto-coaching"` linking activity `A` to the new workout is persisted; the use case returns `{ ok: true, created: true }`; the calendar bucketer routes both into `matchedByDay` (the activity disappears from `soloPlansByDay`)

#### Scenario: AI failure persists nothing

- **GIVEN** an activity with no existing workout
- **WHEN** the user clicks `[AI process]` and `generateWorkoutKrd` rejects with `"Model returned invalid KRD"`
- **THEN** no `WorkoutRecord` is created; no `SessionMatch` is created; the use case returns `{ ok: false, reason: "ai-invalid-krd", error: "Model returned invalid KRD" }`; the dialog stays in `no-workout` state with the error rendered inline

#### Scenario: AI cancellation persists nothing

- **GIVEN** an in-flight `[AI process]` request
- **WHEN** the user clicks `[Cancel]` (or presses Escape, or closes the dialog) and the abort signal fires
- **THEN** the in-flight LLM request aborts; no `WorkoutRecord` is created; no `SessionMatch` is created; the use case returns `{ ok: false, reason: "ai-cancelled" }`; the dialog returns to `no-workout` state without an error message

#### Scenario: Empty description falls back to title + sport

- **GIVEN** an activity with `description=""` and `title="Long ride Z2"` and `sport.label="Cycling"`
- **WHEN** the user clicks `[AI process]`
- **THEN** `generateWorkoutKrd` is called with `text="Long ride Z2 (Cycling)"`; the dialog shows the hint `"ℹ AI usará solo title + sport"` above the action buttons; the use case proceeds normally

#### Scenario: Idempotent re-click after success returns existing workout without re-billing

- **GIVEN** an activity already converted via AI on a prior call
- **WHEN** the user clicks `[AI process]` again
- **THEN** the use case returns `{ ok: true, created: false }` after a single read; no `generateWorkoutKrd` call fires; the dialog navigates to the existing `/workout/:id`

### Requirement: Manual creation from coaching activity (template KRD)

The system SHALL provide a use case `convertCoachingActivityManual(activityId)` that creates a structured workout with a placeholder KRD template AND its `SessionMatch` atomically. The use case:

1. Reads the `CoachingActivityRecord` by id.
2. Computes `namespacedSourceId = ${activity.profileId}:${activity.sourceId}`.
3. Calls `WorkoutRepository.getBySourceId(activity.source, namespacedSourceId)`. If a `WorkoutRecord` already exists, returns its id (idempotent) AND ensures a matching `SessionMatch` row exists (creates one silently if missing).
4. Otherwise, persists a new `WorkoutRecord` with `state: "structured"`, `krd: <minimal-template>`, `raw.description: activity.description ?? ""`, `source`, `sourceId: namespacedSourceId`, `date`, `sport`, `title`, fresh `nanoid()` id. The minimal template SHALL contain exactly one warmup step (`{ type: "interval", duration: { value: 600, unit: "s" }, target: { kind: "zone", zoneNumber: 1 } }`) so the editor renders a non-empty starting point. `aiMeta` SHALL be `null`.
5. Writes a `SessionMatch` row with `source: "auto-coaching"`, `profileId: activity.profileId`, `coachingActivityId: activity.id`, `workoutId`, `date: activity.date`.
6. Returns `{ workoutId, created }`.

The use case is synchronous (no LLM calls). Re-running on an already-converted activity is idempotent (returns existing id, ensures match).

#### Scenario: First-time manual conversion

- **GIVEN** an activity `A` with no existing workout
- **WHEN** the user clicks `[Edit manually]`
- **THEN** a new `WorkoutRecord` with `state="structured"`, `krd.steps=[<warmup template>]`, and `raw.description=activity.description` is persisted; a new `SessionMatch` linking `A` to the workout is persisted; the use case returns `{ created: true }`; the user navigates to `/workout/:id`

#### Scenario: Manual creation preserves coach description in raw

- **WHEN** `convertCoachingActivityManual` runs successfully
- **THEN** the resulting `WorkoutRecord.raw.description` SHALL equal the source `activity.description`; the EditorPage sidebar reads from this field to render the read-only coach description alongside the KRD step editor

#### Scenario: Idempotent re-click returns existing workout

- **GIVEN** an activity already converted via Manual on a prior call
- **WHEN** the user clicks `[Edit manually]` again
- **THEN** the use case returns `{ created: false }` and the existing workout id; no new template is written

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

The dialog's primary actions SHALL be driven by the resolved dialog state (`no-workout` / `converted` / `matched`), as defined in the `Coaching dialog 3-state orchestrator UI` requirement. The legacy "Convert to workout" + "Match to…" two-button affordance is replaced by:

- `no-workout` state → `[AI process]`, `[Edit manually]`, `[Match existing]`, `[Close]`
- `converted` state (legacy data; auto-heals to matched on first render)
- `matched` state → `[Open editor]` + workout-state-contextual actions + `[Split / Unmatch]` + `[Close]`

The Match-existing picker SHALL list `WorkoutRecord`s for the active profile that satisfy ALL of: (a) same `date` as the activity, (b) same canonical `sport` family per `autoMatchSessions`'s `same date AND same sport` rule, and (c) NOT already part of a `SessionMatch` row **for the active profile**. Workouts matched in another profile remain candidates here because `SessionMatch` uniqueness is profile-scoped (this property is currently asserted in the archived `spa-session-match` spec under the `SessionMatch aggregate` requirement, scenario "Same workout matched in two profiles" — to be promoted into the active `openspec/specs/spa-session-match/` capability by the follow-up `/opsx-sync` operation; this change relies on it as a documented invariant, not on its current physical location). Selecting one SHALL invoke `matchSession({ source: "manual", profileId, coachingActivityId, workoutId })`. After a successful match, the dialog SHALL re-render in matched state without closing.

The "Linked workout" section in matched state SHALL show the matched workout's title, sport, duration, AND its current `state`. The `[Split / Unmatch]` action invokes `unmatchSession({ profileId, coachingActivityId, workoutId })`. After a successful split, the dialog SHALL re-render in `no-workout` state without closing — provided the underlying workout still exists. (Splitting only removes the `SessionMatch` row; the `WorkoutRecord` itself is preserved so the user can still find it via search/navigation.)

Interactions with mutating actions SHALL disable their button during the in-flight write, so a user cannot trigger the same action twice while the first request is pending. The card click handler SHALL only open the dialog (no toggling of the inline description that previous designs used).

The dialog SHALL capture the active `profileId` at open time and pass it explicitly into every write call (`convertCoachingActivityWithAi`, `convertCoachingActivityManual`, `convertCoachingActivity`, `matchSession`, `unmatchSession`, the per-workout AI re-process and Garmin push calls). Use cases SHALL NOT resolve the active profile via `getActiveId()` at submit time. This mirrors the `linkAccount` profile-switch-safe pattern (see "Profile switch mid-link preserves user intent") so a profile switch performed while the dialog is open does not silently rebind a write to the new profile.

The Match-to picker SHALL be keyboard operable: `Tab` focuses the first list item; `ArrowDown` / `ArrowUp` move focus within the list; `Enter` selects the focused item; `Escape` closes the picker without closing the parent dialog (Escape on the parent dialog continues to close the dialog itself).

The dialog SHALL render an AI-processing overlay (spinner + `[Cancel]`) while `convertCoachingActivityWithAi` (or its raw-state re-process variant) is in flight. Pressing `[Cancel]` aborts the LLM request via the use case's AbortController (no workout/match writes occur; see AI-driven creation requirement). Pressing `Escape` during AI processing SHALL behave identically to `[Cancel]` (abort + return dialog to its prior state). Closing the dialog (clicking outside or via the X button) during AI processing SHALL also abort.

#### Scenario: Dialog opens with persisted description

- **WHEN** the user clicks a coaching card and `description` is already populated
- **THEN** the dialog opens immediately with the description visible, and no `read-day` call is made

#### Scenario: Dialog opens and lazy-loads description

- **WHEN** the user clicks a coaching card and `description` is `undefined` (never fetched), and a persisted empty string `""` is treated as "known empty" and does NOT re-fire per `spa-train2go-extension` "Fetch training plan on user action"
- **THEN** the dialog opens with a loading indicator in the description region, fires `read-day`, upserts every activity returned by `read-day` (siblings included), and re-renders with the description

#### Scenario: AI process action navigates after success

- **GIVEN** the dialog in `no-workout` state
- **WHEN** the user clicks `[AI process]` and `convertCoachingActivityWithAi` returns `{ ok: true, workoutId, created: true }`
- **THEN** the spinner clears, the dialog closes, and the user is routed to `/workout/:workoutId` for the resulting structured workout

#### Scenario: Edit manually action navigates after success

- **GIVEN** the dialog in `no-workout` state
- **WHEN** the user clicks `[Edit manually]` and `convertCoachingActivityManual` returns
- **THEN** the dialog closes and the user is routed to `/workout/:workoutId`; the editor renders the template KRD step plus a sidebar containing `activity.description`

#### Scenario: AI processing spinner respects cancel

- **GIVEN** the dialog in `no-workout` state and an in-flight `[AI process]`
- **WHEN** the user clicks `[Cancel]`
- **THEN** the AbortController fires; the LLM request aborts; no workout is created; no match is created; the dialog returns to its `no-workout` action set

#### Scenario: Open editor from matched state

- **GIVEN** the dialog in `matched` state for a workout in `state=structured`
- **WHEN** the user clicks `[Open editor]`
- **THEN** the dialog closes; the user is routed to `/workout/:workoutId`

#### Scenario: Push to Garmin from ready workout

- **GIVEN** the dialog in `matched` state for a workout in `state=ready`
- **WHEN** the user clicks `[Push to Garmin]`
- **THEN** the same Garmin push handler the editor uses is invoked; on success the workout transitions to `state=pushed`; the dialog re-renders without `[Push to Garmin]`

#### Scenario: Match-to picker lists same-day same-sport unmatched workouts

- **GIVEN** the active profile has a coaching activity `A` (sport=cycling, date=2026-05-04) in `no-workout` state
- **AND** every `WorkoutRecord` is profile-agnostic (per `spa-coaching-integration` "Convert coaching activity to workout"); workouts `W1` (cycling, 2026-05-04, matched in `P1`), `W2` (cycling, 2026-05-04, matched in `P2` only — unmatched in `P1`), `W3` (cycling, 2026-05-04, unmatched in any profile), `W5` (running, 2026-05-04, unmatched), and `W6` (cycling, 2026-05-05, unmatched) all exist
- **WHEN** the user clicks `[Match existing]` while in profile `P1`
- **THEN** the picker SHALL list `W2` (matched in P2, unmatched in P1) and `W3` (unmatched anywhere); SHALL NOT list `W1` (matched in P1), `W5` (wrong sport), or `W6` (wrong date)

#### Scenario: Manual match selection promotes dialog to matched state

- **GIVEN** the dialog in `no-workout` state with the picker open
- **WHEN** the user selects a workout `W` from the picker
- **THEN** `matchSession({ source: "manual", profileId, coachingActivityId, workoutId: W })` is invoked; on success the dialog re-renders in `matched` state showing the linked workout; `[AI process]`, `[Edit manually]`, `[Match existing]` are no longer visible

#### Scenario: Split returns dialog to no-workout state

- **GIVEN** the dialog in `matched` state
- **WHEN** the user clicks `[Split / Unmatch]`
- **THEN** `unmatchSession` is invoked; on success the dialog re-renders in `no-workout` state with the original three primary buttons; the workout is no longer linked

### Requirement: Coaching dialog state-contextual workout actions

When the `CoachingActivityDialog` opens for an activity that has a converted workout (matched OR converted-without-match), the dialog SHALL render workout-state-contextual primary actions in addition to the matched-state actions. The dialog observes the workout's `state` field via a `useLiveQuery` keyed on `workoutId`.

| Workout `state` | Primary actions in dialog                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `raw`           | `[Process with AI]` (sync, same flow as `convertCoachingActivityWithAi` but operates on the existing workout id), `[Open editor]` |
| `structured`    | `[Open editor]`, `[Push to Garmin]` (button visible but DISABLED with tooltip "Workout not yet ready")                            |
| `ready`         | `[Open editor]`, `[Push to Garmin]` (enabled)                                                                                     |
| `pushed`        | `[Open editor]` (Push hidden — workout already on Garmin)                                                                         |
| `modified`      | `[Open editor]` only                                                                                                              |
| `stale`         | `[Open editor]` only                                                                                                              |
| `skipped`       | `[Open editor]` only                                                                                                              |

The `[Process with AI]` action for `state=raw` workouts SHALL re-use the same synchronous AI flow defined in `AI-driven creation from coaching activity (synchronous)`, except that on success it transitions the existing `WorkoutRecord` from `raw` to `structured` (per `spa-workout-state-machine` "RAW to STRUCTURED transition via AI") rather than creating a new record. Failure semantics are the same: nothing is persisted on failure; the dialog renders the inline error state. AI cancellation in this branch returns the workout to `raw` state unchanged.

`[Push to Garmin]` SHALL invoke the same Garmin push flow used elsewhere in the SPA (no behavioral divergence, same toasts, same error handling).

The `[Split / Unmatch]` action SHALL remain available alongside these workout actions whenever a `SessionMatch` exists (independent of workout state), preserving the existing capability described in `CoachingActivityDialog`.

#### Scenario: Raw workout from coaching shows Process with AI

- **GIVEN** an activity matched to a workout with `state=raw`
- **WHEN** the dialog opens
- **THEN** `[Process with AI]` and `[Open editor]` are rendered; `[Push to Garmin]` is NOT rendered

#### Scenario: Structured workout disables Push

- **GIVEN** an activity matched to a workout with `state=structured`
- **WHEN** the dialog opens
- **THEN** `[Open editor]` is enabled; `[Push to Garmin]` is rendered but disabled with tooltip "Workout not yet ready"

#### Scenario: Ready workout enables Push

- **GIVEN** an activity matched to a workout with `state=ready`
- **WHEN** the user clicks `[Push to Garmin]` in the dialog
- **THEN** the same Garmin push handler used by the editor fires; on success the workout transitions to `pushed`; the dialog re-renders without `[Push to Garmin]`

#### Scenario: Pushed workout hides Push

- **GIVEN** an activity matched to a workout with `state=pushed`
- **WHEN** the dialog opens
- **THEN** only `[Open editor]` is rendered; `[Push to Garmin]` is NOT rendered (the workout is already on Garmin)

#### Scenario: Re-process AI on raw workout from dialog

- **GIVEN** an activity matched to a workout with `state=raw` (perhaps because a prior AI attempt failed and the user later created via Convert)
- **WHEN** the user clicks `[Process with AI]` in the dialog
- **THEN** the same sync AI flow runs; on success the workout transitions to `state=structured` with KRD + `aiMeta` populated; the dialog navigates to the editor

#### Scenario: AI cancellation on existing raw workout leaves state unchanged

- **GIVEN** an in-flight `[Process with AI]` on an existing raw workout
- **WHEN** the user clicks `[Cancel]`
- **THEN** the workout's `state` remains `raw`; no `aiMeta` is written; no `lastProcessingError` is written; the dialog returns to its raw-state action set

### Requirement: Coaching dialog 3-state orchestrator UI

The `CoachingActivityDialog` SHALL render in one of three states determined by the persistence layer at open time and re-evaluated on every Dexie live-query update:

1. **no-workout**: no `WorkoutRecord` exists for `(activity.source, namespacedSourceId)` AND no `SessionMatch` exists for the activity. Primary actions: `[AI process]`, `[Edit manually]`, `[Match existing]`, `[Close]`.
2. **converted**: a `WorkoutRecord` exists for the activity but NO `SessionMatch` exists (legacy data path; will be retroactively healed by Dexie v10 migration on next boot). The dialog SHALL silently create the missing `SessionMatch` on dialog open and immediately re-render in `matched` state. Primary actions during the brief converted-only window are the same as `matched`.
3. **matched**: a `SessionMatch` row exists. Primary actions: `[Open editor]` plus the workout-state-contextual actions defined in the contextual-actions requirement, plus `[Split / Unmatch]`.

The dialog SHALL emit an analytics event `coaching.dialog.state_observed` with the resolved state on every dialog open (one event per open, NOT per re-render).

`[AI process]` SHALL be enabled regardless of `activity.description` content (per AI-driven creation requirement; empty description falls back to title+sport). When the description is empty, the dialog SHALL render an info hint `"ℹ AI usará solo title + sport"` immediately above the action buttons.

`[Edit manually]` SHALL be enabled regardless of activity status (`pending`, `completed`, `skipped`).

`[Match existing]` SHALL be enabled in `no-workout` state and hidden in `converted` and `matched` states (a workout already exists; matching it again would conflict with the active match). This replaces the prior "Match to…" affordance which used the activity-without-converted-workout shape.

#### Scenario: Dialog renders no-workout state

- **GIVEN** an activity with no existing `WorkoutRecord` and no `SessionMatch`
- **WHEN** the user clicks the activity card
- **THEN** the dialog opens with `[AI process]`, `[Edit manually]`, `[Match existing]`, `[Close]` buttons; analytics emits `coaching.dialog.state_observed` with `state="no-workout"`

#### Scenario: Dialog auto-heals converted-without-match state

- **GIVEN** an activity with a `WorkoutRecord` (from old Convert flow) but no `SessionMatch`
- **WHEN** the user clicks the card
- **THEN** the dialog opens; on first render it silently calls `matchSession({ source: "auto-coaching", profileId, coachingActivityId, workoutId })`; the live query fires and the dialog re-renders in `matched` state showing the linked workout and contextual actions

#### Scenario: Dialog renders matched state

- **GIVEN** an activity with both a `WorkoutRecord` and a `SessionMatch`
- **WHEN** the user clicks the card
- **THEN** the dialog opens with `[Open editor]`, the workout-state-contextual action(s), and `[Split / Unmatch]`; `[AI process]`, `[Edit manually]`, `[Match existing]` are NOT rendered

#### Scenario: Idempotent re-click on AI process during in-flight call

- **GIVEN** an in-flight `[AI process]` for an activity in `no-workout` state
- **WHEN** the user clicks `[AI process]` again
- **THEN** the second click is ignored (button is disabled while the request is pending); only one `generateWorkoutKrd` call is made

#### Scenario: AI failure renders inline error with retry options

- **GIVEN** the dialog in `no-workout` state and an `[AI process]` click that fails
- **WHEN** the use case returns `{ ok: false, reason: "ai-error", error: "Model returned invalid KRD" }`
- **THEN** the dialog spinner clears; the dialog renders `⚠ AI processing failed: Model returned invalid KRD` with primary buttons `[Retry AI]`, `[Edit manually]`, `[Match existing]`, `[Close]`

#### Scenario: Empty description shows info hint

- **GIVEN** an activity with `description=""` (or `undefined`) in `no-workout` state
- **WHEN** the dialog opens
- **THEN** an info hint `"ℹ AI usará solo title + sport"` is rendered above the buttons; `[AI process]` is enabled

### Requirement: Dexie v10 retro-match migration

A one-time Dexie schema upgrade from v9 to v10 SHALL execute on next app boot for every browser. The migration SHALL:

1. Open a transaction over `coachingActivities`, `workouts`, and `sessionMatches` tables.
2. For each `CoachingActivityRecord` in the table:
   - Compute `namespacedSourceId = ${activity.profileId}:${activity.sourceId}`.
   - Look up `WorkoutRepository.getBySourceId(activity.source, namespacedSourceId)`. If no workout, skip.
   - Look up the activity's `SessionMatch` by `(profileId, coachingActivityId)`. If a match exists, skip.
   - Otherwise, create a `SessionMatch` row with `source: "auto-coaching-v10-migration"`, `profileId`, `coachingActivityId: activity.id`, `workoutId`, `date: activity.date`.
3. Track the count of matches created.
4. After migration, dispatch a single info toast `"N workouts linked to coaching activities"` IF `N > 0`. If `N === 0`, no toast.
5. Emit a single analytics event `coaching.dexie_v10.migrated` with the count.

The migration SHALL NOT delete or modify existing `SessionMatch` rows. The migration SHALL be idempotent at the row level: re-running over already-matched data produces zero new matches.

#### Scenario: Migration creates missing matches

- **GIVEN** a v9 database with 3 converted activities AND 0 corresponding SessionMatch rows
- **WHEN** the v10 migration runs
- **THEN** 3 new SessionMatch rows are created with `source="auto-coaching-v10-migration"`; an info toast "3 workouts linked to coaching activities" is shown; analytics emits `coaching.dexie_v10.migrated` with count=3

#### Scenario: Migration skips already-matched pairs

- **GIVEN** a v9 database with 2 converted activities, 1 of which already has a SessionMatch
- **WHEN** the v10 migration runs
- **THEN** exactly 1 new SessionMatch row is created (for the unmatched activity); the already-matched activity is untouched; toast reads "1 workout linked to coaching activities"

#### Scenario: Migration is no-op on clean database

- **GIVEN** a v9 database where every converted activity is already matched
- **WHEN** the v10 migration runs
- **THEN** no SessionMatch rows are created; no toast is shown; analytics emits `coaching.dexie_v10.migrated` with count=0

#### Scenario: Migration preserves cross-profile separation

- **GIVEN** a v9 database with profile A and profile B both linked to the same Train2Go account; activity 12345 converted in A but not in B
- **WHEN** the v10 migration runs
- **THEN** profile A gets a new SessionMatch for activity 12345; profile B does not (it has no converted workout for that activity); the namespaced sourceId join keeps the profiles' results separate

### Requirement: EditorPage sidebar for coaching-derived workouts

When the EditorPage opens a workout, it SHALL determine whether the workout is derived from a coaching activity by reading `SessionMatchRepository.getByWorkoutId(workoutId)`. If a match exists with `source ∈ { "auto-coaching", "auto-coaching-v10-migration", "manual" }` AND the linked `coachingActivities` row is non-deleted, the EditorPage SHALL render a left sidebar containing:

- Activity title (heading)
- Sport icon and label
- Status (pending / completed / skipped)
- Coach description (read-only, formatted text — `<p>` paragraphs, `<strong>` markers as plain visual emphasis, and hyperlinks rendered per the safe-linkification requirement)

The sidebar SHALL be collapsible via a toggle button. The collapsed/expanded state SHALL be persisted per-user (localStorage, key `kaiord.editor.coachSidebar.collapsed`). Default state on first render: expanded for viewports ≥ 768px, collapsed for narrower viewports.

Workouts NOT derived from a coaching activity (no SessionMatch, OR matched to a non-coaching source) SHALL NOT render the sidebar. The editor's existing layout for non-coaching workouts is unchanged.

The sidebar is read-only; it never mutates `activity.description` or any other field. Changes to the upstream coach description (via bridge re-sync) update the sidebar reactively via the existing `coachingActivities` live query.

#### Scenario: Sidebar renders for AI-converted workout

- **GIVEN** a workout created via `convertCoachingActivityWithAi` (and therefore session-matched to a coaching activity)
- **WHEN** the user opens its EditorPage
- **THEN** the left sidebar renders with the activity's title, sport, status, and coach description; the editor's KRD step list renders alongside it

#### Scenario: Sidebar renders for manually-created workout

- **GIVEN** a workout created via `convertCoachingActivityManual`
- **WHEN** the user opens its EditorPage
- **THEN** the sidebar renders with the activity's coach description (preserved in `raw.description` per the manual-creation requirement); the KRD shows the placeholder warmup step

#### Scenario: Sidebar absent for non-coaching workout

- **GIVEN** a workout with no SessionMatch (e.g., a manually-created standalone workout)
- **WHEN** the user opens its EditorPage
- **THEN** no sidebar renders; the editor uses its full-width layout

#### Scenario: Sidebar description with a link is clickable

- **GIVEN** a coaching-derived workout whose activity description contains `[vídeo técnica](https://youtu.be/abc123)`
- **WHEN** the user opens its EditorPage
- **THEN** the sidebar renders `vídeo técnica` as an `https`-only anchor with `target="_blank"` and `rel="noopener noreferrer"`, per the safe-linkification requirement

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

### Requirement: Safe linkification of coaching text

The SPA SHALL render coaching-sourced text (activity descriptions and day-comment bodies) through a single shared formatter that produces a structured AST of inline nodes — `text`, `strong`, and `link` — and a renderer that maps that AST to React elements. The renderer MUST NOT use `dangerouslySetInnerHTML`.

`link` inlines SHALL be produced from two sources:

- Markdown links `[label](url)` as stored by the train2go-bridge parser
- Bare URLs beginning with `https://` appearing in plain text (auto-linkified; covers coach-pasted URLs and data persisted before this change)

The renderer SHALL emit `link` inlines as `<a href={url} target="_blank" rel="noopener noreferrer" title={url}>label</a>`. The full URL in the `title` attribute exposes the real destination when the label differs from the href.

**Scheme allowlist:** only `https:` URLs SHALL become anchors. A markdown link or bare URL with any other scheme (`javascript:`, `data:`, `http:`, etc.) SHALL render as plain text, never as an anchor. This check happens at render time, independent of what the parser stored.

Existing behavior is preserved: `<p>` paragraphs and `**bold**`/`<strong>` markers render as before; text without links is unaffected.

#### Scenario: Markdown link renders as a safe anchor

- **WHEN** a coaching description contains `Técnica: [vídeo técnica](https://youtu.be/abc123)`
- **THEN** the rendered output contains an anchor with `href="https://youtu.be/abc123"`, `target="_blank"`, `rel="noopener noreferrer"`, `title="https://youtu.be/abc123"`, and text content `vídeo técnica`

#### Scenario: Bare https URL is auto-linkified

- **WHEN** a coaching description contains `Material en https://www.dropbox.com/s/xyz aquí`
- **THEN** `https://www.dropbox.com/s/xyz` renders as an anchor with that href and the surrounding text renders as plain text

#### Scenario: Non-https scheme is refused

- **WHEN** a coaching description contains `[click](javascript:alert(1))`
- **THEN** no anchor is rendered; the content renders as plain text and no `javascript:` href appears anywhere in the DOM

#### Scenario: Bold and paragraphs unchanged

- **WHEN** a coaching description contains `**Calentamiento:** 20' Z1\n6x(30" Z5)`
- **THEN** rendering is identical to the pre-change behavior: a strong inline for `Calentamiento:` and two paragraphs, with no anchors

