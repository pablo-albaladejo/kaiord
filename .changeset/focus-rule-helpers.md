---
"@kaiord/workout-spa-editor": patch
---

Internal refactor: pure focus-rule helpers (§5 of the
`spa-editor-focus-management` proposal).

Five pure functions, one per file in `src/store/focus-rules/`, each
taking a `Workout` + mutation ids and returning a `FocusTarget`:

- `createdItemTarget(id)` — newly-created items.
- `nextAfterDelete({ workout, deletedIndex, parentBlockId? })` —
  next-sibling / previous-sibling / empty-state rules for single
  deletes (covers main-list and block-child branches, including the
  "block becomes empty → anchor to parent block" cascade).
- `nextAfterMultiDelete({ workout, deletedIndices })` — multi-select
  delete (contiguous, non-contiguous, delete-all).
- `restoredAfterUndoTarget(workout, id)` — focus restored item if still
  present, else empty-state.
- `preservedSelectionTarget(workout, priorSelection, fallbackIndex)` —
  prior selection present / same-index fallback / empty-state.

The rules read `Workout` state only; `findById` does the lookup. No
React, no DOM, no store imports — a new CI focus-invariant grep in
`.github/workflows/ci.yml` rejects any `from 'react'` / `document.` /
`window.` / `HTMLElement` under `src/store/focus-rules/`.

Consumers (§6 action wiring) land in a follow-up PR.
