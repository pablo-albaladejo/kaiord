---
"@kaiord/workout-spa-editor": minor
---

The Kaiord App opens with no network after one visit. A service worker scoped to `/app/` keeps the files of the version the athlete loaded, checked byte for byte at install, and passes every other request to the network. A new deploy shows "New version available · Reload" (Spanish: "Nueva versión disponible · Recargar"); unsaved edits hold it with "Save your changes to update", and only the tab that asks reloads. A repository variable turns on a kill switch that removes the worker from every browser.
