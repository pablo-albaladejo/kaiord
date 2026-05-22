---
"@kaiord/workout-spa-editor": minor
---

feat: persist `userPreferences.lastScratchSport` and `userPreferences.aiBannerExpanded` across sessions (per profile) via a forward-only Dexie v15 migration. The `ScratchEditorSurface` now pre-selects the user's last scratch sport in `MetadataEditMode` and writes the chosen sport back on the auto-init path (library-loaded and e2e-seeded workouts are skipped). `AiBanner` seeds its open/closed state from the persisted preference and writes manual toggles and the one-shot auto-collapse-on-first-success transition back, preserving the existing one-shot semantics.
