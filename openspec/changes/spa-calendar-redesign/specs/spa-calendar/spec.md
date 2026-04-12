## ADDED Requirements

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

Clicking a workout card SHALL navigate to the editor. Clicking an empty day SHALL offer options to add a workout.

#### Scenario: Click RAW workout

- **WHEN** the user clicks a RAW workout card
- **THEN** the system SHALL navigate to `/workout/:id` showing the coach's description, selectable comments, and action buttons: "Process with AI", "Skip", "Create manually"

#### Scenario: Click empty day

- **WHEN** the user clicks an empty calendar day
- **THEN** the system SHALL offer "Add from Library" and "Create new workout" options, with the date pre-filled

### Requirement: Batch AI processing banner

The calendar SHALL display a batch processing banner when RAW workouts exist in the current week.

#### Scenario: Week has RAW workouts

- **WHEN** the current week contains N workouts with state `raw`
- **THEN** the calendar SHALL display "N raw workouts this week [Process all with AI]" banner

#### Scenario: Batch processing progress

- **WHEN** the user initiates batch processing
- **THEN** the system SHALL display a progress indicator ("Processing X of N") with per-workout status (success/fail/queued) and a cancel button
