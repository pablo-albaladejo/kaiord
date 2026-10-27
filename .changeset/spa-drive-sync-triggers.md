---
"@kaiord/workout-spa-editor": patch
---

Fix cross-device sync through Google Drive not carrying changes between browsers. A reopened tab or installed PWA now stays connected, and the next tap signs in again. The app pulls again when it is resumed or regains focus, and every 5 minutes while it is open. An expired Google token is refreshed instead of failing every sync after an hour. Edits to every synced table now push, not only workouts, templates, profiles, AI providers and nutrition.
