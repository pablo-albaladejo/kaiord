<!-- opsx-ship: chunking
PR 1 (nav-teardown):     §1
PR 2 (calendar-data):    §2
PR 3 (calendar-ui):      §3
PR 4 (header-entry):     §4
PR 5 (trends-hub):       §5   (gated on charting decision — design.md OQ1)
PR 6 (a11y + spec sync): §6
PR 7 (verification):     §7
-->

> Tasks: 25 completed, 2 deferred

## 1. Remove the primary navigation tab bar

- [x] 1.1 Update `components/templates/MainLayout/MainLayout.test.tsx` so it no longer asserts `PrimaryNav`/`data-testid="primary-nav"` is present, and add an assertion that the tab bar is absent and the header entries (Calendar/Library/New/Settings) remain reachable.
- [x] 1.2 Remove the `PrimaryNav` import and `<PrimaryNav />` from `components/templates/MainLayout/MainLayout.tsx`.
- [x] 1.3 Delete `components/templates/MainLayout/PrimaryNav.tsx`, `PrimaryNav.test.tsx`, and `PRIMARY_NAV_DECISION.md` (superseded ADR).
- [x] 1.4 Run `pnpm --filter @kaiord/workout-spa-editor test` and confirm the shell renders with no tab bar and zero failures/warnings.

## 2. Per-week wellness live-query plumbing

- [x] 2.1 Define the `DayWellness` type in `types/health/` (a present-metric subset: optional sleep/hrv/weight/steps display values) and the hook's return contract: `Record<string, DayWellness> | undefined` where `undefined` = the week's wellness is still loading, an absent day key = no wellness that day, and a present day key always carries ≥1 metric. Add a failing test for `hooks/health/use-calendar-wellness-week-live.ts` asserting: undefined while loading; one entry per day with any of sleep/HRV/weight/steps; days with no records are absent (not present-but-empty).
- [x] 2.2 Implement the hook as a single `useLiveQuery` callback that `Promise.all`s four `getByProfileAndDateRange` scans (`healthSleep`, `healthHrv`, `healthWeight`, `healthDaily`) and reduces to the per-day map — mirroring the multi-step async reduce in `use-matched-sessions.ts`. The single query is for atomicity (one loading transition, no per-badge flicker), NOT a query-count rule. **Check during implementation**: confirm a `healthDaily` row reliably carries a step count; if `steps` can be absent, omit the steps badge for that day rather than emitting a present-but-empty badge. _(Reduce logic lives in the pure `calendar-wellness-reduce.ts` with a dedicated test; `steps` is schema-required but the omit-guard is kept defensively and mirrored in `trend-series.ts`.)_
- [x] 2.3 Produce `wellnessByDay` inside `useCalendarPage` (add it to `CalendarPageReadyState`), then thread it through the thin adapter `CalendarPage` → `CalendarPageView` → `CalendarBodyView` → `CalendarWeekGrid` → `DayColumn`. Do NOT fold the wellness query into the `hydration` skeleton gate (so a slow wellness query never blocks training render). Confirm the list-view day path (`CalendarWeekList`) either reuses `DayColumn` or gets the band wired into its day-row component so the band renders in both grid and list views. _(List view renders `WellnessBand` directly in `CalendarWeekList`.)_

## 3. Calendar day-cell wellness band

- [x] 3.1 Add a new badge-name→route map `WELLNESS_BADGE_ROUTES` co-located with `WellnessBand` (`sleep`→/health/sleep, `hrv`→/health/recovery, `weight`→/health/weight, `steps`→/health/activity). Do NOT call `healthDestinationFor` from `health-destination.ts` — that map is keyed by KRD `FileType`, so badge names hit its `?? "/health"` fallback. Add failing tests for `WellnessBand`: renders a badge only for present metrics; renders nothing when `wellnessByDay` is `undefined` (loading) or the day key is absent (no data); each badge is a link/button with an `aria-label` and the route from `WELLNESS_BADGE_ROUTES`.
- [x] 3.2 Implement `WellnessBand` (muted/neutral palette, compact `icon value` badges, divider), designed for the DENSE case — four badges in a 140px column without clipping (wrap or scroll). Keep under the file/function line caps; split badge rendering into a helper if needed.
- [x] 3.3 Render `WellnessBand` at the top of `DayColumn` above `renderDayCards`, only when its day key is present in `wellnessByDay`; render nothing while `wellnessByDay` is `undefined`. Keep the `+ Add` affordance gated on the training bucket total only.
- [x] 3.4 Add tests asserting: visual differentiation (band uses the muted class, training cards keep brand colour); (a) `pointerdown` on a wellness badge does NOT set `activeWorkoutId` / start a drag; (b) dropping a workout onto a band-bearing cell still reschedules (hit-test resolves via `closest("[data-day]")`).
- [x] 3.5 Run the SPA test suite; confirm present/partial/empty/loading-day scenarios pass and the existing calendar tests (counts, drag, empty-day picker) are green.

