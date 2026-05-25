## Context

The SPA shipped a primary navigation surface in `add-health-metrics-to-krd` §7. The deep-dive trace (`.omc/specs/deep-dive-trace-remove-subtabs-unify-calendar.md`) confirmed, against the shipped code:

- `PrimaryNav` (`components/templates/MainLayout/PrimaryNav.tsx`) renders three tabs — Training (`/calendar`), Health (`/health`), Settings (`/settings/ai`) — and is imported and mounted in exactly one place: `MainLayout.tsx:7,20`. `grep PrimaryNav` returns only `MainLayout`. Removal is mechanical.
- The header already exposes the same destinations: `status-entry-defs.ts` defines `ENTRY_DEFS` = Calendar, Library, New workout, **Settings**. So the Training and Settings tabs are both redundant. There is **no Health entry** in the header — removing the Health tab therefore orphans `/health/*` unless wellness moves into the calendar.
- The calendar is a 7-column week grid: `CalendarPage` builds per-day buckets (matched sessions / solo plans / solo actuals) → `CalendarBodyView` → `CalendarWeekGrid` → `DayColumn` → `renderDayCards`. `DayColumn` is a flex column (`min-h-[120px]`, `min-w-[140px]` on mobile) rendering only training today; the `+ Add` affordance shows when the training bucket total is zero.
- Health data is already persisted and queryable: Dexie v16 has six health stores (`healthSleep/Weight/Hrv/Daily/BodyComposition/Stress`), each indexed `[profileId+date]`; `dexie-health-record-repository.ts` exposes `getByProfileAndDateRange`; per-metric live hooks live in `hooks/health/*`. No schema change is needed to read a visible week's wellness.
- `components/organisms/ImportDropzoneOverlay/health-destination.ts` maps KRD `FileType` → `/health/<page>` for import dispatch (keyed `sleep_record`, `daily_wellness`, …). It stays the import-dispatch target; badge drill-down uses a separate badge-name-keyed map (see Decision 4) because badge names are not `FileType`s.
- The SPA has **no charting library** today (`package.json` has none; no SVG-viz components exist). The trends hub is the only part of this change that needs new visualization infrastructure.

The decisions below derive directly from the deep-dive spec (`.omc/specs/deep-dive-remove-subtabs-unify-calendar.md`, ambiguity ~12% over five Socratic questions).

## Goals / Non-Goals

**Goals:**

- The Training/Health/Settings tab bar is gone; the header remains the single navigation surface for Calendar/Library/New/Settings.
- Wellness lives in the calendar: a per-day band makes recovery context visible next to training, with an explicit visual difference between wellness (muted) and training (brand-coloured).
- Wellness remains explorable: each calendar badge drills down to the existing per-metric history page; a header entry opens a cross-metric trends hub ("search wellness on the site").
- All routed-page invariants (heading focus, single live-announcer label, no dual-mount) are preserved for the retained `/health/*` pages.

**Non-Goals:**

- No sidebar or replacement primary-nav chrome.
- No wellness data entry/editing — display only.
- No change to the FIT import pipeline or `health-destination.ts` routing.
- No new Dexie tables or schema migration; no `core`/adapter/MCP changes.
- Body composition and stress are not inline calendar badges (drill-down only).

## Decisions

