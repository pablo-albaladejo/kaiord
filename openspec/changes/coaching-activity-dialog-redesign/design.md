## Context

Coaching activities (Train2Go plans) are imported via the bridge and rendered as cards on the calendar. Today's flow: card click → `CoachingActivityDialog` with `[Convert to workout]` → creates a RAW `WorkoutRecord` whose `raw.description` mirrors `activity.description` → navigates to `/workout/{id}` → editor renders "This workout has no structured data yet" with a single "Go to Calendar" link.

The flow has three concurrent UX problems:

1. **Dead-end editor.** Convert produces a RAW workout but the editor for `state="raw"` shows a message-only fallback. The "Process with AI" affordance lives in `RawWorkoutDialog` (a different dialog reachable only from non-coaching cards). The user has no path forward inside the coaching flow.
2. **Visual duplication on calendar.** `convertCoachingActivity` does NOT create a `session_match`. The calendar bucketer (`calendar-buckets.ts`) keeps the activity in `soloPlansByDay` and adds the new workout to `soloActualsByDay`. Every conversion produces two cards for the same training session.
3. **Description-loading silent failure.** Resolved upstream by PRs #545 (date backfill) and #546 (intensity-class split), but the dialog has no observable error state — failures (no T2G tab, parser regex miss, network error) leave the dialog stuck on "Loading description…" or empty content with no guidance.

The redesign reframes the dialog as an **orchestrator with three primary states** and adds two new creation paths (AI sync, Manual template) that complement the existing Convert. Auto-match becomes invariant for every workout-creation path. A one-time Dexie v10 migration retro-matches activities that were converted under the old flow.

The AI infrastructure already exists (`processWorkoutWithAi`, `generateWorkoutKrd`, `transitionToStructured`); the change wires it to a new synchronous-from-coaching entry point. No bridge changes are required — the parser/transport bugs are already shipped.

## Goals / Non-Goals

**Goals:**

- Eliminate the dead-end "no structured data yet" page for the coaching-driven creation flow.
- One card per training session on the calendar (no duplication after conversion).
- Surface AI processing as a primary action from the coaching dialog (sync, with cancel + clear error state).
- Surface a manual-edit primary action that produces a usable starting point (KRD template + sidebar with coach description).
- Idempotent dialog: re-clicking a card whose workout exists routes to the workout, never creates duplicates.
- Retro-fix existing converted-without-match activities once, on next app boot, with user-visible toast confirmation.
- Workout-state-contextual actions in the dialog so the user can re-process a stuck RAW or push to Garmin without leaving the calendar.

**Non-Goals:**

- Inline KRD editor inside the dialog (decided D5 — orchestrator only; editing happens in EditorPage).
- Skip / Mark-as-completed write-back to the bridge (out of scope; tracked as future work).
- Async/background AI processing (decided D2 — sync with spinner inside the dialog).
- New capability spec for the dialog (extends `spa-coaching-integration` — splitting it would fragment a single capability boundary).
- Changes to the AI prompt format, model selection, or LLM provider configuration.
- Bridge-side changes (parser, transport). The data layer is already correct after PRs #545/#546.
- Changes to `RawWorkoutDialog` (the workout-side raw dialog stays as-is for non-coaching workouts).

## Decisions

### D1. Auto-match invariant on every workout-creation path from a coaching activity

Every path that creates a workout from a coaching activity (existing Convert, new AI, new Manual) writes a `session_match` row in the same logical transaction. The match links `coachingActivityId` ↔ `workoutId` with `match.date = activity.date`.

**Rationale.** The activity IS the plan, the workout IS the execution; they are linked by definition when one is derived from the other. Auto-match collapses two cards into one in the calendar bucketer (matched activities flow into `matchedByDay`, removed from `soloPlansByDay` and `soloActualsByDay`). Without this, every conversion compounds visual debt; every user gesture to clean it up is friction with no information value.

**Alternatives considered.**

- **No auto-match (status quo).** Rejected: produces visible duplication and pushes a manual gesture onto the user that has no decision content.
- **Auto-match only for AI/Manual; Convert keeps current behavior.** Rejected: inconsistent contract between three near-identical use cases. Easier to reason about a single invariant.

**Layer.** Application — the use case writes both `WorkoutRepository.put` and `SessionMatchRepository.put` before returning success.

