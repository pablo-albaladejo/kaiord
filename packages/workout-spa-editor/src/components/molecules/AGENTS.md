<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/components/molecules/`

## Purpose

Compositions of atoms with one focused responsibility. Each molecule may know about a single domain slice (e.g. a step, a workout card, a dialog payload), but DOES NOT own page-level state.

## Key Files (top-level molecules without their own folder)

- `RouteErrorBoundary.tsx` / `.test.tsx` — wraps each route in `App.tsx` to catch render errors and report them via analytics.
- `RouteErrorFallback.tsx` / `.test.tsx` — the visible fallback rendered by `RouteErrorBoundary`.
- `delete-button-styling.test.tsx` — regression test pinning consistent delete-button styling across molecules.

## Subdirectories (one per feature; each contains `<Name>.tsx`, optional tests + stories + helpers + `index.ts`)

- `BatchProcessingBanner/` — banner for AI batch-conversion progress.
- `CalendarEmptyStates/` — empty-state placeholders for the calendar grid.
- `CardShell/` — shared shell for matched-session, workout, and coaching cards.
- `CoachingCard/` — the largest molecule (52 files). The matched-session dialog + activity dialog, body, shell, executed/linked sections, MatchToPicker, no-workout actions, AI processing overlay, error states, and the hooks driving the coaching-dialog state machine.
- `ConfirmationModal/` — generic Radix-Dialog confirmation prompt.
- `CreateRepetitionBlockButton/`, `CreateRepetitionBlockDialog/` — entry points for the create-block flow.
- `CreateWorkoutDialog/` — new-workout creation dialog.
- `CalendarViewToggle/` — calendar Grid ↔ List view toggle.
- `DurationPicker/` — time + distance picker.
- `EmptyDayDialog/` — dialog opened from an empty calendar cell to schedule from Library or create new.
- `EmptyWorkoutState/` — empty-state placeholder for the editor.
- `ExportFormatSelector/` — format chooser (FIT / TCX / ZWO / KRD / GCN) used by the editor's Export button.
- `FileUpload/` — drag-and-drop + button upload, with format detection.
- `GarminPushButton/` — pushes a workout to Garmin Connect via the bridge.
- `MatchedSessionCard/` — calendar-cell card showing a matched coaching session (the 1-N "Train2Go three-slot" UI from #597 / #599).
- `ModifiedIndicator/` — dirty-state badge.
- `PasteButton/` — keyboard + click paste from clipboard-store.
- `RawWorkoutDialog/` — view raw KRD JSON.
- `RepetitionBlockCard/` — repetition-block card in the editor's main list.
- `SaveButton/`, `SaveErrorDialog/` — save flow + error recovery.
- `SaveToLibraryButton/` — promotes the current workout into a Library template.
- `ScheduleDateDialog/` — pick a date when scheduling a template.
- `SelectionIndicator/` — multi-select highlight.
- `StaleConflictDialog/` — surfaces stale-detection conflicts from `application/stale-detection`.
- `StepCard/` — main step card in the editor.
- `StepNotesEditor/` — inline notes editor on a step.
- `StorageAvailabilityBanner/` — banner when IndexedDB is unavailable (driven by `use-storage-probe`).
- `SwimmingStepEditor/` — sport-specific editor for swimming steps (`equipment`, distance-based intervals).
- `TargetPicker/` — sport+zone target picker (50 files: per-method panes, custom-zone overrides, swim/pace/HR/power variants).
- `TemplatePickerDialog/` — Library template picker (one of the two allowed mount sites for `WorkoutLibrary`).
- `UndoRedoButtons/` — undo/redo controls.
- `WorkoutCard/` — calendar-cell card for an unmatched workout.
- `WorkoutMetadataEditor/` — title + description editor.
- `WorkoutPreview/` — read-only KRD preview chart.

## For AI Agents

### Working In This Directory

1. **Each molecule owns one concern.** When a molecule grows over a few files, split helpers/hooks into `<name>-helpers.ts` and `use-<name>.ts`.
2. **Dialogs use Radix Dialog.** No `alert()` / `confirm()` (pinned by `utils/no-browser-alerts.test.ts`).
3. **Library imports are restricted.** Only `LibraryPage.tsx` and `TemplatePickerDialog.tsx` may import the WorkoutLibrary organism (R-LibraryNoDualMount).
4. **PII rule.** Toast/`console.*` first args must be literals or top-level SCREAMING_SNAKE_CASE constants.
5. **Match-to writes go through `buildCoachingActivityId(...)`** when generating session-match rows from the picker — never concat.

### Testing Requirements

- One `.test.tsx` per molecule. Dialog molecules pin keyboard and click paths.
- Stories cover the variants.

### Common Patterns

- Folder shape: `<Name>.tsx` + `<Name>.test.tsx` + `<Name>.stories.tsx` (optional) + `index.ts` (legacy) + optional `use-*.ts` / `<name>-helpers.ts`.

## Dependencies

### Internal

- `../atoms/*` (composition).
- `../../hooks/*`, `../../store/*` (state).
- `../../application/*` (use cases triggered from dialogs).

### External

- `react`, `@radix-ui/react-{dialog,dropdown-menu,context-menu,toast}`, `@dnd-kit/*`, `lucide-react`.

<!-- MANUAL: -->

The CoachingCard, TargetPicker, and StepCard subtrees are the most-edited surfaces in this directory. When making changes there, look for sibling `use-*.ts` hooks before reaching for new state.
