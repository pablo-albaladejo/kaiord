## MODIFIED Requirements

### Requirement: CoachingSyncButton connected-state chrome

When the active profile has at least one linked coaching account, the `CoachingSyncButton` rendered in `CalendarHeader` SHALL adopt an icon-only chrome with the following invariants:

- A 32×32 button containing a `RefreshCw` lucide icon, no text label.
- An accessible name of the form `"Sync <Label>"` (e.g., `aria-label="Sync Train2Go"`).
- A native `title` attribute (and matching tooltip) of the form `"<Label> · last sync <relative-time>"` rendered via the new `formatRelativeTime` helper. The relative-time fragment MUST resolve to one of: `"never synced"`, `"just now"`, `"<n>m ago"`, `"<n>h ago"`, `"yesterday"`, `"<n>d ago"`, or an ISO date `YYYY-MM-DD` for older values.
- During an active sync, the icon SHALL be replaced **in place** by a spinner; the button SHALL be disabled while syncing; the tooltip SHALL read `"<Label> · syncing…"`.
- Under `prefers-reduced-motion: reduce`, the spinner SHALL NOT animate; the visual cue SHALL be a static "syncing" icon (e.g., a non-spinning loader glyph) and the tooltip text remains the canonical signal.
- Color tokens MUST be slate-based (`border-slate-300`, `text-slate-700`, `hover:bg-slate-100`) — not the prior rose treatment that competed with the status palette.

The not-connected state ("hint pointing to the Connections page" per `spa-coaching-integration` "Calendar Sync button gated on linked account") is unchanged by this requirement.

#### Scenario: Connected button renders icon-only with relative-time tooltip

- **GIVEN** the active profile has Train2Go linked and `lastSyncedAt = T - 5min`
- **WHEN** the calendar header renders
- **THEN** the button has `aria-label="Sync Train2Go"`, no visible text label, and a tooltip reading `"Train2Go · 5m ago"`

#### Scenario: Never-synced account renders the never-synced tooltip

- **GIVEN** Train2Go is linked but `lastSyncedAt` is undefined (account just linked)
- **WHEN** the calendar header renders
- **THEN** the button tooltip reads `"Train2Go · never synced"`

#### Scenario: Sync in progress swaps the icon for the spinner in place

- **WHEN** the user clicks the button and `syncWeek` is awaiting
- **THEN** the icon is replaced in place by a spinner; the button is disabled; the tooltip reads `"Train2Go · syncing…"`

#### Scenario: Reduced motion disables spinner animation

- **GIVEN** the user has `prefers-reduced-motion: reduce`
- **WHEN** the button enters the syncing state
- **THEN** the loader glyph is static (no rotation animation); the tooltip still updates to `"Train2Go · syncing…"`; sync completion still re-enables the button
