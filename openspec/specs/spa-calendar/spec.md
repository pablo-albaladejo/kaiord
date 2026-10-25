> Synced: 2026-10-13 (connections-single-home)

# SPA Calendar

## Purpose

Week-view calendar as the editor's home page — URL-addressable weeks, per-day workout grouping, state indicators, integration with batch processing, and overlay of planned activities from external coaching platforms (Train2Go, TrainingPeaks, etc.).

## Requirements

### Requirement: Calendar week view

The SPA SHALL display the calendar week view for every `/calendar*` URL: `/calendar/:weekId` SHALL render that week, and bare `/calendar` SHALL redirect (replace, one hop) to `/calendar/<current week>` so the URL family always resolves to one surface. The default home page SHALL be the current week's calendar (`/` replace-redirects to `/calendar/<current week>`); the Daily dashboard remains available at `/daily` (with `/today` redirecting to `/daily`, preserving `?date=`, for back-compat). The Daily dashboard's focus day SHALL be navigable across weeks without bound (previous/next day arrows, or tapping a WeekStrip day). The view SHALL show 7 days (Monday through Sunday) with workout cards for each day. The calendar SHALL support navigation between weeks via previous/next controls and a "Today" button.

#### Scenario: User opens the app

- **WHEN** the user navigates to `/`
- **THEN** the system SHALL redirect (replace) to `/calendar/<current week>` and display the current week's calendar view

#### Scenario: User opens the bare calendar URL

- **WHEN** the user navigates to `/calendar`
- **THEN** the system SHALL redirect (replace) to `/calendar/<current week>` and display the current week's calendar view with workout cards for each day that has workouts

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
- **THEN** the system SHALL redirect (replace, one hop) to `/calendar/<current week>`

### Requirement: Multiple workouts per day

The calendar SHALL support displaying multiple workouts on the same day, ordered by `createdAt` timestamp (ascending).

#### Scenario: Day with multiple workouts

- **WHEN** a calendar day has 3 workouts (e.g., AM swim, PM run, strength)
- **THEN** the cards SHALL be displayed stacked in `createdAt` ascending order within the day column

### Requirement: Workout cards with state indicators

Each workout on the calendar SHALL be displayed as a card showing its title, sport, duration/distance, origin, and a state indicator. The title SHALL be the workout name in its KRD, else the imported title, else the localized sport name. The origin SHALL be named in words in the active language (for example "Kaiord" for a workout made in the editor), never as a raw source identifier. When the import states no duration, the card SHALL show the duration its structure adds up to, if computable. State indicators SHALL follow this visual priority order: STALE (orange) > MODIFIED > RAW (warning) > STRUCTURED > READY (star) > PUSHED (check) > SKIPPED.

#### Scenario: RAW workout card

- **WHEN** a workout with state `raw` is displayed on the calendar
- **THEN** the card SHALL show a warning indicator (⚠️), the workout title, sport icon, and the source name

#### Scenario: PUSHED workout card

- **WHEN** a workout with state `pushed` is displayed on the calendar
- **THEN** the card SHALL show a check indicator (✓), the workout title, sport icon, step count, and estimated duration

#### Scenario: Workout scheduled from the editor

- **GIVEN** a workout named "Tempo" scheduled from the editor, with no imported duration
- **WHEN** it is displayed on the calendar
- **THEN** the card SHALL be titled "Tempo", name its origin as "Kaiord" rather than `scratch`, and show the duration of its steps

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

Clicking a workout card SHALL open that workout's read-only detail view at `/workout/view/:id`, carrying the originating week so Back returns to it; editing is one step further, from the detail. A RAW or SKIPPED workout card, or a projected activity with no persisted workout, SHALL preview in place instead. Clicking a coaching activity card SHALL open a `CoachingActivityDialog` modal (see `spa-coaching-integration`) — the prior in-place description toggle is replaced. Clicking an empty day SHALL offer options to add a workout.

#### Scenario: Click a structured workout

- **WHEN** the user clicks the card of a STRUCTURED, READY, PUSHED or MODIFIED workout
- **THEN** the system SHALL navigate to `/workout/view/:id?from=calendar&week=<weekId>`