**Idempotency.** Use cases first call `coachingRepo.getByProfileAndSourceId(...)` followed by `workoutRepo.getBySourceId(...)` and `sessionMatchRepo.getByCoachingActivityId(...)`. If a workout already exists, return it (no duplicate creation). If a workout exists but the match is missing (legacy data), create the match silently and return the existing workout.

### D2. AI processing is synchronous in the dialog

Click `[AI process]` in the dialog → dialog body switches to a spinner with a `[Cancel]` button → application calls `convertCoachingActivityWithAi` which (a) reads activity, (b) calls `generateWorkoutKrd`, (c) on success persists workout in `state=structured` with KRD + `aiMeta` AND a `session_match`, (d) closes dialog and navigates to `/workout/{id}`. Spinner duration: typically 5-15s depending on model.

**Rationale.** The user's intent is engagement — they clicked a card and asked to process it. Async/background lowers immediate latency but creates a missing-feedback surface (toast, then where do I look?). Sync keeps the user on the dialog, gives them an explicit cancel handle, and lands them on the editor with KRD ready. Cancel handling: AbortController on the LLM fetch; on cancel, no workout is persisted (per D3 contract).

**Alternatives considered.**

- **Async + toast.** Rejected: adds a dialog-close-then-toast-then-navigation choreography that pushes the user out of the engagement loop.
- **Sync but in a separate progress page (navigate first, process there).** Rejected: introduces a transient route that shows "Processing…" with no value beyond what a spinner inside the dialog provides.

**Layer.** Application + UI. Use case is synchronous. Dialog wraps with `useState` for the spinner + AbortController.

### D3. AI failure does not persist a workout

