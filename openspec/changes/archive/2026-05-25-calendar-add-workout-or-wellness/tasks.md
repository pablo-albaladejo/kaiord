<!-- opsx-ship: chunking
PR 1 (write-path):      §1
PR 2 (wellness-ui):     §2
PR 3 (chooser+ungate):  §3
PR 4 (gates):           §4
PR 5 (verify+archive):  §5
-->

> Tasks: 30 completed, 0 deferred

## 1. Application use case + mapper (the write path) [PR-1]

- [x] 1.1 Add `application/health/manual-health-metric.ts` — shared `type ManualHealthMetric = "weight" | "sleep" | "hrv" | "steps"`, a metric→repo selector (each metric → its own Dexie table), and `datePart` reuse helper.
- [x] 1.2 Add `application/health/manual-health-payload.mapper.ts` — pure builders: `(value, day) → WeightMeasurement | HrvSummary | SleepRecord` for weight/HRV/sleep; `(steps, day, prior?: DailyWellness) → DailyWellness` for steps (merge-preserve). Sleep: `{ startTime, endTime: startTime, totalDurationSeconds: 0, stages: [], score }`. HRV: `measurementWindow: "spot"`. Weight: `measuredAt` from `${day}T12:00:00.000Z`. No tests (mapper convention — exercised by use-case tests).
- [x] 1.3 Add `application/health/save-manual-health-metric.use-case.ts` — `saveManualHealthMetric(deps, input) => Promise<{recordId}>`. Selects metric's repo; calls `getByProfileAndDateRange(profileId, day, day)` (no `krd.kind` filter — table already isolates metric); reuses `rows[0]?.id`; builds payload via mapper (passes `rows[0]?.krd` as `prior` for steps merge-preserve); `repo.put(...)`. Wrapped in `persistence.transaction(...)`.
- [x] 1.4 Add `application/health/save-manual-health-metric.use-case.test.ts` — AAA tests vs in-memory persistence:
  - should write a new weight record for a day with no prior weight
  - should reuse the existing record id when a weight already exists for that day (assert range query returns exactly 1 row after two awaited saves)
  - should insert TWO rows when the unlocked use case is called concurrently (race demonstration — `Promise.all` same day+metric; asserts `length === 2`; documents the check-then-act gap, motivates Phase 2 lock)
  - should overwrite an imported value with a manual value for the same date+metric (weight/sleep/hrv)
  - should preserve prior calories/intensity when overwriting steps (seed `steps:1000, activeCalories:300`; save `steps:8000`; assert `steps:8000` AND `activeCalories:300`)
  - should zero-fill calories/intensity when saving steps for a day with no prior daily row
  - should build a minimal valid sleep payload (`startTime == endTime`, 0 duration, empty stages, score) that passes `sleepRecordSchema.parse`
  - should build a minimal valid daily payload (steps-only, calories/intensity zero-filled) that passes `dailyWellnessSchema.parse`
  - should set hrv `measurementWindow` to a valid enum value (`"spot"`)
  - should not write when the value is empty/undefined (per-metric)
- [x] 1.5 Run `pnpm --filter @kaiord/workout-spa-editor test` — all new tests pass, coverage ≥70% for new files, zero warnings.

## 2. Wellness entry UI (form + import action) [PR-2]

- [x] 2.1 Add `components/molecules/WellnessEntryDialog/WellnessMetricField.tsx` — one labeled `<input type="number">` with `aria-label`; keeps the form file small.
- [x] 2.2 Add `components/molecules/WellnessEntryDialog/WellnessEntryForm.tsx` — four labeled fields (weight/sleep-score/HRV/steps) as ephemeral `useState`; ONE Save button; collects only filled fields into `{metric → value}` and calls `submit(values)`. Save disabled while `isSaving`.
- [x] 2.3 Add `components/molecules/WellnessEntryDialog/use-save-wellness.ts` — `usePersistence()` + `getActiveId()`; exposes `{ submit, isSaving }`. `submit` iterates filled metrics, calls `saveManualHealthMetric` for each; owns single in-flight lock (`useRef` boolean + `isSaving` state) — re-entrant calls are ignored while lock is held. Static toast constants `TOAST_WELLNESS_SAVED` / `TOAST_WELLNESS_SAVE_FAILED` at module top (R-PIIInterpolation).
- [x] 2.4 Add `components/molecules/WellnessEntryDialog/WellnessEntryDialog.tsx` — Radix `Dialog.Root` controlled by parent `useState`; reuses `DIALOG_CONTENT_CLASSES` / `DIALOG_OVERLAY_CLASSES`; title includes the date (a11y); hosts form + import action.
- [x] 2.5 Add `components/molecules/WellnessEntryDialog/wellness-import-action.tsx` — "Import a file" button that enters the existing FIT health-import flow. Does NOT pass `?date=<clickedDay>`; import is file-dated, not clicked-day-dated.
- [x] 2.6 Add tests for dialog + form + hook (AAA):
  - should render four metric fields with accessible labels
  - should persist every filled metric in a single submit (fill weight AND steps → assert both rows written)
  - should submit only filled fields (partial entry); unfilled fields write nothing
  - should not write when all fields are empty
  - should show a static success toast on submit (assert no interpolated value)
  - should keep exactly one row when the submit is fired twice without awaiting (single in-flight lock — double-click Save + assert `getByProfileAndDateRange(day,day).length === 1`)
  - should disable the Save button while `isSaving`
  - should enter the FIT import flow when "Import a file" is chosen, without passing `?date=<day>`
  - should be keyboard-navigable / focus-trapped (Radix dialog)
