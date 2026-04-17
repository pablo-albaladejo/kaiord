## Why

The workout editor has zero programmatic focus management. When a step is deleted, pasted, added, duplicated, reordered, or undo/redone, focus either stays on the removed DOM element (falling to `document.body`) or doesn't move to the affected item. This creates a poor experience for keyboard-only and screen reader users who lose their place in the step list after every action.

This is a cross-cutting concern that affects every input method (keyboard shortcuts, context menu, toolbar buttons, drag-and-drop). It should be solved holistically rather than per-feature.

## What Changes

- **Stable step IDs**: Migrate from positional IDs (`step-0`, `step-1`) to stable IDs that survive reordering, so focus targets remain valid after mutations.
- **`pendingFocusTarget` in store**: After any action that changes the step list, the store records which step/block should receive focus next.
- **`useFocusAfterAction` hook**: A shared hook that reads `pendingFocusTarget` from the store and moves DOM focus via `ref` lookup after React re-renders.
- **Focus rules per action**:
  - Delete → next step (or previous if last, or empty state button if none)
  - Paste/Add/Duplicate → newly created step
  - Undo delete → restored step
  - Reorder (Alt+Arrow) → moved step (implicit, already works)
  - Drag-and-drop → dropped step

## Capabilities

### New Capabilities

- `spa-editor-focus-management`: Holistic focus management for the workout step list editor across all action types and input methods.

### Modified Capabilities

- `spa-editor-context-menu`: Update focus return scenario from "Radix default" to smart focus management once this change lands.

## Impact

- **Package**: `@kaiord/workout-spa-editor` only
- **Layer**: Infrastructure (UI event handlers, store state, React hooks)
- **Prerequisites**: Stable step ID migration (may be a separate preparatory change)
- **Files**:
  - `store/` — add `pendingFocusTarget` state and setter
  - `hooks/` — new `useFocusAfterAction` hook
  - `components/organisms/WorkoutList/` — wire focus hook, pass refs to step/block cards
  - `components/molecules/StepCard/` — accept and attach ref for focus
  - `components/molecules/RepetitionBlockCard/` — same
  - All action files (delete, paste, add, duplicate, undo) — set `pendingFocusTarget`
- **No breaking changes** to public API or domain logic
- **No new dependencies**
