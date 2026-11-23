## ADDED Requirements

### Requirement: A Tool's description states its confirmation truthfully

Every chat Tool whose `requiresConfirmation` is true SHALL wait for the
athlete's confirmation card before it runs, with no Tool approved on the
athlete's behalf, and its model-facing description SHALL say "Requires the
user to confirm before running."; a Tool that does not require confirmation
SHALL NOT say so. No description SHALL tell the model a Tool runs without
asking. A test SHALL tie each registered Tool's description to its
`requiresConfirmation`, and another SHALL prove every action Tool parks at the
card. The `create_workout` description SHALL tell the model to pass the
user's or coach's numbers exactly as written, never converted or computed.

#### Scenario: Sending to Garmin waits for the athlete

- **WHEN** the model calls `push_to_garmin`
- **THEN** the turn SHALL stop at the confirmation card and nothing SHALL be sent until the athlete approves

#### Scenario: A description that drifts fails

- **WHEN** an action Tool's description omits the confirmation sentence, or a read Tool's description claims it
- **THEN** the description test SHALL fail naming the Tool