#### Scenario: Click RAW workout

- **WHEN** the user clicks a RAW workout card
- **THEN** the system SHALL open the raw workout dialog in place, showing the coach's description and its actions ("Process with AI", "Skip")

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

### Requirement: Auto-match suggestion banner mounted in CalendarPage

`CalendarPage` SHALL render an `AutoMatchBanner` above the week grid whenever `useAutoMatchSuggestions(activeProfileId, weekStart)` returns one or more suggestions for which `isAutoMatchBannerDismissed` returns `false`. The page SHALL filter the raw suggestion list at render time via the per-pair dismissal lookup (see `spa-session-match` "dismissAutoMatchBanner use case"); the heuristic itself is unaware of the dismissal state. When every suggestion in the visible week is either accepted, rejected, or filtered out by a prior dismissal, the banner SHALL NOT render at all.

The banner's per-row Accept SHALL invoke `matchSession({ source: "auto-suggestion", profileId, coachingActivityId, workoutId })`. The banner's per-row Reject SHALL invoke `dismissAutoMatchBanner({ profileId, weekStart, activityId, workoutId })`. Both interactions live in `CalendarPage`; the `AutoMatchBanner` component itself is concerned only with rendering and event emission.

The dismissal lookup SHALL be reactive: when a dismissal row is upserted, the page SHALL re-render with the dismissed suggestion no longer visible, without the user navigating away. This is achieved by reading `autoMatchDismissals` via `useLiveQuery` keyed on `(profileId, weekStart)`.

#### Scenario: Banner appears with at least one undismissed suggestion

- **GIVEN** the active profile has linked Train2Go and the visible week has 3 auto-match suggestions
- **AND** `autoMatchDismissals` has no row for `(profileId, weekStart)`
- **WHEN** the calendar mounts
- **THEN** `AutoMatchBanner` is rendered above the week grid with 3 suggestion rows

#### Scenario: Per-pair dismissal hides only that row

- **GIVEN** the banner is rendering 3 suggestion rows
- **WHEN** the user clicks Reject on the second row
- **THEN** `dismissAutoMatchBanner` is invoked for that pair; the row disappears from the banner reactively (no manual reload); the other two rows remain visible

#### Scenario: Banner unmounts when every suggestion is processed or dismissed

- **WHEN** the banner has rendered N suggestion rows and all N have been either accepted, rejected, or filtered by prior dismissals
- **THEN** `AutoMatchBanner` is no longer in the DOM; subsequent renders skip it until the next suggestion-producing event

#### Scenario: Confirmed suggestion is also removed from the banner

- **GIVEN** the banner shows 2 rows
- **WHEN** the user clicks Accept on one row
- **THEN** `matchSession` is invoked with `source: "auto-suggestion"`; the resulting `SessionMatch` row causes `useAutoMatchSuggestions` to no longer surface that pair (the suggestion engine excludes already-matched pairs by definition); the banner re-renders with the remaining row visible

#### Scenario: Dismissed suggestion does not re-surface across navigations within the same week

- **GIVEN** the user dismisses suggestion `(A, X)` on `weekStart = "2026-05-04"`
- **WHEN** the user navigates to a different week and returns to `2026-05-04`
- **THEN** the banner renders without `(A, X)`; the dismissal persists across navigations within the same week

#### Scenario: Dismissal survives full browser reload

- **GIVEN** the user dismisses suggestion `(A, X)` on `weekStart = W`
- **WHEN** the user reloads the page (e.g., F5; full document reload, not SPA route change)
- **THEN** the calendar re-mounts; `useLiveQuery` reads the dismissal row from IndexedDB; the banner renders without `(A, X)`

#### Scenario: Profile switch isolates dismissal state

