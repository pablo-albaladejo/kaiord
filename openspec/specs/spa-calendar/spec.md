> Synced: 2026-04-28 (train2go-profile-link)

# SPA Calendar

## Purpose

Week-view calendar as the editor's home page — URL-addressable weeks, per-day workout grouping, state indicators, integration with batch processing, and overlay of planned activities from external coaching platforms (Train2Go, TrainingPeaks, etc.).

## Requirements

### Requirement: Calendar week view as home page

The SPA SHALL display a calendar week view as the default home page at `/calendar`. The view SHALL show 7 days (Monday through Sunday) with workout cards for each day. The calendar SHALL support navigation between weeks via previous/next controls and a "Today" button.

#### Scenario: User opens the app

- **WHEN** the user navigates to `/` or `/calendar`
- **THEN** the system SHALL display the current week's calendar view with workout cards for each day that has workouts

#### Scenario: Navigate to specific week

- **WHEN** the user navigates to `/calendar/2026-W15`
- **THEN** the system SHALL display the week of April 6-12, 2026 with all workouts scheduled in that date range

#### Scenario: Week navigation

- **WHEN** the user clicks the "next week" or "previous week" control
- **THEN** the URL SHALL update to the new week ID and the calendar SHALL display that week's workouts

### Requirement: Invalid weekId handling

The calendar SHALL handle invalid or malformed weekId URL parameters gracefully.

#### Scenario: Malformed weekId

- **WHEN** the user navigates to `/calendar/not-a-week` or `/calendar/2026-W99`
- **THEN** the system SHALL redirect to `/calendar` (current week)

### Requirement: Multiple workouts per day

The calendar SHALL support displaying multiple workouts on the same day, ordered by `createdAt` timestamp (ascending).

#### Scenario: Day with multiple workouts

- **WHEN** a calendar day has 3 workouts (e.g., AM swim, PM run, strength)
- **THEN** the cards SHALL be displayed stacked in `createdAt` ascending order within the day column

### Requirement: Workout cards with state indicators

Each workout on the calendar SHALL be displayed as a card showing sport type, duration/distance, source, and a state indicator. State indicators SHALL follow this visual priority order: STALE (orange) > MODIFIED > RAW (warning) > STRUCTURED > READY (star) > PUSHED (check) > SKIPPED.

#### Scenario: RAW workout card

- **WHEN** a workout with state `raw` is displayed on the calendar
- **THEN** the card SHALL show a warning indicator (⚠️), the workout title, sport icon, and the source name

#### Scenario: PUSHED workout card

- **WHEN** a workout with state `pushed` is displayed on the calendar
- **THEN** the card SHALL show a check indicator (✓), the workout title, sport icon, step count, and estimated duration

### Requirement: Calendar skeleton loading

The calendar SHALL display skeleton cards during data hydration. The system SHALL track hydration status as `pending`, `complete`, or `failed`. Empty states SHALL only render after hydration status is `complete`.

#### Scenario: App boot with data

- **WHEN** the app loads and Dexie hydration is in progress
- **THEN** the calendar SHALL display 7 skeleton day columns until hydration completes

#### Scenario: App boot with no data (first visit)

- **WHEN** hydration completes and no workouts exist in any week
- **THEN** the calendar SHALL display the first-visit empty state with three entry paths: create a workout, import a file, connect a platform

### Requirement: Empty week state

The calendar SHALL display a contextual empty state when the current week has no workouts but other weeks do.

#### Scenario: Empty week with data elsewhere

- **WHEN** the current week has no workouts but other weeks contain workouts
- **THEN** the calendar SHALL display "No workouts this week" with an "Add workout" button and a "Go to latest" link

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

### Requirement: Auto-sync coaching sources on calendar mount and week change

When the active profile has at least one entry in `linkedAccounts`, the calendar SHALL trigger an automatic sync for each linked source on `CalendarPage` mount and on every week navigation. Auto-sync SHALL be skipped when the `coachingSyncState` row for `(source, profileId)` (read via `getBySourceAndProfile`) shows `now - lastSyncedAt < 10 minutes`. If no `coachingSyncState` row exists yet for `(source, profileId)`, auto-sync SHALL NOT be skipped (treat as stale) and SHALL call `syncWeek(currentWeekStart)`. Dialog open is non-blocking — the dialog renders immediately; description fetch (if needed) happens lazily without delaying the open. See `spa-coaching-integration` for `CoachingActivityDialog` content semantics.

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

### Requirement: Coaching activities overlay

The calendar SHALL render planned activities from registered coaching sources (e.g., Train2Go) as a separate row of cards above each day's workouts. Coaching activities are read-only and use a generic `CoachingActivity` shape — calendar components SHALL NOT consume platform-specific types directly. Each adapter (e.g., `adapters/train2go/`) maps its raw payload to `CoachingActivity` at the boundary.

The `CoachingActivity` shape SHALL include: `id` (unique across platforms as `"{source}:{platformId}"`), `source` (platform identifier), `sourceBadge` (short UI label), `date` (`YYYY-MM-DD`), `sport` (`{ label, icon }`), `title`, optional `duration`, optional normalised `effort` (1-5), `status` (`pending` | `completed` | `skipped`), and optional `description`.

#### Scenario: Day with coaching activities

- **WHEN** the calendar week contains coaching activities for a given day
- **THEN** the day column SHALL render a stack of `CoachingActivityCard`s above the workout cards, each tagged with the source badge

#### Scenario: Coaching activity card click

- **WHEN** the user clicks a coaching activity card
- **THEN** the card SHALL invoke its `onClick(activity)` handler, which opens `CoachingActivityDialog` with the full coaching description (read-only); the card itself does NOT expand inline

#### Scenario: Empty day with only coaching activities

- **WHEN** a day has coaching activities but no workouts
- **THEN** the calendar SHALL NOT render the empty-day "+" affordance for that day

### Requirement: Batch AI processing banner

The calendar SHALL display a batch processing banner when RAW workouts exist in the current week.

#### Scenario: Week has RAW workouts

- **WHEN** the current week contains N workouts with state `raw`
- **THEN** the calendar SHALL display "N raw workouts this week [Process all with AI]" banner

#### Scenario: Batch processing progress

- **WHEN** the user initiates batch processing
- **THEN** the system SHALL display a progress indicator ("Processing X of N") with per-workout status (success/fail/queued) and a cancel button
