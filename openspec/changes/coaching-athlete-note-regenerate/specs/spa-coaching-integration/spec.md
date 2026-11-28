## MODIFIED Requirements

### Requirement: AI-driven creation from coaching activity (synchronous)

The system SHALL provide a use case `convertCoachingActivityWithAi(activityId, providerConfig, abortSignal)` that runs the AI pipeline synchronously and writes both the resulting workout AND its `SessionMatch` atomically. The use case:

1. Reads the `CoachingActivityRecord` by id (rejects with `not-found` if missing).
2. Reads the activity's `description`. If empty/undefined, builds the prompt as `"${activity.title} (${activity.sport})"`. Otherwise uses the description verbatim. When the activity has an Athlete note that is not blank, the note follows the coach's text, labelled as the athlete's own words; the coach's text is never changed. How the Workout is built is chosen in one place (`chooseCoachingBuilder`): an activity with a structured steps table and no Athlete note is read from the table without the model; otherwise the model gets the coach's text, the table when there is one, and the note.
3. Computes `namespacedSourceId = ${activity.profileId}:${activity.sourceId}`.
4. Calls `WorkoutRepository.getBySourceId(activity.source, namespacedSourceId)`. If a `WorkoutRecord` already exists with `state !== "raw"` and the athlete did not ask to regenerate, returns `{ ok: true, workoutId, created: false }` AND ensures a matching `SessionMatch` row exists (creates one silently if missing — handles legacy data per the Dexie v10 retro-fix invariant). If the existing `WorkoutRecord` has `state="raw"`, the use case continues to step 5 and then re-processes that record in place (see step 6). With `regenerate: true` it rebuilds an existing record in place (see "Regenerate an AI-built Workout").
5. Otherwise, calls `generateWorkoutKrd({ text, provider, sport })` with the abort signal piped through. The model produces a KRD object.
6. On model success, persists a new `WorkoutRecord` with `state: "structured"`, the produced `krd`, `aiMeta` (provider, model, prompt version, timestamp), `raw.description: activity.description ?? ""`, `source`, `sourceId: namespacedSourceId`, `date`, `sport`, `title`, fresh `nanoid()` id. First drops a `SessionMatch` of the activity whose workout no longer exists, so the new workout is never left unmatched. Writes a `SessionMatch` row with `source: "auto-coaching"`, `profileId: activity.profileId`, `coachingActivityId: activity.id`, `workoutId`, and a `date` set per AC-27: the workout's `date` for a coach-built workout, else the activity's `date`. Both writes complete before returning. Returns `{ ok: true, workoutId, created: true }`. For an existing raw record (step 4), the use case instead re-reads the record after the model call and, only if it is still `state="raw"`, transitions it to `state="structured"` in place with the produced `krd` and `aiMeta`, keeping its `id`, `date` and existing `SessionMatch` row; it returns `{ ok: true, workoutId, created: false }`. If the record left `raw` during the call, nothing is written and the use case emits `coaching.convert_with_ai.skipped` (AC-30).
7. On model failure (rejection, abort, invalid KRD shape, timeout), the use case writes NOTHING — no `WorkoutRepository.put`, no `SessionMatchRepository.put`. Returns `{ ok: false, reason, error }` where `reason ∈ { "ai-error" | "ai-cancelled" | "ai-timeout" | "ai-invalid-krd" | "transport-error" }`.

The use case emits analytics: `coaching.convert_with_ai.invoked` on entry, then exactly one of `coaching.convert_with_ai.success` (with `created` flag), `coaching.convert_with_ai.failure` (with `reason` enum) or `coaching.convert_with_ai.skipped` (with `reason: "changed-meanwhile"`) on exit. `skipped` is emitted when an existing raw workout left the `raw` state during the LLM call, so nothing was written (AC-30).

#### Scenario: Successful AI conversion creates workout and match atomically

- **GIVEN** an activity `A` with `description="Calentamiento Z1 + 5x(15\" Z5)"` and no existing workout
- **WHEN** the user clicks `[AI process]` and `generateWorkoutKrd` returns a valid KRD
- **THEN** a new `WorkoutRecord` with `state="structured"` and the produced KRD is persisted; a new `SessionMatch` row with `source="auto-coaching"` linking activity `A` to the new workout is persisted; the use case returns `{ ok: true, created: true }`; the calendar bucketer routes both into `matchedByDay` (the activity disappears from `soloPlansByDay`)

#### Scenario: AI failure persists nothing

