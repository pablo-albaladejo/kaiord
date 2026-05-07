> Synced: 2026-04-27

# SPA Workout State Machine

## Purpose

Workout lifecycle — raw, structured, ready, pushed, modified, stale, skipped — and the transitions (AI generation, explicit finalize, Garmin push, user edits, raw-content change detection) that move workouts between those states.

## Requirements

### Requirement: Workout lifecycle states

Every workout record SHALL have a `state` field with one of these values: `raw`, `structured`, `ready`, `pushed`, `modified`, `stale`, `skipped`. The initial state SHALL be determined by the creation path:

- Locally created workouts (via "Add workout" UI) SHALL start in `structured` state.
- Workouts imported from external sources via the legacy bridge-import path SHALL start in `raw` state.
- Workouts created via `convertCoachingActivityWithAi` SHALL start in `structured` state with KRD and `aiMeta` populated atomically.
- Workouts created via `convertCoachingActivityManual` SHALL start in `structured` state with a template KRD (1 placeholder step) and `aiMeta=null`.
- Workouts created via the legacy `convertCoachingActivity` (used as fallback / idempotency path) SHALL start in `raw` state with `raw.description = activity.description`.

#### Scenario: Import from external source

- **WHEN** a bridge imports a workout from Train2Go via the legacy raw-import path
- **THEN** the workout SHALL be created with state `raw`, containing the natural language description in `raw.description` and comments in `raw.comments`

#### Scenario: Create locally

- **WHEN** the user creates a new workout in the editor (standalone, not derived from a coaching activity)
- **THEN** the workout SHALL be created with state `structured` and a valid KRD in the `krd` field; `raw` SHALL be the empty initial value (no description, no comments)

#### Scenario: Create from coaching activity via AI

- **WHEN** the user triggers `convertCoachingActivityWithAi` and the LLM returns a valid KRD
- **THEN** the workout SHALL be created with state `structured`, KRD populated from the LLM response, `aiMeta` recording the run, and `raw.description` mirroring the source `activity.description`

#### Scenario: Create from coaching activity manually

- **WHEN** the user triggers `convertCoachingActivityManual`
- **THEN** the workout SHALL be created with state `structured`, a 1-step KRD template (warmup placeholder), `aiMeta=null`, and `raw.description` mirroring the source `activity.description`

#### Scenario: Create from coaching activity via legacy convert

- **WHEN** the user triggers the legacy `convertCoachingActivity` (e.g., from a UI surface that has not been updated to use AI/Manual)
- **THEN** the workout SHALL be created with state `raw`, `raw.description` set, and no KRD; the workout follows the existing RAW → STRUCTURED transition rules

### Requirement: Coaching-derived creation paths

Two new entry transitions SHALL produce workouts directly from coaching activities, bypassing the legacy raw-then-AI two-step path. Both paths preserve the coach description in `raw.description` for sidebar rendering by the EditorPage; both paths atomically create a `SessionMatch` linking the workout to the source coaching activity (per `spa-coaching-integration` "AI-driven creation from coaching activity (synchronous)" and "Manual creation from coaching activity (template KRD)").

1. **AI path (sync from dialog)**: `convertCoachingActivityWithAi` invokes the LLM and persists a workout in `state="structured"` with the generated `krd` and `aiMeta` populated. The transition `nothing → structured (via AI from coaching)` is atomic — there is no intermediate `raw` state. On AI failure, NO workout is persisted (the failure does not produce a stuck-raw workout).
2. **Manual path (template)**: `convertCoachingActivityManual` persists a workout in `state="structured"` with a 1-step placeholder KRD template. `aiMeta` is `null`. The transition `nothing → structured (via Manual from coaching)` is atomic.

The legacy `convertCoachingActivity` transition (creating a `state="raw"` workout) remains in place as a third path; users who reach it via the existing-converted-already idempotency check or via the AI-failure recovery flow ("Process with AI later") still encounter raw workouts in the calendar.

#### Scenario: AI from coaching produces structured directly

- **WHEN** the user invokes `convertCoachingActivityWithAi` on an activity with no existing workout, and the LLM returns a valid KRD
- **THEN** the workout SHALL be persisted in `state="structured"` with the generated `krd`, `aiMeta` populated (provider, model, prompt version, timestamp), and `raw.description = activity.description ?? ""`; the workout SHALL NOT pass through `state="raw"` at any point

#### Scenario: AI failure from coaching does not persist

- **WHEN** `convertCoachingActivityWithAi` runs and the LLM call fails (error, abort, invalid KRD, timeout)
- **THEN** no `WorkoutRecord` SHALL be created; no `SessionMatch` SHALL be created; the use case returns a typed failure result; the workout state machine has no entry for this attempt

#### Scenario: Manual from coaching produces structured with template KRD

- **WHEN** the user invokes `convertCoachingActivityManual` on an activity with no existing workout
- **THEN** the workout SHALL be persisted in `state="structured"` with `krd.steps=[<warmup placeholder>]`, `aiMeta=null`, and `raw.description = activity.description ?? ""`

#### Scenario: Coach description preserved in raw for sidebar

- **WHEN** either coaching-derived creation path runs successfully
- **THEN** the resulting `WorkoutRecord.raw.description` SHALL equal the source `activity.description`; the EditorPage uses this field to render the read-only coach description sidebar; structured workouts created from coaching are the ONLY structured workouts that legitimately have a populated `raw.description`

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