- **GIVEN** the user dismisses suggestion `(A, X)` on profile `P1` for week `W`, where activity `A` belongs to `P1` and workout `X` is profile-agnostic
- **WHEN** the active profile switches to `P2` and `P2`'s calendar renders for the same `W`. `P2` has its own coaching activity `A'` for the same date and sport (different id from `A`, since coaching activities are per-profile per `spa-coaching-integration`'s linked-account model), and `autoMatchSessions` produces a suggestion `(A', X)` pairing `A'` with the same profile-agnostic workout `X`
- **THEN** the banner renders `(A', X)` because dismissal state is keyed on `(profileId, weekStart, activityId, workoutId)` — `P1`'s dismissal for `(A, X)` cannot match `(A', X)` since `A' ≠ A` AND the row's composite PK includes `profileId`. The user's `P1` verdict does not leak into `P2`'s view, even when the same workout is involved on both sides

### Requirement: CoachingSyncButton connected-state chrome

When the active profile has at least one linked coaching account, the `CoachingSyncButton` rendered in `CalendarHeader` SHALL adopt an icon-only chrome with the following invariants:

- A 32×32 button containing a `RefreshCw` lucide icon, no text label.
- An accessible name of the form `"Sync <Label>"` (e.g., `aria-label="Sync Train2Go"`).
- A native `title` attribute (and matching tooltip) of the form `"<Label> · last sync <relative-time>"` rendered via the new `formatRelativeTime` helper. The relative-time fragment MUST resolve to one of: `"never synced"`, `"just now"`, `"<n>m ago"`, `"<n>h ago"`, `"yesterday"`, `"<n>d ago"`, or an ISO date `YYYY-MM-DD` for older values.
- During an active sync, the icon SHALL be replaced **in place** by a spinner; the button SHALL be disabled while syncing; the tooltip SHALL read `"<Label> · syncing…"`.
- Under `prefers-reduced-motion: reduce`, the spinner SHALL NOT animate; the visual cue SHALL be a static "syncing" icon (e.g., a non-spinning loader glyph) and the tooltip text remains the canonical signal.
- Color tokens MUST be slate-based (`border-slate-300`, `text-slate-700`, `hover:bg-slate-100`) — not the prior rose treatment that competed with the status palette.

The not-connected state ("hint pointing to the Connections page" per `spa-coaching-integration` "Calendar Sync button gated on linked account") is unchanged by this requirement.

#### Scenario: Connected button renders icon-only with relative-time tooltip

- **GIVEN** the active profile has Train2Go linked and `lastSyncedAt = T - 5min`
- **WHEN** the calendar header renders
- **THEN** the button has `aria-label="Sync Train2Go"`, no visible text label, and a tooltip reading `"Train2Go · 5m ago"`

#### Scenario: Never-synced account renders the never-synced tooltip

- **GIVEN** Train2Go is linked but `lastSyncedAt` is undefined (account just linked)
- **WHEN** the calendar header renders
- **THEN** the button tooltip reads `"Train2Go · never synced"`

#### Scenario: Sync in progress swaps the icon for the spinner in place

- **WHEN** the user clicks the button and `syncWeek` is awaiting
- **THEN** the icon is replaced in place by a spinner; the button is disabled; the tooltip reads `"Train2Go · syncing…"`

#### Scenario: Reduced motion disables spinner animation

- **GIVEN** the user has `prefers-reduced-motion: reduce`
- **WHEN** the button enters the syncing state
- **THEN** the loader glyph is static (no rotation animation); the tooltip still updates to `"Train2Go · syncing…"`; sync completion still re-enables the button

### Requirement: Net-balance badge on the calendar

The calendar WellnessBand SHALL display a per-day net energy-balance badge when the
day's balance is resolvable, indicating deficit or surplus, and SHALL omit the badge
when expenditure cannot be resolved.

#### Scenario: Badge shown for a resolvable day

- **GIVEN** a calendar day with resolvable expenditure and logged intake
- **WHEN** the WellnessBand renders
- **THEN** a net-balance badge shows the day's deficit or surplus

#### Scenario: Badge omitted when balance is unresolvable

- **GIVEN** a calendar day with no resolvable expenditure
- **WHEN** the WellnessBand renders
- **THEN** no net-balance badge is shown for that day

### Requirement: Manual surfaces are canonical for mutating a scheduled workout

The workout detail, the editor and their dialogs SHALL be the canonical surfaces for changing a scheduled workout. The conversation SHALL be an accelerator that calls the same use cases (`moveSession`, `saveWorkoutEdits`, `workouts.delete`) rather than a separate write path. Calendar cards SHALL carry no mutation buttons. Dragging a card to another day — a solo workout card or a movable matched (coach) session card — SHALL be the only direct mutation on a calendar card; the coach-move notice's "Move back" and the toast actions SHALL call the same use cases. Dragging SHALL have a keyboard alternative: "Move to another day" in the detail's "More options" menu and in the coaching dialog, both of which run `moveSession`.

#### Scenario: Move a workout with the keyboard

- **GIVEN** a scheduled workout's detail view
- **WHEN** the user opens "More options" with the keyboard, chooses "Move to another day", enters a date and confirms
- **THEN** the workout SHALL move to that day through `moveSession`, and its card SHALL appear on the new day after a reload

#### Scenario: Move a workout deleted meanwhile

- **WHEN** the workout no longer exists as the move is confirmed
- **THEN** `moveSession` SHALL throw `WorkoutNotFoundError`, the user SHALL be told the workout no longer exists, and the detail SHALL show "Workout not found"

### Requirement: Delete a scheduled workout with Undo

The detail's "More options" SHALL offer "Delete workout". Deleting SHALL ask for confirmation, delete through the tombstoning persistence port, return to the previous surface and offer Undo for 10 seconds. Undo SHALL write the workout back with an `updatedAt` later than its tombstone's `deletedAt`, stamped by the use case, so the restored row survives a merge with its own tombstone. Deleting SHALL NOT queue or send any Garmin removal and SHALL leave the Garmin export ledger as it is; when the workout is on the Garmin calendar, the confirmation SHALL say it is not deleted there.

#### Scenario: Undo a delete

- **WHEN** the user deletes a workout and chooses Undo within 10 seconds
- **THEN** the workout SHALL be back on the calendar, and still there after a reload

#### Scenario: Delete holds after a reload

- **WHEN** the user deletes a workout and does not undo
- **THEN** its card SHALL be gone after a reload

### Requirement: Unknown workout id

`/workout/:id` and `/workout/view/:id` SHALL show "Workout not found" with a way back to the calendar once the record lookup settles without a record, instead of loading indefinitely.

#### Scenario: Unknown id

- **WHEN** the user opens either route with an id that matches no workout
- **THEN** the page SHALL say "Workout not found" within 2 seconds

### Requirement: Manual use is the main path

Every journey SHALL be completable by hand, without a connected source, an AI key or a browser extension. Manual surfaces (the editor, the detail views and their dialogs) SHALL be canonical; the conversation SHALL be an accelerator that calls the same use cases, and integrations SHALL be optional accelerators that feed the same tables. The first run SHALL propose creating a workout, importing a file and logging wellness, and SHALL present integrations as optional; empty-state copy SHALL NOT assume a coach. The setup checklist SHALL count only steps a user can complete by hand. The readiness card SHALL offer manual entry when it has no data. A manually scheduled session SHALL count as a source of planned sessions.

#### Scenario: First run without integrations

- **GIVEN** a fresh profile with nothing connected
- **WHEN** the calendar renders its first run
- **THEN** it offers "Add a workout", "Import a file" and "Log wellness", and integrations appear as optional

#### Scenario: Checklist completes by hand

- **GIVEN** a profile with no connection, bridge or export
- **WHEN** the user creates a workout, sets a threshold, logs wellness and saves a workout to the library
- **THEN** the setup checklist reaches 100% and steps aside

#### Scenario: Readiness without data

- **WHEN** the readiness card has no score
- **THEN** it offers to log HRV and sleep by hand

#### Scenario: Manual planning is a source

- **GIVEN** a workout scheduled by hand
- **WHEN** the connections page lists planned sessions
- **THEN** the row has a source and does not read "No source"

### Requirement: The step editor speaks the athlete's units

The step editor SHALL take duration as `m:ss` (or `h:mm:ss`) and pace as `m:ss` per kilometre or mile, or per 100 m or 100 yd for swimming, following the workout's sport and the units preference; storage SHALL remain seconds and metres per second, so a value typed survives an export and a reimport. Each step SHALL have an intensity, and a new workout's first step SHALL be a warm-up. Workout metadata SHALL open read-only. The FTP provenance line SHALL show only when some target depends on FTP. The threshold dialog SHALL open on the active sport; pace sports SHALL lead with pace and LTHR and mark FTP optional; the zone method shown SHALL be the one the stored zones were built with, and a change SHALL say it was saved.

#### Scenario: Pace typed per kilometre survives a round trip

- **GIVEN** a running workout of four steps of 3:00 at 4:30/km typed in the step editor
- **WHEN** the workout is exported to FIT and the file imported back
- **THEN** every step reads 3:00 at 4:30 min/km

#### Scenario: Thresholds open on the active sport

- **GIVEN** Running is the active sport on the athlete page
- **WHEN** the user opens the threshold dialog
- **THEN** the Running tab is selected, pace and LTHR come first and FTP is marked optional

### Requirement: The SPA speaks the active locale and fits a phone

Dates SHALL be formatted with `Intl` in the active locale. Text rendered by the translated surfaces SHALL come from the translation catalogue, and lint SHALL fail on JSX text that is not translated in those directories. On a phone, floating buttons SHALL NOT cover navigation or content, the header SHALL be a single row of at most 64 px, and the first run SHALL leave "New workout" and the week on the first screen. A workout SHALL download from one control, under a filename with accents transliterated, and the confirmation SHALL name the file. A trends chart SHALL span the requested window. A swim step SHALL show its pace per 100 m or 100 yd.

#### Scenario: Calendar day in Spanish

- **GIVEN** the active locale is Spanish
- **WHEN** the week list renders Monday 5 October 2026
- **THEN** its heading reads "lun, 5 oct"

#### Scenario: Phone layout

- **GIVEN** a 390 px wide viewport on the calendar
- **WHEN** the page renders
- **THEN** the "+" button does not overlap "Biblioteca", the header is at most 64 px tall and the week starts on the first screen

#### Scenario: One download control

- **GIVEN** a workout named "Rodaje auditoría"
- **WHEN** the user opens the download control and picks FIT
- **THEN** the file `rodaje_auditoria.fit` downloads and the toast reads "Downloaded as rodaje_auditoria.fit"

#### Scenario: Trends span the window

- **GIVEN** one weight entry in the last 90 days
- **WHEN** the 90-day trend renders
- **THEN** the x axis runs from the window's start to today

### Requirement: CalendarPage render-cost budget

`CalendarPage` SHALL render under two complementary budgets, measured on Chromium under CDP CPU throttle 4×:

- **Render-cost ratio** — showing a week of 30 cards (10 matched sessions, 10 solo plans and 10 solo actuals, every row owned by the active profile) SHALL take at most **2.3×** as long as showing a week of 3 cards (1 / 1 / 1). Each week is shown by an in-app route change from an empty week, timed until its day shows exactly the seeded cards of each kind, and each is sampled 7 times in interleaved pairs, comparing the fastest of each. The guard is a ratio because both weeks take the same path (route change, live queries, match join, render) and differ only in card count: runner speed cancels out, while a per-card cost is multiplied by 30 in one and by 3 in the other. An absolute first contentful paint is NOT asserted: on the dev server it measures loading the module graph, which paints before any card is read and varies with runner speed.
- **`useMatchedSessions` slice** — the hook is measured via `performance.measure` markers placed inside the hook body. With the 30-card week on screen and the page quiescent, the fastest of 5 re-fired measures SHALL stay within a **250 ms** CI envelope, scaled by the runner slowdown a fixed synthetic workload measures on the same throttled page (clamped to 12×). Archived design D16 named 30–60 ms as the aspirational slice; the envelope is wider because the measure wraps an async live query whose wall-clock includes IndexedDB round-trips.

Both budgets are enforced by a Playwright spec at `packages/workout-spa-editor/e2e/calendar-performance.spec.ts` that runs in the existing `e2e-frontend` CI matrix. The spec SHALL document its seed-data shape, the CPU throttling configuration, and the rationale for the render-cost ratio in the file header. Persistent failures across Playwright's default retries SHALL fail the build.

#### Scenario: Every seeded card renders before anything is measured

- **GIVEN** the test seeds the active profile, a week with 10 matched / 10 solo plan / 10 solo actual rows and a week with 1 / 1 / 1, every row carrying the profile's id
- **WHEN** the calendar shows each week
- **THEN** the seeded day shows exactly that many matched-session, coaching-activity and workout cards

#### Scenario: The 30-card week stays within its render-cost ratio

- **GIVEN** the two seeded weeks and CDP CPU throttling at factor 4×
- **WHEN** each week is shown 7 times in interleaved pairs, from an empty week
- **THEN** the fastest 30-card time is at most 2.3× the fastest 3-card time

#### Scenario: useMatchedSessions stays within its CI envelope

- **GIVEN** the 30-card week on screen under the same throttling, with the page quiescent
- **WHEN** the hook's live query is re-fired 5 times by touching a seeded match
- **THEN** the fastest measure is within the 250 ms envelope scaled by the measured runner slowdown

#### Scenario: Build fails on regression

- **WHEN** a code change pushes either the render-cost ratio above 2.3 OR the fastest `useMatchedSessions` re-fire above its envelope across all retries
- **THEN** the `e2e-frontend` job fails and the change is blocked from merging

#### Scenario: Production build emits no perf marks

- **GIVEN** the `useMatchedSessions` hook is built under `import.meta.env.PROD === true` (production bundle)
- **WHEN** the hook executes
- **THEN** no `performance.mark` or `performance.measure` calls are emitted; the production bundle has zero observable perf-instrumentation overhead; the marks ship only under DEV / test modes

### Requirement: The coaching dialog estimates a zone profile from the coach's text

The coaching dialog SHALL estimate a zone profile from the activity's
description when it has no structured zone profile to draw (no linked workout,
or a linked workout without a structured KRD). The estimate SHALL read only explicit zones
(`Z1`–`Z5`, `zona N`, `zone N`), RPE values, and one fixed table of
intensity words that does not depend on the athlete, and SHALL NOT read the
activity's `effort` rating. A range SHALL resolve to its lower bound; a
progression between two different zones SHALL set no zone. Repeat notation
SHALL expand into one segment per step.

A timed segment with no zone SHALL be drawn as a neutral bar of its true
width. No chart SHALL render when no segment has a zone, a segment is
measured by distance, or a stated total differs from the breakdown by more
than max(5 minutes, 15% of the stated total). A rendered
estimate SHALL carry the caption "Estimated from coach text", and its
accessible label SHALL say it is an estimate. The estimate SHALL appear only in
the dialog, never on the calendar card or its zone border.

#### Scenario: Explicit zones and repeats are drawn as an estimate

- **GIVEN** an unprocessed coaching plan whose description is "12' Z1, 4x(3' Z4 + 2' Z1), 10' Z1"
- **WHEN** its dialog opens
- **THEN** the dialog SHALL draw a profile totalling 42 minutes with the caption "Estimated from coach text"

#### Scenario: An unzoned segment is drawn as a neutral gap

- **GIVEN** a description "10' z1 + 30' contrastes"
- **WHEN** its dialog opens
- **THEN** the dialog SHALL draw a 10-minute Z1 bar followed by a 30-minute neutral bar

#### Scenario: A distance segment hides the estimate

- **GIVEN** a description "20' z1, 3x(1K progresivo + 2' trote)"
- **WHEN** its dialog opens
- **THEN** no zone profile SHALL render

#### Scenario: A structured workout wins over the text

- **GIVEN** a plan linked to a workout with a structured KRD
- **WHEN** its dialog opens
- **THEN** the dialog SHALL draw the KRD's profile without the estimate caption

### Requirement: moveSession is the single athlete date writer

`moveSession({ workoutId, targetDay })` SHALL be the only use case through which the athlete changes a workout's date. Inside one persistence transaction it SHALL re-read the workout, take the profile from the re-read workout's `profileId`, write `date = targetDay` and `updatedAt = now`, and, when the workout has a `SessionMatch`, re-date that match to `targetDay` with the same `updatedAt`. It SHALL leave `coachDate`, `state`, `modifiedAt`, `garminPushId` and `krd` untouched. It SHALL return `unchanged` and write nothing when `targetDay` equals the current date. This same-day check SHALL run before the executed and completed checks, on purpose, so that a same-day call for a done session returns `unchanged` and does not throw. Otherwise it MUST throw `SessionNotMovableError` with reason `executed` when the workout's match has at least one executed workout id, when the workout has a match and an activity of the profile is the workout or links to it, or when the workout is itself an executed recording held in some match's `executedWorkoutIds`; and with reason `completed` when the matched coaching activity's status is `completed`. In each of these cases nothing SHALL be written. It MUST throw `WorkoutNotFoundError` when the workout no longer exists. It SHALL NOT call any bridge.

#### Scenario: Moving a matched session re-dates the match

- **GIVEN** a workout on 2026-10-20 with `coachDate` 2026-10-20 and a `SessionMatch` dated 2026-10-20 with no executed ids
- **WHEN** `moveSession` moves it to 2026-10-22
- **THEN** the workout's `date` SHALL be 2026-10-22, its `coachDate` SHALL stay 2026-10-20, its `updatedAt` SHALL be bumped, and the match's `date` SHALL be 2026-10-22 with the same `updatedAt`

#### Scenario: A done session is not moved

- **GIVEN** a matched session whose match has one executed workout id
- **WHEN** `moveSession` is called for it
- **THEN** it SHALL throw `SessionNotMovableError` with reason `executed` and neither the workout nor the match SHALL change

#### Scenario: A recording held by a match is not moved

- **GIVEN** a recording whose id is in a match's `executedWorkoutIds`
- **WHEN** `moveSession` is called for the recording from its detail page
- **THEN** it SHALL throw `SessionNotMovableError` with reason `executed` and nothing SHALL be written

#### Scenario: A recording paired as the planned side is not moved

- **GIVEN** a match whose `workoutId` is a recording an activity links to, and whose `executedWorkoutIds` is empty
- **WHEN** `moveSession` is called for that workout
- **THEN** it SHALL throw `SessionNotMovableError` with reason `executed` and nothing SHALL be written

#### Scenario: Moving to the same day writes nothing

- **WHEN** `moveSession` is called with the workout's current date
- **THEN** it SHALL return `unchanged` and `updatedAt` SHALL NOT change

#### Scenario: Same day for a done session returns unchanged

- **GIVEN** a matched session whose match has an executed workout id
- **WHEN** `moveSession` is called with the workout's current date
- **THEN** it SHALL return `unchanged`, SHALL NOT throw `SessionNotMovableError`, and SHALL write nothing

### Requirement: A moved session renders on its new day

The calendar SHALL bucket a matched session by its `SessionMatch.date`, which is the session's effective date. After `moveSession`, a coach move or a heal commits, the matched card SHALL render only on the new day, and neither a matched card nor a solo card of its workout SHALL render on the old day. The week view SHALL also load, through the `[profileId+coachingActivityId]` index, the matches of the visible week's coaching activities, whatever their date. It SHALL hide those activities' solo plan cards without rendering the matches in that week, and it SHALL hide, as solo cards, those matches' `workoutId` and `executedWorkoutIds`. The Daily view SHALL apply the same rule.

#### Scenario: Athlete-moved session

- **GIVEN** a matched session moved from Tuesday to Thursday of the same week
- **WHEN** the week renders
- **THEN** the matched card SHALL be on Thursday only and no solo card for its workout SHALL appear on either day

#### Scenario: Coach-moved session

- **GIVEN** a matched session the athlete never moved
- **WHEN** a Train2Go sync moves it from Tuesday to Friday
- **THEN** the matched card SHALL be on Friday only

#### Scenario: Session moved into the next week

- **GIVEN** a matched session whose coach activity is on Sunday of week 1, moved to Monday of week 2
- **WHEN** week 1 renders
- **THEN** no solo coach plan card and no matched card for it SHALL appear on Sunday
- **AND WHEN** week 2 renders
- **THEN** the matched card SHALL appear on Monday

#### Scenario: Locked match coach-moved into the next week

- **GIVEN** a coach-built workout with an executed recording, its locked match dated Tuesday of week 1, and a coach move of the workout to Thursday of week 2
- **WHEN** week 2 renders, in the Grid and in the Daily view of Thursday
- **THEN** no solo card for the workout or its recording SHALL appear, and the matched card SHALL stay on Tuesday of week 1

### Requirement: Drag to reschedule a coach session in the Grid view

In the Grid view a `MatchedSessionCard` SHALL be draggable to another day when its session is movable: it has no executed slot, its planned workout is not a recording (no activity of the week is it or links to it), its coaching activity is not `completed`, and its workout is not projected. A drop SHALL call `moveSession`. A card whose session is not movable SHALL NOT get a drag binding. A `CoachingActivityCard` (a coach plan not yet converted to a workout) SHALL NOT be draggable. The List view SHALL keep having no drag.

#### Scenario: Drag a coach session to another day

- **GIVEN** a movable matched session on Tuesday in the Grid view
- **WHEN** the user drags its card to Thursday
- **THEN** the card SHALL render on Thursday and stay there after a reload

#### Scenario: A done session cannot be dragged

- **GIVEN** a matched session with an executed recording
- **WHEN** the user presses and drags its card
- **THEN** no drag SHALL start and the session SHALL stay on its day

#### Scenario: Unconverted coach plan is not draggable

- **WHEN** the user presses and drags a `CoachingActivityCard`
- **THEN** no drag SHALL start

### Requirement: Same-sport target asks before moving

Before any athlete move (drag, dialog, detail, "Move back"), the UI SHALL check the target day for a session of the same canonical sport. It SHALL count the target day's matched sessions, solo workouts and unmatched solo coach plans, and SHALL exclude the moved workout and its own match. Every target day, inside the visible week or outside it, SHALL be checked from stored rows: the `[profileId+date]` indexes of `workouts`, recorded `activities` and `coachingActivities`, plus the profile's `sessionMatches`, so a match dated on another day still holds its plan and its recording. When the check finds a session, the UI SHALL ask for confirmation, and cancelling SHALL write nothing. When the same-sport session on the target day is an executed recording that no match holds, the prompt SHALL also say that the recording will be linked to the moved session, which will then be locked against further moves. A target day holding only other sports SHALL be accepted without a prompt.

#### Scenario: Matched session of the same sport

- **GIVEN** Thursday holds a matched run session
- **WHEN** the user moves another run session onto Thursday and cancels the prompt
- **THEN** nothing SHALL be written

#### Scenario: Solo recording of the same sport

- **GIVEN** Thursday holds a solo run recording
- **WHEN** the user moves a run session onto Thursday
- **THEN** the prompt SHALL say the recording will be linked and the session locked

#### Scenario: Matched session whose recording is held

- **GIVEN** Thursday holds a matched run session whose match already holds its recording
- **WHEN** the athlete moves another run onto Thursday
- **THEN** the prompt SHALL ask for confirmation without the linked-and-locked sentence

#### Scenario: Solo coach plan of the same sport

- **GIVEN** Thursday holds an unmatched coach plan for a run
- **WHEN** the user moves a run session onto Thursday
- **THEN** the prompt SHALL be shown

#### Scenario: Target outside the visible week

- **GIVEN** the visible week is week 1 and Monday of week 2 holds a solo run workout
- **WHEN** the user picks that Monday for a run session in the dialog
- **THEN** the prompt SHALL be shown

#### Scenario: Different sport moves without a prompt

- **GIVEN** Thursday holds only a swim
- **WHEN** the user moves a run session onto Thursday
- **THEN** no prompt SHALL be shown and the session SHALL move
