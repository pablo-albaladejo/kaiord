> Synced: 2026-04-13

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
- **THEN** the workout SHALL remain in `raw` state and `lastProcessingError` SHALL contain the error message for display

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

When a bridge re-imports a workout whose `raw` content has changed (detected via rawHash comparison), the workout SHALL transition to STALE for states with user work (structured, ready, pushed, modified). For `raw` state (no user work yet), the raw payload SHALL be updated in-place without transitioning to STALE. For `skipped` state, no transition occurs. On STALE transition, `previousState` SHALL record the state before transition. The `modifiedAt` field SHALL be updated on any user edit to the KRD, not only on PUSHED→MODIFIED transitions.

#### Scenario: Coach updates a RAW workout

- **WHEN** a bridge syncs a workout in `raw` state and the newly computed rawHash differs from the stored rawHash
- **THEN** the `raw` payload (description, comments) SHALL be updated in-place, `rawHash` SHALL be recomputed, and the workout SHALL remain in `raw` state (no STALE transition since no user work exists)

#### Scenario: Coach updates a STRUCTURED workout

- **WHEN** a bridge syncs a workout in `structured` state and the newly computed rawHash differs from the stored rawHash
- **THEN** the workout state SHALL transition to `stale`, `previousState` SHALL be set to `structured`, the `raw` payload SHALL be updated, the existing `krd` SHALL be preserved, and `lastProcessingError` SHALL be cleared

#### Scenario: Coach updates a READY workout

- **WHEN** a bridge syncs a workout in `ready` state and the rawHash has changed
- **THEN** the workout state SHALL transition to `stale`, `previousState` SHALL be set to `ready`, the `raw` payload SHALL be updated, and the existing `krd` SHALL be preserved

#### Scenario: Coach updates a PUSHED workout

- **WHEN** a bridge syncs a workout in `pushed` state and the rawHash has changed
- **THEN** the workout state SHALL transition to `stale`, `previousState` SHALL be set to `pushed`, the `raw` payload SHALL be updated, the existing `krd` SHALL be preserved, and `garminPushId` SHALL be preserved

#### Scenario: Coach updates a MODIFIED workout

- **WHEN** a bridge syncs a workout in `modified` state and the rawHash has changed
- **THEN** the workout state SHALL transition to `stale`, `previousState` SHALL be set to `modified`, the `raw` payload SHALL be updated, the user's edited `krd` SHALL be preserved, and `garminPushId` SHALL be preserved

#### Scenario: Coach updates a SKIPPED workout

- **WHEN** a bridge syncs a workout in `skipped` state and the rawHash has changed
- **THEN** the workout SHALL remain in `skipped` state (STALE does NOT apply to skipped workouts)

#### Scenario: rawHash computation

- **WHEN** computing rawHash for a workout
- **THEN** the system SHALL normalize the raw content (trim whitespace, normalize newlines to `\n`, sort comments by timestamp ASC with lexicographic author+text tiebreaker), build a canonical string, encode as UTF-8, compute SHA-256 via `crypto.subtle.digest`, and store as hex

### Requirement: STALE conflict resolution

When a STALE workout has user edits (`modifiedAt > aiMeta.processedAt`), re-processing SHALL require explicit user confirmation. When there are no user edits, re-processing SHALL proceed immediately.

#### Scenario: Re-process stale workout without user edits

- **WHEN** the user clicks "Re-process" on a STALE workout where `modifiedAt` is null or `modifiedAt <= aiMeta.processedAt`
- **THEN** the system SHALL re-process immediately without a confirmation dialog and transition to `structured`

#### Scenario: Re-process stale workout with user edits

- **WHEN** the user clicks "Re-process" on a STALE workout that has been locally modified (`modifiedAt > aiMeta.processedAt`)
- **THEN** the system SHALL display a confirmation dialog with options: "View diff", "Re-process anyway", "Keep my version"

#### Scenario: Re-process stale workout with null aiMeta (manually created)

- **WHEN** the user clicks "Re-process" on a STALE workout where `aiMeta` is null (manually structured, never AI-processed)
- **THEN** the system SHALL show the conflict dialog since user work exists (`modifiedAt !== null` is treated as having user edits when aiMeta is absent)

#### Scenario: Keep user version

- **WHEN** the user selects "Keep my version" on the STALE conflict dialog
- **THEN** the state SHALL transition to `previousState` (the state before STALE), the `raw` payload and `rawHash` SHALL reflect the latest coach content, and the user's KRD SHALL be preserved

### Requirement: SKIPPED state

A RAW workout SHALL be skippable. SKIPPED workouts SHALL not appear in batch processing counts. A SKIPPED workout SHALL be recoverable via un-skip.

#### Scenario: Skip a workout

- **WHEN** the user marks a RAW workout as skipped
- **THEN** the state SHALL transition to `skipped`

#### Scenario: Un-skip a workout

- **WHEN** the user marks a SKIPPED workout as "Reconsider"
- **THEN** the state SHALL transition back to `raw` and the workout SHALL appear in batch processing counts
