## ADDED Requirements

### Requirement: The Garmin Connector reads Garmin's answers

The Garmin Connector in the Kaiord App SHALL build every path it asks the extension for, refuse an invalid Garmin id or date before sending anything, read the schedule id of a placement, keep only one workout's entries (schedule id and date) of a calendar month and fail the read on a payload that is not the expected shape, and pace the activities pull (one per 30 s, none while one is in flight, three attempts with backoff on the current extension).

#### Scenario: A month that cannot be read is not "found none"

- **GIVEN** Garmin answers a month without `calendarItems`
- **WHEN** the Connector looks for a workout's entries
- **THEN** the answer is `unexpected-payload`, retryable, never an empty list
