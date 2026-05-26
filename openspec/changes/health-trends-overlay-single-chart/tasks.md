> Tasks: 6 completed, 0 deferred

## Phase 0 — OpenSpec artifacts [pre-PR]

- [x] 0.1 Create `openspec/changes/health-trends-overlay-single-chart/proposal.md`
- [x] 0.2 Create `openspec/changes/health-trends-overlay-single-chart/design.md`
- [x] 0.3 Create `openspec/changes/health-trends-overlay-single-chart/tasks.md`
- [x] 0.4 Run `npx openspec validate health-trends-overlay-single-chart` — Plan B triggered: `openspec validate` rejected no-`specs/` change; created `specs/spa-routing/spec.md` with `## MODIFIED Requirements` for the Trends Hub requirement; re-ran validate → `Change 'health-trends-overlay-single-chart' is valid`
- [x] 0.5 Run `pnpm lint:specs` — `39 passed, 0 failed`
- [x] 0.6 Create `openspec/changes/health-trends-overlay-single-chart/specs/spa-routing/spec.md` (Plan B delta — MODIFIED requirement for the Wellness trends hub, replacing the N-chart grid wording with the composite overlay spec)

## Phase 1 — Scaffold the overlay (no behavior wired yet) [PR-1]

- [ ] 1.1 Add `pages/health/trends/format-pane-value.ts` — `formatValue(metric, value)` per-metric formatter (weight: 1-decimal kg; hrv: integer ms; sleep: integer score; steps: en-US thousands-separator via `Intl.NumberFormat("en-US")`; null → `"—"`)
- [ ] 1.2 Add `pages/health/trends/build-pane-options.ts` — `buildPaneOptions(metric, width, height, syncKey)` returns `uPlot.Options` with `cursor.sync = { key: syncKey, setSeries: true }`, `legend: { show: true, live: true }`, `series[1].value: (u, v) => formatValue(metric, v)`, shared `axes[0]` X-axis config (VT1 contract)
- [ ] 1.3 Add `pages/health/trends/EmptyPanePlaceholder.tsx` — four module-top English template constants (`SLEEP_EMPTY_TEMPLATE`, `HRV_EMPTY_TEMPLATE`, `WEIGHT_EMPTY_TEMPLATE`, `STEPS_EMPTY_TEMPLATE`); `formatEmpty(metric, rangeDays)` swaps `{N}`; `min-h-[160px] flex items-center justify-center` wrapper
- [ ] 1.4 Add `pages/health/trends/TrendOverlayPaneHeader.tsx` — metric label, unit, drag-handle `<button aria-label="Reorder pane: {metric.label}">` spreading `dragHandleProps`
- [ ] 1.5 Add `pages/health/trends/use-overlay-pane-order.ts` — `useState<TrendMetricKey[]>` initialized from `TREND_METRICS.map(m => m.key)`; reconcile effect on `selected` change (drop deselected, append newly-selected, preserve user-reordered positions); returns `{ paneOrder, reorder(activeKey, overKey) }`
- [ ] 1.6 Add `pages/health/trends/use-overlay-pane-dnd.ts` — `useSensors(PointerSensor, KeyboardSensor)`; `sortableIds`; `handleDragEnd({active, over})` calls `reorder`; mirrors `organisms/WorkoutList/WorkoutList.tsx` provider pattern
- [ ] 1.7 Add `pages/health/trends/TrendOverlayPane.tsx` — `useDndCardWrapper(metric.key)`; header (`<TrendOverlayPaneHeader>`); body: canvas mock (`<UplotChart>`) when `points.length > 0` and not loading, `"Loading…"` when `loading && points.length === 0`, `<EmptyPanePlaceholder>` when `points.length === 0`; NO per-pane border (VT3)
- [ ] 1.8 Add `pages/health/trends/TrendOverlayCard.tsx` — `syncKey = useId()`; `useOverlayPaneOrder`; `use-overlay-pane-dnd`; `DndContext + SortableContext + verticalListSortingStrategy`; maps ordered metrics to `<TrendOverlayPane>`; empty-set guard prints existing `"Select at least one metric to see its trend."` literal; outer card border (VT3); `gap-2` pane stack (VT2)
- [ ] 1.9 Edit `pages/health/HealthDashboardPage.tsx` — swap `<TrendChartsGrid>` import + JSX for `<TrendOverlayCard>`; pass `selected`, `series`, `rangeDays`
- [ ] 1.10 Run `pnpm --filter @kaiord/workout-spa-editor build` — clean output
- [ ] 1.11 Run `pnpm lint` — zero ESLint/TypeScript/Prettier warnings

## Phase 2 — Wire sync + live legend + empty state [PR-1 continued or PR-2]

- [ ] 2.1 Verify `build-pane-options.ts` passes `cursor.sync.key` through and `legend.live: true` is set — hover on any pane moves the cursor on all panes; drag-to-zoom syncs the X domain across all panes
- [ ] 2.2 Verify `TrendOverlayPane.tsx` renders `<EmptyPanePlaceholder>` when `points.length === 0` and the canvas when `points.length > 0`; renders `"Loading…"` when `loading && points.length === 0`
- [ ] 2.3 Verify `TrendOverlayCard.tsx` passes `syncKey` from `useId()` to every `<TrendOverlayPane>`
- [ ] 2.4 Verify range selector 30 ↔ 90 ↔ 365 triggers `useTrendSeries` refetch; all panes swap data; sync key unchanged
- [ ] 2.5 Verify metric toggle: selecting adds pane at end; deselecting removes pane; user-reordered positions of remaining metrics preserved
- [ ] 2.6 Run `pnpm --filter @kaiord/workout-spa-editor build` — clean output

