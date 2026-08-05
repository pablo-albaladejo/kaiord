## ADDED Requirements

### Requirement: One registry feeds every navigation surface

The app shell SHALL derive every navigation surface — the primary header row,
its overflow menu, the account menu and the mobile bottom nav — from a single
registry of destinations. No surface SHALL maintain its own list, because two
lists describing the same navigation drift, and the drift is invisible until a
user cannot reach a page from the device they happen to be holding.

Each destination SHALL declare exactly ONE desktop surface: the primary row,
the overflow menu, the account menu, or a parent destination's dropdown. A
destination declaring none is unreachable; a destination declaring more than
one renders twice on the same screen. This SHALL be enforced mechanically over
the registry, not by review.

A destination MAY additionally declare the mobile bottom nav, which is capped
at five entries by its fixed layout. Where the bottom nav or the create-workout
button already carries a destination below a breakpoint, the header SHALL hide
its own entry there rather than offer the same destination twice.

A destination reached through another's dropdown SHALL name its parent, and
that parent SHALL itself have a header slot — a dropdown under an unreachable
parent is unreachable.

Every destination SHALL remain reachable at every supported width. Where the
primary row cannot hold them all, the overflow menu SHALL carry the remainder,
INCLUDING at widths where the mobile bottom nav is present, since that bar is
capped and cannot absorb them.

#### Scenario: A destination with no surface is rejected

- **GIVEN** a registry entry declaring neither a header slot, nor the overflow menu, nor the account menu, nor a parent
- **WHEN** the registry invariants are evaluated
- **THEN** the check SHALL fail, naming the unreachable destination

#### Scenario: A destination with two surfaces is rejected

- **GIVEN** a registry entry declaring both a primary-row slot and the account menu
- **WHEN** the registry invariants are evaluated
- **THEN** the check SHALL fail, because the destination would render in two chromes at once

#### Scenario: A nested destination is reachable through its parent

- **GIVEN** the lab analytics route declared as a child of the wellness trends destination
- **WHEN** the user activates the trends entry in whichever chrome currently carries it
- **THEN** a menu SHALL open listing both the parent destination and the child, and activating the child SHALL navigate to the lab analytics route

#### Scenario: Overflow destinations stay reachable on a phone

- **GIVEN** a viewport below the tablet breakpoint, where the bottom nav is present and the primary row is hidden
- **WHEN** the user opens the header's overflow menu
- **THEN** the menu SHALL list every destination the primary row is hiding that the bottom nav does not carry

### Requirement: The header reports sources that are down and is otherwise silent

The app shell SHALL surface, on every route, that one or more data sources have
stopped working, and SHALL render NOTHING for this when none has. No badge, no
dot, no neutral "all good" chip: an element that is present in the healthy case
carries no information, which is the defect that made the previous per-bridge
status chips useless.

The signal SHALL state how many sources are affected and the consequence of
their being affected, and SHALL lead to the surface that can act on it. It
SHALL NOT offer a fix it cannot perform: reconnecting is per-source, so a
shell-level control would have to choose a source on the user's behalf.

The shell SHALL derive this from the SAME attention model as every other
surface that reports source health, so a count in the shell can never disagree
with the surface it summarises. Independent derivations of this fact have
disagreed before, leaving a summary contradicting the detail beneath it.

The signal SHALL claim only what state supports. In particular it SHALL NOT
state when a source broke — no persisted transition timestamp exists, and the
probe time resets on reload — and SHALL NOT describe a credential as expired,
which no bridge can distinguish from one that was never issued. A source whose
presence cannot be re-checked SHALL never be counted as down.

Because the signal appears asynchronously, after its page has rendered, and can
appear again on any later refresh, it SHALL NOT depend on the reader looking at
the moment it arrives.

#### Scenario: Nothing is rendered while every source is healthy

- **GIVEN** an attention model reporting no affected source
- **WHEN** the shell renders on any route
- **THEN** no source-health element SHALL be present in the header, and the account menu SHALL carry no marker

#### Scenario: A cold load is silent

- **GIVEN** the app has just started and no bridge has been asked anything yet, so every source reads as not connected
- **WHEN** the shell renders
- **THEN** no source-health element SHALL be present, without the shell needing to test whether discovery has completed

#### Scenario: An affected source is named and led to

- **GIVEN** an attention model reporting one affected source
- **WHEN** the user opens the source-health signal
- **THEN** it SHALL state the count and the consequence, and SHALL offer navigation to the connections surface and no per-source fix

#### Scenario: A source that cannot be re-checked is never reported as down

- **GIVEN** a bridge with no session prober, which announced itself once and can never report a live session
- **WHEN** the attention model is derived
- **THEN** that bridge SHALL NOT be counted, and its own card SHALL read as installed rather than as needing attention

## MODIFIED Requirements

### Requirement: SPA surface classification (routed-page vs modal)