- **GIVEN** an activity with no existing workout
- **WHEN** the user clicks `[AI process]` and `generateWorkoutKrd` rejects with `"Model returned invalid KRD"`
- **THEN** no `WorkoutRecord` is created; no `SessionMatch` is created; the use case returns `{ ok: false, reason: "ai-invalid-krd", error: "Model returned invalid KRD" }`; the dialog stays in `no-workout` state with the error rendered inline

#### Scenario: AI cancellation persists nothing

- **GIVEN** an in-flight `[AI process]` request
- **WHEN** the user clicks `[Cancel]` (or presses Escape, or closes the dialog) and the abort signal fires
- **THEN** the in-flight LLM request aborts; no `WorkoutRecord` is created; no `SessionMatch` is created; the use case returns `{ ok: false, reason: "ai-cancelled" }`; the dialog returns to `no-workout` state without an error message

#### Scenario: Empty description falls back to title + sport

- **GIVEN** an activity with `description=""` and `title="Long ride Z2"` and `sport.label="Cycling"`
- **WHEN** the user clicks `[AI process]`
- **THEN** `generateWorkoutKrd` is called with `text="Long ride Z2 (Cycling)"`; the dialog shows the hint `"ℹ AI usará solo title + sport"` above the action buttons; the use case proceeds normally

#### Scenario: Idempotent re-click after success returns existing workout without re-billing

- **GIVEN** an activity already converted via AI on a prior call
- **WHEN** the user clicks `[AI process]` again, without asking to regenerate
- **THEN** the use case returns `{ ok: true, created: false }` after a single read; no `generateWorkoutKrd` call fires; the dialog navigates to the existing `/workout/:id`

#### Scenario: A raw workout that changed during the LLM call is skipped, not a success

- **GIVEN** an activity whose existing workout is in `state="raw"`
- **WHEN** the user clicks `[AI process]` and the workout is skipped by another writer before `generateWorkoutKrd` resolves
- **THEN** the workout is not written and stays `skipped`; the use case returns `{ ok: true, created: false }`; the use case emits `coaching.convert_with_ai.skipped` with `reason: "changed-meanwhile"` and does not emit `coaching.convert_with_ai.success`

#### Scenario: The Athlete note reaches the model with the coach's text

- **GIVEN** an activity with `description="3x10 min Z3, single-leg drills"` and the Athlete note "on the trainer, skip the single-leg part"
- **WHEN** the Workout is built with AI
- **THEN** `generateWorkoutKrd` is called with a text that holds the coach's text and, after it, the note; the activity row is not changed

#### Scenario: A deleted workout's leftover match does not leave the activity stuck

- **GIVEN** an activity whose `SessionMatch` points at a workout that no longer exists
- **WHEN** the user clicks `[AI process]`
- **THEN** the leftover match is removed; the new workout is persisted with a new `SessionMatch`; the use case returns `{ ok: true, created: true }`

## ADDED Requirements

### Requirement: Athlete note on a Coaching Activity

The athlete SHALL be able to add, edit and clear an Athlete note on a Coaching Activity in the coaching dialog, labelled "Your note" ("Tu nota") and shown under the coach's text in every dialog state. The note SHALL live in its own `athleteNotes` store (Dexie v41), one row `{ id, profileId, text, updatedAt }` per Coaching Activity keyed by the activity's composite id, so a coach re-sync that rewrites the activity row never touches it and the note survives changes to the coach's text. Clearing SHALL keep the row with empty text, stamped newer, so the clearing syncs. The store SHALL ride the Drive snapshot (merged per row by `updatedAt`), the backup, the profile-delete cascade and the auto-profile re-key, like Workouts. The note SHALL reach only the AI Provider that receives the coach's text, and SHALL never be sent to Train2Go.

#### Scenario: Add a note

- **WHEN** the athlete types a note under "Your note" and saves it
- **THEN** the note is stored for that Coaching Activity and the next build or Regenerate sends it to the AI with the coach's text

#### Scenario: Clear a note

- **GIVEN** an activity with an Athlete note
- **WHEN** the athlete clears it
- **THEN** its row keeps empty text with a newer `updatedAt`, and the AI receives the coach's text alone

### Requirement: Regenerate an AI-built Workout

