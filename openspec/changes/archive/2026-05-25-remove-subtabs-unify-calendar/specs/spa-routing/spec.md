## REMOVED Requirements

### Requirement: Primary navigation surface groups routes into Training, Health, and Settings

**Reason**: The Training / Health / Settings tab bar (`PrimaryNav`) is removed. The Training and Settings destinations are already reachable from the existing header (`status-entry-defs.ts` exposes Calendar, Library, New workout, and Settings), so two of the three tabs were redundant. Health is folded into the calendar — see the new "Calendar day cells surface per-day wellness" and "Wellness trends hub is reachable from the header" requirements below. The `PrimaryNav` component, its test, its mount in `MainLayout`, and the `PRIMARY_NAV_DECISION.md` ADR are deleted. Existing deep links to `/calendar`, `/library`, `/workout/*`, `/settings/*`, and `/health/*` continue to resolve unchanged.

## MODIFIED Requirements

### Requirement: Health Hub routes are routed pages with primary heading focus and live-announcement

The five `/health/*` routes SHALL each remain classified as routed pages per the existing SPA surface classification requirement — owning a base-relative URL, supporting browser history, deep-linking and bookmarking, and rendering a single `[data-route-heading]` element focused on mount — but they SHALL NOT be reached via a primary navigation tab (that surface is removed). Discovery SHALL instead be:

- **Per-metric pages** (`/health/sleep`, `/health/weight`, `/health/recovery`, `/health/activity`) reached by clicking a wellness badge in a calendar day cell (per the "Calendar day cells surface per-day wellness" requirement) or from the trends hub. These remain history/detail views and their content is unchanged.
- **`/health`** rebuilt as the **wellness trends hub** (per the "Wellness trends hub is reachable from the header" requirement), reached from a header entry rather than a tab.

Each route SHALL continue to emit exactly one live-announcer label change on navigation (`"Sleep"`, `"Weight"`, `"Recovery"`, `"Activity"`, and a label for the trends hub) and SHALL move focus to its `[data-route-heading]` on mount, suppressing the visible focus ring for non-keyboard activations. No `/health/*` content component SHALL be mounted from more than one surface (the existing no-dual-mount invariant); the calendar wellness band links by URL and does not import health page content components.

#### Scenario: Health detail page is reached from a calendar badge, not a tab

- **WHEN** the user clicks the sleep badge in a calendar day cell
- **THEN** the SPA navigates to the base-relative URL `/health/sleep`, the sleep history page renders, focus lands on its `[data-route-heading]`, the announcer emits `"Sleep"` once, and no primary navigation tab bar is present in the layout

#### Scenario: Health detail deep-links survive refresh

- **WHEN** the user navigates directly to `/health/weight` via a bookmark and the static host returns 404 with the rafgraph fallback per the existing deep-link scenario
- **THEN** the rafgraph fallback restores the URL pre-mount, the router strips the configured base, the weight page re-renders, and the announcer emits `"Weight"` exactly once

#### Scenario: Health content components do not dual-mount

- **WHEN** a contributor attempts to mount a `/health/*` page content component from a non-route surface (header dropdown, modal, the calendar wellness band)
- **THEN** the CI guard SHALL fail the build per the R-LibraryNoDualMount-style enforcement; the calendar wellness band SHALL satisfy this by navigating via URL only, never importing a health page content component

#### Scenario: Pure query-string changes within a health route do not re-announce

- **WHEN** the user changes a range filter on `/health/weight?range=30d` to `?range=90d`
- **THEN** the announcer label SHALL NOT change and focus SHALL NOT move, per the existing query-string scenario

## ADDED Requirements

### Requirement: Calendar day cells surface per-day wellness with explicit training/wellness differentiation

Each calendar day cell (`DayColumn`) SHALL render a per-day **wellness band** above its training cards when the active profile has any wellness record for that date. The band SHALL be visually differentiated from training: a muted/neutral palette separated from the brand-coloured training cards by a divider, so training and wellness are explicitly distinguishable at a glance.

The band SHALL show a compact badge only for the metrics **present that day**, among: **sleep** (score or duration), **HRV/recovery** (rMSSD), **weight** (kg), and **steps/daily-activity**. Body composition and stress are NOT inline badges. When a day has no wellness records, the band SHALL be omitted entirely and the cell SHALL look identical to a training-only cell (including the `+ Add` affordance, which remains gated on the training bucket count only — independent of wellness presence).

