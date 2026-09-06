## MODIFIED Requirements

### Requirement: STRUCTURED to READY transition via user acceptance

A STRUCTURED workout SHALL transition to READY as part of the send, not as a
separate decision. There SHALL NOT be a user-facing control whose only effect
is this transition: "Accept Workout" and "Push to Garmin" were two
confirmations of one intention, rendered on two different states of the same
bar, so they could never be seen together.

The send action SHALL apply `structured → ready` and `ready → pushed` as one
operation. Both states, their invariants and their `modifiedAt` semantics are
unchanged; only the number of clicks that reach PUSHED from STRUCTURED is.

#### Scenario: User sends a structured workout

- **WHEN** the user sends a STRUCTURED workout and the bridge confirms success
- **THEN** the state SHALL transition to `pushed` and `garminPushId` SHALL
  contain the Garmin workout ID, without an intermediate user confirmation

#### Scenario: No accept control is offered

- **WHEN** a STRUCTURED workout is open in the editor
- **THEN** the screen SHALL offer exactly one control that can reach the watch,
  and SHALL NOT offer a separate control that only marks the workout accepted

### Requirement: READY to PUSHED transition via Garmin push

A READY workout SHALL transition to PUSHED when successfully pushed to Garmin
Connect. The `garminPushId` field SHALL be populated. A MODIFIED workout SHALL
follow the same path with the same single control — re-sending is the same
intention as sending, so it SHALL NOT have a verb of its own.

The transition SHALL be applied only after the bridge confirms the send. A
failed or refused send SHALL leave the state untouched.

#### Scenario: Successful push to Garmin

- **WHEN** the user sends a READY workout to Garmin Connect and the bridge
  confirms success
- **THEN** the state SHALL transition to `pushed` and `garminPushId` SHALL
  contain the Garmin workout ID

#### Scenario: Send that the bridge does not confirm

- **WHEN** the send fails, or the export route refuses it
- **THEN** the state SHALL NOT change, and the cause SHALL be rendered rather
  than the control being hidden
