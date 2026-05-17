---
"@kaiord/workout-spa-editor": patch
---

UX redesign Phase 1 leftover: surface a 4-button affordance row
(`Regenerate` / `Edit` / `Discard` / `Save to Library`) inside the AI
workout panel as soon as generation succeeds. Closes the last
"dead-end after success" identified in the deep-dive trace — the user
no longer has to guess what to do with a freshly-generated workout.

New `AiSuccessActions` molecule
(`packages/workout-spa-editor/src/components/molecules/AiSuccessActions/`)
with 5 unit tests. Wired into `AiWorkoutForm` so it renders only when
`generation.status === "success"` and a workout is loaded:

- **Regenerate** re-invokes the existing `generate(text, sport)` with
  the current prompt — no new code path.
- **Edit** resets the generation state to `idle` so the affordance
  row collapses and the user proceeds with the editor below.
- **Discard** clears the workout via `useClearWorkout` and resets the
  generation state.
- **Save to Library** reuses the existing `SaveToLibraryButton`
  molecule so the save flow stays consistent with the rest of the app.

No behavioural change to the AI generation flow itself; the row is
purely additive UI.