Each badge SHALL be an independently activatable link/button with an accessible label, navigating to the corresponding per-metric page via a badge-name→route map `WELLNESS_BADGE_ROUTES` co-located with the band component (distinct from the `FileType`-keyed `health-destination.ts` import map): sleep → `/health/sleep`, weight → `/health/weight`, HRV → `/health/recovery`, steps → `/health/activity`.

The visible week's wellness SHALL be read through a single `useLiveQuery` keyed by `(profileId, weekStart..weekEnd)` returning a per-day map, threaded down the calendar component chain. A single query is used for **atomicity** — a day's badges resolve in one loading transition and never appear one at a time — not to satisfy a query-count rule. The map's contract SHALL distinguish three states: `undefined` = the week's wellness is still loading; an absent day key = no wellness that day; a present day key always carries ≥1 metric. The band SHALL NOT intercept the grid's drag-to-reschedule pointer handlers.

#### Scenario: A day with recorded wellness shows a differentiated band

- **GIVEN** the active profile has a sleep score, HRV, weight, and steps for Monday
- **WHEN** the calendar week containing Monday renders
- **THEN** Monday's cell shows a muted wellness band above the training cards with a badge for each of sleep, HRV, weight, and steps, and the training cards below remain brand-coloured and visually distinct

#### Scenario: Partial day shows only present metrics

- **GIVEN** Tuesday has only a weight measurement
- **WHEN** the week renders
- **THEN** Tuesday's band shows only the weight badge with no empty slots for the missing metrics

#### Scenario: Empty day shows no band

- **GIVEN** Wednesday has no wellness records and no training
- **WHEN** the week renders
- **THEN** Wednesday's cell shows no wellness band and still shows the `+ Add` training affordance

#### Scenario: Clicking a wellness badge drills down to its page

- **WHEN** the user clicks the sleep badge on a day cell
- **THEN** the SPA navigates to `/health/sleep`; clicking the weight badge instead navigates to `/health/weight`

#### Scenario: The wellness band does not break drag-to-reschedule

- **WHEN** the user drags a workout card to another day on a viewport ≥ 768px
- **THEN** the reschedule completes as before; pointer interactions on the wellness band do not start or capture a drag

#### Scenario: No band flicker while the week's wellness is loading

- **GIVEN** the calendar's training data has hydrated but the week's wellness query has not yet resolved (`wellnessByDay` is undefined)
- **WHEN** the calendar renders
- **THEN** every cell renders training-only with no wellness band and no placeholder, and bands appear in a single transition once wellness resolves — badges SHALL NOT pop in one metric at a time

#### Scenario: A dense day renders four badges without clipping

- **GIVEN** a day has sleep, HRV, weight, and steps recorded
- **WHEN** the cell renders in the narrowest supported column (≈140px on mobile)
- **THEN** all four badges are visible without overflow or clipping (wrapping or scrolling within the band), and the training cards below remain fully visible

### Requirement: Wellness trends hub is reachable from the header without a primary tab

The SPA header SHALL expose a **trends** entry (in `ENTRY_DEFS` / `StatusEntryButtons`), styled as a header entry button — NOT a primary navigation tab — that navigates to the `/health` route. The `/health` route SHALL render a **wellness trends hub**: a cross-metric view that lets the user select one or more metrics and a date range and renders the selected metrics as charts over that range. The hub replaces the prior 4-card launcher grid. It SHALL remain a routed page (heading focus, single announcer label) and read persisted data via the existing range live hooks.

#### Scenario: Header entry opens the trends hub

- **WHEN** the user activates the header trends entry from any route
- **THEN** the SPA navigates to `/health`, the trends hub renders with metric and date-range selectors, focus lands on its `[data-route-heading]`, and no primary navigation tab bar is present

#### Scenario: Selecting metrics and a range renders charts

- **GIVEN** the active profile has weight and HRV history over the last 90 days
- **WHEN** the user selects weight and HRV and a 90-day range in the trends hub
- **THEN** the hub renders a chart for each selected metric over that range

#### Scenario: Trends hub empty state

- **GIVEN** the active profile has no records for a selected metric in the chosen range
- **WHEN** the hub renders
- **THEN** it shows an empty-state message for that metric rather than an empty or broken chart
