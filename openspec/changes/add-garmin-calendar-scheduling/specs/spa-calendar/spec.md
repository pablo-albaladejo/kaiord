## ADDED Requirements

### Requirement: Send week to Garmin

The calendar header SHALL offer a "Send week" action that places every workout of the visible week on the Garmin calendar, past days included. It SHALL be offered only when a `workout` export route to `garmin-bridge` is enabled.

- **Candidates**: every workout in the visible week. `raw`, `skipped` and `stale` workouts SHALL be reported `not-eligible`, each with its reason (a `stale` workout needs the coach's change resolved first).
- **Pre-flight, once per run**: the export route, Web Locks and the bridge's `calendar-write-v1` feature. A pre-flight failure SHALL show one message and make 0 calls.
- **Runner**: sequential, 500 ms between items, each item through the same `pushWorkoutToGarminCalendar` pipeline with its own per-record lock, using the quiet push that never sets the global push state. A failure SHALL NOT stop the run. The run SHALL be cancellable between items.
- **Statuses**: `scheduled`, `moved`, `unchanged`, `duplicate-left`, `uncertain`, `not-eligible`, `failed`. `library-only` cannot occur, because the pre-flight requires Web Locks.
- **Retry failed**: SHALL re-run only the retryable failures whose `retryAfter` has passed, and SHALL make 0 calls for any other item.
- **Analytics**: `garmin-calendar-bulk{counts}`, per-status counts only.

#### Scenario: A partial failure continues and reports every status

- **GIVEN** a week of eligible workouts where the bridge fails session k
- **WHEN** the athlete sends the week
- **THEN** every other session SHALL be placed, session k SHALL be listed as `failed`, and the global push state SHALL never be set

#### Scenario: Retry touches only the retryable failures

- **GIVEN** a finished run with one retryable failure whose `retryAfter` has passed
- **WHEN** the athlete chooses "Retry failed"
- **THEN** only that session SHALL be pushed, and the week SHALL end with exactly 1 calendar entry per eligible session

#### Scenario: A failed pre-flight makes no calls

- **GIVEN** a bridge without `calendar-write-v1`
- **WHEN** the athlete sends the week
- **THEN** one message SHALL explain the bridge must be updated and 0 calls SHALL be made
