<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/store/focus-rules/`

## Purpose

Five pure functions, one per file, that compute what `pendingFocusTarget` should be after each kind of mutation. Purity is CI-enforced: no `react`, `react-dom`, `@testing-library/*`, `document.`, `window.`, or `HTMLElement` references allowed in this directory.

## Key Files

- `created-item.ts` / `.test.ts` — `createdItemTarget(id)`: newly-created items focus themselves.
- `next-after-delete.ts` / `.test.ts` — `nextAfterDelete({ workout, deletedIndex, parentBlockId? })`: single-delete rules (next sibling → previous sibling → empty state → block-cascade anchor).
- `next-after-multi-delete.ts` / `.test.ts` — `nextAfterMultiDelete({ workout, deletedIndices })`: multi-select delete.
- `restored-after-undo.ts` / `.test.ts` — `restoredAfterUndoTarget(workout, id)`: undo of a delete focuses the restored item.
- `preserved-selection.ts` / `.test.ts` — `preservedSelectionTarget(workout, priorSelection, fallbackIndex)`: undo of add/paste/duplicate and redo traversal.
- `index.ts` — module export surface (consumed by `../actions/*` and `../create-*` factories).

## For AI Agents

### Working In This Directory

1. **No DOM. No React.** A CI check fails this directory if any of those identifiers appear. Keep it that way — these functions are tested in pure isolation.
2. **One rule per file.** Don't combine rules; the file-size cap and the per-rule tests depend on the split.
3. **Inputs are always plain data** (`UIWorkout`, indices, ids) — never refs or callbacks.

### Testing Requirements

- One `.test.ts` per rule, exhaustive over the documented branches.
- Tests run in a non-DOM environment (jsdom is loaded but unused).

### Common Patterns

- Each function returns `FocusTarget | null`; `null` means "leave focus where it is."

## Dependencies

### Internal

- `../../types/ui-workout`, `../focus/focus-target.types`.

<!-- MANUAL: -->

The pure-rule split is the reason the editor's focus behavior is testable without a DOM and predictable across mutations. Don't shortcut by reading from `document.activeElement` here — that's a job for the consumer hook.
