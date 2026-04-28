## MODIFIED Requirements

### Requirement: Click interactions on calendar

Clicking a workout card SHALL navigate to the editor. Clicking a coaching activity card SHALL open a `CoachingActivityDialog` modal (see `spa-coaching-integration`) — the prior in-place description toggle is replaced. Clicking an empty day SHALL offer options to add a workout.

#### Scenario: Click RAW workout

- **WHEN** the user clicks a RAW workout card
- **THEN** the system SHALL navigate to `/workout/:id` showing the coach's description, selectable comments, and action buttons: "Process with AI", "Skip", "Create manually"

#### Scenario: Click coaching activity card

- **WHEN** the user clicks a coaching activity card (T2G or other source)
- **THEN** the system SHALL open the `CoachingActivityDialog` for that activity (no in-place toggle, no editor navigation)

#### Scenario: Click empty day

- **WHEN** the user clicks an empty calendar day
- **THEN** the system SHALL offer "Add from Library" and "Create new workout" options, with the date pre-filled

## ADDED Requirements

### Requirement: Auto-sync coaching sources on calendar mount and week change

When the active profile has at least one entry in `linkedAccounts`, the calendar SHALL trigger an automatic sync for each linked source on `CalendarPage` mount and on every week navigation. Auto-sync SHALL be skipped when the `coachingSyncState` row for `(source, profileId)` (read via `getBySourceAndProfile`) shows `now - lastSyncedAt < 10 minutes`. Dialog open is non-blocking — the dialog renders immediately; description fetch (if needed) happens lazily without delaying the open. See `spa-coaching-integration` for `CoachingActivityDialog` content semantics.

The user-facing manual "Sync" button SHALL bypass the staleness gate. Auto-sync errors SHALL be silent (set `lastError` only — no toast), so an offline / closed-tab state does not produce repeated noise.

#### Scenario: Mount with stale sync state triggers fetch

- **WHEN** the user opens `/calendar` and the active profile has a linked Train2Go account with `lastSyncedAt` 30 minutes ago
- **THEN** the calendar fires `syncWeek(currentWeekStart)` for the Train2Go source

#### Scenario: Mount with fresh sync state skips fetch

- **WHEN** the user opens `/calendar` and `lastSyncedAt` is 4 minutes ago
- **THEN** the calendar does not fire any sync; persisted activities render immediately

#### Scenario: Week navigation triggers fetch for new week

- **WHEN** the user navigates from week W1 to week W2 and `lastSyncedAt` for W2 (or for the source overall) is stale
- **THEN** the calendar fires `syncWeek(W2.start)`

#### Scenario: Profile with no linked accounts does not auto-sync

- **WHEN** the active profile has `linkedAccounts: []`
- **THEN** no sync is triggered on mount or week change, and no Sync button appears in the header