1. **Delete `PrimaryNav` outright** rather than hide it — single mount point, redundant with header. Remove component, test, and `PRIMARY_NAV_DECISION.md` (the ADR it documents is superseded by this change).
2. **Wellness band sits above training cards** inside `DayColumn`, separated by a divider, in a neutral/muted palette; training cards keep their brand colour. This is the "explicit difference in the calendar" the product requires.
3. **Inline metrics = sleep, HRV/recovery, weight, steps** (all four), rendered as compact `icon value` badges. Render only metrics present that day; **omit the whole band when a day has no wellness records** so sparse days stay clean and dense.
4. **Per-badge drill-down via a new `WELLNESS_BADGE_ROUTES` map** (badge-name keyed: `sleep`→/health/sleep, `hrv`→/health/recovery, `weight`→/health/weight, `steps`→/health/activity), co-located with the band component. Each badge is its own link/button (`aria-label`ed). This is NOT literal reuse of `health-destination.ts` — that map is keyed by KRD `FileType` (`sleep_record`, `daily_wellness`, …) for import dispatch, so `healthDestinationFor("sleep")` would hit its `?? "/health"` fallback. The badge map mirrors the same destinations and keeps the import map single-purpose.
5. **`+ Add` stays gated on the training bucket count only** — a wellness-only day still shows `+ Add` for training; the band is independent (`DayColumn.tsx:67` gates on `total === 0` over training buckets, unaffected by the band above `renderDayCards`).
6. **Single combined per-week wellness hook** keyed `(profileId, weekStart..weekEnd)`, one `useLiveQuery` callback that `Promise.all`s four `getByProfileAndDateRange` scans (sleep, HRV, weight, daily/steps) and reduces to `wellnessByDay: Record<string, DayWellness> | undefined`. **Rationale is atomicity, not query count**: the combined query gives a single loading transition so a day's badges never pop in one at a time. Four separate per-metric hooks would _also_ satisfy the page-level rule (`hooks/AGENTS.md`: "one query per page" = one wrapping hook per data concern; `useCalendarPage` already mounts 6+ such hooks) — so the choice is a UX call, mirroring the existing multi-step async reduce in `use-matched-sessions.ts`. **Loading contract**: `undefined` = the week's wellness is still loading; an absent day key = no wellness that day; a present key always carries ≥1 metric — preserving the loading-vs-empty distinction required by `spa-persistence-port/spec.md:217`. `wellnessByDay` originates in `useCalendarPage` (added to `CalendarPageReadyState`), not in the thin `CalendarPage` adapter.
   - **Loading render**: `WellnessBand` renders nothing for both `wellnessByDay === undefined` (loading) and an absent day key (no data) — identical training-only cells, no placeholder, no crash. Training renders immediately; bands appear once when wellness resolves (a single one-time transition on first week load, NOT per-badge flicker). The page does **not** fold wellness into the `hydration` skeleton gate, so a slow wellness query never blocks the calendar from rendering training.
7. **Header trends entry** added to `ENTRY_DEFS` (label e.g. "Trends"/"Metrics", icon TBD by designer), styled as a header entry button, **not** a primary tab. Routes to the rebuilt `/health` hub.
8. **`HealthDashboardPage` rebuilt as a real trends hub** — overlaid multi-metric charts with metric and date-range selection. The four per-metric pages are retained as drill-down detail; their existing live hooks are unchanged.

## Open Questions

1. **Charting library — RESOLVED: `uPlot`, lazy-loaded.** `HealthDashboardPage` is already `lazy()` in `health-routes.tsx:15`, so the trends-hub chart bundle is code-split off the calendar's critical path. `uPlot` (~50KB) wins over `recharts`/`visx` (heavier; pull a D3 subset) on bundle, and over hand-rolled SVG which repeatedly blows the ≤100-line file cap once axes/range-scaling/tooltips cross four metrics. A thin React wrapper around uPlot's imperative API lives in one small file. MVP = one line chart per selected metric over a shared X-range. `tasks 5.1` MUST record the measured bundle delta when the dep lands.
2. **Mobile band density — design for the DENSE case.** A well-tracked athlete has all four metrics every day, so the 140px column (`DayColumn.tsx:54` `min-w-[140px]`) must render four compact `icon value` badges without clipping (wrap to two rows, or a single scrollable row). Band-omission-when-empty only helps sparse days, not the target persona. A spec scenario asserts the dense case renders without overflow.
3. **Header label/icon** for the trends entry — "Trends" vs "Metrics"; icon (Activity / HeartPulse). Cosmetic; designer call.
4. **Band in list view.** The calendar has grid and list views. `DayColumn` is the per-day cell in the grid; the list view path renders day rows separately. The band SHALL render in both — `tasks 2.3`/§3 must confirm whether the list path reuses `DayColumn` or needs the band wired into its day-row component.

## Dependencies / Ordering

- **Must follow `add-health-metrics-to-krd`** in archive order (that change owns the requirements being removed/modified). The SPA UI it built has already shipped (commits `2d48bcbb`, `581239fe`), so this change can be implemented in parallel, but its `spa-routing` delta only composes cleanly once `add-health-metrics-to-krd` is archived and `/opsx:sync` has folded its ADDED requirements into canonical.
- Touches the deferred §8.8 follow-up (`check-no-health-dual-mount.mjs`): this change keeps the health pages mounted only via `HealthSubRouter` — no second mount is introduced, so the planned guard remains satisfiable.

