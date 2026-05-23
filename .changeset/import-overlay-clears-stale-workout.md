---
"@kaiord/workout-spa-editor": patch
---

fix: `ImportDropzoneOverlay` now calls `clearWorkout()` on mount so a stale `currentWorkout` from a prior route (scratch draft, template preview, etc.) does not trigger `EditorPage`'s `importComplete` branch (`mode === "import" && currentWorkout !== null`) and silently skip rendering the dropzone overlay. Without this, navigating to `/workout/new?action=import` after viewing any other workout would show the populated editor body instead of the file picker.
