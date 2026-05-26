# Design: Health Trends Overlay Single Chart

## Context

The Trends Hub at `/editor/health` mounts `TrendChartsGrid`, which renders N independent `TrendMetricChart` cards in a CSS grid. Each card mounts its own `UplotChart` (imperative `new UPlot(...)` in `useEffect`), with an independent canvas, axis pair, and zoom-via-drag state. There is no cross-pane interaction. After this change, `/health` renders one composite `TrendOverlayCard` containing N vertically-stacked panes sharing an X-cursor and zoom via `uPlot.sync`.

## Decision 1: Sync Strategy — Multi-Instance uPlot + `uPlot.sync(key)` (Option A)

**Chosen:** Option A — one `UplotChart` instance per pane, each joined to a shared `SyncPubSub` via `options.cursor.sync.key`.

Three options were evaluated:

**Option A — `uPlot.sync(syncKey)` multi-instance (CHOSEN)**

Each pane is its own `UplotChart` instance. Setting `options.cursor.sync = { key: syncKey, setSeries: true }` causes uPlot to auto-register the instance in the named `SyncPubSub`. Hover and drag-to-zoom propagate across all panes sharing the key. On `chart.destroy()` (in `UplotChart`'s existing `useEffect` cleanup), the instance un-registers automatically — no app-level `uPlot.sync(key)` call required. The sync key is a `useId()` value, stable per `TrendOverlayCard` mount and unique across concurrent mounts.

Pros: native uPlot 1.6.x API (zero bundle cost); per-pane native unit and Y axis (no normalization math); per-pane `legend.live` works out of the box; `setData` and `setSize` are independent per pane (cheap on metric toggle or range change); pane reorder is a pure React child-array reorder (no internal uPlot reshuffle); destroyed instances un-register from SyncPubSub automatically.

Cons: N canvases instead of 1 (slightly more DOM); requires stable `syncKey` lifetime across reorders; StrictMode dev-double-mount briefly creates two instances per pane (see StrictMode note below).

**Option B — Single canvas with stacked Y axes**

`series[i].scale` + `axes[i].side` stacks all series on one plot grid. Rejected: y-values overlap visually unless band-split math is added per series; the legend lists all metrics in one row (not per-pane); pane reorder requires recomputing `axes[].side` AND `scales` ranges — fragile. Loses per-pane `legend.live` ergonomics. Higher complexity, weaker UX match.

**Option C — SVG / custom canvas fallback**

Re-implements uPlot's interaction model (cursor, drag-to-zoom, sync) from scratch in TSX. Rejected: prohibitive cost; bundle grows; the existing `UplotChart` wrapper is already shipped and proven.

**Option D — Keep the current N-grid, tighten gaps**

Excluded by spec line 13 mandating cross-pane cursor and zoom sync. A static grid cannot provide that. No further analysis.

**Decision: Option A.** Registration is implicit via `options.cursor.sync.key`; cleanup is automatic via `chart.destroy()`. Confirmed against `uPlot.d.ts:161` (`static sync(key): SyncPubSub`) and `uPlot.d.ts:508-518` (`Cursor.Sync` shape).

## Decision 2: Live Value Readout — uPlot Native Legend

**Chosen:** `legend: { show: true, live: true }` + `series[1].value: (u, v) => formatValue(metric, v)`.

The spec requires a per-pane readout of the value at the cursor position. uPlot's built-in `Legend.live` mode (`uPlot.d.ts:278, 911-917`) renders the formatted `series[i].value` string in the legend element at each cursor move. This requires zero custom DOM: no floating tooltip div, no `mousemove` listener, no portal.

Per-metric formatting is handled by a dedicated `format-pane-value.ts` module:

- `weight`: 1-decimal kg (e.g. `"72.3 kg"`)
- `hrv`: integer ms (e.g. `"48 ms"`)
- `sleep`: integer score (e.g. `"82 score"`)
- `steps`: en-US thousands-separator integer via `Intl.NumberFormat("en-US")` (e.g. `"9,432 steps"`)
- null → `"—"`

## Decision 3: Pane-Order State — Session-Local React State

**Chosen:** `useState<TrendMetricKey[]>` inside `TrendOverlayCard`, initialized from `TREND_METRICS` canonical order (sleep → hrv → weight → steps). Order is reconciled when `selected` changes: metrics that were deselected are dropped; newly-selected metrics are appended at the end; user-reordered positions of metrics not being toggled are preserved.

**Rejected:** persisting to Dexie (`profileSettings.trendsPaneOrder`) — this is a Non-Goal by spec mandate. Order resets on unmount (tab switch / page navigation). No Dexie table, migration, or Zustand write is introduced.

## Decision 4: Drag-to-Reorder — `@dnd-kit/sortable` via Existing Hooks

**Chosen:** reuse `hooks/use-dnd-card-wrapper.ts` + mirror the `organisms/WorkoutList/WorkoutList.tsx` `DndContext + SortableContext + verticalListSortingStrategy` provider pattern in a local `use-overlay-pane-dnd.ts` hook.

The precedent hook (`useDndCardWrapper`) wraps `useSortable({ id })` + `CSS.Transform.toString(transform)` + `opacity:0.5 while dragging` + role-stripped attributes. It is already used by `SortableStepCard` and `SortableRepetitionBlockCard`. The overlay pane wrapper takes the same shape: no new dnd helper, no new top-level dep.

A `DragOverlay` ghost is omitted: the pane shifts in-place via `useSortable`'s transform style (no visual ghost needed for a vertically-stacked list of full-width panes). Drag state is session-local; no persistence.

**Note:** `packages/workout-spa-editor/src/components/pages/calendar-dnd/` is NOT the dnd pattern reference — that folder holds pointer-drag helpers only (no `@dnd-kit/sortable` imports). The canonical `useSortable` precedent is `hooks/use-dnd-card-wrapper.ts` + `organisms/WorkoutList/WorkoutList.tsx`.

## Decision 5: Empty-Pane Presentation — Static Placeholder with `min-h` Wrapper

**Chosen:** Option α — static text-only placeholder when `series.points.length === 0`.

Four module-top constants (`SLEEP_EMPTY_TEMPLATE`, `HRV_EMPTY_TEMPLATE`, `WEIGHT_EMPTY_TEMPLATE`, `STEPS_EMPTY_TEMPLATE`) hold English template strings matching existing copy in `TrendChartsGrid.tsx:10` and `TrendMetricChart.tsx:62,69`. A `formatEmpty(metric, rangeDays)` helper replaces the `{N}` slot with `rangeDays`. The placeholder is wrapped in a `min-h-[160px] flex items-center justify-center` block so the pane keeps its visual rhythm; the drag handle in the pane header remains positioned above.

**R-PIIInterpolation scope:** the empty placeholder text is rendered via JSX, not via `toast()` or `console.*`. `scripts/check-no-pii-leakage.mjs` only flags first arguments of `toast()` and `console.*` calls in `packages/workout-spa-editor/src/{components,hooks,lib}/**`. JSX-rendered strings are unrestricted. `rangeDays` is a numeric UI parameter, not a biometric value; `formatEmpty` never reads `series.points`.

**Rejected:** Option β — rendering a zero-data uPlot canvas with a custom overlay div. Mounts a canvas for no reason (perf + a11y noise); requires floating DOM synced to canvas size — the same pattern the spec rejects for the live legend.

## Decision 6: Visual-Tightness Contract (VT1–VT3)

Three measurable constraints convert the "una sola gráfica" intent from a subjective goal to a testable assertion:

| #   | Constraint                                                                                         | Enforcement                                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VT1 | `axes[0]` (X axis) config is deep-equal across all panes — same `space`/`incrs`/`values` formatter | `build-pane-options.test.ts`: `JSON.stringify(opts.axes[0])` is equal across all 4 metric calls                                                                       |
| VT2 | Inter-pane vertical gap ≤ 8 px — Tailwind `gap-2` on the pane stack container                      | `TrendOverlayCard.test.tsx`: assert `wrapper.className.includes("gap-2")`                                                                                             |
| VT3 | No per-pane border — only the outer card has a border                                              | `TrendOverlayPane.test.tsx`: assert pane root `className` does NOT match `/\bborder(\b\|-)/`; `TrendOverlayCard.test.tsx`: assert card `className.includes("border")` |

## Decision 7: File Structure — Eight New Files + Two Edits + One Deletion Set

Eight new files (six initially planned + two hooks extracted per the consensus review to keep `TrendOverlayCard.tsx` under the 50-line component cap), each well under the 80-line / 60-line-component caps:

| File                         | Purpose                                                                                                                   | Approx LOC |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `TrendOverlayCard.tsx`       | Outer card; owns `syncKey = useId()`; mounts `DndContext + SortableContext`; maps ordered metrics to `<TrendOverlayPane>` | ≤50        |
| `TrendOverlayPane.tsx`       | One pane row; `useDndCardWrapper`; header + body (canvas OR placeholder)                                                  | ≤60        |
| `TrendOverlayPaneHeader.tsx` | Metric label, unit, drag-handle `<button>` with `aria-label`                                                              | ≤40        |
| `EmptyPanePlaceholder.tsx`   | Static placeholder component; `formatEmpty(metric, rangeDays)`                                                            | ≤40        |
| `build-pane-options.ts`      | `buildPaneOptions(metric, width, height, syncKey)` returns `uPlot.Options`                                                | ≤80        |
| `format-pane-value.ts`       | `formatValue(metric, value)` per-metric formatter                                                                         | ≤40        |
| `use-overlay-pane-order.ts`  | `paneOrder` state + reconcile on `selected` change + `reorder`                                                            | ≤60        |
| `use-overlay-pane-dnd.ts`    | `@dnd-kit` plumbing: sensors, `sortableIds`, `handleDragEnd`                                                              | ≤60        |

File-level edits:

- `pages/health/HealthDashboardPage.tsx`: swap `<TrendChartsGrid>` for `<TrendOverlayCard>` (1-line import + 1-line JSX swap).

Deletion set (Phase 4):

- `pages/health/trends/TrendChartsGrid.tsx`
- `pages/health/trends/TrendChartsGrid.test.tsx`
- `pages/health/trends/TrendMetricChart.tsx`
- `pages/health/trends/trend-chart-options.ts` (if no remaining import of `buildTrendOptions`)
- `pages/health/trends/trend-chart-options.test.ts`

## Decision 8: OpenSpec Delta — Plan B Fired

`npx openspec validate health-trends-overlay-single-chart` rejected a no-`specs/` change ("Change must have at least one delta"). Plan B was triggered at Phase 0 verification.

`specs/spa-routing/spec.md` was added with a `## MODIFIED Requirements` block for the "Wellness trends hub is reachable from the header without a primary tab" requirement. The modification replaces the prior wording "renders a chart for each selected metric over that range" (canonical `spec.md:204-223`) with the composite overlay specification: one `TrendOverlayCard` with one pane per metric, cross-pane cursor and zoom sync via `uPlot.sync`. Five scenarios cover the overlay layout, cross-pane cursor behavior, pane toggle/reorder order-preservation, and the empty-pane placeholder.

This stays within the `spa-routing` capability's existing scope — no new capability is introduced. The modification tightens an existing requirement to match the implemented layout.

**Verification:** `npx openspec validate health-trends-overlay-single-chart` → `Change 'health-trends-overlay-single-chart' is valid`. `pnpm lint:specs` → `39 passed, 0 failed`.

## Risk Notes

**StrictMode dev-double-mount.** `packages/workout-spa-editor/src/main.tsx:27` wraps the app in `<StrictMode>`. In development, React invokes effects twice on mount. This creates two uPlot instances per pane briefly. The first instance's `useEffect` cleanup runs `chart.destroy()` before the second instance registers with SyncPubSub. Steady-state is single-instance. Production builds run effects once. No leak: `chart.destroy()` un-registers via SyncPubSub's `unsub` (verified by the sync test's `plots.length` drop assertion). The `trend-overlay-sync.test.ts` sync-membership assertion may need an `act()` flush to settle double-invocation before reading `plots.length`.

**Drag-during-sync.** During a drag, `useSortable` applies a CSS `transform` only — the pane does NOT remount. The uPlot instance (and its SyncPubSub membership) is unaffected by reorder. Cursor sync persists across drag-to-reorder.

**Real-uPlot construction in jsdom.** The sync test (`trend-overlay-sync.test.ts`) reads `uPlot.sync(key).plots` (a JS-level array), not canvas pixels. If `new UPlot(...)` throws because jsdom lacks canvas APIs, strategy B instantiates uPlot with minimal options (`width:1, height:1, scales:{x:{time:false}}`) to bypass time-axis rendering. As a last resort, stub `HTMLCanvasElement.prototype.getContext` in the test file's setup for this single file only.

**Changeset.** `@kaiord/workout-spa-editor` is a private package, but this PR includes `.changeset/health-trends-overlay-single-chart.md` (a `minor` bump) for release-tracking hygiene, matching the pattern of recent SPA-only changes shipped in this repo. The changeset will be consumed (or no-op for the private package) by the regular release flow.

**Visual-baseline shift.** The `/health` layout changes. Trigger `update-visual-baselines.yml` (Linux/chromium) in CI after the PR is up. Do NOT regenerate locally.
