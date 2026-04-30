---
"@kaiord/workout-spa-editor": patch
---

fix(spa-editor): migrate library state to Dexie + useLiveQuery (latent bug from same root cause as #385)

Phase 2 of `persistence-read-rule-cleanup`. Reuses the foundation from Phase 1A/1B. No new ports, no schema changes — pure read/write rewiring.

- Renames `useLibraryTemplates` → `useLibraryTemplatesLive` and relocates it to `src/hooks/use-library-templates-live.ts` so consumers read templates reactively from Dexie.
- Adds three application use cases under `application/library/`: `addTemplate` (single-write put), `updateTemplate` (read-modify-write inside `persistence.transaction`, throws `TemplateNotFoundError`), `deleteTemplate` (single-write delete). Co-located unit tests against `createInMemoryPersistence()`.
- Helpers (`createNewTemplate`, `updateTemplateData`, search/filter/extract) move from `store/library-store/helpers.ts` to `application/library/helpers/`.
- Migrates 4 consumer files to read via the live hook + dispatch through the use cases via `usePersistence()`: `LayoutHeader.tsx` (badge counter), `useWorkoutLibrary.ts`, `useSaveToLibrary.ts`, and `LibraryPage.tsx` (which had been doing direct `db.table().delete()` — now goes through the use case).
- Deletes legacy: `src/store/library-store.ts` + `src/store/library-store/` (recursive) + `src/hooks/use-library.ts` shim + `src/components/pages/library-hooks.ts`.
- Adds a regression test at `src/__regressions__/library-badge.test.tsx` that pre-populates Dexie with two templates, mounts `LayoutHeader`, and asserts the badge shows "2" without any user interaction (locks in "library badge after refresh").

Latent bug fixed: pre-Phase 2 the Zustand store loaded empty on boot, so the badge showed "0" until the user opened the library dialog and triggered a write. Same root cause as #385 (Phase 1B) but lower visibility.