- [x] 2.7 Run `pnpm --filter @kaiord/workout-spa-editor test` — 100% pass, ≥70% coverage, zero warnings.

## 3. Chooser + intercept + ungate (`+` on every day) [PR-3]

- [x] 3.1 Add `components/molecules/AddEntryChooser/AddEntryChooser.tsx` — Radix `Dialog` with two `PickerTile`-style tiles (Workout | Wellness); `onChoose("workout" | "wellness")`; accessible name; keyboard-navigable; browser back button closes without losing calendar route.
- [x] 3.2 Extend `components/pages/use-calendar-state.ts` — add `addEntryDate: string | null` + `setAddEntryDate` + `wellnessDate` state; rename `handleEmptyDayClick` → `handleAddClick(date)`; add `handleChooseWorkout` (navigate `/workout/new?date=<day>`) and `handleChooseWellness` (open `WellnessEntryDialog`). Extract `use-add-entry-chooser.ts` if the file would exceed 80 lines.
- [x] 3.3 Update `molecules/WorkoutCard/DayColumn.tsx` — remove `{total === 0 && …}` gate; always render the add button (`DayColumnAddButton`) with `onAddClick` prop.
- [x] 3.4 Update `molecules/WorkoutCard/DayColumnAddButton.tsx` — rename prop `onEmptyDayClick` → `onAddClick`.
- [x] 3.5 Thread the renamed prop `onAddClick` end-to-end: `CalendarWeekGrid.tsx`, `CalendarBodyView.tsx`, `CalendarPage.tsx`, `CalendarPageView.tsx`. Rewire the list-view `+` in `CalendarWeekList.tsx` to the chooser callback.
- [x] 3.6 Mount `<AddEntryChooser>` and `<WellnessEntryDialog>` in `CalendarPage.tsx` / `CalendarPageView.tsx`, bound to the new state.
- [x] 3.7 Add tests (AAA):
  - should open the chooser (not navigate) when `+` is clicked
  - should render the `+` on a day that already has a workout (grid)
  - should render the `+` on every list-view day
  - should navigate to `/workout/new?date=<day>` when Workout is chosen
  - should open the wellness entry surface when Wellness is chosen
  - should NOT start a drag when the `+` is pressed (pointerdown)
  - should still reschedule when a workout is dropped on a cell that shows the `+`
- [x] 3.8 Run `pnpm --filter @kaiord/workout-spa-editor test` — 100% pass, ≥70% coverage.

## 4. Integration, read-back, quality gates [PR-3 tail or PR-4]

- [x] 4.1 Integration test: save weight for a day via `saveManualHealthMetric` → assert the weight badge renders in that day's `WellnessBand` after `useCalendarWellnessWeekLive` refreshes (AC5).
- [x] 4.2 `pnpm --filter @kaiord/workout-spa-editor lint:fix` then `lint` — zero ESLint/TypeScript/Prettier warnings.
- [x] 4.3 `pnpm --filter @kaiord/workout-spa-editor test` — 100% pass, ≥70% coverage, zero warnings.
- [x] 4.4 `pnpm --filter @kaiord/workout-spa-editor build` — clean output.
- [x] 4.5 `pnpm test:scripts` — all mechanical guards green (R-PIIInterpolation, R-SessionMatchIdShape, no-zustand-writethrough, no-library-dual-mount).
- [x] 4.6 Add a `patch`/`minor` changeset (`pnpm exec changeset`) for `@kaiord/workout-spa-editor`.

## 5. OpenSpec verify + visual baselines + archive

- [x] 5.1 `npx openspec validate calendar-add-workout-or-wellness` — passes.
- [x] 5.2 `pnpm lint:specs` — passes (no orphaned scenario, no format violation).
- [x] 5.3 Trigger `update-visual-baselines.yml` workflow (Linux/chromium) in CI after PR-3 is up — the always-visible `+` shifts calendar screenshots. Do NOT regenerate locally. _(Triggered on the branch — run 26400642710 succeeded with no snapshot diff; the always-visible `+` did not shift any captured visual spec, so no baseline commit was needed. The broken e2e were functional specs asserting the old `+`→navigate behavior, updated to go through the chooser.)_
- [x] 5.4 After merge: `/opsx:archive` (date-prefix the change folder, set `> Completed:`), then `pnpm archive:index`. _(Done — archived as 2026-05-25-calendar-add-workout-or-wellness with the `> Completed:` marker; canonical spa-routing synced; index regenerated.)_
