## ADDED Requirements

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

## MODIFIED Requirements

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
