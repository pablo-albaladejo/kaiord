## MODIFIED Requirements

### Requirement: Wellness trends hub is reachable from the header without a primary tab

The SPA header SHALL expose a **trends** entry (in `ENTRY_DEFS` / `StatusEntryButtons`), styled as a header entry button — NOT a primary navigation tab — that navigates to the `/health` route. The `/health` route SHALL render a **wellness trends hub**: a cross-metric view that lets the user select one or more metrics and a date range and renders the selected metrics as **one composite `TrendOverlayCard`** containing one vertically-stacked pane per selected metric. All panes SHALL share a synchronized X-cursor and zoom via `uPlot.sync` multi-instance synchronization. The hub replaces the prior N-card grid layout. It SHALL remain a routed page (heading focus, single announcer label) and read persisted data via the existing range live hooks.

The metric selector (toggle pills) and the date-range selector (30 / 90 / 365 days) SHALL be unchanged from the prior grid layout. Each pane SHALL show its own Y axis and unit. Live values at the cursor position SHALL be shown via uPlot's built-in `legend.live: true`. Panes SHALL be user-reorderable within the session via drag-to-reorder; order resets on unmount and is not persisted. A pane with no data for the selected range SHALL show a static placeholder message for that metric rather than an empty or broken chart.

#### Scenario: Header entry opens the trends hub

- **WHEN** the user activates the header trends entry from any route
- **THEN** the SPA navigates to `/health`, the trends hub renders with metric and date-range selectors, focus lands on its `[data-route-heading]`, and no primary navigation tab bar is present

#### Scenario: Selecting metrics and a range renders one composite overlay card

- **GIVEN** the active profile has weight and HRV history over the last 90 days
- **WHEN** the user selects weight and HRV and a 90-day range in the trends hub
- **THEN** the hub renders one `TrendOverlayCard` containing one pane for weight and one pane for HRV, stacked vertically, with both panes sharing a synchronized X-cursor

#### Scenario: Hovering one pane draws the cursor at the same date in all panes

- **GIVEN** the hub has Sleep and HRV panes visible
- **WHEN** the user hovers over a date in the Sleep pane
- **THEN** a cursor line appears at the same date in the HRV pane simultaneously

#### Scenario: Trends hub empty-pane placeholder

- **GIVEN** the active profile has no records for a selected metric in the chosen range
- **WHEN** the hub renders
- **THEN** the pane for that metric shows a static placeholder message rather than an empty or broken chart, and the pane header and drag handle remain visible

#### Scenario: Deselecting a metric removes its pane; reselecting appends it at the end

- **GIVEN** the hub shows Sleep, HRV, Weight, and Steps panes and the user has reordered them
- **WHEN** the user deselects Weight and then reselects it
- **THEN** the Weight pane is removed on deselect and reappears at the end of the stack on reselect, while the user-reordered positions of the remaining panes are preserved
