<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/components/organisms/`

## Purpose

Feature-complete components composed from molecules + atoms. Organisms own multi-slice state (often through dedicated hooks) and are the smallest unit that's individually meaningful to the user.

## Subdirectories

- `AiWorkoutInput/` — AI workout generation form. Natural-language prompt + provider picker + zones context indicator + cost preview.
- `AutoMatchBanner/` — top-of-calendar banner suggesting auto-match opportunities.
- `BatchCostConfirmation/` — confirmation dialog for AI batch conversion with rolled-up cost estimate.
- `CoachingSidebar/` — left-side coaching list on the calendar.
- `EditorContextMenu/` — Radix context menu over the workout list (copy, paste, duplicate, delete).
- `OnboardingTutorial/` — first-run tutorial flow.
- `ProfileManager/` — profile CRUD + sport-specific zones tabbed UI.
- `SettingsPanel/` — settings dialog (AI, Extensions, Privacy, Usage tabs).
- `StepEditor/` — main step-edit form (sport-aware fields, target picker, duration picker, notes).
- `WorkoutLibrary/` — Library content. **R-LibraryNoDualMount**: only `LibraryPage.tsx` and `TemplatePickerDialog.tsx` may import this organism.
- `WorkoutList/` — the editor's main list (steps + blocks), with `@dnd-kit/sortable` reordering.
- `WorkoutStats/` — duration / distance / TSS panel.
- `ZoneEditor/` — sport-specific zone editor used by Profile Manager.
- `ZonesConflictDialog/` — surface conflicts when pushing zones to Train2Go.

## For AI Agents

### Working In This Directory

1. **Organisms own a hook surface.** Each organism either has its own `use-*.ts` hooks inside the folder or composes hooks from `src/hooks/`. UI shouldn't directly call use cases — go through a hook.
2. **Library no-dual-mount.** When adding a new organism that needs Library content, route through `TemplatePickerDialog` instead of importing `WorkoutLibrary` directly. The mechanical guard fails CI on imports from other call sites.
3. **PII rule.** Static literals / constants for toast + console first args.
4. **Storybook for visual variants.** Organisms with multi-state UI (e.g. `StepEditor`, `WorkoutList`) ship stories.

### Testing Requirements

- `.test.tsx` per organism + per major sub-component.
- Major flows (StepEditor, SettingsPanel, ProfileManager) have integration coverage.

### Common Patterns

- Folder shape: `<Name>.tsx` + sub-components + hooks (`use-*.ts`) + helpers (`*-helpers.ts`) + stories + tests.
- Tab-style organisms (SettingsPanel, ProfileManager) split each tab into a sibling file.

## Dependencies

### Internal

- `../atoms/*`, `../molecules/*`.
- `../../hooks/*`, `../../store/*`, `../../application/*`.

### External

- `react`, `@radix-ui/*`, `@dnd-kit/*`, `lucide-react`.

<!-- MANUAL: -->

Library no-dual-mount is the most-likely-to-trip mechanical guard when refactoring this tree. Before importing `WorkoutLibrary` anywhere, check the guard.