Each SPA editor surface (top-level UI region invoked from a header control or
from in-flow controls) SHALL be classified as exactly one of:

- **Routed page** — owns a base-relative URL (resolved per the SPA router base alignment requirement), supports browser history, deep-linking, bookmarking, and external linking. Used for **content destinations** (places the user returns to deliberately, that have meaningful internal navigation and state).
- **Modal — meta** — modal dialog, no URL, mounted from the navigation header. Used for **preferences and auxiliary surfaces** that configure or describe the parent context without representing primary content.
- **Modal — in-flow picker** — modal dialog, no URL, mounted by a parent route's controls and bound to that parent's transient state (e.g., a date, a selected day). Returns a selection to the caller via callback. UI is intentionally narrow (selection-only, no destination affordances such as delete or edit).

A surface SHALL NOT exist as both a routed page AND a header-mounted modal that share the same content component, because feature drift between the two surfaces is otherwise inevitable. If both browse-and-manage and pick-in-flow are needed for the same content, the page covers the former and a separate narrow picker dialog covers the latter.

The Workout Library is the canonical case: the `/library` page is the destination; a narrow template picker dialog (mounted by the calendar's empty-day flow with a `date` prop) is the in-flow picker. URLs referenced in this requirement (e.g. `/library`, `/calendar`, `/chat`) are base-relative and resolve to deploy-prefixed URLs per the SPA router base alignment requirement above.

Examples in the SPA editor today (non-normative):

- Routed pages: Daily, Calendar, Library, Nutrition, Workout (new and edit), Chat, Athlete, Settings and its sections.
- Meta modals: none in the shell. Settings became a routed page; Help was retired in favour of the command palette, the shortcut sheet and the docs site; Profile became the `/athlete` page.
- In-flow picker dialogs: the calendar's empty-day "Add from Library" picker.

A header dropdown (the account menu, a parent destination's submenu, the
overflow menu) is NOT a meta modal: it navigates rather than presenting a
surface, so the URL changes and no content mounts over the current route.

When a routed-page surface is reached, focus SHALL move deterministically to the page's primary heading on mount so keyboard and screen-reader users land in a predictable location, restoring the focus-management equity that the deleted header modal provided via Radix Dialog. The primary heading is the page's `<h1>` element marked with the route-heading attribute (`[data-route-heading]`); the attribute — not the element tag — is the contract. The element MUST be focusable via `tabIndex={-1}` and MUST suppress the default focus ring for non-keyboard activations (CSS `:focus:not(:focus-visible)`) so route-driven focus moves are silent visually but remain announced by assistive technology.

A live-announcer region in the SPA shell SHALL announce route changes to assistive technology with a human-readable label. The region SHALL use `aria-live="polite"` so navigation announcements do not interrupt other content, and `aria-atomic="true"` so each label change is read as a single unit (not diffed). Pure query-string changes that do not change the pathname SHALL NOT re-announce.

A CI guard script SHALL enforce the no-dual-mount invariant by allowlisting which files may import the Library content component, so a future PR cannot silently restore a header-summoned Library modal. The allowlist is maintained in the guard script and SHALL include only the page surface and the in-flow picker dialog.

#### Scenario: Library is classified as a routed page

- **WHEN** the user clicks the "Library" button in the desktop or mobile navigation header
- **THEN** the SPA SHALL navigate to the base-relative URL `/library`, the page surface SHALL render, focus SHALL land on the page's `[data-route-heading]` element, and no modal dialog SHALL mount as a result of the click

#### Scenario: Chat is classified as a routed page

- **WHEN** the user activates the Chat entry in the navigation
- **THEN** the SPA SHALL navigate to the base-relative URL `/chat`, the chat page SHALL render, focus SHALL land on the page's `[data-route-heading]` element, and no modal dialog SHALL mount as a result of the activation

#### Scenario: Settings and Profile are classified as routed pages

- **WHEN** the user opens the header's account menu and activates Settings, or activates the Athlete entry in the navigation bar
- **THEN** the SPA SHALL navigate to a base-relative URL (`/settings` and `/athlete` respectively), the page surface SHALL render, focus SHALL land on the page's `[data-route-heading]` element, and no modal dialog SHALL mount over the previous route. Neither surface has a modal twin: a settings section is reached by its own URL segment, so it is bookmarkable and linkable — which is what let the three connection surfaces be collapsed into one linkable section rather than into a modal nobody could link to. The account menu is the chrome that reaches Settings, not a surface of its own

#### Scenario: Calendar in-flow template selection uses a narrow picker dialog

- **WHEN** the user opens the calendar's empty-day "Add from Library" flow
- **THEN** the SPA SHALL open the template picker dialog with the cell's date supplied as a prop, the dialog's accessible name SHALL include the human-readable date (e.g. "Pick a template for Monday, May 4"), the dialog SHALL show a search-only template list (no delete or edit affordances), the URL SHALL NOT navigate away from the calendar route, and on selection the picker SHALL schedule the chosen template for that exact date — without showing any additional date-confirmation dialog — then close itself

#### Scenario: Browser back button closes an open in-flow picker without losing the parent route

- **WHEN** the user is on a routed page (e.g. `/calendar/2026-W18`) with an in-flow picker dialog open and presses the browser back button (or the equivalent gesture on touch devices)
- **THEN** the picker SHALL close, the parent route SHALL remain mounted, and the URL SHALL NOT change away from the parent route. The parent route's history entry SHALL not be popped by the picker close

#### Scenario: No SPA surface mounts as both a routed page and a header-mounted modal

- **WHEN** the user clicks the header "Library" control on desktop or mobile
- **THEN** no modal dialog SHALL mount; the action SHALL navigate to the routed page only. Mechanically, a CI guard script SHALL fail the build if the Library content component is imported anywhere outside the page surface and the in-flow picker dialog allowlist

#### Scenario: Route change announces a single label

- **WHEN** the wouter pathname changes (e.g., user navigates from `/calendar` to `/library`)
- **THEN** the SPA shell's `aria-live="polite"` `aria-atomic="true"` region SHALL update once with a human-readable label of the new route ("Library page", "Daily page", "Calendar page", "New workout", "Edit workout", "Chat page") so assistive technology announces the navigation as a single unit

#### Scenario: Route change moves focus to the page heading

- **WHEN** the wouter pathname changes
- **THEN** focus SHALL move to the new page's `[data-route-heading]` element on mount, and the focus ring SHALL NOT be visually rendered when the navigation was triggered by a non-keyboard activation (CSS `:focus:not(:focus-visible)` rule)

#### Scenario: Pure query-string changes do not re-announce

- **WHEN** the URL changes only its query string (e.g. `?filter=running`) without changing the pathname
- **THEN** the announcer label SHALL NOT change and focus SHALL NOT move; assistive technology SHALL receive no announcement about the change

#### Scenario: Initial mount announces the current route

- **WHEN** the SPA loads for the first time at any route (including a deep-linked `/library` or `/workout/:id`)
- **THEN** the announcer region SHALL emit one announcement matching the loaded route's label, so assistive technology hears the page identity on first load. The page heading text and the announcer label SHOULD be sufficiently distinct (e.g. heading "Library", announcer "Library page") to avoid duplicate reads

### Requirement: Wellness trends hub is reachable from the header without a primary tab

The SPA header SHALL expose a **trends** entry, derived from the navigation
registry and styled as a header entry — NOT a primary navigation tab — that
navigates to the `/health` route. Because the lab analytics route is a child of
the same `/health` section, the trends entry SHALL be a dropdown listing the
trends hub and the lab analytics route, so the two read as parent and child
rather than as siblings; at widths where the primary row cannot hold the entry,
both SHALL appear in the overflow menu instead.

The `/health` route SHALL render a **wellness trends hub**: a cross-metric view that lets the user select one or more metrics and a date range and renders the selected metrics as **one single uPlot canvas** (`TrendSingleChartCard`) with one X (time) axis at the bottom and one Y axis per selected metric in its native unit, packed on the right edge of the canvas. As the user toggles metrics ON, lines accumulate on the same canvas. It SHALL remain a routed page (heading focus, single announcer label) and read persisted data via the existing range live hooks.

The metric selector (toggle pills) and the date-range selector (30 / 90 / 365 days) SHALL be unchanged from the prior grid layout. All series SHALL share a uniform stroke (`#2563eb`); line discrimination is by axis label and legend label, NOT color. Live values at the cursor position SHALL be shown via uPlot's built-in `legend.live: true` rendered below the canvas. The mobile layout (≤ 375 px width) MAY be cramped at N=4 metrics; users accept this in exchange for native-unit preservation. The hub SHALL NOT support drag-to-reorder; the axis/line order is canonical (sleep → hrv → weight → steps). The hub SHALL NOT use multi-instance `uPlot.sync`; cursor and zoom are intrinsic to the single uPlot instance. While at least one selected metric is loading AND no selected metric has produced any points yet, the hub SHALL render a `"Loading…"` placeholder instead of an empty canvas or the empty-state literal. When a selected metric has zero data in the chosen range, its Y axis and series SHALL be omitted from the canvas while the metric remains highlighted in the selector and the canvas continues to render the other selected metrics.

#### Scenario: Header entry opens the trends hub

- **WHEN** the user activates the header trends entry from any route and selects the trends destination from the menu it opens
- **THEN** the SPA navigates to `/health`, the trends hub renders with metric and date-range selectors, focus lands on its `[data-route-heading]`, and no primary navigation tab bar is present

#### Scenario: Lab analytics is reached through the trends entry

- **WHEN** the user activates the header trends entry and selects the lab analytics destination
- **THEN** the SPA navigates to `/health/labs`, and the lab entry page renders

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
