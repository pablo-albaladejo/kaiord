<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/components/pages/`

## Purpose

Page components mounted by Wouter routes in `App.tsx`. Each page composes organisms + molecules and owns top-level page state (URL params, week selection, dialog visibility) through co-located `use-*.ts` hooks. Lazy-loaded; the Suspense fallback is `RouteSpinner`.

## Key Files

### Calendar page

- `CalendarPage.tsx` / `.test.tsx` — Wouter `Route` entry. Composes header, week grid, banners, dialogs.
- `CalendarPageView.tsx` — pure presentational shell.
- `CalendarHeader.tsx` / `.test.tsx` — week-nav header.
- `CalendarWeekGrid.tsx` / `.test.tsx` — 7-day grid (`MatchedSessionCard`, `WorkoutCard`, empty-day-dialog wiring).
- `CalendarDialogs.tsx` — schedule-date / empty-day dialog mounts.
- `CalendarEmptyBanners.tsx` — empty-week / no-profile banners.
- `DateBanner.tsx` — current-week label.
- `calendar-utils.ts` / `.test.ts` — date helpers local to the page.
- `calendar-buckets.ts` / `.test.ts` — buckets activities/workouts into calendar cells.
- `calendar-hooks.ts` — composed hook for the calendar's week data.
- `use-calendar-page.ts` / `.test.tsx` — top-level page hook.
- `use-calendar-state.ts` — page-local state (week id, dialog open).
- `use-calendar-buckets-memo.ts` — memoised bucketing.

### Library page

- `LibraryPage.tsx` / `.test.tsx` — one of the two allowed mount sites for `WorkoutLibrary` (R-LibraryNoDualMount).
- `LibraryPageContent.tsx`, `LibraryPageHeader.tsx`, `LibraryPageGrid.tsx`, `LibraryPageCard.tsx` — sub-parts.
- `use-schedule-template.ts` / `.test.tsx` — schedule-from-library handler.
- `save-as-template.test.ts` — regression test for save-to-library.

### Editor page

- `EditorPage.tsx` / `.test.tsx` — `/workout/new` and `/workout/:id` entry.
- `EditorBody.tsx`, `EditorWorkflowBar.tsx`, `EditorLoadingState.tsx`, `EditorNewWorkout.tsx` (+ `.analytics.test.tsx`) — sub-parts.
- `ManualCreateSection.tsx` (+ `.analytics.test.tsx`), `OrDivider.tsx`, `WelcomeSection.tsx`, `GettingStartedTips.tsx` — new-workout landing UI.
- `use-editor-actions.ts` / `.test.ts` — editor-level action surface.
- `use-dialog-handlers.ts` — dialog open/close handlers used by `WorkoutSection`.
- `use-workout-record.ts` — load a workout record by id.
- `use-selected-activity.ts` / `.test.tsx` — current coaching-activity selection.
- `batch-prepare.ts` / `.test.ts`, `batch-process-one.ts`, `use-batch-runner.ts` / `.test.ts`, `use-batch-state.ts` / `.test.ts` — AI batch-conversion entry.

### Workout section (the in-editor body)

- `WorkoutSection.tsx` / `.test.tsx` (+ `.focus-integration.test.tsx`) — the editor's main scroll surface.

## Subdirectories

- `HelpSection/` — keyboard-shortcuts + features help drawer.
- `WorkoutSection/` — the editor body broken into per-concern files (handlers, hooks, selection hints, title, header, steps-list).

## For AI Agents

### Working In This Directory

1. **One Dexie live-query per page** is the rule. Pages compose multiple live-query hooks but each hook owns one query.
2. **Lazy-load pages.** `App.tsx` lazy-loads the three top-level pages; new pages must follow.
3. **Page-local state via hooks.** `use-<page>-state.ts` is the convention; don't put page-level state into the global store.
4. **Analytics:** `analytics.event(...)` + `analytics.pageView(path)` fire from `App.tsx`. Additional per-page events live in the page hook.

### Testing Requirements

- `.test.tsx` per page composed with `renderWithProviders` + an in-memory `PersistencePort`.
- Focus-integration tests pin the `WorkoutSection` focus-after-action behavior.

### Common Patterns

- Page = top-level component + `use-<page>-page.ts(x)` hook + view component (`<Page>View.tsx`) for presentational purity.

## Dependencies

### Internal

- `../organisms/*`, `../molecules/*`, `../atoms/*`.
- `../../hooks/*`, `../../store/*`, `../../application/*`.

### External

- `react`, `wouter`.

<!-- MANUAL: -->

`CalendarPage.tsx`, `LibraryPage.tsx`, and `EditorPage.tsx` are the only Wouter-mounted entries. Any page-like surface that lives elsewhere is a bug.
