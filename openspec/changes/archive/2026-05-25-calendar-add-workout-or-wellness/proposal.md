> Completed: 2026-05-25

> Depends on remove-subtabs-unify-calendar

## Why

The predecessor change (`remove-subtabs-unify-calendar`) folded wellness into the calendar and added per-day wellness bands that show sleep, HRV, weight, and steps badges. Each badge drills down to the corresponding per-metric history page. However, there is currently no path to **add** wellness data for a given day from the calendar — clicking the `+` affordance on an empty day navigates directly to `/workout/new?date=<day>` without offering a wellness entry option.

Additionally, the `+` affordance is gated on the training bucket count being zero — it only appears on days with no workouts. An athlete who has already planned or logged a workout for a day cannot trigger it at all.

This change adds the **add-entry chooser**: a two-step dialog that appears when any calendar `+` is activated (on every day, in both grid and list views), offering a **Workout** or **Wellness** choice. The Workout branch preserves existing behavior (`/workout/new?date=<day>`). The Wellness branch opens a manual entry surface with a form (weight / sleep score / HRV / steps) and an "Import a file" action for FIT health files. Manual entries are persisted as schema-valid KRD records via a new application use case; the live wellness query already in place causes the badge to appear on the calendar after save.

> **Depends on `remove-subtabs-unify-calendar`.** That change ADDED the "Calendar day cells surface per-day wellness with explicit training/wellness differentiation" requirement this proposal modifies. It MUST be archived first (its `spa-routing` deltas synced into the canonical `openspec/specs/spa-routing/spec.md`) so the MODIFIED delta here composes against an up-to-date canonical spec.

## What Changes

- **Ungate the `+` button.** Remove the `total === 0` guard from `DayColumn`; the add button renders on every day, not only empty ones. The same change applies to the list-view day rows in `CalendarWeekList`.
- **Add the add-entry chooser.** A Radix `Dialog` with two `PickerTile`-style tiles — **Workout** and **Wellness** — opens when `+` is clicked. Choosing Workout navigates to `/workout/new?date=<day>`. Choosing Wellness opens the wellness entry surface for that day.
- **Add the wellness entry surface.** A `WellnessEntryDialog` (Radix controlled `Dialog`) hosts a four-field form (weight, sleep score, HRV, steps) and an "Import a file" action. Saving persists every filled field as a KRD record via `saveManualHealthMetric`; the existing `useCalendarWellnessWeekLive` live query causes the badge to appear. Import reuses the existing FIT health-import path, which is file-dated (the clicked day's date is ignored).
- **Add the write-path use case.** `save-manual-health-metric.use-case.ts` (under `packages/workout-spa-editor/src/application/health/`) performs a find-then-upsert for each metric using `getByProfileAndDateRange(profileId, day, day)` against the metric's own Dexie table. Steps use merge-preserve: only the `steps` field is overwritten; prior `activeCalories`/`intensityMinutes` are preserved.

## Capabilities

### Modified Capabilities

- `spa-routing`: modifies the "Calendar day cells surface per-day wellness with explicit training/wellness differentiation" requirement so the `+` affordance renders on every day (no longer gated on training count) and on click opens the add-entry chooser (Workout | Wellness) rather than navigating directly; adds the "Per-day add-entry chooser" and "Manual wellness entry" surface requirements.

## Impact

- **Code (SPA only)**:
  - Write path: new `application/health/manual-health-payload.mapper.ts`, `application/health/manual-health-metric.ts`, `application/health/save-manual-health-metric.use-case.ts`, and their tests.
  - Chooser: new `components/molecules/AddEntryChooser/AddEntryChooser.tsx`; `use-calendar-state.ts` extended; `DayColumn.tsx` ungate; `DayColumnAddButton.tsx` prop rename; prop threading through `CalendarWeekGrid`, `CalendarBodyView`, `CalendarPage`, `CalendarPageView`, `CalendarWeekList`.
  - Wellness entry surface: new `components/molecules/WellnessEntryDialog/` (dialog, form, metric field, `use-save-wellness` hook).
- **Tests**: write-path unit tests (AAA); form + hook tests; chooser tests; Phase 4 integration badge-refresh test.
- **No `core`/adapter/MCP changes**; no new Dexie schema or migration (v16 tables suffice); no change to the FIT import pipeline or `health-destination.ts`.
- **Breaking changes**: none (private `@kaiord/workout-spa-editor` only). A `patch`/`minor` changeset for the private SPA package.
