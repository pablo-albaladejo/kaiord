## Why

The SPA shell renders a three-item primary tab bar — **Training / Health / Settings** — via `PrimaryNav` (`packages/workout-spa-editor/src/components/templates/MainLayout/PrimaryNav.tsx`), introduced by `add-health-metrics-to-krd` §7. Two of the three tabs are redundant with the existing header: `packages/workout-spa-editor/src/components/molecules/StatusHeader/status-entry-defs.ts` already exposes **Calendar**, **Library**, **New workout**, and **Settings** entry buttons. The Health tab is worse than redundant — it partitions wellness into a surface the athlete never sees next to their training. The product direction is the TrainingPeaks model: a single calendar where training and wellness coexist, with an **explicit visual difference** between the two.

This change removes the primary tab bar entirely and folds wellness into the calendar. Each day cell gains a muted per-day **wellness band** (sleep, HRV, weight, steps) visually distinct from the brand-coloured training cards; each badge drills down to its existing per-metric history page via a co-located badge-name→route map. A header entry (not a tab) opens a consolidated **wellness trends hub** for cross-metric exploration. The full ambiguity-gated requirements analysis lives in `.omc/specs/deep-dive-remove-subtabs-unify-calendar.md` (ambiguity ~12%); the trace that informed it lives in `.omc/specs/deep-dive-trace-remove-subtabs-unify-calendar.md`.

> **Depends on `add-health-metrics-to-krd`.** That change ADDED the "Primary navigation surface" and "Health Hub routes" requirements this proposal removes/modifies. It MUST be archived first (its `spa-routing` deltas synced into the canonical `openspec/specs/spa-routing/spec.md`) so the REMOVE/MODIFY deltas here compose against an up-to-date canonical spec. The canonical `spa-routing` spec today still classifies Settings as a meta modal — drifted from the shipped routed `/settings/:tab?`; `/opsx:sync` should reconcile that at the same time.

## What Changes

- **Delete `PrimaryNav`.** It has a single mount point (`MainLayout.tsx`). Remove the import and `<PrimaryNav />`, delete `PrimaryNav.tsx`, `PrimaryNav.test.tsx`, and `PRIMARY_NAV_DECISION.md`, and update `MainLayout.test.tsx`. No replacement nav surface — the header already covers Calendar / Library / New / Settings.
- **Add a per-day wellness band to the calendar day cell** (`DayColumn`). The band renders above the training cards, in a muted/neutral palette separated by a divider, and shows an inline badge only for the metrics present that day among **sleep, HRV/recovery, weight, steps/daily-activity**. If a day has no wellness records the band is omitted entirely.
- **Make each wellness badge an independent drill-down link** to its existing per-metric page via a new badge-name→route map `WELLNESS_BADGE_ROUTES` co-located with the band component: sleep→`/health/sleep`, hrv→`/health/recovery`, weight→`/health/weight`, steps→`/health/activity`. This mirrors the destinations in `health-destination.ts` but is NOT literal reuse — that map is keyed by KRD `FileType` (e.g. `sleep_record`), not by the inline badge metric name.
- **Plumb a single per-week wellness live-query** keyed by `(profileId, weekStart..weekEnd)` returning `wellnessByDay: Record<string, DayWellness> | undefined`, produced inside `useCalendarPage` (added to `CalendarPageReadyState`) and threaded `CalendarPage → CalendarPageView → CalendarBodyView → CalendarWeekGrid → DayColumn`. The single query is justified by **atomicity** — all four metric badges for a day resolve in one loading transition, so badges never flicker in one at a time (it is NOT required by the "one query per page" rule; the calendar already mounts 6+ wrapping live-query hooks, each owning one `useLiveQuery`, which is the actual rule). `undefined` = the week's wellness is still loading; an absent day key = that day has no wellness; a present day key always carries ≥1 metric.
- **Add a header trends entry** to `ENTRY_DEFS` / `StatusEntryButtons` (not a primary tab) that opens the wellness trends hub.
- **Rebuild `HealthDashboardPage` into a real trends hub**: multi-metric charts with metric and date-range selection (the TrainingPeaks "Metrics" experience), replacing the current 4-card launcher grid. The four per-metric pages (Sleep / Weight / Recovery / Activity) are **retained** as drill-down detail/history views.
- **Keep `/health/*` routes and the FIT health import dispatch unchanged** — the routes are simply no longer tab-reached; `health-destination.ts` still routes imported health FIT files to the per-metric pages.

## Capabilities

### Modified Capabilities

- `spa-routing`: removes the primary navigation surface requirement (the Training/Health/Settings tab bar); modifies the Health Hub routes requirement so discovery is via calendar wellness badges and a header trends entry (not a tab) while preserving their routed-page classification, heading-focus, live-announcer, and no-dual-mount invariants; adds two new surface requirements — the calendar per-day wellness band with explicit training/wellness differentiation, and the header-reachable wellness trends hub.

## Impact

- **Code (SPA only)**:
  - Nav teardown: `components/templates/MainLayout/PrimaryNav.tsx` (delete), `PrimaryNav.test.tsx` (delete), `PRIMARY_NAV_DECISION.md` (delete), `MainLayout.tsx` (unmount), `MainLayout.test.tsx` (update).
  - Calendar: `components/molecules/WorkoutCard/DayColumn.tsx`, new wellness-band component(s), `day-column-cards.tsx`, `CalendarWeekGrid.tsx`, `CalendarBodyView.tsx`, `CalendarPage.tsx` / `CalendarPageView.tsx`; new combined wellness live-query hook under `hooks/health/`.
  - Header: `components/molecules/StatusHeader/status-entry-defs.ts`, `StatusEntryButtons.tsx`.
  - Trends hub: `components/pages/health/HealthDashboardPage.tsx` (rebuild); per-metric pages retained; `health-routes.tsx`.
  - A11y: `hooks/use-route-announcer-label.ts` (label tweaks only if route labels change).
- **Tests**: calendar wellness-band rendering (present/partial/empty), per-badge navigation targets, combined wellness hook, header trends entry, trends-hub metric/range selection; updated `MainLayout`/`PrimaryNav` removal tests. Frontend coverage ≥ 70%.
- **No `core`/adapter/MCP changes**; no new Dexie schema or migration (v16 tables suffice); no change to the FIT import pipeline.
- **Breaking changes**: none (private `@kaiord/workout-spa-editor` only). A `patch`/`minor` changeset for the private SPA package for hygiene.
- **New dependency (open)**: the trends hub may add a charting library — see `design.md` Open Questions. Bundle-size discipline applies.
