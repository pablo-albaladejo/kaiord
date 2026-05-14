<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/components/`

## Purpose

The UI tree. Follows Atomic Design (atoms → molecules → organisms → templates → pages) plus a top-level `providers/` slot for cross-cutting providers. Direct imports only (no barrel `index.ts` consumption — see `src/PROJECT_STRUCTURE.md`).

## Key Files (top-level)

- `AppKeyboardShortcuts.tsx` — wraps `useAppKeyboardHandlers` + `useKeyboardShortcuts` in a no-render component mounted by `<App />`.
- `AppTutorial.tsx` — onboarding tutorial wrapper consumed by `<App />` via `useOnboardingTutorial`.
- `MigrationBoot.tsx` — boot-time migration component; runs Dexie-version migrations on mount and surfaces the v10 toast via `use-v10-migration-toast`.

## Subdirectories

- `atoms/` — leaf primitives (Button, Badge, Icon, Input, Toast, Tooltip, ThemeToggle, ErrorMessage, RouteSpinner).
- `molecules/` — compositions of atoms (StepCard, FormField, dialogs, CoachingCard, etc.).
- `organisms/` — feature-complete components (WorkoutList, StepEditor, WorkoutLibrary, SettingsPanel, ZoneEditor, AiWorkoutInput, ProfileManager, etc.).
- `templates/` — page layouts (MainLayout).
- `pages/` — page components mounted by Wouter routes (`CalendarPage`, `LibraryPage`, `EditorPage`).
- `providers/` — root-level providers not in `contexts/` (`AppToastProvider`).

## For AI Agents

### Working In This Directory

1. **Atomic Design layering matters.** Atoms don't import from molecules/organisms/pages; molecules don't import from organisms/pages; etc. The compiler doesn't enforce this; reviewers do.
2. **Direct imports only.** `import { Button } from "@/components/atoms/Button/Button"`, never `from "@/components/atoms"` or `from "@/components/atoms/Button"`.
3. **Each component goes in its own folder** with at minimum: `<Name>.tsx`, `<Name>.test.tsx`, often `<Name>.stories.tsx`, `index.ts` (legacy, unused), and any helpers (`<name>-styles.ts`, `<name>-helpers.ts`, `<name>-types.ts`).
4. **PII rule (R-PIIInterpolation).** All `toast(...)` and `console.*` first args under this tree must be a literal or a top-level SCREAMING_SNAKE_CASE constant referencing a literal. Templated strings need to go through `scrub-analytics-string` first.
5. **Library no-dual-mount.** Only `LibraryPage.tsx` and `TemplatePickerDialog.tsx` may import `organisms/WorkoutLibrary` / `WorkoutLibrary/WorkoutLibrary` / `LibraryDialogContent`.

### Testing Requirements

- `.test.tsx` per component; AAA + `should ` titles.
- Use `renderWithProviders` from `src/test-utils.tsx`.
- A11y-sensitive components have Storybook a11y addon coverage.
- Use `expectNoReactWarnings()` from `test-utils/` when spreading props onto DOM elements.

### Common Patterns

- Co-located styles (`<name>-styles.ts`) for components with significant Tailwind class composition.
- Stories cover the major variants; the a11y addon flags WCAG issues at story-load time.

## Dependencies

### Internal

- `../hooks/*` (the bridge between Dexie + Zustand and the React tree).
- `../store/*` (selectors + action surfaces).
- `../contexts/*` (shared runtime).
- `../types/*`.

### External

- `react`, `@radix-ui/react-{dialog,dropdown-menu,context-menu,toast}`, `@dnd-kit/*`, `lucide-react`, `tailwindcss`.

<!-- MANUAL: -->

The components tree is the largest surface in this package. When in doubt about layering, ask: does this need state from multiple slices, or behavior that touches Dexie / the bridge? If yes, it's at least a molecule; if no, it's an atom.