The matched-workout actions SHALL offer `[Regenerate]` ("Regenerar") for a matched workout in any state but `raw` and `skipped`. Regenerate is an explicit action, billed when the model builds it: it calls `convertCoachingActivityWithAi` with `regenerate: true`, which builds the Workout again (through the same builder choice) and replaces it in place: the same `id`, `date` and `SessionMatch`; `state="structured"` (the athlete reads "Ready"), the new `krd` and `aiMeta` (null when no model took part), `garminPushId: null` and `modifiedAt: null`. A failed or cancelled build writes nothing. The in-flight lock that ignores a second click while a run is pending SHALL cover Regenerate too.

Before regenerating, the dialog SHALL ask for confirmation when the athlete edited the Workout by hand (`modifiedAt` after `aiMeta.processedAt`, or any `modifiedAt` without `aiMeta`, as in `spa-workout-state-machine` "STALE conflict resolution") or when the Workout is on the watch (`pushed`/`modified`, a `garminPushId`, or a Garmin placement row). The confirmation SHALL say that hand edits are replaced and, for a Workout on the watch, that it goes back to "Ready" and the earlier version stays in Garmin's library until the athlete removes it there. Kaiord SHALL NOT delete it from Garmin's library.

#### Scenario: Regenerate replaces the Workout in place

- **GIVEN** an activity matched to an AI-built workout in `state=ready`, untouched by hand
- **WHEN** the athlete clicks `[Regenerate]`
- **THEN** no confirmation is shown; the model is called once; the workout keeps its `id`, `date` and `SessionMatch` and holds the new KRD in `state=structured`

#### Scenario: Regenerate confirms first after hand edits

- **GIVEN** a matched workout edited by hand after the AI built it
- **WHEN** the athlete clicks `[Regenerate]`
- **THEN** a confirmation says the changes are replaced; nothing runs until the athlete confirms

#### Scenario: Regenerate warns when the Workout is on the watch

- **GIVEN** a matched workout in `state=pushed`
- **WHEN** the athlete confirms `[Regenerate]`
- **THEN** the confirmation said it goes back to "Ready" and the earlier version stays in Garmin's library; the workout ends in `state=structured` with `garminPushId: null`

#### Scenario: A steps table without a note needs no AI

- **GIVEN** an activity with a structured steps table and no Athlete note
- **WHEN** the athlete regenerates its Workout
- **THEN** the table is read again; no model call is made; `aiMeta` is null

#### Scenario: A steps table with a note goes to the AI

- **GIVEN** an activity with a structured steps table and an Athlete note
- **WHEN** the athlete regenerates its Workout
- **THEN** the model is called with the table, the coach's text and the note

### Requirement: Delete a Workout and its Match

The matched-workout actions SHALL offer `[Delete workout]` ("Borrar entreno"), behind a confirmation. Deleting SHALL remove the Workout and its `SessionMatch` through the tombstoning port, so the Coaching Activity goes back to "To prepare"; the toast's `[Undo]` SHALL restore both, each written newer than its tombstone, and SHALL leave alone a match the activity gained meanwhile. When the Workout has a Garmin placement row the confirmation SHALL show the existing Garmin notice (`workout-detail` `delete.messageGarmin`). Deleting a Workout from its detail page SHALL also remove its `SessionMatch`, with the same Undo.

#### Scenario: Delete from the dialog and undo

- **GIVEN** an activity matched to a workout
- **WHEN** the athlete confirms `[Delete workout]`, then clicks `[Undo]`
- **THEN** after the delete the workout and its match are gone and the dialog offers the no-workout actions; after Undo both are back and the dialog shows the matched workout

#### Scenario: Delete from the detail page removes the Match

- **GIVEN** a workout matched to a Coaching Activity
- **WHEN** the athlete deletes it from its detail page
- **THEN** its `SessionMatch` is removed too, and the next `[AI process]` on the activity creates and matches a new workout

### Requirement: Split stays split

Both Split buttons of the matched dialog (the linked-workout section and the action bar) SHALL split the Coaching Activity from its Workout. Splitting SHALL remove the `SessionMatch` and, when the workout was built from that Coaching Activity (its `sourceId` is the activity's namespaced source id), detach it by clearing its `sourceId`, stamped newer so the split syncs. The dialog's auto-heal, which pairs a workout found by the activity's source id, SHALL therefore not pair them again; the activity is "To prepare" and the workout stands on its own. A workout matched by hand SHALL keep its own `sourceId`.

#### Scenario: Split survives the auto-heal

- **GIVEN** an activity matched to the workout built from it
- **WHEN** the athlete clicks `[Split]` and reopens the dialog
- **THEN** the dialog is in `no-workout` state; no `SessionMatch` is recreated; the workout still exists with `sourceId: null`
