---
"@kaiord/workout-spa-editor": minor
---

Add in-app back navigation across the create-workout flow. `EditorPageHeader` accepts a new optional `onBack` prop that renders a shared `BackButton` atom; `EditorPage` wires it via `useBackHandler`, which preserves `?date=` on scratch/import and reuses the existing discard confirmation modal when `currentWorkout.steps.length > 0`. `NewWorkoutPicker` gains its own back button that navigates to `/calendar`.