## Phase 3 — Tests [PR-2 or PR-3]

- [ ] 3.1 Add `format-pane-value.test.ts` — AAA; weight → `"72.3 kg"`; hrv → `"48 ms"`; sleep → `"82 score"`; steps → `"9,432 steps"`; null → `"—"`
- [ ] 3.2 Add `build-pane-options.test.ts` — AAA; `cursor.sync.key === syncKey`; `cursor.sync.setSeries === true`; `legend.live === true` + `legend.show === true`; `series[1].value(u, v)` formatted per metric; VT1: `JSON.stringify(opts.axes[0])` deep-equal across all 4 metric calls
- [ ] 3.3 Add `EmptyPanePlaceholder.test.tsx` — AAA; renders per-metric English placeholder; interpolates `rangeDays` into `{N}`; component never reads `series.points` (passing non-empty array does not change render output when component is rendered directly)
- [ ] 3.4 Add `use-overlay-pane-order.test.ts` — AAA; initial order matches `TREND_METRICS` canonical order; `reorder("sleep","weight")` swaps via `arrayMove`; reconcile drops deselected key; reconcile appends newly-selected at end; should preserve user-reordered position of metrics not being toggled when the selected set changes
- [ ] 3.5 Add `use-overlay-pane-dnd.test.ts` — AAA; returns sensors including PointerSensor + KeyboardSensor; `handleDragEnd({active:{id:"sleep"}, over:{id:"weight"}})` calls `reorder("sleep","weight")`; `handleDragEnd({active:{id:"sleep"}, over: null})` is a no-op
- [ ] 3.6 Add `TrendOverlayPane.test.tsx` — AAA; mocks `./UplotChart`; renders canvas mock when `points.length > 0`; renders `EmptyPanePlaceholder` when `points.length === 0`; header shows metric label + drag handle; VT3: pane root `className` does NOT match `/\bborder(\b\|-)/`
- [ ] 3.7 Add `TrendOverlayCard.test.tsx` — AAA; mocks `./UplotChart`; renders empty-message when `selected.size === 0`; renders one pane per selected metric; panes in `TREND_METRICS` canonical order on initial render; toggling metric off removes its pane; toggling metric back on appends at end; VT2: wrapper `className.includes("gap-2")`; VT3: outer card `className.includes("border")`
- [ ] 3.8 Add `trend-overlay-sync.test.ts` — AAA; does NOT mock `UplotChart`; strategy A: render `<TrendOverlayCard>` with injectable `syncKeyOverride` prop + N selected metrics; assert `uPlot.sync(testKey).plots.length === N`; toggle one metric off; assert `=== N-1`; strategy B (fallback if jsdom canvas rejects construction): instantiate `new uPlot({cursor:{sync:{key:K}}, width:1, height:1, scales:{x:{time:false}}, series:[{},{}]}, [[0],[0]], document.createElement("div"))` × N; assert `uPlot.sync(K).plots.length === N`; `chart.destroy()` one; assert `=== N-1`
- [ ] 3.9 Run `pnpm --filter @kaiord/workout-spa-editor test` — 100% pass, ≥70% coverage, zero warnings

## Phase 4 — Cleanup, lint, build, verify [PR-3 or final PR]

- [ ] 4.1 `grep -rn "buildTrendOptions" packages/workout-spa-editor/src` — confirm zero remaining imports
- [ ] 4.2 Delete `pages/health/trends/TrendChartsGrid.tsx`
- [ ] 4.3 Delete `pages/health/trends/TrendChartsGrid.test.tsx`
- [ ] 4.4 Delete `pages/health/trends/TrendMetricChart.tsx`
- [ ] 4.5 Delete `pages/health/trends/trend-chart-options.ts`
- [ ] 4.6 Delete `pages/health/trends/trend-chart-options.test.ts`
- [ ] 4.7 `grep -rn "TrendChartsGrid\|TrendMetricChart\|buildTrendOptions" packages/workout-spa-editor/src` — confirm zero stale references
- [ ] 4.8 Run `pnpm --filter @kaiord/workout-spa-editor lint:fix`
- [ ] 4.9 Run `pnpm --filter @kaiord/workout-spa-editor lint` — zero ESLint/TypeScript/Prettier warnings
- [ ] 4.10 Run `pnpm --filter @kaiord/workout-spa-editor test` — 100% pass, ≥70% coverage, zero warnings
- [ ] 4.11 Run `pnpm --filter @kaiord/workout-spa-editor build` — clean output
- [ ] 4.12 Run `pnpm test:scripts` — all mechanical guards green (R-PIIInterpolation, R-SessionMatchIdShape, no-zustand-writethrough, no-library-dual-mount)
- [ ] 4.13 Run `npx openspec validate health-trends-overlay-single-chart` — passes
- [ ] 4.14 Run `pnpm lint:specs` — passes

## Phase 5 — Visual baselines + archive [post-merge]

- [ ] 5.1 Trigger `update-visual-baselines.yml` (Linux/chromium) in CI after PR is up — the overlay layout shifts `/health` screenshots; do NOT regenerate locally
- [ ] 5.2 After merge: run `/opsx:archive` — date-prefix the change folder, set `> Completed: YYYY-MM-DD`
- [ ] 5.3 Run `pnpm archive:index` to refresh `openspec/changes/archive/README.md`