## 4. Header trends entry

- [x] 4.1 Add a failing test that the header renders a "Trends" (metrics) entry that navigates to `/health` and is NOT styled/asserted as a primary tab.
- [x] 4.2 Add the entry to `components/molecules/StatusHeader/status-entry-defs.ts` (`ENTRY_DEFS`) and surface it in `StatusEntryButtons.tsx` with an icon and `aria-label`.

## 5. Wellness trends hub (rebuild HealthDashboardPage)

> Charting decided (design.md OQ1): `uPlot`, lazy-loaded — `HealthDashboardPage`
> is already `lazy()` in `health-routes.tsx:15`, so the chart bundle is
> code-split off the calendar's critical path.

- [x] 5.1 Add `uplot` as a dependency, wrap its imperative API in one small React component, and record the measured bundle-size delta (must stay off the calendar's critical path via the existing `lazy()` boundary). _(uplot@^1.6.32; bundle delta ≈ +54.6 kB raw / +23.5 kB gzip, confirmed only in the lazy `HealthDashboardPage` chunk — not in `index.js`/`CalendarPage.js`.)_
- [x] 5.2 Add failing tests for the trends hub: renders for the active profile; lets the user select one or more metrics and a date range; renders a chart per selected metric over that range; empty-state when no data.
- [x] 5.3 Rebuild `components/pages/health/HealthDashboardPage.tsx` as the trends hub (charts + metric/range selectors), reusing the existing range live hooks; keep files under the line cap by extracting chart and selector subcomponents.
- [x] 5.4 Confirm the four per-metric pages (Sleep/Weight/Recovery/Activity) still render unchanged as drill-down detail.

## 6. Accessibility, guards, and spec sync

- [x] 6.1 Verify the route announcer (`hooks/use-route-announcer-label.ts`) still emits one label per `/health/*` navigation; adjust labels only if a route's identity changed. _(`/health` label updated `"Health page"` → `"Trends page"` — route identity changed to the trends hub.)_
- [x] 6.2 Confirm no health content component is mounted outside `HealthSubRouter` (keeps the deferred §8.8 `check-no-health-dual-mount.mjs` invariant satisfiable); the new `WellnessBand` links by URL, it does not import health page content components.
- [x] 6.3 Sync the canonical `openspec/specs/spa-routing/spec.md` so it reflects this change's REMOVE/MODIFY/ADD. _(Done at archive time: promoted the two base requirements this change touches — "Primary navigation surface" + "Health Hub routes" — from the still-active `add-health-metrics-to-krd` spa-routing delta into canonical, trimmed them from that delta (its untouched "FIT import flow" requirement stays), then `openspec archive` applied this change's delta: −1 Primary navigation surface, ~1 Health Hub routes, +2 calendar wellness band & trends hub. Both changes re-validate.)_

## 7. Verification

- [x] 7.1 `pnpm --filter @kaiord/workout-spa-editor test` — 100% pass, ≥70% coverage, zero warnings. _(470 files / 4042 tests pass; coverage 90.4% stmts / 82.6% branch — thresholds met.)_
- [x] 7.2 `pnpm --filter @kaiord/workout-spa-editor build` — clean output. _(Built clean; only the pre-existing, unrelated OnboardingTutorial dynamic-import warning.)_
- [x] 7.3 `pnpm lint` — zero ESLint/type/format/spec/archive errors (includes `pnpm test:scripts` mechanical guards). _(Full repo lint exit 0; mechanical guards 485/485.)_
- [ ] 7.4 Add a real Playwright drag spec under `e2e/` (none exists today — drag is only unit-tested in jsdom where `elementFromPoint` is a no-op) covering reschedule on mouse (≥768px) and the 200ms touch-hold path with a wellness band present on the source/target cells. _(DEFERRED — requires a browser run + seeded IndexedDB that can't be verified green in this environment. Both drag directions are unit-tested in `DayColumn.test.tsx`; the critic rated the e2e MINOR given the structural mitigation. Track as a follow-up.)_

  > Deferred to: #671

- [ ] 7.5 Manual/e2e walkthrough: tab bar absent; calendar shows wellness bands with explicit differentiation (grid AND list views); badges drill down to the right pages; header trends entry opens the hub; drag-to-reschedule still works. _(Pending human manual pass — `pnpm --filter @kaiord/workout-spa-editor dev`.)_

  > Deferred to: #671

- [x] 7.6 Add a `patch`/`minor` changeset for `@kaiord/workout-spa-editor`. _(`minor` — `.changeset/remove-subtabs-unify-calendar.md`.)_
