## ADDED Requirements

### Requirement: Send week to Garmin

The calendar header SHALL offer a "Send week" action that places every workout of the visible week on the Garmin calendar, past days included. It SHALL be offered only when a `workout` export route to `garmin-bridge` is enabled.

- **Candidates**: every workout in the visible week. `raw`, `skipped` and `stale` workouts SHALL be reported `not-eligible`, each with its reason (a `stale` workout needs the coach's change resolved first).
- **Pre-flight, once per run**: the export route, the Garmin Bridge installed, an active Garmin session, and Web Locks. A pre-flight failure SHALL show one message and make 0 calls. A bridge without `calendar-write-v1` SHALL NOT stop the run: every eligible item still reaches the library and ends `library-only{reason:"bridge-outdated"}`.
- **Runner**: sequential, 500 ms between items, each item through the same `pushWorkoutToGarminCalendar` pipeline with its own per-record lock, using the quiet push that never sets the global push state. A failure SHALL NOT stop the run. The run SHALL be cancellable between items.
- **Statuses**: `scheduled`, `moved`, `unchanged`, `duplicate-left`, `uncertain`, `library-only`, `not-eligible`, `failed`. `library-only` SHALL be shown in the warning tone, counted apart from the failures, and explained by ONE notice per run (not one per item) with one action that opens the extension's store page. Only `bridge-outdated` can reach it, because the pre-flight requires Web Locks.
- **Retry**: SHALL re-run only the retryable failures whose `retryAfter` has passed and, once the bridge reports `calendar-write-v1`, the `library-only{reason:"bridge-outdated"}` items. It SHALL make 0 calls for any other item. While a retryable failure's `retryAfter` is still ahead, "Retry" SHALL be disabled and show a countdown to the earliest one.
- **Panel**: each item SHALL link to its workout page, where an `uncertain` or `duplicate-left` item is answered; the bulk panel SHALL NOT offer per-entry answers.
- **Workout state**: an item whose library push Garmin confirmed SHALL record the push id as the chat tool does: `ready` and `modified` become `pushed`, and any other state keeps its state and gets the id.
- **Analytics**: `garmin-calendar-bulk{counts}`, per-status counts only.

#### Scenario: A partial failure continues and reports every status

- **GIVEN** a week of eligible workouts where the bridge fails session k
- **WHEN** the athlete sends the week
- **THEN** every other session SHALL be placed, session k SHALL be listed as `failed`, and the global push state SHALL never be set

#### Scenario: Retry touches only the retryable failures

- **GIVEN** a finished run with one retryable failure whose `retryAfter` has passed
- **WHEN** the athlete chooses "Retry"
- **THEN** only that session SHALL be pushed, and the week SHALL end with exactly 1 calendar entry per eligible session

#### Scenario: A missing Garmin session stops the run before any call

- **GIVEN** the Garmin Bridge is installed but reports no active Garmin session
- **WHEN** the athlete sends the week
- **THEN** one message SHALL ask the athlete to sign in to Garmin Connect, and 0 calls SHALL be made

#### Scenario: Retry waits for the earliest retryAfter

- **GIVEN** a finished run whose only retryable failure has a `retryAfter` 60 s ahead
- **WHEN** the panel is shown
- **THEN** "Retry" SHALL be disabled with a countdown, and SHALL be enabled once that time has passed

#### Scenario: A failed pre-flight makes no calls

- **GIVEN** a context without Web Locks
- **WHEN** the athlete sends the week
- **THEN** one message SHALL explain the calendar needs HTTPS or a supported browser, and 0 calls SHALL be made

#### Scenario: An outdated bridge still fills the library

- **GIVEN** a week of eligible workouts and a bridge without `calendar-write-v1`
- **WHEN** the athlete sends the week
- **THEN** every eligible workout SHALL be pushed to the library with 0 calendar calls and end `library-only`, the summary SHALL show them in the warning tone apart from the failures, and ONE notice SHALL offer the extension update
- **AND** after the bridge reports `calendar-write-v1`, "Retry" SHALL make 0 library pushes and 1 `schedule` call per unchanged workout
