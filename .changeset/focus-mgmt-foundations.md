---
"@kaiord/workout-spa-editor": patch
---

Internal refactor: focus-management foundations.

- Introduce branded `ItemId` type and `IdProvider` seam (UUID v4 with
  `crypto.getRandomValues` fallback for non-secure contexts).
- Rename in-memory shape to `UIWorkout` (alias of `KRD` augmented with
  `UIWorkoutStep`/`UIRepetitionBlock` carrying required `id: ItemId`).
  Every creation/duplicate/paste action now emits a fresh `ItemId`; history
  snapshots preserve IDs across undo/redo and undo-delete.
- Add `stripIds` chokepoint: Dexie workout/template writes, save-to-file,
  and `exportWorkout` all strip UI ids before hitting the portable `KRD`
  surface. `pasteStep` regenerates every id to close the clipboard trust
  boundary.

No user-visible behavior change yet; focus state, hooks, components, and
consumer migration are intentionally out of scope for this PR.
