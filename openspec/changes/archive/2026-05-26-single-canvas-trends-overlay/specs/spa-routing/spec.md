# spa-routing — delta

## MODIFIED Requirements

### Requirement: Wellness trends hub is reachable from the header without a primary tab

The SPA header SHALL expose a **trends** entry (in `ENTRY_DEFS` / `StatusEntryButtons`), styled as a header entry button — NOT a primary navigation tab — that navigates to the `/health` route. The `/health` route SHALL render a **wellness trends hub**: a cross-metric view that lets the user select one or more metrics and a date range and renders the selected metrics as **one single uPlot canvas** (`TrendSingleChartCard`) with one X (time) axis at the bottom and one Y axis per selected metric in its native unit, packed on the right edge of the canvas. As the user toggles metrics ON, lines accumulate on the same canvas. It SHALL remain a routed page (heading focus, single announcer label) and read persisted data via the existing range live hooks.

The metric selector (toggle pills) and the date-range selector (30 / 90 / 365 days) SHALL be unchanged from the prior grid layout. All series SHALL share a uniform stroke (`#2563eb`); line discrimination is by axis label and legend label, NOT color. Live values at the cursor position SHALL be shown via uPlot's built-in `legend.live: true` rendered below the canvas. The mobile layout (≤ 375 px width) MAY be cramped at N=4 metrics; users accept this in exchange for native-unit preservation. The hub SHALL NOT support drag-to-reorder; the axis/line order is canonical (sleep → hrv → weight → steps). The hub SHALL NOT use multi-instance `uPlot.sync`; cursor and zoom are intrinsic to the single uPlot instance. While at least one selected metric is loading AND no selected metric has produced any points yet, the hub SHALL render a `"Loading…"` placeholder instead of an empty canvas or the empty-state literal. When a selected metric has zero data in the chosen range, its Y axis and series SHALL be omitted from the canvas while the metric remains highlighted in the selector and the canvas continues to render the other selected metrics.

#### Scenario: Header entry opens the trends hub

- **WHEN** the user activates the header trends entry from any route
- **THEN** the SPA navigates to `/health`, the trends hub renders with metric and date-range selectors, focus lands on its `[data-route-heading]`, and no primary navigation tab bar is present

#### Scenario: Selecting metrics and a range renders one single uPlot canvas

- **GIVEN** the active profile has weight and HRV history over the last 90 days
- **WHEN** the user selects weight and HRV and a 90-day range in the trends hub
- **THEN** the hub renders one `TrendSingleChartCard` with a single uPlot canvas, one X (time) axis at the bottom, and two Y axes on the right edge (one per selected metric in its native unit), with both metrics' lines accumulating on the same canvas

#### Scenario: Empty metric omits its axis and series from the single canvas

- **GIVEN** the active profile has no records for one of the selected metrics in the chosen range
- **WHEN** the hub renders
- **THEN** the empty metric's Y axis and series SHALL be omitted from the canvas, the metric SHALL remain highlighted in the selector, and the canvas SHALL continue to render the other selected metrics' axes and lines

#### Scenario: Trends hub Loading placeholder while data is hydrating

- **GIVEN** at least one selected metric's Dexie live-query is still loading AND no selected metric has produced any points yet
- **WHEN** the hub renders
- **THEN** the hub SHALL render a `"Loading…"` placeholder instead of the empty-state literal and instead of an empty canvas; once at least one selected metric has produced points, the canvas SHALL render (omitting axes/series for still-loading or still-empty metrics)