If the LLM call rejects (network error, model error, invalid KRD, timeout, user cancel), the use case returns `{ ok: false, reason, error }` and writes nothing — no `WorkoutRepository.put`, no `SessionMatchRepository.put`, no `aiMeta`. The dialog renders the failure inline with `[Retry AI]` `[Edit manually]` `[Match existing]` `[Close]` (no `[Cancel]` because there's no in-flight request).

**Rationale.** A half-persisted workout (raw with no KRD, attached to a session_match) would mean the next dialog open shows "converted" mode and the user cannot easily re-process — they'd have to navigate to EditorPage and find the AI button there. By NOT persisting on failure, the dialog stays in `no-workout` state and the same primary actions remain available. The only data churn from a failed AI run is the analytics event (`coaching.convert_with_ai.failure`).

**Alternatives considered.**

- **Persist as RAW on AI failure.** Rejected: spawns the dead-end editor problem this change is solving. The user explicitly asked for "AI" — a half-converted RAW is a different artifact.
- **Persist with `lastProcessingError` and let `Re-process AI` retry.** Rejected: creates a permanent-looking failed workout in the calendar (visible card) for what was meant to be an experiment. User can still go this route by clicking `[Edit manually]` if they want to keep the description.

**Layer.** Application boundary — the use case has explicit success/failure result type with no partial side effects on failure.

### D4. Manual edit creates `state=structured` with a 1-step KRD template + auto-match; EditorPage gets a sidebar with coach description

`[Edit manually]` calls `convertCoachingActivityManual` which creates a `WorkoutRecord` in `state="structured"` with a single placeholder warmup step in `krd.steps` (e.g., 10-min warmup at Z1) and the full coach description preserved in `raw.description` for the sidebar. `session_match` written in the same transaction. Navigates to `/workout/{id}`.

EditorPage detects coaching-derived workouts via session_match lookup (single read keyed by workoutId) and renders a left sidebar with `activity.description` (read-only, formatted text) alongside the existing KRD step editor.

**Rationale.** A blank-state editor (state=structured, krd=null) hits the existing "no structured data yet" message. Initializing KRD with a template gives the editor something to render and the user a starting point — a single visible step with a delete affordance. The sidebar with coach description means the user can read the prescription while building steps without context-switching tabs.

**Alternatives considered.**

- **state=raw with a textarea-style editor.** Rejected: state machine spec says manually-created workouts SHALL start in `structured` (per existing spec §13). RAW state is reserved for bridge imports awaiting AI.
- **Empty KRD (krd=null) with custom "no data" prompt.** Rejected: requires a parallel "empty-but-not-loading" rendering path in EditorPage. Template cost is one extra step write.
- **Persist coach description into `raw.description` even though the workout is `state=structured`.** Accepted: this is what enables the sidebar without inventing a new field. `raw` is technically "the original prescription"; structured workouts derived from coaching legitimately have a raw source.

**Layer.** Application (use case + KRD template builder), UI (EditorPage layout extension), domain (no new types — re-uses `Step`, `WorkoutRecord`, `SessionMatch`).

### D5. Dialog is an orchestrator, not an inline editor

The dialog renders state-summarized info (title, sport, duration, status, description) and a small set of contextual buttons. KRD step editing is not available inside the dialog — clicking `[Open editor]` navigates to the existing EditorPage.

**Rationale.** Inline editing in a Radix dialog amplifies surface area (drag-drop, keyboard navigation, accessibility) without removing the EditorPage (which still wins for any non-trivial workout). Two editors to maintain doubles the risk of drift. The dialog stays at one job: "what should I do with this card right now?"

### D6. Empty description falls back to `title + sport` for the AI prompt

If `activity.description` is empty/undefined when `[AI process]` fires, `generateWorkoutKrd` is called with prompt = `"${activity.title} (${activity.sport.label})"`. Dialog shows a hint above the buttons: "ℹ AI usará solo title + sport".

**Rationale.** Users who don't have a coach-written description (rare on T2G but possible — e.g., self-imported activities) shouldn't be blocked from the AI flow. KRD will be generic but parseable — better than disabling the button. The hint sets expectations honestly.

**Alternatives considered.**

- **Disable AI button.** Rejected: harsher, gives no path forward beyond manual.
- **Try AI; if KRD is too generic, fail.** Rejected: model output quality is a probabilistic gradient, not binary; we'd be inventing a quality threshold without basis.

### D7. Workout-state-contextual actions in the dialog when a workout exists

When `matchState=converted` or `matchState=matched`, the dialog renders state-aware buttons:

| state                | Actions                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `raw`                | `[Process with AI]` (sync, same flow as creation), `[Open editor]` |
| `structured`         | `[Open editor]`, `[Push to Garmin]` (disabled — workout not ready) |
| `ready`              | `[Open editor]`, `[Push to Garmin]` (enabled)                      |
| `pushed`             | `[Open editor]` (Push hidden — already on Garmin)                  |
| `modified` / `stale` | `[Open editor]` only (let the user resolve in editor)              |
| `skipped`            | `[Open editor]` (no Push)                                          |
| matched              | additionally `[Split / Unmatch]` (existing capability)             |

Push-to-Garmin reuses the existing `useGarminPush` hook surface from the editor; same mutation, same toasts, same error handling.

**Rationale.** The dialog becomes a useful day-to-day surface, not just a one-shot conversion tool. State-gated affordances avoid foot-guns (no Push from `state=structured` because the KRD isn't validated yet).

**Layer.** UI orchestration. No new use cases; we reuse `processWorkoutWithAi` (for raw → structured) and the Garmin push call.

### D8. Dexie v10 retro-match migration (one-time, on app boot)

A v10 upgrade fires once per browser. It scans the `coachingActivities` and `workouts` tables for the active profile, joins on `(workout.source === activity.source) && (workout.sourceId === namespaceSourceId(activity.profileId, activity.sourceId))`, then for each pair where no `session_match` exists, creates one with `match.date = activity.date`. Surfaces a single info toast: "N workouts linked to coaching activities" if `N > 0`. Idempotent: a Dexie versionchange runs once, and the scan logic itself is idempotent (skips pairs that already have a match).

**Rationale.** Without retro-fix, every user with old converted activities sees double cards forever (or until they manually match each pair). The migration runs once per browser, reads the same tables the calendar bucketer reads, and writes deterministic IDs (`session_match.id` derived from `(workoutId, activityId)` if needed, or random UUID + unique constraint).

**Alternatives considered.**

- **Lazy retro-fix on dialog open.** Rejected (was option in askUserQuestion): user has to manually open every duplicated dialog to see resolution. Bad UX.
- **No retro-fix (only future conversions).** Rejected: leaves visible duplication permanently for the existing user base. The migration is small and bounded.

**Layer.** Adapter (Dexie). Pure data transformation — no application logic spills into the migration.

**Risk:** if the migration is interrupted (browser closed mid-scan), Dexie's version flag advances anyway, so the migration won't re-run. Mitigation: scan logic re-runs harmlessly on the next session if any pairs are still unmatched (because we add an "and matches table count is short" check).

### D9. Dialog renders 3 primary buttons in `no-workout` state

When `matchState` resolves to "no workout exists for this activity":

```
[AI process]      ← primary, accent color
[Edit manually]   ← secondary
[Match existing]  ← secondary, opens MatchToPicker
[Close]           ← tertiary
```

`[AI process]` is enabled even when description is empty (per D6). All three are available regardless of activity status (`pending` / `completed` / `skipped`) — the user might want to convert a `completed` activity to a workout for record-keeping purposes.

### D10. Idempotency by reading Dexie post-creation

`useCoachingDialog` already exposes `matchState` via `useActivityMatchState` (a `useLiveQuery` over `sessionMatches`). After any creation path persists, the live query fires within one render cycle and `matchState` becomes "matched". Dialog re-renders into the matched-state branch automatically. No imperative state toggles inside the dialog itself.

**Rationale.** Reactive state is already the default. The only thing the dialog needs is to handle the one-frame race where the user clicks `[AI process]` twice rapidly: the use case's idempotency check (D1) returns the existing workout id without persisting again.

## Risks / Trade-offs

- **Sync AI blocks the dialog for 5-15s.** → Mitigation: explicit `[Cancel]` button wired to AbortController; visible spinner; dialog backdrop stays, so user can dismiss with Escape (which aborts and closes).
- **AI cost on every click.** A user could spam `[AI process]` and rack up LLM costs. → Mitigation: idempotency check (D1) returns existing workout; if first call succeeded, second click navigates instead of re-billing. If first call failed (D3), the user has to explicitly click `[Retry AI]` again — no auto-retry.
- **Sidebar coach description in EditorPage clutters small screens.** → Mitigation: collapsible sidebar with persisted (per-user-pref) open/closed state; default closed on viewport < 768px.
- **KRD template (1 placeholder step) might be jarring.** → Mitigation: the template is a clear "Warmup — 10 min Z1" step that's obviously a starting point, not real prescription. Users delete it as their first edit. Documented in EditorPage's first-run hint.
- **Dexie v10 migration runs unconditionally on every boot until the version flag advances.** → Mitigation: standard Dexie versionchange semantics + the migration's own idempotency guard. Telemetry: log the count of retro-fixed pairs as analytics event so we can monitor the migration rolling out.
- **Workout already-matched-but-bridge-resyncs-with-different-state** → Mitigation: existing STALE detection (per `spa-workout-state-machine` spec §5) handles this. No change needed; the matched dialog just needs to render the STALE state correctly (already part of state-contextual actions in D7).
- **Match-existing flow when there's no compatible workout to match to.** → Mitigation: `MatchToPicker` already filters by date and sport (existing capability). If the picker is empty, it shows a hint; we don't change that.
- **AI failure with `[Retry AI]` rapid-clicks** → Mitigation: button disabled during in-flight request (existing pattern in `useCoachingConvert`). AbortController also cancels orphan requests.

## Migration Plan

1. **Ship PR 1 (Domain + use cases + Dexie v10).** No UI changes. Dexie v10 migration is a no-op on browsers that still see the old UI (no new conversion paths firing). Tests cover idempotency, auto-match, retro-match.
2. **Ship PR 2 (Dialog redesign).** UI for 3-state orchestrator goes live. AI sync flow + error state. Workout-state-contextual actions. Existing `[Convert to workout]` flow is replaced by `[AI process]` / `[Edit manually]` / `[Match existing]`.
3. **Ship PR 3 (EditorPage sidebar).** Coach description sidebar appears for coaching-derived workouts.
4. **Ship PR 4 (E2E + spec sync + archive).** Playwright flows lock the redesigned dialog behaviors.

**Rollback.** PR 1 is reversible (revert removes auto-match writing, but existing matches stay until next migration). PR 2/3 are pure UI reverts. The Dexie v10 migration cannot be rolled back (versions are forward-only) but its result — `session_match` rows — is benign in any future schema.

**Telemetry hooks.**

- `coaching.convert_with_ai.invoked / success / failure / cancelled`
- `coaching.convert_manual.invoked / success`
- `coaching.dialog.state_observed` (one-shot per open: `no-workout` | `converted` | `matched`)
- `coaching.dexie_v10.migrated` (one-shot: count of pairs retro-matched)

## Open Questions

None at the design level — all decisions baked into D1-D10. Implementation may surface tactical questions (e.g., exact KRD template shape, sidebar collapsed-state preference) which are local enough to resolve during PR review without changing this design.
