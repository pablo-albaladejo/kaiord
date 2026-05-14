<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/components/pages/WorkoutSection/`

## Purpose

The editor body. Composes the WorkoutList organism, the workout header/title/metadata editor, the action toolbar, and the focus-after-action machinery. Split into per-concern files (handlers, hooks, sub-parts) so each file stays under the size cap.

## Key Files

### Composition

- `WorkoutSection.tsx` — top-level component.
- `WorkoutSectionEditor.tsx` — edit-mode body.
- `WorkoutHeader.tsx` / `.test.tsx` — workout-level header (title + actions).
- `WorkoutTitle.tsx` — title in display mode.
- `WorkoutActions.tsx` / `.test.tsx` (+ `.property.test.tsx`) — action toolbar (save, undo/redo, export, etc.).
- `WorkoutStepsList.tsx`, `WorkoutStepsListActions.tsx` / `.test.tsx`, `WorkoutStepsListBinding.tsx` — steps-list slot.
- `MetadataEditMode.tsx` — metadata editor in edit mode.
- `SelectionHints.tsx` — multi-select hints surface.
- `delete-block-with-toast.tsx` — delete-block UX wrapper that fires a toast on success.
- `index.ts` — module export surface.

### Hooks

- `useWorkoutSectionState.tsx` / `.test.ts` — page-local state.
- `useWorkoutSectionHandlers.ts` / `.test.ts` + `workout-section-handlers-helpers.ts` / `.test.ts` — action handlers (delete, duplicate, paste, etc.).
- `use-workout-section-focus.ts` — wires `useFocusAfterAction` for this surface.
- `use-discard-confirmation.ts` — confirm-discard prompt before destructive actions.
- `use-repetition-block-handlers.tsx` + `use-repetition-block-handlers.helpers.tsx` — block-action wrapping with toasts.
- `use-delete-step-with-toast.tsx` / `.test.ts` — delete-step UX wrapper.
- `useCopyStep.ts`, `usePasteStep.ts`, `useSelectedStep.ts` — per-action hooks.

## For AI Agents

### Working In This Directory

1. **Focus-after-action is wired at this boundary.** `use-workout-section-focus.ts` consumes `pendingFocusTarget` from the store. Don't move the wiring up or down without adjusting the telemetry-canary expectations.
2. **Toast wrappers ARE the user-facing surface** for destructive actions. Toast strings must be static literals or top-level SCREAMING_SNAKE_CASE constants (R-PIIInterpolation).
3. **flushSync patterns** apply when an action mutates and needs post-commit reads — see `store/README.md` §7.9.

### Testing Requirements

- `useWorkoutSectionHandlers.test.ts` pins every action's outcome + focus target.
- `WorkoutSection.focus-integration.test.tsx` covers the focus seam end-to-end.
- `delete-block-with-toast` + `use-delete-step-with-toast` have dedicated coverage.

## Dependencies

### Internal

- `../../organisms/WorkoutList`, `../../organisms/EditorContextMenu`, `../../molecules/*`.
- `../../../hooks/{useToast,focus/use-focus-after-action,*}`.
- `../../../store/*`.

### External

- `react`, `react-dom` (`flushSync`).

<!-- MANUAL: -->
