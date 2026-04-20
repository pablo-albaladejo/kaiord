## ADDED Requirements

### Requirement: modifiedAt is advanced by every KRD mutator

The existing sentence in `STALE detection via rawHash` — "The `modifiedAt` field SHALL be updated on any user edit to the KRD, not only on PUSHED→MODIFIED transitions" — SHALL be implemented by routing every user-initiated KRD mutation through a single `onWorkoutMutation(draft, state)` helper in `application/workout-transitions.ts`. The helper SHALL unconditionally advance `modifiedAt` to `Date.now()` before persisting.

#### Scenario: Editing a STRUCTURED workout advances modifiedAt

- **GIVEN** a workout in `structured` state with `modifiedAt === T0`
- **WHEN** the user edits any step, lap, or metadata field (rename, reorder, duration change, zone change)
- **THEN** the persisted workout SHALL have `modifiedAt > T0`
- **AND** the state SHALL remain `structured` (this requirement does not change state; it only updates the timestamp)

#### Scenario: Editing a READY workout advances modifiedAt

- **GIVEN** a workout in `ready` state with `modifiedAt === T0`
- **WHEN** the user edits the KRD (any mutator)
- **THEN** the persisted workout SHALL have `modifiedAt > T0`
- **AND** the state SHALL remain `ready`

#### Scenario: Non-mutating actions do not advance modifiedAt

- **GIVEN** a workout with `modifiedAt === T0`
- **WHEN** the user opens the workout, selects a step, or navigates between tabs (no edit)
- **THEN** `modifiedAt` SHALL remain equal to T0
