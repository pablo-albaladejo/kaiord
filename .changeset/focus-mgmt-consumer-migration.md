---
"@kaiord/workout-spa-editor": patch
---

Internal refactor: consumer migration to stable ItemIds (§9 of the
`spa-editor-focus-management` proposal) + block-ID cleanup.

- Introduce `findById(workout, id)` helper that locates a step / block /
  nested-step by its stable `ItemId` and returns its position context
  directly — replaces the legacy positional-ID parser.
- Migrate consumers to the helper: `useSelectedStep`, `getSelectedStepIndex`,
  `parseSelectedStepIndex`, `workout-section-handlers-helpers`,
  `build-step-handlers` (the Ctrl+Shift+G ungroup check no longer relies on
  `selectedStepId.startsWith("block-")`), the DnD sortable ids, and the
  `WorkoutPreview` bar flattening.
- Delete `step-id-parser.ts` + its test file (dead code after the
  migration); remove the `migrateRepetitionBlocks` pre-pass from
  `createLoadWorkoutAction` (redundant now that `hydrateUIWorkout` assigns
  every id).
- Flip block IDs to `defaultIdProvider()` (UUID v4) — no more
  `Math.random`-based `generateBlockId()` in store mutations.
- Flip `hydrateUIWorkout` default to `preserveExistingIds: false` per
  design decision 6 ("stable IDs are regenerated on every load"). The
  preserve mode remains available as an opt-in.
- CI focus-invariants: grep guards that reject any future reintroduction
  of positional-ID parsers or Zustand `persist()` middleware over the
  workout store.

No user-visible behavior change; the UIWorkout ↔ KRD contract at the
`@kaiord/core` port boundary is unchanged because `stripIds` is still the
outbound chokepoint.
