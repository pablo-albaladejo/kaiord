---
"@kaiord/workout-spa-editor": minor
---

refactor: drop the welcome scaffold on `/workout/new?source=scratch` and `/workout/new?action=import`. Scratch lands directly on the editor canvas (collapsed AI banner + WorkoutHeader auto-opened in metadata-edit mode + empty steps list with `+ Add first step`). Import opens a dedicated dropzone overlay that auto-triggers the OS file picker on mount. The picker (`NewWorkoutPicker`) is now the single first-touch decision surface; in-editor onboarding (`Getting Started`, `Or create manually / import a file`) is gone.
