## ADDED Requirements

### Requirement: Workout lifecycle states

Every workout record SHALL have a `state` field with one of these values: `raw`, `structured`, `ready`, `pushed`, `modified`, `stale`, `skipped`. Locally created workouts SHALL start in `structured` state. Workouts imported from external sources SHALL start in `raw` state.

#### Scenario: Import from external source

- **WHEN** a bridge imports a workout from Train2Go
- **THEN** the workout SHALL be created with state `raw`, containing the natural language description in `raw.description` and comments in `raw.comments`

#### Scenario: Create locally

- **WHEN** the user creates a new workout in the editor
- **THEN** the workout SHALL be created with state `structured` and a valid KRD in the `krd` field

### Requirement: RAW to STRUCTURED transition via AI

A RAW workout SHALL transition to STRUCTURED when the AI processing pipeline generates a valid KRD from the natural language description. The raw payload SHALL be preserved.

#### Scenario: Successful AI processing

- **WHEN** the user triggers AI processing on a RAW workout
- **THEN** the state SHALL transition to `structured`, the `krd` field SHALL contain the generated workout, `aiMeta` SHALL record the prompt version, model, provider, and timestamp, and `raw` SHALL remain unchanged

#### Scenario: AI processing failure

- **WHEN** AI processing fails (invalid JSON, Zod validation error, or API error)
- **THEN** the workout SHALL remain in `raw` state with an error annotation available for display

### Requirement: STRUCTURED to READY transition via user acceptance

A STRUCTURED workout SHALL transition to READY when the user explicitly accepts the AI-generated or manually created structure.

#### Scenario: User accepts structured workout

- **WHEN** the user clicks "Accept" on a STRUCTURED workout
- **THEN** the state SHALL transition to `ready`

### Requirement: READY to PUSHED transition via Garmin push

A READY workout SHALL transition to PUSHED when successfully pushed to Garmin Connect. The `garminPushId` field SHALL be populated.

#### Scenario: Successful push to Garmin

- **WHEN** the user pushes a READY workout to Garmin Connect and the bridge confirms success
- **THEN** the state SHALL transition to `pushed` and `garminPushId` SHALL contain the Garmin workout ID

### Requirement: PUSHED to MODIFIED transition on edit

A PUSHED workout that is edited SHALL transition to MODIFIED, indicating it needs re-pushing.

#### Scenario: Edit a pushed workout

- **WHEN** the user edits the KRD of a PUSHED workout
- **THEN** the state SHALL transition to `modified` and `modifiedAt` SHALL be updated

#### Scenario: Re-push a modified workout

- **WHEN** the user pushes a MODIFIED workout to Garmin Connect
- **THEN** the state SHALL transition to `pushed` and `garminPushId` SHALL be updated

### Requirement: STALE detection via rawHash

When a bridge re-imports a workout whose `raw` content has changed (detected via rawHash comparison), the workout SHALL transition to STALE regardless of its current state (except `skipped`).

#### Scenario: Coach updates workout description

- **WHEN** a bridge syncs a workout and the newly computed rawHash differs from the stored rawHash
- **THEN** the workout state SHALL transition to `stale`

#### Scenario: rawHash computation

- **WHEN** computing rawHash for a workout
- **THEN** the system SHALL normalize the raw content (trim whitespace, normalize newlines to `\n`, sort comments by timestamp ASC with lexicographic author+text tiebreaker), build a canonical string, encode as UTF-8, compute SHA-256 via `crypto.subtle.digest`, and store as hex

### Requirement: STALE conflict resolution

When a STALE workout has user edits (`modifiedAt > aiMeta.processedAt`), re-processing SHALL require explicit user confirmation.

#### Scenario: Re-process stale workout with user edits

- **WHEN** the user clicks "Re-process" on a STALE workout that has been locally modified
- **THEN** the system SHALL display a confirmation dialog with options: "View diff", "Re-process anyway", "Keep my version"

#### Scenario: Keep user version

- **WHEN** the user selects "Keep my version" on the STALE conflict dialog
- **THEN** the STALE flag SHALL be cleared, the raw.rawHash SHALL be updated to the new hash, and the user's KRD SHALL be preserved

### Requirement: SKIPPED state

A RAW workout SHALL be skippable. SKIPPED workouts SHALL not appear in batch processing counts.

#### Scenario: Skip a workout

- **WHEN** the user marks a RAW workout as skipped
- **THEN** the state SHALL transition to `skipped`
