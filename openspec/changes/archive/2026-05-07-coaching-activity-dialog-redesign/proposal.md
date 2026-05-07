> Completed: 2026-05-07

## Why

Today, clicking a coaching activity card opens a dialog with one ambiguous "Convert to workout" button. Convert creates a RAW workout, navigates to the editor, which then shows "This workout has no structured data yet" — a dead end. The user has no obvious path to AI-process the description or to start manual KRD construction. The "Process with AI" affordance exists in `RawWorkoutDialog` but is unreachable from the coaching flow. Convert also fails to create a `session_match`, leaving the calendar with two cards (the activity and the new workout) for the same training session — visual duplication that compounds with every conversion.

This change replaces the single Convert button with a 3-state orchestrator dialog (no-workout / converted / matched) that surfaces the right primary action for each state, runs AI processing synchronously inside the dialog, and creates `session_match` atomically with workout creation so calendar bucketing produces one card per session.

## What Changes

- Coaching activity dialog now switches between three states based on whether a workout exists for the activity:
  - **no-workout** → primary buttons `[AI process]`, `[Edit manually]`, `[Match existing]`, `[Close]`
  - **converted** (workout exists, idempotent re-click) → `[Open editor]` + state-contextual actions
  - **matched** (session_match exists) → `[Open editor]`, `[Split / Unmatch]`, `[Push to Garmin]` (state-gated)
- New use case `convertCoachingActivityWithAi` runs the existing AI pipeline synchronously, persists the resulting structured workout AND its `session_match` in the same transaction. Dialog shows a spinner with `[Cancel]`. AI failure does NOT persist a workout; dialog surfaces the error with `[Retry AI]` `[Edit manually]` `[Match existing]`.
- New use case `convertCoachingActivityManual` creates a workout in `state="structured"` with a 1-step KRD template (placeholder warmup) and `session_match`, then navigates to EditorPage.
- Existing `convertCoachingActivity` (the current "Convert to workout" path) gets auto-match: persists `session_match` alongside the RAW workout. Same idempotency guarantees as today.
- AI processing falls back to `title + sport` as the prompt when `activity.description` is empty/undefined; dialog shows a hint and the AI button stays enabled.
- Workout-state-contextual actions inside the dialog:
  - `state=raw` → `[Process with AI]` (sync, same flow as creation)
  - `state=structured` → `[Open editor]`, `[Push to Garmin]` (disabled until `state=ready`)
  - `state=ready` → `[Open editor]`, `[Push to Garmin]` (enabled)
  - `state=pushed` → `[Open editor]` only
- EditorPage gains a read-only sidebar showing `activity.description` whenever the workout is derived from a coaching activity (detected via `session_match` lookup). The "no structured data yet" dead-end goes away because creation paths now always populate either a KRD (AI) or a template (Manual) — but the message is preserved as a defensive fallback for any other route in.
- **BREAKING (data shape, internal):** Dexie v10 migration runs once on app boot, scanning for activities whose corresponding workout exists (matched by namespaced sourceId) but lack a `session_match` row. For each, creates the missing match. Surfaces a single info toast: "N workouts linked to coaching activities". Reversible: deleting the matches restores the prior state.
- **BREAKING (none for users):** No public-API or KRD-format changes.

## Capabilities

### New Capabilities

None. The redesign extends existing coaching/workout integration; a separate spec for "coaching dialog" would fragment what is naturally a single capability boundary.

### Modified Capabilities

- `spa-coaching-integration`: dialog flow (3-state orchestrator, AI/Manual creation paths), auto-match invariant on every conversion path, Dexie v10 retro-match migration.
- `spa-workout-state-machine`: new entry transition `coaching-activity → structured` via Manual path (initialized with KRD template); `coaching-activity → structured` via AI (existing `raw → structured` mechanics, but creation skips the intermediate raw persistence on success).

## Impact

- `@kaiord/workout-spa-editor`:
  - Application: `application/coaching/convert-coaching-activity.ts` modified; new `convert-coaching-activity-with-ai.ts` and `convert-coaching-activity-manual.ts`
  - Components: `CoachingActivityDialog` and subcomponents (CoachingDialogActions, dialog parts) restructured for 3 states + AI spinner overlay + error state
  - EditorPage: layout extension for coach-description sidebar
  - Adapters/Dexie: `dexie-database.ts` v10 + new `dexie-v10-migration.ts`
- Specs: `spa-coaching-integration/spec.md` and `spa-workout-state-machine/spec.md` get delta updates.
- No changes to bridge packages, KRD format, port contracts outside `convert*` use cases.
- No new external dependencies.
- Architecture: stays within hexagonal boundaries — domain stays pure, application orchestrates, adapters do persistence.
