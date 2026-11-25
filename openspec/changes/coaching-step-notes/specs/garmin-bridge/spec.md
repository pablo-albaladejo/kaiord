## ADDED Requirements

### Requirement: A workout body carries a bounded description

The bridge's `workout` body schema SHALL admit an optional workout-level `description` string of at most 1024 characters, and SHALL refuse a longer one with nothing sent. The Garmin writer SHALL cut a Workout's notes longer than 1024 characters to 1024 before it builds the body, so a long coach text is shortened rather than refused.

#### Scenario: A coaching Workout with the coach's text is sent

- **GIVEN** a workout body the writer built, with `description` set to the coach's text
- **WHEN** the App sends it through the bridge
- **THEN** the gate admits it and the request is made

#### Scenario: A description over the cap is refused

- **GIVEN** a workout body whose `description` holds 1025 characters
- **WHEN** it reaches the gate
- **THEN** it is refused with `retryable: false` and no request is made

#### Scenario: The writer cuts a long coach text

- **GIVEN** a Workout whose notes hold 1500 characters
- **WHEN** the Garmin writer converts it
- **THEN** the body's `description` holds its first 1024 characters
