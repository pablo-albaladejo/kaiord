## ADDED Requirements

### Requirement: CalendarPage render-cost budget

`CalendarPage` SHALL render under two complementary budgets, measured on Chromium under CDP CPU throttle 4×:

- **Render-cost ratio** — showing a week of 30 cards (10 matched sessions, 10 solo plans and 10 solo actuals, every row owned by the active profile) SHALL take at most **2.3×** as long as showing a week of 3 cards (1 / 1 / 1). Each week is shown by an in-app route change from an empty week, timed until its day shows exactly the seeded cards of each kind, and each is sampled 7 times in interleaved pairs, comparing the fastest of each. The guard is a ratio because both weeks take the same path (route change, live queries, match join, render) and differ only in card count: runner speed cancels out, while a per-card cost is multiplied by 30 in one and by 3 in the other. An absolute first contentful paint is NOT asserted: on the dev server it measures loading the module graph, which paints before any card is read and varies with runner speed.
- **`useMatchedSessions` slice** — the hook is measured via `performance.measure` markers placed inside the hook body. With the 30-card week on screen and the page quiescent, the fastest of 5 re-fired measures SHALL stay within a **250 ms** CI envelope, scaled by the runner slowdown a fixed synthetic workload measures on the same throttled page (clamped to 12×). Archived design D16 named 30–60 ms as the aspirational slice; the envelope is wider because the measure wraps an async live query whose wall-clock includes IndexedDB round-trips.

Both budgets are enforced by a Playwright spec at `packages/workout-spa-editor/e2e/calendar-performance.spec.ts` that runs in the existing `e2e-frontend` CI matrix. The spec SHALL document its seed-data shape, the CPU throttling configuration, and the rationale for the render-cost ratio in the file header. Persistent failures across Playwright's default retries SHALL fail the build.

#### Scenario: Every seeded card renders before anything is measured

- **GIVEN** the test seeds the active profile, a week with 10 matched / 10 solo plan / 10 solo actual rows and a week with 1 / 1 / 1, every row carrying the profile's id
- **WHEN** the calendar shows each week
- **THEN** the seeded day shows exactly that many matched-session, coaching-activity and workout cards

#### Scenario: The 30-card week stays within its render-cost ratio

- **GIVEN** the two seeded weeks and CDP CPU throttling at factor 4×
- **WHEN** each week is shown 7 times in interleaved pairs, from an empty week
- **THEN** the fastest 30-card time is at most 2.3× the fastest 3-card time

#### Scenario: useMatchedSessions stays within its CI envelope

- **GIVEN** the 30-card week on screen under the same throttling, with the page quiescent
- **WHEN** the hook's live query is re-fired 5 times by touching a seeded match
- **THEN** the fastest measure is within the 250 ms envelope scaled by the measured runner slowdown

#### Scenario: Build fails on regression

- **WHEN** a code change pushes either the render-cost ratio above 2.3 OR the fastest `useMatchedSessions` re-fire above its envelope across all retries
- **THEN** the `e2e-frontend` job fails and the change is blocked from merging

#### Scenario: Production build emits no perf marks

- **GIVEN** the `useMatchedSessions` hook is built under `import.meta.env.PROD === true` (production bundle)
- **WHEN** the hook executes
- **THEN** no `performance.mark` or `performance.measure` calls are emitted; the production bundle has zero observable perf-instrumentation overhead; the marks ship only under DEV / test modes

## REMOVED Requirements

### Requirement: CalendarPage performance budget

**Reason**: Its FCP envelope did not measure the calendar. On the dev server first contentful paint is the module graph loading, painted before any card is read, so it stayed green under a deliberate per-card slowdown while failing a 2× slower runner with nothing regressed (2864 / 5976 / 2788 ms). Its `useMatchedSessions` figure (30 ms worst measure) had also drifted from what the test enforces.

**Migration**: Replaced by "CalendarPage render-cost budget" (ADDED above): the FCP scenarios become the render-cost ratio and the every-card-renders scenarios, the `useMatchedSessions` scenario states the steady-state envelope the test asserts, and "Build fails on regression" and "Production build emits no perf marks" carry over.
