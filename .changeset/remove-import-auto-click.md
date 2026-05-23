---
"@kaiord/workout-spa-editor": patch
---

fix: `ImportDropzoneOverlay` no longer auto-clicks the hidden file input on mount. The user now lands on the dropzone overlay and explicitly chooses when to open the OS file picker (via the visible "Choose file" affordance or drag-and-drop). Reverts the auto-open behaviour from PR #648 — the explicit-click flow gives the user more control and avoids the OS file picker appearing unexpectedly. `clearWorkout()` on mount (from PR #657) is retained.