## Risks

- **Trends-hub scope creep** via charting. Mitigation: gate §5 on the charting decision; keep the MVP chart set small (line per metric, shared range).
- **Day-cell vertical budget.** Adding a band shrinks training space on dense days. Mitigation: band omitted when empty; compact badges; band collapses to a single row.
- **Drag-to-reschedule regression — structurally low-risk.** Drop resolution is hit-test based: `use-pointer-drag-helpers.ts:14-20` calls `elementFromPoint(...).closest("[data-day]")` and `[data-day]` is on the `DayColumn` root (`DayColumn.tsx:49`). A drop _onto_ the band still resolves to the day because the band is inside that element. Drag _start_ binds only via `workoutCardPointerDownFor` on the workout-card wrapper (`day-column-cards.tsx:62-64`); the band sits above `renderDayCards` and never calls `bind()`, and its badges are links (click navigates, no drag). Mitigation is therefore structural, not handler-suppression. **Verification caveat**: there is no Playwright drag e2e today — drag is covered only by `use-pointer-drag.test.tsx` (jsdom, where `elementFromPoint` is a no-op). `tasks §3/§7` add (a) a unit assertion that `pointerdown` on a badge does not set `activeWorkoutId`, (b) a drop-onto-band-bearing-cell reschedule assertion, and (c) a real Playwright drag spec covering mouse (≥768px) and the 200ms touch-hold (`use-pointer-drag.ts:73`).

## ADR — Consensus Outcome

> Status: Accepted via ralplan consensus (Planner → Architect → Critic, 2 iterations, Critic verdict APPROVE). Short mode.

**Decision.** Remove the `PrimaryNav` tab bar and unify training + wellness in the calendar. Wellness surfaces as a muted per-day band in `DayColumn` (sleep/HRV/weight/steps badges, present-only, omitted when absent), each badge drilling down via a co-located `WELLNESS_BADGE_ROUTES` map to the retained per-metric pages. A header "Trends" entry (not a tab) opens a uPlot-based, lazy-loaded trends hub rebuilt from `HealthDashboardPage`. Wellness is read through a single per-week `useLiveQuery` (`Record<string, DayWellness> | undefined`) produced in `useCalendarPage`.

**Drivers.** (1) The header already covers Calendar/Library/New/Settings, so two of three tabs were redundant; (2) the product goal is the TrainingPeaks single-calendar model with explicit training-vs-wellness differentiation; (3) the only new infrastructure is charting, which must respect bundle and the ≤100-line file cap.

**Alternatives considered.** (A, chosen) Staged delivery with PR4 (header entry) decoupled from PR5 (charts hub). (B) Big-bang single PR — rejected: large diff, charting blocks everything, higher regression risk. (C) Defer the trends hub entirely — partially adopted: PR4 ships the header entry against the current dashboard with zero charting dependency, and PR5 is independently gated and may slip. Charting sub-decision: uPlot over recharts/visx (bundle) and over hand-rolled SVG (file-cap pressure).

**Why chosen.** Option A delivers the full navigation restructure incrementally and verifiably while quarantining the one item with bundle/effort risk (charts) behind an already-`lazy()` boundary. The combined wellness query is an atomicity (anti-flicker) choice, not a query-count mandate — four per-metric hooks would also comply with the page-level rule.

**Consequences.** `PrimaryNav` + its ADR are deleted; the header gains one entry. `DayColumn` gains a band region and a new per-week wellness prop threaded through the calendar chain. A `uplot` dependency is added (lazy, off the calendar critical path). The four per-metric health pages are retained unchanged as drill-downs. No `core`/adapter/MCP changes; no Dexie migration.

**Follow-ups.** (1) Archive `add-health-metrics-to-krd` and run `/opsx:sync` before archiving this change so the REMOVE/MODIFY deltas compose against canonical. (2) The deferred §8.8 `check-no-health-dual-mount.mjs` guard remains satisfiable (band links by URL). (3) Implementation-time checks: confirm `DailyWellness.steps` presence; confirm whether `CalendarWeekList` reuses `DayColumn` or needs the band wired separately. (4) Record the measured uPlot bundle delta (tasks 5.1).
